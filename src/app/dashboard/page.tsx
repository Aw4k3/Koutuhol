'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getGuestStore, clearGuestStore, GuestSessionRecord } from '@/lib/guest/storage';
import { createClient } from '@/lib/supabase/client';
import {
  Trophy,
  BarChart3,
  History,
  Download,
  Trash2,
  Play,
  Settings,
  Award,
  ShieldAlert,
} from 'lucide-react';

interface LeaderboardRow {
  userId: string;
  displayName: string;
  totalCorrect: number;
  totalAttempted: number;
  accuracy: number;
  bayesianScore: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<GuestSessionRecord[]>([]);
  const [isGuest, setIsGuest] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'leaderboard'>('analytics');

  useEffect(() => {
    const store = getGuestStore();
    setSessions(store.sessions);

    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setIsGuest(false);
        const { data: dbSessions } = await supabase
          .from('quiz_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        if (dbSessions && dbSessions.length > 0) {
          setSessions(
            dbSessions.map((s) => ({
              id: s.id,
              date: s.completed_at || s.started_at,
              preferences: {
                level: s.edu_level,
                group: s.academic_group,
                subjectSlugs: s.subject_slugs || [],
                customCourses: s.custom_courses || [],
                isTimed: s.is_timed,
              },
              totalAttempted: s.total_attempted,
              totalCorrect: s.total_correct,
              totalIncorrect: s.total_incorrect,
              totalUnanswered: s.total_unanswered,
              accuracyPct: s.accuracy_pct,
              totalTimeMs: s.total_time_ms,
              longestStreak: s.longest_session_streak,
              answers: [],
            }))
          );
        }
      }

      // Calculate Server-Authoritative Global Leaderboard
      const { data: allSessions } = await supabase
        .from('quiz_sessions')
        .select('user_id, total_correct, total_attempted, profiles(display_name)')
        .eq('status', 'completed');

      if (allSessions) {
        const map = new Map<
          string,
          { name: string; correct: number; attempted: number }
        >();

        for (const row of allSessions as unknown as Array<{
          user_id: string;
          total_correct: number;
          total_attempted: number;
          profiles: { display_name: string } | null;
        }>) {
          const prev = map.get(row.user_id) || {
            name: row.profiles?.display_name || 'Learner',
            correct: 0,
            attempted: 0,
          };
          prev.correct += row.total_correct || 0;
          prev.attempted += row.total_attempted || 0;
          map.set(row.user_id, prev);
        }

        const ranked: LeaderboardRow[] = Array.from(map.entries())
          .filter(([, v]) => v.attempted > 0)
          .map(([uid, v]) => {
            const C = v.correct;
            const N = v.attempted;
            // Fair Bayesian Mastery Formula: (C * 10) * ((C + 5) / (N + 10))
            const bayesianScore = Math.round(C * 10 * ((C + 5) / (N + 10)));
            return {
              userId: uid,
              displayName: v.name,
              totalCorrect: C,
              totalAttempted: N,
              accuracy: Number(((C / N) * 100).toFixed(1)),
              bayesianScore,
            };
          })
          .sort((a, b) => b.bayesianScore - a.bayesianScore)
          .slice(0, 25);

        setLeaderboard(ranked);
      }
    });
  }, []);

  const totalSessions = sessions.length;
  const totalAttempted = sessions.reduce((a, s) => a + s.totalAttempted, 0);
  const totalCorrect = sessions.reduce((a, s) => a + s.totalCorrect, 0);
  const overallAccuracy =
    totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(1) : '0.0';
  const bestStreak = sessions.reduce((max, s) => Math.max(max, s.longestStreak), 0);
  const totalMinutes = Math.round(
    sessions.reduce((a, s) => a + s.totalTimeMs, 0) / 60000
  );

  const exportGuestBackup = () => {
    const store = getGuestStore();
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koutuhol-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your local guest history?')) {
      clearGuestStore();
      setSessions([]);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">কৌতূহল Dashboard</h1>
            <p className="text-xs text-slate-400">
              {isGuest
                ? 'Guest Mode (Stored on this browser)'
                : 'Registered Student Account (Synced to Cloud)'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" /> Change Subjects
            </button>
            <button
              type="button"
              onClick={() => router.push('/quiz')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> New Session
            </button>
          </div>
        </header>

        {/* Guest Notice Banner */}
        {isGuest && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                You are using Guest Mode. Create an account to join the Global Leaderboard, or export a backup JSON.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportGuestBackup}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Backup
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> My Progress & History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400'
            }`}
          >
            <Trophy className="w-4 h-4" /> Global Leaderboard
          </button>
        </div>

        {activeTab === 'analytics' ? (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Questions Answered</div>
                <div className="text-2xl font-bold text-white mt-1">{totalAttempted}</div>
                <div className="text-[11px] text-emerald-400">{totalCorrect} Correct</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Overall Accuracy</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{overallAccuracy}%</div>
                <div className="text-[11px] text-slate-400">Across {totalSessions} sessions</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Longest Streak</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">{bestStreak}</div>
                <div className="text-[11px] text-slate-400">Personal best</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Practice Time</div>
                <div className="text-2xl font-bold text-white mt-1">{totalMinutes}m</div>
                <div className="text-[11px] text-slate-400">Active learning</div>
              </div>
            </div>

            {/* Achievements */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Milestones Unlocked
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className={`px-3 py-1 rounded-full border ${
                    totalSessions >= 1
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  🚀 First Curious Step (1+ Session)
                </span>
                <span
                  className={`px-3 py-1 rounded-full border ${
                    bestStreak >= 5
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  🔥 Sharp Streak (5+ in a row)
                </span>
                <span
                  className={`px-3 py-1 rounded-full border ${
                    totalCorrect >= 25
                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  🎯 Quarter Century (25+ Correct)
                </span>
              </div>
            </div>

            {/* Session History List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-400" /> Recent Sessions
                </h2>
                {isGuest && sessions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-xs text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Local Data
                  </button>
                )}
              </div>

              {sessions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                  No completed sessions yet. Start a Quiz Reel to build your analytics!
                </div>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Score: {s.totalCorrect} / {s.totalAttempted} (
                        {s.accuracyPct !== null ? `${s.accuracyPct}%` : 'N/A'})
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(s.date).toLocaleString()} • Streak: {s.longestStreak}
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400">
                      {s.preferences.level || 'Session'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Global Leaderboard Tab */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <strong>Fair Ranking Formula:</strong> Koutuhol ranks registered learners using a{' '}
              <span className="text-emerald-400">Bayesian Mastery Score</span> that rewards both
              verified correct answers and high accuracy, preventing random-guess spamming.
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                No registered user sessions recorded yet. Sign in and complete a session to claim #1!
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Learner</th>
                      <th className="py-3 px-4">Correct</th>
                      <th className="py-3 px-4">Accuracy</th>
                      <th className="py-3 px-4 text-right">Mastery Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {leaderboard.map((row, i) => (
                      <tr key={row.userId} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-emerald-400">#{i + 1}</td>
                        <td className="py-3 px-4 font-medium text-white">{row.displayName}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {row.totalCorrect}/{row.totalAttempted}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{row.accuracy}%</td>
                        <td className="py-3 px-4 text-right font-bold text-amber-400">
                          {row.bayesianScore} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}