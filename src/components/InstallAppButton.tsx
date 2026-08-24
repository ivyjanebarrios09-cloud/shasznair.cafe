import React, { useState, useEffect } from 'react';
import { Smartphone, X, CheckCircle2, Share, PlusSquare, Monitor, AppWindow } from 'lucide-react';

export const InstallAppButton: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'ios' | 'android' | 'desktop'>('android');

  const [showAutoBanner, setShowAutoBanner] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const androidDevice = /android/.test(userAgent);
    setIsIOS(iosDevice);
    if (iosDevice) setActiveDeviceTab('ios');
    if (androidDevice) setActiveDeviceTab('android');

    // Check if app is already running as an installed PWA
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(inStandalone);

    // Auto-show install prompt / banner on load if not installed
    const hasDismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (!inStandalone && !hasDismissed) {
      // Auto open popup after short delay for immediate visibility on Android
      const timer = setTimeout(() => {
        setShowAutoBanner(true);
      }, 800);
      return () => clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Automatically prompt or show popup immediately on Android when ready
      if (!inStandalone && !hasDismissed) {
        setShowInstallModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsStandalone(true);
        }
      } catch {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  if (isStandalone) {
    return (
      <div title="App is running as an installed PWA" className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">PWA Installed</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install Progressive Web App (PWA) on iOS, Android or Desktop"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c5a059] hover:bg-[#b08c47] text-black transition-all cursor-pointer text-xs font-extrabold shadow-md ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Install PWA</span>
      </button>

      {/* PWA INSTALLATION INSTRUCTION MODAL */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121212] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-left">
            <button 
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-[#c5a059]">
              <div className="p-3 rounded-2xl bg-[#c5a059]/15 border border-[#c5a059]/30">
                <AppWindow className="w-6 h-6 text-[#c5a059]" />
              </div>
              <div>
                <h2 className="text-base font-serif font-extrabold text-white">Install Shasznair Cafe App</h2>
                <p className="text-[11px] text-white/60">Progressive Web App (PWA) for iOS, Android & Desktop</p>
              </div>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                onClick={() => setActiveDeviceTab('android')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeDeviceTab === 'android' ? 'bg-[#c5a059] text-black font-extrabold shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setActiveDeviceTab('ios')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeDeviceTab === 'ios' ? 'bg-[#c5a059] text-black font-extrabold shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                <Share className="w-3.5 h-3.5" />
                <span>iOS (iPhone)</span>
              </button>
              <button
                onClick={() => setActiveDeviceTab('desktop')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeDeviceTab === 'desktop' ? 'bg-[#c5a059] text-black font-extrabold shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            {activeDeviceTab === 'ios' && (
              <div className="space-y-3 text-xs text-white/80 bg-[#181920] p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-[#c5a059] font-bold">
                  <Share className="w-4 h-4" />
                  <span>iOS Safari (iPhone / iPad) PWA Setup:</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-white/70 font-medium">
                  <li>Open this URL in <strong className="text-white">Safari</strong> on your iPhone or iPad.</li>
                  <li>Tap the <strong className="text-white">Share</strong> button <Share className="w-3.5 h-3.5 inline text-[#c5a059] mx-1" /> at the bottom navigation bar.</li>
                  <li>Scroll down the menu and select <strong className="text-white">"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#c5a059] mx-1" />.</li>
                  <li>Tap <strong className="text-white">Add</strong> in the top-right corner. The app icon will be installed directly to your iOS Home Screen!</li>
                </ol>
              </div>
            )}

            {activeDeviceTab === 'android' && (
              <div className="space-y-3 text-xs text-white/80 bg-[#181920] p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-[#c5a059] font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>Android Chrome / Samsung Internet PWA Setup:</span>
                </div>
                <ul className="list-disc list-inside space-y-2 text-white/70 font-medium">
                  <li>Click <strong className="text-white">"Install PWA"</strong> if prompted automatically by Chrome or Samsung Internet.</li>
                  <li>Alternatively, tap the browser menu button (three dots <strong className="text-white">⋮</strong>) in the top-right corner.</li>
                  <li>Select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</li>
                  <li>Confirm installation — the native web app will launch directly from your Android app drawer.</li>
                </ul>
              </div>
            )}

            {activeDeviceTab === 'desktop' && (
              <div className="space-y-3 text-xs text-white/80 bg-[#181920] p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-[#c5a059] font-bold">
                  <Monitor className="w-4 h-4" />
                  <span>Desktop (Chrome, Edge, Brave):</span>
                </div>
                <ul className="list-disc list-inside space-y-2 text-white/70 font-medium">
                  <li>Look for the <strong className="text-white">Install icon</strong> in your browser's address bar (top-right).</li>
                  <li>Or open the browser menu (three dots <strong className="text-white">⋮</strong>) and click <strong className="text-white">"Install Shasznair Cafe"</strong>.</li>
                  <li>Enjoy a native, full-screen desktop POS & ordering app experience without browser tabs.</li>
                </ul>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-[#c5a059] hover:bg-[#b08c47] text-black text-xs font-extrabold py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install App Now</span>
              </button>
              <button
                onClick={() => setShowInstallModal(false)}
                className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMMEDIATE FLOATING INSTALL POPUP BANNER FOR ANDROID & MOBILE */}
      {showAutoBanner && !showInstallModal && !isStandalone && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm bg-[#18181b] border-2 border-[#c5a059]/60 p-3.5 rounded-2xl shadow-2xl z-[150] flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center justify-center flex-shrink-0 text-[#c5a059]">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">Install Android / Mobile App</p>
              <p className="text-[10px] text-white/60">Get instant access & offline mobile ordering</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setShowAutoBanner(false);
                handleInstallClick();
              }}
              className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow flex items-center gap-1"
            >
              <span>Install</span>
            </button>
            <button
              onClick={() => {
                setShowAutoBanner(false);
                sessionStorage.setItem('pwa_banner_dismissed', 'true');
              }}
              className="text-white/40 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
