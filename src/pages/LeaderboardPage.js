import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Trophy, Medal, Crown, Star, Loader2, ArrowRight, ShieldCheck, MapPin, 
  X, Info, TrendingUp, Zap, CheckCircle2, Plus, Gem, Clock,
  ChevronRight, HelpCircle, User, BadgeCheck, Briefcase, ArrowUpRight,
  MessageSquare, Flag, Calendar, Heart, Briefcase as ProIcon, Navigation2
} from 'lucide-react';
import axios from 'axios';
import { BookingFormModal } from '../components/BookingFormModal';
import { CompanionProfileDetail } from '../components/CompanionProfileDetail';
import { motion, AnimatePresence } from 'framer-motion';
import { CurvedHeart } from '../components/CurvedHeart';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';


export default function LeaderboardPage() {
  const { user, token, fetchUser, diamonds: userDiamonds, fetchDiamonds } = useAuth();
  const [bookingModal, setBookingModal] = useState(false);
  const [bioMode, setBioMode] = useState('casual'); // 'casual' | 'professional'
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [bidDiamonds, setBidDiamonds] = useState('100');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedUser, setSelectedUser] = useState(null);
  const [biddingStep, setBiddingStep] = useState(1);
  const [reportModal, setReportModal] = useState(null); 
  const [reportForm, setReportForm] = useState({ reason: '', details: '' });
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [userBookings, setUserBookings] = useState([]);
  const [reviewList, setReviewList] = useState([]);
  const [activeReviewFilter, setActiveReviewFilter] = useState('all');
  const [plusModal, setPlusModal] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [likedUsers, setLikedUsers] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [maxSlots, setMaxSlots] = useState(30);
  const [showExpansionPopup, setShowExpansionPopup] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(true);

  useEffect(() => {
    const lastSeen = localStorage.getItem('leaderboard_welcome_last');
    const now = Date.now();
    if (!lastSeen || (now - parseInt(lastSeen)) > 24 * 60 * 60 * 1000) {
      setShowWelcome(true);
      localStorage.setItem('leaderboard_welcome_last', now.toString());
    }
  }, []);


  useEffect(() => {
    fetchLeaderboard();
    if (token) {
      fetchUserBookings();
      fetchLikedUsers();
    }
    // Get user location for distance calc
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [token]);

  // Auto-hide bottom nav when any modal is open
  useEffect(() => {
    const isOpen = !!(selectedUser || reportModal || reviewModal || plusModal || showRules || bookingModal);
    if (isOpen) {
      document.documentElement.setAttribute('data-modal-open', 'true');
    } else {
      document.documentElement.removeAttribute('data-modal-open');
    }
    return () => document.documentElement.removeAttribute('data-modal-open');
  }, [selectedUser, reportModal, reviewModal, plusModal, showRules, bookingModal]);

  useEffect(() => {
    if (selectedUser) {
      fetchFullProfile(selectedUser.id || selectedUser.user_id);
      fetchReviews(selectedUser.id || selectedUser.user_id);
      setActiveReviewFilter('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  const fetchFullProfile = async (userId) => {
    try {
      const res = await axios.get(`${API}/users/${userId}/public-profile`, { headers });
      if (res.data) {
        setSelectedUser(prev => {
          // If the user closed the modal while we were fetching, don't reopen it
          if (!prev) return null;
          // Only update if it's the same user
          if ((prev.id || prev.user_id) !== userId) return prev;
          return { ...prev, ...res.data };
        });
      }
    } catch (err) { console.error("Error fetching full profile:", err); }
  };

  const fetchReviews = async (userId) => {
    try {
      const res = await axios.get(`${API}/reviews/${userId}`);
      setReviewList(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Error fetching reviews:", err); }
  };

  const fetchUserBookings = async () => {
    try {
      const res = await axios.get(`${API}/bookings`, { headers });
      setUserBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Error fetching bookings:", err); }
  };

  const fetchLikedUsers = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/likes/sent`, { headers });
      const liked = new Set((res.data.likes || []).map(l => l.to_user_id));
      setLikedUsers(liked);
    } catch (err) { console.error("Error fetching likes:", err); }
  };

  const toggleLike = async (e, targetUserId) => {
    e.stopPropagation();
    if (!user) { toast.error('Please login to send likes'); return; }
    const isLiked = likedUsers.has(targetUserId);
    try {
      if (isLiked) {
        await axios.delete(`${API}/likes/${targetUserId}`, { headers });
        setLikedUsers(prev => { const s = new Set(prev); s.delete(targetUserId); return s; });
        toast.success('Like removed');
      } else {
        await axios.post(`${API}/likes/${targetUserId}`, {}, { headers });
        setLikedUsers(prev => new Set([...prev, targetUserId]));
        toast.success('Like sent! They\'ve been notified.');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    }
  };

  const calcDistance = (targetUser) => {
    if (!userLocation || !targetUser?.latitude || !targetUser?.longitude) return null;
    const R = 6371;
    const dLat = (targetUser.latitude - userLocation.lat) * Math.PI / 180;
    const dLng = (targetUser.longitude - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(userLocation.lat*Math.PI/180)*Math.cos(targetUser.latitude*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${Math.round(dist)}km`;
  };

  const handleUnlockChat = async (targetUser) => {
    if (!token) { toast.error('Please login'); return; }
    try {
      const res = await axios.post(`${API}/chat/unlock/${targetUser.id}`, {}, { headers });
      if (res.data?.conversation_id) {
        toast.success('Chat unlocked!');
        navigate(`/chat/${res.data.conversation_id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to unlock chat');
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.reason) { toast.error('Please select a reason'); return; }
    try {
      await axios.post(`${API}/safety/report`, {
        reported_user_id: reportModal.id,
        reason: reportForm.reason,
        details: reportForm.details
      }, { headers });
      toast.success('Report submitted. We will review within 24 hours.');
      setReportModal(null);
      setReportForm({ reason: '', details: '' });
    } catch (err) { toast.error(err.response?.data?.detail || 'Report failed'); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment) { toast.error('Please write a comment'); return; }
    const booking = userBookings.find(b => b.companion_id === reviewModal.id && b.status === 'completed' && !b.review_submitted);
    if (!booking) { toast.error('No completed booking found for this companion'); return; }

    try {
      await axios.post(`${API}/reviews`, { 
        booking_id: booking.id, 
        rating: reviewForm.rating, 
        comment: reviewForm.comment 
      }, { headers });
      toast.success('Review submitted!');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
      fetchUserBookings(); // Refresh bookings to update review_submitted status
    } catch (err) { toast.error(err.response?.data?.detail || 'Review failed'); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API}/leaderboard`);
      const data = res.data.leaderboard || res.data || [];
      setLeaderboard(Array.isArray(data) ? data : []);
      if (res.data.max_slots) setMaxSlots(res.data.max_slots);
      if (res.data.show_placeholders !== undefined) setShowPlaceholders(res.data.show_placeholders);
      
      // Show expansion popup if backend flags it and we haven't seen it in this session
      if (res.data.slots_recently_expanded && !sessionStorage.getItem('slots_expanded_seen')) {
        setShowExpansionPopup(true);
        sessionStorage.setItem('slots_expanded_seen', 'true');
      }
      
      if (token) fetchDiamonds();
    } catch (err) {
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDiamondBid = async () => {
    const diamonds = parseInt(bidDiamonds);
    if (isNaN(diamonds) || diamonds <= 0) {
      toast.error('Please enter a valid diamond amount');
      return;
    }
    if (userDiamonds < diamonds) {
      toast.error('Insufficient diamonds. Please top up first.');
      return;
    }
    setJoining(true);
    try {
      await axios.post(`${API}/leaderboard/bid`, { bid_diamonds: diamonds }, { headers });
      toast.success('Bid placed successfully! 💎');
      setPlusModal(false);
      fetchLeaderboard();
      fetchUser();
      fetchDiamonds();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to place bid');
    } finally {
      setJoining(false);
    }
  };

  const handleNextUser = useCallback(() => {
    if (!selectedUser) return;
    const idx = leaderboard.findIndex(u => u.id === selectedUser.id);
    if (idx !== -1 && idx < leaderboard.length - 1) {
      setSelectedUser(leaderboard[idx + 1]);
    } else if (idx === leaderboard.length - 1) {
      setSelectedUser(leaderboard[0]); // Loop back
    }
  }, [selectedUser, leaderboard]);

  const handlePrevUser = useCallback(() => {
    if (!selectedUser) return;
    const idx = leaderboard.findIndex(u => u.id === selectedUser.id);
    if (idx > 0) {
      setSelectedUser(leaderboard[idx - 1]);
    } else if (idx === 0) {
      setSelectedUser(leaderboard[leaderboard.length - 1]); // Loop back
    }
  }, [selectedUser, leaderboard]);

  const getRankTheme = (index) => {
    if (index === 0) return {
      bg: 'bg-gradient-to-br from-[#D4AF37] via-[#FFFACD] to-[#CF9911]',
      border: 'border-[#D4AF37]/30 border-2 shadow-[0_25px_50px_rgba(212,175,55,0.25)] ring-2 ring-[#FFD700]/40',
      text: 'text-amber-950',
      glow: 'shadow-[#D4AF37]/30',
      innerGlow: 'transparent',
      label: 'Grand Champion',
      gradient: 'from-[#D4AF37] via-[#FFFACD] to-[#CF9911]'
    };
    if (index === 1) return {
      bg: 'bg-gradient-to-br from-slate-100 via-white to-slate-400',
      border: 'border-white/30 border shadow-[0_15px_30px_rgba(226,232,240,0.1)] ring-1 ring-slate-200/40',
      text: 'text-slate-900',
      glow: 'shadow-slate-300/20',
      innerGlow: 'transparent',
      label: 'Master Silver',
      gradient: 'from-slate-200 via-white to-slate-400'
    };
    if (index === 2) return {
      bg: 'bg-gradient-to-br from-[#B45309] via-[#FDE68A] to-[#78350F]',
      border: 'border-white/30 border shadow-[0_15px_25px_rgba(180,83,9,0.1)] ring-1 ring-[#B45309]/40',
      text: 'text-white',
      glow: 'shadow-[#B45309]/15',
      innerGlow: 'transparent',
      label: 'Elite Bronze',
      gradient: 'from-[#B45309] via-[#FDE68A] to-[#78350F]'
    };
    if (index === 3) return {
      bg: 'bg-gradient-to-br from-cyan-50 via-white to-cyan-300',
      border: 'border-cyan-100 border shadow-[0_10px_20px_rgba(207,250,254,0.1)] ring-1 ring-cyan-100/30',
      text: 'text-cyan-900',
      glow: 'shadow-cyan-200/15',
      innerGlow: 'transparent',
      label: 'Platinum Elite'
    };
    if (index === 4) return {
      bg: 'bg-gradient-to-br from-indigo-100 via-indigo-50 to-indigo-600',
      border: 'border-indigo-200 border-2 shadow-[0_10px_20px_rgba(199,210,254,0.1)] ring-1 ring-indigo-200/30',
      text: 'text-indigo-950',
      glow: 'shadow-indigo-300/15',
      innerGlow: 'transparent',
      label: 'Sapphire Royal'
    };
    return {
      bg: 'bg-muted/10',
      border: 'border-border/10 group-hover:border-border/30 backdrop-blur-sm bg-card/50',
      text: 'text-muted-foreground',
      glow: 'group-hover:shadow-foreground/5',
      innerGlow: 'transparent',
      label: 'Verified Member'
    };
  };

  const gapToFirst = leaderboard.length > 0 ? (leaderboard[0].bid_diamonds || leaderboard[0].bid || 0) - (user?.bid_diamonds || 0) : 0;

  const canReview = selectedUser && userBookings.some(b => 
    b.companion_id === (selectedUser.id || selectedUser.user_id) && 
    b.status === 'completed' && 
    !b.review_submitted
  );

  // Timer logic for per-user 24h decay
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const inv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(inv);
  }, []);

  useEffect(() => {
    let hasExpired = false;
    const filtered = leaderboard.filter(item => {
      const created = new Date(item.updated_at || item.created_at);
      if (isNaN(created.getTime())) return true;
      const expiry = new Date(created.getTime() + 24 * 60 * 60 * 1000);
      if (expiry <= now) hasExpired = true;
      return expiry > now;
    });
    if (hasExpired) {
      setLeaderboard(filtered);
    }
  }, [now, leaderboard]);

  const getCardTimeLeft = (userDate, isAlreadyExpiry = false) => {
    if (!userDate) return "24:00:00";
    try {
      let created;
      if (typeof userDate === 'string') {
        let normalized = userDate;
        if (!normalized.includes('T')) normalized = normalized.replace(' ', 'T');
        if (!normalized.includes('Z') && !normalized.includes('+')) normalized += 'Z';
        created = new Date(normalized);
      } else {
        created = new Date(userDate);
      }
      
      if (isNaN(created.getTime())) return "24:00:00";
      
      // If the backend already provided the expiry timestamp, don't add 24h again
      const expiry = isAlreadyExpiry ? created : new Date(created.getTime() + 24 * 60 * 60 * 1000);
      const diff = expiry - now;
      
      if (diff <= 0) return "00:00:00";
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } catch {
      return "24:00:00";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <Navbar />

      {/* HEADER SECTION - Hidden on mobile per request */}
      <div className="hidden md:block pt-5 pb-3 border-b border-border/10 bg-muted/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-xl shadow-pink-500/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-white drop-shadow-md" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-base md:text-xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                    Elite <span className="text-pink-500">Board</span>
                  </h1>
                  <button
                    onClick={() => setShowRules(true)}
                    className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-pink-500"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[7px] md:text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">PlusOne Global Ranking</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Gap to First (Desktop) */}
              {user && gapToFirst > 0 && (
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 animate-pulse">
                   <TrendingUp className="w-4 h-4 text-pink-500" />
                   <span className="text-[10px] font-black text-pink-600 uppercase tracking-wider">
                     {gapToFirst} Diamonds to Rank #1
                   </span>
                </div>
              )}

              {/* View Toggle */}
              <div className="flex bg-muted/20 p-1 rounded-xl border border-border/30">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'grid' ? 'bg-background shadow-md text-pink-500' : 'text-muted-foreground'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-background shadow-md text-pink-500' : 'text-muted-foreground'}`}
                >
                  List
                </button>
              </div>

             </div>
        </div>

        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 md:pt-6">
        {loading ? (
          <div className="flex justify-center py-40"><Loader2 className="w-10 h-10 text-pink-500 animate-spin" /></div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="space-y-12 pb-8 relative">
                {/* ── UNIFIED LEADERBOARD GRID ── */}
                <div className="grid grid-cols-6 lg:grid-cols-12 gap-3 md:gap-6 px-4 max-w-7xl mx-auto">
                  {[...leaderboard, ...((showPlaceholders) ? Array(Math.max(0, maxSlots - leaderboard.length)).fill({ isPlaceholder: true }) : [])].slice(0, Math.max(showPlaceholders ? maxSlots : 0, leaderboard.length)).map((championRaw, idx) => {
                    const isPlaceholder = championRaw.isPlaceholder;
                    const pos = idx + 1;
                    const champion = isPlaceholder ? {
                      id: `placeholder-${pos}`,
                      name: `Spot ${pos}`,
                      location: 'Available',
                      diamonds: 0,
                      isPlaceholder: true
                    } : championRaw;
                    
                    const isRank1 = pos === 1;

                    // Grid Spanning Logic
                    let spanClasses = "col-span-2 lg:col-span-2"; // default (Rank 4+): 3 per row mobile, 6 per row PC
                    if (pos === 1) spanClasses = "col-span-6 lg:col-span-5"; // Rank 1: full width mobile, slightly reduced PC (41.6%)
                    else if (pos === 2) spanClasses = "col-span-3 lg:col-span-4"; // Rank 2: half width mobile, increased PC (33.3%)
                    else if (pos === 3) spanClasses = "col-span-3 lg:col-span-3"; // Rank 3: half width mobile, normal PC (25%)

                    if (isRank1) {
                      return (
                        <div
                          key={champion.id}
                          className={`${spanClasses} relative rounded-[1.5rem] md:rounded-[2rem] overflow-hidden ${!isPlaceholder ? 'cursor-pointer group' : ''} shadow-2xl border border-white/10 w-full aspect-[4/3] md:aspect-[16/9] lg:aspect-auto lg:h-[320px] bg-zinc-950`}
                          onClick={() => !isPlaceholder && setSelectedUser(champion)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />
                          {champion.profile_pic ? (
                            <img src={champion.profile_pic} alt={champion.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center"><User className="w-20 h-20 text-white/10" /></div>
                          )}
                          
                          {/* Top Left Crown */}
                          <div className="absolute top-4 left-4 z-20">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-2xl shadow-amber-500/50">
                              <Crown className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                          </div>

                          {/* Top Right Stats (Timer Only) - Smaller */}
                          <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 flex flex-col gap-1.5 md:gap-2 items-end">
                             <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                               <Gem className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-pink-400" />
                               <span className="text-[10px] md:text-sm font-black text-white">{champion.diamonds || 0}</span>
                             </div>
                             {!isPlaceholder && (
                               <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-pink-500/40 backdrop-blur-xl border border-pink-500/50 shadow-lg">
                                 <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white animate-pulse" />
                                 <span className="text-[9px] md:text-xs font-black text-white tracking-widest">{getCardTimeLeft(champion.bid_expires_at, !!champion.bid_expires_at)}</span>
                               </div>
                             )}
                          </div>

                          {/* Mobile/PC Bottom Actions */}
                          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6 flex items-end justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-xl md:text-3xl font-black text-white drop-shadow-2xl truncate mb-0.5">{champion.name}</h3>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-2.5 h-2.5 md:w-3 text-pink-400" />
                                <span className="text-white/60 text-[9px] md:text-xs font-bold">{champion.location}</span>
                              </div>
                            </div>
                            
                            {!isPlaceholder && (
                              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                                 {/* Calendar Button */}
                                 <Button 
                                   size="lg" 
                                   className="rounded-xl bg-white text-black font-black px-3 md:px-6 shadow-2xl hover:scale-105 transition-transform h-9 md:h-10"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setSelectedUser(champion);
                                   }}
                                 >
                                   <span className="hidden md:inline text-xs">Appointment</span>
                                   <Calendar className="md:hidden w-4.5 h-4.5" />
                                 </Button>

                                 {/* Like Button */}
                                 <button 
                                   onClick={(e) => toggleLike(e, champion.id)}
                                   className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all shadow-2xl bg-black/40 group/like"
                                 >
                                   <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6 transition-all duration-300">
                                     <defs>
                                       <linearGradient id={`halfFill-${champion.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                         <stop offset="50%" stopColor="#f43f5e" />
                                         <stop offset="50%" stopColor="transparent" />
                                       </linearGradient>
                                     </defs>
                                     <Heart 
                                       className={`w-full h-full transition-colors ${likedUsers.has(champion.id) ? 'text-pink-500' : 'text-white'}`} 
                                       fill={likedUsers.has(champion.id) ? `url(#halfFill-${champion.id})` : 'none'}
                                       strokeWidth={likedUsers.has(champion.id) ? 1.5 : 2}
                                     />
                                   </svg>
                                 </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Ranks 2-10
                    let badgeColors = 'from-zinc-700 to-zinc-900 shadow-zinc-900/30';
                    if (pos === 2) badgeColors = 'from-slate-200 to-slate-400 shadow-slate-400/30';
                    else if (pos === 3) badgeColors = 'from-orange-600 to-amber-700 shadow-orange-500/30';
                    else if (pos === 4) badgeColors = 'from-indigo-400 to-indigo-600 shadow-indigo-500/30';

                    const pcHeightClass = (pos === 2 || pos === 3) ? 'lg:h-[320px]' : 'lg:h-[240px]';

                    return (
                      <div
                        key={champion.id}
                        onClick={() => !isPlaceholder && setSelectedUser(champion)}
                        className={`${spanClasses} relative flex-1 rounded-[1.2rem] overflow-hidden ${!isPlaceholder ? 'cursor-pointer group' : ''} border border-white/10 aspect-[3/4] md:aspect-[4/5] lg:aspect-auto ${pcHeightClass} bg-zinc-950`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent z-10" />
                        {champion.profile_pic ? (
                          <img src={champion.profile_pic} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={champion.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900/50"><User className="w-12 h-12 text-white/5" /></div>
                        )}
                        
                        {/* Badge */}
                        <div className="absolute top-2 left-2 z-20">
                          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br ${badgeColors} flex items-center justify-center shadow-lg`}>
                            <span className="text-white font-black text-[10px] md:text-sm">{pos}</span>
                          </div>
                        </div>

                        {/* Top Right Diamonds */}
                        <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/5">
                            <Gem className="w-2.5 h-2.5 md:w-3 md:h-3 text-pink-400" />
                            <span className="text-[9px] md:text-[10px] font-black text-white">{champion.diamonds || 0}</span>
                          </div>
                          {!isPlaceholder && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg bg-pink-500/20 backdrop-blur-md border border-pink-500/20">
                              <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                              <span className="text-[8px] md:text-[9px] font-black text-white">{getCardTimeLeft(champion.bid_expires_at, !!champion.bid_expires_at)}</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Info */}
                        <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-4 flex items-end justify-between">
                           <div className="min-w-0 flex-1 pr-2">
                             <h3 className="text-xs md:text-base font-black text-white truncate">{champion.name}</h3>
                             <p className="text-[8px] md:text-[9px] text-white/40 font-bold uppercase tracking-widest mt-0.5 truncate">{champion.location}</p>
                           </div>
                           {!isPlaceholder && (
                             <button 
                              onClick={(e) => { e.stopPropagation(); toggleLike(e, champion.id); }}
                              className="w-7 h-7 md:w-9 md:h-9 shrink-0 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/10 bg-black/40"
                             >
                                <svg width="16" height="16" viewBox="0 0 24 24">
                                  <defs>
                                    <linearGradient id={`halfFill-small-${champion.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="50%" stopColor="#f43f5e" />
                                      <stop offset="50%" stopColor="transparent" />
                                    </linearGradient>
                                  </defs>
                                  <Heart className={`w-3.5 h-3.5 md:w-4.5 md:h-4.5 ${likedUsers.has(champion.id) ? 'text-pink-500' : 'text-white'}`} fill={likedUsers.has(champion.id) ? `url(#halfFill-small-${champion.id})` : 'none'} />
                                </svg>
                             </button>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-3 max-w-4xl mx-auto">
                {leaderboard.length === 0 && (
                  <div className="text-center py-24 text-muted-foreground/40">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-black uppercase text-xs tracking-widest">No members yet</p>
                  </div>
                )}
                {leaderboard.map((item, index) => {
                  const theme = getRankTheme(index);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedUser(item)}
                      className={`flex items-center gap-4 p-4 rounded-3xl bg-card border ${theme.border} hover:bg-muted/30 transition-all cursor-pointer group`}
                    >
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black ${theme.bg} ${theme.text}`}>
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 shrink-0 rounded-2xl overflow-hidden border border-border/20 shadow-sm">
                        {item.profile_pic ? <img src={item.profile_pic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"><User className="w-4 h-4" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm truncate">{item.name}</h4>
                          {index < 3 && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold truncate">
                          {item.height || item.hight ? `${item.height || item.hight}, ` : ''}{item.location || 'Verified Member'}
                        </p>
                      </div>
                       <div className="shrink-0 flex flex-row items-center gap-2 ml-auto">
                         <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm transition-transform group-hover:scale-110">
                           <Gem className="w-3.5 h-3.5" />
                           <span className="font-black text-xs">{item.diamonds || item.bid_diamonds || item.bid || 0}</span>
                         </div>
                         <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/20 shadow-sm">
                           <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                           <span className="text-[10px] md:text-xs font-black text-pink-500 tracking-wider">{getCardTimeLeft(item.bid_expires_at || item.updated_at || item.created_at, !!item.bid_expires_at)}</span>
                         </div>
                       </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                    </div>
                  );
                 })}
             </div>
          )}

            {/* Request Slots Section */}
            {leaderboard.length >= maxSlots && (
              <div className="mt-12 flex flex-col items-center justify-center space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Board is Full</p>
                  <p className="text-xs text-muted-foreground/60 max-w-[250px] mx-auto leading-relaxed">The elite board has reached its maximum capacity of {maxSlots} slots.</p>
                </div>
                <Button 
                  onClick={async () => {
                    try {
                      await axios.post(`${API}/leaderboard/request-slots`, {}, { headers });
                      toast.success("Request sent! We will notify you if slots are expanded.");
                    } catch (e) {
                      toast.error("You need to be logged in to request more slots.");
                    }
                  }}
                  className="rounded-xl h-12 px-6 bg-pink-500 hover:bg-pink-600 text-white font-black shadow-lg shadow-pink-500/20"
                >
                  <Crown className="w-4 h-4 mr-2" /> Request For More Slots
                </Button>
              </div>
            )}

            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
              <DialogContent className="max-w-[420px] w-[96vw] max-h-[92vh] h-[92vh] overflow-hidden p-0 border-0 border-transparent ring-0 focus:ring-0 outline-none bg-background shadow-2xl rounded-[2.5rem] flex flex-col no-scrollbar [&>button]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                 <VisuallyHidden>
                   <DialogTitle>Profile of {selectedUser?.name || 'User'}</DialogTitle>
                   <DialogDescription>Member profile details from the elite board.</DialogDescription>
                 </VisuallyHidden>

                 {selectedUser && (
                   <CompanionProfileDetail
                     companion={selectedUser}
                     user={user}
                     token={token}
                     onClose={() => setSelectedUser(null)}
                     onBookingRequest={(comp) => {
                       setSelectedUser(null);
                       setBookingModal(comp);
                     }}
                     onUnlockChat={handleUnlockChat}
                     onReport={(comp) => {
                       setSelectedUser(null);
                       setReportModal(comp);
                     }}
                     onReview={(comp) => {
                       setSelectedUser(null);
                       setReviewModal(comp);
                     }}
                     mutualMatch={false}
                     haveSentLike={likedUsers.has(selectedUser.id)}
                     hasCompletedBooking={userBookings.some(b => b.companion_id === (selectedUser.id || selectedUser.user_id) && b.status === 'completed')}
                     reviewList={reviewList}
                     onNext={leaderboard.length > 1 ? handleNextUser : null}
                     onPrev={leaderboard.length > 1 ? handlePrevUser : null}
                   />
                 )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* FLOATING ACTION BUTTON */}
      {user && !selectedUser && (
        <div className="fixed bottom-20 md:bottom-8 right-6 md:right-8 z-[60] flex flex-col items-end">
          <Dialog open={plusModal} onOpenChange={(open) => { setPlusModal(open); if (open) setBiddingStep(1); }}>
            <DialogTrigger asChild>
              <button 
                className={`group relative overflow-hidden flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-xl shadow-pink-500/40 transition-all outline-none border-none hover:scale-110 active:scale-95 ${plusModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <Plus className="w-6 h-6 text-white relative z-10" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[92vw] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-background/95 backdrop-blur-3xl max-h-[90vh] overflow-y-auto">
              <VisuallyHidden>
                <DialogTitle>Bidding Information</DialogTitle>
                <DialogDescription>Rules and guide for board bidding.</DialogDescription>
              </VisuallyHidden>
              {biddingStep === 1 && (
                <div className="p-5 sm:p-8 space-y-5 sm:y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Active <span className="text-pink-500">Bidders</span></h2>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Today's Competition</p>
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 rounded-2xl bg-muted/30 border border-border/10 space-y-1.5 sm:space-y-2">
                    <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1 sm:mb-2"><Info className="w-3.5 h-3.5 text-pink-500" /> Bidding Rules</p>
                    <div className="text-[9px] sm:text-[10px] font-bold text-foreground space-y-1">
                      <p>• Higher bids secure higher ranks.</p>
                      <p>• Rank positions stay for 24 hours.</p>
                      <p>• Top 3 get Elite profile frames.</p>
                    </div>
                  </div>

                  <ScrollArea className="h-[220px] -mx-2 px-2">
                    <div className="space-y-2 pr-2">
                      {leaderboard.map((item, i) => (
                        <div key={item.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl bg-muted/20 border border-white/5 group hover:bg-muted/40 transition-colors">
                           <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-[10px] font-black text-pink-500">{i+1}</div>
                           <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                              {item.profile_pic ? <img src={item.profile_pic} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground/40">{item.name?.charAt(0)}</div>}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-black text-[12px] truncate leading-none mb-1">{item.name}</p>
                              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter truncate opacity-60">{item.location || 'Global'}</p>
                           </div>
                           <div className="flex items-center shrink-0 gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/10 max-w-[40%]">
                              <Gem className="w-3 h-3 text-pink-500 shrink-0" />
                              <span className="text-[11px] font-black text-pink-600 truncate">{item.diamonds || item.bid_diamonds || item.bid || item.leaderboard_score || 0}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="pt-4 border-t border-border/10">
                    <Button onClick={() => setBiddingStep(2)} className="w-full h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 font-black shadow-lg shadow-pink-500/20 text-xs uppercase tracking-widest">Join the Bid</Button>
                  </div>
                </div>
              )}

              {biddingStep === 2 && (
                <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Bid Amount</h2>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Rank Investment</p>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-muted/20 border border-white/5 space-y-5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Investment (Diamonds)</Label>
                    <div className="relative">
                      <Gem className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-500 w-6 h-6" />
                      <Input 
                        type="number" 
                        value={bidDiamonds}
                        onChange={(e) => setBidDiamonds(e.target.value)}
                        className="pl-14 h-16 bg-background text-2xl font-black rounded-3xl border-border/40 focus-visible:ring-2 focus-visible:ring-pink-500/30"
                        placeholder="100"
                      />
                    </div>
                    <div className="flex items-center justify-between px-4">
                       <div className="flex items-center gap-2 text-xs font-bold">
                          <span className="text-muted-foreground">Balance:</span>
                          <span className="text-pink-500 flex items-center gap-1"><Gem className="w-3 h-3" /> {userDiamonds}</span>
                       </div>
                       {userDiamonds < parseInt(bidDiamonds || 0) && (
                         <Link to="/subscription" className="text-[10px] font-black text-pink-500 underline uppercase tracking-widest hover:text-pink-600">Top Up Now</Link>
                       )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={handleDiamondBid}
                      disabled={joining || !bidDiamonds || parseInt(bidDiamonds) <= 0}
                      className="w-full h-16 rounded-[1.5rem] bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-sm shadow-2xl shadow-pink-500/30"
                    >
                      {joining ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Confirm & Boost Rank</span>}
                    </Button>
                    <Button variant="ghost" onClick={() => setBiddingStep(1)} className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">Back to Bidders List</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Leaderboard Rules Info Modal */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-background/95 backdrop-blur-3xl animate-in zoom-in-95 duration-300">
           <VisuallyHidden>
             <DialogTitle>Rank Up Modal</DialogTitle>
             <DialogDescription>Purchase diamonds or bid to increase rank.</DialogDescription>
           </VisuallyHidden>
           <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight"><span className="text-pink-500">Elite Board</span> Rules</h2>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Everything you need to know</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center">
                   <Info className="w-6 h-6 text-pink-500" />
                </div>
              </div>

              <div className="space-y-4">
                 <div className="p-4 rounded-3xl bg-muted/20 border border-border/5 space-y-3">
                    <div className="flex items-start gap-3">
                       <TrendingUp className="w-4 h-4 text-pink-500 shrink-0 mt-1" />
                       <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-wide">Ranking System</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">Your position on the Elite Board is determined by your total investment (Diamonds). High-volume bidders secure top ranks instantly.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                       <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-wide">Member Benefits</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">Top ranks receive exclusive profile badges, premium visibility, and priority placement across the PlusOne platform.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <Zap className="w-4 h-4 text-indigo-500 shrink-0 mt-1" />
                       <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-wide">Rank Refresh</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">Leaderboards refresh dynamically. Other members can bid higher at any time to overtake your position—stay active to stay on top!</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-4 rounded-3xl bg-pink-500/5 border border-pink-500/10">
                    <p className="text-[10px] font-bold text-pink-600/60 uppercase tracking-widest text-center">Join thousands of elite members already trending on PlusOneStar</p>
                 </div>
              </div>

              <Button 
                onClick={() => setShowRules(false)}
                className="w-full h-14 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-black text-xs uppercase tracking-widest shadow-lg"
              >
                Close Infomation
              </Button>
           </div>
        </DialogContent>
      </Dialog>
      {/* Booking Modal */}
      <BookingFormModal 
        isOpen={bookingModal} 
        onClose={() => setBookingModal(false)} 
        companion={selectedUser} 
        token={token}
        initialMode={bioMode}
      />
      {/* Report Modal */}
      <Dialog open={!!reportModal} onOpenChange={() => setReportModal(null)}>
        <DialogContent className="sm:max-w-sm rounded-[2rem] border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-black flex items-center gap-2"><Flag className="w-5 h-5 text-rose-500" /> Report User</DialogTitle></DialogHeader>
          <form onSubmit={submitReport} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reason for reporting</Label>
              <Select value={reportForm.reason} onValueChange={(v) => setReportForm({...reportForm, reason: v})}>
                <SelectTrigger className="h-12 rounded-xl border-border/20 bg-muted/30"><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {['Fake profile', 'Inappropriate behavior', 'Harassment', 'Spam', 'Scam/Fraud', 'Other'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Additional Details</Label>
              <Textarea 
                placeholder="Please describe the issue..." 
                className="rounded-xl border-border/20 bg-muted/30 focus-visible:ring-rose-500/20"
                rows={4} 
                value={reportForm.details} 
                onChange={(e) => setReportForm({...reportForm, details: e.target.value})} 
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed opacity-60">Reports are reviewed by our safety team 24/7. False reporting may lead to account suspension.</p>
            <Button type="submit" variant="destructive" className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-rose-500/20">Submit Report</Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* Review Modal */}
      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent className="sm:max-w-sm rounded-[2rem] border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-black flex items-center gap-2 text-amber-500"><Star className="w-5 h-5 fill-amber-500" /> Rate & Review</DialogTitle></DialogHeader>
          <form onSubmit={submitReview} className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center block">How was your experience?</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button" onClick={() => setReviewForm({...reviewForm, rating: s})} className="transition-transform active:scale-90">
                    <Star className={`w-8 h-8 ${s <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Your Feedback</Label>
              <Textarea 
                placeholder="Share your experience with the community..." 
                className="rounded-xl border-border/20 bg-muted/30 min-h-[120px]"
                value={reviewForm.comment} 
                onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})} 
              />
            </div>
            <Button type="submit" className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">Submit Review</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Welcome Popup */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-[300px] rounded-[2rem] border-none shadow-2xl bg-background/95 backdrop-blur-3xl p-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Welcome to Elite Board</DialogTitle>
            <DialogDescription>Information about the Elite Board ranking system.</DialogDescription>
          </VisuallyHidden>
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/20 rotate-12">
               <Trophy className="w-8 h-8 text-white -rotate-12" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight">Elite <span className="text-pink-500">Board</span></h2>
              <p className="text-[10px] text-muted-foreground font-medium px-2">
                Welcome to the global ranking. Higher bids secure top ranks for 24 hours. Stand out to the community!
              </p>
            </div>
            <Button 
              onClick={() => setShowWelcome(false)}
              className="w-full h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest shadow-lg shadow-pink-500/20"
            >
              Start Exploring
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Expansion Notification Modal */}
      <Dialog open={showExpansionPopup} onOpenChange={setShowExpansionPopup}>
        <DialogContent className="max-w-sm rounded-[2.5rem] border-none shadow-2xl p-8 text-center space-y-6">
          <VisuallyHidden>
            <DialogTitle>Slots Expanded</DialogTitle>
            <DialogDescription>Notification about leaderboard slot expansion.</DialogDescription>
          </VisuallyHidden>
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 shadow-xl shadow-emerald-500/10">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-tight text-emerald-500">More Slots Added!</h2>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Due to high demand from our amazing community, we have just added new slots to the Elite Board. Participate now before they fill up!
            </p>
          </div>
          <Button
            className="w-full h-12 rounded-xl font-black text-sm bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white"
            onClick={() => setShowExpansionPopup(false)}
          >
            Awesome! Let's Go
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  );
}
