import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = Cookies.get('plusone_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    Cookies.set('plusone_cookie_consent', 'accepted', { expires: 365 });
    setShow(false);
  };

  const decline = () => {
    Cookies.set('plusone_cookie_consent', 'declined', { expires: 30 });
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 animate-fade-in-up" data-testid="cookie-consent">
      <div className="max-w-3xl mx-auto bg-card border border-border shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Shield className="w-8 h-8 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">We value your privacy</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PlusOneStar uses cookies to enhance your experience, analyze traffic, and serve relevant ads. By clicking "Accept", you consent to our use of cookies.{' '}
            <a href="/terms" className="underline hover:text-blue-500">Learn more</a>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={decline} data-testid="cookie-decline">Decline</Button>
          <Button size="sm" onClick={accept} data-testid="cookie-accept">Accept</Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
