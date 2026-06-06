import { Link } from 'react-router-dom';
import { Menu, Microscope } from 'lucide-react';

export default function Header({ onMenuToggle }) {
  return (
    <header className="sticky top-0 z-40 border-b border-cyan-accent/20 bg-deep/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-cyan-accent hover:bg-cyan-accent/10 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-accent/30 to-purple-accent/30">
              <Microscope className="h-6 w-6 text-cyan-accent" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-wide text-white">
                AutoResearch <span className="text-cyan-accent">Agent</span>
              </h1>
              <p className="hidden text-xs text-slate-400 sm:block">
                AI-Powered Research Intelligence
              </p>
            </div>
          </Link>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-purple-accent/30 bg-purple-accent/10 px-4 py-1.5 text-xs font-medium text-purple-accent sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-accent" />
          8-Agent Pipeline
        </div>
      </div>
    </header>
  );
}
