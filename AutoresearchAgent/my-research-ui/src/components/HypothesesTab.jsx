import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function HypothesesTab({ hypotheses = [] }) {
  if (!hypotheses.length) {
    return <p className="text-slate-400">No hypotheses generated.</p>;
  }

  return (
    <div className="space-y-6">
      {hypotheses.map((h) => {
        const scores = h.scores || {};
        const chartData = [
          { name: 'Novelty', value: scores.novelty ?? 7 },
          { name: 'Feasibility', value: scores.feasibility ?? 7 },
          { name: 'Impact', value: scores.impact ?? 7 },
        ];
        return (
          <div key={h.id} className="glass-card p-5">
            <h3 className="mb-2 text-lg font-semibold text-white">{h.title}</h3>
            <p className="mb-4 text-sm text-slate-300">{h.description}</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" domain={[0, 10]} stroke="#64748b" />
                  <YAxis type="category" dataKey="name" width={80} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid rgba(0,245,255,0.3)',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={['#00f5ff', '#bf5fff', '#ff2d8d'][i]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
