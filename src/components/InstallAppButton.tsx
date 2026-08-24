import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2 } from 'lucide-react';

export const InstallAppButton: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(inStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDownloadAPK = async () => {
    // 1. If native PWA install prompt is available, trigger it
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsStandalone(true);
        }
      } catch (e) {
        console.log("Native prompt error:", e);
      }
    }

    // 2. Directly trigger APK file download
    const link = document.createElement('a');
    link.href = '/download-apk';
    link.setAttribute('download', 'Shasznair_Cafe_App.apk');
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isStandalone) {
    return (
      <div title="App is running as an installed app" className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installed</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleDownloadAPK}
      title="Download Android APK"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c5a059] hover:bg-[#b08c47] active:scale-95 text-black transition-all cursor-pointer text-xs font-extrabold shadow-md ${className}`}
    >
      <Download className="w-3.5 h-3.5 stroke-[2.5] animate-bounce" />
      <span>Download APK</span>
    </button>
  );
};
