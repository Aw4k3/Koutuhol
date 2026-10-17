'use client';
import InstallAppBanner from '@/components/InstallAppBanner';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { saveGuestStore } from '@/lib/guest/storage';
import { Sparkles, BookOpen, ArrowRight, UserCheck, Mail, Lock, Loader2 } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/onboarding');
    });
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setMessage({
        type: 'error',
        text: 'Supabase URL/Key missing in .env.local (or restart npm run dev). Use Guest Mode below!',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName || 'Curious Learner' },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setMessage({ type: 'error', text: error.message });
      else
        setMessage({
          type: 'success',
          text: 'Account created! Check your email or log in directly if auto-confirm is enabled.',
        });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: 'error', text: error.message });
      else router.push('/onboarding');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    if (!supabase) {
      setMessage({
        type: 'error',
        text: 'Supabase URL/Key missing in .env.local. Use Guest Mode below!',
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    saveGuestStore((prev) => ({ ...prev, isGuest: true }));
    router.push('/onboarding');
  };

  return (
    <main className="min-h-dvh flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
      <InstallAppBanner/>
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Reel-Style MCQ Learning
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            কৌতূহল <span className="text-emerald-400 font-normal text-2xl">(Koutuhol)</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">
            Stay Curious, Know More
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                mode === 'login' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                mode === 'signup' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs border ${
                message.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Akib"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === 'login' ? 'Sign In to Koutuhol' : 'Create Free Account'}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-xs">OR</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition border border-slate-700 cursor-pointer"
          >
            Continue with Google
          </button>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Try Guest Mode
            </div>
            <p className="text-xs text-slate-400">
              Practice immediately. Progress saves on this browser.
            </p>
          </div>
          <button
            type="button"
            onClick={handleContinueAsGuest}
            className="px-4 py-2 bg-slate-800 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer"
          >
            Start Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-600 flex items-center justify-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5" /> Class 3–12 (NCTB) & University MCQ Platform
      </footer>
    </main>
  );
}