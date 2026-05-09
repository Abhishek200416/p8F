import { useEffect, useRef } from 'react';

export const AdBanner = ({ slot = "auto", format = "auto", className = "" }) => {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch (e) {
      // AdSense not loaded
    }
  }, []);

  return (
    <div className={`ad-banner ${className}`} data-testid="ad-banner">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: '90px' }}
        data-ad-client="ca-pub-4365607109967193"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />

    </div>
  );
};

export default AdBanner;
