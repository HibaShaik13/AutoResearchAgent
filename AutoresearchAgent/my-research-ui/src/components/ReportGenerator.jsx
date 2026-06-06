import { useRef, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { generateReport } from '../api/backend';

export default function ReportGenerator({ results, topic }) {
  const reportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const chartData = [
    { name: 'Papers', value: results.papers?.length || 0, fill: '#00f5ff' },
    { name: 'Gaps', value: results.gaps?.length || 0, fill: '#bf5fff' },
    { name: 'Hypotheses', value: results.hypotheses?.length || 0, fill: '#ff2d8d' },
    {
      name: 'Contradictions',
      value: results.contradictions?.length || 0,
      fill: '#f87171',
    },
  ];

  const downloadPdfClient = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
      });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      let heightLeft = h;
      let position = 0;
      pdf.addImage(img, 'PNG', 0, position, w, h);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position = heightLeft - h;
        pdf.addPage();
        pdf.addImage(img, 'PNG', 0, position, w, h);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`AutoResearch_${topic?.replace(/\s+/g, '_') || 'report'}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const downloadPdfBackend = async () => {
    setDownloading(true);
    try {
      const blob = await generateReport({ topic, ...results });
      if (blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AutoResearch_Report.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await downloadPdfClient();
      }
    } catch {
      await downloadPdfClient();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-display text-xl font-bold text-white">Research Report</h3>
        <button
          type="button"
          onClick={downloadPdfBackend}
          disabled={downloading}
          className="btn-primary"
        >
          <Download className="h-4 w-4" />
          {downloading ? 'Generating…' : 'Download as PDF'}
        </button>
      </div>

      <div
        ref={reportRef}
        className="rounded-xl border border-slate-700 bg-white p-8 text-slate-900 shadow-xl"
      >
        <header className="border-b border-slate-200 pb-6 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">
            AutoResearch Agent · Academic Summary
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-slate-900">
            {topic || 'Research Analysis Report'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Generated {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
          </p>
        </header>

        <section className="mt-8">
          <h2 className="mb-2 font-serif text-lg font-bold">Executive Summary</h2>
          <p className="text-sm leading-relaxed text-slate-700">
            This report synthesizes {results.papers?.length || 0} papers, identifies{' '}
            {results.gaps?.length || 0} research gaps, proposes{' '}
            {results.hypotheses?.length || 0} hypotheses, and flags{' '}
            {results.contradictions?.length || 0} contradictions for topic &quot;{topic}&quot;.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 font-serif text-lg font-bold">Findings Overview</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-bold">Papers Discovered</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {(results.papers || []).slice(0, 10).map((p) => (
              <li key={p.id}>
                <strong>{p.title}</strong> ({p.year}) — {p.source}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-bold">Research Gaps</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {(results.gaps || []).map((g) => (
              <li key={g.id}>
                <strong>{g.title}</strong>: {g.description?.slice(0, 200)}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-bold">Hypotheses</h2>
          {(results.hypotheses || []).map((h) => (
            <div key={h.id} className="mb-3 text-sm text-slate-700">
              <p className="font-semibold">{h.title}</p>
              <p>{h.description}</p>
            </div>
          ))}
        </section>

        {(results.contradictions || []).length > 0 && (
          <section className="mt-8 rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <h2 className="mb-3 font-serif text-lg font-bold text-red-800">
              Contradictions Highlighted
            </h2>
            {results.contradictions.map((c) => (
              <div key={c.id} className="mb-3 text-sm text-red-900">
                <p>
                  <span className="font-semibold">A:</span> {c.statement1}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">B:</span> {c.statement2}
                </p>
                {c.analysis && <p className="mt-1 italic">{c.analysis}</p>}
              </div>
            ))}
          </section>
        )}

        {results.trends?.current_trend && (
          <section className="mt-8">
            <h2 className="mb-2 font-serif text-lg font-bold">Trends Summary</h2>
            <p className="text-sm text-slate-700">{results.trends.current_trend}</p>
          </section>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          <FileText className="mx-auto mb-1 h-4 w-4" />
          AutoResearch Agent — Verify all citations against original sources before publication.
        </footer>
      </div>
    </section>
  );
}
