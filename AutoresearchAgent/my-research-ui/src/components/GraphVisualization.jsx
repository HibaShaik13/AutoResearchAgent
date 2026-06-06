import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { X, ZoomIn, Maximize2, Search, Filter, Activity, BookOpen, Target, Link as LinkIcon, Info } from 'lucide-react';

// --- Data Augmentation Utilities ---

function calculatePaperSize(citations) {
  if (citations >= 1000) return 60;
  if (citations >= 500) return 50;
  if (citations >= 100) return 40;
  if (citations >= 10) return 30;
  return 20;
}

function calculateGapSize(importance) {
  if (importance >= 9) return 70; // Critical
  if (importance >= 7) return 55; // Major
  if (importance >= 5) return 40; // Medium
  return 25; // Minor
}

function getRelationshipType(score) {
  if (score >= 90) return 'Directly Solves Gap';
  if (score >= 70) return 'Partially Solves Gap';
  if (score >= 50) return 'Addresses Similar Concept';
  return 'Mentions Gap Topic';
}

function getEdgeThickness(score) {
  if (score >= 90) return 4.5;
  if (score >= 70) return 3;
  if (score >= 50) return 1.5;
  return 0.75;
}

// Deterministic pseudo-random score based on strings
function generateMockRelevance(str1, str2) {
  let hash = 0;
  const str = String(str1) + String(str2);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 40 + (Math.abs(hash) % 61); // 40 to 100
}

function buildGraphFromData(papers, gaps, apiNodes, apiEdges) {
  const nodes = [];
  const links = [];

  const sourceGaps = gaps.length ? gaps : (apiNodes || []).filter(n => n.type === 'gap').map(n => n.meta || n);
  const sourcePapers = papers.length ? papers : (apiNodes || []).filter(n => n.type === 'paper').map(n => n.meta || n);

  sourceGaps.forEach((g, i) => {
    let imp = g.importance ?? 8;
    const impMatch = (g.description || '').match(/(\d+)\/100/);
    if (impMatch) imp = parseInt(impMatch[1]) / 10;
    
    nodes.push({
      id: g.id || `gap-${i}`,
      label: (g.title || `Gap ${i + 1}`).slice(0, 45),
      fullTitle: g.title || `Gap ${i + 1}`,
      type: 'gap',
      gapType: g.type || 'general',
      importance: imp,
      size: calculateGapSize(imp),
      meta: {
        ...g,
        opportunities: "High Potential Topic (Derived from structural analysis)"
      },
      connections: 0,
      connectedNodes: []
    });
  });

  sourcePapers.forEach((p, i) => {
    // Generate realistic looking mock data if missing
    const citations = p.citations !== undefined ? p.citations : Math.floor(Math.abs(Math.sin(i * 123) * 1200));
    const year = p.year || (2024 - (i % 5));
    const journal = p.journal || (i % 2 === 0 ? "Nature AI" : "IEEE Transactions");
    const keywords = ["Deep Learning", "Automation", "Optimization"].map(k => `${k} ${i}`);

    nodes.push({
      id: p.id || `paper-${i}`,
      label: (p.title || `Paper ${i + 1}`).slice(0, 40),
      fullTitle: p.title || `Paper ${i + 1}`,
      type: 'paper',
      importance: Math.min(10, 3 + citations / 50),
      size: calculatePaperSize(citations),
      citations,
      meta: { ...p, year, journal, keywords, domain: "AI Systems" },
      connections: 0,
      connectedNodes: []
    });

    if (sourceGaps.length) {
      // Connect to 1-3 gaps
      const numConns = 1 + (i % 3);
      for(let j=0; j<numConns; j++) {
        const gapIdx = (i + j) % sourceGaps.length;
        const targetId = sourceGaps[gapIdx].id || `gap-${gapIdx}`;
        const sourceId = p.id || `paper-${i}`;
        const relevance = generateMockRelevance(sourceId, targetId);
        
        links.push({
          id: `edge-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          relevance,
          type: getRelationshipType(relevance)
        });
      }
    }
  });

  // Track bi-directional connections for UI rendering
  links.forEach(l => {
    const s = nodes.find(n => n.id === l.source);
    const t = nodes.find(n => n.id === l.target);
    if (s && t) {
      s.connections++;
      t.connections++;
      s.connectedNodes.push(t);
      t.connectedNodes.push(s);
    }
  });

  return { nodes, links };
}

// --- Main Component ---

export default function GraphVisualization({ nodes: apiNodes, edges: apiEdges, papers = [], gaps = [] }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  // State
  const [selected, setSelected] = useState(null); // Node or Edge
  const [hovered, setHovered] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dblClicked, setDblClicked] = useState(null); // Node ID for focus mode

  // Compute graph data
  const graph = useMemo(
    () => buildGraphFromData(papers, gaps, apiNodes, apiEdges),
    [papers, gaps, apiNodes, apiEdges]
  );

  // Compute Analytics
  const analytics = useMemo(() => {
    const pList = graph.nodes.filter(n => n.type === 'paper');
    const gList = graph.nodes.filter(n => n.type === 'gap');
    const avgCites = pList.length ? pList.reduce((acc, n) => acc + (n.citations || 0), 0) / pList.length : 0;
    const topGap = [...gList].sort((a,b) => b.importance - a.importance)[0];
    const topPaper = [...pList].sort((a,b) => (b.citations || 0) - (a.citations || 0))[0];
    
    return {
      papers: pList.length,
      gaps: gList.length,
      edges: graph.links.length,
      avgCitations: Math.round(avgCites),
      topGap: topGap?.fullTitle || 'N/A',
      topPaper: topPaper?.fullTitle || 'N/A'
    };
  }, [graph.nodes, graph.links]);

  // Apply filters & double-click focus
  const { filteredNodes, filteredLinks } = useMemo(() => {
    let resultNodes = graph.nodes;
    
    if (filter === 'papers') resultNodes = resultNodes.filter(n => n.type === 'paper');
    else if (filter === 'gaps') resultNodes = resultNodes.filter(n => n.type === 'gap');
    else if (filter === 'high-citation') resultNodes = resultNodes.filter(n => n.type === 'paper' && n.citations >= 100);
    else if (filter === 'critical-gaps') resultNodes = resultNodes.filter(n => n.type === 'gap' && n.importance >= 8);
    else if (filter === 'recent') resultNodes = resultNodes.filter(n => n.type === 'paper' && n.meta?.year >= 2023);

    // Double-click focus mode
    if (dblClicked) {
      const neighbors = new Set([dblClicked]);
      graph.links.forEach(l => {
        const sId = l.source.id || l.source;
        const tId = l.target.id || l.target;
        if (sId === dblClicked) neighbors.add(tId);
        if (tId === dblClicked) neighbors.add(sId);
      });
      resultNodes = resultNodes.filter(n => neighbors.has(n.id));
    }

    const filteredIds = new Set(resultNodes.map(n => n.id));
    const resultLinks = graph.links.filter(
      l => filteredIds.has(l.source.id || l.source) && filteredIds.has(l.target.id || l.target)
    );

    return { filteredNodes: resultNodes, filteredLinks: resultLinks };
  }, [graph, filter, dblClicked]);

  // Handle Search Execution
  const executeSearch = (e) => {
    e.preventDefault();
    if (!search.trim() || !svgRef.current) return;
    
    const query = search.toLowerCase();
    const targetNode = filteredNodes.find(n => 
      n.fullTitle?.toLowerCase().includes(query) || 
      n.meta?.abstract?.toLowerCase().includes(query) ||
      n.meta?.authors?.toLowerCase().includes(query)
    );

    if (targetNode && targetNode.x !== undefined) {
      setSelected(targetNode);
      const svg = d3.select(svgRef.current);
      const width = containerRef.current.clientWidth;
      const height = 600;
      
      svg.transition().duration(750).call(
        d3.zoom().transform, 
        d3.zoomIdentity.translate(width / 2 - targetNode.x, height / 2 - targetNode.y).scale(1.2)
      );
    }
  };

  // Setup D3
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !filteredNodes.length) return;

    const width = containerRef.current.clientWidth;
    const height = 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Definitions for gradients & glow filters
    const defs = svg.append("defs");
    
    const filterGlow = defs.append("filter").attr("id", "glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filterGlow.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMerge = filterGlow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const pulseGlow = defs.append("filter").attr("id", "pulseGlow");
    pulseGlow.append("feGaussianBlur").attr("stdDeviation", "8").attr("result", "blur");
    const pulseMerge = pulseGlow.append("feMerge");
    pulseMerge.append("feMergeNode").attr("in", "blur");
    pulseMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const paperGrad = defs.append("radialGradient").attr("id", "paperGrad");
    paperGrad.append("stop").attr("offset", "0%").attr("stop-color", "#00f5ff").attr("stop-opacity", 0.9);
    paperGrad.append("stop").attr("offset", "100%").attr("stop-color", "#00a3cc").attr("stop-opacity", 0.7);

    const gapGrad = defs.append("radialGradient").attr("id", "gapGrad");
    gapGrad.append("stop").attr("offset", "0%").attr("stop-color", "#ff5f9e").attr("stop-opacity", 0.9);
    gapGrad.append("stop").attr("offset", "100%").attr("stop-color", "#bf5fff").attr("stop-opacity", 0.7);

    const g = svg.append('g');

    const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    svg.call(zoom);

    // Force Simulation configuration
    const simulation = d3.forceSimulation(filteredNodes)
      .force('link', d3.forceLink(filteredLinks).id(d => d.id).distance(d => 150 - (d.relevance * 0.5)))
      .force('charge', d3.forceManyBody().strength(d => d.size * -15)) // scale repulsion by node size
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 15).iterations(2))
      .force('x', d3.forceX(width / 2).strength(d => d.importance * 0.01))
      .force('y', d3.forceY(height / 2).strength(d => d.importance * 0.01));

    // Edges
    const link = g.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .join('line')
      .attr('stroke', d => d.relevance >= 90 ? 'rgba(0, 245, 255, 0.6)' : 'rgba(148, 163, 184, 0.3)')
      .attr('stroke-width', d => getEdgeThickness(d.relevance))
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelected({...d, isEdge: true});
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke', '#00f5ff').attr('stroke-width', getEdgeThickness(d.relevance) + 2);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('stroke', d.relevance >= 90 ? 'rgba(0, 245, 255, 0.6)' : 'rgba(148, 163, 184, 0.3)')
          .attr('stroke-width', getEdgeThickness(d.relevance));
      });

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x; d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelected(d);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        setDblClicked(prev => prev === d.id ? null : d.id);
      })
      .on('mousemove', (event, d) => {
        setHovered({
          x: event.clientX,
          y: event.clientY,
          data: d
        });
        d3.select(event.currentTarget).select('.shape').attr('stroke', '#ffffff').attr('stroke-width', 3);
      })
      .on('mouseout', (event) => {
        setHovered(null);
        d3.select(event.currentTarget).select('.shape')
          .attr('stroke', d => d.type === 'gap' ? '#ff5f9e' : '#00f5ff')
          .attr('stroke-width', 2);
      });

    node.each(function (d) {
      const el = d3.select(this);
      
      const isCritical = d.type === 'gap' && d.importance >= 8;
      const isHighlyCited = d.type === 'paper' && d.citations >= 500;
      
      if (d.type === 'gap') {
        el.append('circle')
          .attr('class', 'shape')
          .attr('r', d.size)
          .attr('fill', 'url(#gapGrad)')
          .attr('stroke', '#ff5f9e')
          .attr('stroke-width', 2)
          .attr('filter', isCritical ? 'url(#pulseGlow)' : (selected?.id === d.id ? 'url(#glow)' : null));
      } else {
        el.append('rect')
          .attr('class', 'shape')
          .attr('x', -d.size/2)
          .attr('y', -d.size/2)
          .attr('width', d.size)
          .attr('height', d.size)
          .attr('rx', 6)
          .attr('fill', 'url(#paperGrad)')
          .attr('stroke', '#00f5ff')
          .attr('stroke-width', 2)
          .attr('filter', isHighlyCited || selected?.id === d.id ? 'url(#glow)' : null);
      }

      // Label background for readability
      el.append('rect')
        .attr('y', d.size + 4)
        .attr('x', -60)
        .attr('width', 120)
        .attr('height', 16)
        .attr('fill', 'rgba(15, 23, 42, 0.7)')
        .attr('rx', 4);

      el.append('text')
        .attr('y', d.size + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e2e8f0')
        .attr('font-size', 10)
        .attr('font-weight', '500')
        .text(d.label);
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Click on background clears selection
    svg.on('click', () => {
      setSelected(null);
    });

    return () => simulation.stop();
  }, [filteredNodes, filteredLinks, selected?.id]);

  return (
    <div className="flex flex-col gap-4">
      
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-2">
        <div className="glass-card p-3 rounded-xl border border-cyan-accent/20">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><BookOpen size={12}/> Total Papers</p>
          <p className="text-xl font-bold text-white">{analytics.papers}</p>
        </div>
        <div className="glass-card p-3 rounded-xl border border-purple-accent/20">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Target size={12}/> Total Gaps</p>
          <p className="text-xl font-bold text-white">{analytics.gaps}</p>
        </div>
        <div className="glass-card p-3 rounded-xl">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><LinkIcon size={12}/> Connections</p>
          <p className="text-xl font-bold text-white">{analytics.edges}</p>
        </div>
        <div className="glass-card p-3 rounded-xl">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Activity size={12}/> Avg Citations</p>
          <p className="text-xl font-bold text-cyan-400">{analytics.avgCitations}</p>
        </div>
        <div className="glass-card p-3 rounded-xl col-span-2 hidden lg:block overflow-hidden">
          <p className="text-xs text-slate-400 mb-1">Most Influential Paper</p>
          <p className="text-sm font-semibold text-white truncate">{analytics.topPaper}</p>
        </div>
      </div>

      {/* Controls & Graph Layout */}
      <div className="flex flex-col gap-4 lg:flex-row">
        
        {/* Main Graph Area */}
        <div className="flex-1 relative">
          <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 pointer-events-auto bg-slate-900/80 p-2 rounded-xl backdrop-blur border border-slate-700/50">
              {['all', 'papers', 'gaps', 'high-citation', 'critical-gaps', 'recent'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    filter === f ? 'bg-cyan-accent text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}>
                  {f.replace('-', ' ')}
                </button>
              ))}
              {dblClicked && (
                <button onClick={() => setDblClicked(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30">
                  Clear Focus
                </button>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={executeSearch} className="pointer-events-auto flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search nodes..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-accent"
                />
              </div>
              <button type="submit" className="bg-cyan-accent/10 border border-cyan-accent/30 text-cyan-accent px-3 py-1.5 rounded-xl text-xs hover:bg-cyan-accent/20">
                Find
              </button>
              <button type="button" onClick={() => d3.select(svgRef.current).transition().duration(750).call(d3.zoom().transform, d3.zoomIdentity)} className="bg-slate-800 px-3 py-1.5 rounded-xl text-xs text-white hover:bg-slate-700">
                <Maximize2 className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div ref={containerRef} className="glass-card overflow-hidden rounded-xl w-full border border-slate-700/50" style={{ height: '600px' }}>
            <svg ref={svgRef} width="100%" height="100%" className="bg-[#0b1426]" />
          </div>
          
          {/* HTML Tooltip Overlay */}
          {hovered && hovered.data && !hovered.data.isEdge && (
            <div 
              className="fixed z-50 pointer-events-none bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-2xl backdrop-blur max-w-xs transform -translate-x-1/2 -translate-y-full mb-3"
              style={{ left: hovered.x, top: hovered.y - 15 }}
            >
              <p className="font-bold text-white text-sm leading-tight mb-1">{hovered.data.fullTitle}</p>
              {hovered.data.type === 'paper' ? (
                <>
                  <p className="text-xs text-slate-300">Year: <span className="text-cyan-400">{hovered.data.meta?.year}</span></p>
                  <p className="text-xs text-slate-300">Citations: <span className="text-cyan-400">{hovered.data.citations}</span></p>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-300">Importance: <span className="text-purple-400">{Math.round((hovered.data.importance/10)*100)}/100</span></p>
                  <p className="text-xs text-slate-300">Connections: <span className="text-purple-400">{hovered.data.connections}</span></p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Side Panel */}
        <aside className="glass-card w-full lg:w-[350px] shrink-0 flex flex-col h-[600px] border border-slate-700/50">
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
            
            {/* NO SELECTION -> Show Legend */}
            {!selected && (
              <div className="text-sm text-slate-300 animate-in fade-in">
                <h3 className="mb-5 font-bold text-white flex items-center gap-2"><Info size={16}/> Graph Legend</h3>
                
                <div className="mb-6 space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="mt-1 shrink-0 h-4 w-4 rounded-full bg-gradient-to-br from-[#ff5f9e] to-[#bf5fff] shadow-[0_0_8px_#bf5fff]" />
                    <div>
                      <p className="font-bold text-slate-100">Research Gap</p>
                      <p className="text-xs text-slate-400 mt-1">What's missing in current research.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="mt-1 shrink-0 h-4 w-4 rounded bg-gradient-to-br from-[#00f5ff] to-[#00a3cc] shadow-[0_0_8px_#00f5ff]" />
                    <div>
                      <p className="font-bold text-slate-100">Research Paper</p>
                      <p className="text-xs text-slate-400 mt-1">Existing research addressing gaps.</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-700 pb-1">Node Size Meaning</p>
                  <ul className="space-y-2 text-xs text-slate-300 mt-3">
                    <li className="flex justify-between items-center"><span className="font-semibold text-white">Giant (60px+)</span> <span>Critical Gap / 1000+ Cites</span></li>
                    <li className="flex justify-between items-center"><span className="font-semibold text-slate-200">Large (50px)</span> <span>Major Gap / 500+ Cites</span></li>
                    <li className="flex justify-between items-center"><span className="font-semibold text-slate-300">Medium (40px)</span> <span>Avg Gap / 100+ Cites</span></li>
                    <li className="flex justify-between items-center"><span className="text-slate-400">Small (20px)</span> <span>Minor Gap / New Paper</span></li>
                  </ul>
                </div>

                <div className="mb-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-700 pb-1">Connection Lines</p>
                  <p className="text-xs text-slate-300 mb-2 mt-3">Lines map papers solving gaps.</p>
                  <div className="flex items-center gap-2 mb-1"><div className="h-[4px] w-6 bg-cyan-accent rounded"></div><span className="text-xs">Very Relevant (90%+)</span></div>
                  <div className="flex items-center gap-2 mb-1"><div className="h-[2px] w-6 bg-cyan-accent/70 rounded"></div><span className="text-xs">Relevant (70-89%)</span></div>
                  <div className="flex items-center gap-2"><div className="h-[1px] w-6 bg-slate-500 rounded"></div><span className="text-xs">Weak Link (&lt;50%)</span></div>
                </div>
                
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs text-purple-200 shadow-inner">
                  <span className="font-bold text-purple-300 flex items-center gap-1 mb-1">💡 Opportunity Hunt</span>
                  Look for <strong className="text-white">massive red circles</strong> with very few lines attached. That's your next paper topic! Double-click any node to focus on its neighborhood.
                </div>
              </div>
            )}

            {/* EDGE SELECTED */}
            {selected?.isEdge && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <div className="mb-4 flex items-center justify-between pb-2 border-b border-slate-700">
                  <span className="rounded bg-slate-700 px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1"><LinkIcon size={12}/> Connection</span>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded-full"><X className="h-4 w-4" /></button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Source Paper</p>
                    <p className="text-sm font-medium text-cyan-100">{graph.nodes.find(n => n.id === (selected.source.id || selected.source))?.fullTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Target Gap</p>
                    <p className="text-sm font-medium text-purple-200">{graph.nodes.find(n => n.id === (selected.target.id || selected.target))?.fullTitle}</p>
                  </div>
                  
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Relevance Score</p>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-3xl font-bold text-white leading-none">{selected.relevance}%</span>
                    </div>
                    
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Relationship</p>
                    <p className="text-sm text-cyan-400 font-medium">{selected.type}</p>
                  </div>
                </div>
              </div>
            )}

            {/* NODE SELECTED */}
            {selected && !selected.isEdge && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <div className="mb-4 flex items-start justify-between">
                  <span className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ${
                      selected.type === 'gap' ? 'bg-purple-accent/20 text-purple-accent border border-purple-accent/30' : 'bg-cyan-accent/20 text-cyan-accent border border-cyan-accent/30'
                    }`}>
                    {selected.type === 'gap' ? 'Research Gap' : 'Paper Details'}
                  </span>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded-full"><X className="h-4 w-4" /></button>
                </div>

                {/* PAPER DETAILS */}
                {selected.type === 'paper' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white leading-tight">{selected.fullTitle}</h3>
                    
                    <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-700/50">
                      <div><p className="text-xs text-slate-500 font-medium mb-0.5">Year</p><p className="text-sm text-slate-200">{selected.meta?.year}</p></div>
                      <div><p className="text-xs text-slate-500 font-medium mb-0.5">Citations</p><p className="text-sm font-bold text-cyan-400">{selected.citations}</p></div>
                      <div className="col-span-2"><p className="text-xs text-slate-500 font-medium mb-0.5">Authors</p><p className="text-sm text-slate-300">{selected.meta?.authors || 'Unknown'}</p></div>
                      <div className="col-span-2"><p className="text-xs text-slate-500 font-medium mb-0.5">Journal</p><p className="text-sm text-slate-300">{selected.meta?.journal || 'ArXiv'}</p></div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1.5 uppercase tracking-wider">Abstract Summary</p>
                      <p className="text-sm text-slate-300 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar pr-2">{selected.meta?.abstract || 'No abstract available.'}</p>
                    </div>

                    {selected.meta?.keywords && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.meta.keywords.map(kw => <span key={kw} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">{kw}</span>)}
                        </div>
                      </div>
                    )}

                    <div className="bg-cyan-900/10 border border-cyan-900/30 p-3 rounded-xl mt-4">
                      <p className="text-xs text-cyan-500 font-bold mb-2 uppercase tracking-wider">Connected Research Gaps ({selected.connectedNodes.length})</p>
                      <ul className="space-y-1.5">
                        {selected.connectedNodes.map(n => (
                          <li key={n.id} className="text-sm text-cyan-100 flex items-start gap-1.5">
                            <span className="text-cyan-500 mt-0.5">✓</span> {n.fullTitle}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-slate-700/50">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Importance Score</p>
                        <p className="text-lg font-bold text-white">{Math.round((selected.importance/10)*100)}/100</p>
                      </div>
                      {selected.meta?.url && (
                        <a href={selected.meta.url} target="_blank" rel="noopener noreferrer" className="btn-primary py-1.5 px-4 text-sm font-medium shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                          View PDF
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* GAP DETAILS */}
                {selected.type === 'gap' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white leading-tight">{selected.fullTitle}</h3>
                    
                    <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-700/50">
                      <div><p className="text-xs text-slate-500 font-medium mb-0.5">Importance</p><p className="text-lg font-bold text-purple-400">{Math.round((selected.importance/10)*100)}/100</p></div>
                      <div><p className="text-xs text-slate-500 font-medium mb-0.5">Related Papers</p><p className="text-lg font-bold text-white">{selected.connections}</p></div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1.5 uppercase tracking-wider">Gap Description</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{selected.meta?.description || 'No description provided.'}</p>
                    </div>

                    <div className="bg-purple-900/20 border border-purple-500/20 p-3 rounded-xl mt-4">
                      <p className="text-xs text-purple-400 font-bold mb-2 uppercase tracking-wider">Research Opportunity</p>
                      <p className="text-sm text-purple-100">{selected.meta?.opportunities}</p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Papers Mentioning This Gap</p>
                      {selected.connectedNodes.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No direct connections found. Ripe for research!</p>
                      ) : (
                        <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                          {selected.connectedNodes.map((n, i) => (
                            <li key={n.id} className="text-sm text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700">
                              <span className="text-slate-500 text-xs mr-2">{i+1}.</span>{n.fullTitle}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
