'use client';

import { useState, useEffect } from 'react';
import { Smartphone, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Do not show if already installed as standalone app or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (sessionStorage.getItem('koutuhol_pwa_dismissed') === '1') {
      setDismissed(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(iosDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('koutuhol_pwa_dismissed', '1');
    setDismissed(true);
  };

  if (dismissed || (!deferredPrompt && !isIos)) return null;

  return (
    <div className="sm:hidden bg-emerald-950/90 border border-emerald-500/40 rounded-2xl p-3.5 mb-4 flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-semibold text-white">Add কৌতূহল to Home Screen</div>
          {isIos ? (
            <p className="text-emerald-200/80 text-[11px] flex items-center gap-1 mt-0.5">
              Tap <Share className="w-3 h-3 inline" /> Share then <strong>Add to Home Screen</strong>
            </p>
          ) : (
            <p className="text-emerald-200/80 text-[11px]">
              Install for 1-tap full-screen Reel access
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white cursor-pointer"
          aria-label="Dismiss install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}