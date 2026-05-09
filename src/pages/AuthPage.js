import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock, User, Phone, ShieldCheck, Loader2, Eye, EyeOff, Calendar, Shield, Star, CheckCircle, KeyRound } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

const getErr = (err, def) => {
  const d = err?.response?.data?.detail;
  return Array.isArray(d) ? d[0]?.msg : (typeof d === 'string' ? d : def);
};

const IMG_BG = 'https://images.unsplash.com/photo-1770140304066-6db58fe18543?w=800&q=80';
const IMG_CASUAL = 'https://images.pexels.com/photos/7513442/pexels-photo-7513442.jpeg?w=800&q=80';

export default function AuthPage() {
  const { login } = useAuth();
  const { mode, theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const isPro = mode === 'professional';
  const accentColor = isPro ? '#3b82f6' : '#f43f5e';
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || (searchParams.get('ref') ? 'signup' : 'login'));
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [dobAge, setDobAge] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', otp: '', dob: '' });
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [adminTempToken, setAdminTempToken] = useState('');
  const [secretCode, setSecretCode] = useState('');

  useEffect(() => {
    const code = searchParams.get('ref') || localStorage.getItem('pendingReferralCode');
    if (code) {
      const cleanCode = code.trim().toUpperCase();
      setReferralCode(cleanCode);
      // Fetch referrer name
      axios.get(`${API}/auth/referral-info?code=${cleanCode}`)
        .then(res => setReferrerName(res.data.name))
        .catch(() => {
          // Invalid code, clear it
          localStorage.removeItem('pendingReferralCode');
          setReferralCode('');
        });
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'dob' && value) {
      const today = new Date(), birth = new Date(value);
      let age = today.getFullYear() - birth.getFullYear();
      if (today.getMonth() - birth.getMonth() < 0 || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
      setDobAge(age);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!ageConfirmed) { toast.error('Please confirm you are 18+'); return; }
    if (!termsAccepted) { toast.error('Please accept Terms & Conditions'); return; }
    if (!form.dob) { toast.error('Please provide your Date of Birth'); return; }
    if (dobAge !== null && dobAge < 18) { toast.error('Must be 18 or older'); return; }
    if (!form.email || !form.password || !form.name) { toast.error('Fill all required fields'); return; }
    if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/signup`, { 
        email: form.email, 
        password: form.password, 
        name: form.name, 
        phone: form.phone,
        dob: form.dob,
        ref: referralCode || undefined
      });
      localStorage.removeItem('pendingReferralCode');
      setOtpEmail(form.email);
      setTab('verify');
    } catch (err) { toast.error(getErr(err, 'Signup failed')); }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (form.otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/verify-otp`, { email: otpEmail, otp: form.otp });
      if (res.data.requires_secret_code) {
        setAdminTempToken(res.data.temp_token);
        setSecretCode('');
        setTab('admin-secret');
        toast.info('Admin verification required');
      } else {
        login(res.data.token, res.data.user);
        toast.success('Welcome to PlusOneStar!');
        navigate('/profile', { state: { mustComplete: true } });
      }
    } catch (err) { toast.error(getErr(err, 'Invalid OTP')); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { email: form.email, password: form.password });
      if (res.data.requires_secret_code) {
        setAdminTempToken(res.data.temp_token);
        setSecretCode('');
        setTab('admin-secret');
        toast.info('Admin verification required');
      } else {
        login(res.data.token, res.data.user);
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) { toast.error(getErr(err, 'Login failed')); }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!form.email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: form.email });
      setOtpEmail(form.email);
      setTab('reset-password');
      setForm(prev => ({ ...prev, otp: '' }));
      toast.success('Reset code sent to your email!');
    } catch (err) { toast.error(getErr(err, 'Failed to send reset code')); }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (form.otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    if (!form.password || form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { 
        email: otpEmail, 
        otp: form.otp,
        new_password: form.password
      });
      toast.success('Password reset successfully! Please login.');
      setTab('login');
      setForm(prev => ({ ...prev, password: '', otp: '' }));
    } catch (err) { toast.error(getErr(err, 'Reset failed')); }
    setLoading(false);
  };

  const handleAdminSecretCode = async (e) => {
    e.preventDefault();
    if (!secretCode.trim()) { toast.error('Enter admin secret code'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/verify-admin-code`, { temp_token: adminTempToken, secret_code: secretCode.trim() });
      login(res.data.token, res.data.user);
      toast.success('Admin access granted!');
      navigate('/dashboard');
    } catch (err) { toast.error(getErr(err, 'Invalid secret code')); }
    setLoading(false);
  };

  const handleSendLoginOTP = async (e) => {
    e.preventDefault();
    if (!form.email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { email: form.email });
      setOtpEmail(form.email);
      setTab('verify');
    } catch (err) { toast.error(getErr(err, 'Failed to send OTP')); }
    setLoading(false);
  };

  const inputClass = "h-12 md:h-11 bg-background/50 border-border/40 focus:border-accent/50 transition-all text-sm";

  return (
    <div className="min-h-screen flex" data-testid="auth-page">
      {/* Left panel - decorative image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: isDark ? (isPro ? 'linear-gradient(160deg,#060b18,#0d1729,#101f42)' : 'linear-gradient(160deg,#130208,#1f0516,#2d0628)') : (isPro ? 'linear-gradient(160deg,#f1f5f9,#e2e8f0,#cbd5e1)' : 'linear-gradient(160deg,#fff1f2,#ffe4e6,#fecdd3)') }}>
        <img src={isPro ? IMG_BG : IMG_CASUAL} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="relative z-10 flex flex-col justify-between p-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-xl">
              <img src="/logo.png" alt="PlusOneStar Logo" className="w-full h-full object-contain" />
            </div>
            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-heading)' }}>PlusOneStar</span>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className={`text-4xl font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                {isPro ? 'Your Professional\nCompanion\nAwaits' : 'Find Your\nSocial\nCompanion'}
              </h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                {isPro ? 'Connect with verified professionals for corporate events, galas, and business networking.' : 'Discover genuine companions for concerts, dinners, travel, and social experiences.'}
              </p>
            </div>
            <div className="space-y-3">
              {['Verified & AI-screened profiles', 'Safe, public venue meetings', 'AI-monitored chat system', 'SOS emergency button'].map(f => (
                <div key={f} className={`flex items-center gap-3 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: accentColor }} />{f}
                </div>
              ))}
            </div>
          </div>

          <p className={`text-xs ${isDark ? 'text-white/30' : 'text-slate-400'}`}>18+ platform only. All meetings at public venues.</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-8 pt-6 sm:pt-8 bg-background relative overflow-hidden min-h-screen">
        {/* Subtle background blob for mobile */}
        <div className="lg:hidden absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20" style={{ background: accentColor }} />
        
        <div className="w-full max-w-[440px] space-y-6 animate-scale-in relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-accent transition-all group" data-testid="back-home">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>
 
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl shadow-accent/20 rotate-3">
              <img src="/logo.png" alt="PlusOneStar Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <span className="text-3xl font-black block leading-none tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>PlusOneStar</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-60 mt-1 block">Premium Companion Network</span>
            </div>
          </div>
 
          <div className="p-6 sm:p-10 rounded-[2rem] border border-border/40 bg-card/40 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden group/card transition-all hover:bg-card/50">
            {/* Glossy overlay */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
 
            {/* LOGIN */}
            {tab === 'login' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: accentColor }}>Welcome Back</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Sign in to your private account</p>
                </div>
 
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Email Address</Label>
                    <div className="relative group/input">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-accent transition-colors" />
                      <Input 
                        name="email" 
                        type="email" 
                        autoComplete="email" 
                        placeholder="your@email.com" 
                        className="pl-11 h-14 text-sm bg-background/30 border-border/50 focus:border-accent/50 focus:ring-accent/10 rounded-2xl transition-all" 
                        value={form.email} 
                        onChange={handleChange} 
                        data-testid="login-email" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Secret Password</Label>
                      <button type="button" onClick={() => setTab('forgot-password')} className="text-[10px] font-black text-accent hover:underline decoration-accent/30 underline-offset-4">Forgot Password?</button>
                    </div>
                    <div className="relative group/input">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-accent transition-colors" />
                      <Input 
                        name="password" 
                        type={showPass ? 'text' : 'password'} 
                        autoComplete="current-password" 
                        placeholder="••••••••" 
                        className="pl-11 pr-12 h-14 text-sm bg-background/30 border-border/50 focus:border-accent/50 focus:ring-accent/10 rounded-2xl transition-all" 
                        value={form.password} 
                        onChange={handleChange} 
                        data-testid="login-password" 
                      />
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 font-black text-base btn-glow mt-4 shadow-2xl rounded-2xl transition-all active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none' }} disabled={loading} data-testid="login-submit">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In Now'}
                  </Button>
                </form>
 
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/10" /></div>
                  <div className="relative flex justify-center"><span className="bg-card/0 backdrop-blur-md px-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black">Secure Options</span></div>
                </div>
 
                <Button variant="outline" className="w-full h-14 text-xs font-black uppercase tracking-wider border-border/30 bg-background/10 hover:bg-background/20 rounded-2xl transition-all" onClick={() => setTab('otp-login')} data-testid="login-with-otp">
                  <Mail className="w-4 h-4 mr-3" /> Login via OTP
                </Button>
 
                <p className="text-center text-xs text-muted-foreground font-medium pt-2">
                  New to the network?{' '}
                  <button className="font-black text-accent hover:underline underline-offset-4" onClick={() => setTab('signup')} data-testid="go-signup">Create account</button>
                </p>
              </div>
            )}
 
            {/* SIGNUP */}
            {tab === 'signup' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: accentColor }}>Join the Network</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Create your companion profile</p>
                </div>

                {referralCode && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-amber-500 leading-none">Referred by {referrerName || 'a Friend'}</span>
                        <span className="text-[11px] font-bold text-muted-foreground">Extra 7-Day Trial Applied!</span>
                      </div>
                    </div>
                  </div>
                )}
 
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Name</Label>
                      <div className="relative group/input">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-accent transition-colors" />
                        <Input name="name" autoComplete="name" placeholder="Name" className="pl-11 h-14 text-sm bg-background/30 border-border/50 rounded-2xl transition-all" value={form.name} onChange={handleChange} data-testid="signup-name" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Email</Label>
                      <div className="relative group/input">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-accent transition-colors" />
                        <Input name="email" type="email" autoComplete="email" placeholder="Email" className="pl-11 h-14 text-sm bg-background/30 border-border/50 rounded-2xl transition-all" value={form.email} onChange={handleChange} data-testid="signup-email" />
                      </div>
                    </div>
                  </div>
 
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Create Password</Label>
                    <div className="relative group/input">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-accent transition-colors" />
                      <Input name="password" type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="Min 6 characters" className="pl-11 pr-12 h-14 text-sm bg-background/30 border-border/50 rounded-2xl transition-all" value={form.password} onChange={handleChange} data-testid="signup-password" />
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
 
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Phone</Label>
                      <Input name="phone" placeholder="+91..." className="h-14 text-sm bg-background/30 border-border/50 rounded-2xl transition-all px-4" value={form.phone} onChange={handleChange} data-testid="signup-phone" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Birth Date</Label>
                      <Input 
                        name="dob" 
                        type="date" 
                        max={new Date(new Date().setFullYear(new Date().getFullYear()-18)).toISOString().split('T')[0]} 
                        className="h-14 text-sm bg-background/30 border-border/50 rounded-2xl transition-all px-4" 
                        value={form.dob} 
                        onChange={handleChange} 
                        data-testid="signup-dob" 
                      />
                    </div>
                  </div>
 
                  <div className="rounded-[1.25rem] p-4 space-y-3 bg-muted/10 border border-border/20 backdrop-blur-md">
                    <div className="flex items-center gap-3 group/check">
                      <Checkbox id="age-check" checked={ageConfirmed} onCheckedChange={(v) => setAgeConfirmed(v === true)} className="h-4 w-4 rounded-md border-border/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-none" data-testid="age-checkbox" />
                      <label htmlFor="age-check" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover/check:text-foreground transition-colors cursor-pointer select-none">I confirm I am <strong className="text-amber-500">18 or older</strong></label>
                    </div>
                    <div className="flex items-center gap-3 group/check">
                      <Checkbox id="terms-check" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} className="h-4 w-4 rounded-md border-border/50 data-[state=checked]:bg-accent data-[state=checked]:border-none" data-testid="terms-checkbox" />
                      <label htmlFor="terms-check" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover/check:text-foreground transition-colors cursor-pointer select-none">Accept <a href="/terms" target="_blank" className="text-accent underline underline-offset-4 decoration-accent/30">Terms of Service</a></label>
                    </div>
                  </div>
 
                  <Button type="submit" className="w-full h-14 font-black text-base btn-glow mt-4 shadow-2xl rounded-2xl transition-all active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none' }} disabled={loading} data-testid="signup-submit">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Experience'}
                  </Button>
                </form>
 
                <p className="text-center text-xs text-muted-foreground font-medium pt-2">
                  Already have an account?{' '}
                  <button className="font-black text-accent hover:underline underline-offset-4" onClick={() => setTab('login')} data-testid="go-login">Sign In</button>
                </p>
              </div>
            )}
 
            {/* OTP LOGIN - Redesigned */}
            {tab === 'otp-login' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: accentColor }}>Passwordless</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold px-4">Instant login via email code</p>
                </div>
                <form onSubmit={handleSendLoginOTP} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Email Address</Label>
                    <div className="relative group/input">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-accent transition-colors" />
                      <Input name="email" type="email" autoComplete="email" placeholder="you@email.com" className="pl-11 h-14 text-sm bg-background/30 border-border/50 focus:border-accent/50 transition-all rounded-2xl" value={form.email} onChange={handleChange} data-testid="otp-email" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 font-black text-base btn-glow shadow-2xl rounded-2xl transition-all active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none' }} disabled={loading} data-testid="send-otp-btn">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Secure Code'}
                  </Button>
                </form>
                <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent flex items-center justify-center gap-2 w-full transition-colors" onClick={() => setTab('login')} data-testid="back-to-login">
                  <ArrowLeft className="w-3.5 h-3.5" /> Use Password Instead
                </button>
              </div>
            )}
 
            {/* VERIFY OTP - Redesigned */}
            {tab === 'verify' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-2 mb-2">
                  <button type="button" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors" onClick={() => setTab('signup')} data-testid="otp-back-btn">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: accentColor }}>Check Email</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] px-4 font-bold">Code sent to: <span className="text-foreground">{otpEmail}</span></p>
                </div>
                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  <div className="flex justify-center py-2">
                    <InputOTP maxLength={6} value={form.otp} onChange={(val) => setForm({ ...form, otp: val })} data-testid="otp-input">
                      <div className="flex gap-2 sm:gap-3 justify-center">
                        {[0,1,2,3,4,5].map(i => (
                          <InputOTPSlot key={i} index={i} 
                            className={`bg-background/50 h-12 w-10 sm:h-14 sm:w-12 text-lg font-black transition-all duration-300 border-2 border-border/30 rounded-xl ${form.otp.length === i ? 'ring-4 ring-accent/10 border-accent scale-110' : ''}`} 
                          />
                        ))}
                      </div>
                    </InputOTP>
                  </div>
                  <Button type="submit" className="w-full h-14 font-black text-base btn-glow shadow-2xl rounded-2xl transition-all active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none' }} disabled={loading} data-testid="verify-otp-submit">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Account'}
                  </Button>
                </form>
                <div className="text-center space-y-2">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Didn't receive code?</p>
                  <button className="text-xs font-black text-accent hover:underline underline-offset-4" onClick={() => setTab('signup')}>Resend Code</button>
                </div>
              </div>
            )}
 
            {/* FORGOT PASSWORD - Redesigned */}
            {tab === 'forgot-password' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: accentColor }}>Account Recovery</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Get a secure reset link</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Email Address</Label>
                    <div className="relative group/input">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-accent transition-colors" />
                      <Input name="email" type="email" placeholder="you@email.com" className="pl-11 h-14 text-sm bg-background/30 border-border/50 rounded-2xl transition-all" value={form.email} onChange={handleChange} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 font-black text-base btn-glow shadow-2xl rounded-2xl transition-all active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none' }} disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Receive Reset Link'}
                  </Button>
                </form>
                <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent flex items-center justify-center gap-2 w-full transition-colors" onClick={() => setTab('login')}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
                </button>
              </div>
            )}
 
            {/* RESET PASSWORD - Redesigned */}
            {tab === 'reset-password' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: accentColor }}>Update Security</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Set your new private password</p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="flex justify-center py-2">
                    <InputOTP maxLength={6} value={form.otp} onChange={(val) => setForm({ ...form, otp: val })}>
                      <div className="flex gap-2 sm:gap-3 justify-center">
                        {[0,1,2,3,4,5].map(i => (
                          <InputOTPSlot key={i} index={i} className={`bg-background/50 h-12 w-10 sm:h-14 sm:w-12 text-lg font-black transition-all duration-300 border-2 border-border/30 rounded-xl ${form.otp.length === i ? 'ring-4 ring-accent/10 border-accent scale-110' : ''}`} />
                        ))}
                      </div>
                    </InputOTP>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">New Password</Label>
                    <div className="relative group/input">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-accent transition-colors" />
                      <Input name="password" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" className="pl-11 pr-12 h-14 text-sm bg-background/30 border-border/50 rounded-2xl transition-all" value={form.password} onChange={handleChange} />
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 font-black text-base btn-glow shadow-2xl rounded-2xl transition-all active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none' }} disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                  </Button>
                </form>
              </div>
            )}

            {/* ADMIN SECRET CODE */}
            {tab === 'admin-secret' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700" data-testid="admin-secret-panel">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
                    <KeyRound className="w-8 h-8 text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: '#f59e0b' }}>Admin Verification</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Enter your master secret code</p>
                </div>
                <form onSubmit={handleAdminSecretCode} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-amber-500/80 uppercase tracking-wider ml-1">Secret Code</Label>
                    <div className="relative group/input">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 group-focus-within/input:text-amber-500 transition-colors" />
                      <Input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Enter admin secret code"
                        className="pl-11 pr-12 h-14 text-sm bg-amber-500/5 border-amber-500/20 focus:border-amber-500/50 focus:ring-amber-500/10 rounded-2xl transition-all"
                        value={secretCode}
                        onChange={(e) => setSecretCode(e.target.value)}
                        autoFocus
                        data-testid="admin-secret-input"
                      />
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 font-black text-base shadow-2xl rounded-2xl transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none' }} disabled={loading} data-testid="admin-secret-submit">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Access'}
                  </Button>
                </form>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] text-amber-500/70 text-center font-bold uppercase tracking-wider">This code expires in 5 minutes</p>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent flex items-center justify-center gap-2 w-full transition-colors" onClick={() => { setTab('login'); setAdminTempToken(''); setSecretCode(''); }} data-testid="back-to-login-from-admin">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </button>
              </div>
            )}
          </div>
 
          <div className="flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 transition-opacity hover:opacity-100">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-accent/60" /> Public Venues</div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-amber-500/60" /> Age 18+ Only</div>
          </div>
        </div>
      </div>
    </div>
  );
}
