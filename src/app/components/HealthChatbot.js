"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Search,
  Bot,
  User,
  Loader2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

const QUICK_QUESTIONS = [
  "What does blood pressure 140/90 mean?",
  "Is 5.4 mmol/L blood glucose normal?",
  "What are Metformin side effects?",
  "Normal heart rate range for adults?",
  "What is HbA1c and what's a healthy level?",
];

function formatMessage(text) {
  // Convert **bold** to <strong>, bullet points, and line breaks
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul class='list-disc pl-4 space-y-1'>$1</ul>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

export default function HealthChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm your **Sanomed Health Assistant**.\n\nAsk me anything about medications, symptoms, vitals, lab results, or general wellness. I'm here to help you understand your health better!\n\nAlways consult your doctor for personalized medical advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [invalidKey, setInvalidKey] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function buildGoogleSearchUrl(query) {
    return `https://www.google.com/search?q=${encodeURIComponent(query + " health medical")}`;
  }

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history }),
      });

      const data = await res.json();

      if (data.error === "invalid_key") {
        setInvalidKey(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ **API Key Issue**: The Gemini API key in your `.env.local` appears to be invalid.\n\nPlease get a valid key from **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)** — it should start with `AIzaSy...`",
            isError: true,
          },
        ]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ Something went wrong. Please try again.",
            isError: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, query: userText },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Could not connect. Make sure your app server is running.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-5 z-50 w-14 h-14 rounded-full shadow-xl shadow-sky-600/30 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, #0EA5E9, #6366F1)"
            : "linear-gradient(135deg, #0284C7, #1D4ED8)",
        }}
        aria-label="Open Health Assistant"
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute w-14 h-14 rounded-full border-2 border-sky-400 animate-ping opacity-30" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-[92vw] max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-slideUp"
          style={{ height: "min(540px, 75vh)" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Sanomed Assistant</h3>
                <p className="text-[10px] text-sky-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Clinical AI Engine
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <ChevronDown size={20} className="text-white/80 hover:text-white" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 scroll-smooth">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={13} className="text-sky-600" />
                  </div>
                )}

                <div className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-sky-600 text-white rounded-br-sm"
                        : msg.isError
                        ? "bg-rose-50 border border-rose-200 text-rose-900 rounded-bl-sm"
                        : "bg-slate-100 text-slate-900 rounded-bl-sm"
                    }`}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />

                  {/* Google Search button for assistant replies */}
                  {msg.role === "assistant" && !msg.isError && msg.query && (
                    <a
                      href={buildGoogleSearchUrl(msg.query)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-sky-700 transition-colors px-2 py-1 rounded-lg hover:bg-sky-50 border border-transparent hover:border-sky-100"
                    >
                      <Search size={11} />
                      Search on Google
                      <ExternalLink size={9} />
                    </a>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-xl bg-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={13} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <Bot size={13} className="text-sky-600" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips */}
          {messages.length <= 1 && (
            <div className="px-3.5 pb-2 shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles size={10} /> Quick Questions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full hover:bg-sky-100 transition-colors active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="px-3 pb-3 pt-2 border-t border-slate-100 shrink-0">
            <div className="flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about medications, symptoms, vitals..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 resize-none outline-none max-h-20 leading-relaxed"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                {input.trim() && (
                  <a
                    href={buildGoogleSearchUrl(input.trim())}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                    title="Search Google instead"
                  >
                    <Search size={15} />
                  </a>
                )}
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="w-8 h-8 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95"
                >
                  {loading ? (
                    <Loader2 size={14} className="text-white animate-spin" />
                  ) : (
                    <Send size={14} className="text-white" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-[9px] text-center text-slate-300 mt-1.5 font-medium">
              AI responses are for informational purposes only • Not medical advice
            </p>
          </div>
        </div>
      )}
    </>
  );
}
