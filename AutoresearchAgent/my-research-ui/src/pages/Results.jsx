import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import PapersTab from '../components/PapersTab';
import GapsTab from '../components/GapsTab';
import HypothesesTab from '../components/HypothesesTab';
import ContradictionsTab from '../components/ContradictionsTab';
import TrendsTab from '../components/TrendsTab';
import LiteratureReviewTab from '../components/LiteratureReviewTab';
import GraphVisualization from '../components/GraphVisualization';
import ReportGenerator from '../components/ReportGenerator';
import ComparisonTab from '../components/ComparisonTab';
import PublishRoadmap from '../components/PublishRoadmap';
import { Loader2 } from 'lucide-react';

const tabs = [
  { path: 'papers', label: 'Papers' },
  { path: 'gaps', label: 'Gaps' },
  { path: 'hypotheses', label: 'Hypotheses' },
  { path: 'contradictions', label: 'Contradictions' },
  { path: 'trends', label: 'Trends' },
  { path: 'review', label: 'Review' },
  { path: 'graph', label: 'Graph' },
  { path: 'report', label: 'Report' },
  { path: 'roadmap', label: 'Roadmap' },
  { path: 'compare', label: 'Compare' },
];

export default function Results() {
  const { results, loading, topic } = useResearch();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-accent" />
        <p className="text-slate-400">Running 8-agent pipeline…</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg text-slate-400">No results yet. Start an analysis from Home.</p>
        <NavLink to="/" className="btn-primary">
          Go to Home
        </NavLink>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-white">
          Results: <span className="text-cyan-accent">{topic}</span>
        </h2>
        <p className="text-sm text-slate-400">
          {results.papers?.length || 0} papers · {results.gaps?.length || 0} gaps ·{' '}
          {results.hypotheses?.length || 0} hypotheses
        </p>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-700 pb-px lg:hidden">
        {tabs.map((t) => (
          <NavLink
            key={t.path}
            to={`/results/${t.path}`}
            className={({ isActive }) =>
              `shrink-0 rounded-t-lg px-3 py-2 text-xs font-medium ${
                isActive || location.pathname.endsWith(t.path)
                  ? 'tab-active'
                  : 'text-slate-500'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<Navigate to="papers" replace />} />
        <Route path="papers" element={<PapersTab papers={results.papers} />} />
        <Route path="gaps" element={<GapsTab gaps={results.gaps} />} />
        <Route path="hypotheses" element={<HypothesesTab hypotheses={results.hypotheses} />} />
        <Route
          path="contradictions"
          element={<ContradictionsTab contradictions={results.contradictions} />}
        />
        <Route path="trends" element={<TrendsTab trends={results.trends} papers={results.papers} />} />
        <Route path="review" element={<LiteratureReviewTab content={results.literatureReview} />} />
        <Route
          path="graph"
          element={
            <GraphVisualization
              nodes={results.graph_nodes?.length ? results.graph_nodes : undefined}
              edges={results.graph_edges?.length ? results.graph_edges : undefined}
              papers={results.papers}
              gaps={results.gaps}
            />
          }
        />
        <Route
          path="report"
          element={<ReportGenerator results={results} topic={topic} />}
        />
        <Route
          path="roadmap"
          element={
            <PublishRoadmap
              gaps={results.gaps}
              hypotheses={results.hypotheses}
              contradictions={results.contradictions}
              papers={results.papers}
              trends={results.trends}
              literatureReview={results.literatureReview}
            />
          }
        />
        <Route
          path="compare"
          element={
            <ComparisonTab
              papers={results.papers}
              contradictions={results.contradictions}
            />
          }
        />
        <Route path="*" element={<Navigate to="papers" replace />} />
      </Routes>
    </div>
  );
}
