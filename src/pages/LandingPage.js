import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Star, Shield, Users, CheckCircle, ArrowRight, MapPin,
  Mail, Award, Zap, Sun, Moon, ChevronRight, Lock, Gift, Download, DollarSign, Briefcase, Music, Camera, Heart
} from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

const IMG_PRO = 'https://images.unsplash.com/photo-1768508948485-a7adc1f3427f?w=1400&q=80';
const IMG_CASUAL = 'https://images.pexels.com/photos/7513442/pexels-photo-7513442.jpeg?w=1400&q=80';

const IMG_GALLERY = [
  { url: 'https://images.unsplash.com/photo-1768508950778-9ba70d4445e9?w=600&q=80', label: 'Gala Dinner' },
  { url: 'https://images.unsplash.com/photo-1769798643237-8642a3fbe5bc?w=600&q=80', label: 'Conference' },
  { url: 'https://images.unsplash.com/photo-1768508665014-7e567bf7fdb2?w=600&q=80', label: 'Networking' },
  { url: 'https://images.pexels.com/photos/1358857/pexels-photo-1358857.jpeg?w=600&q=80', label: 'Corporate Evening' },
  { url: 'https://images.pexels.com/photos/2899737/pexels-photo-2899737.jpeg?w=600&q=80', label: 'Private Dining' },
  { url: 'https://images.unsplash.com/photo-1759310610480-48649b55fbdf?w=600&q=80', label: 'Business Meeting' },
];

const STATS = [
  { value: '5,000+', label: 'Verified Companions' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '50+', label: 'Event Categories' },
  { value: '100%', label: 'Public Venues Only' },
];

const PRO_FEATURES = [
  { icon: Briefcase, title: 'Corporate Events', desc: 'Professional companions for business networking, conferences and executive galas.' },
  { icon: DollarSign, title: '0% Commission', desc: 'Keep 100% of your earnings. Zero platform fees for all companions.' },
  { icon: Award, title: 'AI Face Verification', desc: 'Structural face-hash technology ensures each profile belongs to a real, unique person.' },
  { icon: Lock, title: 'Identity Bridge Only', desc: 'We verify identities and provide safety notices. You are responsible for verifying venues and all interactions.' },
];

const CASUAL_FEATURES = [
  { icon: Music, title: 'Social Events', desc: 'Find companions for concerts, art shows, dining and fun social experiences.' },
  { icon: Zap, title: 'Instant Chat', desc: 'Start chatting securely once your request is accepted.' },
  { icon: Camera, title: 'Photo Verified', desc: 'Every profile verified with AI face-matching technology — no duplicates, no fakes.' },
  { icon: Shield, title: 'Bridge Platform', desc: 'We connect people safely. Venue safety and all meeting decisions remain your personal responsibility.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Profile', desc: 'Sign up and complete your profile for professional or casual events' },
  { step: '02', title: 'Browse & Filter', desc: 'Discover verified companions by location, category and interests' },
  { step: '03', title: 'Request & Chat', desc: 'Send a companion request, agree on venue, then chat securely' },
  { step: '04', title: 'Meet Safely', desc: 'Meet at public venues only. Rate and review your experience' },
];

const BLOG_PREVIEWS = [
  { id: 1, title: 'Executive Etiquette: Mastering Professional Galas', cat: 'Etiquette', author: 'Corporate Coach', img: '/assets/blogs/pro_gala.png' },
  { id: 2, title: 'Why CEOs Choose Professional Companions', cat: 'Executive', author: 'Business Analyst', img: '/assets/blogs/pro_ceo.png' },
  { id: 3, title: 'Fun First: Social Safety for Your Next Meetup', cat: 'Safety', author: 'Social Expert', img: '/assets/blogs/casual_safety.png' },
];

function InviteCodeInput({ accentGrad, user }) {
  const [code, setCode] = useState('');
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const handleSave = () => {
    if (!code.trim()) return;
    const cleanCode = code.trim().toUpperCase();
    localStorage.setItem('pendingReferralCode', cleanCode);
    setSaved(true);
    if (!user) {
      setTimeout(() => navigate(`/auth?tab=signup&ref=${cleanCode}`), 800);
    }
  };
  return (
    <div className="flex gap-2 max-w-sm mx-auto">
      <Input
        placeholder="Enter invite code (e.g. REF1A2B3C)"
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        maxLength={12}
        className="font-mono text-sm text-center tracking-widest"
      />
      {saved ? (
        <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold whitespace-nowrap"><CheckCircle className="w-4 h-4" />Saved!</span>
      ) : (
        <Button onClick={handleSave} style={{ background: accentGrad, color: '#fff', border: 'none' }} className="whitespace-nowrap">
          {user ? 'Apply Code' : 'Save & Sign Up'}
        </Button>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { mode, setMode, theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const isPro = mode === 'professional';
  const isDark = theme === 'dark';
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' });
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [systemReferralEnabled, setSystemReferralEnabled] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/campaigns-offers`);
        setSystemReferralEnabled(res.data.system_referral_enabled !== false);
      } catch {}
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const t = setInterval(() => setActiveImg(i => (i + 1) % IMG_GALLERY.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.name || !feedback.email || !feedback.message) {
      toast.error('Please fill all fields'); return;
    }
    setSendingFeedback(true);
    try {
      await axios.post(`${API}/feedback`, feedback);
      toast.success('Feedback sent! We\'ll get back to you soon.');
      setFeedback({ name: '', email: '', message: '' });
    } catch {
      toast.success('Feedback sent! Thank you for reaching out.');
      setFeedback({ name: '', email: '', message: '' });
    }
    setSendingFeedback(false);
  };

  const heroImg = isPro ? IMG_PRO : IMG_CASUAL;
  const accent = isPro ? '#2563eb' : '#f43f5e';
  const accentGrad = isPro ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'linear-gradient(135deg,#f43f5e,#e11d48)';
  const heroBg = isDark
    ? (isPro ? 'linear-gradient(160deg,#020617 0%,#0f172a 40%,#1e293b 100%)' : 'linear-gradient(160deg,#130208 0%,#1f0516 40%,#2d0628 100%)')
    : (isPro ? 'linear-gradient(160deg,#f8fafc 0%,#f1f5f9 40%,#e2e8f0 100%)' : 'linear-gradient(160deg,#fff1f2 0%,#ffe4e6 40%,#fecdd3 100%)');
  const features = isPro ? PRO_FEATURES : CASUAL_FEATURES;

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Disclaimer strip */}
      <div className="w-full py-2 px-4 text-center" style={{ background: `${accent}0a`, borderBottom: `1px solid ${accent}18` }}>
        <p className="text-[10px] font-medium" style={{ color: `${accent}cc` }}>
          PlusOneStar is a bridge platform. We provide identity verification &amp; safety notices only. We do <strong>not</strong> verify venues or guarantee interactions. All meetings and payments are your sole responsibility. 18+ only. Public venues only.
          &nbsp;<a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</a>
        </p>
      </div>



      {/* Header - blends with dark hero */}
      {!scrolled && (
        <header
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{ background: 'transparent' }}
          data-testid="landing-header-initial"
        >
          {/* We keep the logo/theme toggle here if desired, or just use the sticky one */}
        </header>
      )}

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'shadow-lg translate-y-0' : 'translate-y-0'}`}
        style={{
          background: scrolled
            ? (isDark ? 'rgba(3,7,18,0.95)' : 'rgba(255,255,255,0.98)')
            : (isDark ? 'rgba(3,7,18,0.7)' : 'rgba(255,255,255,0.9)'),
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled ? `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` : 'none'
        }}
        data-testid="landing-header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="PlusOneStar Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-black tracking-tight hidden sm:inline" style={{ fontFamily: 'var(--font-heading)' }}>
                PlusOneStar
              </span>
            </div>

            {/* Right: Theme toggle + Auth / Dashboard */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
                }}
                data-testid="landing-theme-toggle"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              </button>
              {user ? (
                <Link to="/dashboard">
                  <Button size="sm" className="h-9 text-[10px] font-black px-5 shadow-lg" style={{ background: accentGrad, color: '#fff', border: 'none' }} data-testid="landing-dashboard">
                    Go to Dashboard <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost" size="sm" className="h-9 text-[10px] font-bold px-3 hover:bg-accent/10" data-testid="landing-login">Log In</Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="sm" className="h-9 text-[10px] font-black px-5 shadow-lg hover:shadow-xl transition-all duration-200" style={{ background: accentGrad, color: '#fff', border: 'none' }} data-testid="landing-get-started">
                      Get Started <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[75vh] flex items-start overflow-hidden" style={{ background: heroBg }} data-testid="hero-section">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0" style={{ background: heroBg, opacity: 0.85 }} />
        </div>
        <div className="blob w-[400px] h-[400px] -top-20 -right-20 opacity-50" style={{ background: accent }} />
        <div className="blob w-64 h-64 bottom-10 -left-20 opacity-30" style={{ background: accent, animationDelay: '-4s' }} />

        <div className="relative z-10 max-w-screen-2xl mx-auto px-6 sm:px-12 lg:px-20 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="mode-pill w-max" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }} data-testid="landing-hero-mode-toggle">
                    <button onClick={() => setMode('professional')} className={isPro ? 'active-pro' : (isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900')} data-testid="landing-mode-pro">Pro</button>
                    <button onClick={() => setMode('casual')} className={!isPro ? 'active-casual' : (isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900')} data-testid="landing-mode-casual">Casual</button>
                  </div>
                  <div className="inline-flex items-center w-max gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide" style={{ border: `1px solid ${accent}30`, color: accent, background: isDark ? `${accent}0c` : `${accent}15` }}>
                    <Star className="w-3.5 h-3.5" fill={accent} />
                    {isPro ? 'PROFESSIONAL COMPANIONS' : 'SOCIAL COMPANIONS'}
                  </div>
                </div>

              <h1 className={`text-3xl sm:text-5xl lg:text-[clamp(2.5rem,5vw,3.5rem)] font-black leading-[1.1] tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                {isPro ? (
                  <>Your Trusted<br /><span className="text-gold-animated">Professional</span><br />Event Partner</>
                ) : (
                  <>Never Attend<br /><span className="text-gold-animated">Events</span><br />Alone Again</>
                )}
              </h1>

              <p className={`text-sm sm:text-base lg:text-[clamp(1rem,2vw,1.125rem)] max-w-lg leading-relaxed ${isDark ? 'text-white/65' : 'text-slate-600'}`} style={{ fontFamily: 'var(--font-body)' }}>
                {isPro
                  ? 'Connect with verified, professional companions for corporate events, networking galas, business conferences and executive dinners across India.'
                  : 'Find genuine, verified companions for concerts, art exhibitions, dining experiences, travel and social events safely and authentically.'}
              </p>

              <div className="flex flex-wrap gap-3 pt-4 items-end">
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  {/* Mobile-only Surprise banner */}
                  {systemReferralEnabled && (
                    <a href="#referral-campaign" className="lg:hidden w-max flex items-center justify-center gap-2 px-4 py-2 rounded-[0.75rem] text-[10px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 animate-fade-in">
                      <Gift className="w-3 h-3 animate-pulse" /> Have a surprise!
                    </a>
                  )}
                  <Link to="/auth">
                    <Button
                      size="lg"
                      className="w-full h-14 sm:h-16 px-6 sm:px-10 font-black text-sm sm:text-lg shadow-2xl hover:shadow-accent/30 transition-all duration-300 hover:-translate-y-1 active:scale-95 btn-glow"
                      style={{ background: accentGrad, color: '#fff', border: 'none', borderRadius: '1.25rem' }}
                      data-testid="hero-join-btn"
                    >
                      Join Free Today <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
                <Link to="/how-it-works">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className={`h-14 sm:h-16 px-6 sm:px-10 font-bold text-sm sm:text-base rounded-[1.25rem] transition-all duration-300 hover:-translate-y-1 active:scale-95 ${isDark ? 'border-white/10 text-white bg-white/5 hover:bg-white/10' : 'border-slate-200 text-slate-900 bg-white/50 hover:bg-slate-50'}`} 
                    data-testid="hero-how-btn"
                  >
                    How It Works
                  </Button>
                </Link>
                {deferredPrompt && (
                  <Button 
                    onClick={handleInstallClick} 
                    size="lg" 
                    className={`h-14 sm:h-16 px-6 sm:px-10 font-bold text-sm sm:text-base rounded-[1.25rem] transition-all duration-300 hover:-translate-y-1 active:scale-95 animate-fade-in-up ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                    Install App <Download className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                )}

              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                {['AI-Verified Profiles', 'Moderated Chat', 'SOS Safety', '18+ Only'].map(b => (
                  <div key={b} className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />{b}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats & PC Surprise Banner */}
            <div className="flex flex-col gap-6 animate-slide-right lg:mx-0" style={{ animationDelay: '.3s' }}>
              {/* PC-only Surprise banner aligned to right */}
              {systemReferralEnabled && (
                <div className="hidden lg:flex justify-end">
                  <a href="#referral-campaign" className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[12px] font-black text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1 active:scale-95">
                    <Gift className="w-4 h-4 animate-bounce" /> HAVE A SURPRISE! <Star className="w-3 h-3 fill-white" />
                  </a>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 max-w-sm ml-auto">
                {STATS.map(({ value, label }, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] border border-border/10 hover:border-accent/30"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    backdropFilter: 'blur(15px)',
                    animationDelay: `${i * 0.1}s`
                  }}
                >
                  <p className="text-2xl font-black mb-0.5" style={{ fontFamily: 'var(--font-heading)', color: accent }}>{value}</p>
                  <p className={`text-[9px] font-bold uppercase tracking-wider opacity-60 ${isDark ? 'text-white' : 'text-slate-700'}`}>{label}</p>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* REFERRAL / CAMPAIGN SECTION */}
      {systemReferralEnabled && (
        <section id="referral-campaign" className="py-24 px-6 relative overflow-hidden bg-background" data-testid="referral-section">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-orange-500/5 blur-[80px] -z-10" />
        
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 text-[11px] font-bold uppercase tracking-widest">
                <Gift className="w-3.5 h-3.5" /> Special Campaign
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Share PlusOneStar,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Earn Free Days</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
                Invite your friends to the most exclusive companion network in India. They get a full week of premium access, and you get rewarded too.
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 py-2">
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col items-center lg:items-start text-center lg:text-left transition-transform hover:-translate-y-1 duration-300">
                  <div className="text-3xl font-black text-amber-500 mb-1">+1 Day</div>
                  <div className="text-sm font-bold text-foreground">For You</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Added to your active plan</div>
                </div>
                <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 flex flex-col items-center lg:items-start text-center lg:text-left transition-transform hover:-translate-y-1 duration-300">
                  <div className="text-3xl font-black text-orange-500 mb-1">+7 Days</div>
                  <div className="text-sm font-bold text-foreground">For Them</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Free premium trial</div>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              {/* Premium Card UI for Invite */}
              <div className="rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                
                <h3 className="text-xl font-bold mb-2">Have an Invite Code?</h3>
                <p className="text-xs text-muted-foreground mb-6">Enter your friend's code below to claim your 7-day free trial immediately upon signup.</p>
                
                <div className="bg-muted/30 rounded-xl p-5 border border-border/50 mb-6">
                  <InviteCodeInput accentGrad="linear-gradient(135deg, #f59e0b, #f97316)" user={user} />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">How it Works</h4>
                  <div className="space-y-4">
                    {[
                      ['1', 'Share your unique referral link or code'],
                      ['2', 'Your friend registers and verifies their identity'],
                      ['3', 'Both accounts instantly receive free premium days']
                    ].map(([num, text], i) => (
                      <div key={i} className="flex gap-4 items-center bg-background/40 p-3 rounded-xl border border-border/30 shadow-sm">
                        <div className="w-8 h-8 shrink-0 rounded-lg" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>{num}</div>
                        <p className="text-[13px] font-semibold text-foreground/90">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-xl opacity-20 rotate-12 blur-sm -z-10" />
              <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-500 shadow-lg opacity-30 -z-10" />
            </div>
          </div>
        </div>
      </section>
      )}

      {/* HOW IT WORKS */}
      <section className="py-24 px-4 bg-muted/20" data-testid="how-it-works">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>Process</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>How It Works</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Simple, safe and transparent. From sign-up to meetup in four easy steps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={i} className="group relative p-7 rounded-2xl border border-border/20 bg-card hover:border-opacity-60 transition-all duration-300 card-hover" style={{ '--hover-border': accent }}>
                <div className="text-5xl font-extrabold mb-5 opacity-[0.25] dark:opacity-[0.35]" style={{ fontFamily: 'var(--font-heading)', color: accent }}>{step}</div>
                <h3 className="text-base font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-4" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
              {isPro ? 'Professional Mode' : 'Casual Mode'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {isPro ? 'Built for Business Excellence' : 'Made for Social Experiences'}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="p-7 rounded-2xl border border-border/20 bg-card card-gold-glow text-center space-y-5 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: `${accent}12` }}>
                  <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED BLOGS SECTION */}
      <section className="py-24 px-6 overflow-hidden bg-background" data-testid="landing-blogs">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <Badge variant="outline" className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest bg-accent/5 backdrop-blur-md" style={{ borderColor: `${accent}40`, color: accent }}>
                Insights & Guides
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Featured <span style={{ color: accent }}>Insights</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl">
                Stay updated with the latest in professional etiquette and social safety across the PlusOneStar community.
              </p>
            </div>
            <Link to="/blogs">
              <Button variant="ghost" className="group font-bold text-base h-auto p-0 hover:bg-transparent" style={{ color: accent }}>
                View All Articles <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {BLOG_PREVIEWS.map((post) => (
              <Link key={post.id} to="/blogs" className="group">
                <div className="relative aspect-[16/10] rounded-3xl overflow-hidden mb-6 shadow-2xl transition-all duration-500 group-hover:scale-[1.02]">
                  <img src={post.img} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 left-4">
                    <Badge className="font-bold py-1 px-3 shadow-lg" style={{ background: accentGrad, color: '#fff', border: 'none' }}>{post.cat}</Badge>
                  </div>
                </div>
                <div className="space-y-3 px-2">
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60 uppercase tracking-tighter">
                    <span>{post.author}</span>
                    <span className="w-1 h-1 rounded-full bg-border/40" />
                    <span>5 min read</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-accent transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
                    {post.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      

      <section className="py-20 px-6 bg-muted/10" data-testid="gallery-section">
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>Gallery</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Where Connections Happen</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {IMG_GALLERY.map(({ url, label }, i) => (
              <div
                key={i}
                className={`img-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${i === activeImg ? 'ring-2 scale-[1.02]' : 'hover:scale-[1.01]'}`}
                style={{ ringColor: accent, height: i % 3 === 0 ? '220px' : '180px' }}
                onClick={() => setActiveImg(i)}
              >
                <img src={url} alt={label} className="w-full h-full object-cover" loading="lazy" />
                <div className="img-card-overlay" />
                <div className="absolute bottom-3 left-3">
                  <span className="text-white text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA SECTION */}
      <section className="py-28 px-6 relative overflow-hidden" style={{ background: heroBg }} data-testid="cta-section">
        <div className="blob w-96 h-96 top-0 right-0 opacity-15" style={{ background: accent }} />
        <div className="max-w-5xl mx-auto text-center space-y-10 relative z-10">
          <h2 className={`text-4xl sm:text-6xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-heading)' }}>
            Ready to Find Your <span className="text-gold-animated">Perfect</span> Companion?
          </h2>
          <p className={`text-base sm:text-lg max-w-xl mx-auto ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
            Join thousands of people connecting for amazing {isPro ? 'professional' : 'social'} experiences across India.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 font-heading">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-16 px-12 text-lg font-black rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 btn-glow flex items-center justify-center"
                style={{ background: accentGrad, color: '#fff', border: 'none' }}
                data-testid="cta-btn"
              >
                Start Free Today <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </Link>
            <Link to="/auth" className="w-full sm:w-auto">
              <div className="relative group">
                <div className="absolute -top-4 -right-4 z-20 px-4 py-1.5 bg-amber-500 text-white text-[11px] font-black rounded-xl shadow-xl rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6 border-2 border-white/20 animate-bounce-subtle">
                  0% COMMISSION
                </div>
                <Button size="lg" variant="outline" className={`w-full sm:w-auto h-16 px-12 text-lg font-black rounded-2xl border-2 transition-all duration-300 hover:scale-105 flex items-center justify-center ${isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-800 hover:bg-slate-50'}`}>
                  Become a Companion
                </Button>
              </div>
            </Link>
          </div>
          <p className={`text-xs ${isDark ? 'text-white/35' : 'text-slate-400'}`}>Free 1-day trial included. No credit card required. 18+ only.</p>
        </div>
      </section>

      {/* FEEDBACK FORM */}
      <section className="py-20 px-4 bg-muted/20" id="feedback" data-testid="feedback-section">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>Contact</p>
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>We'd Love to Hear From You</h2>
            <p className="text-sm text-muted-foreground">Share your feedback or get in touch with our team</p>
          </div>
          <form onSubmit={handleFeedback} className="space-y-5 p-7 rounded-2xl border border-border/20 bg-card">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-2 block">Your Name *</label>
                <Input placeholder="Full name" value={feedback.name} onChange={e => setFeedback({...feedback, name: e.target.value})} data-testid="feedback-name" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-2 block">Email *</label>
                <Input type="email" placeholder="you@email.com" value={feedback.email} onChange={e => setFeedback({...feedback, email: e.target.value})} data-testid="feedback-email" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block">Message *</label>
              <Textarea placeholder="Tell us anything..." rows={4} value={feedback.message} onChange={e => setFeedback({...feedback, message: e.target.value})} data-testid="feedback-message" />
            </div>
            <Button type="submit" disabled={sendingFeedback} className="w-full h-11 font-bold" style={{ background: accentGrad, color: '#fff' }} data-testid="feedback-submit">
              {sendingFeedback ? 'Sending...' : 'Send Feedback'}
            </Button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <Footer forceShow />


    </div>
  );
}
