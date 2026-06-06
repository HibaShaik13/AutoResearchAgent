import { NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  Brain,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Network,
  FileBarChart,
  GitCompare,
  Map,
} from 'lucide-react';

const mainNav = [
  { to: '/', label: 'Home', icon: Home, end: true },
];

const resultNav = [
  { to: '/results/papers', label: 'Papers', icon: FileText },
  { to: '/results/gaps', label: 'Research Gaps', icon: Brain },
  { to: '/results/hypotheses', label: 'Hypotheses', icon: Lightbulb },
  { to: '/results/contradictions', label: 'Contradictions', icon: AlertTriangle },
  { to: '/results/trends', label: 'Trends', icon: TrendingUp },
  { to: '/results/review', label: 'Literature Review', icon: BookOpen },
  { to: '/results/graph', label: 'Graph Visualization', icon: Network },
  { to: '/results/report', label: 'Report', icon: FileBarChart },
  { to: '/results/roadmap', label: 'Roadmap', icon: Map },
  { to: '/results/compare', label: 'Paper Comparison', icon: GitCompare },
];

export default function Sidebar({ open }) {
  return (
    <aside
      className={`fixed inset-y-16 left-0 z-30 w-64 shrink-0 border-r border-cyan-accent/10 bg-card/95 backdrop-blur-md transition-transform lg:static lg:inset-auto lg:translate-x-0 lg:bg-card/50 ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${!open ? 'lg:w-0 lg:overflow-hidden lg:border-0' : ''}`}
    >
      <nav className="flex flex-col gap-1 p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Main
        </p>
        {mainNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? 'tab-active border-l-2'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Results
        </p>
        {resultNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? 'tab-active border-l-2'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
