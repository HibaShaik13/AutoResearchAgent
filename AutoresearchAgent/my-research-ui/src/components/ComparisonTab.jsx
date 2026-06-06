import { useState, useMemo } from 'react';
import { GitCompare } from 'lucide-react';

function rowsForPaper(paper) {
  return [
    { label: 'Title', value: paper.title },
    { label: 'Authors', value: paper.authors },
    { label: 'Year', value: paper.year },
    { label: 'Citations', value: paper.citations ?? '—' },
    { label: 'Source', value: paper.source },
    { label: 'Key findings', value: paper.findings || paper.summary?.slice(0, 300) || '—' },
    { label: 'Methodology', value: paper.methodology || '—' },
    { label: 'Results', value: paper.results || '—' },
  ];
}

export default function ComparisonTab({ papers = [], contradictions = [] }) {
  const [leftId, setLeftId] = useState(papers[0]?.id || '');
  const [rightId, setRightId] = useState(papers[1]?.id || '');

  const left = papers.find((p) => p.id === leftId);
  const right = papers.find((p) => p.id === rightId);

  const conflictingRows = useMemo(() => {
    if (!left || !right) return new Set();
    const set = new Set();
    const related = contradictions.filter(
      (c) =>
        (c.paper1 && left.title.includes(c.paper1.slice(0, 20))) ||
        (c.paper2 && right.title.includes(c.paper2.slice(0, 20))) ||
        c.paper1?.includes(left.title.slice(0, 20)) ||
        c.paper2?.includes(right.title.slice(0, 20))
    );
    if (related.length) {
      set.add('Key findings');
      set.add('Results');
      set.add('Methodology');
    }
    if (left.methodology !== right.methodology && left.methodology !== '—') {
      set.add('Methodology');
    }
    return set;
  }, [left, right, contradictions]);

  if (papers.length < 2) {
    return (
      <p className="text-slate-400">Need at least 2 papers to compare. Run an analysis first.</p>
    );
  }

  const leftRows = left ? rowsForPaper(left) : [];
  const rightRows = right ? rowsForPaper(right) : [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-cyan-accent">
        <GitCompare className="h-5 w-5" />
        <h3 className="font-display text-lg font-bold text-white">Paper Comparison</h3>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <select
          value={leftId}
          onChange={(e) => setLeftId(e.target.value)}
          className="rounded-lg border border-cyan-accent/30 bg-card px-3 py-2 text-sm text-white"
        >
          {papers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title.slice(0, 60)}
            </option>
          ))}
        </select>
        <select
          value={rightId}
          onChange={(e) => setRightId(e.target.value)}
          className="rounded-lg border border-purple-accent/30 bg-card px-3 py-2 text-sm text-white"
        >
          {papers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title.slice(0, 60)}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-3 text-left text-slate-400">Field</th>
              <th className="p-3 text-left text-cyan-accent">Paper A</th>
              <th className="p-3 text-left text-purple-accent">Paper B</th>
            </tr>
          </thead>
          <tbody>
            {leftRows.map((row, i) => {
              const isConflict = conflictingRows.has(row.label);
              const rightVal = rightRows[i]?.value;
              return (
                <tr
                  key={row.label}
                  className={`border-b border-slate-800 ${
                    isConflict ? 'bg-red-950/40' : ''
                  }`}
                >
                  <td className="p-3 font-medium text-slate-400">{row.label}</td>
                  <td
                    className={`p-3 align-top ${
                      isConflict ? 'text-red-300 font-medium' : 'text-slate-200'
                    }`}
                  >
                    {row.value}
                  </td>
                  <td
                    className={`p-3 align-top ${
                      isConflict ? 'text-red-300 font-medium' : 'text-slate-200'
                    }`}
                  >
                    {rightVal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {contradictions.length > 0 && (
        <div className="mt-6 rounded-lg border border-red-500/40 bg-red-950/30 p-4">
          <p className="mb-2 text-sm font-semibold text-red-400">
            Related contradictions (highlighted in red above)
          </p>
          <ul className="space-y-2 text-sm text-red-200">
            {contradictions.slice(0, 3).map((c) => (
              <li key={c.id}>
                {c.statement1} ↔ {c.statement2}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
