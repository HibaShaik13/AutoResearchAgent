import { ExternalLink } from 'lucide-react';

export default function PapersTab({ papers = [] }) {
  if (!papers.length) {
    return <p className="text-slate-400">No papers discovered.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {papers.map((p) => (
        <article key={p.id} className="glass-card p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug text-white">{p.title}</h3>
            <span className="shrink-0 rounded bg-cyan-accent/20 px-2 py-0.5 text-xs text-cyan-accent">
              {p.source}
            </span>
          </div>
          <p className="mb-2 text-xs text-slate-400">
            {p.authors} · {p.year}
            {p.citations ? ` · ${p.citations} citations` : ''}
          </p>
          <p className="mb-3 line-clamp-4 text-sm text-slate-300">{p.abstract}</p>
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-cyan-accent hover:underline"
          >
            View paper <ExternalLink className="h-3 w-3" />
          </a>
        </article>
      ))}
    </div>
  );
}
