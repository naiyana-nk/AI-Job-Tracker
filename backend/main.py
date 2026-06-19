from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
import httpx
import pdfplumber
import io
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

app = FastAPI()

# Set up the scheduler for auto-ghosting
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def start_scheduler():
    scheduler.add_job(run_auto_ghost, 'interval', hours=24)
    scheduler.start()

async def run_auto_ghost():
    try:
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
        cutoff = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        result = sb.table("applications")\
            .update({ "apply_status": "Ghosted", "date_update": datetime.now().strftime('%Y-%m-%d') })\
            .eq("apply_status", "Applied")\
            .lt("date_apply", cutoff)\
            .execute()
        print(f"Auto-ghost ran: {len(result.data)} application(s) marked as Ghosted.")
    except Exception as e:
        print(f"Auto-ghost error: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openrouter/owl-alpha"

class SummarizeRequest(BaseModel):
    text: str

@app.get("/")
def root():
    return {"status": "running"}

# AI Job Description Summarization Endpoint
@app.post("/summarize")
async def summarize(req: SummarizeRequest):
    prompt = fprompt = f"""Summarize this job description in 2 sentences max. Be very brief and direct.

Job Description:
{req.text}"""

    async with httpx.AsyncClient() as client:
        res = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        result = res.json()
        print("OpenRouter response:", result)
        if "choices" not in result:
            return {"summary": f"Error: {result}"}
        summary = result["choices"][0]["message"]["content"]
        return {"summary": summary}

# Resume Upload and Parsing Endpoint
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        text = ""
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        if not text.strip():
            return {"error": "Could not extract text from PDF. Make sure it's not a scanned image."}

        from supabase import create_client
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
        
        # Check if resume already exists
        existing = sb.table("resume").select("id").execute()
        if existing.data:
            sb.table("resume").update({"raw_text": text, "updated_at": "now()"}).eq("id", existing.data[0]["id"]).execute()
        else:
            sb.table("resume").insert({"raw_text": text}).execute()

        return {"text": text}
    except Exception as e:
        return {"error": str(e)}
 
# Resume Tailoring Endpoint   
class TailorRequest(BaseModel):
    job_id: str
    job_desc: str
    job_title: str
    company_name: str

@app.post("/tailor")
async def tailor_resume(req: TailorRequest):
    try:
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
        
        # Get base resume
        resume = sb.table("resume").select("raw_text").execute()
        if not resume.data:
            return {"error": "No base resume found. Please upload your resume first."}
        
        resume_text = resume.data[0]["raw_text"]

        # Tailor resume prompt
        tailor_prompt = f"""You are an expert resume writer. 
Here is my master resume and a target job description.
Rewrite my experience bullet points to naturally include the keywords from this job description.
Do not invent any new experience. Keep it honest and natural.
Output only the rewritten bullet points in clean markdown.

Master Resume:
{resume_text}

Job Title: {req.job_title}
Company: {req.company_name}
Job Description:
{req.job_desc}"""

        # Cover letter prompt
        cover_prompt = f"""Write a concise, professional cover letter for this job application.
Use the resume details provided. Keep it to 3 short paragraphs. Do not invent fake experience.

Resume:
{resume_text}

Job Title: {req.job_title}
Company: {req.company_name}
Job Description:
{req.job_desc}"""

        async with httpx.AsyncClient() as client:
            # Run both requests
            tailor_res = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": tailor_prompt}],
                },
                timeout=60,
            )
            cover_res = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": cover_prompt}],
                },
                timeout=60,
            )

        tailored_resume = tailor_res.json()["choices"][0]["message"]["content"]
        cover_letter = cover_res.json()["choices"][0]["message"]["content"]

        # Save to Supabase
        sb.table("applications").update({
            "tailored_resume": tailored_resume,
            "cover_letter": cover_letter,
            "date_update": "now()"
        }).eq("id", req.job_id).execute()

        return {"tailored_resume": tailored_resume, "cover_letter": cover_letter}

    except Exception as e:
        return {"error": str(e)}

# Auto-Ghosting Endpoint - Marks old "Applied" applications as "Ghosted" 
@app.post("/auto-ghost")
async def auto_ghost():
    try:
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
        
        from datetime import datetime, timedelta
        cutoff = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        result = sb.table("applications")\
            .update({ "apply_status": "Ghosted", "date_update": datetime.now().strftime('%Y-%m-%d') })\
            .eq("apply_status", "Applied")\
            .lt("date_apply", cutoff)\
            .execute()
        
        updated = len(result.data)
        return { "message": f"{updated} application(s) marked as Ghosted." }
    except Exception as e:
        return { "error": str(e) }
