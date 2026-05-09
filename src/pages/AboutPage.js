import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Shield, Users, Target, Heart, ArrowRight, Mail, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const TEAM_VALUES = [
  { icon: Shield, title: 'Safety First', desc: 'Every feature is built with user safety as the top priority. From AI chat monitoring to SOS alerts and face verification.' },
  { icon: Users, title: 'Verified Community', desc: 'All profiles go through AI-powered verification. Fake accounts are removed immediately. Trust is our foundation.' },
  { icon: Target, title: 'Public Only', desc: 'We strictly enforce public venue meetings. No private meetups, no escort services — only genuine social connections.' },
  { icon: Heart, title: 'Genuine Connections', desc: 'We believe in authentic human connection for events and experiences. Not dating, not escorts — real companionship.' },
];

const STATS = [
  { value: '5,000+', label: 'Verified Companions' },
  { value: '50+', label: 'Event Categories' },
  { value: '98%', label: 'User Satisfaction' },
  { value: '100%', label: 'Public Venues Policy' },
];

export default function AboutPage() {
  const { mode, theme } = useTheme();
  const { user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ name: '', email: '', subject: 'General Form Feedback', message: '' });
  
  const isDark = theme === 'dark';
  const isPro = mode === 'professional';
  const accentColor = isPro ? '#3b82f6' : '#f43f5e';
  const heroBg = isDark
    ? (isPro ? 'linear-gradient(160deg,#060b18,#0d1729)' : 'linear-gradient(160deg,#130208,#1f0516)')
    : (isPro ? 'linear-gradient(160deg,#f8fafc,#f1f5f9)' : 'linear-gradient(160deg,#fff1f2,#ffe4e6)');

  return (
    <div className="min-h-screen bg-background pb-16" data-testid="about-page">
      <div className="w-full py-1 px-4 text-center text-[10px] font-medium" style={{ background: `${accentColor}10`, borderBottom: `1px solid ${accentColor}20`, color: accentColor }}>
        All interactions at your own risk. 18+ platform. <a href="/terms" className="underline ml-1">Terms apply</a>
      </div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="PlusOneStar Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>PlusOneStar</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/how-it-works"><Button variant="ghost" size="sm" className="text-xs">How It Works</Button></Link>
            {user ? (
              <Link to="/dashboard"><Button size="sm" className="text-xs" style={{ background: isPro ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'linear-gradient(135deg,#f43f5e,#e11d48)', color: '#fff', border: 'none' }}>Dashboard</Button></Link>
            ) : (
              <Link to="/auth"><Button size="sm" className="text-xs" style={{ background: isPro ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'linear-gradient(135deg,#f43f5e,#e11d48)', color: '#fff', border: 'none' }}>Join Free</Button></Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 relative overflow-hidden" style={{ background: heroBg }}>
        <div className="blob w-64 h-64 top-0 right-0 opacity-15" style={{ background: accentColor }} />
        <div className="max-w-3xl mx-auto text-center space-y-5 relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Our Story</p>
          <h1 className={`text-4xl sm:text-5xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-heading)' }}>About PlusOneStar</h1>
          <p className={`text-lg leading-relaxed max-w-2xl mx-auto ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            India's first dedicated companion platform for genuine, safe, and transparent social and professional event experiences. We're redefining what it means to never go to an event alone.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Our Mission</p>
            <h2 className="text-3xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>Making Social Events Better for Everyone</h2>
            <p className="text-muted-foreground leading-relaxed">
              PlusOneStar was built on a simple idea: everyone deserves a companion for life's important moments. Whether it's a corporate gala, an art opening, a dinner, or a concert — no one should have to go alone.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We built the most safety-focused companion platform in India, with AI moderation, face verification, SOS alerts, and a strict public-venues-only policy.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {STATS.map(({ value, label }, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border/20 bg-card text-center card-hover">
                <p className="text-2xl font-black" style={{ color: accentColor, fontFamily: 'var(--font-heading)' }}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Our Values</p>
            <h2 className="text-2xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>What We Stand For</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {TEAM_VALUES.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border/20 bg-card card-gold-glow">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${accentColor}15` }}>
                  <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <h3 className="text-sm font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we're NOT */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
            <h3 className="text-lg font-bold mb-4 text-red-500 flex items-center gap-2">
              <Shield className="w-5 h-5" /> What PlusOneStar is NOT
            </h3>
            <div className="space-y-2">
              {[
                'PlusOneStar is NOT a dating app or romantic companion service',
                'PlusOneStar is NOT an escort or adult entertainment service',
                'PlusOneStar does NOT facilitate private, closed-door meetings',
                'PlusOneStar does NOT allow sharing of personal contact information in chat',
                'PlusOneStar is NOT for users under 18 years of age',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-red-500 font-bold shrink-0">×</span> {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 px-4 bg-muted/10">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Get in Touch</h2>
          <p className="text-sm text-muted-foreground">Have questions, concerns, or feedback? We'd love to hear from you.</p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Mail className="w-4 h-4" style={{ color: accentColor }} />
            <a href="mailto:support@plusonestar.com" className="hover:underline" style={{ color: accentColor }}>support@plusonestar.com</a>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link to={user ? '/dashboard' : '/auth'}>
              <Button className="btn-pro btn-glow px-8" style={{ background: isPro ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'linear-gradient(135deg,#f43f5e,#e11d48)', color: '#fff', border: 'none' }}>
                {user ? 'Go to Dashboard' : 'Join the Platform'} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setShowFeedback(!showFeedback)} className="gap-2">
              Send Feedback {showFeedback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Feedback Form Dropdown */}
          {showFeedback && (
            <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-xl animate-slide-up text-left space-y-4 max-w-md mx-auto">
              <div>
                <Label className="text-xs">Your Name</Label>
                <Input value={feedback.name} onChange={(e) => setFeedback({ ...feedback, name: e.target.value })} placeholder="John Doe" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Your Email</Label>
                <Input type="email" value={feedback.email} onChange={(e) => setFeedback({ ...feedback, email: e.target.value })} placeholder="john@example.com" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Reason/Subject</Label>
                <Input value={feedback.subject} onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })} placeholder="Bug report, feature request..." className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Your Message</Label>
                <Textarea value={feedback.message} onChange={(e) => setFeedback({ ...feedback, message: e.target.value })} placeholder="Tell us what you think..." className="mt-1 min-h-[100px]" />
              </div>
              <Button 
                className="w-full text-white font-bold" 
                style={{ background: accentColor }}
                disabled={!feedback.name || !feedback.email || !feedback.message}
                onClick={() => {
                  const mailto = `mailto:support@plusonestar.com?subject=${encodeURIComponent(feedback.subject + ' (from ' + feedback.name + ')')}&body=${encodeURIComponent("Name: " + feedback.name + "\nEmail: " + feedback.email + "\n\nMessage:\n" + feedback.message)}`;
                  window.location.href = mailto;
                  setShowFeedback(false);
                }}
              >
                Assemble & Send Email <Mail className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
