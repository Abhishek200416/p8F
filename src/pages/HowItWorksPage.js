import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Shield, Star, ArrowRight, Users, Calendar, MessageSquare, BadgeCheck, MapPin, Camera, AlertTriangle } from 'lucide-react';

const STEPS = [
  {
    step: '01', title: 'Sign Up Free', icon: Users,
    desc: 'Create your account with email. Confirm you are 18+. Accept the platform Terms & Conditions and safety guidelines. Your account is verified via email OTP.',
    tips: ['Takes under 2 minutes', 'Email OTP verification', '18+ identity required', 'Free to join']
  },
  {
    step: '02', title: 'Complete Your Profile', icon: Camera,
    desc: 'Fill your profile in two modes — Casual and Professional. Upload real photos and verify your face using AI-powered identity matching. Choose your hobbies, interests, and set your location.',
    tips: ['Upload up to 5 photos', 'AI face verification for trust', 'Set casual & professional details', 'Add emergency contact']
  },
  {
    step: '03', title: 'Browse Companions', icon: Star,
    desc: 'Switch between Professional and Casual mode in the header to see relevant companions. Filter by location, gender, category, rating, age, and hobbies. View detailed companion profiles with photos, reviews, and pricing.',
    tips: ['Mode-aware filtering', 'Advanced filter options', 'See verified companions first', 'Real-time online status']
  },
  {
    step: '04', title: 'Send Booking Request', icon: Calendar,
    desc: 'Send a booking request with event details — event name, type, public venue address, date, time, and duration. All meetings must be at public venues. No private location meetings allowed.',
    tips: ['Only public venues accepted', 'Companion reviews your request', 'Specify event type clearly', '1-8 hour booking durations']
  },
  {
    step: '05', title: 'Chat Safely', icon: MessageSquare,
    desc: 'Once the companion accepts, you can chat within the platform. All messages are monitored by AI for safety violations. Never share personal contact info, social media, or private venue details in chat.',
    tips: ['AI-moderated chat', 'No contact info allowed', 'Flagged messages reviewed', '3 strikes = account suspension']
  },
  {
    step: '06', title: 'Meet at Public Venue', icon: MapPin,
    desc: 'Meet your companion at the agreed public venue. Use the SOS panic button in your dashboard if you ever feel unsafe — it immediately alerts your emergency contact and our safety team.',
    tips: ['Public venues only', 'SOS sends instant alert emails', 'Share live location with a trusted friend', 'Emergency contact notified on SOS']
  },
  {
    step: '07', title: 'Rate & Review', icon: BadgeCheck,
    desc: 'After your experience, leave an honest review and star rating. Reviews help other users make informed decisions. Companions with 5+ reviews and face verification earn the PlusOneStar Elite badge.',
    tips: ['Star ratings 1–5', 'Written reviews required', '5+ reviews = Elite badge consideration', 'Helps the community']
  },
];

const SAFETY_RULES = [
  'Always meet at verified, public venues (restaurants, hotels, museums, malls)',
  'Never share your home address, phone number, or private contact info in chat',
  'Use the SOS panic button immediately if you feel unsafe or threatened',
  'Share your meeting location with a trusted friend or family member',
  'All companions must have verified photos — check the verified badge',
  'Do not transfer money outside the platform — use only the booking payment system',
  'Report any suspicious behavior using the Report Profile button',
  'Minors (under 18) are strictly prohibited from using this platform',
];

export default function HowItWorksPage() {
  const { mode, theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const isPro = mode === 'professional';
  const accentColor = isPro ? '#3b82f6' : '#f43f5e';
  const heroBg = isDark
    ? (isPro ? 'linear-gradient(160deg,#060b18,#0d1729)' : 'linear-gradient(160deg,#130208,#1f0516)')
    : (isPro ? 'linear-gradient(160deg,#f8fafc,#f1f5f9)' : 'linear-gradient(160deg,#fff1f2,#ffe4e6)');

  return (
    <div className="min-h-screen bg-background pb-16" data-testid="how-it-works-page">
      {/* Header */}
      <div className="w-full py-1 px-4 text-center text-[10px] font-medium" style={{ background: `${accentColor}10`, borderBottom: `1px solid ${accentColor}20`, color: accentColor }}>
        All interactions at your own risk. 18+ platform. Public venues only. <a href="/terms" className="underline ml-1">Terms apply</a>
      </div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isPro ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
              <Star className="w-4 h-4 text-black" />
            </div>
            <span className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>PlusOneStar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to={user ? '/dashboard' : '/'}><Button variant="ghost" size="sm" className="text-xs">{user ? 'Dashboard' : 'Home'}</Button></Link>
            {!user && <Link to="/auth"><Button size="sm" className="text-xs btn-pro" style={{ background: isPro ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'linear-gradient(135deg,#f43f5e,#e11d48)', color: '#fff', border: 'none' }}>Join Free</Button></Link>}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center" style={{ background: heroBg }}>
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Complete Guide</p>
          <h1 className={`text-4xl sm:text-5xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-heading)' }}>How PlusOneStar Works</h1>
          <p className={`text-lg leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            A step-by-step guide to finding and booking companions for events — safely, transparently, and confidently.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {STEPS.map(({ step, title, icon: Icon, desc, tips }, i) => (
            <div key={i} className="flex gap-6 p-6 rounded-2xl border border-border/20 bg-card card-hover">
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white" style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}99)` }}>
                  {step}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: accentColor }} />
                  <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {tips.map((tip, j) => (
                    <div key={j} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 shrink-0" style={{ color: accentColor }} />{tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety Rules */}
      <section className="py-12 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Safety First</p>
            <h2 className="text-2xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>Platform Safety Rules</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {SAFETY_RULES.map((rule, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-border/20 bg-card text-sm">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentColor }} />
                <span className="text-muted-foreground">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-lg mx-auto space-y-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Ready to Find Your Companion?</h2>
          <p className="text-sm text-muted-foreground">Join thousands of users having amazing experiences across India.</p>
          <Link to={user ? '/dashboard' : '/auth'}>
            <Button size="lg" className="btn-pro btn-glow px-8" style={{ background: isPro ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'linear-gradient(135deg,#f43f5e,#e11d48)', color: '#fff', border: 'none' }}>
              {user ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" style={{ color: accentColor }} /> Free to join</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" style={{ color: accentColor }} /> 18+ verified</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" style={{ color: accentColor }} /> All at your own risk</span>
          </div>
        </div>
      </section>
    </div>
  );
}
