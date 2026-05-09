import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Search, Star, MapPin, BadgeCheck, Filter, X, Loader2, Briefcase,
  PartyPopper, Calendar, Clock, Users, Heart, Wifi, SlidersHorizontal,
  Flag, Send, MessageSquare, Shield, Navigation, Gift, Copy, Share2,
  ChevronLeft, ChevronRight, Info, Minus, Plus, Gem, XCircle, Lock, Megaphone, Ticket, Coins, Sparkles, Zap, User, History
} from 'lucide-react';
import { Emoji } from 'emoji-picker-react';

const parseUnified = (str) => Array.from(str).map(c => c.codePointAt(0).toString(16)).join('-');
const emojiSplitRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
const emojiTestRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;

const renderTextWithEmojis = (str, emoSize = 14, offset = '0px') => {
  if (!str) return null;
  const parts = str.split(emojiSplitRegex);
  return parts.map((part, index) => {
    if (!part) return null;
    if (emojiTestRegex.test(part)) {
      return (
        <span key={index} className="inline-flex items-center justify-center align-middle mx-[2px]" style={{ transform: `translateY(${offset})`, width: emoSize, height: emoSize }}>
          <Emoji unified={parseUnified(part)} emojiStyle="apple" size={emoSize} />
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

import axios from 'axios';
import { BookingFormModal } from '../components/BookingFormModal';
import { CurvedHeart } from '../components/CurvedHeart';
import CompanionProfileDetail from '../components/CompanionProfileDetail';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

const HalfHeart = ({ className = '', size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09a6.51 6.51 0 0 1 4.5-2.09c3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    <path fill={color} stroke="none" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09V21.35z" />
  </svg>
);

const HOBBY_FILTERS = [
  { value: 'Networking', label: '🤝 Networking' }, { value: 'Conferences', label: '🏢 Conferences' }, { value: 'Concerts', label: '🎵 Concerts' }, { value: 'Art Exhibitions', label: '🖼️ Art Exhibitions' }, { value: 'Fine Dining', label: '🍽️ Fine Dining' },
  { value: 'Corporate Events', label: '👔 Corporate Events' }, { value: 'Charity Galas', label: '🎗️ Charity Galas' }, { value: 'Sports Events', label: '🏟️ Sports Events' }, { value: 'Theater', label: '🎭 Theater' }, { value: 'Travel', label: '✈️ Travel' },
  { value: 'Photography', label: '📸 Photography' }, { value: 'Wine Tasting', label: '🍷 Wine Tasting' }, { value: 'Book Clubs', label: '📚 Book Clubs' }, { value: 'Fitness', label: '💪 Fitness' }, { value: 'Tech Meetups', label: '💻 Tech Meetups' },
  { value: 'Music Festivals', label: '🎪 Music Festivals' }, { value: 'Fashion Shows', label: '👗 Fashion Shows' }, { value: 'Comedy Shows', label: '😂 Comedy Shows' }, { value: 'Nightlife', label: '🌃 Nightlife' }, { value: 'Volunteering', label: '💖 Volunteering' },
  { value: 'Trade Shows', label: '🎪 Trade Shows' }, { value: 'Product Launches', label: '🚀 Product Launches' }, { value: 'Seminars', label: '🎤 Seminars' }, { value: 'Workshops', label: '🛠️ Workshops' }, { value: 'Award Ceremonies', label: '🏆 Award Ceremonies' },
  { value: 'VIP Parties', label: '🥂 VIP Parties' }, { value: 'Golf Tournaments', label: '⛳ Golf Tournaments' }, { value: 'Yacht Parties', label: '🛥️ Yacht Parties' }, { value: 'Polo Matches', label: '🐎 Polo Matches' }, { value: 'Film Festivals', label: '🎬 Film Festivals' },
  { value: 'Startup Pitch Events', label: '💡 Startup Pitch Events' }, { value: 'Real Estate Mixers', label: '🏢 Real Estate Mixers' }, { value: 'Escape Rooms', label: '🔐 Escape Rooms' }, { value: 'Theme Parks', label: '🎢 Theme Parks' }, { value: 'Culinary Tours', label: '🍳 Culinary Tours' },
  { value: 'Stand-up Comedy', label: '🎤 Stand-up Comedy' }, { value: 'Dance Classes', label: '💃 Dance Classes' }, { value: 'Yoga Retreats', label: '🧘‍♀️ Yoga Retreats' }, { value: 'Meditation Sessions', label: '🧘‍♂️ Meditation Sessions' }, { value: 'Hiking', label: '🥾 Hiking' },
  { value: 'Baking Classes', label: '🧁 Baking Classes' }, { value: 'Pottery Workshops', label: '🏺 Pottery Workshops' }, { value: 'Board Game Nights', label: '🎲 Board Game Nights' }, { value: 'Arcade Dates', label: '🕹️ Arcade Dates' }, { value: 'Amusement Parks', label: '🎡 Amusement Parks' },
  { value: 'Sailing', label: '⛵ Sailing' }, { value: 'Skiing Trips', label: '⛷️ Skiing Trips' }, { value: 'Scuba Diving', label: '🤿 Scuba Diving' }, { value: 'Boutique Shopping', label: '🛍️ Boutique Shopping' }, { value: 'Museum Tours', label: '🏛️ Museum Tours' },
  { value: 'Historical Walks', label: '🚶 Historical Walks' }, { value: 'Language Exchange', label: '🗣️ Language Exchange' }, { value: 'Poetry Slams', label: '📜 Poetry Slams' }, { value: 'Live Podcasts', label: '🎙️ Live Podcasts' }
];

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman & Nicobar', 'Dadra & Nagar Haveli', 'Lakshadweep'
];

import { SKILL_CATEGORIES, MASTER_SKILLS_LIST } from '@/constants/skills';

const FAITH_OPTIONS = ['Any', 'Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Atheist', 'Other'];

const FilterContent = ({
  filters,
  setFilters,
  hasSubscription,
  user,
  clearFilters,
  activeFilterCount,
  toggleHobbyFilter,
  HOBBY_FILTERS,
  INDIA_STATES,
  isMobile = false,
  campaigns = [],
  activeSkillTab,
  setActiveSkillTab
}) => {
  const [localMin, setLocalMin] = useState(filters.min_price.toString());
  const [localMax, setLocalMax] = useState(filters.max_price.toString());

  useEffect(() => {
    setLocalMin(filters.min_price.toString());
  }, [filters.min_price]);

  useEffect(() => {
    setLocalMax(filters.max_price.toString());
  }, [filters.max_price]);

  const handleMinChange = (e) => {
    const val = e.target.value;
    setLocalMin(val);
    const num = parseInt(val);
    if (!isNaN(num)) {
      setFilters(prev => ({ ...prev, min_price: num }));
    } else if (val === '') {
      setFilters(prev => ({ ...prev, min_price: 0 }));
    }
  };

  const handleMaxChange = (e) => {
    const val = e.target.value;
    setLocalMax(val);
    const num = parseInt(val);
    if (!isNaN(num)) {
      setFilters(prev => ({ ...prev, max_price: num }));
    } else if (val === '') {
      setFilters(prev => ({ ...prev, max_price: 0 }));
    }
  };

  return (
    <div className={`space-y-4 ${isMobile ? 'p-1' : ''}`}>
      {!isMobile && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-accent" /> Filter Desk
          </h3>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-3 text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full transition-all"
            >
              Reset All
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-0.5">
          <Users className="w-3 h-3 text-accent/60" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">Identity</span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-muted/20 border border-border/5">
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-muted-foreground ml-1">Gender</Label>
            <Select value={filters.gender} onValueChange={(v) => setFilters({ ...filters, gender: v })}>
              <SelectTrigger className="h-8 text-[10px] bg-background border-border/40 rounded-lg focus:ring-accent/20"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-muted-foreground ml-1">Event</Label>
            <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
              <SelectTrigger className="h-8 text-[10px] bg-background border-border/40 rounded-lg focus:ring-accent/20"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="professional">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {campaigns.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-3.5 h-3.5 text-accent/60" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Campaign</span>
          </div>
          <div className="p-3 rounded-2xl bg-muted/20 border border-border/5">
            <Label className="text-[10px] font-bold text-muted-foreground ml-1 mb-1.5 block">Filter by Event</Label>
            <Select value={filters.campaign_id || 'any'} onValueChange={(v) => setFilters({ ...filters, campaign_id: v === 'any' ? '' : v })}>
              <SelectTrigger className="h-10 text-xs bg-background border-border/40 rounded-xl focus:ring-accent/20">
                <SelectValue placeholder="Any Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All Companions</SelectItem>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.campaign_id && (
              <p className="text-[9px] text-accent font-bold mt-1.5 ml-1">Showing companions who joined this campaign</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
            <MapPin className="w-3 h-3 text-accent" />
          </div>
          <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Location Hub</Label>
        </div>
        <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-muted/20 border border-border/5 shadow-inner">
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-muted-foreground ml-1">State</Label>
            <Select value={filters.state} onValueChange={(v) => setFilters({ ...filters, state: v })}>
              <SelectTrigger className="h-8 text-[10px] bg-background border-border/40 rounded-lg focus:ring-accent/20"><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent className="rounded-xl border-border/20 shadow-2xl">
                <SelectItem value="any">Any</SelectItem>
                {INDIA_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-muted-foreground ml-1">City</Label>
            <Input
              placeholder="City..."
              className="h-8 text-[10px] bg-background border-border/40 rounded-lg focus-visible:ring-accent/20"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
          </div>
        </div>
      </div>



      <div className="space-y-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-accent/60" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Plus+ Filters</span>
          </div>
          {!hasSubscription && user?.role !== 'admin' && (
            <Badge variant="outline" className="text-[9px] h-5 border-none text-white font-black bg-accent shadow-md shadow-accent/20 px-2 py-0">Plus+</Badge>
          )}
        </div>

        <div className="space-y-6 p-4 rounded-2xl bg-accent/5 border border-accent/10">

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Budget Per Hour</Label>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black text-accent">₹{localMin} - ₹{localMax}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-muted-foreground ml-1">Verified Only</Label>
              <Switch
                checked={filters.verified_only}
                onCheckedChange={(v) => {
                  if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to unlock Featured filters'); return; }
                  setFilters({ ...filters, verified_only: v });
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-muted-foreground ml-1">Recently Active</Label>
              <Switch
                checked={filters.recently_active}
                onCheckedChange={(v) => {
                  if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to unlock Featured filters'); return; }
                  setFilters({ ...filters, recently_active: v });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground flex justify-between ml-1">Interests</Label>
            <div className="max-h-40 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-1.5">
                {HOBBY_FILTERS.map(h => {
                  const val = h.value || h;
                  const label = h.label || h;
                  return (
                  <button
                    key={val}
                    onClick={() => {
                      if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to unlock Interest filters'); return; }
                      toggleHobbyFilter(val)
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${filters.hobbies.includes(val) ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20' : 'bg-background border-border/40 text-muted-foreground hover:border-rose-500/40'}`}
                  >
                    {renderTextWithEmojis(label, 14, '-1px')}
                  </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[9px] font-bold text-muted-foreground flex justify-between ml-1">
              Height Range
              <span className="text-[9px]">
                {filters.min_height} cm – {filters.max_height >= 220 ? '220+ cm' : `${filters.max_height} cm`}
              </span>
            </Label>
            <div className="px-2 pt-1 pb-2">
              <Slider
                min={130}
                max={220}
                step={1}
                value={[filters.min_height, filters.max_height]}
                onValueChange={(val) => {
                  if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to Plus+ to use Height filter'); return; }
                  setFilters({ ...filters, min_height: val[0], max_height: val[1] });
                }}
                className={`[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-rose-500 [&>.relative>.absolute]:bg-gradient-to-r [&>.relative>.absolute]:from-rose-500 [&>.relative>.absolute]:to-blue-500 transition-all duration-300 ${!hasSubscription && user?.role !== 'admin' ? 'opacity-50' : ''}`}
              />
            </div>
            {!hasSubscription && user?.role !== 'admin' && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Lock className="w-3 h-3 text-accent" />
                <span>Plus+ subscribers only</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-[9px] font-bold text-muted-foreground flex justify-between ml-1">
              Age Range
              <span className="text-[9px]">{Math.round(filters.min_age)} – {Math.round(filters.max_age)}{Math.round(filters.max_age) >= 100 ? '+' : ''} yrs</span>
            </Label>
            <div className="px-2 pt-1 pb-2">
              <Slider
                min={18}
                max={100}
                step={1}
                value={[filters.min_age, filters.max_age]}
                onValueChange={(val) => {
                  if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to Plus+ to use Age filter'); return; }
                  setFilters({ ...filters, min_age: val[0], max_age: val[1] });
                }}
                className={`[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-rose-500 [&>.relative>.absolute]:bg-gradient-to-r [&>.relative>.absolute]:from-rose-500 [&>.relative>.absolute]:to-blue-500 transition-all duration-300 ${!hasSubscription && user?.role !== 'admin' ? 'opacity-50' : ''}`}
              />
            </div>
            {!hasSubscription && user?.role !== 'admin' && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Lock className="w-3 h-3 text-accent" />
                <span>Plus+ subscribers only</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-[9px] font-bold text-muted-foreground flex justify-between ml-1">
              Search Radius
              <span className="text-[9px]">{Math.round(filters.distance)}{Math.round(filters.distance) >= 500 ? '+' : ''} km</span>
            </Label>
            <div className="px-2 pt-1 pb-2">
              <Slider
                min={5}
                max={500}
                step={1}
                value={[filters.distance]}
                onValueChange={(val) => {
                  if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to Plus+ to use Radius filter'); return; }
                  setFilters({ ...filters, distance: val[0] });
                }}
                className={`[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-rose-500 [&>.relative>.absolute]:bg-gradient-to-r [&>.relative>.absolute]:from-rose-500 [&>.relative>.absolute]:to-blue-500 transition-all duration-300 ${!hasSubscription && user?.role !== 'admin' ? 'opacity-50' : ''}`}
              />
            </div>
            {!hasSubscription && user?.role !== 'admin' && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Lock className="w-3 h-3 text-accent" />
                <span>Plus+ subscribers only</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground flex justify-between ml-1">Minimum Photos</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => {
                    if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to unlock Plus+ filters'); return; }
                    setFilters({ ...filters, min_photos: n });
                  }}
                  className={`flex-1 h-8 rounded-lg text-[10px] font-bold transition-all ${filters.min_photos === n
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'bg-background border border-border/40 text-muted-foreground hover:border-accent/40'
                    }`}
                >
                  {n}+
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <Label className="text-[9px] font-bold text-muted-foreground flex justify-between ml-1">
              Budget Per Hour
              <span className="text-[9px]">₹{filters.min_price} – ₹{filters.max_price >= 500000 ? '5L+' : filters.max_price.toLocaleString('en-IN')}</span>
            </Label>
            <div className="grid grid-cols-2 gap-3 px-1 mt-2">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-muted-foreground/40">Min</span>
                <Input
                  type="number"
                  value={localMin}
                  onChange={handleMinChange}
                  onBlur={() => {
                    const num = parseInt(localMin);
                    if (isNaN(num) || num < 100) {
                      setLocalMin("100");
                      setFilters(prev => ({ ...prev, min_price: 100 }));
                    }
                    if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to Plus+ to use Budget filter'); }
                  }}
                  onFocus={() => {
                    if (!hasSubscription && user?.role !== 'admin') toast.info('Subscribe to Plus+ to use Budget filter');
                  }}
                  disabled={!hasSubscription && user?.role !== 'admin'}
                  className="h-8 pl-8 text-[10px] font-semibold bg-background border-border/40 rounded-lg focus-visible:ring-accent/20 disabled:opacity-50"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-muted-foreground/40">Max</span>
                <Input
                  type="number"
                  value={localMax}
                  onChange={handleMaxChange}
                  onBlur={() => {
                    const num = parseInt(localMax);
                    if (isNaN(num) || num > 500000) {
                      setLocalMax("500000");
                      setFilters(prev => ({ ...prev, max_price: 500000 }));
                    } else if (num < 100) {
                      setLocalMax("100");
                      setFilters(prev => ({ ...prev, max_price: 100 }));
                    }
                  }}
                  disabled={!hasSubscription && user?.role !== 'admin'}
                  className="h-8 pl-8 text-[10px] font-semibold bg-background border-border/40 rounded-lg focus-visible:ring-accent/20 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="px-2 pt-1 pb-2">
              <Slider
                min={100}
                max={500000}
                step={100}
                value={[filters.min_price, filters.max_price]}
                onValueChange={(val) => {
                  if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to Plus+ to use Budget filter'); return; }
                  setFilters({ ...filters, min_price: val[0], max_price: val[1] });
                }}
                className={`[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-rose-500 [&>.relative>.absolute]:bg-gradient-to-r [&>.relative>.absolute]:from-rose-500 [&>.relative>.absolute]:to-blue-500 transition-all duration-300 ${!hasSubscription && user?.role !== 'admin' ? 'opacity-50' : ''}`}
              />
            </div>
            {!hasSubscription && user?.role !== 'admin' && (
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60 font-medium pb-2">
                <Lock className="w-2.5 h-2.5 text-accent/60" />
                <span>Plus+ subscribers only</span>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-accent/10">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase text-accent">Offline Mode</p>
                <p className="text-[8px] text-muted-foreground">Show companions available for offline travel</p>
              </div>
              <Switch
                checked={filters.offline_mode}
                onCheckedChange={(v) => {
                  if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to unlock Premium filters'); return; }
                  setFilters({ ...filters, offline_mode: v });
                }}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mt-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Online Now</Label>
                  <Badge className="bg-emerald-500 text-[7px] h-3.5 px-1 font-black">PRO</Badge>
                </div>
                <p className="text-[9px] text-muted-foreground font-medium">Available for immediate booking</p>
              </div>
              <Switch checked={filters.online_only} onCheckedChange={(v) => {
                if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to unlock Premium filters'); return; }
                setFilters({ ...filters, online_only: v });
              }} />
            </div>
          </div>

            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Skill Set Filter</span>
                </div>
                {!hasSubscription && user?.role !== 'admin' && (
                  <Badge variant="outline" className="text-[7px] h-4 gap-1 border-blue-500/30 text-blue-500 font-black">
                    <Lock className="w-2 h-2" /> PLUS+
                  </Badge>
                )}
              </div>
              <div className="space-y-4">
                {/* Category Dropdown & Skill Grid */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-0.5">Focus Area / Category</Label>
                    <Select value={activeSkillTab} onValueChange={setActiveSkillTab}>
                      <SelectTrigger className="h-10 text-[10px] bg-muted/20 border-border/40 rounded-xl focus:ring-blue-500/10">
                        <SelectValue placeholder="Focus Area" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20 shadow-2xl">
                        {SKILL_CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id} className="text-[10px] font-bold py-2.5">{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-0.5">Available Skills in {SKILL_CATEGORIES.find(c => c.id === activeSkillTab)?.label}</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                      {(MASTER_SKILLS_LIST[activeSkillTab] || []).map(skill => {
                        const isSelected = (filters.skills || []).includes(skill);
                        return (
                          <button
                            key={skill}
                            onClick={() => {
                              if (!hasSubscription && user?.role !== 'admin') { toast.info('Subscribe to unlock Skill filtering'); return; }
                              const cur = filters.skills || [];
                              const next = isSelected ? cur.filter(s => s !== skill) : [...cur, skill];
                              setFilters({ ...filters, skills: next });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isSelected 
                              ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20' 
                              : 'bg-background border-border/40 text-muted-foreground hover:border-blue-500/40'}`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Selected Skill Badges */}
                {filters.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10 min-h-[40px]">
                    {filters.skills.map(skill => (
                      <Badge 
                        key={skill} 
                        variant="secondary" 
                        className="bg-blue-500 text-white hover:bg-blue-600 border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-in zoom-in-95"
                      >
                        {skill}
                        <button 
                          onClick={() => setFilters({ ...filters, skills: filters.skills.filter(s => s !== skill) })}
                          className="ml-0.5 p-0.5 hover:bg-white/20 rounded-full transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className={`relative px-1 transition-opacity ${!hasSubscription && user?.role !== 'admin' ? 'opacity-40 grayscale' : ''}`}>
                  <Input
                    placeholder={!hasSubscription && user?.role !== 'admin' ? "Plus+ only" : "Search experts..."}
                    className="h-9 text-[10px] bg-muted/20 border-border/40 rounded-xl pl-8 focus-visible:ring-blue-500/10"
                    disabled={!hasSubscription && user?.role !== 'admin'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const val = e.target.value.trim();
                        const cur = filters.skills || [];
                        if (!cur.includes(val)) setFilters({ ...filters, skills: [...cur, val] });
                        e.target.value = '';
                      }
                    }}
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40" />
                </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default function BrowseCompanions() {
  const { token, user, diamonds } = useAuth();
  const { mode } = useTheme();
  const isPro = mode === 'professional';
  const navigate = useNavigate();

  // First-time user tooltip state
  const [showTooltip, setShowTooltip] = useState(() => {
    return localStorage.getItem('hasSeenBrowseTooltip') !== 'true';
  });
  const dismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem('hasSeenBrowseTooltip', 'true');
  };
  const headers = { Authorization: `Bearer ${token}` };
  const accentHex = isPro ? '#3b82f6' : '#f43f5e';

  const [companions, setCompanions] = useState([]);
  const [scrollX, setScrollX] = useState(0);
  const scrollRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewId = searchParams.get('view');
  const restrictedMode = searchParams.get('restricted') === 'true';

  const [filters, setFilters] = useState({
    gender: 'any', category: 'all', state: '', city: '', min_rating: '0',
    min_age: 18, max_age: 100, hobbies: [], online_only: false,
    min_price: 100, max_price: 500000, faith: 'Any', distance: 100,
    looking_for: [], min_photos: 1, verified_only: false, recently_active: false,
    campaign_id: '', min_height: 130, max_height: 220, offline_mode: false,
                skills: []
  });
  const [profileModal, setProfileModal] = useState(null);
  const [nearMe, setNearMe] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState('tech');
  const isFree = !user?.subscription?.is_active;

  const handleNextProfile = useCallback(() => {
    if (!profileModal) return;
    const idx = companions.findIndex(u => u.id === profileModal.id);
    if (idx !== -1 && idx < companions.length - 1) {
      setProfileModal(companions[idx + 1]);
    } else if (idx === companions.length - 1) {
      setProfileModal(companions[0]); // Loop back
    }
  }, [profileModal, companions]);

  const handlePrevProfile = useCallback(() => {
    if (!profileModal) return;
    const idx = companions.findIndex(u => u.id === profileModal.id);
    if (idx > 0) {
      setProfileModal(companions[idx - 1]);
    } else if (idx === 0) {
      setProfileModal(companions[companions.length - 1]); // Loop back
    }
  }, [profileModal, companions]);

  const [showFilters, setShowFilters] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [selectedCompanion, setSelectedCompanion] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [showDiamondPopup, setShowDiamondPopup] = useState(false);
  const [reportModal, setReportModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reportForm, setReportForm] = useState({ reason: '', details: '' });
  const [inviteModal, setInviteModal] = useState(false);
  const [systemReferralEnabled, setSystemReferralEnabled] = useState(false);
  const [now, setNow] = useState(new Date());
  const [likedIds, setLikedIds] = useState(new Set());
  const [mutualIds, setMutualIds] = useState(new Set());
  const [unlockBalance, setUnlockBalance] = useState(0);
  const [showPirateModal, setShowPirateModal] = useState(false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchCompanion, setMatchCompanion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const direction = useRef(1);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);
  const [swipeHistory, setSwipeHistory] = useState([]); // { companion, action: 'liked'|'passed' }
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const CARD_COLORS = ['#A855F7', '#F43F5E', '#3B82F6', '#10B981', '#F59E0B'];
  const getCardColor = useCallback((id) => {
    if (!id) return CARD_COLORS[0];
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return CARD_COLORS[hash % CARD_COLORS.length];
  }, []);

  const fetchUnlockBalance = async () => {
    try {
      const res = await axios.get(`${API}/users/chat-unlocks`, { headers });
      setUnlockBalance(res.data.count || 0);
    } catch (err) { console.error("Balance fetch error", err); }
  };

  useEffect(() => {
    if (token) fetchUnlockBalance();
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [token]);

  const getBoostTimeLeft = (expiry) => {
    if (!expiry) return '';
    const diff = new Date(expiry) - now;
    if (diff <= 0) return '';
    const mins = Math.ceil(diff / 60000);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const m = mins % 60;
      return `${hrs}h ${m}m left`;
    }
    return `${mins}m left`;
  };
  const [activeCampaigns, setActiveCampaigns] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/campaigns-offers`);
        setSystemReferralEnabled(res.data.system_referral_enabled !== false);
        setActiveCampaigns(Array.isArray(res.data.campaigns) ? res.data.campaigns.filter(c => c.active) : []);
      } catch { }
    };
    fetchSettings();
  }, [token]);

  const [unlockedConvos, setUnlockedConvos] = useState({});

  useEffect(() => {
    if (!token) return;

    // Fetch conversations to identify unlocked companions
    axios.get(`${API}/chat/conversations`, { headers })
      .then(res => {
        const map = {};
        (res.data || []).forEach(c => {
          const otherId = c.other_user?.id || c.participants?.find(p => p !== user?.id);
          if (otherId) map[otherId] = c;
        });
        setUnlockedConvos(map);
      })
      .catch(() => { });

    axios.get(`${API}/likes/sent`, { headers })
      .then(res => {
        const ids = new Set((res.data.likes || []).map(l => l.to_user_id));
        setLikedIds(ids);
      })
      .catch(() => { });

    axios.get(`${API}/likes/mutual`, { headers })
      .then(res => {
        const ids = new Set((res.data.matches || []).map(m => m.id));
        setMutualIds(ids);
      })
      .catch(() => { });

    fetchUnlockBalance();
  }, [token]);

  useEffect(() => {
    if (viewId && token) {
      axios.get(`${API}/users/${viewId}/public-profile`, { headers })
        .then(res => {
          if (res.data) setProfileModal(res.data);
        })
        .catch(() => {
          toast.error("Profile unavailable or has blocked you.");
          setSearchParams({});
        });
    }
  }, [viewId, token]);

  useEffect(() => {
    const isOpen = !!(showFilters || profileModal || reviewModal || reportModal || bookingModal || inviteModal);
    if (isOpen) {
      document.documentElement.setAttribute('data-modal-open', 'true');
    } else {
      document.documentElement.removeAttribute('data-modal-open');
    }
    return () => document.documentElement.removeAttribute('data-modal-open');
  }, [showFilters, profileModal, reviewModal, reportModal, bookingModal, inviteModal]);
  const [userBookings, setUserBookings] = useState([]);
  const [reviewList, setReviewList] = useState([]);
  const referralCode = user?.referral_code || `REF${user?.id?.slice(0, 8)?.toUpperCase() || 'XXXXXX'}`;
  const inviteLink = `${window.location.origin}/join?ref=${referralCode}`;
  const copyInvite = () => navigator.clipboard.writeText(inviteLink).then(() => toast.success('Invite link copied!')).catch(() => toast.error('Copy failed'));

  const fetchCompanions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.gender && filters.gender !== 'any') params.append('gender', filters.gender);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      const locationStr = [filters.city, filters.state].filter(Boolean).join(', ');
      if (locationStr) params.append('location', locationStr);
      if (filters.min_rating && filters.min_rating !== '0') params.append('min_rating', filters.min_rating);
      // Age filter (Plus only)
      if (hasSubscription || user?.role === 'admin') {
        if (filters.min_age && filters.min_age !== 18) params.append('age_min', filters.min_age);
        if (filters.max_age && filters.max_age < 100) params.append('age_max', filters.max_age);
        if (filters.min_price && filters.min_price !== 100) params.append('min_price', filters.min_price);
        if (filters.max_price && filters.max_price !== 500000) params.append('max_price', filters.max_price);
        if (filters.hobbies?.length) params.append('hobbies', filters.hobbies.join(','));
        if (filters.looking_for?.length) params.append('looking_for', filters.looking_for.join(','));
        if (filters.distance && filters.distance !== 100) params.append('distance', filters.distance);
        if (filters.min_photos > 1) params.append('min_photos', filters.min_photos);
        // Height filter — only send if adjusted from defaults; 220 means "220+" (no upper limit)
        if (filters.min_height > 130) params.append('height_min', filters.min_height);
        if (filters.max_height < 220) params.append('height_max', filters.max_height);
      }
      // Free-tier params (available to all users)
      if (filters.online_only) params.append('online_only', true);
      if (filters.verified_only) params.append('is_verified', true);
      if (filters.recently_active) params.append('recently_active', true);
      if (filters.faith && filters.faith !== 'Any') params.append('faith', filters.faith);
      if (filters.offline_mode) params.append('offline_mode', true);
      if (filters.campaign_id) params.append('campaign_id', filters.campaign_id);
      if (filters.skills?.length) params.append('skills', filters.skills.join(','));

      const res = await axios.get(`${API}/users/companions?${params}`, { headers });
      const list = (res.data.companions || []).filter(c => c.id !== user?.id);
      setCompanions(list);
    } catch { setCompanions([]); }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanions();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    fetchUserBookings();
  }, []);

  useEffect(() => {
    if (profileModal) {
      fetchReviews(profileModal.id);
      if (token && profileModal.id !== user?.id) {
        axios.post(`${API}/users/profile/${profileModal.id}/visit`, {}, { headers }).catch(() => { });
      }
    }
  }, [profileModal]);

  const fetchUserBookings = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/bookings`, { headers: { Authorization: `Bearer ${token}` } });
      setUserBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Error fetching bookings:", err); }
  };

  const fetchReviews = async (companionId) => {
    try {
      const res = await axios.get(`${API}/reviews/${companionId}`);
      setReviewList(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Error fetching reviews:", err); }
  };

  useEffect(() => {
    if (profileModal) setPhotoIdx(0);
  }, [profileModal]);

  const clearFilters = () => {
    setFilters({ gender: 'any', category: 'all', state: 'any', city: '', min_rating: 0, min_age: 18, max_age: 100, hobbies: [], online_only: false, min_price: 100, max_price: 500000, faith: 'Any', distance: 100, looking_for: [], min_photos: 1, verified_only: false, recently_active: false, campaign_id: '' });
    setNearMe(false);
  };

  const handleNearMe = () => {
    const loc = user?.location || '';
    if (!loc) { toast.error('Location not set. Update your profile first.'); return; }
    const parts = loc.split(',').map(s => s.trim());
    const city = parts[0] || '';
    const state = INDIA_STATES.find(s => loc.toLowerCase().includes(s.toLowerCase())) || parts[parts.length - 1] || '';
    setFilters(prev => ({ ...prev, city, state }));
    setNearMe(true);
    toast.success(`Showing companions near ${city}${state ? ', ' + state : ''}`);
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
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Review submitted!');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
      fetchUserBookings();
      if (profileModal?.id === reviewModal.id) fetchReviews(reviewModal.id);
    } catch (err) { toast.error(err.response?.data?.detail || 'Review failed'); }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.reason) { toast.error('Please select a reason'); return; }
    try {
      await axios.post(`${API}/safety/report`, { reported_user_id: reportModal.id, reason: reportForm.reason, details: reportForm.details }, { headers });
      toast.success('Report submitted. We will review within 24 hours.');
      setReportModal(null);
      setReportForm({ reason: '', details: '' });
    } catch (err) { toast.error(err.response?.data?.detail || 'Report failed'); }
  };

  const handleUnlockChat = async (target) => {
    if (!token) { toast.error("Please login to unlock chat"); return; }

    const targetId = target.id;
    const targetName = target.user_name || target.name;

    const isUnlocked = user?.unlocked_features?.some(f => f.type === 'chat' && f.target_id === targetId);
    if (isUnlocked) {
      navigate('/chat', { state: { targetUser: { id: targetId, name: targetName } } });
      return;
    }

    const balance = await (async () => {
      try {
        const r = await axios.get(`${API}/users/chat-unlocks`, { headers });
        // The backend returns { "count": X }, so we check .count first
        return (r.data.count !== undefined ? r.data.count : r.data.balance) ?? (user?.chat_unlocks_balance || 0);
      } catch { return user?.chat_unlocks_balance || unlockBalance; }
    })();
    setUnlockBalance(balance);

    if (balance <= 0) {
      setShowPirateModal(true);
      return;
    }

    setShowUnlockConfirm({ id: targetId, user_name: targetName });
  };

  const confirmUnlock = async () => {
    if (!showUnlockConfirm) return;
    const { id: targetId } = showUnlockConfirm;

    try {
      const res = await axios.post(`${API}/chat/unlock/${targetId}`, {}, { headers });
      toast.success(res.data.message || 'Chat unlocked!');
      fetchUnlockBalance();
      setShowUnlockConfirm(null);
      if (res.data.conversation_id) navigate(`/chat/${res.data.conversation_id}`);
    } catch (err) {
      setShowUnlockConfirm(null);
      if (err.response?.data?.detail === "INSUFFICIENT_TOKENS") {
        setShowPirateModal(true);
      } else {
        toast.error(err.response?.data?.detail || 'Unlock failed');
      }
    }
  };

  const handleBookingRequest = (comp) => {
    setSelectedCompanion(comp);
    setBookingModal(true);
  };

  const toggleHobbyFilter = (hobby) => {
    setFilters(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby]
    }));
  };

  const activeFilterCount = [
    filters.gender, filters.category, filters.state, filters.city,
    filters.min_rating, filters.online_only, filters.faith, filters.verified_only, filters.recently_active
  ].filter(f => f && f !== 'any' && f !== 'all' && f !== 'Any' && f !== '0' && f !== 0 && f !== false).length + filters.hobbies.length + filters.looking_for.length +
    (filters.min_age !== 18 ? 1 : 0) + (filters.max_age !== 100 ? 1 : 0) +
    (filters.min_price !== 100 ? 1 : 0) + (filters.max_price !== 500000 ? 1 : 0) +
    (filters.distance !== 100 ? 1 : 0) + (filters.min_photos > 1 ? 1 : 0);

  const hasSubscription = user?.subscription?.is_active && new Date(user.subscription.end_date) > new Date();

  const handleLike = async (companionId) => {
    if (!companionId || !token) return;
    const companion = companions.find(c => c.id === companionId);
    if (!companion) return;

    const alreadyLiked = likedIds.has(companionId);
    try {
      if (alreadyLiked) {
        await axios.delete(`${API}/likes/${companionId}`, { headers });
        setLikedIds(prev => { const n = new Set(prev); n.delete(companionId); return n; });
        setMutualIds(prev => { const n = new Set(prev); n.delete(companionId); return n; });
        toast.success('Removed from favorites');
      } else {
        const res = await axios.post(`${API}/likes/${companionId}`, {}, { headers });
        setLikedIds(prev => { const n = new Set(prev); n.add(companionId); return n; });
        if (res.data?.is_mutual) {
          setMutualIds(prev => { const n = new Set(prev); n.add(companionId); return n; });
          setMatchCompanion(companion);
          setShowMatchModal(true);
        } else {
          toast.success('Added to favorites');
        }
      }
    } catch (err) {
      toast.info(err.response?.data?.detail || 'Failed to update like status');
    }

    // Update history
    setSwipeHistory(prev => {
      const exists = prev.find(p => p.companion.id === companionId);
      if (exists) {
        return prev.map(p => p.companion.id === companionId ? { ...p, action: 'liked', ts: Date.now() } : p);
      }
      return [{ companion, action: 'liked', ts: Date.now() }, ...prev].slice(0, 50);
    });
  };

  const handleNextCard = () => {
    if (companions.length <= 1) {
      toast('Sorry, there are no other profiles. Try adjusting the filter.', { position: 'bottom-center' });
      return;
    }
    const currentComp = companions[currentIndex];
    if (currentComp) {
      setSwipeHistory(prev => {
        if (!prev.some(p => p.companion.id === currentComp.id)) {
          return [{ companion: currentComp, action: 'passed', ts: Date.now() }, ...prev].slice(0, 50);
        }
        return prev;
      });
    }
    direction.current = 1;
    setCurrentIndex(prev => (prev + 1) % companions.length);
  };

  const handlePrevCard = () => {
    if (companions.length <= 1) {
      toast('Sorry, there are no other profiles. Try adjusting the filter.', { position: 'bottom-center' });
      return;
    }
    direction.current = -1;
    setCurrentIndex(prev => (prev - 1 + companions.length) % companions.length);
  };

  return (
    <div className="h-[100dvh] sm:h-auto sm:min-h-screen overflow-hidden sm:overflow-visible flex flex-col bg-background pb-16 md:pb-0" data-testid="browse-page">
      <Navbar
        hideHeader={showFilters || !!bookingModal || !!profileModal || !!reviewModal || !!reportModal || inviteModal}
        hideBottomNav={showFilters || !!bookingModal || !!profileModal || !!reviewModal || !!reportModal || inviteModal}
      />

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-20 z-50 p-5 rounded-3xl border border-accent/20 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-accent" />
              </div>
              <div className="space-y-1 mt-0.5">
                <h4 className="text-sm font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>How to Browse</h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  Swipe cards left/right or use the buttons below them. Click the top-right filter button to adjust your preferences. Click any card to see full details!
                </p>
              </div>
            </div>
            <Button onClick={dismissTooltip} className="w-full md:w-auto h-10 rounded-xl font-bold bg-accent text-white border-none shrink-0 text-xs">
              Got it!
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex-1 flex flex-col w-full max-w-[1920px] mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-4 md:py-8 transition-all duration-500 overflow-hidden sm:overflow-visible ${profileModal ? 'blur-md brightness-[0.8] scale-[0.98] pointer-events-none' : ''}`}>
        <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden sm:overflow-visible">

          <aside className="hidden lg:block w-80 shrink-0 sticky top-0 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar z-[100] bg-background border-r border-border/20 p-6">
            <div className="flex flex-col gap-10 pb-10">
              <FilterContent
                filters={filters}
                setFilters={setFilters}
                hasSubscription={hasSubscription}
                user={user}
                clearFilters={clearFilters}
                activeFilterCount={activeFilterCount}
                toggleHobbyFilter={toggleHobbyFilter}
                HOBBY_FILTERS={HOBBY_FILTERS}
                INDIA_STATES={INDIA_STATES}
                campaigns={activeCampaigns}
              />
              
              {systemReferralEnabled && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <Gift className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Growth Campaign</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Invite a friend & both get <strong>1 week FREE</strong> premium access.</p>
                  <Button variant="link" className="p-0 h-auto text-[10px] text-amber-600 font-bold mt-2" onClick={() => setInviteModal(true)}>Learn More →</Button>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 min-w-0 overflow-hidden sm:overflow-visible no-scrollbar sm:custom-scrollbar pr-0 sm:pr-2 mx-auto w-full flex flex-col">
            {/* Mobile Top Navigation Bar — Sticky below Navbar */}
            <div className="sm:hidden shrink-0 pt-2 pb-2 px-4 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar border-b border-border/5 bg-background/80 backdrop-blur-xl">
              <div className="flex items-center gap-1 shrink-0">
                <Button variant={nearMe ? 'default' : 'outline'} size="sm" className="h-8 px-4 text-[10px] font-black uppercase tracking-normal rounded-full gap-2 shadow-sm"
                  onClick={handleNearMe} style={nearMe ? { background: accentHex, color: '#fff' } : {}}>
                  <Navigation className="w-3 h-3" /> Near Me
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-black uppercase tracking-normal rounded-full gap-2 relative shadow-sm"
                  onClick={() => setShowFilters(true)} style={{ borderColor: activeFilterCount > 0 ? accentHex : undefined }}>
                  <Filter className="w-3 h-3" /> Filter
                  {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-[8px] flex items-center justify-center text-white border-2 border-background font-bold">{activeFilterCount}</span>}
                </Button>
              </div>
              <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-black uppercase tracking-normal rounded-full gap-2 shrink-0 shadow-sm"
                onClick={() => setShowHistory(true)}>
                <History className="w-3 h-3" /> History
                {swipeHistory.length > 0 && <span className="text-accent ml-0.5 text-[8px] font-bold">({swipeHistory.length})</span>}
              </Button>
            </div>

            {/* Desktop Header */}
            <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  Browse <span style={{ color: accentHex }}>Companions</span>
                </h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-sm text-muted-foreground">Found {companions.length} verified companions</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Desktop History Button */}
                <Button
                  variant="outline"
                  className="gap-2 h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-card border-border/20 shadow-sm hover:border-accent/40 transition-all"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="w-3.5 h-3.5 text-accent" />
                  History
                </Button>

                <Button
                  variant={nearMe ? 'default' : 'outline'}
                  className="gap-1.5 h-9 px-4 text-xs font-bold shadow-sm"
                  onClick={handleNearMe}
                  data-testid="near-me-btn"
                  style={nearMe ? { background: accentHex, color: '#fff', border: 'none' } : {}}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Near Me
                </Button>

                <Button
                  variant="outline"
                  className="lg:hidden gap-1.5 h-9 px-3 text-xs font-bold shadow-sm relative"
                  onClick={() => setShowFilters(true)}
                  data-testid="toggle-filters"
                  style={{ borderColor: activeFilterCount > 0 ? accentHex : undefined }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[9px] bg-white text-black font-black border-2" style={{ borderColor: accentHex }}>
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            <Dialog open={showFilters} onOpenChange={setShowFilters}>
              <DialogContent className="max-w-md h-[92vh] md:h-auto flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl no-scrollbar">
                <DialogTitle className="sr-only">Filter Hub</DialogTitle>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black">
                      <SlidersHorizontal className="w-5 h-5 text-accent" /> Filter Companions
                    </DialogTitle>
                  </DialogHeader>
                  <FilterContent
                    isMobile
                    filters={filters}
                    setFilters={setFilters}
                    hasSubscription={hasSubscription}
                    user={user}
                    clearFilters={clearFilters}
                    activeFilterCount={activeFilterCount}
                    toggleHobbyFilter={toggleHobbyFilter}
                    HOBBY_FILTERS={HOBBY_FILTERS}
                    INDIA_STATES={INDIA_STATES}
                    campaigns={activeCampaigns}
                    activeSkillTab={activeSkillTab}
                    setActiveSkillTab={setActiveSkillTab}
                  />
                </div>
                <DialogFooter className="gap-2 grid grid-cols-2 bg-background/80 backdrop-blur-xl p-6 border-t border-border/10 z-50">
                  <Button variant="outline" className="w-full h-12 rounded-xl text-sm font-bold border-border/40" onClick={clearFilters}>Reset</Button>
                  <Button className="w-full h-12 rounded-xl text-sm font-black shadow-lg shadow-accent/20" style={{ background: accentHex, color: '#fff', border: 'none' }} onClick={() => setShowFilters(false)}>Show Results</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Discover title removed per request */}

            {loading ? (
              <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 relative">
                  <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                  <div className="absolute inset-0 border-4 rounded-full border-t-accent animate-spin"></div>
                </div>
                <p className="text-muted-foreground font-semibold text-sm uppercase tracking-widest animate-pulse">Loading Profiles...</p>
              </div>
            ) : companions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-10 text-center space-y-6">
                <div className="w-32 h-32 rounded-3xl bg-muted/20 border border-border/10 flex items-center justify-center animate-pulse">
                  <Users className="w-12 h-12 text-muted-foreground/20" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight">No other profiles</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                  No other profiles found. Try adjusting your filters.
                </p>
                <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full px-8 font-bold">Refresh Stack</Button>
              </div>
            ) : isMobile ? (
              /* ── MOBILE: Horizontal Swipe (Meeff Style) ── */
              <div 
                ref={scrollRef}
                className="relative flex-1 w-full flex items-center overflow-x-auto snap-x snap-mandatory no-scrollbar px-[8vw]" 
                style={{ minHeight: 360, scrollBehavior: 'smooth' }}
                onScroll={(e) => {
                  const scrollPos = e.target.scrollLeft;
                  setScrollX(scrollPos);
                  const cardWidth = Math.min(window.innerWidth * 0.82, 320) + 12; // card width + margin
                  const newIdx = Math.round(scrollPos / cardWidth);
                  if (newIdx !== currentIndex && newIdx >= 0 && newIdx < companions.length) {
                    setCurrentIndex(newIdx);
                  }
                }}
              >
                {companions.map((c, idx) => {
                  const hasLiked = likedIds.has(c.id);
                  const isMutual = mutualIds.has(c.id);
                  const cp = c.companion_profile || {};
                  const plan = (c.subscription?.plan || c.subscription?.plan_id || c.subscription_plan || '').toLowerCase();
                  const isGoldUser = (plan.includes('pro') || plan.includes('premium') || plan.includes('plus')) || c.subscription?.is_active;
                  const isPlus = plan.includes('plus');
                  const isPremium = plan.includes('pro') || plan.includes('premium');
                  const isBoosted = !!(c.is_boosted && c.boost_expiry && new Date(c.boost_expiry) > new Date());

                  const cardWidth = Math.min(window.innerWidth * 0.82, 320) + 12;
                  const distance = Math.abs(scrollX - (idx * cardWidth));
                  const scale = Math.max(0.88, 1 - (distance / (cardWidth * 4)));
                  const opacity = Math.max(0.6, 1 - (distance / (cardWidth * 2)));

                  return (
                    <motion.div
                      key={c.id}
                      className={`group shrink-0 w-[82vw] max-w-[320px] h-[64vh] max-h-[450px] rounded-[1.5rem] overflow-hidden snap-center flex flex-col relative transition-all duration-300 ${
                        isPlus
                          ? 'bg-black border-amber-500/20 shadow-[0_8px_40px_rgba(191,149,63,0.3)]'
                          : isGoldUser
                            ? 'border-amber-500/20 bg-black shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                            : 'border-border/5 bg-card shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
                      }`}
                      style={{ 
                        scale, 
                        opacity,
                        filter: idx !== currentIndex ? 'blur(3px)' : 'none',
                        marginRight: idx === companions.length - 1 ? 0 : '12px',
                        boxShadow: (!isGoldUser && !isPlus && idx === currentIndex) ? `0 15px 30px -5px ${getCardColor(c.id)}33` : undefined,
                      }}
                      data-testid={`companion-card-${c.id}`}
                    >
                      {isGoldUser && (
                        <div className="absolute -inset-[0.5px] pointer-events-none z-30 rounded-[1.55rem]" style={{
                          padding: '3px',
                          background: 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 23%, #B38728 50%, #FBF5B7 77%, #AA771C 100%)',
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                          boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                        }} />
                      )}
                      
                      <div
                        className="relative w-full h-full bg-zinc-950 overflow-hidden cursor-pointer flex items-center justify-center"
                        style={{ borderRadius: '1.4rem' }}
                        onClick={() => setProfileModal(c)}
                      >
                        {(c.photos?.[0]?.url || c.profile_pic) ? (
                          <img src={c.photos?.[0]?.url || c.profile_pic} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" />
                        ) : null}

                        {/* Swipe hint arrows */}
                        <div className="absolute inset-y-0 left-3 z-40 flex items-center pointer-events-none transition-opacity duration-300">
                          {idx === currentIndex && idx > 0 && <div className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center animate-pulse"><ChevronLeft className="w-4 h-4 text-white/60" /></div>}
                        </div>
                        <div className="absolute inset-y-0 right-3 z-40 flex items-center pointer-events-none transition-opacity duration-300">
                          {idx === currentIndex && idx < companions.length - 1 && <div className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center animate-pulse"><ChevronRight className="w-4 h-4 text-white/60" /></div>}
                        </div>

                        <div className="absolute inset-x-0 bottom-0 z-20 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-1 mb-0.5">
                              {isBoosted && (
                                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[6px] font-black text-white bg-amber-500/80 backdrop-blur-md border border-amber-300/30">
                                  <Zap className="w-2 h-2 fill-white" /> BOOSTED
                                </div>
                              )}
                              {c.online_status && (
                                <div className="flex items-center gap-1 bg-emerald-500/80 backdrop-blur-md text-white text-[6px] font-black py-0.5 px-1.5 rounded border border-emerald-400/30">
                                  <span className="w-1 h-1 rounded-full bg-white inline-block animate-pulse" /> ONLINE
                                </div>
                              )}
                              {isPremium && (
                                <div className="flex items-center gap-0.5 bg-amber-400 text-[6px] font-black px-1.5 py-0.5 rounded text-black shadow-lg shadow-amber-500/30">PRO</div>
                              )}
                            </div>

                            <div className="flex items-end justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <h3 className="text-sm font-black text-white truncate uppercase tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{c.name}</h3>
                                  {c.is_verified && <BadgeCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
                                </div>
                                {c.location && (
                                  <p className="text-[9px] text-white/70 flex items-center gap-1 mt-0.5 font-bold truncate">
                                    <MapPin className="w-2 h-2" /> {c.location}
                                  </p>
                                )}
                              </div>
                              <motion.div whileTap={{ scale: 0.7 }} onClick={(e) => { e.stopPropagation(); handleLike(c.id); }}
                                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer">
                                <CurvedHeart fill={false} half={true} size={22} className="text-[#f43f5e]" />
                              </motion.div>
                              {cp.rating > 0 && (
                                <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-black text-white border border-white/10 shrink-0">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{cp.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {cp.category && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-left ml-4 opacity-50 pointer-events-none">
                            <p className="text-[6px] font-black uppercase tracking-[0.4em] text-white/40">{cp.category}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* "No more profiles" state when no next card */}
                {!companions[currentIndex] && (
                  <div className="flex flex-col items-center justify-center px-10 text-center space-y-4">
                    <div className="w-24 h-24 rounded-3xl bg-muted/20 border border-border/10 flex items-center justify-center animate-pulse">
                      <Users className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                    <h3 className="text-base font-black uppercase tracking-tight">No more profiles</h3>
                    <p className="text-xs text-muted-foreground">Try adjusting your filters.</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full px-8 font-bold">Refresh Stack</Button>
                  </div>
                )}
              </div>
            ) : (
              /* ── PC: 3-Card Carousel with AnimatePresence center ── */
              <div className="relative flex-1 flex flex-col h-full overflow-hidden px-16 pb-12">
                <div className="flex items-center justify-center flex-1 relative">
                  {/* PC Arrows */}
                  {!isMobile && !showFilters && !profileModal && companions.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrevCard(); }}
                        className={`absolute left-4 lg:left-6 z-[200] w-12 h-12 rounded-2xl bg-card/80 backdrop-blur-md border border-border/20 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all ${currentIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-100'}`}
                        disabled={currentIndex === 0}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                        className={`absolute right-4 lg:right-6 z-[200] w-12 h-12 rounded-2xl bg-card/80 backdrop-blur-md border border-border/20 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all ${currentIndex === companions.length - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-100'}`}
                        disabled={currentIndex === companions.length - 1}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Prev peek card (blurred, behind) */}
                  {companions[currentIndex - 1] && (() => {
                    const pc = companions[currentIndex - 1];
                    return (
                      <div
                        key={`peek-prev-${pc.id}`}
                        className="absolute z-10 w-[280px] h-[420px] rounded-[1.25rem] overflow-hidden opacity-40 pointer-events-none transition-all duration-500"
                        style={{ left: '5%', filter: 'blur(4px)', transform: 'scale(0.85)' }}
                      >
                        <div className="w-full h-full bg-zinc-950">
                          {(pc.photos?.[0]?.url || pc.profile_pic) && (
                            <img src={pc.photos?.[0]?.url || pc.profile_pic} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Next peek card (blurred, behind) */}
                  {companions[currentIndex + 1] && (() => {
                    const nc = companions[currentIndex + 1];
                    return (
                      <div
                        key={`peek-next-${nc.id}`}
                        className="absolute z-10 w-[280px] h-[420px] rounded-[1.25rem] overflow-hidden opacity-40 pointer-events-none transition-all duration-500"
                        style={{ right: '5%', filter: 'blur(4px)', transform: 'scale(0.85)' }}
                      >
                        <div className="w-full h-full bg-zinc-950">
                          {(nc.photos?.[0]?.url || nc.profile_pic) && (
                            <img src={nc.photos?.[0]?.url || nc.profile_pic} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Center card with AnimatePresence */}
                  <div className="relative z-50">
                    <AnimatePresence initial={false} mode="popLayout" custom={direction.current}>
                      {(() => {
                        const c = companions[currentIndex];
                        if (!c) return null;
                        const hasLiked = likedIds.has(c.id);
                        const isMutual = mutualIds.has(c.id);
                        const cp = c.companion_profile || {};
                        const plan = (c.subscription?.plan || c.subscription?.plan_id || c.subscription_plan || '').toLowerCase();
                        const isGoldUser = (plan.includes('pro') || plan.includes('premium') || plan.includes('plus')) || c.subscription?.is_active;
                        const isPlus = plan.includes('plus');
                        const isPremium = plan.includes('pro') || plan.includes('premium');
                        const isBoosted = !!(c.is_boosted && c.boost_expiry && new Date(c.boost_expiry) > new Date());

                        return (
                          <motion.div
                            key={c.id}
                            custom={direction.current}
                            initial={(dir) => ({ x: dir > 0 ? 400 : -400, scale: 0.9, opacity: 0 })}
                            animate={{ x: 0, scale: 1, opacity: 1 }}
                            exit={(dir) => ({ x: dir > 0 ? -400 : 400, scale: 0.9, opacity: 0 })}
                            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.4 }}
                            className={`group relative bg-card rounded-[1.25rem] border overflow-hidden cursor-grab active:cursor-grabbing w-[280px] h-[420px] shrink-0 ${
                              isPlus
                                ? 'bg-black border-amber-500/20 shadow-[0_0_30px_rgba(191,149,63,0.3)]'
                                : isGoldUser
                                  ? 'border-amber-500/20 bg-black'
                                  : 'border-border/5 shadow-[0_20px_50px_rgba(0,0,0,0.2)]'
                            }`}
                            style={{
                              boxShadow: (!isGoldUser && !isPlus) ? `0 20px 40px -10px ${getCardColor(c.id)}44` : undefined,
                            }}
                            data-testid={`companion-card-${c.id}`}
                            onClick={() => setProfileModal(c)}
                          >
                            {isGoldUser && (
                              <div
                                className="absolute -inset-[0.5px] pointer-events-none z-30 rounded-[1.3rem]"
                                style={{
                                  padding: '3px',
                                  background: 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 23%, #B38728 50%, #FBF5B7 77%, #AA771C 100%)',
                                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                  WebkitMaskComposite: 'xor',
                                  maskComposite: 'exclude',
                                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                                }}
                              />
                            )}
                            <div
                              className="relative w-full h-full bg-zinc-950 overflow-hidden flex items-center justify-center"
                              style={{ borderRadius: '1.2rem' }}
                            >
                              {(c.photos?.[0]?.url || c.profile_pic) ? (
                                <img src={c.photos?.[0]?.url || c.profile_pic} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" />
                              ) : null}

                              <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                                <div className="flex flex-col gap-2">
                                  <div className="flex flex-wrap items-center gap-1 mb-0.5">
                                    {isBoosted && (
                                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[6px] sm:text-[7px] font-black text-white bg-amber-500/80 backdrop-blur-md border border-amber-300/30">
                                        <Zap className="w-2 h-2 fill-white" /> BOOSTED
                                      </div>
                                    )}
                                    {c.online_status && (
                                      <div className="flex items-center gap-1 bg-emerald-500/80 backdrop-blur-md text-white text-[6px] sm:text-[7px] font-black py-0.5 px-1.5 rounded border border-emerald-400/30">
                                        <span className="w-1 h-1 rounded-full bg-white inline-block animate-pulse" /> ONLINE
                                      </div>
                                    )}
                                    {isPremium && (
                                      <div className="flex items-center gap-0.5 bg-amber-400 text-[6px] sm:text-[7px] font-black px-1.5 py-0.5 rounded text-black shadow-lg shadow-amber-500/30">
                                        PRO
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-end justify-between gap-1">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1">
                                        <h3 className="text-sm sm:text-base font-black text-white truncate uppercase tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{c.name}</h3>
                                        {c.is_verified && <BadgeCheck className="w-3 h-3 text-emerald-400 shrink-0 drop-shadow-sm" />}
                                      </div>
                                      {c.location && (
                                        <p className="text-[9px] sm:text-[11px] text-white/70 flex items-center gap-1 mt-0.5 font-bold truncate">
                                          <MapPin className="w-2 h-2" /> {c.location}
                                        </p>
                                      )}
                                    </div>

                                    <motion.div
                                      whileTap={{ scale: 0.7 }}
                                      onClick={(e) => { e.stopPropagation(); handleLike(c.id); }}
                                      className="relative flex items-center justify-center w-11 h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.4)] active:shadow-inner cursor-pointer"
                                    >
                                      <CurvedHeart
                                        fill={isMutual}
                                        half={hasLiked && !isMutual}
                                        size={26}
                                        className="text-[#f43f5e] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                                      />
                                    </motion.div>

                                    {cp.rating > 0 && (
                                      <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-black text-white border border-white/10 shrink-0">
                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                        {cp.rating.toFixed(1)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {cp.category && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-left ml-4 opacity-50 pointer-events-none">
                                  <p className="text-[6px] font-black uppercase tracking-[0.4em] text-white/40">{cp.category}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </main>

        </div>{/* end flex-row */}
      </div>{/* end max-w container */}

      <div className="hidden sm:block">
        <Footer />
      </div>

      {/* Swipe History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-sm w-[94vw] max-h-[80vh] overflow-hidden p-0 border-none shadow-2xl rounded-3xl flex flex-col">
          <DialogTitle className="sr-only">Swipe History</DialogTitle>
          <div className="px-5 pt-5 pb-3 border-b border-border/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-black uppercase tracking-widest">Session History</h3>
            </div>
            <span className="text-[10px] text-muted-foreground/50 font-bold">{swipeHistory.length} cards</span>
          </div>
          <div className="px-6 py-6 overflow-y-auto no-scrollbar max-h-[60vh]">
            <div className="grid grid-cols-3 gap-6">
              {swipeHistory.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground/30 italic text-xs">No activity yet this session</div>
              )}
              {swipeHistory.map((entry, idx) => (
                <div key={`${entry.companion.id}-${idx}`} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => { setProfileModal(entry.companion); setShowHistory(false); }}>
                  <div className="relative w-16 h-16 rounded-full p-[2px] bg-muted border border-border/10 flex items-center justify-center shadow-sm transition-transform active:scale-95 group-hover:scale-105">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img src={entry.companion.profile_pic || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                    </div>
                    {/* Status Badge */}
                    {entry.action === 'liked' && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border/10 flex items-center justify-center shadow-md">
                        <CurvedHeart
                          fill={mutualIds.has(entry.companion.id)}
                          half={!mutualIds.has(entry.companion.id)}
                          size={12}
                          className="text-rose-500 fill-rose-500"
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground truncate w-full text-center">
                    {entry.companion.name?.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {swipeHistory.length > 0 && (
            <div className="px-4 py-3 border-t border-border/10">
              <button
                onClick={() => setSwipeHistory([])}
                className="w-full text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 font-bold uppercase tracking-widest transition-colors"
              >
                Clear History
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!profileModal} onOpenChange={() => setProfileModal(null)}>
        <DialogContent className="max-w-[420px] w-[96vw] max-h-[92vh] h-[92vh] overflow-hidden p-0 border-0 border-transparent ring-0 focus:ring-0 outline-none bg-background shadow-2xl rounded-[2.5rem] flex flex-col no-scrollbar [&>button]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <DialogTitle className="sr-only">Profile of {profileModal?.name}</DialogTitle>
          {profileModal && (
            <CompanionProfileDetail
              companion={profileModal}
              user={user}
              token={token}
              onClose={() => setProfileModal(null)}
              onBookingRequest={(comp) => {
                setProfileModal(null);
                handleBookingRequest(comp);
              }}
              onUnlockChat={() => { }}
              onReport={(comp) => {
                setProfileModal(null);
                setReportModal(comp);
              }}
              onReview={(comp) => {
                setProfileModal(null);
                setReviewModal(comp);
              }}
              mutualMatch={mutualIds.has(profileModal.id)}
              haveSentLike={likedIds.has(profileModal.id)}
              hasCompletedBooking={userBookings.some(b => b.companion_id === profileModal.id && b.status === 'completed')}
              reviewList={reviewList}
              restrictedMode={restrictedMode}
              onNext={companions.length > 1 ? handleNextProfile : null}
              onPrev={companions.length > 1 ? handlePrevProfile : null}
            />
          )}
        </DialogContent>

      </Dialog>

      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="sr-only">Rate & Review</DialogTitle>
          <DialogHeader><DialogTitle>Rate & Review</DialogTitle></DialogHeader>
          <form onSubmit={submitReview} className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                    <Star className={`w-6 h-6 ${s <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea placeholder="Share your experience..." rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
            <Button type="submit" className="w-full btn-pro">Submit Review</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reportModal} onOpenChange={() => setReportModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="sr-only">Report User</DialogTitle>
          <DialogHeader><DialogTitle>Report User</DialogTitle></DialogHeader>
          <form onSubmit={submitReport} className="space-y-4">
            <Select value={reportForm.reason} onValueChange={(v) => setReportForm({ ...reportForm, reason: v })}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {['Fake profile', 'Inappropriate behavior', 'Harassment', 'Spam', 'Other'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Details..." rows={3} value={reportForm.details} onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })} />
            <Button type="submit" variant="destructive" className="w-full">Submit Report</Button>
          </form>
        </DialogContent>
      </Dialog>

      <BookingFormModal
        isOpen={bookingModal}
        onClose={() => setBookingModal(false)}
        companion={selectedCompanion}
        token={token}
        initialMode={mode}
      />

      <Dialog open={inviteModal} onOpenChange={setInviteModal}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="sr-only">Invite a Friend</DialogTitle>
          <DialogHeader><DialogTitle>Invite a Friend</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">Share your invite link. When they join & verify, you both get <strong>1 week FREE</strong> premium access.</p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-xs h-9" />
              <Button size="icon" variant="outline" className="h-9 w-9" onClick={copyInvite}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDiamondPopup} onOpenChange={setShowDiamondPopup}>
        <DialogContent className="max-w-sm p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <DialogTitle className="sr-only">Diamond Store</DialogTitle>
          <div className="relative p-8 text-center" style={{ background: 'linear-gradient(135deg, #1a0533, #2d0a5e, #1a0533)' }}>
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, #a855f7, transparent 70%)' }} />
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-900/50" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                <Gem className="w-10 h-10 text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.8))' }} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Need Diamonds</h2>
              <p className="text-purple-300 text-xs font-bold mt-1 uppercase tracking-widest">Chat Access Locked</p>
            </div>
          </div>
          <div className="p-6 space-y-5 bg-background">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Balance</p>
                <p className="text-2xl font-black flex items-center gap-1.5 mt-0.5">
                  <Gem className="w-5 h-5 text-purple-500" />
                  <span>{user?.diamonds ?? 0}</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Unlock chats instantly by topping up your diamond balance in the store.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowDiamondPopup(false)} className="h-12 rounded-xl font-bold">
                Later
              </Button>
              <Button
                className="h-12 rounded-xl font-black shadow-lg shadow-purple-500/30 gap-2"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none' }}
                onClick={() => { setShowDiamondPopup(false); navigate('/subscription'); }}
              >
                <Gem className="w-4 h-4" /> Open Store
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPirateModal} onOpenChange={() => setShowPirateModal(false)}>
        <DialogContent className="max-w-[340px] w-[92vw] rounded-3xl p-0 overflow-hidden border-none bg-zinc-950 shadow-2xl no-scrollbar">
          <DialogTitle className="sr-only">Chat Unlock Tokens</DialogTitle>
          <div className="relative p-7 flex flex-col items-center text-center gap-5">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/8 to-transparent pointer-events-none" />
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Lock className="w-9 h-9 text-blue-400" />
            </div>
            <div className="space-y-2 relative">
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {unlockBalance} Chat Unlocks
              </h2>

              <p className="text-zinc-400 text-sm leading-relaxed">
                {unlockBalance > 0
                  ? "You have tokens available! Choose a companion to unlock their chat."
                  : "You don't have any Chat Unlock tokens. Purchase them from the Diamond Store."}
              </p>

            </div>
            <div className="w-full flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-zinc-300 font-medium">{diamonds ?? 0} Diamonds</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Balance</span>
            </div>
            <div className="w-full space-y-2.5 relative">
              <Button
                className="w-full h-13 rounded-2xl font-black flex items-center justify-center gap-2 text-sm shadow-lg"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}
                onClick={() => { setShowPirateModal(false); navigate('/subscription', { state: { viewMode: 'diamonds', activeStoreTab: 'chat' } }); }}
              >
                <span className="text-lg font-black mr-1">+</span>
                <Gem className="w-4 h-4" />
                Add Chat Unlocks
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 rounded-2xl text-zinc-600 hover:text-white hover:bg-white/5 text-xs font-bold"
                onClick={() => setShowPirateModal(false)}
              >
                Maybe later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showUnlockConfirm} onOpenChange={() => setShowUnlockConfirm(null)}>
        <DialogContent className="max-w-sm w-[95vw] rounded-3xl p-0 overflow-hidden border-none bg-zinc-950 shadow-2xl">
          <DialogTitle className="sr-only">Confirm Unlock</DialogTitle>
          <div className="relative p-8 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Unlock {showUnlockConfirm?.user_name}?
              </h2>
              <p className="text-zinc-400 text-sm font-medium">
                This will use <span className="text-emerald-500 font-black">1 Chat Unlock Token</span>.
                You have <span className="text-white font-black">{unlockBalance} left</span>.
              </p>
            </div>

            <div className="w-full grid grid-cols-2 gap-3 pb-2">
              <Button
                variant="ghost"
                className="h-12 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/5 font-bold"
                onClick={() => setShowUnlockConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                className="h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black font-black shadow-lg shadow-emerald-500/20"
                onClick={confirmUnlock}
              >
                Yes, Unlock!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="max-w-[380px] w-[95vw] rounded-[3rem] p-0 overflow-hidden border-none bg-black shadow-[0_0_100px_rgba(244,63,94,0.3)]">
          <VisuallyHidden>
            <DialogTitle>Mutual Match Found!</DialogTitle>
            <DialogDescription>You and this companion have liked each other.</DialogDescription>
          </VisuallyHidden>
          <DialogTitle className="sr-only">It's a Match!</DialogTitle>
          <div className="relative p-10 flex flex-col items-center text-center gap-8">
            {/* Background Halo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 match-halo pointer-events-none" />

            <div className="relative z-10 space-y-2">
              <h2 className="text-4xl font-black gold-text-shimmer italic tracking-tighter" style={{ fontFamily: 'var(--font-heading)' }}>
                IT'S A MATCH!
              </h2>
              <p className="text-white/60 text-sm font-bold uppercase tracking-[0.3em]">Connection Established</p>
            </div>

            <div className="relative z-10 flex items-center justify-center h-40 w-full">
              {/* User Avatar */}
              <div className="absolute left-[20%] w-28 h-28 rounded-full border-4 border-white inline-block overflow-hidden shadow-2xl animate-match-bounce">
                <img src={user?.profile_pic || 'https://via.placeholder.com/150'} alt="Me" className="w-full h-full object-cover" />
              </div>

              {/* Heart in Middle */}
              <div className="absolute z-20 bg-rose-500 rounded-full p-3 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse">
                <CurvedHeart fill size={28} className="text-white" />
              </div>

              {/* Companion Avatar */}
              <div className="absolute right-[20%] w-28 h-28 rounded-full border-4 border-white inline-block overflow-hidden shadow-2xl animate-match-bounce [animation-delay:0.3s]">
                <img src={matchCompanion?.profile_pic || 'https://via.placeholder.com/150'} alt={matchCompanion?.name} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="relative z-10 space-y-3">
              <p className="text-white text-xl font-black">
                You and <span className="text-rose-400">{matchCompanion?.name}</span> both liked each other!
              </p>
              <p className="text-zinc-400 text-sm font-medium px-4">
                A connection has been established. You can now start chatting and plan your next catchup.
              </p>
            </div>

            <div className="relative z-10 w-full flex flex-col gap-3">
              <Button
                className="h-14 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-lg shadow-xl shadow-rose-500/20 hover:scale-[1.02] transition-transform"
                onClick={() => {
                  setShowMatchModal(false);
                  navigate('/chat', { state: { targetUser: { id: matchCompanion?.id, name: matchCompanion?.name } } });
                }}
              >
                Send a Message
              </Button>
              <Button
                variant="ghost"
                className="h-12 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/5 font-bold"
                onClick={() => setShowMatchModal(false)}
              >
                Keep Browsing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
