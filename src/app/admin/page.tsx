'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MathText from '@/components/MathText';
import { Upload, CheckCircle2, AlertCircle, ArrowLeft, Eye } from 'lucide-react';

const SAMPLE_JSON = `[
  {
    "subject_slug": "physics-9-12",
    "applicable_level": "class_9",
    "academic_group": "science",
    "language": "bn",
    "difficulty": "medium",
    "topic": "গতি (Motion)",
    "question_text": "স্থির অবস্থান থেকে সুষম ত্বরণে চলমান বস্তুর $t$ সময়ে অতিক্রান্ত দূরত্ব $s$ নিচের কোনটির সমানুপাতিক?",
    "options": {
      "A": "$s \\\\propto t$",
      "B": "$s \\\\propto t^2$",
      "C": "$s \\\\propto \\\\sqrt{t}$",
      "D": "$s \\\\propto t^3$"
    },
    "correct_option": "B",
    "explanation": "আমরা জানি, $s = ut + \\\\frac{1}{2}at^2$। যেহেতু আদিবেগ $u = 0$, তাই $s = \\\\frac{1}{2}at^2$ বা $s \\\\propto t^2$।"
  }
]`;

export default function AdminPage() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [previewItems, setPreviewItems] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePreview = () => {
    setStatus(null);
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error('Root element must be a JSON array [...]');
      setPreviewItems(parsed);
    } catch (e: unknown) {
      setStatus({
        type: 'error',
        text: e instanceof Error ? e.message : 'Invalid JSON syntax.',
      });
    }
  };

  const handleUpload = async () => {
    setStatus(null);
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: 'error', text: data.error || 'Import failed' });
      } else {
        setStatus({ type: 'success', text: data.message });
      }
    } catch (e: unknown) {
      setStatus({
        type: 'error',
        text: e instanceof Error ? e.message : 'Invalid JSON format.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">কৌতূহল Admin — Question Importer</h1>
            <p className="text-xs text-slate-400">
              Bulk validate, preview LaTeX/Bengali, and publish to the shared question bank.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
        </header>

        {status && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {status.text}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Paste Question Batch JSON
          </label>
          <textarea
            rows={12}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-sky-400" /> Preview LaTeX & Formatting
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> {loading ? 'Importing...' : 'Validate & Publish to DB'}
          </button>
        </div>

        {previewItems.length > 0 && (
          <section className="space-y-3 pt-4 border-t border-slate-800">
            <h2 className="text-sm font-bold text-slate-300">
              Live Preview ({previewItems.length} items)
            </h2>
            {previewItems.map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-sm font-semibold text-white">
                  <MathText text={String(item.question_text || '')} />
                </div>
                <div className="text-xs text-emerald-400">
                  Correct: {String(item.correct_option)} | Explanation:{' '}
                  <MathText text={String(item.explanation || '')} />
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}