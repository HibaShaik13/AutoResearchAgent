import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useResearch } from '../context/ResearchContext';

export default function LiteratureReviewTab({ content: contentProp }) {
  const { results, refreshResults, topic } = useResearch();
  const [loading, setLoading] = useState(false);
  const content = contentProp || results?.literatureReview || '';

  useEffect(() => {
    if (!content && results?.papers?.length) {
      setLoading(true);
      refreshResults().finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="glass-card flex items-center justify-center gap-3 p-12 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-accent" />
        Loading literature review…
      </div>
    );
  }

  if (!content || !String(content).trim()) {
    return (
      <div className="glass-card p-8 text-center text-slate-400">
        <p className="mb-4">Literature review not loaded yet.</p>
        <button type="button" onClick={() => refreshResults()} className="btn-outline mx-auto">
          <RefreshCw className="h-4 w-4" /> Reload from server
        </button>
      </div>
    );
  }

  const text = String(content);
  const paragraphs = text.split(/\n\n+/).filter(Boolean);

  return (
    <article className="glass-card max-w-4xl p-8 prose-invert">
      <h3 className="mb-6 font-display text-xl font-bold text-white">
        Generated Literature Review
        {topic ? (
          <span className="mt-1 block text-sm font-normal text-cyan-accent">{topic}</span>
        ) : null}
      </h3>
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        {paragraphs.map((p, i) => (
          <p key={i}>{p.replace(/\*\*/g, '')}</p>
        ))}
      </div>
    </article>
  );
}
