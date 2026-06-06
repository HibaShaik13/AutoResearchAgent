import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function SearchBar({ onSearch, loading, placeholder }) {
  const [value, setValue] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (value.trim() && !loading) onSearch(value.trim());
  };

  return (
    <form onSubmit={submit} className="w-full max-w-3xl">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-cyan-accent/70" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder || 'Enter research topic (e.g. Retrieval-Augmented Generation)'}
          className="w-full rounded-xl border border-cyan-accent/30 bg-card/80 py-4 pl-12 pr-36 text-white placeholder-slate-500 shadow-neon outline-none transition focus:border-cyan-accent focus:ring-2 focus:ring-cyan-accent/20"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="btn-primary absolute right-2 py-2.5"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            'Analyze'
          )}
        </button>
      </div>
    </form>
  );
}
