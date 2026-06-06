import { AlertTriangle } from 'lucide-react';

export default function ContradictionsTab({ contradictions = [] }) {
  if (!contradictions.length) {
    return (
      <div className="glass-card p-8 text-center text-slate-400">
        No contradictions detected — papers appear consistent on this topic.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contradictions.map((c) => (
        <div
          key={c.id}
          className="glass-card border border-red-500/30 bg-red-950/20 p-5"
        >
          <div className="mb-3 flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Contradiction</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-red-500/10 p-3">
              <p className="text-xs text-red-300">{c.paper1}</p>
              <p className="mt-1 text-sm text-white">{c.statement1}</p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-3">
              <p className="text-xs text-red-300">{c.paper2}</p>
              <p className="mt-1 text-sm text-white">{c.statement2}</p>
            </div>
          </div>
          {c.analysis && (
            <p className="mt-3 text-sm text-slate-300">{c.analysis}</p>
          )}
        </div>
      ))}
    </div>
  );
}
