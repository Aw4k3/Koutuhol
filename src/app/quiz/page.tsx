'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getGuestStore, saveGuestStore, GuestSessionRecord } from '@/lib/guest/storage';
import { createClient } from '@/lib/supabase/client';
import { Question } from '@/types/koutuhol';
import { INITIAL_SUBJECTS } from '@/config/curriculum';
import MathText from '@/components/MathText';
import {
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  StopCircle,
  Loader2,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface AnswerRecord {
  question: Question;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  status: 'correct' | 'incorrect' | 'timeout' | 'skipped';
  timeTakenMs: number;
}

export default function QuizReelPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isTimed, setIsTimed] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const questionStartRef = useRef<number>(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const fetchBatch = useCallback(async (isInitial = false) => {
    const store = getGuestStore();
    if (!store.preferences.level) {
      router.push('/onboarding');
      return;
    }
    setIsTimed(store.preferences.isTimed);
    setErrorMsg(null);

    if (isInitial) setLoading(true);
    else setFetchingMore(true);

    try {
      const res = await fetch('/api/questions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: store.preferences.level,
          group: store.preferences.group,
          subjectSlugs: store.preferences.subjectSlugs,
          customCourses: store.preferences.customCourses,
          seenQuestionIds: store.seenQuestionIds,
          count: 6,
        }),
      });
      const data = await res.json();

      if (data.error && (!data.questions || data.questions.length === 0)) {
        setErrorMsg(data.error);
      } else if (data.questions && data.questions.length > 0) {
        setQuestions((prev) => {
          const existingIds = new Set(prev.map((q) => q.id));
          const uniqueNew = data.questions.filter((q: Question) => !existingIds.has(q.id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setExhausted(true);
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Network error calling /api/questions/batch');
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBatch(true);
  }, [fetchBatch]);

  useEffect(() => {
    questionStartRef.current = Date.now();
    const currentQ = questions[activeIndex];
    if (!currentQ) return;

    if (activeIndex >= questions.length - 2 && !fetchingMore && !exhausted) {
      fetchBatch(false);
    }

    if (answers[currentQ.id] || !isTimed) return;

    setTimeLeft(60);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSelectOption(currentQ, null, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeIndex, questions, isTimed, answers, fetchingMore, exhausted, fetchBatch]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < questions.length) {
      setActiveIndex(newIndex);
    }
  };

  const scrollToNext = () => {
    if (!containerRef.current || activeIndex >= questions.length - 1) return;
    containerRef.current.scrollTo({
      top: (activeIndex + 1) * containerRef.current.clientHeight,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToNext();
      } else if (e.key === 'ArrowUp' && containerRef.current && activeIndex > 0) {
        e.preventDefault();
        containerRef.current.scrollTo({
          top: (activeIndex - 1) * containerRef.current.clientHeight,
          behavior: 'smooth',
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleSelectOption = (
    question: Question,
    option: 'A' | 'B' | 'C' | 'D' | null,
    isTimeout = false
  ) => {
    if (answers[question.id]) return;

    const timeTakenMs = Math.min(Date.now() - questionStartRef.current, 60000);
    const isCorrect = option !== null && option === question.correct_option;
    const status = isTimeout ? 'timeout' : isCorrect ? 'correct' : 'incorrect';

    setAnswers((prev) => ({
      ...prev,
      [question.id]: {
        question,
        selectedOption: option,
        status,
        timeTakenMs,
      },
    }));

    if (isCorrect) {
      const nextStreak = currentStreak + 1;
      setCurrentStreak(nextStreak);
      if (nextStreak > longestStreak) setLongestStreak(nextStreak);
    } else {
      setCurrentStreak(0);
    }

    saveGuestStore((prev) => ({
      ...prev,
      seenQuestionIds: Array.from(new Set([...prev.seenQuestionIds, question.id])),
    }));
  };

  const finalizeSession = async () => {
    const store = getGuestStore();
    const recordedList = Object.values(answers);

    const totalAttempted = recordedList.filter(
      (a) => a.status === 'correct' || a.status === 'incorrect'
    ).length;
    const totalCorrect = recordedList.filter((a) => a.status === 'correct').length;
    const totalIncorrect = recordedList.filter((a) => a.status === 'incorrect').length;
    const totalUnanswered =
      recordedList.filter((a) => a.status === 'timeout').length +
      Math.max(0, activeIndex + 1 - recordedList.length);

    const accuracyPct =
      totalAttempted > 0 ? Number(((totalCorrect / totalAttempted) * 100).toFixed(2)) : null;
    const totalTimeMs = recordedList.reduce((acc, r) => acc + r.timeTakenMs, 0);

    const sessionRecord: GuestSessionRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      preferences: store.preferences,
      totalAttempted,
      totalCorrect,
      totalIncorrect,
      totalUnanswered,
      accuracyPct,
      totalTimeMs,
      longestStreak,
      answers: recordedList.map((r) => ({
        questionId: r.question.id,
        selectedOption: r.selectedOption,
        correctOption: r.question.correct_option,
        status: r.status,
        timeTakenMs: r.timeTakenMs,
      })),
    };

    sessionStorage.setItem(
      'koutuhol_last_session',
      JSON.stringify({ summary: sessionRecord, detailedAnswers: recordedList })
    );

    saveGuestStore((prev) => ({
      ...prev,
      sessions: [sessionRecord, ...prev.sessions].slice(0, 50),
    }));

    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && store.preferences.level) {
        const { data: insertedSession } = await supabase
          .from('quiz_sessions')
          .insert({
            user_id: user.id,
            edu_level: store.preferences.level,
            academic_group: store.preferences.group,
            subject_slugs: store.preferences.subjectSlugs,
            custom_courses: store.preferences.customCourses,
            is_timed: isTimed,
            status: 'completed',
            total_attempted: totalAttempted,
            total_correct: totalCorrect,
            total_incorrect: totalIncorrect,
            total_unanswered: totalUnanswered,
            accuracy_pct: accuracyPct,
            total_time_ms: totalTimeMs,
            longest_session_streak: longestStreak,
            completed_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertedSession && recordedList.length > 0) {
          await supabase.from('session_answers').insert(
            recordedList.map((r) => ({
              session_id: insertedSession.id,
              question_id: r.question.id,
              selected_option: r.selectedOption,
              is_correct: r.status === 'correct',
              status: r.status,
              time_taken_ms: r.timeTakenMs,
            }))
          );
        }
      }
    }

    router.push('/results');
  };

  if (loading) {
    return (
      <div className="h-dvh bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Preparing Your Quiz Reels...</h2>
          <p className="text-xs text-slate-400 max-w-xs">
            Checking the Koutuhol question bank and generating fresh curriculum-aligned MCQs.
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg || questions.length === 0) {
    return (
      <div className="h-dvh bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Could Not Load Quiz Questions</h2>
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left font-mono break-all">
          {errorMsg || 'No questions returned for this subject selection.'}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/onboarding')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Back to Subjects
          </button>
          <button
            type="button"
            onClick={() => fetchBatch(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry Generation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full bg-slate-950 overflow-hidden select-none">
      <header className="fixed top-0 inset-x-0 z-30 p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/95 via-slate-950/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-200">
            Q {activeIndex + 1} / {questions.length}
          </div>

          <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-current" /> {currentStreak}
          </div>

          {isTimed && (
            <div
              className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 ${
                timeLeft <= 10
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-slate-900/90 border-slate-800 text-emerald-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> {timeLeft}s
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowEndConfirm(true)}
          className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <StopCircle className="w-3.5 h-3.5" /> End Session
        </button>
      </header>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-dvh w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      >
        {questions.map((q, idx) => {
          const record = answers[q.id];
          const isAnswered = Boolean(record);
          const subjectObj = INITIAL_SUBJECTS.find((s) => s.slug === q.subject_slug);
          const subjectTitle =
            q.custom_course_name || subjectObj?.nameBn || 'General Subject';

          return (
            <section
              key={q.id}
              className="h-dvh w-full snap-start snap-always flex flex-col justify-center px-4 pt-16 pb-8 max-w-xl mx-auto"
            >
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col justify-between max-h-[84dvh] overflow-y-auto space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {subjectTitle}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400">
                      {q.difficulty} {q.is_ai_generated ? '• AI Bank' : ''}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-semibold text-white leading-snug">
                    <MathText text={q.question_text} />
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                    const isSelected = record?.selectedOption === optKey;
                    const isCorrectOption = q.correct_option === optKey;

                    let cardStyle =
                      'bg-slate-950/90 border-slate-800 text-slate-200 hover:border-slate-600';
                    if (isAnswered) {
                      if (isCorrectOption) {
                        cardStyle =
                          'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-medium';
                      } else if (isSelected && !isCorrectOption) {
                        cardStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
                      } else {
                        cardStyle = 'bg-slate-950/40 border-slate-800/60 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={optKey}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(q, optKey)}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${cardStyle}`}
                      >
                        <div className="flex items-start gap-3 text-sm sm:text-base">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {optKey}
                          </span>
                          <MathText text={q.options[optKey]} />
                        </div>

                        {isAnswered && isCorrectOption && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                        {isAnswered && isSelected && !isCorrectOption && (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in">
                    <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      {record.status === 'correct' && (
                        <span className="text-emerald-400">✓ Correct Answer! (+1 Point)</span>
                      )}
                      {record.status === 'incorrect' && (
                        <span className="text-rose-400">
                          ✗ Incorrect — Correct Option: {q.correct_option}
                        </span>
                      )}
                      {record.status === 'timeout' && (
                        <span className="text-amber-400">
                          ⏰ Time Out (Unanswered) — Correct Option: {q.correct_option}
                        </span>
                      )}
                    </div>

                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300">
                        <strong className="text-slate-100 block mb-1">ব্যাখ্যা / Explanation:</strong>
                        <MathText text={q.explanation} />
                      </div>
                    )}

                    {idx < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={scrollToNext}
                        className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        Swipe or Tap for Next Question <ChevronDown className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={finalizeSession}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" /> View Session Results
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white">End Quiz Session?</h3>
            <p className="text-xs text-slate-400">
              You have attempted {Object.keys(answers).length} question(s) in this session. Ending now will generate your score report and PDF summary.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Keep Practicing
              </button>
              <button
                type="button"
                onClick={finalizeSession}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                End & See Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}