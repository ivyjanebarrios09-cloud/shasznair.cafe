import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export const InstallAppButton: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Download & Install App (iOS & Android PWA)"
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#c5a059]/15 border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/25 transition-all cursor-pointer text-xs font-bold ${className}`}
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* PWA INSTALLATION INSTRUCTION MODAL */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121212] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-left">
            <button 
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-[#c5a059]">
              <div className="p-2.5 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-white">Install Shasznair Cafe App</h2>
                <p className="text-[11px] text-white/50">Download PWA for iOS & Android</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-white/80 bg-[#181920] p-4 rounded-xl border border-white/10">
                <p className="font-bold text-[#c5a059]">How to install on iOS (iPhone / iPad):</p>
                <ol className="list-decimal list-inside space-y-2 text-white/70">
                  <li>Open this app in Safari.</li>
                  <li>Tap the <strong className="text-white">Share</strong> button <span className="inline-block px-1.5 py-0.5 bg-white/15 rounded text-[10px]">⎋</span> at the bottom of Safari.</li>
                  <li>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> <span className="inline-block px-1.5 py-0.5 bg-white/15 rounded text-[10px]">➕</span>.</li>
                  <li>Tap <strong className="text-white">Add</strong> in the top right corner. Shasznair Cafe will now appear on your home screen!</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-white/80 bg-[#181920] p-4 rounded-xl border border-white/10">
                <p className="font-bold text-[#c5a059]">How to install on Android / Desktop:</p>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>If prompted by Chrome or Edge, click <strong className="text-white">"Install"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</li>
                  <li>Alternatively, open your browser menu (three dots <span className="inline-block px-1.5 py-0.5 bg-white/15 rounded text-[10px]">⋮</span>) and select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</li>
                </ul>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
