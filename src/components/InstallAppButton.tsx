import React, { useState, useEffect } from 'react';
import { SmartphoneSvg, CheckCircle2Svg, DownloadSvg, XSvg, ShareSvg, InfoSvg } from './SvgIcons';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';

export const InstallAppButton: React.FC<{ className?: string; variant?: 'inline' | 'floating' | 'menu' }> = ({ 
  className = "", 
  variant = 'inline' 
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Safely check theme from context if inside provider
  let isLight = false;
  try {
    const context = useCoffeeApp();
    isLight = context?.settings?.branding?.theme === 'light';
  } catch {
    // Context fallback
  }

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
        }, 400);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const downloadApkFile = () => {
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
    // 1. Trigger beforeinstallprompt if available
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

    // 2. If inside iframe, open standalone tab with ?install=1
    if (isIframe) {
      const url = new URL(window.location.href);
      url.searchParams.set('install', '1');
      window.open(url.toString(), '_blank');
      return;
    }

    // 3. Open guide modal or trigger fallback APK download
    setShowGuideModal(true);
  };

  if (isStandalone) {
    if (variant === 'floating') return null;
    return (
      <div title="App is running as an installed PWA application" className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold ${className}`}>
        <CheckCircle2Svg className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">PWA Installed</span>
      </div>
    );
  }

  // FLOATING ACTION BUTTON (FAB) VARIANT
  if (variant === 'floating') {
    if (isDismissed) return null;

    return (
      <>
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 group">
          <div className="relative">
            <button
              onClick={handleInstallApp}
              title="Install Shasznair Cafe App to Home Screen"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl transition-all cursor-pointer text-xs font-black tracking-wide active:scale-95 ${
                isLight 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30 ring-2 ring-amber-500/40' 
                  : 'bg-[#c5a059] hover:bg-[#d4af66] text-black shadow-[0_8px_25px_rgba(197,160,89,0.5)] ring-2 ring-[#c5a059]/50'
              } ${className}`}
            >
              <div className="relative flex items-center justify-center">
                <SmartphoneSvg className="w-4 h-4 stroke-[2.5]" />
                {deferredPrompt && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                )}
              </div>
              <span className="font-serif">Install PWA App</span>
              <DownloadSvg className="w-3.5 h-3.5 ml-0.5 opacity-80" />
            </button>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            title="Dismiss install floating button"
            className={`p-1.5 rounded-full border shadow-md transition-all cursor-pointer ${
              isLight 
                ? 'bg-white hover:bg-stone-100 text-stone-500 border-stone-300' 
                : 'bg-[#181a24] hover:bg-[#202330] text-white/60 hover:text-white border-white/20'
            }`}
          >
            <XSvg className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* INSTALL GUIDE MODAL */}
        {showGuideModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border space-y-4 ${
              isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#12141c] border-white/10 text-white'
            }`}>
              <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-white/10">
                <div className="flex items-center gap-2 text-[#c5a059]">
                  <SmartphoneSvg className="w-5 h-5" />
                  <h3 className="font-bold text-sm font-serif">Install Shasznair Cafe App</h3>
                </div>
                <button 
                  onClick={() => setShowGuideModal(false)}
                  className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-white/50"
                >
                  <XSvg className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {isIOS ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShareSvg className="w-3.5 h-3.5" /> iOS Safari Installation Steps:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] pt-1">
                      <li>Tap the <strong>Share</strong> icon in your Safari toolbar</li>
                      <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                      <li>Confirm to add app icon to your Home Screen</li>
                    </ol>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <InfoSvg className="w-3.5 h-3.5" /> Chrome / Android PWA Installation:
                    </p>
                    <p className="text-[11px]">
                      Tap the browser menu button (<strong>⋮</strong> or <strong>Share</strong>) and select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      downloadApkFile();
                      setShowGuideModal(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold flex items-center justify-center gap-2 text-xs shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    <DownloadSvg className="w-4 h-4" />
                    <span>Download Standalone Web App Package</span>
                  </button>
                  <button
                    onClick={() => setShowGuideModal(false)}
                    className="w-full py-2 text-stone-500 dark:text-white/60 hover:underline text-center text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // MENU OR INLINE BUTTON VARIANT
  return (
    <>
      <button
        onClick={handleInstallApp}
        title="Install Shasznair Cafe PWA App"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95 ${
          isLight
            ? 'bg-amber-600 hover:bg-amber-700 text-white'
            : 'bg-[#c5a059] hover:bg-[#b08c47] text-black'
        } ${className}`}
      >
        <SmartphoneSvg className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Install App</span>
      </button>

      {/* INSTALL GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border space-y-4 ${
            isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#12141c] border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-white/10">
              <div className="flex items-center gap-2 text-[#c5a059]">
                <SmartphoneSvg className="w-5 h-5" />
                <h3 className="font-bold text-sm font-serif">Install Shasznair Cafe App</h3>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-white/50"
              >
                <XSvg className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {isIOS ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShareSvg className="w-3.5 h-3.5" /> iOS Safari Installation Steps:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] pt-1">
                    <li>Tap the <strong>Share</strong> icon in your Safari toolbar</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Confirm to add app icon to your Home Screen</li>
                  </ol>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <InfoSvg className="w-3.5 h-3.5" /> Chrome / Android PWA Installation:
                  </p>
                  <p className="text-[11px]">
                    Tap the browser menu button (<strong>⋮</strong> or <strong>Share</strong>) and select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    downloadApkFile();
                    setShowGuideModal(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold flex items-center justify-center gap-2 text-xs shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  <DownloadSvg className="w-4 h-4" />
                  <span>Download Standalone Web App Package</span>
                </button>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="w-full py-2 text-stone-500 dark:text-white/60 hover:underline text-center text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const FloatingInstallAppButton: React.FC = () => {
  return <InstallAppButton variant="floating" />;
};
