import { useState } from 'react';
import { CheckCircle2, Circle, Search, FlaskConical, Zap, FileText } from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────── */

/** Shorten long strings to a readable badge length */
const short = (str, max = 72) =>
  str && str.length > max ? str.slice(0, max - 1).trimEnd() + '…' : str || '';

/** Pick a colour badge for gap type */
const gapTypeColor = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('method')) return 'text-amber-400 bg-amber-400/10';
  if (t.includes('data')) return 'text-sky-400 bg-sky-400/10';
  if (t.includes('theory')) return 'text-purple-400 bg-purple-400/10';
  return 'text-cyan-accent bg-cyan-accent/10';
};

/* ─── dynamic phase builder ────────────────────────────────────── */

function buildPhases({ gaps, hypotheses, contradictions, papers, trends, literatureReview }) {
  /* ── Phase 1 : Identify & Prioritize Gaps ── */
  const gapTasks = [];
  if (papers?.length) {
    gapTasks.push(
      `Extraction Agent scanned ${papers.length} paper${papers.length !== 1 ? 's' : ''} to surface key findings & methodologies`
    );
  }
  if (gaps?.length) {
    gapTasks.push(
      `Gap Agent identified ${gaps.length} research gap${gaps.length !== 1 ? 's' : ''}: prioritize "${short(gaps[0]?.title, 60)}"`
    );
    if (gaps.length > 1)
      gapTasks.push(`Runner-up gap: "${short(gaps[1]?.title, 60)}"`);
  } else {
    gapTasks.push('Gap Agent: no structured gaps returned — review raw output in Gaps tab');
  }
  gapTasks.push('Select the highest-impact gap and lock in your research scope');

  /* ── Phase 2 : Test Hypothesis ── */
  const hypTasks = [];
  if (hypotheses?.length) {
    const top = hypotheses[0];
    const scores = top?.scores || {};
    hypTasks.push(
      `Hypothesis Agent generated ${hypotheses.length} hypothesis${hypotheses.length !== 1 ? 'es' : ''}`
    );
    hypTasks.push(
      `Top hypothesis: "${short(top?.title, 60)}"` +
      (scores.novelty != null
        ? ` (Novelty ${scores.novelty}/10 · Feasibility ${scores.feasibility}/10 · Impact ${scores.impact}/10)`
        : '')
    );
    if (hypotheses.length > 1)
      hypTasks.push(`Also test: "${short(hypotheses[1]?.title, 55)}"`);
  } else {
    hypTasks.push('Hypothesis Agent: no hypotheses generated yet');
  }
  if (trends?.current_trend) {
    hypTasks.push(
      `Trends Agent noted: ${short(trends.current_trend, 80)} — align experiment with this momentum`
    );
  }
  hypTasks.push('Design experiment, collect data, and validate the top hypothesis');

  /* ── Phase 3 : Resolve Contradictions ── */
  const conTasks = [];
  if (contradictions?.length) {
    conTasks.push(
      `Contradiction Agent flagged ${contradictions.length} conflicting claim${contradictions.length !== 1 ? 's' : ''} across the corpus`
    );
    const c0 = contradictions[0];
    if (c0?.statement1 && c0?.statement2) {
      conTasks.push(
        `Key conflict: "${short(c0.statement1, 55)}" vs "${short(c0.statement2, 55)}"`
      );
    }
    if (c0?.analysis) {
      conTasks.push(`Agent analysis: ${short(c0.analysis, 80)}`);
    }
    conTasks.push('Reconcile each conflict or explicitly document the tension in your paper');
  } else {
    conTasks.push('Contradiction Agent: no contradictions found — literature may be cohesive');
    conTasks.push('Verify manually by cross-reading top-cited papers in the Comparison tab');
  }

  /* ── Phase 4 : Write & Submit Paper ── */
  const writeTasks = [];
  if (literatureReview && literatureReview.length > 50) {
    const wordCount = literatureReview.trim().split(/\s+/).length;
    writeTasks.push(
      `Review Agent produced a ~${wordCount}-word literature review — use as your paper's foundation`
    );
  } else {
    writeTasks.push('Review Agent: draft literature review available in the Review tab');
  }
  if (trends?.predictions?.length) {
    writeTasks.push(
      `Trend Agent predictions to cite: ${short(
        Array.isArray(trends.predictions) ? trends.predictions[0] : trends.predictions,
        70
      )}`
    );
  }
  if (papers?.length) {
    const cited = papers.slice(0, 3).map((p) => short(p.title, 40)).join('; ');
    writeTasks.push(`Reference key papers: ${cited}${papers.length > 3 ? ` + ${papers.length - 3} more` : ''}`);
  }
  writeTasks.push('Run internal review, address all contradictions, then submit to target venue');

  return [
    {
      id: 'gap',
      icon: Search,
      title: 'Identify & Prioritize Gaps',
      duration: '1–2 weeks',
      agentBadge: 'Gap Agent + Extraction Agent',
      tasks: gapTasks,
      highlight: gaps?.[0]?.title
        ? { label: 'Top gap', value: short(gaps[0].title, 70), type: gaps[0].type }
        : null,
    },
    {
      id: 'hypothesis',
      icon: FlaskConical,
      title: 'Test Hypothesis',
      duration: '2–4 weeks',
      agentBadge: 'Hypothesis Agent + Trends Agent',
      tasks: hypTasks,
      highlight: hypotheses?.[0]?.title
        ? { label: 'Test first', value: short(hypotheses[0].title, 70) }
        : null,
    },
    {
      id: 'contradiction',
      icon: Zap,
      title: 'Resolve Contradictions',
      duration: '1–2 weeks',
      agentBadge: 'Contradiction Agent',
      tasks: conTasks,
      highlight:
        contradictions?.length > 0
          ? { label: 'Conflicts', value: `${contradictions.length} to resolve` }
          : null,
    },
    {
      id: 'write',
      icon: FileText,
      title: 'Write & Submit Paper',
      duration: '3–6 weeks',
      agentBadge: 'Review Agent + Trends Agent',
      tasks: writeTasks,
      highlight:
        papers?.length > 0
          ? { label: 'Source pool', value: `${papers.length} papers indexed` }
          : null,
    },
  ];
}

/* ─── component ────────────────────────────────────────────────── */

export default function PublishRoadmap({
  gaps = [],
  hypotheses = [],
  contradictions = [],
  papers = [],
  trends = {},
  literatureReview = '',
}) {
  const [completed, setCompleted] = useState([]);

  const phases = buildPhases({ gaps, hypotheses, contradictions, papers, trends, literatureReview });
  const progress = Math.round((completed.length / phases.length) * 100);

  const toggle = (id) =>
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const topGap = gaps[0];
  const totalWeeks = '7–14';

  return (
    <section className="glass-card p-6 lg:p-8">
      {/* Header */}
      <h3 className="mb-1 font-display text-xl font-bold text-white">Publish Roadmap</h3>
      <p className="mb-1 text-sm text-slate-400">
        Estimated total: <span className="text-white font-medium">{totalWeeks} weeks</span>
        {topGap && (
          <>
            {' '}· Focus first on:{' '}
            <span className="text-cyan-accent font-medium">{short(topGap.title, 55)}</span>
          </>
        )}
      </p>
      <p className="mb-6 text-xs text-slate-500">
        Generated from{' '}
        <span className="text-slate-300">{papers.length} papers</span>,{' '}
        <span className="text-slate-300">{gaps.length} gaps</span>,{' '}
        <span className="text-slate-300">{hypotheses.length} hypotheses</span>, and{' '}
        <span className="text-slate-300">{contradictions.length} contradictions</span> found by
        the agent pipeline.
      </p>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs text-slate-400">
          <span>Phase progress</span>
          <span>
            {completed.length}/{phases.length} done · {progress}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-accent to-purple-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Phases */}
      <div className="relative space-y-0">
        {phases.map((phase, i) => {
          const done = completed.includes(phase.id);
          const isLast = i === phases.length - 1;
          const Icon = phase.icon;

          return (
            <div key={phase.id} className="relative flex gap-4 pb-8">
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className="absolute left-[15px] top-9 h-full w-0.5 bg-gradient-to-b from-cyan-accent/40 to-purple-accent/20"
                  aria-hidden
                />
              )}

              {/* Circle toggle */}
              <button
                type="button"
                onClick={() => toggle(phase.id)}
                title={done ? 'Mark incomplete' : 'Mark complete'}
                className="relative z-10 shrink-0 mt-1 text-cyan-accent transition-transform hover:scale-110"
              >
                {done ? (
                  <CheckCircle2 className="h-8 w-8 text-cyan-accent drop-shadow-[0_0_6px_#00f5ff]" />
                ) : (
                  <Circle className="h-8 w-8 text-slate-600" />
                )}
              </button>

              {/* Phase card */}
              <div
                className={`flex-1 rounded-xl border p-4 transition-all duration-300 ${done
                  ? 'border-slate-700/40 bg-deep/30 opacity-60'
                  : 'border-slate-700/80 bg-deep/50 hover:border-slate-600/80'
                  }`}
              >
                {/* Title row */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${done ? 'text-slate-500' : 'text-cyan-accent'}`}
                    />
                    <h4
                      className={`font-semibold leading-tight ${done ? 'text-slate-500 line-through' : 'text-white'
                        }`}
                    >
                      {phase.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-400">
                      {phase.agentBadge}
                    </span>
                    <span className="rounded-full bg-purple-accent/20 px-3 py-0.5 text-xs text-purple-accent whitespace-nowrap">
                      {phase.duration}
                    </span>
                  </div>
                </div>

                {/* Highlight pill */}
                {phase.highlight && !done && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">{phase.highlight.label}:</span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${phase.highlight.type
                        ? gapTypeColor(phase.highlight.type)
                        : 'text-cyan-accent/90 bg-cyan-accent/10'
                        }`}
                    >
                      {phase.highlight.value}
                    </span>
                  </div>
                )}

                {/* Dynamic task list */}
                <ul className="mt-3 space-y-1.5">
                  {phase.tasks.map((t, ti) => (
                    <li key={ti} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-accent/60" />
                      <span className="leading-snug">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      <p className="text-xs text-slate-500">
        Pipeline complete · {papers.length} papers indexed ·{' '}
        {gaps.length} gaps · {hypotheses.length} hypotheses · {contradictions.length} contradiction
        {contradictions.length !== 1 ? 's' : ''} · Next: validate top gap with advisor, then run
        experiments.
      </p>
    </section>
  );
}
