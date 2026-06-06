export default function GapsTab({ gaps = [] }) {
  if (!gaps.length) {
    return <p className="text-slate-400">No research gaps identified.</p>;
  }

  return (
    <div className="space-y-4">
      {gaps.map((g, i) => (
        <div key={g.id} className="glass-card border-l-4 border-l-purple-accent p-5">
          <span className="text-xs font-medium uppercase text-purple-accent">
            Gap {i + 1} · {g.type || 'general'}
          </span>
          <h3 className="mt-1 text-lg font-semibold text-white">{g.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{g.description}</p>
        </div>
      ))}
    </div>
  );
}
