import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import VerseOfTheDay from '@/components/VerseOfTheDay';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  LayoutDashboard, User, CalendarDays, MessageSquare, Bell, Shield,
  Search, CreditCard, Clock, CheckCircle, XCircle, AlertTriangle,
  ArrowRight, Star, MapPin, Loader2, ThumbsUp, Receipt, Menu, X, Gift, Flag,
  ExternalLink, Info, Undo2, SlidersHorizontal, Calendar, BadgeCheck,
  Copy, ChevronLeft, ChevronRight, Navigation, Gem, Trophy, Lock, Book, Sparkles, ShieldCheck, Users
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

export default function Dashboard() {
  const { user, token, fetchUser, logout, updateUser } = useAuth();
  const { mode, theme } = useTheme();
  const isDark = theme === 'dark';
  const isPro = mode === 'professional';
  const accentHex = isPro ? '#3b82f6' : '#f43f5e';
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingSubTab, setBookingSubTab] = useState('requests');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sosState, setSosState] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [ratingFilter, setRatingFilter] = useState('all');
  const [systemReferralActive, setSystemReferralActive] = useState(false);
  const [unlockedUsers, setUnlockedUsers] = useState([]);
  const [detailBooking, setDetailBooking] = useState(null);
  const [acceptConfirm, setAcceptConfirm] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);
  const [withdrawConfirm, setWithdrawConfirm] = useState(null); // booking to confirm-withdraw
  const [showDiamondPopup, setShowDiamondPopup] = useState(false); // Diamond Store popup
  const [showVerseOfDay, setShowVerseOfDay] = useState(false); // Verse of the Day popup
  const [completingBooking, setCompletingBooking] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // booking to review
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addListener } = useWebSocket();

  // Listen for real-time WebSocket events
  useEffect(() => {
    const remove = addListener((data) => {
      if (data.type === 'booking_request' || data.type === 'new_message') {
        fetchData(); // Refresh dashboard data
      }
    });
    return remove;
  }, [addListener]);

  // Check if we should show verse of the day (once per day)
  useEffect(() => {
    const lastShown = localStorage.getItem('verseOfDayLastShown');
    const today = new Date().toDateString();
    if (lastShown !== today && user) {
      // Show after a short delay to not interrupt initial load
      const timer = setTimeout(() => {
        setShowVerseOfDay(true);
        localStorage.setItem('verseOfDayLastShown', today);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Auto-hide bottom nav when any modal is open (CSS handles the animation)
  useEffect(() => {
    const isOpen = !!(detailBooking || acceptConfirm || withdrawConfirm || showVerseOfDay || reviewModal);
    if (isOpen) {
      document.documentElement.setAttribute('data-modal-open', 'true');
    } else {
      document.documentElement.removeAttribute('data-modal-open');
    }
    return () => document.documentElement.removeAttribute('data-modal-open');
  }, [detailBooking, acceptConfirm, withdrawConfirm, showVerseOfDay, reviewModal]);

  const headers = { Authorization: `Bearer ${token}` };

  const handleUnlockChat = async (targetId, targetName) => {
    const isUnlocked = user?.unlocked_features?.some(f => f.type === 'chat' && f.target_id === targetId);
    if (isUnlocked) {
      const b = bookings?.find(x => (x.customer_id === targetId || x.companion_id === targetId) && x.status === 'accepted');
      if (b) navigate(`/chat/${b.id}`);
      else navigate('/chat', { state: { targetUser: { id: targetId, name: targetName } } });
      return;
    }

    try {
      // Use PUBLIC subscriptions/plans to avoid Admin Access error
      const plansRes = await axios.get(`${API}/subscriptions/plans`, { headers });
      const chatAddons = plansRes.data.add_ons?.chat || [];
      const config = chatAddons[0]; 

      if (!config) {
        toast.error('Chat unlock not configured');
        return;
      }

      if (user.diamonds < config.cost) {
        setShowDiamondPopup(true);
        return;
      }

      if (window.confirm(`Unlock chat with ${targetName} for ${config.cost} Diamonds?`)) {
        const res = await axios.post(`${API}/users/unlock-addon`, {
          addon_type: 'chat',
          addon_id: config.id,
          target_id: targetId
        }, { headers });
        toast.success(res.data.message || 'Chat unlocked!');
        fetchUser(); // Refresh diamonds and unlocked_features
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unlock failed');
    }
  };

  const [searchParams] = useSearchParams();
  
  const fetchData = async () => {
    try {
      const [bRes, nRes, pRes, rRes] = await Promise.all([
        axios.get(`${API}/bookings`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/notifications`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/payments/history`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/reviews/me`, { headers }).catch(() => ({ data: [] }))
      ]);
      
      setBookings(Array.isArray(bRes?.data) ? bRes.data : []);
      setNotifications(Array.isArray(nRes?.data) ? nRes.data : []);
      setPayments(Array.isArray(pRes?.data) ? pRes.data : []);
      setReviews(Array.isArray(rRes?.data) ? rRes.data : []);
      
      // Fetch unlocked users basic info
      if (user?.unlocked_features) {
        const chatUnlocks = user.unlocked_features.filter(f => f.type === 'chat').map(f => f.target_id);
        if (chatUnlocks.length > 0) {
          try {
            const uuRes = await axios.post(`${API}/users/bulk-info`, { user_ids: chatUnlocks }, { headers });
            setUnlockedUsers(uuRes.data?.users || []);
          } catch (err) { console.error("Error fetching unlocked users:", err); }
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Handle Administrative Acceptance Success Redirect
    const acceptStatus = searchParams.get('admin_accept');
    const inviteEmail = searchParams.get('email');
    const inviteToken = searchParams.get('token');

    if (acceptStatus === '1' && inviteEmail && inviteToken) {
      const finalizeAcceptance = async () => {
        try {
          await axios.get(`${API}/admin/team/accept-invite?email=${inviteEmail}&token=${inviteToken}`);
          toast.success('Welcome to the Team!', {
            description: 'Your administrative invitation has been officially accepted. Access is now active.',
            duration: 8000,
          });
          if (fetchUser) fetchUser();
          navigate('/dashboard', { replace: true });
        } catch (err) {
          toast.error('Invitation acceptance failed', {
            description: err.response?.data?.detail || 'Invalid or expired token.'
          });
          navigate('/dashboard', { replace: true });
        }
      };
      finalizeAcceptance();
    } else if (acceptStatus === 'success') {
      toast.success('Welcome back, Admin!', {
        description: 'Your administrative credentials are active.',
        duration: 5000,
      });
      if (fetchUser) fetchUser();
      navigate('/dashboard', { replace: true });
    }
    
    // Initial fetch
    fetchData();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleBookingAction = async (bookingId, action) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/${action}`, {}, { headers });
      toast.success(`Request ${action}ed`);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: action === 'accept' ? 'accepted' : 'rejected' } : b));
      setAcceptConfirm(null);
      setDetailBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    }
  };

  const handleWithdraw = async (bookingId) => {
    setWithdrawing(bookingId);
    try {
      await axios.delete(`${API}/bookings/${bookingId}/withdraw`, { headers });
      toast.success('Request withdrawn.');
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'withdrawn' } : b));
      setDetailBooking(null);
      setWithdrawConfirm(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Withdrawal failed');
    }
    setWithdrawing(null);
  };

  const handlePanic = async () => {
    if (sosState !== 'idle') return;
    setSosState('processing');
    
    // Try to get GPS location
    let body = {};
    try {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => { body = { lat: pos.coords.latitude, lng: pos.coords.longitude }; resolve(); },
          () => resolve(),
          { timeout: 3000, enableHighAccuracy: false }
        );
      });
    } catch {}
    
    try {
      await axios.post(`${API}/safety/panic`, body, { headers });
      setSosState('success');
      toast.success('🚨 SOS sent to your emergency contact!', { duration: 5000 });
    } catch {
      setSosState('idle');
      toast.error('Failed to send SOS. Call emergency services directly.');
      return;
    }
    
    // Reset state after 4 seconds of showing success
    setTimeout(() => setSosState('idle'), 4000);
  };

  const handleConfirmSafe = async () => {
    try {
      await axios.post(`${API}/safety/confirm-safe`, {}, { headers });
      toast.success('Great! Glad you got home safely.');
    } catch {
      toast.error('Failed to confirm');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`, {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };
  
  const handleReportReview = async (reviewId) => {
    try {
      await axios.post(`${API}/reviews/${reviewId}/report`, {}, { headers });
      toast.success('Review reported to administration');
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, is_reported: true } : r));
    } catch {
      toast.error('Failed to report review');
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    setCompletingBooking(bookingId);
    try {
      await axios.put(`${API}/bookings/${bookingId}/complete`, {}, { headers });
      toast.success('Booking marked as completed!');
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
      if (detailBooking?.id === bookingId) setDetailBooking(prev => ({ ...prev, status: 'completed' }));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete booking');
    }
    setCompletingBooking(null);
  };

  const handleSubmitReview = async () => {
    if (!reviewModal || reviewRating < 1) return toast.error('Please select a rating');
    setSubmittingReview(true);
    try {
      await axios.post(`${API}/reviews`, { booking_id: reviewModal.id, rating: reviewRating, comment: reviewComment }, { headers });
      toast.success('Review submitted! Thank you.');
      setBookings(prev => prev.map(b => b.id === reviewModal.id ? { ...b, review_submitted: true } : b));
      if (detailBooking?.id === reviewModal.id) setDetailBooking(prev => ({ ...prev, review_submitted: true }));
      setReviewModal(null);
      setReviewRating(0);
      setReviewComment('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    }
    setSubmittingReview(false);
  };

  const sub = user?.subscription || {};
  const isSubActive = sub.is_active && new Date(sub.end_date) > new Date();

  const sideItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'bookings', label: 'Requests', icon: CalendarDays },
    { key: 'reviews', label: 'My Reviews', icon: Star },
    { key: 'payments', label: 'Payments', icon: Receipt },
    { key: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.read).length },
    { key: 'safety', label: 'Safety Center', icon: Shield },
  ];

  const statusColor = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    withdrawn: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const incomingRequests = bookings.filter(b => b.companion_id === user?.id && b.status === 'pending');
  const myBookings = bookings.filter(b => 
    b.customer_id === user?.id || 
    (b.companion_id === user?.id && b.status !== 'pending' && b.status !== 'withdrawn')
  );

  return (
    <>
      {/* Verse of the Day Popup */}
      <VerseOfTheDay show={showVerseOfDay} onClose={() => setShowVerseOfDay(false)} />

      {/* Diamond Store Popup */}
      <Dialog open={showDiamondPopup} onOpenChange={setShowDiamondPopup}>
        <DialogContent className="max-w-sm p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          {/* Gradient Header */}
          <div className="relative p-8 text-center" style={{ background: 'linear-gradient(135deg, #1a0533, #2d0a5e, #1a0533)' }}>
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, #a855f7, transparent 70%)' }} />
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-900/50" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                <Gem className="w-10 h-10 text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.8))' }} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Not Enough Diamonds</h2>
              <p className="text-purple-300 text-xs font-bold mt-1 uppercase tracking-widest">Unlock Chat Feature</p>
            </div>
          </div>
          {/* Body */}
          <div className="p-6 space-y-5 bg-background">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Balance</p>
                <p className="text-2xl font-black flex items-center gap-1.5 mt-0.5">
                  <Gem className="w-5 h-5 text-purple-500" />
                  <span>{user?.diamonds ?? 0}</span>
                  <span className="text-xs font-medium text-muted-foreground">diamonds</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              You need more 💎 diamonds to unlock this chat. Visit the <strong className="text-foreground">Diamond Store</strong> to top up your balance instantly.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowDiamondPopup(false)} className="h-12 rounded-xl font-bold">
                Cancel
              </Button>
              <Button
                className="h-12 rounded-xl font-black shadow-lg shadow-purple-500/30 gap-2"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none' }}
                onClick={() => { setShowDiamondPopup(false); navigate('/subscription'); }}
              >
                <Gem className="w-4 h-4" /> Diamond Store
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    <div className="min-h-screen bg-background pb-32 md:pb-10" data-testid="dashboard-page">
      <Navbar 
        hideHeader={isSidebarOpen} 
        hideBottomNav={isSidebarOpen || !!(detailBooking || acceptConfirm || withdrawConfirm || reviewModal)} 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">


        {/* Advanced Glassmorphism Banner */}
        <div className="mb-6 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl transition-all hover:shadow-accent/5" 
          style={{ 
            background: isDark 
              ? `linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.4))` 
              : `linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 249, 0.5))`,
            border: `1px solid ${accentHex}30`,
            backdropFilter: 'blur(12px)'
          }}>
          <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 animate-pulse pointer-events-none" style={{ background: accentHex }} />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 blur-[80px] opacity-10 pointer-events-none" style={{ background: isPro ? '#3b82f6' : '#f43f5e' }} />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-[0.2em] border border-accent/20 mb-2">
                <Star className="w-3 h-3 fill-accent" /> {isPro ? 'Professional Mode' : 'Casual Mode'}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Welcome back, <span style={{ color: accentHex }}>{user?.name?.split(' ')[0]}!</span>
              </h1>
              <p className="text-sm text-muted-foreground font-medium max-w-md leading-relaxed">
                {isPro ? 'Elevate your corporate events with our premium professional network.' : 'Discover local experiences and build meaningful social connections.'}
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link to="/browse" className="flex-1 md:flex-none">
                <Button className="w-full h-12 px-8 text-xs font-black uppercase tracking-widest gap-2 bg-slate-950 text-white border border-white/5 hover:bg-slate-900 transition-all shadow-xl shadow-black/20 rounded-2xl">
                  <Search className="w-4 h-4" /> Discover
                </Button>
              </Link>
              
              <div className="relative group">
                <Button
                  variant={sosState !== 'idle' ? 'outline' : 'destructive'}
                  className={`h-12 px-8 text-sm font-black gap-2 transition-all relative overflow-hidden rounded-2xl ${sosState === 'idle' ? 'hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-red-600/30' : ''}`}
                  onClick={() => {
                    if (sosState === 'idle') handlePanic();
                  }}
                  disabled={sosState === 'processing'}
                  style={sosState === 'success' ? { background: '#10b981', color: '#fff', border: 'none' } : {}}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 animate-shimmer pointer-events-none" />
                  {sosState === 'processing' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : sosState === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Shield className="w-5 h-5 animate-pulse-subtle" />
                  )}
                  <span className="uppercase tracking-widest">{sosState === 'processing' ? 'Alerting...' : sosState === 'success' ? 'Secured' : 'SOS'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden mb-4">
          <Button variant="outline" onClick={() => setIsSidebarOpen(true)} className="gap-2 bg-card border-border/40 shadow-sm w-full justify-start h-12" data-testid="mobile-sidebar-toggle">
            <Menu className="w-5 h-5" style={{ color: accentHex }}/> <span className="font-semibold">Navigation Menu</span>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          {/* Mobile Backdrop */}
          {isSidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          )}
          
          <aside className={`
            fixed inset-y-0 left-0 z-50 w-72 transform bg-background border-r border-border/20 p-5 transition-transform duration-300 ease-in-out overflow-y-auto
            lg:relative lg:transform-none lg:w-60 lg:bg-transparent lg:border-none lg:p-0 lg:overflow-visible
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            shrink-0
          `}>
            {isSidebarOpen && (
              <div className="flex items-center justify-between lg:hidden mb-6">
                <span className="font-bold text-lg inline-flex items-center gap-2"><Star className="w-5 h-5" style={{color: accentHex}}/> Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
            <div className="sticky top-20 space-y-1 rounded-2xl lg:border lg:border-border/20 lg:bg-card lg:p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1">Navigation</p>
              {sideItems.map(({ key, label, icon: Icon, badge: b }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setIsSidebarOpen(false); }}
                  className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab === key ? 'active' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                  data-testid={`sidebar-${key}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{label}</span>
                  {b > 0 && <Badge variant="destructive" className="ml-auto text-[10px] h-5 px-1.5">{b}</Badge>}
                </button>
              ))}
              <div className="h-px bg-border/20 my-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1">Quick Links</p>
              {[
                { to: '/browse', icon: Search, label: 'Browse Companions' },
                { to: '/campaign', icon: Gift, label: 'Campaigns' },
                { to: '/subscription', icon: CreditCard, label: 'Subscription Plans' },
                { to: '/profile', icon: User, label: 'Edit Profile' },
                { to: '/terms', icon: Shield, label: 'Terms & Conditions' },
                { to: '/privacy', icon: Shield, label: 'Privacy Policy' },
                { to: '/faq', icon: Info, label: 'FAQs' },
                { to: '/safety', icon: ShieldCheck, label: 'Safety Guide' },
                { to: '/about', icon: Users, label: 'About Us' },
              ].map(({ to, icon: Icon, label }) => (
                <Link key={to} to={to}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-xs text-muted-foreground hover:text-foreground h-9 rounded-xl" size="sm">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </Button>
                </Link>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Dashboard Overview</h1>
                      <p className="text-sm text-muted-foreground mt-1">{isPro ? 'Professional' : 'Casual'} mode</p>
                    </div>
                    {/* Unlocked Chats Section - Horizontal Scroll (Instagram-style Insights) */}
                    {unlockedUsers.length > 0 && (
                      <div className="space-y-4 pb-4 overflow-hidden relative">
                        <div className="flex items-center justify-between px-1">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Unlocked Contacts ({unlockedUsers.length})
                          </h3>
                        </div>
                        <div className="flex gap-5 overflow-x-auto pb-6 pt-2 px-1 no-scrollbar scroll-smooth">
                          {unlockedUsers.map((u, idx) => (
                            <button
                              key={u.id}
                              onClick={() => handleUnlockChat(u.id, u.name)}
                              className="flex flex-col items-center gap-2.5 shrink-0 group transition-all"
                            >
                              <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full p-[2.5px] transition-all group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 shadow-md ring-2 ring-primary/5 ring-offset-2 ring-offset-background" 
                                style={{ background: `linear-gradient(135deg, ${accentHex}, #fff, #fbbf24)` }}>
                                <div className="w-full h-full rounded-full border-[2.5px] border-background overflow-hidden bg-muted/20">
                                  {u.profile_pic ? (
                                    <img src={u.profile_pic} alt={u.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-muted-foreground/20 text-lg uppercase">{u.name?.charAt(0)}</div>
                                  )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-xs ring-1 ring-white/20" />
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors truncate w-16 sm:w-[72px] text-center">
                                {u.name.split(' ')[0]}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subscription Status */}
                    <Card className="border-border/40">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSubActive ? 'bg-green-100' : 'bg-red-100'}`}>
                            {isSubActive ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{isSubActive ? 'Active Subscription' : 'No Active Plan'}</p>
                            <p className="text-xs text-muted-foreground">
                              {sub.is_trial ? 'Free Trial' : sub.plan?.replace('_', ' ')} · {sub.type}
                              {isSubActive && ` · Expires ${new Date(sub.end_date).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <Link to="/subscription">
                          <Button size="sm" variant={isSubActive ? 'outline' : 'default'} data-testid="upgrade-btn">
                            {isSubActive ? 'Manage' : 'Upgrade'} <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    {/* Stats Grid */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Card className="border-border/40 card-hover">
                        <CardContent className="p-5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Requests</p>
                          <p className="text-3xl font-extrabold mt-2" style={{ fontFamily: 'var(--font-heading)' }}>{bookings.length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/40 card-hover">
                        <CardContent className="p-5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active</p>
                          <p className="text-3xl font-extrabold mt-2" style={{ fontFamily: 'var(--font-heading)' }}>{bookings.filter(b => b.status === 'accepted' && (b.customer_id === user?.id || b.companion_id === user?.id)).length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/40 card-hover">
                        <CardContent className="p-5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending</p>
                          <p className="text-3xl font-extrabold mt-2" style={{ fontFamily: 'var(--font-heading)' }}>{incomingRequests.length}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Incoming Requests */}
                    {incomingRequests.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Incoming Requests</h3>
                        <div className="space-y-3">
                          {incomingRequests.map(b => (
                            <Card key={b.id} className="border-border/40">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{b.event_name}</p>
                                    <p className="text-xs text-muted-foreground">{b.customer_name} · {b.venue}</p>
                                    <p className="text-xs text-muted-foreground">{b.date} at {b.time}</p>
                                  </div>
                                  <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setDetailBooking(b)}><Info className="w-3 h-3" />Details</Button>
                                    <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setAcceptConfirm(b)} data-testid={`accept-${b.id}`}>Accept</Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleBookingAction(b.id, 'reject')} data-testid={`reject-${b.id}`}>Decline</Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}



                    {/* Recent Bookings */}
                    <div>
                      <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Recent Requests</h3>
                      {myBookings.length === 0 ? (
                        <Card className="border-border/40"><CardContent className="p-8 text-center text-muted-foreground text-sm">No requests yet. <Link to="/browse" className="text-primary font-semibold underline">Browse companions</Link></CardContent></Card>
                      ) : (
                        <div className="space-y-3">
                          {myBookings.slice(0, 5).map(b => (
                            <Card key={b.id} className="border-border/40">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">{b.event_name}</p>
                                    <p className="text-xs text-muted-foreground">{b.companion_name} · {b.date}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge className={`${statusColor[b.status] || ''} text-xs`}>{b.status}</Badge>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDetailBooking(b)}><Info className="w-3.5 h-3.5" /></Button>
                                  {b.status === 'accepted' && (
                                    <Link to={`/chat/${b.id}`}><Button size="sm" variant="ghost" data-testid={`chat-${b.id}`}><MessageSquare className="w-4 h-4" /></Button></Link>
                                  )}
                                  {b.status === 'pending' && (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => setWithdrawConfirm(b)}>
                                      <Undo2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>


                  </div>
                )}

                {activeTab === 'bookings' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>All Companion Requests</h2>
                      
                      {/* Sub-tabs for Requests/Completed */}
                      <div className="flex bg-muted/40 p-1 rounded-2xl border border-border/10 shadow-inner">
                        <button
                          onClick={() => setBookingSubTab('requests')}
                          className={`flex-1 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                            bookingSubTab === 'requests' 
                              ? 'bg-background text-foreground shadow-md ring-1 ring-border/10' 
                              : 'text-muted-foreground/60 hover:text-foreground'
                          }`}
                        >
                          Requests
                        </button>
                        <button
                          onClick={() => setBookingSubTab('completed')}
                          className={`flex-1 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                            bookingSubTab === 'completed' 
                              ? 'bg-background text-foreground shadow-md ring-1 ring-border/10' 
                              : 'text-muted-foreground/60 hover:text-foreground'
                          }`}
                        >
                          Completed
                        </button>
                      </div>
                    </div>

                    {bookings.filter(b => bookingSubTab === 'completed' ? b.status === 'completed' : b.status !== 'completed').length === 0 ? (
                      <Card className="border-border/40"><CardContent className="p-12 text-center text-muted-foreground text-sm font-medium">No {bookingSubTab} found</CardContent></Card>
                    ) : (
                      <div className="space-y-3">
                        {bookings.filter(b => bookingSubTab === 'completed' ? b.status === 'completed' : b.status !== 'completed').map(b => (
                          <Card key={b.id} className="border-border/40">
                            <CardContent className="p-4">
                              {b.status === 'withdrawn' && b.companion_id === user?.id ? (
                                <div className="flex items-center justify-between gap-3 py-1">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="relative w-11 h-11 shrink-0">
                                      <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-border/20 shadow-sm bg-muted/20">
                                        {b.customer_photo ? (
                                          <img 
                                            src={`${API.replace('/api', '')}${b.customer_photo}`} 
                                            className="w-full h-full object-cover scale-105" 
                                            style={{ filter: 'blur(1.5px)' }}
                                            alt="" 
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-muted-foreground/20" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-1 border border-border/40 shadow-xs">
                                        <Lock className="w-2.5 h-2.5 text-accent" style={{color: accentHex}} />
                                      </div>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold truncate">
                                        Withdrawn by <span className="uppercase tracking-widest text-[#f43f5e]">{b.customer_name}</span>
                                      </p>
                                      <p className="text-[10px] text-muted-foreground/80 leading-tight">
                                        Unlock the chat to know why they might withdraw; maybe you can get the request back again!
                                      </p>
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 rounded-lg border-amber-500/40 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 gap-1.5 px-3 text-[10px] font-bold shrink-0"
                                    onClick={() => handleUnlockChat(b.customer_id, b.customer_name)}
                                  >
                                    <Lock className="w-2.5 h-2.5" /> Unlock
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{b.event_name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                      <MapPin className="w-3 h-3 shrink-0" /> {b.venue} · {b.date} at {b.time}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {b.customer_id === user?.id ? `Companion: ${b.companion_name}` : `Finder: ${b.customer_name}`}
                                    </p>
                                    <p className="text-xs font-semibold">&#8377;{b.price} · {b.duration_hours}h · {b.event_type}</p>
                                    {!(b.status === 'withdrawn' && b.companion_id === user?.id) && (b.meeting_time || b.meeting_point_details || b.prep_instructions || b.instructions) && (
                                      <div className="mt-2 p-2 rounded-lg bg-muted/30 border border-border/20 space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Coordination Instructions</p>
                                        {b.meeting_time && <p className="text-xs"><span className="opacity-70">Meeting Time:</span> <span className="font-medium text-accent" style={{color: accentHex}}>{b.meeting_time}</span></p>}
                                        {b.meeting_point_details && <p className="text-xs"><span className="opacity-70">Meeting point:</span> <span className="font-medium">{b.meeting_point_details}</span></p>}
                                        {b.prep_instructions && <p className="text-xs"><span className="opacity-70">Prep:</span> <span className="font-medium">{b.prep_instructions}</span></p>}
                                        {b.instructions && <p className="text-xs opacity-80">"{b.instructions}"</p>}
                                        {b.google_maps_link && (
                                          <a href={b.google_maps_link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
                                            <MapPin className="w-2.5 h-2.5" /> View on Maps
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <Badge className={`${statusColor[b.status] || ''} text-xs`}>{b.status}</Badge>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setDetailBooking(b)}><Info className="w-3 h-3" />Details</Button>
                                    {b.companion_id === user?.id && b.status === 'pending' && (
                                      <div className="flex gap-1">
                                        <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setAcceptConfirm(b)}>Accept</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-xs border-red-300 text-red-600" onClick={() => handleBookingAction(b.id, 'reject')}>Decline</Button>
                                      </div>
                                    )}
                                    {b.customer_id === user?.id && b.status === 'pending' && (
                                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 gap-1" onClick={() => setWithdrawConfirm(b)}>
                                        <Undo2 className="w-3 h-3" /> Withdraw
                                      </Button>
                                    )}
                                    {b.status === 'accepted' && (
                                      <Link to={`/chat/${b.id}`}><Button size="sm" variant="outline" className="h-7 text-xs gap-1"><MessageSquare className="w-3 h-3" />Chat</Button></Link>
                                    )}
                                    {b.companion_id === user?.id && b.status === 'accepted' && (
                                      <Button size="sm" className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1" disabled={completingBooking === b.id} onClick={() => handleCompleteBooking(b.id)} data-testid={`complete-${b.id}`}>
                                        {completingBooking === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Complete
                                      </Button>
                                    )}
                                    {b.customer_id === user?.id && b.status === 'completed' && !b.review_submitted && (
                                      <Button size="sm" className="h-7 text-xs gap-1 text-white" style={{ background: accentHex }} onClick={() => setReviewModal(b)} data-testid={`review-${b.id}`}>
                                        <Star className="w-3 h-3" /> Review
                                      </Button>
                                    )}
                                    {b.status === 'completed' && b.review_submitted && (
                                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">Reviewed</Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Payment History</h2>
                    {payments.length === 0 ? (
                      <Card className="border-border/40">
                        <CardContent className="p-8 text-center text-muted-foreground text-sm">
                          No payments yet. <Link to="/subscription" className="underline" style={{ color: accentHex }}>Subscribe now</Link>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {payments.map(p => (
                          <Card key={p.id} className="border-border/40">
                            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                              <div>
                                <p className="text-sm font-semibold capitalize">{p.plan_duration?.replace('_', ' ')} – {p.plan_type} Plan</p>
                                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                <p className="text-[10px] text-muted-foreground">ID: {p.razorpay_payment_id || p.razorpay_order_id}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-extrabold text-emerald-600">&#8377;{(p.amount / 100)?.toLocaleString()}</p>
                                <Badge className="bg-emerald-500/10 text-emerald-700 text-[10px]">Paid</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Notifications</h2>
                      <Button variant="ghost" size="sm" onClick={markAllRead} data-testid="mark-all-read">Mark all read</Button>
                    </div>
                    {notifications.length === 0 ? (
                      <Card className="border-border/40"><CardContent className="p-8 text-center text-muted-foreground text-sm">No notifications</CardContent></Card>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map(n => (
                          <Card key={n.id} className={`border-border/40 ${!n.read ? 'bg-primary/5' : ''}`}>
                            <CardContent className="p-4 flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-muted'}`}>
                                <Bell className={`w-4 h-4 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{n.title}</p>
                                <p className="text-xs text-muted-foreground">{n.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'reviews' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <h2 className="text-xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Reviews Received</h2>
                      <div className="flex bg-muted/20 p-1 rounded-xl border border-border/10 overflow-x-auto no-scrollbar">
                        {['all', 5, 4, 3, 2, 1].map(r => (
                          <button
                            key={r}
                            onClick={() => setRatingFilter(r)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                              ratingFilter === r ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
                            }`}
                          >
                            {r === 'all' ? 'All' : `${r} Star`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {reviews.filter(r => ratingFilter === 'all' || r.rating === ratingFilter).length === 0 ? (
                      <Card className="border-border/40 p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                        <Star className="w-12 h-12 opacity-10" />
                        <p className="text-sm font-medium">No reviews found for this filter.</p>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reviews
                          .filter(r => ratingFilter === 'all' || r.rating === ratingFilter)
                          .map(r => (
                            <Card key={r.id} className="border-border/40 group relative overflow-hidden">
                              <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`w-3 h-3 ${star <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                                      ))}
                                    </div>
                                    <span className="text-[10px] font-black opacity-40 uppercase">{new Date(r.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`h-7 px-2 text-[8px] font-black uppercase tracking-wider ${r.is_reported ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-red-500'}`}
                                    onClick={() => !r.is_reported && handleReportReview(r.id)}
                                    disabled={r.is_reported}
                                  >
                                    <Flag className="w-2.5 h-2.5 mr-1" /> {r.is_reported ? 'Reported' : 'Report'}
                                  </Button>
                                </div>
                                <p className="text-sm font-medium leading-relaxed italic">"{r.comment || 'No comment provided.'}"</p>
                                <div className="mt-4 flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[8px] font-black text-white" style={{ background: accentHex }}>
                                    {r.reviewer_name?.charAt(0)}
                                  </div>
                                  <span className="text-[11px] font-bold text-muted-foreground">— {r.reviewer_name}</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'safety' && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Safety Center</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Card className="border-destructive/20 bg-destructive/5">
                        <CardContent className="p-6 text-center space-y-3">
                          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
                          <h3 className="text-base font-bold">SOS / Panic Button</h3>
                          <p className="text-xs text-muted-foreground">Press if you feel unsafe. Your emergency contact will be alerted immediately.</p>
                          <Button
                            variant={sosState !== 'idle' ? 'outline' : 'destructive'}
                            className={`w-full gap-2 ${sosState === 'idle' ? 'panic-btn' : ''}`}
                            onClick={handlePanic}
                            disabled={sosState !== 'idle'}
                            data-testid="panic-button"
                            style={sosState === 'success' ? { background: '#166534', color: '#fff', borderColor: 'transparent' } : {}}
                          >
                            {sosState === 'processing' ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Processing to send, please wait...</>
                            ) : sosState === 'success' ? (
                              <><CheckCircle className="w-4 h-4" /> We have successfully sent</>
                            ) : (
                              <><AlertTriangle className="w-4 h-4" /> I Need Help — Send SOS</>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                      <Card className="border-emerald-500/20 bg-emerald-500/5">
                        <CardContent className="p-6 text-center space-y-3">
                          <ThumbsUp className="w-10 h-10 text-emerald-500 mx-auto" />
                          <h3 className="text-base font-bold">Nailed It!</h3>
                          <p className="text-xs text-muted-foreground">Got home safe? Let us know everything went well and close any active alerts.</p>
                          <Button className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleConfirmSafe} data-testid="confirm-safe-button">
                            <ThumbsUp className="w-4 h-4" /> I'm Safe & Home
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                    <Card className="border-border/40">
                      <CardHeader>
                        <CardTitle className="text-base">Emergency Contact</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm"><strong>Name:</strong> {user?.emergency_contact?.name || 'Not set'}</p>
                        <p className="text-sm"><strong>Phone:</strong> {user?.emergency_contact?.phone || 'Not set'}</p>
                        <p className="text-sm"><strong>Relationship:</strong> {user?.emergency_contact?.relationship || 'Not set'}</p>
                        <Link to="/profile"><Button variant="outline" size="sm" className="mt-2" data-testid="edit-emergency">Update Emergency Contact</Button></Link>
                      </CardContent>
                    </Card>
                    <Card className="border-border/40">
                      <CardHeader><CardTitle className="text-base">Safety Tips</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          'Always meet at public venues with other people around',
                          'Share your live location with a trusted friend or family',
                          'Trust your instincts - leave if you feel uncomfortable',
                          'Report any suspicious or inappropriate behavior immediately',
                          'Keep your emergency contact information updated',
                        ].map((tip, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-muted-foreground">{tip}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      <Footer />
    </div>
  </div>

  {/* Booking Detail Modal */}
  <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
    <DialogContent className="sm:max-w-lg w-full h-[100dvh] sm:h-auto sm:max-h-[88vh] flex flex-col p-0 gap-0 rounded-none sm:rounded-3xl overflow-hidden">
      {/* Fixed Header */}
      <div className="px-5 py-4 border-b border-border/10 bg-background shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accentHex}18` }}>
              <CalendarDays className="w-4 h-4" style={{ color: accentHex }} />
            </div>
            <div>
              <p className="text-base font-black leading-tight">Booking Details</p>
              {detailBooking && <p className="text-[10px] text-muted-foreground font-medium capitalize">{detailBooking.status}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 mr-8 shrink-0">
            {detailBooking && (
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${statusColor[detailBooking.status] || ''}`}>
                {detailBooking.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 pb-28 sm:pb-6">
        {detailBooking && (
          detailBooking.status === 'withdrawn' && detailBooking.companion_id === user?.id ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-in fade-in zoom-in duration-500">
                <Undo2 className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-1 mt-2">
                <h3 className="text-xl font-black">Request Withdrawn</h3>
                <p className="text-sm text-muted-foreground px-8 leading-relaxed">
                  The sender has withdrawn this booking request. You can no longer view the coordination details.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Event Block */}
              <div className="rounded-2xl border border-border/20 bg-muted/10 overflow-hidden">
                <div className="px-4 py-2 border-b border-border/10" style={{ background: `${accentHex}0c` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentHex }}>Event</p>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xl font-black leading-tight">{detailBooking.event_name}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Date</p>
                        <p className="text-xs font-bold">{detailBooking.date || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Time</p>
                        <p className="text-xs font-bold">{detailBooking.time || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Type</p>
                        <p className="text-xs font-bold capitalize">{detailBooking.event_type || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Cost</p>
                        <p className="text-xs font-black" style={{ color: accentHex }}>&#8377;{detailBooking.price} · {detailBooking.duration_hours}h</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parties Block */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/20 bg-muted/5 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Finder</p>
                  <p className="text-sm font-bold">{detailBooking.customer_name || '—'}</p>
                </div>
                <div className="rounded-2xl border border-border/20 bg-muted/5 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Companion</p>
                  <p className="text-sm font-bold">{detailBooking.companion_name || '—'}</p>
                </div>
              </div>

              {/* Venue Block */}
              <div className="rounded-2xl border border-border/20 bg-muted/10 overflow-hidden">
                <div className="px-4 py-2 border-b border-border/10" style={{ background: `${accentHex}0c` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentHex }}>Venue & Location</p>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
                    {detailBooking.venue || '—'}
                  </p>
                  {detailBooking.venue_address && (
                    <p className="text-xs text-muted-foreground pl-6">{detailBooking.venue_address}</p>
                  )}
                  {detailBooking.google_maps_link && (
                    <a
                      href={detailBooking.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-1 px-4 py-2.5 rounded-xl text-xs font-black text-white w-full justify-center shadow-lg shadow-rose-500/10 active:scale-95 transition-transform"
                      style={{ background: accentHex }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open in Google Maps
                    </a>
                  )}
                </div>
              </div>

              {/* Coordination Block */}
              {(detailBooking.meeting_time || detailBooking.meeting_point_details || detailBooking.prep_instructions || detailBooking.instructions) && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
                  <div className="px-4 py-2 border-b border-amber-500/10 bg-amber-500/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Coordination &amp; Flow</p>
                  </div>
                  <div className="p-4 space-y-4">
                    {detailBooking.meeting_time && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/15">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Meet By</p>
                          <p className="text-sm font-bold" style={{ color: accentHex }}>{detailBooking.meeting_time}</p>
                        </div>
                      </div>
                    )}
                    {detailBooking.meeting_point_details && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/15">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Meeting Point</p>
                          <p className="text-sm font-medium">{detailBooking.meeting_point_details}</p>
                        </div>
                      </div>
                    )}
                    {detailBooking.prep_instructions && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/15">
                          <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Preparation</p>
                          <p className="text-sm font-medium">{detailBooking.prep_instructions}</p>
                        </div>
                      </div>
                    )}
                    {detailBooking.instructions && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/15">
                          <Info className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Additional Notes</p>
                          <p className="text-sm italic text-muted-foreground">&ldquo;{detailBooking.instructions}&rdquo;</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Safety Block */}
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex gap-3 mt-6">
                <Shield className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-rose-600 uppercase tracking-wide">Safety Reminder</p>
                  <p className="text-[11px] text-rose-700 leading-relaxed">Meet only at the confirmed public venue. <strong>Never pay before meeting.</strong> Verify the location on Maps before you go.</p>
                </div>
              </div>
            </>
          )
        )}
      </div>

      {/* Fixed Footer Actions */}
      {detailBooking && (
        <div className="px-5 py-4 border-t border-border/10 bg-background shrink-0 space-y-2.5">
          {/* Chat Logic */}
          {detailBooking.status !== 'withdrawn' && (
            (() => {
              const targetId = detailBooking.customer_id === user?.id ? detailBooking.companion_id : detailBooking.customer_id;
              const targetName = detailBooking.customer_id === user?.id ? detailBooking.companion_name : detailBooking.customer_name;
              const isUnlocked = user?.unlocked_features?.some(f => f.type === 'chat' && f.target_id === targetId);

              return (
                <Button
                  variant="outline"
                  className={`w-full h-11 rounded-xl font-black gap-2 transition-all ${!isUnlocked ? 'border-amber-400 text-amber-600 hover:bg-amber-50' : 'border-accent/40 text-accent hover:bg-accent/5'}`}
                  onClick={() => handleUnlockChat(targetId, targetName)}
                >
                  {!isUnlocked ? <Lock className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  {isUnlocked ? 'Continue Chat' : 'Unlock Chat to Message'}
                </Button>
              );
            })()
          )}

          {detailBooking.companion_id === user?.id && detailBooking.status === 'pending' && (
            <div className="flex gap-2">
              <Button className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl" onClick={() => { setDetailBooking(null); setAcceptConfirm(detailBooking); }}>Accept</Button>
              <Button variant="outline" className="flex-1 h-11 border-red-300 text-red-600 font-bold rounded-xl" onClick={() => { handleBookingAction(detailBooking.id, 'reject'); }}>Decline</Button>
            </div>
          )}
          {detailBooking.customer_id === user?.id && detailBooking.status === 'pending' && (
            <Button variant="outline" className="w-full h-11 border-red-300 text-red-600 font-bold gap-2 rounded-xl hover:bg-red-50" onClick={() => { setDetailBooking(null); setWithdrawConfirm(detailBooking); }}>
              <Undo2 className="w-4 h-4" /> Withdraw Request
            </Button>
          )}
          {/* Complete Booking - companion can mark accepted booking as completed */}
          {detailBooking.companion_id === user?.id && detailBooking.status === 'accepted' && (
            <Button
              className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl gap-2"
              disabled={completingBooking === detailBooking.id}
              onClick={() => handleCompleteBooking(detailBooking.id)}
              data-testid="complete-booking-btn"
            >
              {completingBooking === detailBooking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark as Completed
            </Button>
          )}
          {/* Leave Review - customer can review completed bookings */}
          {detailBooking.customer_id === user?.id && detailBooking.status === 'completed' && !detailBooking.review_submitted && (
            <Button
              className="w-full h-11 font-black rounded-xl gap-2"
              style={{ background: accentHex, color: '#fff' }}
              onClick={() => { setReviewModal(detailBooking); }}
              data-testid="leave-review-btn"
            >
              <Star className="w-4 h-4" /> Leave a Review
            </Button>
          )}
          {detailBooking.status === 'completed' && detailBooking.review_submitted && (
            <div className="text-center py-2">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Review Submitted</Badge>
            </div>
          )}
        </div>
      )}
    </DialogContent>
  </Dialog>

  {/* Accept Confirmation Dialog */}
  <Dialog open={!!acceptConfirm} onOpenChange={() => setAcceptConfirm(null)}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg font-black">
          <CheckCircle className="w-5 h-5 text-emerald-500" /> Confirm Acceptance
        </DialogTitle>
      </DialogHeader>
      {acceptConfirm && (
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-xl bg-muted/10 border border-border/20 space-y-1">
            <p className="text-sm font-bold">{acceptConfirm.event_name}</p>
            <p className="text-xs text-muted-foreground">{acceptConfirm.customer_name} · {acceptConfirm.date}</p>
            <p className="text-xs font-semibold" style={{ color: accentHex }}>&#8377;{acceptConfirm.price} · {acceptConfirm.duration_hours}h</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">By accepting, you commit to being present at the agreed venue on time. Verify the venue on the map before confirming.</p>
          </div>
          <p className="text-sm text-center font-semibold">Are you sure you want to accept this request?</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAcceptConfirm(null)}>Cancel</Button>
            <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black" onClick={() => handleBookingAction(acceptConfirm.id, 'accept')}>Yes, Accept</Button>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
  {/* ── Withdraw Confirmation Dialog ── */}
  <Dialog open={!!withdrawConfirm} onOpenChange={() => setWithdrawConfirm(null)}>
    <DialogContent className="sm:max-w-sm rounded-3xl p-0 overflow-hidden gap-0">
      <div className="px-6 pt-6 pb-4 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <Undo2 className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <p className="text-lg font-black">Withdraw Request?</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Are you sure you want to withdraw your booking request for
            <strong className="text-foreground"> {withdrawConfirm?.event_name}</strong>?
          </p>
        </div>
        {withdrawConfirm && (
          <div className="p-3 rounded-xl bg-muted/10 border border-border/20 text-left space-y-1">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Companion:</span> {withdrawConfirm.companion_name}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Date:</span> {withdrawConfirm.date}
            </p>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground/70">
          This action cannot be undone. The companion will be notified.
        </p>
      </div>
      <div className="px-6 pb-6 flex gap-3">
        <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={() => setWithdrawConfirm(null)}>No, Keep It</Button>
        <Button
          className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl"
          disabled={withdrawing === withdrawConfirm?.id}
          onClick={() => handleWithdraw(withdrawConfirm?.id)}
        >
          {withdrawing === withdrawConfirm?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Withdraw'}
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* ── Review Submission Dialog ── */}
  <Dialog open={!!reviewModal} onOpenChange={(v) => { if (!v) { setReviewModal(null); setReviewRating(0); setReviewComment(''); } }}>
    <DialogContent className="sm:max-w-sm rounded-3xl p-0 overflow-hidden gap-0">
      <div className="px-6 pt-6 pb-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Star className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <p className="text-lg font-black">Rate Your Experience</p>
          <p className="text-xs text-muted-foreground mt-1">
            How was your time with <strong className="text-foreground">{reviewModal?.companion_name}</strong>?
          </p>
        </div>
        {/* Star Rating */}
        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setReviewRating(star)}
              className="transition-transform hover:scale-110 active:scale-95"
              data-testid={`review-star-${star}`}
            >
              <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
            </button>
          ))}
        </div>
        {reviewRating > 0 && (
          <p className="text-xs font-bold" style={{ color: accentHex }}>
            {reviewRating === 5 ? 'Outstanding!' : reviewRating === 4 ? 'Great!' : reviewRating === 3 ? 'Good' : reviewRating === 2 ? 'Fair' : 'Poor'}
          </p>
        )}
        <textarea
          className="w-full h-24 rounded-xl border border-border/30 bg-muted/10 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Share your experience (optional)..."
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          data-testid="review-comment-input"
        />
      </div>
      <div className="px-6 pb-6 flex gap-3">
        <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={() => { setReviewModal(null); setReviewRating(0); setReviewComment(''); }}>Cancel</Button>
        <Button
          className="flex-1 h-11 font-black rounded-xl text-white"
          style={{ background: accentHex }}
          disabled={reviewRating < 1 || submittingReview}
          onClick={handleSubmitReview}
          data-testid="submit-review-btn"
        >
          {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</>
);
}

