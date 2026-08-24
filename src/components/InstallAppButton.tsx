import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, Download, Share, ExternalLink } from 'lucide-react';

export const InstallAppButton: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // Check if inside an iframe (like AI Studio preview frame)
    const inFrame = window.self !== window.top;
    setIsIframe(inFrame);

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Check standalone mode
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(inStandalone);

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Auto trigger if opened with ?install=1
      const params = new URLSearchParams(window.location.search);
      if (params.get('install') === '1') {
        setTimeout(() => {
          (e as any).prompt();
        }, 300);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    // 1. If deferredPrompt is ready (Android Chrome, Edge, Desktop)
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsStandalone(true);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
      return;
    }

    // 2. If running inside an iframe (preview frame), PWA install is blocked by browser policy
    // Open in top-level window with ?install=1 so the browser can trigger the install prompt directly
    if (isIframe) {
      const url = new URL(window.location.href);
      url.searchParams.set('install', '1');
      window.open(url.toString(), '_blank');
      return;
    }

    // 3. If on iOS Safari
    if (isIOS) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Shasznair Cafe App',
            text: 'Install Shasznair Cafe App to your home screen',
            url: window.location.href,
          });
        } catch {
          setShowIosTip(true);
        }
      } else {
        setShowIosTip(true);
      }
      return;
    }

    // 4. General fallback: if prompt not ready yet, reload or trigger browser menu
    alert("To install this app on your device:\n\n• On Android: Tap browser menu (⋮) -> 'Install app' or 'Add to Home screen'\n• On Desktop: Click the Install icon in your address bar");
  };

  if (isStandalone) {
    return (
      <div title="App is running as an installed application" className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installed</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleInstallApp}
        title="Install as App on your device home screen"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c5a059] hover:bg-[#b08c47] active:scale-95 text-black transition-all cursor-pointer text-xs font-extrabold shadow-md ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Install App</span>
      </button>

      {/* iOS Tooltip */}
      {showIosTip && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[#18181b] border border-[#c5a059]/50 p-3 rounded-xl shadow-2xl z-[100] text-[11px] text-white space-y-1.5 text-left">
          <div className="flex items-center justify-between text-[#c5a059] font-bold">
            <span className="flex items-center gap-1"><Share className="w-3.5 h-3.5" /> iOS Installation</span>
            <button onClick={() => setShowIosTip(false)} className="text-white/50 hover:text-white">✕</button>
          </div>
          <p className="text-white/80">Tap the <strong>Share</strong> button at the bottom of Safari, then select <strong>"Add to Home Screen"</strong>.</p>
        </div>
      )}
    </div>
  );
};
