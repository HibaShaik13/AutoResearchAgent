const API_BASE = import.meta.env.VITE_API_BASE || '';

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let message = text || `Request failed (${res.status})`;
    try {
      const json = JSON.parse(text);
      if (json.error) message = json.error;
    } catch {
      /* use raw text */
    }
    throw new Error(message);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.blob();
}

export function normalizeResults(raw = {}) {
  const papers = (raw.papers || []).map((p, i) => ({
    id: p.id || `paper-${i}`,
    title: p.title || 'Untitled',
    abstract: p.abstract || '',
    url: p.url || '#',
    year: p.year || p.published || '—',
    source: p.source || 'unknown',
    authors: Array.isArray(p.authors) ? p.authors.join(', ') : p.authors || '—',
    citations: p.citations ?? 0,
    findings: p.findings || p.summary || extractFromSummary(p.summary, 'findings'),
    methodology: p.methodology || extractFromSummary(p.summary, 'methodology'),
    results: p.results || extractFromSummary(p.summary, 'results'),
    summary: p.summary || '',
  }));

  const gaps = normalizeGaps(raw.gaps);
  const hypotheses = normalizeHypotheses(raw.hypotheses);
  const contradictions = normalizeContradictions(raw.contradictions);
  const trends = normalizeTrends(raw.trends);
  const literatureReview =
    raw.literature_review ||
    raw.review ||
    raw.literatureReview ||
    (typeof raw.review_text === 'string' ? raw.review_text : '');
  const topic = raw.topic || '';

  return {
    topic,
    papers,
    gaps,
    hypotheses,
    contradictions,
    trends,
    literatureReview,
    graph_nodes: raw.graph_nodes || [],
    graph_edges: raw.graph_edges || [],
  };
}

function extractFromSummary(summary, _key) {
  if (!summary || typeof summary !== 'string') return '—';
  return summary.slice(0, 400);
}

function normalizeGaps(gaps) {
  if (!gaps) return [];
  if (typeof gaps === 'string') {
    return gaps
      .split(/\n+/)
      .filter((l) => l.trim().length > 10)
      .slice(0, 8)
      .map((line, i) => ({
        id: `gap-${i}`,
        title: line.replace(/^[\d.*\-]+\s*/, '').slice(0, 80),
        description: line,
        type: 'general',
      }));
  }
  if (Array.isArray(gaps)) {
    return gaps.map((g, i) => ({
      id: g.id || `gap-${i}`,
      title: g.title || g.name || `Research Gap ${i + 1}`,
      description: g.description || g.text || '',
      type: g.type || 'general',
    }));
  }
  return [];
}

function normalizeHypotheses(hypotheses) {
  if (!hypotheses) return [];
  if (!Array.isArray(hypotheses)) return [];
  return hypotheses.map((h, i) => ({
    id: h.id || `hyp-${i}`,
    title: h.title || h.hypothesis || h.statement || `Hypothesis ${i + 1}`,
    description: h.description || h.rationale || '',
    scores: h.scores || {
      novelty: h.novelty ?? 7,
      feasibility: h.feasibility ?? 7,
      impact: h.impact ?? 7,
    },
  }));
}

function normalizeContradictions(contradictions) {
  if (!contradictions) return [];
  if (!Array.isArray(contradictions)) return [];
  return contradictions.map((c, i) => ({
    id: c.id || `con-${i}`,
    statement1: c.statement1 || c.statement_1 || '',
    statement2: c.statement2 || c.statement_2 || '',
    paper1: c.paper1 || c.paper_1 || '',
    paper2: c.paper2 || c.paper_2 || '',
    analysis: c.analysis || c.implication || '',
  }));
}

function normalizeTrends(trends) {
  if (!trends || typeof trends !== 'object') {
    return { current_trend: '', predictions: [], yearly_counts: [] };
  }
  return {
    current_trend: trends.current_trend || trends.summary || '',
    predictions: trends.predictions || trends.future || [],
    yearly_counts: trends.yearly_counts || trends.by_year || [],
  };
}

export async function analyzeResearch(topic) {
  const res = await fetch(
    `${API_BASE}/api/analyze?topic=${encodeURIComponent(topic)}`
  );
  return handleResponse(res);
}

export async function getResults() {
  const res = await fetch(`${API_BASE}/api/results`);
  const data = await handleResponse(res);
  return normalizeResults(data);
}

export async function getGraphData() {
  const res = await fetch(`${API_BASE}/api/graph-data`);
  const data = await handleResponse(res);
  return {
    graph_nodes: data.graph_nodes || data.nodes || [],
    graph_edges: data.graph_edges || data.edges || [],
  };
}

export async function generateReport(data) {
  const res = await fetch(`${API_BASE}/api/generate-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function sendChatMessage(message, context = {}) {
  const res = await fetch(`${API_BASE}/api/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ...context }),
  });
  const data = await handleResponse(res);
  return data.reply || data.response || data.message || String(data);
}

export { API_BASE };
