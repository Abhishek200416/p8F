import { useState, useEffect } from 'react';
import { AlertTriangle, X, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RiskPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const acceptedAt = localStorage.getItem('pos_risk_accepted_at');
    let showPopup = true;
    if (acceptedAt) {
      const msSinceAccept = Date.now() - parseInt(acceptedAt);
      if (msSinceAccept < 86400000) showPopup = false; // 24 hours
    }
    
    if (showPopup) {
      setTimeout(() => setShow(true), 800);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('pos_risk_accepted', 'true'); // legacy
    localStorage.setItem('pos_risk_accepted_at', Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" data-testid="risk-popup">
      <div className="relative bg-card border border-border/40 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Platform Risk Disclaimer</h2>
            <p className="text-xs text-muted-foreground">Please read before continuing</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">PlusOneStar</strong> is an 18+ companionship platform for public social and professional events only.
          </p>

          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 space-y-2">
            {[
              'All meetings must occur at verified public venues only',
              'Never share personal contact info before booking is accepted',
              'Meet only in public, well-lit locations with other people around',
              'Share your live location with a trusted person before meeting',
              'Use the SOS panic button if you ever feel unsafe',
              'PlusOneStar does NOT facilitate dating, escort, or private meetings',
              'All interactions are at your own risk and responsibility',
              'You must be 18+ years old to use this platform',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>

          <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-3">
            <p className="text-xs text-destructive font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              By continuing you accept all platform risks and Terms & Conditions
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 font-semibold"
            data-testid="risk-accept-btn"
          >
            I Understand & Accept
          </Button>
          <a href="/terms" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-10 text-xs">
              Read Terms
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
