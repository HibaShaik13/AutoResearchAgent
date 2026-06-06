import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Loader2,
  ArrowLeft,
  Bot,
  User,
  Microscope,
  Sparkles,
  Brain,
  FileText,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { sendChatMessage } from '../api/backend';
import { useResearch } from '../context/ResearchContext';

const SUGGESTIONS = [
  { icon: Brain, text: 'What are the top research gaps found?' },
  { icon: Lightbulb, text: 'Summarize the key hypotheses generated.' },
  { icon: AlertTriangle, text: 'What contradictions were found in the papers?' },
  { icon: FileText, text: 'Give me a brief literature review summary.' },
];

export default function ChatPage() {
  const navigate = useNavigate();
  const { results, topic } = useResearch();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: topic
        ? `Hello! I've analysed your research on **"${topic}"** — ${results?.papers?.length ?? 0} papers, ${results?.gaps?.length ?? 0} gaps, ${results?.hypotheses?.length ?? 0} hypotheses. Ask me anything!`
        : 'Hi! Run a research analysis first, then come back and I can answer questions about your results.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const reply = await sendChatMessage(msg, {
        topic,
        papers: results?.papers,
        gaps: results?.gaps,
        hypotheses: results?.hypotheses,
        contradictions: results?.contradictions,
      });
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `⚠️ Could not reach chatbot API: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#050b18]">
      {/* ── Top bar ── */}
      <header className="flex items-center gap-4 border-b border-cyan-accent/15 bg-[#07101f]/90 px-5 py-3.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/25 to-purple-accent/25 shadow-[0_0_18px_rgba(0,245,255,0.25)]">
            <Bot className="h-5 w-5 text-cyan-accent" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#07101f]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Research Assistant</p>
            <p className="text-xs text-slate-500">Powered by Groq · Always available</p>
          </div>
        </div>

        {topic && (
          <div className="ml-auto hidden items-center gap-2 rounded-full border border-cyan-accent/20 bg-cyan-accent/5 px-4 py-1.5 text-xs text-cyan-accent sm:flex">
            <Microscope className="h-3.5 w-3.5" />
            {topic}
          </div>
        )}
      </header>

      {/* ── Message area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-24 xl:px-48">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Context pills when results exist */}
          {results && (
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: `${results.papers?.length ?? 0} Papers`, color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
                { label: `${results.gaps?.length ?? 0} Gaps`, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
                { label: `${results.hypotheses?.length ?? 0} Hypotheses`, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
                { label: `${results.contradictions?.length ?? 0} Contradictions`, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
              ].map((p) => (
                <span key={p.label} className={`rounded-full border px-3 py-1 font-medium ${p.color}`}>
                  {p.label}
                </span>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  msg.role === 'user'
                    ? 'bg-cyan-accent/20'
                    : 'bg-gradient-to-br from-cyan-accent/20 to-purple-accent/20 shadow-[0_0_12px_rgba(0,245,255,0.2)]'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="h-4 w-4 text-cyan-accent" />
                ) : (
                  <Bot className="h-4 w-4 text-cyan-accent" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-tr-sm bg-cyan-accent/15 text-cyan-100 ring-1 ring-cyan-accent/20'
                    : 'rounded-tl-sm bg-slate-800/70 text-slate-200 ring-1 ring-slate-700/50'
                }`}
              >
                {/* Render simple markdown-ish bold */}
                {msg.text.split(/(\*\*[^*]+\*\*)/).map((part, pi) =>
                  part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={pi} className="font-semibold text-white">
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <span key={pi}>{part}</span>
                  )
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-accent/20 to-purple-accent/20">
                <Bot className="h-4 w-4 text-cyan-accent" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-slate-800/70 px-4 py-3 ring-1 ring-slate-700/50">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 rounded-full bg-cyan-accent/60 animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Suggestions (shown only at start) ── */}
      {messages.length === 1 && !loading && (
        <div className="border-t border-slate-800/60 px-4 py-4 md:px-8 lg:px-24 xl:px-48">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> Quick questions
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => send(text)}
                  disabled={loading}
                  className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-cyan-accent/30 hover:bg-slate-800/70 hover:text-white disabled:opacity-50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-cyan-accent/70" />
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="border-t border-slate-800/80 bg-[#07101f]/80 px-4 py-4 backdrop-blur-md md:px-8 lg:px-24 xl:px-48">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-3">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
            }}
            onKeyDown={handleKey}
            placeholder="Ask anything about your research…"
            className="flex-1 resize-none rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-accent/50 focus:ring-1 focus:ring-cyan-accent/20"
            style={{ minHeight: '48px', maxHeight: '160px' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent to-purple-accent text-deep shadow-[0_0_16px_rgba(0,245,255,0.3)] transition hover:scale-105 hover:shadow-[0_0_24px_rgba(0,245,255,0.45)] disabled:opacity-40 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-slate-600">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
