import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function TrendsTab({ trends, papers = [] }) {
  const yearly =
    trends?.yearly_counts?.length > 0
      ? trends.yearly_counts
      : buildYearCounts(papers);

  return (
    <div className="space-y-6">
      {trends?.current_trend && (
        <div className="glass-card p-6">
          <h3 className="mb-2 font-semibold text-cyan-accent">Current trend</h3>
          <p className="text-slate-300">{trends.current_trend}</p>
        </div>
      )}

      {yearly.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="mb-4 font-semibold text-white">Publications by year</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearly}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid rgba(0,245,255,0.3)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#00f5ff"
                  strokeWidth={2}
                  dot={{ fill: '#bf5fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {trends?.predictions?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="mb-3 font-semibold text-purple-accent">Predictions</h3>
          <ul className="list-inside list-disc space-y-2 text-slate-300">
            {(Array.isArray(trends.predictions)
              ? trends.predictions
              : [trends.predictions]
            ).map((p, i) => (
              <li key={i}>{typeof p === 'string' ? p : p.text || JSON.stringify(p)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function buildYearCounts(papers) {
  const map = {};
  papers.forEach((p) => {
    const y = String(p.year || '').slice(0, 4);
    if (y && y !== '—') map[y] = (map[y] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year, count }));
}
