import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { useResearch } from '../context/ResearchContext';
import { Clock, Sparkles } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { runAnalysis, loading, error, recent } = useResearch();

  const handleSearch = async (topic) => {
    await runAnalysis(topic);
    navigate('/results/papers');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 lg:py-20">
      <section className="mb-12 text-center">
        <p className="mb-3 font-display text-sm uppercase tracking-[0.3em] text-cyan-accent">
          Research Intelligence Platform
        </p>
        <h2 className="mb-4 font-display text-3xl font-bold text-white md:text-5xl">
          From weeks of reading to{' '}
          <span className="bg-gradient-to-r from-cyan-accent to-purple-accent bg-clip-text text-transparent">
            minutes of insight
          </span>
        </h2>
        <p className="mx-auto max-w-2xl text-slate-400">
          Eight AI agents search papers, find gaps, detect contradictions, predict trends,
          and draft your literature review.
        </p>
      </section>

      <div className="mb-8 flex justify-center">
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {error && (
        <div className="mx-auto mb-8 max-w-3xl rounded-lg border border-pink-accent/40 bg-pink-accent/10 px-4 py-3 text-sm text-pink-accent">
          {error}
        </div>
      )}

      {recent.length > 0 && (
        <section className="glass-card mx-auto max-w-3xl p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Clock className="h-4 w-4 text-cyan-accent" />
            Recent analyses
          </h3>
          <div className="flex flex-wrap gap-2">
            {recent.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleSearch(t)}
                disabled={loading}
                className="rounded-full border border-slate-600 bg-deep/50 px-4 py-1.5 text-sm text-slate-300 transition hover:border-cyan-accent/50 hover:text-cyan-accent"
              >
                {t}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Search', desc: 'ArXiv + Semantic Scholar' },
          { title: 'Extract', desc: 'Key findings per paper' },
          { title: 'Analyze', desc: 'Gaps, trends, contradictions' },
          { title: 'Publish', desc: 'Review + roadmap' },
        ].map((item) => (
          <div key={item.title} className="glass-card p-5">
            <Sparkles className="mb-2 h-5 w-5 text-purple-accent" />
            <h4 className="font-semibold text-white">{item.title}</h4>
            <p className="text-sm text-slate-400">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
