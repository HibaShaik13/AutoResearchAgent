import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { analyzeResearch, getResults, getGraphData } from '../api/backend';

const ResearchContext = createContext(null);

const RECENT_KEY = 'autoresearch_recent';

export function ResearchProvider({ children }) {
  const [topic, setTopic] = useState('');
  const [results, setResults] = useState(null);
  const [graphData, setGraphData] = useState({ graph_nodes: [], graph_edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('autoresearch_results');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed?.papers?.length) {
        setResults(parsed);
        if (parsed.topic) setTopic(parsed.topic);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveRecent = useCallback((t) => {
    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const runAnalysis = useCallback(
    async (searchTopic) => {
      const t = searchTopic.trim();
      if (!t) return;
      setTopic(t);
      setLoading(true);
      setError(null);
      try {
        await analyzeResearch(t);
        const [data, graph] = await Promise.all([
          getResults(),
          getGraphData().catch(() => ({ graph_nodes: [], graph_edges: [] })),
        ]);
        const merged = {
          ...data,
          topic: t,
          graph_nodes: graph.graph_nodes || data.graph_nodes || [],
          graph_edges: graph.graph_edges || data.graph_edges || [],
        };
        setResults(merged);
        sessionStorage.setItem('autoresearch_results', JSON.stringify(merged));
        setGraphData(graph);
        saveRecent(t);
      } catch (err) {
        const msg = err.message || '';
        const refused =
          msg.includes('ECONNREFUSED') ||
          msg.includes('Failed to fetch') ||
          msg.includes('proxy error');
        setError(
          refused
            ? 'Backend not running. Open a terminal, run: cd AutoResearch → python api_server.py'
            : msg || 'Analysis failed. Check Terminal 1 for errors.'
        );
      } finally {
        setLoading(false);
      }
    },
    [saveRecent]
  );

  const refreshResults = useCallback(async () => {
    try {
      const [data, graph] = await Promise.all([getResults(), getGraphData()]);
      const merged = {
        ...data,
        topic: topic || data.topic,
        graph_nodes: graph.graph_nodes || data.graph_nodes || [],
        graph_edges: graph.graph_edges || data.graph_edges || [],
      };
      setResults(merged);
      sessionStorage.setItem('autoresearch_results', JSON.stringify(merged));
      setGraphData(graph);
    } catch (err) {
      setError(err.message);
    }
  }, [topic]);

  return (
    <ResearchContext.Provider
      value={{
        topic,
        results,
        graphData,
        loading,
        error,
        recent,
        runAnalysis,
        refreshResults,
        setError,
      }}
    >
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  const ctx = useContext(ResearchContext);
  if (!ctx) throw new Error('useResearch must be used within ResearchProvider');
  return ctx;
}
