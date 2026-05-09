import { useState, useEffect } from 'react';
import { X, Smartphone, Download, Share, Plus } from 'lucide-react';

// Detects if user is on a mobile browser (not already in standalone/PWA mode)
function isMobileBrowser() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobile = /android|iphone|ipad|ipod|mobile|tablet/i.test(ua);
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  return isMobile && !isStandalone;
}

function getOS() {
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'mobile';
}

export function MobileAppBanner({ deferredPrompt, setDeferredPrompt }) {
  const [visible, setVisible] = useState(false);
  const [os, setOs] = useState('mobile');

  useEffect(() => {
    if (isMobileBrowser()) {
      const today = new Date().toISOString().split('T')[0];
      const lastShown = localStorage.getItem('app_banner_date');
      if (lastShown !== today) {
        setOs(getOS());
        // Show after a delay to feel non-intrusive
        const t = setTimeout(() => setVisible(true), 2500);
        return () => clearTimeout(t);
      }
    }
  }, []);

  // Sync data-modal-open to hide bottom nav
  useEffect(() => {
    if (visible) {
      document.documentElement.setAttribute('data-modal-open', 'true');
    } else {
      document.documentElement.removeAttribute('data-modal-open');
    }
    return () => document.documentElement.removeAttribute('data-modal-open');
  }, [visible]);

  const handleClose = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('app_banner_date', today);
    setVisible(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        handleClose();
      }
    } else if (os === 'ios') {
      // Just keep modal open to show instructions
    } else {
      handleClose();
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none">
        <div
          className="w-full max-w-[340px] pointer-events-auto rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10"
          style={{ 
            background: 'linear-gradient(165deg, #11111d 0%, #1a1030 100%)',
            animation: 'modalShow 0.4s cubic-bezier(0.34,1.56,0.64,1) both' 
          }}
        >
          <style>{`
            @keyframes modalShow {
              from { transform: scale(0.9) translateY(20px); opacity: 0; }
              to   { transform: scale(1) translateY(0);    opacity: 1; }
            }
          `}</style>
          
          {/* Close */}
          <div className="flex justify-end px-4 pt-4">
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-8 pb-10 flex flex-col items-center text-center gap-6">
            {/* App Icon */}
            <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl transition-transform hover:scale-105 duration-500">
              <img src="/logo.png" alt="PlusOneStar" className="w-full h-full object-contain bg-black/20" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Get the Web App</h2>
              <p className="text-sm text-white/50 leading-relaxed font-medium">
                Install <strong className="text-white">PlusOneStar</strong> on your home screen for the best experience.
              </p>
            </div>

            {/* Manual Instructions Logic */}
            {(os === 'ios' || (!deferredPrompt)) && (
              <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5 w-full space-y-4">
                <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Quick Setup</p>
                
                {os === 'ios' ? (
                  <div className="flex items-center justify-center gap-4 text-white/90">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-lg">
                        <Share className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-[10px] font-bold opacity-60">Tap Share</span>
                    </div>
                    <div className="h-px w-6 bg-white/10" />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-lg">
                        <Plus className="w-5 h-5 text-accent" />
                      </div>
                      <span className="text-[10px] font-bold opacity-60">Add to Home</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <div className="bg-white/10 px-4 py-2.5 rounded-xl text-xs font-bold text-white/90 shadow-lg">
                      Tap <span className="opacity-60 mx-1.5">⋮</span> Menu
                    </div>
                    <span className="text-white/20">→</span>
                    <div className="bg-white/10 px-4 py-2.5 rounded-xl text-xs font-bold text-white/90 shadow-lg">
                      Install App
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Action - Only show if browser prompt is supported and ready */}
            <div className="flex flex-col gap-3 w-full">
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="h-14 rounded-2xl flex items-center justify-center gap-3 text-sm font-black text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-lg shadow-rose-500/20"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
                >
                  <Download className="w-5 h-5" />
                  Install Now
                </button>
              )}
              <button
                onClick={handleClose}
                className={`h-11 rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-[0.2em] transition-all
                  ${deferredPrompt ? 'text-white/20 hover:text-white/40' : 'bg-white/10 text-white/80 hover:bg-white/15'}`}
              >
                {deferredPrompt ? 'Maybe Later' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileAppBanner;
