import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Star, Mail, MapPin, Shield, Heart } from 'lucide-react';

export default function Footer({ forceShow = false }) {
  const { mode } = useTheme();
  const isPro = mode === 'professional';
  const accentHex = isPro ? '#3b82f6' : '#f43f5e';

  return (
    <footer className={`border-t border-border/20 bg-muted/10 mt-auto ${forceShow ? '' : 'hidden md:block'}`} data-testid="app-footer">

      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          <div className="col-span-2 sm:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="PlusOneStar Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>PlusOneStar</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">India's premium 18+ companion platform for public social and professional events.</p>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Shield className="w-3 h-3" style={{ color: accentHex }} />
              <span>All at your own risk. 18+ only.</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Explore</p>
            <div className="space-y-1.5">
              {[['Browse Companions', '/browse'], ['How It Works', '/how-it-works'], ['About Us', '/about'], ['Subscription Plans', '/subscription']].map(([l, h]) => (
                <Link key={l} to={h} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Legal</p>
            <div className="space-y-1.5">
              {[['Terms & Conditions', '/terms'], ['Privacy Policy', '/terms'], ['Safety Guide', '/how-it-works'], ['Cookie Policy', '/terms']].map(([l, h], idx) => (
                <Link key={`${l}-${idx}`} to={h} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Contact</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3" style={{ color: accentHex }} />
                <a href="mailto:support@plusonestar.com" className="hover:text-foreground">support@plusonestar.com</a>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" style={{ color: accentHex }} />
                <span>India</span>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-border/15 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground">© 2024 PlusOneStar. All rights reserved. 18+ Platform only.</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
}
