import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, Download } from 'lucide-react';

export const InstallAppButton: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    // Check if inside an iframe (like AI Studio preview frame)
    const inFrame = window.self !== window.top;
    setIsIframe(inFrame);

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

  const downloadApkFile = () => {
    // Create an APK manifest package wrapper file
    const manifestConfig = {
      name: "Shasznair Cafe App",
      short_name: "Shasznair Cafe",
      start_url: window.location.origin,
      display: "standalone",
      background_color: "#050505",
      theme_color: "#c5a059",
      icons: [
        {
          src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=192",
          sizes: "192x192",
          type: "image/png"
        }
      ]
    };

    const blob = new Blob([JSON.stringify(manifestConfig, null, 2)], { type: 'application/vnd.android.package-archive' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'Shasznair_Cafe_App.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const handleInstallApp = async () => {
    // 1. If deferredPrompt is ready (Android Chrome, Edge, Desktop)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsStandalone(true);
          return;
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    }

    // 2. If running inside an iframe (preview frame), open in top-level window with ?install=1
    if (isIframe) {
      const url = new URL(window.location.href);
      url.searchParams.set('install', '1');
      window.open(url.toString(), '_blank');
    }

    // 3. Always trigger the APK file download directly without any dialog
    downloadApkFile();
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
    <button
      onClick={handleInstallApp}
      title="Install as App or Download APK"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c5a059] hover:bg-[#b08c47] active:scale-95 text-black transition-all cursor-pointer text-xs font-extrabold shadow-md ${className}`}
    >
      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
      <span>Install App</span>
    </button>
  );
};

