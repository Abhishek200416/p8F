import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Crown, Star, MapPin, BadgeCheck, Sparkles, Loader2, ArrowRight
} from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

export default function SpotlightPage() {
  const { user } = useAuth();
  const { mode, theme } = useTheme();
  const isPro = mode === 'professional';
  const isDark = theme === 'dark';
  const accent = isPro ? '#2563eb' : '#f43f5e';
  const accentGrad = isPro ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'linear-gradient(135deg,#f43f5e,#e11d48)';

  const [companion, setCompanion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/companion-of-the-week`);
        if (res.data.status === 'featured' && res.data.companion) {
          setCompanion(res.data.companion);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="spotlight-page">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]" style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}>
              <Crown className="w-3.5 h-3.5" /> Companion of the Week
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Meet Our <span style={{ color: accent }}>Star</span> Companion
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Every week we spotlight an outstanding companion based on ratings, completed bookings, and community feedback.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent }} />
            </div>
          ) : companion ? (
            <div
              className="relative rounded-3xl border overflow-hidden transition-all duration-500 hover:shadow-2xl group max-w-3xl mx-auto"
              style={{
                borderColor: `${accent}20`,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                backdropFilter: 'blur(20px)'
              }}
              data-testid="spotlight-card"
            >
              {/* Featured badge */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black text-white shadow-lg" style={{ background: accentGrad }}>
                <Crown className="w-3 h-3" /> FEATURED
              </div>

              <div className="grid sm:grid-cols-5 gap-0">
                {/* Photo */}
                <div className="sm:col-span-2 relative aspect-[3/4] sm:aspect-auto min-h-[300px] overflow-hidden">
                  {companion.photo ? (
                    <img
                      src={companion.photo.startsWith('http') ? companion.photo : `${process.env.REACT_APP_BACKEND_URL}${companion.photo}`}
                      alt={companion.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      data-testid="spotlight-photo"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}10)` }}>
                      <Crown className="w-20 h-20 opacity-20" style={{ color: accent }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent sm:bg-gradient-to-r" />
                </div>

                {/* Details */}
                <div className="sm:col-span-3 p-6 sm:p-10 flex flex-col justify-center space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }} data-testid="spotlight-name">
                        {companion.name}
                      </h2>
                      {companion.verified && (
                        <BadgeCheck className="w-6 h-6 shrink-0" style={{ color: accent }} />
                      )}
                    </div>
                    {companion.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5" data-testid="spotlight-city">
                        <MapPin className="w-3.5 h-3.5" /> {companion.city}
                      </p>
                    )}
                  </div>

                  {companion.tagline && (
                    <p className={`text-base leading-relaxed italic ${isDark ? 'text-white/60' : 'text-slate-600'}`} data-testid="spotlight-tagline">
                      "{companion.tagline}"
                    </p>
                  )}

                  {companion.spotlight_reason && (
                    <div className="px-4 py-3 rounded-xl text-xs font-bold" style={{ background: `${accent}08`, border: `1px solid ${accent}15`, color: accent }}>
                      <Crown className="w-3.5 h-3.5 inline mr-1.5" />
                      {companion.spotlight_reason}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {companion.avg_rating > 0 && (
                      <div className="flex items-center gap-2" data-testid="spotlight-rating">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className="w-4 h-4" fill={s <= Math.round(companion.avg_rating) ? '#f59e0b' : 'none'} stroke={s <= Math.round(companion.avg_rating) ? '#f59e0b' : 'currentColor'} />
                          ))}
                        </div>
                        <span className="text-sm font-bold">{companion.avg_rating.toFixed(1)}</span>
                        {companion.total_reviews > 0 && (
                          <span className="text-xs text-muted-foreground">({companion.total_reviews} reviews)</span>
                        )}
                      </div>
                    )}
                  </div>

                  {companion.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-2" data-testid="spotlight-specialties">
                      {companion.specialties.map((s, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}20` }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link to="/browse">
                    <Button
                      className="w-full sm:w-auto h-12 px-10 font-bold text-sm rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                      style={{ background: accentGrad, color: '#fff', border: 'none' }}
                      data-testid="spotlight-browse-btn"
                    >
                      <Sparkles className="w-4 h-4 mr-2" /> Browse Companions <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 space-y-4" data-testid="spotlight-empty">
              <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center" style={{ background: `${accent}10` }}>
                <Crown className="w-10 h-10 opacity-40" style={{ color: accent }} />
              </div>
              <h3 className="text-lg font-bold">No Spotlight Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Our star companion of the week will be featured here soon. Check back later!
              </p>
              <Link to="/browse">
                <Button className="mt-4 h-11 px-8 font-bold rounded-xl" style={{ background: accentGrad, color: '#fff', border: 'none' }}>
                  Browse Companions
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
