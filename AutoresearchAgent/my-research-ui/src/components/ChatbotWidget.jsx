import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export default function ChatbotWidget() {
  const navigate = useNavigate();

  const button = (
    <button
      type="button"
      onClick={() => navigate('/chat')}
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent pl-4 pr-5 py-3 text-deep shadow-[0_0_24px_rgba(0,245,255,0.45)] transition hover:scale-105 hover:shadow-[0_0_36px_rgba(0,245,255,0.6)]"
      aria-label="Open research chatbot"
    >
      <MessageCircle className="h-6 w-6 shrink-0" />
      <span className="text-sm font-bold">Ask AI</span>
    </button>
  );

  return createPortal(button, document.body);
}
