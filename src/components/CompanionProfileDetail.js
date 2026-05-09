import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, BadgeCheck, Star, ChevronLeft, ChevronRight,
  MessageSquare, Calendar, Flag, Heart, Share2, Clock, Lock,
  BookOpen, Briefcase, Smile, Award, Users, Coins, Sparkles,
  ArrowRight, ShieldCheck, Zap, Ruler
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CurvedHeart } from './CurvedHeart';
import axios from 'axios';
import { toast } from 'sonner';
import { SKILL_CATEGORIES, MASTER_SKILLS_LIST } from '@/constants/skills';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

function useCountdown(targetIso) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!targetIso) return;
    const calc = () => Math.max(0, Math.floor((new Date(targetIso) - Date.now()) / 1000));
    setRemaining(calc());
    const id = setInterval(() => {
      const r = calc();
      setRemaining(r);
      if (r <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return remaining;
}

function formatCountdown(secs) {
  if (!secs || secs <= 0) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
}

export function CompanionProfileDetail({
  companion,
  user,
  token,
  onClose,
  onBookingRequest,
  onUnlockChat,
  onReport,
  onReview,
  mutualMatch,
  haveSentLike,
  hasCompletedBooking,
  reviewList = [],
  hideBooking,
  hideActions,
  restrictedMode,
  onNext,
  onPrev
}) {
  const cp = companion?.companion_profile || {};
  const photos = companion?.photos || [];
  const allPhotos = photos.length > 0 ? photos : (companion?.profile_pic ? [{ url: companion.profile_pic, id: 'main' }] : []);

  const [photoIdx, setPhotoIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('casual');
  const [isLiked, setIsLiked] = useState(haveSentLike || false);
  const [isMutual, setIsMutual] = useState(mutualMatch || false);
  const [chatUnlockInfo, setChatUnlockInfo] = useState(null);
  const [activeReviewFilter, setActiveReviewFilter] = useState('all');
  const [heightUnit, setHeightUnit] = useState('cm');
  const scrollContainerRef = useRef(null);
  const reviewsRef = useRef(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatHeight = (cm) => {
    if (!cm || cm <= 0) return null;
    if (heightUnit === 'cm') return `${cm} cm`;
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${ft}'${inches}"`;
  };
  const toggleHeightUnit = () => setHeightUnit(u => u === 'cm' ? 'ft' : 'cm');

  const plan = (companion.subscription?.plan || companion.subscription?.plan_id || companion.subscription_plan || '').toLowerCase();
  const isGoldUser = (plan.includes('pro') || plan.includes('premium') || plan.includes('plus')) || companion.subscription?.is_active;

  const headers = { Authorization: `Bearer ${token}` };


  useEffect(() => {
    if (!token || !companion?.id) return;
    const fetch = async () => {
        setChatUnlockInfo(null); // Clear previous user state immediately
        try {
        const res = await axios.get(`${API}/chat/conversations`, { headers });
        const convos = res.data || [];
        const cId = String(companion.id);
        const match = convos.find(c => {
          const otherId = String(c.other_user?.id || c.other_user_id || '');
          const parts = (c.participants || []).map(String);
          return otherId === cId || parts.includes(cId);
        });
        if (match) {
          setChatUnlockInfo({
            conversation_id: match.id,
            expiry_at: match.expires_at || match.expiry_at || match.unlock_expiry || null,
          });
        } else {
          setChatUnlockInfo(null);
        }
      } catch { setChatUnlockInfo(null); }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, companion?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev]);

  const secsLeft = useCountdown(chatUnlockInfo?.expiry_at);
  // If no expiry set (lifetime unlock), label will be null but isUnlocked still shows green
  const countdownLabel = chatUnlockInfo?.expiry_at ? formatCountdown(secsLeft) : null;
  const windowOpen = !chatUnlockInfo?.expiry_at || (secsLeft > 0);
  const isUnlocked = !!chatUnlockInfo && windowOpen;

  const handleChatAction = async () => {
    if (isUnlocked && chatUnlockInfo?.conversation_id) {
      window.location.href = `/chat/${chatUnlockInfo.conversation_id}`;
      return;
    }
    if (!token) {
      toast.error('Please login first.');
      return;
    }
    setShowUnlockDialog(true);
  };

  const confirmUnlock = async () => {
    try {
      const res = await axios.post(`${API}/chat/unlock/${companion.id}`, {}, { headers });
      if (res.data?.conversation_id) {
        toast.success('Chat unlocked!');
        setChatUnlockInfo({
          conversation_id: res.data.conversation_id,
          expiry_at: res.data.expires_at || null,
        });
        setShowUnlockDialog(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to unlock chat');
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!token) return;
    try {
      if (isLiked) {
        await axios.delete(`${API}/likes/${companion.id}`, { headers });
        setIsLiked(false);
        setIsMutual(false);
        toast.success('Removed from favorites');
      } else {
        const res = await axios.post(`${API}/likes/${companion.id}`, {}, { headers });
        setIsLiked(true);
        if (res.data?.is_mutual) {
          setIsMutual(true);
          toast.success('It\'s a Match! ❤️');
        } else {
          toast.success('Added to favorites');
        }
      }
    } catch {
      toast.error('Failed to update like status');
    }
  };

  const prevPhoto = () => setPhotoIdx(i => (i > 0 ? i - 1 : allPhotos.length - 1));
  const nextPhoto = () => setPhotoIdx(i => (i < allPhotos.length - 1 ? i + 1 : 0));

  const bio = activeTab === 'casual'
    ? (cp.casual_bio || companion?.casual_bio || 'No casual bio provided.')
    : (cp.professional_bio || companion?.professional_bio || 'No professional bio provided.');

  const price = activeTab === 'casual' ? (cp.casual_price || companion?.casual_price) : (cp.professional_price || companion?.professional_price);
  const interests = activeTab === 'casual'
    ? (cp.casual_interests || companion?.casual_interests || companion?.hobbies || [])
    : (cp.professional_interests || companion?.professional_interests || companion?.interests || []);

  const rating = cp.rating || companion?.rating || 0;
  const reviewCount = reviewList.length;

  const filteredReviews = activeReviewFilter === 'all'
    ? reviewList
    : reviewList.filter(r => Math.floor(r.rating) === parseInt(activeReviewFilter));

  // Synthesize height from multiple potential fields
  const fetchedHeight = parseInt(companion?.height) ||
    parseInt(companion?.companion_profile?.height) ||
    parseInt(cp?.height) ||
    parseInt(companion?.profile_data?.height) ||
    parseInt(companion?.profile?.height) ||
    parseInt(companion?.hight) || 0;

  return (
    <div className="flex flex-col h-full w-full bg-black overflow-hidden relative group">
      <VisuallyHidden>
        <DialogTitle>Profile of {companion?.name}</DialogTitle>
        <DialogDescription>Full details, bio, and reviews for {companion?.name}.</DialogDescription>
      </VisuallyHidden>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        {/* PHOTO HEADER */}
        <div className={`relative ${restrictedMode ? 'h-full md:h-[92vh] sm:rounded-[1.5rem]' : 'h-[92vh] md:h-[88vh] sm:rounded-t-[1.5rem]'} overflow-hidden bg-black shrink-0`}>
          <AnimatePresence mode="wait">
            <motion.div key={photoIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0">
              <img src={allPhotos[photoIdx]?.url || allPhotos[photoIdx]} alt="" className="w-full h-full object-cover" />
            </motion.div>
          </AnimatePresence>

          {isGoldUser && (
            <div className="absolute inset-0 z-40 pointer-events-none rounded-t-[1.5rem]" style={{
              padding: '5px',
              background: 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor', maskComposite: 'exclude',
              boxShadow: '0 0 24px rgba(191,149,63,0.5), inset 0 0 12px rgba(191,149,63,0.1)',
            }} />
          )}

          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent z-10" />

          {allPhotos.length > 1 && (
            <>
              <div className="absolute inset-0 z-20 flex items-center justify-between px-4 pointer-events-none">
                <button onClick={(e) => { e.stopPropagation(); prevPhoto(); }} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white flex items-center justify-center pointer-events-auto active:scale-95 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={(e) => { e.stopPropagation(); nextPhoto(); }} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white flex items-center justify-center pointer-events-auto active:scale-95 transition-all"><ChevronRight className="w-5 h-5" /></button>
              </div>
              
              <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center gap-1.5 px-4 pointer-events-none">
                {allPhotos.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === photoIdx ? 'w-6 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-1.5 bg-white/30'}`} 
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute top-6 right-6 z-[70] flex items-center gap-2">
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all hover:bg-white/20"><X className="w-5 h-5" /></button>
          </div>

          <div className="absolute bottom-6 right-6 z-[70]">
            <motion.button whileTap={{ scale: 1.5 }} whileHover={{ scale: 1.1 }} onClick={handleLike} className="w-14 h-14 flex items-center justify-center bg-transparent group" style={{ filter: isLiked ? 'drop-shadow(0 0 12px rgba(244,63,94,0.7))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" className="transition-all duration-300">
                <defs><linearGradient id="halfHeartGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="50%" stopColor="transparent" /><stop offset="50%" stopColor="#f43f5e" /></linearGradient></defs>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={isMutual ? "#f43f5e" : (isLiked ? "url(#halfHeartGradient)" : "white")} fillOpacity={(!isLiked && !isMutual) ? 0 : 1} stroke={(isLiked || isMutual) ? "#f43f5e" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>

          {restrictedMode && (
            <div className="absolute bottom-6 left-6 right-24 z-[70]">
              <div className="flex flex-col items-start gap-1.5">
                <button
                  onClick={handleChatAction}
                  className={`h-14 px-5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest backdrop-blur-md shadow-2xl transition-all ${isUnlocked
                    ? 'bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.5)] animate-pulse'
                    : 'bg-black/60 text-white border border-white/20 hover:bg-black/80'
                    }`}
                >
                  {isUnlocked ? <MessageSquare className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {isUnlocked ? 'Open Chat' : 'Unlock Chat'}
                </button>
                {isUnlocked && countdownLabel && (
                  <div className="flex items-center gap-1 bg-yellow-400 backdrop-blur-md text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-yellow-200 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-black inline-block animate-pulse" />
                    {countdownLabel} left
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!restrictedMode && (
          <>
            {/* INFO HEADER SECTION */}
            <div className="px-8 pb-4 pt-10 bg-background relative z-[45] rounded-t-[0.1rem] border-t border-amber-500/10 shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col">

                {/* ROW 1: NAME & RATING */}
                <div className="flex items-center flex-wrap gap-4">
                  <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight uppercase">
                    {companion?.name || 'User'}
                  </h1>
                  {companion?.is_verified && <BadgeCheck className="w-5 h-5 text-emerald-500" />}

                  <button
                    onClick={scrollToReviews}
                    className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-slate-950/80 border border-amber-500/30 shadow-lg shadow-amber-500/5 active:scale-95 transition-all"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span className="text-[11px] font-black text-white">Verified Rating: {(rating || 0).toFixed(1)}</span>
                    <ArrowRight className="w-3 h-3 text-white/40 ml-1" />
                  </button>
                </div>

                {/* ROW 2: LOCATION - DISTINCT GAP (mt-8) */}
                {companion?.location && (
                  <div className="flex items-center gap-3 text-muted-foreground/80 mt-8 mb-4">
                    <MapPin className="w-4.5 h-4.5 text-rose-500 opacity-80" />
                    <span className="text-[11px] font-black uppercase tracking-widest leading-none">{companion.location}</span>
                  </div>
                )}

                <div className="w-full h-px bg-border/5 mb-4" />

                {/* ROW 3: METADATA - TIGHT GROUPING */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8 text-muted-foreground/80">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                        {companion?.age || cp?.age || '—'} Yrs
                      </span>
                    </div>

                    <div className="flex items-center gap-2 cursor-pointer select-none group/height px-3 py-1.5 rounded-xl bg-muted/20 border border-border/10 shadow-sm transition-colors hover:bg-muted/30" onClick={toggleHeightUnit}>
                      <Ruler className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none text-foreground">
                        {fetchedHeight > 0 ? formatHeight(fetchedHeight) : '—'}
                      </span>
                      {fetchedHeight > 0 && (
                        <span className="text-[7px] font-bold text-primary/60 border border-primary/20 rounded-full px-1.5 py-0.5 bg-background">{heightUnit === 'cm' ? 'FT' : 'CM'}</span>
                      )}
                    </div>
                  </div>

                  {/* REPORT FLAG */}
                  <button
                    className="w-10 h-10 rounded-2xl bg-muted/20 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 shadow-sm transition-all active:scale-95 border border-border/10"
                    onClick={() => onReport?.(companion)}
                  >
                    <Flag className="w-4.5 h-4.5 fill-rose-500/20" />
                  </button>
                </div>
              </div>
            </div>

            {/* DETAILS FLOW */}
            <div className="px-6 pt-2 pb-10 space-y-8 bg-background relative z-40">

              {/* Tighter spacing for tabs container */}
              <div className="flex p-1.5 bg-muted/5 rounded-[2rem] border-none mb-2">
                {['casual', 'professional'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.14em] transition-all duration-300 ${activeTab === tab
                      ? (tab === 'casual' ? 'bg-[#f43f5e] shadow-lg text-white' : 'bg-[#3b82f6] shadow-lg text-white')
                      : 'text-foreground/40 hover:text-foreground/60 hover:bg-muted/5'}`}
                  >
                    {tab === 'casual' ? <Smile className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                    {tab}
                  </button>
                ))}
              </div>

              {/* CORE STATS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-muted/20 border border-border/5 space-y-1.5 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Standing</p>
                  <div className="flex items-end justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span className="text-xl font-black">{rating || '0.0'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/60 whitespace-nowrap mb-0.5">{reviewCount} Reviews</span>
                  </div>
                </div>
                <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 space-y-1.5 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Investment</p>
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-500" />
                    <span className="text-xl font-black text-emerald-600">₹{price || '999'}<span className="text-xs opacity-60 ml-1">/hr</span></span>
                  </div>
                </div>
              </div>

              {/* BIO */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className={`w-1 h-3.5 rounded-full ${activeTab === 'casual' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-primary shadow-[0_0_8px_rgba(37,99,235,0.4)]'}`} />
                  <h4 className="text-[6.5px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">{activeTab === 'casual' ? 'The Persona' : 'Professional Focus'}</h4>
                </div>
                <div className="relative p-4 rounded-[2rem] bg-muted/10 border border-border/5">
                  <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-pink-500/20" />
                  <p className="text-[14px] leading-relaxed text-foreground/80 font-medium">{bio}</p>
                </div>
              </div>

              {/* INTERESTS / SKILLS */}
              {(interests.length > 0 || (activeTab === 'professional' && cp.professional_skills?.length > 0)) && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 px-1">
                    <div className={`w-1 h-3.5 rounded-full ${activeTab === 'casual' ? 'bg-rose-500' : 'bg-primary'}`} />
                    <h4 className="text-[2.5px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">{activeTab === 'casual' ? 'Passions' : 'Expertise'}</h4>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {interests.map(h => (
                      <Badge key={h} variant="secondary" className="bg-muted/30 hover:bg-muted/50 text-[14px] font-black uppercase py-1.5 px-4 rounded-xl border-none transition-colors">
                        {h}
                      </Badge>
                    ))}
                  </div>

                  {activeTab === 'professional' && cp.professional_skills?.length > 0 && (
                    <div className="mt-8 space-y-6">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-[6.5px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Professional Skill Set</h4>
                      </div>

                      <div className="space-y-12">
                        {SKILL_CATEGORIES.map(cat => {
                          const categorySkills = cp.professional_skills.filter(s => (MASTER_SKILLS_LIST[cat.id] || []).includes(s));
                          if (categorySkills.length === 0) return null;

                          const colorMap = {
                            blue: 'bg-blue-500 text-blue-500 border-blue-500/20',
                            purple: 'bg-purple-500 text-purple-500 border-purple-500/20',
                            emerald: 'bg-emerald-500 text-emerald-500 border-emerald-500/20',
                            orange: 'bg-orange-500 text-orange-500 border-orange-500/20',
                            indigo: 'bg-indigo-500 text-indigo-500 border-indigo-500/20',
                            rose: 'bg-rose-500 text-rose-500 border-rose-500/20'
                          };
                          const activeColor = colorMap[cat.color] || colorMap.blue;

                          return (
                            <div key={cat.id} className="space-y-5 pt-8 first:pt-0">
                              <div className="flex items-center gap-2">
                                <div className={`w-1 h-3 rounded-full ${activeColor.split(' ')[0]}`} />
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{cat.label}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {categorySkills.map(skill => (
                                  <div
                                    key={skill}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/10 border ${activeColor.split(' ').slice(2).join(' ')} transition-all hover:bg-muted/20`}
                                  >
                                    <div className={`w-1 h-1 rounded-full ${activeColor.split(' ')[0]}  opacity-40`} />
                                    <span className="text-[10px] font-black uppercase tracking-tight text-foreground/80">{skill}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Uncategorized Skills if any */}
                        {(() => {
                          const knownSkills = Object.values(MASTER_SKILLS_LIST).flat();
                          const otherSkills = cp.professional_skills.filter(s => !knownSkills.includes(s));
                          if (otherSkills.length === 0) return null;
                          return (
                            <div className="space-y-5 pt-8">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-3 rounded-full bg-muted-foreground/30" />
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Specializations</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {otherSkills.map(skill => (
                                  <div key={skill} className="px-3 py-2 rounded-xl bg-muted/10 border border-border/10">
                                    <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">{skill}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* INFO TABLE */}
              <div className="grid grid-cols-2 gap-4 py-8 border-y border-border/5">
                {[
                  { label: 'Occupation', value: cp.occupation || companion?.occupation || 'Private' },
                  { label: 'Religion', value: cp.religion || companion?.religion || 'Liberal' },
                  { label: 'College', value: cp.college || companion?.college || 'Verified' },
                  { label: 'Blood Group', value: cp.blood_group || companion?.blood_group || '-' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1 bg-muted/10 p-4 rounded-[1.5rem] border border-border/5">
                    <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">{item.label}</p>
                    <p className="text-xs font-black truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* ACTION BUTTONS */}
              {companion?.id !== user?.id ? (
                hideActions ? (
                  /* From chat view: just show a like button */
                  <div className="pt-4 flex justify-center">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={handleLike}
                      className={`h-14 px-10 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all duration-500 ${isMutual ? 'bg-rose-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.4)]' : isLiked ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-muted/20 border border-border/10 text-foreground/60 hover:text-foreground hover:border-border/20'}`}
                    >
                      <Heart className={`w-5 h-5 ${isMutual || isLiked ? 'fill-current' : ''}`} />
                      {isMutual ? 'Mutual Match ❤️' : isLiked ? 'Liked' : 'Like'}
                    </motion.button>
                  </div>
                ) : (
                <div className="pt-4 flex gap-2.5">
                  <div className="relative flex-[1.2]">
                    <button
                      onClick={handleChatAction}
                      className={`w-full h-12 rounded-2xl flex items-center justify-center gap-2 p-4 font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${isUnlocked ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-zinc-900 border border-border/10 text-white'}`}
                    >
                      {isUnlocked ? <MessageSquare className="w-4 h-4" /> : <Lock className="w-4 h-4" />} {isUnlocked ? 'OPEN CHAT' : 'UNLOCK CHAT'}
                    </button>
                    {isUnlocked && windowOpen && (
                      <div className="absolute -top-2.5 -right-2 z-50 bg-yellow-400 text-black text-[9px] font-black py-1 px-2.5 rounded-full border-2 border-background animate-pulse shadow-lg">
                        <Clock className="w-2.5 h-2.5" /> {countdownLabel}
                      </div>
                    )}
                  </div>
                  {!hideBooking && (
                    <button onClick={() => onBookingRequest?.(companion)} className="flex-[3] h-12 rounded-2xl bg-[#ec4899] text-white flex items-center justify-center gap-2.5 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-pink-500/20">
                      <Calendar className="w-4 h-4" /> APPOINTMENT
                    </button>
                  )}
                </div>
                )
              ) : (
                <div className="pt-4">
                  <div className="w-full h-12 rounded-2xl bg-muted/20 border border-border/10 flex items-center justify-center text-muted-foreground/50 font-black text-[10px] uppercase tracking-widest cursor-not-allowed">
                    This is your Profile
                  </div>
                </div>
              )}

              {/* REVIEWS */}
              <div ref={reviewsRef} className="space-y-8 pt-10 pb-20">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground/80">Reviews <span className="text-[10px] text-muted-foreground/40 ml-2">({reviewCount})</span></h3>
                  <div className="flex bg-muted/40 p-1 rounded-xl border border-border/5">
                    {['all', '5', '4', '3', '2', '1'].map(f => (
                      <button key={f} onClick={() => setActiveReviewFilter(f)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeReviewFilter === f ? 'bg-background shadow-md text-pink-500' : 'text-muted-foreground'}`}>
                        {f === 'all' ? 'All' : `${f}★`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  {filteredReviews.length > 0 ? filteredReviews.slice(0, 5).map(r => (
                    <div key={r.id} className="p-6 rounded-[2rem] bg-muted/20 border border-border/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />)}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/40">{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <p className="text-sm font-medium italic opacity-80 leading-relaxed italic">"{r.comment}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center text-[10px] font-black text-pink-600">{r.reviewer_name?.[0] || 'U'}</div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{r.reviewer_name || 'Anonymous'}</span>
                      </div>
                    </div>
                  )) : <div className="text-center py-10 opacity-30 italic text-xs">No reviews found.</div>}
                </div>
              </div>

            </div>
          </>
        )}
      </div>

      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent className="max-w-[340px] rounded-[2.5rem] p-0 overflow-hidden border-none bg-zinc-950">
          <div className="relative p-8 flex flex-col items-center text-center space-y-6">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

            <div className="relative w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-zinc-950 border border-amber-500/40 flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            <div className="space-y-2 relative">
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Unlock Secret Chat</h2>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Connect with <span className="text-white font-bold">{companion?.name}</span> for 24 hours. This connection requires <span className="text-amber-500 font-black">1 TOKEN</span>.
              </p>
            </div>

            <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Your Balance</p>
                  <p className="text-sm font-black text-white">{user?.chat_unlocks_balance || 0} Tokens</p>
                </div>
              </div>
              {((user?.chat_unlocks_balance || 0) < 1) && (
                <Badge variant="destructive" className="bg-rose-500/20 text-rose-500 border-none text-[8px] font-black uppercase">Low Balance</Badge>
              )}
            </div>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={confirmUnlock}
                disabled={(user?.chat_unlocks_balance || 0) < 1}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C] text-black font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(191,149,63,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                Unlock Now
              </button>
              <button
                onClick={() => setShowUnlockDialog(false)}
                className="w-full h-12 rounded-2xl text-muted-foreground/60 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CompanionProfileDetail;
