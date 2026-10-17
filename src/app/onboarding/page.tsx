'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  EDU_LEVEL_LABELS,
  ACADEMIC_GROUP_LABELS,
  requiresAcademicGroup,
  isUniversityLevel,
  getEligibleSubjects,
  validateSelection,
} from '@/config/curriculum';
import { AcademicGroup, EduLevel } from '@/types/koutuhol';
import { getGuestStore, saveGuestStore } from '@/lib/guest/storage';
import { createClient } from '@/lib/supabase/client';
import InstallAppBanner from '@/components/InstallAppBanner';
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Play,
  LogOut,
  AlertCircle,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [level, setLevel] = useState<EduLevel | null>(null);
  const [group, setGroup] = useState<AcademicGroup>('none');
  const [subjectSlugs, setSubjectSlugs] = useState<string[]>([]);
  const [customCourses, setCustomCourses] = useState<string[]>([]);
  const [courseInput, setCourseInput] = useState('');
  const [isTimed, setIsTimed] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guest = getGuestStore();
    if (guest.preferences.level) {
      setLevel(guest.preferences.level);
      setGroup(guest.preferences.group);
      setSubjectSlugs(guest.preferences.subjectSlugs);
      setCustomCourses(guest.preferences.customCourses);
      setIsTimed(guest.preferences.isTimed);
    }

    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          setUserId(user.id);
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile?.role === 'admin') {
            setIsAdmin(true);
          }
        }
      });
    }
  }, []);

  const handleLevelChange = (newLevel: EduLevel) => {
    setLevel(newLevel);
    setGroup('none');
    setSubjectSlugs([]);
    setCustomCourses([]);
    setError(null);
  };

  const handleGroupChange = (newGroup: AcademicGroup) => {
    setGroup(newGroup);
    if (level) {
      const eligible = getEligibleSubjects(level, newGroup);
      const allowed = new Set([
        ...eligible.general.map((s) => s.slug),
        ...eligible.groupSpecific.map((s) => s.slug),
      ]);
      setSubjectSlugs((prev) => prev.filter((slug) => allowed.has(slug)));
    }
    setError(null);
  };

  const toggleSubject = (slug: string) => {
    setSubjectSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
    setError(null);
  };

  const addCustomCourse = () => {
    const trimmed = courseInput.trim();
    if (!trimmed) return;
    if (customCourses.length >= 3) {
      setError('Maximum 3 courses allowed per session.');
      return;
    }
    if (customCourses.includes(trimmed)) {
      setError('This course is already added.');
      return;
    }
    setCustomCourses([...customCourses, trimmed]);
    setCourseInput('');
    setError(null);
  };

  const removeCustomCourse = (course: string) => {
    setCustomCourses(customCourses.filter((c) => c !== course));
  };

  const handleStartSession = async () => {
    const check = validateSelection(level, group, subjectSlugs, customCourses);
    if (!check.valid) {
      setError(check.error || 'Invalid selection.');
      return;
    }

    saveGuestStore((prev) => ({
      ...prev,
      preferences: {
        level,
        group,
        subjectSlugs,
        customCourses,
        isTimed,
      },
    }));

    const supabase = createClient();
    if (supabase && userId && level) {
      await supabase
        .from('profiles')
        .update({
          selected_level: level,
          selected_group: group,
          selected_subjects: subjectSlugs,
          custom_courses: customCourses,
        })
        .eq('id', userId);
    }

    router.push('/quiz');
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/');
  };

  const eligible = level ? getEligibleSubjects(level, group) : { general: [], groupSpecific: [] };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 pb-28">
      {/* Aligned Top Navbar */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-lg text-white tracking-tight">কৌতূহল</span>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400">
              {userId ? 'Registered' : 'Guest Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Dashboard</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="h-8 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{userId ? 'Sign Out' : 'Exit'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-8">
        {/* Mobile PWA Add to Home Screen Banner */}
        <InstallAppBanner />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            1. Select Your Education Level (শ্রেণি নির্বাচন করুন)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(Object.keys(EDU_LEVEL_LABELS) as EduLevel[]).map((lvl) => {
              const info = EDU_LEVEL_LABELS[lvl];
              const active = level === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleLevelChange(lvl)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    active
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-sm">{info.labelBn}</div>
                  <div className="text-xs text-slate-400">{info.labelEn}</div>
                </button>
              );
            })}
          </div>
        </section>

        {level && requiresAcademicGroup(level) && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              2. Select Academic Group (বিভাগ নির্বাচন করুন)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['science', 'commerce', 'arts'] as const).map((grp) => {
                const active = group === grp;
                return (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => handleGroupChange(grp)}
                    className={`p-3.5 rounded-xl border text-left font-medium text-sm transition cursor-pointer ${
                      active
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {ACADEMIC_GROUP_LABELS[grp].labelBn}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {level && !isUniversityLevel(level) && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">
              {requiresAcademicGroup(level) ? '3.' : '2.'} Select Subjects (বিষয় নির্বাচন করুন)
            </h2>

            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider">General Subjects</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {eligible.general.map((sub) => {
                  const selected = subjectSlugs.includes(sub.slug);
                  return (
                    <button
                      key={sub.slug}
                      type="button"
                      onClick={() => toggleSubject(sub.slug)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                        selected
                          ? 'bg-emerald-600/15 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-sm">{sub.nameBn}</div>
                        <div className="text-xs text-slate-400">{sub.nameEn}</div>
                      </div>
                      {selected && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {requiresAcademicGroup(level) && group !== 'none' && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-emerald-400 uppercase tracking-wider">
                  {ACADEMIC_GROUP_LABELS[group].labelEn} Group Subjects
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {eligible.groupSpecific.map((sub) => {
                    const selected = subjectSlugs.includes(sub.slug);
                    return (
                      <button
                        key={sub.slug}
                        type="button"
                        onClick={() => toggleSubject(sub.slug)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                          selected
                            ? 'bg-emerald-600/15 border-emerald-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-sm">{sub.nameBn}</div>
                          <div className="text-xs text-slate-400">{sub.nameEn}</div>
                        </div>
                        {selected && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {level && isUniversityLevel(level) && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              2. Enter Your University Courses (সর্বোচ্চ ৩টি কোর্স)
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Linear Algebra, Real Analysis, Data Structures..."
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCourse())}
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={addCustomCourse}
                disabled={customCourses.length >= 3}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-sm font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {customCourses.map((course) => (
                <span
                  key={course}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm"
                >
                  {course}
                  <button
                    type="button"
                    onClick={() => removeCustomCourse(course)}
                    className="text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </section>
        )}

        {level && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-sm text-white">60-Second Timer per Question</div>
                <div className="text-xs text-slate-400">
                  {isTimed
                    ? 'Enabled: Questions lock after 60 seconds.'
                    : 'Disabled: Practice at your own relaxed pace.'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsTimed(!isTimed)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                isTimed ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isTimed ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </section>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400 truncate">
            {level ? (
              <span>
                <strong className="text-slate-200">{EDU_LEVEL_LABELS[level].labelEn}</strong> •{' '}
                {isUniversityLevel(level)
                  ? `${customCourses.length}/3 courses`
                  : `${subjectSlugs.length} subject(s) selected`}
              </span>
            ) : (
              'Select your class and subjects to begin'
            )}
          </div>
          <button
            type="button"
            onClick={handleStartSession}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> Start Quiz Reels
          </button>
        </div>
      </div>
    </div>
  );
}