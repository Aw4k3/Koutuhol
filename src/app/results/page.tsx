'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GuestSessionRecord } from '@/lib/guest/storage';
import { Question } from '@/types/koutuhol';
import { EDU_LEVEL_LABELS, INITIAL_SUBJECTS } from '@/config/curriculum';
import MathText from '@/components/MathText';
import {
  Trophy,
  Printer,
  RotateCcw,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
} from 'lucide-react';

interface DetailedAnswer {
  question: Question;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  status: 'correct' | 'incorrect' | 'timeout' | 'skipped';
  timeTakenMs: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<GuestSessionRecord | null>(null);
  const [details, setDetails] = useState<DetailedAnswer[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem('koutuhol_last_session');
    if (!raw) {
      router.push('/onboarding');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setSummary(parsed.summary);
      setDetails(parsed.detailedAnswers || []);
    } catch {
      router.push('/onboarding');
    }
  }, [router]);

  if (!summary) return null;

  const avgTimeSec =
    summary.totalAttempted > 0
      ? ((summary.totalTimeMs / summary.totalAttempted) / 1000).toFixed(1)
      : '0.0';

  const levelLabel = summary.preferences.level
    ? EDU_LEVEL_LABELS[summary.preferences.level].labelEn
    : 'Custom Session';

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 py-8 px-4 print:bg-white print:text-black print:py-0">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Action Bar (Hidden in PDF Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Session Results</h1>
            <p className="text-xs text-slate-400">
              কৌতূহল (Koutuhol) • {levelLabel} • {new Date(summary.date).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" /> Download PDF Report
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" /> Dashboard & Leaderboard
            </button>
            <button
              type="button"
              onClick={() => router.push('/quiz')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Practice Again
            </button>
          </div>
        </div>

        {/* Print-only Header */}
        <div className="hidden print:block border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold">কৌতূহল (Koutuhol) — Official Quiz Report</h1>
          <p className="text-sm text-gray-600">
            Level: {levelLabel} | Date: {new Date(summary.date).toLocaleString()}
          </p>
        </div>

        {/* Score Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 print:border-gray-300 print:bg-white">
            <div className="text-xs text-slate-400 print:text-gray-600 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Score
            </div>
            <div className="text-2xl font-bold text-white print:text-black mt-1">
              {summary.totalCorrect} / {summary.totalAttempted}
            </div>
            <div className="text-[11px] text-slate-400 print:text-gray-500">
              {summary.totalUnanswered} Unanswered
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 print:border-gray-300 print:bg-white">
            <div className="text-xs text-slate-400 print:text-gray-600">Accuracy</div>
            <div className="text-2xl font-bold text-emerald-400 print:text-black mt-1">
              {summary.accuracyPct !== null ? `${summary.accuracyPct}%` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-400 print:text-gray-500">
              {summary.totalIncorrect} Incorrect
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 print:border-gray-300 print:bg-white">
            <div className="text-xs text-slate-400 print:text-gray-600 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Best Streak
            </div>
            <div className="text-2xl font-bold text-amber-400 print:text-black mt-1">
              {summary.longestStreak}
            </div>
            <div className="text-[11px] text-slate-400 print:text-gray-500">Consecutive right</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 print:border-gray-300 print:bg-white">
            <div className="text-xs text-slate-400 print:text-gray-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> Avg Speed
            </div>
            <div className="text-2xl font-bold text-white print:text-black mt-1">{avgTimeSec}s</div>
            <div className="text-[11px] text-slate-400 print:text-gray-500">Per question</div>
          </div>
        </div>

        {/* Full Question Review List */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white print:text-black">
            Detailed Question Review ({details.length} Questions)
          </h2>

          {details.map((item, idx) => {
            const q = item.question;
            const sub = INITIAL_SUBJECTS.find((s) => s.slug === q.subject_slug);
            const subName = q.custom_course_name || sub?.nameBn || 'General';

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 print:bg-white print:border-gray-300 print:break-inside-avoid"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 print:text-black">
                    Q{idx + 1}. {subName} ({q.difficulty})
                  </span>
                  <span
                    className={`font-semibold uppercase ${
                      item.status === 'correct'
                        ? 'text-emerald-400 print:text-green-700'
                        : item.status === 'incorrect'
                        ? 'text-rose-400 print:text-red-700'
                        : 'text-amber-400 print:text-amber-700'
                    }`}
                  >
                    {item.status} ({(item.timeTakenMs / 1000).toFixed(1)}s)
                  </span>
                </div>

                <div className="text-base font-semibold text-white print:text-black">
                  <MathText text={q.question_text} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const isUserPick = item.selectedOption === opt;
                    const isCorrect = q.correct_option === opt;

                    return (
                      <div
                        key={opt}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 print:border-green-600 print:text-black font-semibold'
                            : isUserPick
                            ? 'bg-rose-500/15 border-rose-500/50 text-rose-200 print:border-red-600 print:text-black'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 print:border-gray-200 print:text-gray-700'
                        }`}
                      >
                        <span>
                          <strong>{opt}.</strong> <MathText text={q.options[opt]} />
                        </span>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {isUserPick && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-slate-300 print:text-gray-800 pt-1">
                  <strong>Your Answer:</strong> {item.selectedOption || 'None (Timed Out)'} |{' '}
                  <strong>Correct Answer:</strong> {q.correct_option}
                </div>

                {q.explanation && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 print:bg-gray-50 print:border-gray-200 print:text-black">
                    <strong>ব্যাখ্যা / Explanation: </strong>
                    <MathText text={q.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}