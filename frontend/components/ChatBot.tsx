"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, BotIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatBot({ jobs }: { jobs: any[] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your job application assistant 👋 Ask me anything about resumes, cover letters, or interview prep!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history,
          job_context: `Here is the user's job application data:
                        Total: ${jobs.length}
                        Applied: ${jobs.filter((j) => j.apply_status === "Applied").length}
                        Interviewing: ${jobs.filter((j) => j.apply_status === "Interviewing").length}
                        Ghosted: ${jobs.filter((j) => j.apply_status === "Ghosted").length}
                        Rejected: ${jobs.filter((j) => j.apply_status === "Rejected").length}

                        Applications list:
                        ${jobs.map((j) => `- ${j.company_name} | ${j.job_title} | ${j.job_contract} | ${j.job_type} | ${j.apply_status} | Applied: ${j.date_apply} | Updated: ${j.date_update} | Address: ${j.company_address}`).join("\n")}`,
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I could not connect to the server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Window */}
      {open && (
        <div className="w-80 h-[450px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BotIcon size={25} color="white" />
              <div>
                <p className="text-white text-sm font-semibold">
                  Job Assistant
                </p>
                <p className="text-indigo-200 text-xs">Ask me anything!</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-indigo-200 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-scroll px-4 py-3 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {" "}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] text-xs rounded-2xl px-3 py-2 leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-slate-800 text-slate-200 rounded-bl-sm"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-1 last:mb-0">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-white font-semibold">
                          {children}
                        </strong>
                      ),
                      li: ({ children }) => (
                        <li className="ml-4 list-disc">{children}</li>
                      ),
                      ol: ({ children }) => (
                        <ol className="ml-4 list-decimal flex flex-col gap-0.5">
                          {children}
                        </ol>
                      ),
                      ul: ({ children }) => (
                        <ul className="ml-4 list-disc flex flex-col gap-0.5">
                          {children}
                        </ul>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 text-xs rounded-2xl rounded-bl-sm px-3 py-2">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-800 flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 resize-none max-h-32 overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs px-3 py-2 rounded-xl transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-colors flex items-center justify-center text-2xl"
      >
        {open ? <X size={20} /> : <BotIcon size={25} />}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-30" />
        )}
      </button>
    </div>
  );
}
