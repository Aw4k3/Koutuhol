'use client';

import { useState, useEffect } from 'react';
import { Smartphone, X, Share, MoreVertical, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Register Service Worker for Android Chrome PWA eligibility
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Hide if already running from Home Screen shortcut
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (sessionStorage.getItem('koutuhol_pwa_dismissed') === '1') {
      setDismissed(true);
    }

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('koutuhol_pwa_dismissed', '1');
    setDismissed(true);
  };

  if (isStandalone || dismissed) return null;

  return (
    <>
      <div className="md:hidden bg-emerald-950/90 border border-emerald-500/40 rounded-2xl p-3.5 mb-4 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-white">Add কৌতূহল to Home Screen</div>
            <p className="text-emerald-200/80 text-[11px]">
              Get 1-tap full-screen Reel access on your phone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Add App
          </button>
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

      {/* Fallback Manual Guide Modal for iOS Safari / Mobile Browsers */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add Shortcut to Home Screen</h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIos ? (
              <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside">
                <li>
                  Tap the <Share className="w-3.5 h-3.5 inline text-emerald-400 mx-1" />{' '}
                  <strong>Share</strong> button at the bottom of Safari.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> in the top-right corner.
                </li>
              </ol>
            ) : (
              <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside">
                <li>
                  Tap the <MoreVertical className="w-3.5 h-3.5 inline text-emerald-400 mx-0.5" />{' '}
                  <strong>three-dot menu</strong> in the top-right corner of your browser.
                </li>
                <li>
                  Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.
                </li>
                <li>
                  Confirm by tapping <strong>Install / Add</strong>.
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}