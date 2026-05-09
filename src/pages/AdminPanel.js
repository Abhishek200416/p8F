import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Shield, Users, CreditCard, Settings, ShieldCheck,
  AlertTriangle, Mail, Clock, Video, Ban, Trash2,
  TrendingUp, DollarSign, Activity, MoreVertical,
  Eye, X, Zap, ChevronRight, ChevronLeft, ChevronDown, Gift,
  Ticket, Search, Menu, Loader2, User, UserCheck,
  Plus, CheckCircle2, AlertCircle, BarChart3,
  Wallet, ArrowUpRight, ArrowDownLeft, Filter,
  Check, Info, RefreshCw, Layers, Layout,
  Send, EyeOff, Lock, Unlock, Key, MoreHorizontal,
  ThumbsUp, MessageSquare, Heart, Star, Share2,
  Trophy, Target, ZapOff, Globe, Bell, History,
  ShieldAlert, Download, Upload, ExternalLink,
  Smartphone, Monitor, Tablet, List, Grid, UserCircle,
  Save, Menu as MenuIcon, Crown, Megaphone, Sparkles, Gem, Pencil, Settings2,
  MapPin, CheckCircle, Calculator, Fingerprint, Cog, Database, HardDrive, FolderArchive, RotateCcw, FileDown, Trash, Play, CloudUpload, BadgeCheck, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from "@/components/ui/checkbox";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import DataBackupTab from '@/components/DataBackupTab';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : (process.env.REACT_APP_API_URL || '/api');

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) return url;
  
  let baseUrl = process.env.REACT_APP_BACKEND_URL || '';
  if (!baseUrl && process.env.NODE_ENV === 'development') {
    baseUrl = 'http://127.0.0.1:8000';
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBase}${cleanUrl}`;
};

const PERMISSION_SCOPES = [
  { id: 'full_access', label: 'Root Admin', desc: 'Full system access' },
  { id: 'users', label: 'User Manager', desc: 'Manage profiles & moderation' },
  { id: 'finance', label: 'Finance Manager', desc: 'Payments, plans & rewards' },
  { id: 'growth', label: 'Growth Manager', desc: 'Campaigns & referral system' },
  { id: 'safety', label: 'Safety Moderator', desc: 'Blocked words & bans' },
  { id: 'reviews', label: 'Review Moderator', desc: 'Moderate companion reviews' },
  { id: 'analytics', label: 'Analytics Viewer', desc: 'Read-only stats access' },
];

const AdminSidebarGroups = [
  {
    label: 'Overview',
    items: [
      { key: 'analytics', label: 'Analytics', icon: BarChart3 },
      { key: 'earnings', label: 'Earnings', icon: Wallet },
      { key: 'accounting', label: 'Accounting', icon: Calculator },
    ]
  },
  {
    label: 'Management',
    items: [
      { key: 'users', label: 'User Management', icon: Users },
      { key: 'plans', label: 'Plan Management', icon: Layers },
      { key: 'diamond_mgmt', label: 'Diamond Management', icon: Gem },
      { key: 'leaderboard_mgmt', label: 'Leaderboard Management', icon: Trophy },
      { key: 'economy', label: 'Platform Economy', icon: TrendingUp },
      { key: 'team', label: 'Team Members', icon: UserCheck },
    ]
  },
  {
    label: 'Marketing',
    items: [
      { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
      { key: 'newsletter', label: 'Newsletter', icon: Mail },
    ]
  },
  {
    label: 'Systems',
    items: [
      { key: 'moderation', label: 'Safety Moderation', icon: Shield },
      { key: 'review_moderation', label: 'Review Moderation', icon: Star },
      { key: 'data_backup', label: 'Data Backup', icon: Database },
    ]
  }
];

const StatusBadge = memo(({ user: u }) => {
  if (u.is_banned) return <Badge variant="destructive" className="text-[10px] px-2 py-0.5 rounded-lg border-rose-500/20">Banned Account</Badge>;
  if (u.is_suspended) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] px-2 py-0.5 rounded-lg">Suspended</Badge>;

  const isVerified = u.is_verified && u.face_verified;

  if (isVerified) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-lg uppercase font-black tracking-tight flex items-center gap-1 w-fit">
        <CheckCircle2 className="w-3 h-3" /> Verified Profile
      </Badge>
    );
  }

  return (
    <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] px-2 py-0.5 rounded-lg uppercase font-black tracking-tight flex items-center gap-1 w-fit">
      <AlertCircle className="w-3 h-3" /> Unverified Profile
    </Badge>
  );
});

const IdentityVerificationRequired = memo(() => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in duration-500">
    <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-8 border border-indigo-500/20 shadow-xl shadow-indigo-500/10 relative">
      <Fingerprint className="w-12 h-12" />
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 rounded-full border-4 border-background flex items-center justify-center shadow-lg">
        <Lock className="w-3 h-3 text-white fill-white" />
      </div>
    </div>
    <h2 className="text-3xl font-black tracking-tight mb-4">Identity Verification Required</h2>
    <p className="text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed font-medium">
      Administrative access to PlusOneStar's internal systems is <span className="text-indigo-600 font-bold">strictly protected</span>. To activate your staff tools, you must first complete your Face ID identification.
    </p>
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <Button onClick={() => window.location.href = '/profile?action=verify'} className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 gap-3 group">
        Verify Identity Now
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>
      <Button variant="ghost" onClick={() => window.location.href = '/dashboard'} className="h-14 px-8 rounded-2xl font-bold uppercase tracking-widest opacity-60 hover:opacity-100">
        Return to Dashboard
      </Button>
    </div>
    <div className="mt-16 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 max-w-lg">
      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 flex items-center justify-center gap-2">
        <ShieldAlert className="w-3 h-3" /> Security Protocol
      </p>
      <p className="text-[11px] text-amber-800/70 font-bold leading-relaxed">
        This is a mandatory step for all team members. Once verified, you will immediately gain access to your assigned administration sectors.
      </p>
    </div>
  </div>
));

const DataSynchronizingLoader = memo(() => (
  <div className="flex justify-center py-20">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 opacity-20" />
        <Shield className="w-5 h-5 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/40 animate-pulse">Synchronizing Data</p>
    </div>
  </div>
));

const RestrictedSectorView = memo(({ message = "Your current authorization scope does not include this area." }) => (
  <div className="py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-[2.5rem] animate-fade-in">
    <Lock className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Restricted Sector</h3>
    <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto mt-2">{message}</p>
  </div>
));
const UserRow = memo(({ user: u, onPreview }) => {
  const isPremium = u.subscription?.is_active === true;

  return (
    <div key={u.id}>
      {/* Desktop row */}
      <div className={`hidden md:grid md:grid-cols-[2fr_1fr_1.5fr_1fr_1fr_160px] items-center px-5 py-3 hover:bg-muted/10 transition-colors gap-3 ${isPremium ? 'bg-gradient-to-r from-amber-500/[0.04] to-transparent border-l-2 border-amber-500/20' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center transition-all ${isPremium ? 'border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]' : 'border border-border/10'}`}>
            {(u.profile_pic || u.photos?.[0]?.url) ? (
              <img src={u.profile_pic || u.photos?.[0]?.url} className="w-full h-full object-cover" alt={u.name} />
            ) : (
              <User className={`w-5 h-5 ${isPremium ? 'text-amber-500' : 'text-muted-foreground/40'}`} />
            )}
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-black truncate uppercase tracking-tight ${isPremium ? 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-sm' : ''}`}>{u.name}</p>
            <p className="text-[10px] text-muted-foreground truncate font-medium opacity-60">{u.email}</p>
          </div>
        </div>
        <div className="font-mono text-[9px] text-muted-foreground/60 truncate">{(u.uid || u.id || '').toString().slice(0, 10)}</div>
        <div>
          {(() => {
            const sub = u.subscription || {};
            const isActive = sub.is_active;
            const endDate = sub.end_date ? new Date(sub.end_date) : null;
            const isExpired = endDate && endDate < new Date();

            if (isActive && !isExpired) {
              const planName = (sub.plan || sub.plan_type || 'Premium').toLowerCase().replace('_', ' ');
              const isTrial = planName.includes('trial');
              return (
                <Badge
                  className={`border-none text-[8px] whitespace-nowrap uppercase font-black ${isTrial ? 'bg-amber-500/10 text-amber-600' : 'bg-accent/10 text-accent border-accent/20'}`}
                >
                  {planName}
                </Badge>
              );
            }
            return <Badge variant="outline" className="text-[8px] opacity-40 whitespace-nowrap font-bold uppercase">Free</Badge>;
          })()}
        </div>
        <div className="text-xs font-bold text-pink-500 flex items-center gap-1">
          <Gem className="w-3 h-3" /> {(u.diamonds || 0)}
        </div>
        <div><StatusBadge user={u} /></div>
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 bg-accent/5 hover:bg-accent hover:text-white transition-all text-accent rounded-xl"
            onClick={() => onPreview(u)}
            title="Open Management Hub"
          >
            <Shield className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile card row */}
      <div className={`md:hidden flex flex-col gap-2 p-3 bg-muted/5 hover:bg-muted/10 transition-colors border-b border-border/5 ${isPremium ? 'bg-gradient-to-r from-amber-500/[0.04] to-transparent border-l-2 border-amber-500/30' : ''}`} onClick={() => onPreview(u)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center transition-all ${isPremium ? 'border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]' : 'border border-border/10'}`}>
              {(u.profile_pic || u.photos?.[0]?.url) ? (
                <img src={u.profile_pic || u.photos?.[0]?.url} className="w-full h-full object-cover" alt={u.name} />
              ) : (
                <User className={`w-5 h-5 ${isPremium ? 'text-amber-500' : 'text-muted-foreground/40'}`} />
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-black truncate uppercase tracking-tight ${isPremium ? 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent' : ''}`}>{u.name}</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const sub = u.subscription || {};
                  const endDate = sub.end_date ? new Date(sub.end_date) : null;
                  const isExpired = endDate && endDate < new Date();

                  if (sub.is_active && !isExpired) {
                    return <span className="text-[9px] font-black text-accent uppercase">{sub.plan?.replace('_', ' ') || 'Premium'}</span>;
                  }
                  return <span className="text-[9px] font-medium text-muted-foreground uppercase opacity-40">Free</span>;
                })()}
                <span className="text-[9px] text-muted-foreground/40 truncate">{(u.uid || u.id || '').toString().slice(0, 8)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-accent" onClick={(e) => { e.stopPropagation(); onPreview(u); }}><Shield className="w-4 h-4" /></Button>
            <StatusBadge user={u} />
          </div>
        </div>
      </div>
    </div>
  );
});

const GrowthChart = ({ data, max }) => {
  const chartData = Array.isArray(data) && data.length > 0 ? data : [
    { date: 'T-4', count: 0 },
    { date: 'T-3', count: 0 },
    { date: 'T-2', count: 0 },
    { date: 'T-1', count: 0 },
    { date: 'Now', count: 0 }
  ];
  const points = (data || []).map((d, i) => {
    const x = (i / 6) * 100;
    const y = 100 - ((d.count / (max || 1)) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-[220px] w-full group">
      {/* Y-Axis Labels */}
      <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[8px] font-black text-muted-foreground opacity-40 pointer-events-none">
        <span>{max}</span>
        <span>{Math.round(max / 2)}</span>
        <span>0</span>
      </div>

      {/* Main Chart Area */}
      <div className="absolute left-8 right-0 top-0 bottom-6">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="border-t border-border/5 w-full" />
          <div className="border-t border-border/5 w-full" />
          <div className="border-t border-border/5 w-full" />
        </div>

        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <motion.path
            d={`M 0,100 L ${points} L 100,100 Z`}
            fill="url(#chartGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />

          {/* Line */}
          <motion.polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* Points */}
          {(data || []).map((d, i) => (
            <motion.circle
              key={i}
              cx={(i / 6) * 100}
              cy={100 - ((d.count / (max || 1)) * 100)}
              r="2"
              fill="#6366f1"
              stroke="white"
              strokeWidth="1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 + (i * 0.1) }}
            />
          ))}
        </svg>
      </div>

      {/* X-Axis Labels */}
      <div className="absolute left-8 right-0 bottom-0 flex justify-between px-1 text-[7px] font-black text-muted-foreground/40">
        {(data || []).map((d, i) => (
          <span key={i} className="w-8 text-center">{d.date}</span>
        ))}
      </div>
    </div>
  );
};

const AnalyticsTab = memo(({ analytics, fetchData, refreshing }) => {
  const [showGrowthDetails, setShowGrowthDetails] = useState(false);

  if (!analytics) return (
    <div className="py-20 flex flex-col items-center justify-center animate-pulse">
      <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Compiling Analytics...</p>
    </div>
  );

  const totalUsers = analytics.total_users || 0;
  const companions = analytics.companions || 0;
  const finders = analytics.finders || 0;
  const verifiedCount = analytics.verified_companions || 0;
  const premiumCount = analytics.premium_users || 0;
  const revenue = analytics.total_revenue || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="hidden lg:block">
          <h2 className="text-xl font-black tracking-tight">Executive Summary</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Real-time Platform Insights</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => fetchData()} disabled={refreshing} className="rounded-xl border-border/10 bg-card/50 backdrop-blur-sm gap-2 text-[10px] font-black uppercase tracking-widest h-10 px-5 transition-all hover:bg-accent hover:text-white">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Sync Data
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Members', value: totalUsers, icon: User, color: 'indigo' },
          { label: 'Verified Companions', value: verifiedCount, icon: BadgeCheck, color: 'emerald' },
          { label: 'Premium Subs', value: premiumCount, icon: Gem, color: 'amber' },
          { label: 'Total Revenue', value: `₹${(revenue).toLocaleString()}`, icon: TrendingUp, color: 'pink' }
        ].map((stat, i) => (
          <Card key={i} className="group relative overflow-hidden border-border/5 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-500 rounded-[2rem] p-6 hover:-translate-y-1">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-${stat.color}-500/10 transition-colors duration-500`} />
            <div className="flex items-center justify-between relative z-10">
              <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-600 border border-${stat.color}-500/10 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-6 relative z-10">
              <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-1">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 border-border/5 bg-card/30 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Growth Velocity</h3>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Registration Velocity Index</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowGrowthDetails(!showGrowthDetails)}
                className={`w-10 h-10 rounded-xl transition-all ${showGrowthDetails ? 'bg-indigo-500 text-white rotate-180' : 'bg-indigo-500/5 text-indigo-500'}`}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/5 flex items-center justify-center text-indigo-500 relative">
                <TrendingUp className="w-4 h-4" />
                <div className="absolute inset-0 bg-indigo-500/20 rounded-xl animate-ping opacity-20" />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <GrowthChart data={analytics.user_growth} max={analytics.max_growth} />
          </div>

          <AnimatePresence>
            {showGrowthDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-6 border-t border-border/5 mt-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Daily Breakdown</h4>
                  {(analytics.user_growth || []).map((g, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-20 text-[10px] font-black uppercase text-muted-foreground opacity-60">{g.date}</div>
                      <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(g.count / (analytics.max_growth || 1)) * 100}%` }} transition={{ duration: 1, delay: i * 0.05 }} className="h-full bg-indigo-600" />
                      </div>
                      <div className="w-8 text-right text-[10px] font-black">{g.count}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Card className="p-8 border-border/5 bg-card/30 backdrop-blur-md rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Platform Distribution</h3>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Member Role Saturation</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500"><Briefcase className="w-4 h-4" /></div>
          </div>
          <div className="flex flex-col h-[200px] justify-center gap-8 px-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent" /> Companions</span>
                <div className="flex items-center gap-2">
                  <span className="opacity-40">{companions} Users</span>
                  <span>{totalUsers > 0 ? Math.round((companions / totalUsers) * 100) : 0}%</span>
                </div>
              </div>
              <div className="h-3 bg-muted/20 rounded-full overflow-hidden border border-border/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${totalUsers > 0 ? (companions / totalUsers) * 100 : 0}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-accent" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-muted-foreground/30" /> Companion Finders</span>
                <div className="flex items-center gap-2">
                  <span className="opacity-40">{finders} Users</span>
                  <span>{totalUsers > 0 ? Math.round((finders / totalUsers) * 100) : 0}%</span>
                </div>
              </div>
              <div className="h-3 bg-muted/20 rounded-full overflow-hidden border border-border/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${totalUsers > 0 ? (finders / totalUsers) * 100 : 0}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-muted-foreground/40" />
              </div>
            </div>
            <p className="text-[8px] text-muted-foreground italic font-medium">* Percentages may exceed 100% due to members holding dual roles.</p>
          </div>
        </Card>
      </div>
    </div>
  );
});

const AccountingTab = memo(({ accountingData, fetchAccounting, accountingLoading }) => {
  if (accountingData?._forbidden) return (
    <div className="py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-[2.5rem] animate-fade-in">
      <Lock className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Restricted Sector</h3>
      <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto mt-2">Your authorization scope does not include Financial Records access.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 backdrop-blur-xl border border-border/5 p-6 rounded-[2rem]">
        <div className="hidden lg:block">
          <h2 className="text-lg font-black tracking-tight">Ledger & Revenue</h2>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-50">Authorized Financial Audit</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchAccounting} disabled={accountingLoading} className="rounded-xl h-9 px-4 text-[9px] font-black uppercase tracking-widest border-border/10 bg-background/50">
            <RefreshCw className={`w-3 h-3 mr-2 ${accountingLoading ? 'animate-spin' : ''}`} /> Refresh Ledger
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20">
            <ArrowUpRight className="w-3 h-3 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-border/5 bg-gradient-to-br from-indigo-500/[0.08] to-transparent rounded-[2rem]">
          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600/70 mb-1">Gross Revenue</p>
          <h4 className="text-2xl font-black tracking-tight">₹{(accountingData?.total_gross || 0).toLocaleString()}</h4>
          <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-indigo-600 bg-indigo-500/10 w-fit px-2 py-0.5 rounded-full uppercase">
            <TrendingUp className="w-2.5 h-2.5" /> All Time
          </div>
        </Card>
        <Card className="p-6 border-border/5 bg-gradient-to-br from-emerald-500/[0.08] to-transparent rounded-[2rem]">
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">Net Earnings</p>
          <h4 className="text-2xl font-black tracking-tight">₹{(accountingData?.total_net || 0).toLocaleString()}</h4>
          <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-emerald-600 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full uppercase">
            <CheckCircle2 className="w-2.5 h-2.5" /> Post Charges
          </div>
        </Card>
        <Card className="p-6 border-border/5 bg-gradient-to-br from-rose-500/[0.08] to-transparent rounded-[2rem]">
          <p className="text-[9px] font-black uppercase tracking-widest text-rose-600/70 mb-1">Payout Pending</p>
          <h4 className="text-2xl font-black tracking-tight">₹{(accountingData?.payout_pending || 0).toLocaleString()}</h4>
          <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-rose-600 bg-rose-500/10 w-fit px-2 py-0.5 rounded-full uppercase">
            <Clock className="w-2.5 h-2.5" /> In Pipeline
          </div>
        </Card>
      </div>

      <Card className="border-border/5 bg-card/20 rounded-[2.5rem] overflow-hidden">
        <div className="px-8 py-5 border-b border-border/5 bg-muted/30 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 text-foreground">Transaction Registry</h3>
          <Badge variant="outline" className="text-[8px] uppercase font-black opacity-40">Live Audit</Badge>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead className="bg-muted/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 border-b border-border/5">
              <tr>
                <th className="px-8 py-4 text-left">Transaction ID</th>
                <th className="px-6 py-4 text-left">Entity</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-8 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/5">
              {(accountingData?.transactions || []).map((tx, idx) => (
                <tr key={idx} className="hover:bg-muted/5 transition-colors group">
                  <td className="px-8 py-4 text-[9px] font-mono text-muted-foreground group-hover:text-foreground">{tx.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-black uppercase">{tx.user_name}</div>
                    <div className="text-[8px] text-muted-foreground font-bold">{tx.user_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter py-0 h-4 border-border/20">{tx.type}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[10px] font-black text-emerald-500">₹{tx.amount}</div>
                  </td>
                  <td className="px-8 py-4 text-right text-[9px] font-bold text-muted-foreground/60">{new Date(tx.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(accountingData?.transactions || []).length === 0 && (
            <div className="py-20 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">No transaction records present</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

const UserManagementTab = memo(({ users, isMasterAdmin, fetchData, refreshing, setPreviewUser, setPreviewExpanded }) => {
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('default');
  const [matchFilter, setMatchFilter] = useState(false);

  const filteredUsers = useMemo(() => {
    return (users || [])
      .filter(u => !isMasterAdmin(u))
      .filter(u =>
        !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
      )
      .filter(u => {
        if (userFilter === 'all') return true;
        if (userFilter === 'customer') return u.role === 'companion_finder' || u.role === 'customer';
        if (userFilter === 'companion') return u.role === 'companion' || u.role === 'service_provider';
        if (userFilter === 'paid') return u.subscription?.is_active === true;
        if (userFilter === 'free') return !u.subscription?.is_active;
        return true;
      })
      .filter(u => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'verified') return u.is_verified && u.face_verified;
        if (statusFilter === 'unverified') return !u.is_verified || !u.face_verified;
        if (statusFilter === 'banned') return u.is_banned;
        if (statusFilter === 'suspended') return u.is_suspended;
        return true;
      })
      .filter(u => {
        if (!matchFilter) return true;
        return u.is_verified && u.face_verified && u.photos?.length > 0;
      })
      .sort((a, b) => {
        if (sortFilter === 'reported') return (b.report_count || 0) - (a.report_count || 0);
        if (sortFilter === 'rated') return (b.rating || 0) - (a.rating || 0);
        if (sortFilter === 'commented') return (b.comment_count || 0) - (a.comment_count || 0);
        if (sortFilter === 'preferred') {
          const aPref = a.is_preferred ? 1 : 0;
          const bPref = b.is_preferred ? 1 : 0;
          return bPref - aPref;
        }
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [users, userSearch, userFilter, statusFilter, matchFilter, sortFilter, isMasterAdmin]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="sticky top-14 md:top-0 bg-background/95 backdrop-blur-md z-30 py-4 -mx-1 px-1 border-b border-border/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-base sm:text-lg font-extrabold hidden lg:block">User Management</h2>
        <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar -mx-4 px-4 md:mx-0 md:px-1 py-1">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="h-7 sm:h-9 w-[80px] sm:w-[130px] rounded-lg sm:rounded-xl border border-border/20 bg-card px-2 sm:px-3 text-[8px] sm:text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition-all hover:bg-muted/30">
                <SelectValue placeholder="Roles" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-wider">All Roles</SelectItem>
                <SelectItem value="customer" className="text-[10px] font-bold uppercase tracking-wider">Finder</SelectItem>
                <SelectItem value="companion" className="text-[10px] font-bold uppercase tracking-wider">Companion</SelectItem>
                <SelectItem value="paid" className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Premium</SelectItem>
                <SelectItem value="free" className="text-[10px] font-bold uppercase tracking-wider opacity-60">Free</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-7 sm:h-9 w-[80px] sm:w-[130px] rounded-lg sm:rounded-xl border border-border/20 bg-card px-2 sm:px-3 text-[8px] sm:text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition-all hover:bg-muted/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-wider">Status: All</SelectItem>
                <SelectItem value="verified" className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Verified</SelectItem>
                <SelectItem value="unverified" className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Unverified</SelectItem>
                <SelectItem value="banned" className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Banned</SelectItem>
                <SelectItem value="suspended" className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortFilter} onValueChange={setSortFilter}>
              <SelectTrigger className="h-7 sm:h-9 w-[80px] sm:w-[130px] rounded-lg sm:rounded-xl border border-border/20 bg-card px-2 sm:px-3 text-[8px] sm:text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition-all hover:bg-muted/30">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                <SelectItem value="default" className="text-[10px] font-bold uppercase tracking-wider">Sort: Default</SelectItem>
                <SelectItem value="reported" className="text-[10px] font-bold uppercase tracking-wider">Reported</SelectItem>
                <SelectItem value="rated" className="text-[10px] font-bold uppercase tracking-wider">Rated</SelectItem>
                <SelectItem value="commented" className="text-[10px] font-bold uppercase tracking-wider">Comments</SelectItem>
                <SelectItem value="preferred" className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Preferred</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant={matchFilter ? 'default' : 'outline'}
              className={`h-7 sm:h-9 px-2 sm:px-4 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all ${matchFilter ? 'bg-emerald-500 hover:bg-emerald-600 border-none' : 'hover:bg-accent hover:text-white'}`}
              onClick={() => setMatchFilter(!matchFilter)}
            >
              Match
            </Button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <Input
                placeholder="Search..."
                className="pl-7 h-7 sm:h-9 text-[8px] sm:text-[10px] w-24 sm:w-48 rounded-lg sm:rounded-xl bg-card/50 border-border/20 transition-all focus:ring-1 focus:ring-accent/20"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => fetchData()}
              disabled={refreshing}
              className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl border-border/20 hover:bg-accent/5"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-border/10 overflow-x-auto no-scrollbar rounded-2xl">
        {/* Desktop Header */}
        <div className="hidden md:grid md:grid-cols-[2fr_1fr_1.5fr_1fr_1fr_160px] bg-muted/40 text-[10px] font-black uppercase text-muted-foreground px-5 py-3 border-b border-border/10 gap-3">
          <div>User</div>
          <div>UID</div>
          <div>Plan</div>
          <div>Diamonds</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>

        <div className="divide-y divide-border/5">
          {filteredUsers.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">No matching members found</p>
            </div>
          ) : filteredUsers.map(u => (
            <UserRow
              key={u.id}
              user={u}
              onPreview={(user) => {
                setPreviewUser(user);
                setPreviewExpanded(true);
              }}
            />
          ))}
        </div>
      </Card>
    </div>
  );
});

export default function AdminPanel() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  // RBAC: Helper to check if current user has access to a specific tab/scope
  const canAccess = (key) => {
    if (!user) return false;
    const perms = user.admin_permissions || [];
    if (perms.includes('full_access') || perms.includes('root')) return true;

    // Map sidebar keys to backend permission scopes
    const keyToScope = {
      'analytics': 'analytics',
      'earnings': 'finance',
      'accounting': 'finance',
      'users': 'users',
      'plans': 'finance',
      'diamond_mgmt': 'finance',
      'economy': 'finance',
      'team': 'full_access',
      'campaigns': 'growth',
      'newsletter': 'growth',
      'moderation': 'safety',
      'review_moderation': 'reviews',
      'data_backup': 'full_access'
    };

    return perms.includes(keyToScope[key]);
  };

  const [activeTab, setActiveTab] = useState('analytics');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Set initial valid tab based on permissions
  useEffect(() => {
    if (user && !canAccess('analytics')) {
      // Find first available item
      for (const group of AdminSidebarGroups) {
        for (const item of group.items) {
          if (canAccess(item.key)) {
            setActiveTab(item.key);
            return;
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [loading, setLoading] = useState(false); // Only used for manual triggers or specific views
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [reportedReviews, setReportedReviews] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [offers, setOffers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [accountingData, setAccountingData] = useState(null);
  const [accountingLoading, setAccountingLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [team, setTeam] = useState([]);
  const [blockedWords, setBlockedWords] = useState([]);
  const [platformCharges, setPlatformCharges] = useState({
    gst_percentage: 18,
    platform_fee: 0,
    diamond_inr_rate: 3,
    trial_days_default: 7,
    lifetime_max_members: 100,
    currency_symbol: '₹',
    boost_plans: [],
    leaderboard_show_placeholders: true,
    leaderboard_occupied_slots: 0
  });

  // Modals for new tabs
  const [planModal, setPlanModal] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '', price: 0, duration: '', duration_days: 0, plan_type: 'companion',
    features: {
      filter_access: false, max_bookings_per_day: 5, advanced_features: false,
      chat_enabled: true, video_call_enabled: false, chat_unlock_limit: 5,
      visitor_insight_access: true, boost_hours: 2, pap_badges: false
    },
    offers: '', diamond_bonus: 0, autopay: false,
    offer_percentage: 0, original_price: 0, is_offer: false, rating: 0
  });
  const [diamondPackModal, setDiamondPackModal] = useState(null);
  const [diamondPackForm, setDiamondPackForm] = useState({ count: 100, price: 300, offer_percentage: 0, original_price: 0, is_offer: false, popular: false, offers: '' });
  const [diamondPacks, setDiamondPacks] = useState([]);
  const [teamModal, setTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState({ email: '', permissions: [] });
  const [newsletterModal, setNewsletterModal] = useState(false);
  const [newsletterForm, setNewsletterForm] = useState({ subject: '', image_url: '', video_url: '', content: '', target_audience: 'both' });
  const [mailModal, setMailModal] = useState(null);
  const [mailForm, setMailForm] = useState({ subject: '', message: '', from_name: 'PlusOneStar Team' });
  const [mailLoading, setMailLoading] = useState(false);

  // Moderation state
  const [wordToDelete, setWordToDelete] = useState(null);

  // Diamond Granting State
  const [diamondModal, setDiamondModal] = useState(null); // stores user object
  const [diamondForm, setDiamondForm] = useState({ amount: 10, message: 'Gift from PlusOneStar team! 💎' });
  const [granting, setGranting] = useState(false);
  const [campaignView, setCampaignView] = useState('campaigns'); // 'campaigns', 'promos'
  const [systemReferralEnabled, setSystemReferralEnabled] = useState(false);
  const [campaignModal, setCampaignModal] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    title: '', description: '', rules: '',
    banner_url: '', desktop_banner_url: '', mobile_banner_url: '', npc_image_url: '',
    video_url: '', reward_diamonds: 0, reward_plan_id: '',
    reward_filter_days: 0, reward_booking_limit: 0,
    active: true, expiry_date: null, campaign_type: 'general'
  });
  const [offerModal, setOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ title: '', description: '', code: '', benefit: '', diamond_reward: 0, reward_chat_unlocks: 0, reward_boost_hours: 0, reward_visitor_days: 0, reward_subscription_plan: '', reward_filter_days: 0, reward_booking_limit: 0, banner_url: '', desktop_banner_url: '', mobile_banner_url: '', npc_image_url: '', video_url: '', active: true, expiry_date: '', one_time_use: false, display_days: 0 });
  const [previewUser, setPreviewUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [moderationSearch, setModerationSearch] = useState('');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewMode, setPreviewMode] = useState('casual');
  const [previewPhotoIdx, setPreviewPhotoIdx] = useState(0);

  const [rewardModal, setRewardModal] = useState(null);
  const [rewardForm, setRewardForm] = useState({ type: 'diamonds', amount: 10, plan_id: '', action: 'give', message: '' });
  const [confirmActionModal, setConfirmActionModal] = useState(null); // { user, action, title, color }
  const [savingSettings, setSavingSettings] = useState(false);
  const [statsModal, setStatsModal] = useState(null); // { title: string, joins: number, earnings: number }

  const [trialModal, setTrialModal] = useState(null);
  const [trialForm, setTrialForm] = useState({ action: 'add_days', days: 7, trial_type: 'both' });
  const [managingTrial, setManagingTrial] = useState(false);
  const [planTypeFilter, setPlanTypeFilter] = useState('companion');


  // New Engagement Tabs State
  const [activeSubTab, setActiveSubTab] = useState('plans');
  const [activeAddonType, setActiveAddonType] = useState('chat');
  const [addonForm, setAddonForm] = useState({ name: '', cost: 0, duration: 0, offer_percentage: 0, original_price: 0, is_offer: false, features: { has_filters: false, has_bookings: false } });
  const [addonModal, setAddonModal] = useState(null);
  const [boostForm, setBoostForm] = useState({ name: '', duration: 'hourly', price: 0, offer_percentage: 0, original_price: 0, is_offer: false });
  const [boostModal, setBoostModal] = useState(null);

  const [slotModal, setSlotModal] = useState(false);
  const [slotAmount, setSlotAmount] = useState(10);

  const handleAddAddon = async () => {
    if (!addonForm.cost || (activeAddonType === 'chat' && !addonForm.unlocks_count)) {
      toast.error('Required fields are missing');
      return;
    }
    const newAddons = { ...(platformCharges.add_ons || {}) };
    if (!newAddons[activeAddonType]) newAddons[activeAddonType] = [];

    const discount = parseInt(addonForm.offer_percentage) || 0;
    const isOffer = discount > 0 || addonForm.is_offer;
    const originalPrice = discount > 0 ? Math.round(addonForm.cost / (1 - discount / 100)) : (addonForm.original_price || addonForm.cost);
    const finalAddon = { ...addonForm, is_offer: isOffer, original_price: originalPrice };

    if (addonModal === 'new') {
      newAddons[activeAddonType].push({ ...finalAddon, id: Date.now().toString() });
    } else {
      newAddons[activeAddonType][addonModal] = { ...finalAddon };
    }

    const newCharges = { ...platformCharges, add_ons: newAddons };
    setPlatformCharges(newCharges);
    setAddonModal(null);

    try {
      setSavingSettings(true);
      await axios.put(`${API}/admin/platform-charges`, newCharges, { headers });
      toast.success(`${activeAddonType} configuration saved successfully.`);
    } catch (err) {
      toast.error('Failed to sync changes to server');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchReportedReviews = async () => {
    try {
      const res = await axios.get(`${API}/admin/reviews/reported`, { headers });
      setReportedReviews(res.data);
    } catch {
      toast.error('Failed to load reported reviews');
    }
  };

  useEffect(() => {
    if (activeTab === 'review_moderation') fetchReportedReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const fetchUserExtras = async () => {
      if (!previewUser || !previewUser.id) return;
      setHistoryLoading(true);


      try {
        const res = await axios.get(`${API}/admin/users/${previewUser.id}/detail`, { headers });
        // Backend returns: { user, bookings, reviews, payments, reports }
        const bookings = res.data.bookings || [];
        const reviews = res.data.reviews || [];
        const payments = res.data.payments || [];
        // Build a unified history feed from bookings + payments
        const historyFeed = [
          ...bookings.map(b => ({
            id: b.id,
            action: 'booking',
            type: b.status,
            amount: `${b.status} appointment`,
            plan_id: b.companion_name || b.customer_name || '',
            timestamp: b.created_at
          })),
          ...payments.map(p => ({
            id: p.id,
            action: 'payment',
            type: p.type || 'purchase',
            amount: `₹${p.amount}`,
            plan_id: p.plan_id || p.type || '',
            timestamp: p.created_at
          }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setUserHistory(historyFeed);
        setUserReviews(reviews);
      } catch (err) {
        console.error("Failed to fetch user extras:", err);
        setUserHistory([]);
        setUserReviews([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchUserExtras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUser?.id]);

  const handleDeleteReview = async (reviewId) => {
    try {
      await axios.delete(`${API}/admin/reviews/${reviewId}`, { headers });
      toast.success('Review eliminated from platform');
      setReportedReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch {
      toast.error('Failed to delete review');
    }
  };

  useEffect(() => {
    if (campaignModal === 'new') {
      setCampaignForm({
        title: '', description: '', rules: '',
        banner_url: '', desktop_banner_url: '', mobile_banner_url: '', npc_image_url: '',
        video_url: '', reward_diamonds: 0, reward_plan_id: '',
        reward_filter_days: 0, reward_booking_limit: 0,
        active: true, expiry_date: null, campaign_type: 'general'
      });
      setBannerPreviews({ desktop: '', mobile: '', npc: '', offer_desktop: '', offer_mobile: '', offer_npc: '' });
    } else if (campaignModal) {
      setCampaignForm({ ...campaignModal });
      setBannerPreviews({
        desktop: campaignModal.desktop_banner_url || campaignModal.banner_url || '',
        mobile: campaignModal.mobile_banner_url || '',
        npc: campaignModal.npc_image_url || ''
      });
    }
  }, [campaignModal]);

  useEffect(() => {
    if (offerModal === 'new') {
      setOfferForm({ title: '', description: '', code: '', benefit: '', diamond_reward: 0, reward_chat_unlocks: 0, reward_boost_hours: 0, reward_visitor_days: 0, reward_subscription_plan: '', reward_filter_days: 0, reward_booking_limit: 0, banner_url: '', desktop_banner_url: '', mobile_banner_url: '', npc_image_url: '', video_url: '', active: true, expiry_date: '', one_time_use: false, display_days: 0 });
      setBannerPreviews({ desktop: '', mobile: '', npc: '', offer_desktop: '', offer_mobile: '', offer_npc: '' });
    } else if (offerModal) {
      setOfferForm({ ...offerModal });
      setBannerPreviews({
        offer_desktop: offerModal.desktop_banner_url || offerModal.banner_url || '',
        offer_mobile: offerModal.mobile_banner_url || '',
        offer_npc: offerModal.npc_image_url || ''
      });
    }
  }, [offerModal]);

  const handleAddBoost = async () => {
    if (!boostForm.price) {
      toast.error('Price is required');
      return;
    }
    const newBoosts = [...(platformCharges.boost_plans || [])];
    const discount = parseInt(boostForm.offer_percentage) || 0;
    const isOffer = discount > 0 || boostForm.is_offer;
    const originalPrice = discount > 0 ? Math.round(boostForm.price / (1 - discount / 100)) : (boostForm.original_price || boostForm.price);
    const finalBoost = { ...boostForm, is_offer: isOffer, original_price: originalPrice };

    if (boostModal === 'new') {
      newBoosts.push({ ...finalBoost, id: Date.now().toString() });
    } else {
      newBoosts[boostModal] = { ...finalBoost };
    }

    const newCharges = { ...platformCharges, boost_plans: newBoosts };
    setPlatformCharges(newCharges);
    setBoostModal(null);

    try {
      setSavingSettings(true);
      await axios.put(`${API}/admin/platform-charges`, newCharges, { headers });
      toast.success('Boost configuration saved successfully.');
    } catch (err) {
      toast.error('Failed to sync changes to server');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteAddon = (type, index) => {
    setConfirmActionModal({
      title: `Remove ${type} Add-on?`,
      description: 'This will remove the configuration from the active list.',
      action: async () => {
        const addonsArr = Array.isArray(platformCharges.add_ons[type]) ? platformCharges.add_ons[type] : [];
        const newAddonsArr = addonsArr.filter((_, i) => i !== index);
        const newAllAddons = { ...platformCharges.add_ons, [type]: newAddonsArr };
        setPlatformCharges({ ...platformCharges, add_ons: newAllAddons });
        toast.success('Configuration removed locally.');
      },
      color: 'rose'
    });
  };

  const handleDeleteBoost = (index) => {
    setConfirmActionModal({
      title: 'Delete Boost Plan?',
      description: 'This visibility boost will be removed from the store.',
      action: async () => {
        const newBoosts = platformCharges.boost_plans.filter((_, i) => i !== index);
        setPlatformCharges({ ...platformCharges, boost_plans: newBoosts });
        toast.success('Boost plan removed locally.');
      },
      color: 'rose'
    });
  };

  const handleDeleteTeamMember = (memberId) => {
    setConfirmActionModal({
      title: 'Remove Team Member?',
      description: 'This user will lose all administrative privileges immediately.',
      action: async () => {
        try {
          await axios.delete(`${API}/admin/team/${memberId}`, { headers });
          toast.success('Team member removed');
          fetchData();
        } catch {
          toast.error('Failed to remove team member');
        }
      },
      color: 'rose'
    });
  };

  const handleToggleAdminStatus = async (memberId, currentStatus) => {
    try {
      await axios.put(`${API}/admin/team/${memberId}/status`, { status: !currentStatus }, { headers });
      toast.success(`Admin accessibility ${!currentStatus ? 'restored' : 'revoked'}`);
      fetchData();
    } catch {
      toast.error('Failed to update admin status');
    }
  };

  const handleDeleteOffer = (offer) => {
    setConfirmActionModal({
      title: `Delete Offer "${offer.code}"?`,
      description: 'This promo code will be deactivated and cannot be used anymore.',
      action: async () => {
        try {
          await axios.delete(`${API}/admin/offers/${offer.id}`, { headers });
          toast.success('Offer deleted');
          fetchData();
        } catch {
          toast.error('Failed to delete offer');
        }
      },
      color: 'rose'
    });
  };

  const formatError = (err) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(d => d.msg || JSON.stringify(d)).join(', ');
    }
    if (typeof detail === 'object' && detail !== null) {
      return detail.msg || JSON.stringify(detail);
    }
    return 'Action failed';
  };

  const isMasterAdmin = (u) => {
    if (!u) return false;
    // Systemic check for administrative status via flags rather than hardcoded emails
    return u.is_primary_admin === true || u.is_admin === true;
  };

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setInitialLoading(true);
      else setRefreshing(true);

      // We wrap individual requests to handle 403s (Permissions) gracefully
      const safeGet = async (url, setter) => {
        try {
          const res = await axios.get(url, { headers });
          setter(res.data);
          return res.data;
        } catch (err) {
          if (err.response?.status === 403) {
            console.warn(`Access restricted for ${url}: ${err.response?.data?.detail}`);
            setter({ _forbidden: true, detail: err.response?.data?.detail });
          } else {
            console.error(`Fetch error for ${url}:`, err);
          }
          return null;
        }
      };

      // Only fetch if initial or background, and check scope or rely on safeGet gating
      const [uRes, aRes, fRes, cRes, oRes, pRes, payRes, dRes, eRes, teamRes] = await Promise.all([
        safeGet(`${API}/admin/users`, (data) => {
          const allUsers = data?.users || data || [];
          // Use systemic isMasterAdmin check to exclude test/admin accounts from user listings
          setUsers(Array.isArray(allUsers) ? allUsers.filter(u => !isMasterAdmin(u)) : []);
        }),
        safeGet(`${API}/admin/analytics`, setAnalytics),
        safeGet(`${API}/admin/flagged`, setFlagged),
        safeGet(`${API}/admin/campaigns`, setCampaigns),
        safeGet(`${API}/admin/offers`, setOffers),
        safeGet(`${API}/subscriptions/plans`, (data) => {
          if (!data) return;
          const cPlans = (data.customer_plans || []).map(p => ({ ...p, plan_type: 'customer' }));
          const pPlans = (data.companion_plans || []).map(p => ({ ...p, plan_type: 'companion' }));
          const dPacks = (data.diamond_packs || data.diamond_plans || []).map(p => ({ ...p, plan_type: 'diamond' }));
          const miscPlans = (data.plans || []).map(p => ({ ...p, plan_type: p.plan_type || 'other' }));
          setPlans([...cPlans, ...pPlans, ...dPacks, ...miscPlans]);
        }),
        safeGet(`${API}/admin/payouts`, (data) => setPayouts(data?.payouts || data || [])),
        safeGet(`${API}/admin/diamond-packs`, (data) => setDiamondPacks(data?.diamond_packs || data?.diamondPacks || (Array.isArray(data) ? data : []) || [])),
        safeGet(`${API}/admin/platform-charges`, (data) => {
          if (!data) return;
          setPlatformCharges(prev => ({
            ...prev,
            ...data,
            add_ons: data.add_ons || {},
            boost_plans: data.boost_plans || []
          }));

          // Suppress Bottom Navigation Bar on Mobile when any administrative form/modal is active
          if (document.documentElement) {
            const hasOpenModal = !!(planModal || diamondPackModal || teamModal || newsletterModal || mailModal || campaignModal || offerModal || rewardModal || trialModal || confirmActionModal || previewUser);
            if (hasOpenModal) {
              document.documentElement.setAttribute('data-modal-open', 'true');
            } else {
              document.documentElement.removeAttribute('data-modal-open');
            }
          }

          // Update referral toggle from the same response — avoids stale eRes revert bug
          if (typeof data.system_referral_enabled === 'boolean') {
            setSystemReferralEnabled(data.system_referral_enabled);
          }
        }),
        safeGet(`${API}/admin/team`, setTeam)
      ]);

      // Blocked words is auxiliary
      try {
        const bwRes = await axios.get(`${API}/admin/blocked-words`, { headers });
        setBlockedWords(Array.isArray(bwRes.data) ? bwRes.data : []);
      } catch (e) { console.warn("Blocked words restricted"); }

      // system_referral_enabled is now handled inside the platform-charges safeGet callback above
    } catch (err) {
      console.error("Critical Admin Panel Load Error:", err);
      if (!isBackground) toast.error('Failed to load administrative sectors');
    } finally {
      if (!isBackground) setInitialLoading(false);
      else setRefreshing(false);
    }
  };


  const [bannerPreviews, setBannerPreviews] = useState({ desktop: '', mobile: '', npc: '', offer_desktop: '', offer_mobile: '', offer_npc: '' });

  // Robust Bottom Navbar Suppression for Mobile
  const hasOpenModal = useMemo(() => !!(
    planModal || diamondPackModal || teamModal || newsletterModal ||
    mailModal || campaignModal || offerModal || rewardModal ||
    trialModal || confirmActionModal || previewUser || addonModal ||
    boostModal || statsModal || diamondModal || wordToDelete || sidebarOpen
  ), [
    planModal, diamondPackModal, teamModal, newsletterModal,
    mailModal, campaignModal, offerModal, rewardModal,
    trialModal, confirmActionModal, previewUser, addonModal,
    boostModal, statsModal, diamondModal, wordToDelete, sidebarOpen
  ]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (hasOpenModal) {
      document.documentElement.setAttribute('data-modal-open', 'true');
    } else {
      document.documentElement.removeAttribute('data-modal-open');
    }
  }, [hasOpenModal]);

  useEffect(() => {
    fetchData();

    // Auto-refresh admin data every 60 seconds (1 minute) to keep things current without overloading the UI
    // SILENT POLLING: Pass true to perform updates in background without UI loader overlay
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAccounting = async () => {
    setAccountingLoading(true);
    try {
      const res = await axios.get(`${API}/admin/accounting`, { headers });
      setAccountingData(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccountingData({ _forbidden: true, detail: err.response?.data?.detail });
      } else {
        toast.error('Failed to load accounting records');
      }
    } finally {
      setAccountingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'accounting') fetchAccounting();
  }, [activeTab]);



  const handleAction = async (id, action, u) => {
    const actionTitles = {
      'ban': 'Ban User',
      'suspend': 'Suspend User',
      'delete': 'Delete User',
      'activate': 'Activate User'
    };

    setConfirmActionModal({
      title: `${actionTitles[action] || action}?`,
      description: `Are you sure you want to ${action} ${u.name}? This action affects their platform access.`,
      action: async () => {
        try {
          // If we are deleting, close the profile preview first
          if (previewUser) setPreviewUser(null);

          if (action === 'delete') {
            await axios.delete(`${API}/admin/users/${id}`, { headers });
          } else {
            await axios.put(`${API}/admin/users/${id}/${action}`, {}, { headers });
          }
          toast.success(`User ${action} action successful`);
          fetchData();
        } catch (err) {
          toast.error(formatError(err) || `Failed to ${action} user`);
        }
      },
      color: action === 'delete' || action === 'ban' ? 'rose' : 'amber'
    });
  };


  const handleGrantReward = async () => {
    if (!rewardModal) return;
    setGranting(true);
    try {
      const res = await axios.put(`${API}/admin/users/${rewardModal.id}/reward`, rewardForm, { headers });
      toast.success(rewardForm.type === 'diamonds'
        ? `Successfully ${rewardForm.action}d ${rewardForm.amount} diamonds`
        : 'Subscription granted successfully'
      );

      // Sync the new data to the local preview state if it matches the rewarded user
      if (previewUser && (previewUser.id === rewardModal.id)) {
        const updatedUser = { ...previewUser };
        if (rewardForm.type === 'diamonds') {
          updatedUser.diamonds = res.data.diamonds ?? (updatedUser.diamonds || 0);
          if (rewardForm.action === 'give') {
            updatedUser.admin_rewarded_diamonds = (updatedUser.admin_rewarded_diamonds || 0) + (parseInt(rewardForm.amount) || 0);
          }
        } else if (res.data.subscription) {
          updatedUser.subscription = res.data.subscription;
        }
        setPreviewUser(updatedUser);
        // The useEffect will pick up the previewUser change and refresh history
      }

      setRewardModal(null);
      fetchData();
    } catch (err) {
      toast.error(formatError(err) || 'Failed to grant reward');
    }
    setGranting(false);
  };

  const handleManageTrial = async () => {
    if (!trialModal) return;
    setManagingTrial(true);
    try {
      const payload = { action: trialForm.action, days: parseInt(trialForm.days) || 0, trial_type: trialForm.trial_type || 'both' };
      const res = await axios.put(`${API}/admin/users/${trialModal.id}/free-trial`, payload, { headers });
      toast.success(res.data.message || 'Free trial updated successfully');

      if (previewUser && previewUser.id === trialModal.id) {
        const updatedUser = { ...previewUser };
        updatedUser.subscription = res.data.subscription;
        setPreviewUser(updatedUser);
      }

      setTrialModal(null);
      fetchData();
    } catch (err) {
      toast.error(formatError(err) || 'Failed to manage free trial');
    }
    setManagingTrial(false);
  };

  const handleMediaUpload = async (e, type, formKey) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'campaign') setCampaignForm({ ...campaignForm, [formKey]: reader.result });
      else if (type === 'offer') setOfferForm({ ...offerForm, [formKey]: reader.result });
      toast.success('Media ready for upload');
    };
    reader.readAsDataURL(file);
  };

  const handleNewsletterImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewsletterForm({ ...newsletterForm, image_url: reader.result });
      toast.success('Image ready for broadcast');
    };
    reader.readAsDataURL(file);
  };

  const handleToggleCampaign = async (campaignId) => {
    try {
      await axios.patch(`${API}/admin/campaigns/${campaignId}/toggle`, {}, { headers });
      toast.success('Campaign status updated');
      fetchData();
    } catch (err) {
      toast.error(formatError(err) || 'Failed to toggle campaign');
    }
  };

  const handleSendNewsletter = async () => {
    if (!newsletterForm.subject || !newsletterForm.content) {
      toast.error('Subject and content are required');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/admin/newsletter/broadcast`, newsletterForm, { headers });
      toast.success(res.data.message || 'Newsletter dispatched!');
      setNewsletterModal(false);
      setNewsletterForm({ subject: '', content: '', image_url: '', video_url: '', target_audience: 'both' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMail = async () => {
    if (!mailForm.subject || !mailForm.message) {
      toast.error('Subject and message are required');
      return;
    }
    setMailLoading(true);
    try {
      await axios.post(`${API}/admin/users/${mailModal.id}/mail`, mailForm, { headers });
      toast.success(`Mail sent to ${mailModal.name}`);
      setMailModal(null);
      setMailForm({ subject: '', message: '', from_name: 'PlusOneStar Team' });
    } catch (err) {
      toast.error(formatError(err) || 'Failed to send mail');
    } finally {
      setMailLoading(false);
    }
  };

  const handleSavePlan = async () => {
    try {
      const discount = parseInt(planForm.offer_percentage) || 0;
      const isOffer = discount > 0 || planForm.is_offer;
      const originalPrice = discount > 0 ? Math.round(planForm.price / (1 - discount / 100)) : (planForm.original_price || planForm.price);
      const finalPlan = { ...planForm, is_offer: isOffer, original_price: originalPrice };

      if (planModal === 'new') {
        await axios.post(`${API}/admin/plans`, finalPlan, { headers });
        toast.success('Plan created');
      } else {
        const identifier = planModal.id || planModal.duration || 'unknown';
        const url = planModal.id ? `${API}/admin/plans/${planModal.id}` : `${API}/admin/plans/duration/${planModal.duration}`;
        const source_category = planModal.plan_type || 'customer';
        await axios.put(url, finalPlan, { params: { plan_type: source_category }, headers });
        toast.success('Plan updated');
      }
      setPlanModal(null);
      fetchData();
    } catch {
      toast.error('Failed to save plan');
    }
  };

  const handleDeletePlan = async (p) => {
    setConfirmActionModal({
      title: `Delete Plan ${p.name}?`,
      description: 'This action cannot be undone. Users on this plan will remain until their term expires.',
      action: async () => {
        const identifier = p.id || p.duration || 'unknown';
        await axios.delete(`${API}/admin/plans/${identifier}`, { params: { plan_type: p.plan_type || 'customer' }, headers });
        toast.success('Plan deleted');
        fetchData();
      },
      color: 'rose'
    });
  };

  const handleSaveDiamondPack = async () => {
    try {
      const discount = parseInt(diamondPackForm.offer_percentage) || 0;
      const isOffer = discount > 0 || diamondPackForm.is_offer;
      const originalPrice = discount > 0 ? Math.round(diamondPackForm.price / (1 - discount / 100)) : (diamondPackForm.original_price || diamondPackForm.price);
      const finalPack = { ...diamondPackForm, is_offer: isOffer, original_price: originalPrice };

      if (diamondPackModal === 'new') {
        await axios.post(`${API}/admin/diamond-packs`, finalPack, { headers });
        toast.success('Diamond pack created');
      } else {
        await axios.put(`${API}/admin/diamond-packs/${diamondPackModal.id}`, finalPack, { headers });
        toast.success('Diamond pack updated');
      }
      setDiamondPackModal(null);
      fetchData();
    } catch {
      toast.error('Failed to save diamond pack');
    }
  };

  const handleDeleteDiamondPack = async (pack) => {
    setConfirmActionModal({
      title: 'Delete Diamond Pack?',
      description: 'This will remove the pack from the store immediately.',
      action: async () => {
        await axios.delete(`${API}/admin/diamond-packs/${pack.id}`, { headers });
        toast.success('Diamond pack deleted');
        fetchData();
      },
      color: 'rose'
    });
  };

  const handleUpdateEconomy = async (newCharges = null) => {
    setSavingSettings(true);
    try {
      const data = newCharges || platformCharges;
      await axios.put(`${API}/admin/platform-charges`, data, { headers });
      toast.success('Economy settings updated');
      fetchData();
    } catch (err) {
      toast.error(formatError(err) || 'Failed to update economy settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddBlockedWord = async () => {
    const word = prompt("Enter new blocked word:");
    if (!word || !word.trim()) return;
    const newWords = [...blockedWords, word.toLowerCase().trim()];
    try {
      await axios.put(`${API}/admin/blocked-words`, { blocked_words: newWords }, { headers });
      setBlockedWords(newWords);
      toast.success('Word added to blacklist');
    } catch {
      toast.error('Failed to update blacklist');
    }
  };

  const handleDeleteBlockedWord = async (word) => {
    const newWords = blockedWords.filter(w => w !== word);
    try {
      await axios.put(`${API}/admin/blocked-words`, { blocked_words: newWords }, { headers });
      setBlockedWords(newWords);
      toast.success('Word removed from blacklist');
    } catch {
      toast.error('Failed to update blacklist');
    }
  };


  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0 relative overflow-x-hidden" data-testid="admin-panel">
      <Navbar hideBottomNav={hasOpenModal} />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4 lg:mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-xl bg-card border border-border/10 shadow-sm" onClick={() => setSidebarOpen(!sidebarOpen)}><MenuIcon className="w-5 h-5" /></Button>
            <div className={`hidden lg:flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent`}><Shield className="w-5 h-5" /></div>
            <div>
              <div className="lg:hidden">
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-50 mb-0.5">Admin Management</p>
                <h1 className="text-sm font-black uppercase tracking-tight text-accent">
                  {AdminSidebarGroups.flatMap(g => g.items).find(i => i.key === activeTab)?.label || 'System'}
                </h1>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Admin <span className="text-accent">Panel</span></h1>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">System Management v2.4</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border/20 p-6 pt-10 lg:pt-6 overscroll-contain transform transition-all duration-500 lg:relative lg:translate-x-0 lg:w-64 lg:p-0 lg:bg-transparent lg:border-none ${sidebarOpen ? 'translate-x-0 opacity-100 shadow-2xl lg:shadow-none' : '-translate-x-full opacity-0 lg:opacity-100 lg:hidden'}`}>
            <div className="space-y-6 lg:sticky lg:top-24 max-h-[100dvh] lg:max-h-[calc(100dvh-120px)] overflow-y-auto pr-2 pb-32 no-scrollbar">
              {/* Mobile Close Button */}
              <div className="flex items-center justify-between lg:hidden mb-10">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  <span className="font-black text-xs uppercase tracking-widest">Menu</span>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-muted/50" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></Button>
              </div>

              {AdminSidebarGroups.map((group, idx) => {
                const visibleItems = group.items.filter(item => canAccess(item.key));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={idx} className="space-y-2">
                    <div className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{group.label}</div>
                    <div className="space-y-1">
                      {visibleItems.map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => {
                            setActiveTab(key);
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === key ? 'bg-accent text-white shadow-lg shadow-accent/25' : 'text-muted-foreground hover:bg-muted/50'}`}
                        >
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {!isMasterAdmin(user) && !user?.face_verified ? (
              <IdentityVerificationRequired />
            ) : initialLoading ? (
              <DataSynchronizingLoader />
            ) : !canAccess(activeTab) ? (
              <RestrictedSectorView />
            ) : (
              <>
                {activeTab === 'analytics' && (
                  analytics?._forbidden ? (
                    <RestrictedSectorView message="Your current authorization scope does not include analytics access." />
                  ) : (
                    <AnalyticsTab analytics={analytics} fetchData={fetchData} refreshing={refreshing} />
                  )
                )}

                {activeTab === 'users' && (
                  users?._forbidden ? (
                    <RestrictedSectorView message="Your authorization scope does not include User Management access." />
                  ) : (
                    <UserManagementTab
                      users={users}
                      isMasterAdmin={isMasterAdmin}
                      fetchData={fetchData}
                      refreshing={refreshing}
                      setPreviewUser={setPreviewUser}
                      setPreviewExpanded={setPreviewExpanded}
                    />
                  )
                )}

                {activeTab === 'accounting' && (
                  <AccountingTab
                    accountingData={accountingData}
                    fetchAccounting={fetchAccounting}
                    accountingLoading={accountingLoading}
                  />
                )}


                {activeTab === 'earnings' && payouts?._forbidden && (
                  <div className="py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-[2.5rem] animate-fade-in">
                    <Lock className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Restricted Sector</h3>
                    <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto mt-2">Your authorization scope does not include Earnings and Payout data access.</p>
                  </div>
                )}

                {activeTab === 'earnings' && !payouts?._forbidden && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="sticky top-14 md:top-0 bg-background/95 backdrop-blur-md z-30 py-4 px-1 -mx-1 border-b border-border/5 flex items-center justify-between mb-2">
                      <h2 className="text-lg font-extrabold hidden lg:block">Payout History</h2>
                      <Button size="sm" variant="outline" onClick={fetchData} className="gap-2"><RefreshCw className="w-3 h-3" /> Refresh</Button>
                    </div>
                    <Card className="border-border/10 overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem]">
                      <div className="hidden sm:block overflow-x-auto no-scrollbar">
                        <div className="min-w-[600px] text-left text-xs">
                          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-muted/30 uppercase font-black text-muted-foreground/60 px-6 py-4 border-b border-border/5 tracking-widest">
                            <div>Recipient Account</div>
                            <div>Transfer Amount</div>
                            <div>Transaction Date</div>
                            <div className="text-right">Execution Status</div>
                          </div>
                          <div className="divide-y divide-border/5">
                            {Array.isArray(payouts) && payouts.map(p => (
                              <div key={p.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center px-6 py-4 hover:bg-accent/5 transition-colors group">
                                <div className="font-bold text-foreground/80 truncate pr-4">{p.companion_name || 'Anonymous Partner'}</div>
                                <div className="text-emerald-500 font-black flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {platformCharges.currency_symbol}{p.amount?.toLocaleString()}
                                </div>
                                <div className="opacity-50 font-medium">{new Date(p.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                <div className="text-right">
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black uppercase tracking-tighter px-2.5 py-0.5 rounded-lg">
                                    {p.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Mobile View: Card Stack */}
                      <div className="sm:hidden divide-y divide-border/10">
                        {Array.isArray(payouts) && payouts.map(p => (
                          <div key={p.id} className="p-5 space-y-3 hover:bg-muted/5 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0 flex-1 mr-2">
                                <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Partner</p>
                                <p className="text-xs font-black truncate">{p.companion_name || 'Anonymous Partner'}</p>
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg shrink-0">
                                {p.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Amount</p>
                                <p className="text-sm font-black text-emerald-500">{platformCharges.currency_symbol}{p.amount?.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Date</p>
                                <p className="text-[10px] font-bold opacity-50">{new Date(p.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {(!payouts || payouts.length === 0) && (
                        <div className="py-24 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4 opacity-20">
                            <History className="w-6 h-6" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">No verified payout records found</p>
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {activeTab === 'plans' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="sticky top-14 md:top-0 bg-background/95 backdrop-blur-md z-30 py-4 px-1 -mx-1 border-b border-border/5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-extrabold hidden lg:block">Economic Management</h2>
                        {activeSubTab === 'plans' && (
                          <Button size="sm" onClick={() => {
                            setPlanForm({ name: '', price: 0, duration: '', duration_days: 0, plan_type: 'companion', features: { filter_access: false, max_bookings_per_day: 5, advanced_features: false }, offers: '' });
                            setPlanModal('new');
                          }} className="gap-2"><Plus className="w-3.5 h-3.5" /> Add New Plan</Button>
                        )}
                        {activeSubTab === 'add_ons' && (
                          <Button size="sm" onClick={() => {
                            if (activeAddonType === 'boost') {
                              setBoostForm({ name: '', duration: 'hourly', price: 0 });
                              setBoostModal('new');
                            } else {
                              setAddonForm({ name: '', cost: 100, duration: 7, features: { has_filters: false, has_bookings: false } });
                              setAddonModal('new');
                            }
                          }} className="gap-2 bg-pink-500 hover:bg-pink-600 text-white"><Plus className="w-3.5 h-3.5" /> New {activeAddonType.charAt(0).toUpperCase() + activeAddonType.slice(1)}</Button>
                        )}
                      </div>
                      <div className="flex bg-muted/20 p-1 rounded-xl w-fit border border-border/5 mb-4">
                        {[
                          { id: 'plans', label: 'Paid Plans', icon: CreditCard },
                          { id: 'add_ons', label: 'Add-ons Hub', icon: Sparkles }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setActiveSubTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeSubTab === t.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <t.icon className={`w-3.5 h-3.5 ${activeSubTab === t.id ? 'text-accent' : ''}`} />
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {activeSubTab === 'plans' && (
                        <div className="flex bg-muted/10 p-1 rounded-xl w-fit border border-border/5">
                          {[
                            { id: 'companion', label: 'Be Companion Plans', icon: ShieldCheck },
                            { id: 'customer', label: 'Find Companion Plans', icon: Search }
                          ].map(f => (
                            <button
                              key={f.id}
                              onClick={() => setPlanTypeFilter(f.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${planTypeFilter === f.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              <f.icon className="w-3 h-3" />
                              {f.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {activeSubTab === 'plans' && (
                      <div className="space-y-4 py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                          {Array.isArray(plans) && plans.filter(p => planTypeFilter === 'all' || p.plan_type === planTypeFilter).map((p, idx) => (
                            <Card key={p.id || `plan-${idx}`} className="border-border/10 p-5 flex flex-col justify-between group hover:border-accent/30 transition-all">
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-sm tracking-tight">{p.name}</h3>
                                      <Badge variant="outline" className={`text-[8px] font-black uppercase px-1.5 h-4 border-none ${p.plan_type === 'companion' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                        {p.plan_type === 'companion' ? 'Companion' : 'Finder'}
                                      </Badge>
                                      {p.is_trial && (
                                        <Badge className="bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 h-4 border-none">Free Trial</Badge>
                                      )}
                                    </div>
                                    {p.offers && <p className="text-[10px] text-accent font-black uppercase tracking-tighter animate-pulse">{p.offers}</p>}
                                  </div>
                                  <Badge variant="outline" className="text-[10px] font-bold uppercase bg-muted/20">
                                    {p.duration === 'lifetime' ? 'Unlimited' : `${p.duration_days || 30} Days`}
                                  </Badge>
                                </div>
                                <p className="text-2xl font-black mb-4">₹{p.price}</p>
                                <div className="space-y-2 mb-6">
                                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> <span>Filters: {p.features?.filter_access ? 'Yes' : 'No'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> <span>Chat Unlocks: {p.features?.chat_unlock_limit || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> <span>Boost: {p.features?.boost_hours || 0} Hours</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> <span>Diamonds: +{p.diamond_bonus || 0}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => {
                                  setPlanForm({ ...p, plan_type: p.plan_type || 'customer' });
                                  setPlanModal(p);
                                }} variant="outline" size="sm" className="flex-1 text-[11px] font-bold h-9">Edit Plan</Button>
                                <Button onClick={() => handleDeletePlan(p)} variant="ghost" size="sm" className="w-9 h-9 p-0 text-destructive/40 hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                        {Array.isArray(plans) && plans.filter(p => planTypeFilter === 'all' || p.plan_type === planTypeFilter).length === 0 && (
                          <div className="py-20 text-center border-2 border-dashed border-border/10 rounded-[2rem]">
                            <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4 opacity-20">
                              <Layers className="w-8 h-8" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">No plans found in this category</h3>
                            <p className="text-[10px] text-muted-foreground/40 font-bold mt-2">Try adding a new plan or changing your filter.</p>
                          </div>
                        )}
                        <p className="text-[8px] text-muted-foreground/20 font-bold uppercase tracking-widest text-right">Total Plans Loaded: {plans.length}</p>
                      </div>
                    )}

                    {activeSubTab === 'add_ons' && (
                      <div className="space-y-8 py-4">
                        <div className="flex bg-muted/20 p-1 rounded-xl w-fit border border-border/5">
                          {[
                            { id: 'chat', label: 'Chat Access', icon: MessageSquare },
                            { id: 'visitors', label: 'Visitor Data', icon: Eye },
                            { id: 'boost', label: 'Profile Boost', icon: ArrowUpRight }
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setActiveAddonType(t.id)}
                              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeAddonType === t.id ? 'bg-background shadow-sm text-pink-500' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              <t.icon className="w-3.5 h-3.5" />
                              {t.label}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                          {activeAddonType === 'boost' ? (
                            (Array.isArray(platformCharges.boost_plans) ? platformCharges.boost_plans : []).map((b, idx) => (
                              <Card key={idx} className="border-border/10 bg-pink-500/[0.02] rounded-2xl overflow-hidden group cursor-pointer hover:bg-pink-500/[0.05] transition-all" onClick={() => {
                                setBoostForm({ ...b });
                                setBoostModal(idx);
                              }}>
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                                      <ArrowUpRight className="w-5 h-5" />
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-indigo-500 hover:bg-indigo-500/10 opacity-100 transition-opacity mr-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBoostForm({ ...b });
                                        setBoostModal(idx);
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button><Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteBoost(idx); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="font-black text-sm">{b.name}</h4>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{b.duration}</p>
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <p className="text-xl font-black flex items-center gap-1.5"><Gem className="w-4 h-4 text-pink-500" /> {b.price}</p>
                                    {(b.is_offer === true || b.is_offer === 'true') && b.original_price && (
                                      <span className="text-[10px] text-muted-foreground line-through font-bold">{b.original_price}</span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            (Array.isArray(platformCharges.add_ons?.[activeAddonType])
                              ? platformCharges.add_ons[activeAddonType]
                              : (platformCharges.add_ons?.[activeAddonType] ? [platformCharges.add_ons[activeAddonType]] : [])
                            ).map((addon, idx) => (
                              <Card key={idx} className="border-border/10 bg-pink-500/[0.02] rounded-2xl overflow-hidden group cursor-pointer hover:bg-pink-500/[0.05] transition-all" onClick={() => {
                                setAddonForm({ ...addon });
                                setAddonModal(idx);
                              }}>
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                                      {activeAddonType === 'chat' ? <MessageSquare className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-indigo-500 hover:bg-indigo-500/10 opacity-100 transition-opacity mr-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddonForm({ ...addon });
                                        setAddonModal(idx);
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button><Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteAddon(activeAddonType, idx); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="font-black text-sm">{addon.name}</h4>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                      {activeAddonType === 'chat' ? `${addon.unlocks_count || 1} Unlocks` : `${addon.duration} Days Access`}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xl font-black flex items-center gap-1.5"><Gem className="w-4 h-4 text-pink-500" /> {addon.cost}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'leaderboard_mgmt' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="sticky top-14 lg:top-0 bg-background/95 backdrop-blur-md z-30 py-4 px-1 -mx-1 border-b border-border/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <h2 className="text-lg font-extrabold hidden lg:block">Leaderboard Management</h2>
                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex flex-1 lg:flex-none items-center justify-between gap-3 bg-muted/20 px-4 py-2 rounded-2xl border border-border/5">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Placeholders</Label>
                          <Switch
                            checked={platformCharges.leaderboard_show_placeholders !== false}
                            onCheckedChange={async (val) => {
                              try {
                                await axios.put(`${API}/admin/platform-charges`, { leaderboard_show_placeholders: val }, { headers });
                                toast.success(`Placeholders ${val ? 'enabled' : 'disabled'}`);
                                fetchData();
                              } catch (e) {
                                toast.error('Failed to update visibility');
                              }
                            }}
                          />
                        </div>
                        <Button
                          onClick={() => {
                            setSlotAmount(platformCharges.leaderboard_max_slots || 30);
                            setSlotModal(true);
                          }}
                          className="flex-1 lg:flex-none bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl"
                        >
                          <Settings2 className="w-3.5 h-3.5 mr-2" /> Manage Slots
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="rounded-[2.5rem] p-6 border-border/10 bg-muted/10 relative overflow-hidden">
                        <div className="flex items-start justify-between relative z-10">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                              <Trophy className="w-3.5 h-3.5" /> Total Capacity
                            </p>
                            <h3 className="text-4xl font-black text-foreground drop-shadow-lg">
                              {platformCharges.leaderboard_max_slots || 30}
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-bold">
                              {platformCharges.leaderboard_occupied_slots || 0} occupied / {(platformCharges.leaderboard_max_slots || 30) - (platformCharges.leaderboard_occupied_slots || 0)} free
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="rounded-[2.5rem] p-6 border-border/10 bg-emerald-500/10 relative overflow-hidden">
                        <div className="flex items-start justify-between relative z-10">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-emerald-600/70 tracking-widest flex items-center gap-2">
                              <BarChart3 className="w-3.5 h-3.5" /> Pending Slot Requests
                            </p>
                            <h3 className="text-4xl font-black text-emerald-500 drop-shadow-lg">
                              {platformCharges.leaderboard_slot_requests || 0}
                            </h3>
                            <p className="text-[10px] text-emerald-600 font-bold">Users waiting for board expansion</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'diamond_mgmt' && diamondPacks?._forbidden && (
                  <div className="py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-[2.5rem] animate-fade-in">
                    <Lock className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Restricted Sector</h3>
                    <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto mt-2">Your authorization scope does not include Diamond Management access.</p>
                  </div>
                )}

                {activeTab === 'diamond_mgmt' && !diamondPacks?._forbidden && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="sticky top-14 md:top-0 bg-background/95 backdrop-blur-md z-30 py-4 px-1 -mx-1 border-b border-border/5 flex items-center justify-between">
                      <h2 className="text-lg font-extrabold hidden lg:block">Diamonds Management</h2>
                      <div className="flex items-center gap-4">
                        <Button size="sm" onClick={() => {
                          setDiamondPackForm({ count: 100, price: 80, popular: false, offers: '' });
                          setDiamondPackModal('new');
                        }} className="gap-2 bg-pink-500 hover:bg-pink-600 text-white"><Plus className="w-3.5 h-3.5" /> Add Diamond Pack</Button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      {Array.isArray(diamondPacks) && diamondPacks.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-2xl">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No diamond packs configured</p>
                        </div>
                      ) : (
                        Array.isArray(diamondPacks) && diamondPacks.map((pack, idx) => (
                          <Card key={pack.id || `pack-${idx}`} className={`rounded-2xl p-4 space-y-3 border-border/10 hover:border-pink-500/30 transition-all relative ${pack.popular ? 'bg-pink-500/[0.02] border-pink-500/20' : ''}`}>
                            {pack.popular && <Badge className="absolute top-3 right-3 bg-pink-500 text-[8px] font-black uppercase px-1.5 py-0.5">Popular</Badge>}
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500"><Gem className="w-3.5 h-3.5" /></div>
                              <div>
                                <h4 className="font-black text-sm leading-none">{pack.count} <span className="text-[9px] uppercase opacity-40">Diamonds</span></h4>
                                {pack.offers && <p className="text-[8px] font-black text-pink-500 uppercase tracking-widest mt-1">{pack.offers}</p>}
                              </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <p className="text-xl font-black">{platformCharges.currency_symbol}{pack.price}</p>
                              {pack.is_offer && (
                                <p className="text-xs font-bold text-muted-foreground line-through opacity-50">{platformCharges.currency_symbol}{pack.original_price}</p>
                              )}
                              <span className="text-[9px] opacity-40 font-bold tracking-tighter">+ GST</span>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => {
                                setDiamondPackForm(pack);
                                setDiamondPackModal(pack);
                              }} variant="outline" size="sm" className="flex-1 rounded-xl text-[10px] font-bold h-8">Edit</Button>
                              <Button onClick={() => handleDeleteDiamondPack(pack)} variant="ghost" size="sm" className="w-8 h-8 p-0 text-red-500/60 hover:text-red-600 hover:bg-red-500/10" title="Delete Diamond Pack"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'review_moderation' && reportedReviews?._forbidden && (
                  <div className="py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-[2.5rem] animate-fade-in">
                    <Lock className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Restricted Sector</h3>
                    <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto mt-2">Your authorization scope does not include Review Moderation access.</p>
                  </div>
                )}

                {activeTab === 'review_moderation' && !reportedReviews?._forbidden && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black uppercase tracking-tighter hidden lg:block">Review <span className="text-rose-500">Moderation</span></h2>
                      <Button variant="ghost" size="sm" onClick={fetchReportedReviews} className="gap-2"><RefreshCw className="w-3 h-3" /> Refresh Queue</Button>
                    </div>

                    <div className="grid gap-4">
                      {Array.isArray(reportedReviews) && reportedReviews.length === 0 ? (
                        <Card className="border-border/10 p-20 text-center flex flex-col items-center gap-4 bg-muted/5">
                          <Star className="w-12 h-12 opacity-10" />
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No review reports pending investigation</p>
                        </Card>
                      ) : (
                        Array.isArray(reportedReviews) && reportedReviews.map(r => (
                          <Card key={r.id} className="border-border/10 overflow-hidden group">
                            <CardContent className="p-0">
                              <div className="grid md:grid-cols-[1fr_300px] divide-x divide-border/5">
                                <div className="p-6 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map(star => (
                                          <Star key={star} className={`w-3 h-3 ${star <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                                        ))}
                                      </div>
                                      <Badge variant="outline" className="text-[8px] bg-rose-500/5 text-rose-500 border-rose-500/20 px-2">REPORTED</Badge>
                                    </div>
                                    <span className="text-[10px] font-bold opacity-30">{new Date(r.created_at).toLocaleString()}</span>
                                  </div>

                                  <p className="text-sm font-medium leading-relaxed border-l-2 border-rose-500/20 pl-4 py-1 bg-rose-500/[0.02]">
                                    "{r.comment || 'No comment text.'}"
                                  </p>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="destructive"
                                      className="h-9 px-4 text-[10px] font-black uppercase shadow-lg shadow-rose-500/20"
                                      onClick={() => {
                                        setConfirmActionModal({
                                          title: 'Permanently Delete Review?',
                                          description: 'This will remove the review and recalculate the user\'s representative rating. This action cannot be undone.',
                                          action: () => handleDeleteReview(r.id),
                                          color: 'rose'
                                        });
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminate Review
                                    </Button>
                                    <Button variant="outline" className="h-9 px-4 text-[10px] font-bold uppercase" onClick={async () => {
                                      try {
                                        await axios.put(`${API}/admin/reviews/${r.id}/dismiss`, {}, { headers });
                                        toast.success('Report dismissed');
                                        setReportedReviews(prev => prev.filter(rev => rev.id !== r.id));
                                      } catch { toast.error('Failed to dismiss'); }
                                    }}>
                                      Dismiss Report
                                    </Button>
                                  </div>
                                </div>

                                <div className="bg-muted/10 p-6 space-y-6">
                                  <div>
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Reviewer Context</p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                          <AvatarImage src={r.reviewer_context?.profile_pic} />
                                          <AvatarFallback className="font-black text-[10px]">{r.reviewer_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-0.5">
                                          <p className="text-[11px] font-black truncate max-w-[100px]">{r.reviewer_name}</p>
                                          <p className="text-[9px] font-bold text-muted-foreground uppercase">{r.reviewer_context?.role}</p>
                                        </div>
                                      </div>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-accent hover:bg-accent/10" onClick={() => { setPreviewUser(r.reviewer_context); setPreviewExpanded(true); }}>
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  <Separator className="opacity-5" />

                                  <div>
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Reviewed User Context</p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                          <AvatarImage src={r.reviewed_context?.profile_pic} />
                                          <AvatarFallback className="font-black text-[10px]">{r.reviewed_context?.name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-0.5">
                                          <p className="text-[11px] font-black truncate max-w-[100px]">{r.reviewed_context?.name || "Target"}</p>
                                          <p className="text-[9px] font-bold text-muted-foreground uppercase">{r.reviewed_context?.role}</p>
                                        </div>
                                      </div>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-accent hover:bg-accent/10" onClick={() => { setPreviewUser(r.reviewed_context); setPreviewExpanded(true); }}>
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}


                {activeTab === 'moderation' && flagged?._forbidden && (
                  <div className="py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-[2.5rem] animate-fade-in">
                    <Lock className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Restricted Sector</h3>
                    <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto mt-2">Your authorization scope does not include Safety Moderation access.</p>
                  </div>
                )}

                {activeTab === 'moderation' && !flagged?._forbidden && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold hidden lg:block">Safety & Moderation</h2></div>
                    <Card className="border-border/10 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold">Flagged Activity</h3>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input
                            placeholder="Search by User/Reporter ID..."
                            value={moderationSearch}
                            onChange={(e) => setModerationSearch(e.target.value)}
                            className="h-8 pl-8 text-[10px] w-48 rounded-lg bg-muted/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        {Array.isArray(flagged) && flagged.filter(m =>
                          !moderationSearch ||
                          m.reporter_id?.toLowerCase().includes(moderationSearch.toLowerCase()) ||
                          m.reported_user_id?.toLowerCase().includes(moderationSearch.toLowerCase()) ||
                          m.user_id?.toLowerCase().includes(moderationSearch.toLowerCase())
                        ).length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No matching violations</p> : Array.isArray(flagged) && flagged.filter(m =>
                          !moderationSearch ||
                          m.reporter_id?.toLowerCase().includes(moderationSearch.toLowerCase()) ||
                          m.reported_user_id?.toLowerCase().includes(moderationSearch.toLowerCase()) ||
                          m.user_id?.toLowerCase().includes(moderationSearch.toLowerCase())
                        ).map(m => (
                          <div key={m.id} className="p-4 rounded-xl bg-muted/30 border border-border/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase text-amber-600 tracking-widest">{m.flag_reason || 'Safety Alert'}</span>
                              <span className="text-[10px] opacity-40">{new Date(m.created_at).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="p-2 rounded-lg bg-background/50 border border-border/5">
                                <p className="text-[8px] font-black uppercase text-muted-foreground">Reporter ID</p>
                                <p className="font-mono text-[9px] truncate">{m.reporter_id || 'System'}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-background/50 border border-border/5">
                                <p className="text-[8px] font-black uppercase text-muted-foreground">Target ID</p>
                                <p className="font-mono text-[9px] truncate">{m.reported_user_id || m.user_id || 'N/A'}</p>
                              </div>
                            </div>
                            <p className="text-xs opacity-80 bg-background/30 p-2 rounded-lg border border-border/5">"{m.content || m.details || 'No content provided'}"</p>
                            <div className="flex justify-end gap-2 mt-3"><Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold">Dismiss</Button><Button size="sm" variant="destructive" className="h-7 text-[10px] font-bold">Verify & Warn</Button></div>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card className="border-border/10 p-6">
                      <h3 className="text-sm font-bold mb-4">Blocked Words</h3>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(blockedWords) && blockedWords.map(w => (
                          <Badge key={w} variant="secondary" className="px-2 py-1 text-[10px] font-bold gap-1">
                            {w}
                            <X
                              className="w-3 h-3 opacity-40 hover:opacity-100 cursor-pointer"
                              onClick={() => {
                                setConfirmActionModal({
                                  title: 'Remove Blocked Word?',
                                  description: `Are you sure you want to remove "${w}" from the blacklist?`,
                                  action: () => handleDeleteBlockedWord(w),
                                  color: 'rose'
                                });
                              }}
                            />
                          </Badge>
                        ))}
                        <Button variant="outline" size="sm" className="h-7 text-[10px] border-dashed" onClick={handleAddBlockedWord}>+ Add Word</Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] text-indigo-500 hover:bg-indigo-500/10 font-black uppercase tracking-widest"
                          onClick={() => {
                            const standardBlacklist = [
                              'abuse', 'harassment', 'scam', 'fraud', 'bank', 'password', 'whatsapp', 'telegram',
                              'payment', 'google pay', 'phonepe', 'adult', 'escort', 'sexual', 'money', 'crypto',
                              'invest', 'child', 'minor', 'underage', 'explicit', 'nude', 'contact', 'number',
                              'suicide', 'kill', 'death', 'rape', 'porn', 'naked', 'sex', 'trans', 'gay', 'lesbian',
                              'meetup', 'hotel', 'room', 'address', 'location', 'live', 'call', 'video',
                              'account', 'verify', 'otp', 'code', 'support', 'help', 'admin', 'moderator',
                              'pedophile', 'molest', 'incest', 'force', 'violent', 'drugs', 'weed', 'coke', 'mdma',
                              'weapon', 'gun', 'knife', 'murder', 'self harm', 'cvv', 'hacking', 'gambling',
                              'betting', 'lottery', 'profit', 'racist', 'nazi', 'terrorist', 'bomb', 'attack',
                              'sugar daddy', 'sugar mommy', 'fetish', 'kink', 'bdsm', 'threesome', 'orgy', 'strip',
                              'body rub', 'adult service', 'call girl', 'gigolo', 'slut', 'pimp', 'brothel',
                              'private place', 'no strings', 'fwb', 'ons', 'dtf', 'send pics', 'dirty talk'
                            ];
                            const newWords = Array.from(new Set([...(blockedWords || []), ...standardBlacklist]));
                            setConfirmActionModal({
                              title: 'Apply Standard Blacklist?',
                              description: 'This will add common safety-related blocked words to your moderation list.',
                              action: async () => {
                                try {
                                  await axios.put(`${API}/admin/blocked-words`, { blocked_words: newWords }, { headers });
                                  setBlockedWords(newWords);
                                  toast.success('Safety standards applied');
                                } catch { toast.error('Failed to update standards'); }
                              },
                              color: 'indigo'
                            });
                          }}
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" /> Standard Blacklist
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'team' && team?._forbidden && (
                  <div className="py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-[2.5rem] animate-fade-in">
                    <Lock className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Restricted Sector</h3>
                    <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto mt-2">Your authorization scope does not include Team Management access.</p>
                  </div>
                )}

                {activeTab === 'team' && !team?._forbidden && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-sm"><UserCheck className="w-5 h-5" /></div>
                        <div>
                          <h2 className="text-lg font-extrabold tracking-tight hidden lg:block">Administrative Team</h2>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 hidden lg:block">Control Panel Access</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => { setTeamForm({ email: '', permissions: [] }); setTeamModal(true); }} className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
                        <Plus className="w-4 h-4" /> Invite Admin
                      </Button>
                    </div>
                    <Card className="border-border/10 overflow-hidden rounded-[2rem] shadow-sm bg-card/50 backdrop-blur-md">
                      <div className="w-full text-left text-xs">
                        <div className="grid grid-cols-[2fr_1.2fr_1.5fr_auto] bg-indigo-500/[0.04] uppercase font-black text-indigo-900/50 dark:text-indigo-100/50 px-8 py-5 border-b border-indigo-500/10 tracking-widest text-[9px] gap-6 items-center">
                          <div className="flex items-center gap-2"><UserCheck className="w-3 h-3" /> Operative / Staff</div>
                          <div className="flex items-center gap-2"><Fingerprint className="w-3 h-3" /> Verification Status</div>
                          <div className="flex items-center gap-2"><Key className="w-3 h-3" /> Authorization Scope</div>
                          <div className="text-right flex items-center justify-end gap-2"><Cog className="w-3 h-3" /> Management</div>
                        </div>
                        <div className="divide-y divide-border/5">
                          {Array.isArray(team) && team.map(member => {
                            const isRoot = member.is_primary_admin === true;
                            return (
                              <div key={member.id} className={`grid grid-cols-[2fr_1.2fr_1.5fr_auto] items-center px-8 py-6 transition-colors group gap-6 ${isRoot ? 'bg-indigo-500/[0.04]' : 'hover:bg-indigo-500/[0.01]'}`}>
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    {member.is_invited ? (
                                      <div className="w-10 h-10 rounded-2xl bg-slate-500/5 border border-dashed border-slate-500/20 flex items-center justify-center text-slate-400 shadow-sm">
                                        <UserCheck className="w-5 h-5 opacity-40" />
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm">
                                        {(member.name || member.email || '?')[0].toUpperCase()}
                                      </div>
                                    )}
                                    {(member.is_admin || member.is_active_admin) && !member.is_invited && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-background flex items-center justify-center shadow-lg">
                                        <Shield className="w-2 h-2 text-white fill-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-black text-sm tracking-tight text-foreground/90 flex items-center gap-2">
                                      {member.is_invited ? 'Pending Invitation' : (member.name || 'Staff Member')}
                                      {isRoot ? (
                                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border border-amber-500/20">
                                          <Crown className="w-2.5 h-2.5" /> ROOT
                                        </div>
                                      ) : member.is_active_admin ? (
                                        <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border border-indigo-500/20 shadow-[0_0_10px_rgba(79,70,229,0.05)]">
                                          <ShieldCheck className="w-2.5 h-2.5" /> STAFF
                                        </div>
                                      ) : !member.is_invited && (
                                        <div className="flex items-center gap-1 bg-slate-500/10 text-slate-500 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border border-slate-500/20">
                                          <Ticket className="w-2.5 h-2.5" /> PROVISIONAL
                                        </div>
                                      )}
                                      {member.face_verified && <CheckCircle className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/10" />}
                                    </div>
                                    <div className="text-[10px] font-bold text-muted-foreground/60 truncate italic">{member.email}</div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5 items-start">
                                  {member.is_invited ? (
                                    <div className={`flex items-center gap-2 border px-2.5 py-1 rounded-xl shadow-sm ${member.is_accepted ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/10' : 'bg-amber-500/10 text-amber-600 border-amber-500/10'}`}>
                                      <Ticket className="w-3 h-3" />
                                      <span className="text-[9px] font-black uppercase tracking-widest">{member.is_accepted ? 'Accepted' : 'Pending'}</span>
                                    </div>
                                  ) : (
                                    <>
                                      {/* New Multi-Stage Logic */}
                                      {!member.is_admin && !member.is_active_admin ? (
                                        <>
                                          {!member.admin_onboarding_accepted ? (
                                            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 border border-amber-500/10 px-2.5 py-1 rounded-xl shadow-sm" title="Waiting for user to accept the email invitation">
                                              <Mail className="w-3 h-3 animate-pulse" />
                                              <span className="text-[9px] font-black uppercase tracking-widest">Unaccepted</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2 bg-rose-500/10 text-rose-600 border border-rose-500/10 px-2.5 py-1 rounded-xl shadow-sm" title="Acceptance received, waiting for Face ID verification">
                                              <Activity className="w-3 h-3 animate-pulse" />
                                              <span className="text-[9px] font-black uppercase tracking-widest">Verifying</span>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black px-2 py-0.5 rounded-lg shadow-sm shadow-emerald-500/5 uppercase tracking-widest">Active</Badge>
                                      )}

                                      {/* Subsidiary statuses */}
                                      {member.is_banned && <Badge variant="destructive" className="mt-1 text-[8px] font-black px-2 py-0.5 rounded-lg shadow-sm uppercase tracking-tighter">Banned</Badge>}
                                      {member.is_suspended && <Badge className="mt-1 bg-rose-500/10 text-rose-600 border-rose-500/20 text-[8px] font-black px-2 py-0.5 rounded-lg shadow-sm uppercase tracking-tighter">Suspended</Badge>}
                                    </>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 pr-4 justify-start">
                                  {member.admin_permissions?.map(p => {
                                    const iconMap = {
                                      'moderation': <Eye className="w-2.5 h-2.5" />,
                                      'manage_campaigns': <Megaphone className="w-2.5 h-2.5" />,
                                      'manage_diamonds': <Gem className="w-2.5 h-2.5" />,
                                      'broadcast_newsletter': <Mail className="w-2.5 h-2.5" />,
                                      'full_access': <Zap className="w-2.5 h-2.5" />,
                                      'view_users': <Users className="w-2.5 h-2.5" />
                                    };
                                    return (
                                      <Badge key={p} variant="secondary" className="text-[8px] px-2 py-0.5 border-border/5 bg-indigo-500/5 font-black uppercase tracking-tighter text-indigo-700/70 border border-indigo-500/20 rounded-md flex items-center gap-1.5 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        {iconMap[p] || <Key className="w-2.5 h-2.5" />}
                                        {p.replace('_', ' ')}
                                      </Badge>
                                    );
                                  })}
                                  {(!member.admin_permissions || member.admin_permissions.length === 0) && <span className="text-[10px] opacity-20 font-bold italic tracking-tight uppercase">Restricted Access</span>}
                                </div>
                                <div className="flex items-center gap-1 justify-end">
                                  <div className="flex items-center gap-1.5 pr-4 border-r border-border/10 mr-3">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-600" onClick={() => { setPreviewUser(member); setPreviewExpanded(true); }} title="Preview">
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-600" onClick={() => setMailModal(member)} title="Mail">
                                      <Mail className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-600" onClick={() => setRewardModal({ ...member, type: 'diamonds' })} title="Reward">
                                      <Gem className="w-3.5 h-3.5" />
                                    </Button>
                                    {!isRoot && (
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-600" onClick={() => { setTeamForm({ email: member.email, permissions: member.admin_permissions || [] }); setTeamModal(member); }} title="Edit">
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 font-bold">
                                    {!isRoot ? (
                                      <>
                                        <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-xl transition-all ${member.is_active_admin ? 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-600' : 'text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600'}`} onClick={() => handleToggleAdminStatus(member.id, member.is_active_admin)} title={member.is_active_admin ? "Revoke" : "Restore"}>
                                          {member.is_active_admin ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => handleAction(member.id, 'ban', member)} title="Ban">
                                          <Ban className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => handleDeleteTeamMember(member.id)} title="Delete">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Badge variant="outline" className="px-3 py-1 text-[8px] font-black uppercase text-amber-600/40 bg-amber-500/[0.02] border border-dashed border-amber-500/20 rounded-xl cursor-not-allowed">Protected Root</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'campaigns' && campaigns?._forbidden && (
                  <div className="py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-[2.5rem] animate-fade-in">
                    <Lock className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Restricted Sector</h3>
                  </div>
                )}

                {activeTab === 'campaigns' && !campaigns?._forbidden && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-extrabold hidden lg:block">Growth & Campaigns</h2>
                      <div className="flex bg-muted/20 p-1 rounded-xl border border-border/10">
                        {['campaigns', 'offers'].map(v => (
                          <Button
                            key={v}
                            variant={campaignView === v ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setCampaignView(v)}
                            className={`rounded-lg text-[10px] font-black uppercase tracking-widest px-4 h-8 ${campaignView === v ? 'bg-background shadow-sm' : 'opacity-40'}`}
                          >
                            {v}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {campaignView === 'campaigns' && !loading && (
                      <div className="space-y-3">
                        <Card className="p-3 sm:p-4 border-indigo-500/20 border bg-indigo-500/[0.03] relative overflow-hidden rounded-[1.5rem]">
                          {/* Digital dot pattern for invitation programme */}
                          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }} />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-500 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
                                <UserCheck className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Invitation Programme</p>
                                  <span className="text-[7px] font-black uppercase tracking-tighter text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Main Referral</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium">Earn diamonds by inviting friends to PlusOneStar</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Switch
                                data-testid="referral-toggle"
                                checked={systemReferralEnabled}
                                onCheckedChange={(checked) => {
                                  setSystemReferralEnabled(checked);
                                  const updatedCharges = { ...platformCharges, system_referral_enabled: checked };
                                  setPlatformCharges(updatedCharges);
                                  handleUpdateEconomy(updatedCharges);
                                }}
                              />
                            </div>
                          </div>
                        </Card>

                        <div className="grid gap-3">
                          <div className="flex items-center justify-between px-2 pt-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Campaign List</h3>
                            <Button size="sm" variant="ghost" onClick={() => setCampaignModal('new')} className="h-7 text-[10px] font-bold text-accent gap-1"><Plus className="w-3 h-3" /> New Campaign</Button>
                          </div>
                          {Array.isArray(campaigns) && campaigns.length === 0 ? (
                            <div className="py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-[2.5rem]">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No custom campaigns active</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto -mx-2 px-2 scrollbar-hide">
                              <div className="divide-y divide-border/10 rounded-2xl border border-border/10 overflow-hidden min-w-[300px]">
                                {Array.isArray(campaigns) && campaigns.map(c => (
                                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/5 transition-colors group">
                                    {/* Icon */}
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.campaign_type === 'invitation' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-accent/10 text-accent'}`}>
                                      {c.campaign_type === 'invitation' ? <UserCheck className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3">
                                        {(c.mobile_banner_url || c.banner_url || c.desktop_banner_url) && (
                                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted/20 shrink-0 border border-border/10">
                                            <img 
                                              src={getMediaUrl(c.mobile_banner_url || c.banner_url || c.desktop_banner_url)} 
                                              className="w-full h-full object-cover" 
                                              alt="" 
                                              onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            {c.npc_image_url && (
                                              <img 
                                                src={getMediaUrl(c.npc_image_url)} 
                                                className="absolute bottom-0 left-0 w-6 h-6 object-contain drop-shadow-sm" 
                                                alt="" 
                                              />
                                            )}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-[12px] tracking-tight truncate max-w-[160px]">{c.title}</h4>
                                            {c.expiry_date ? (
                                              <span className={`text-[8px] font-black uppercase tracking-tighter ${new Date(c.expiry_date) < new Date() ? 'text-rose-500' : 'text-muted-foreground/60'}`}>
                                                {new Date(c.expiry_date) < new Date() ? 'EXPIRED' : `EXP: ${new Date(c.expiry_date).toLocaleDateString()}`}
                                              </span>
                                            ) : (
                                              <Badge className={`text-[7px] h-3.5 px-1 uppercase tracking-tighter ${c.active ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                {c.active ? 'ACTIVE' : 'INACTIVE'}
                                              </Badge>
                                            )}
                                            {c.campaign_type === 'invitation' && (
                                              <span className="text-[7px] font-black uppercase tracking-tighter text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-500/20">Invite</span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[9px] opacity-40 font-bold">Clicks: {c.clicks_count || 0}</span>
                                            {(c.member_count > 0) && <span className="text-[9px] font-bold text-accent/60">👥 {c.member_count} joined</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Controls — always visible, no wrap */}
                                    <div className="flex items-center gap-2 pr-1">
                                      <Switch
                                        data-testid={`campaign-toggle-${c.id}`}
                                        checked={!!c.active}
                                        onCheckedChange={() => handleToggleCampaign(c.id)}
                                        className="scale-[0.6] sm:scale-75"
                                      />
                                      <Button
                                        size="icon" variant="ghost"
                                        className="h-7 w-7 text-accent hover:bg-accent/10"
                                        onClick={() => { setCampaignForm({ ...c }); setCampaignModal(c); }}
                                        title="Edit"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        size="icon" variant="ghost"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                        title="Delete"
                                        onClick={async () => {
                                          if (window.confirm('Delete this campaign?')) {
                                            try {
                                              await axios.delete(`${API}/admin/campaigns/${c.id}`, { headers });
                                              toast.success('Campaign deleted');
                                              fetchData();
                                            } catch (err) {
                                              toast.error('Failed to delete campaign');
                                            }
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        size="icon" variant="ghost"
                                        className="h-7 w-7 opacity-40 hover:opacity-100"
                                        title="Stats"
                                        onClick={() => setStatsModal({
                                          title: c.title,
                                          joins: c.member_count || c.clicks_count || 0,
                                          earnings: (c.benefits_granted_count || 0) * (c.reward_diamonds || 0)
                                        })}
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {campaignView === 'offers' && !loading && (
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => setOfferModal('new')} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"><Plus className="w-3.5 h-3.5" /> Add Offer</Button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          {Array.isArray(offers) && offers.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-muted/20 border border-dashed border-border/40 rounded-2xl">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No promo codes active</p>
                            </div>
                          ) : Array.isArray(offers) && offers.map(o => (
                            <Card key={o.id} className="p-5 border-border/10 flex items-center justify-between group">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {(o.mobile_banner_url || o.banner_url || o.desktop_banner_url) && (
                                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted/20 shrink-0 border border-border/10">
                                    <img 
                                      src={getMediaUrl(o.mobile_banner_url || o.banner_url || o.desktop_banner_url)} 
                                      className="w-full h-full object-cover" 
                                      alt="" 
                                    />
                                    {o.npc_image_url && (
                                      <img 
                                        src={getMediaUrl(o.npc_image_url)} 
                                        className="absolute bottom-0 left-0 w-7 h-7 object-contain drop-shadow-sm" 
                                        alt="" 
                                      />
                                    )}
                                  </div>
                                )}
                                <div className="space-y-1 flex-1 min-w-0">
                                  <h4 className="font-black text-sm tracking-tighter text-emerald-500">{o.title || o.code}</h4>
                                  <p className="text-[10px] font-bold opacity-60 truncate">{o.code} · {o.diamond_reward || 0} diamonds · {o.usage_count || 0} uses</p>
                                  {o.expiry_date && (
                                    <p className="text-[9px] font-bold text-rose-400">Expires: {new Date(o.expiry_date).toLocaleDateString()}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="text-accent/40 group-hover:text-accent" onClick={() => { setOfferModal(o); setOfferForm({ title: o.title || '', description: o.description || '', code: o.code || '', benefit: o.benefit || '', diamond_reward: o.diamond_reward || 0, reward_chat_unlocks: o.reward_chat_unlocks || 0, reward_boost_hours: o.reward_boost_hours || 0, reward_visitor_days: o.reward_visitor_days || 0, reward_subscription_plan: o.reward_subscription_plan || '', reward_filter_days: o.reward_filter_days || 0, reward_booking_limit: o.reward_booking_limit || 0, banner_url: o.banner_url || '', desktop_banner_url: o.desktop_banner_url || '', mobile_banner_url: o.mobile_banner_url || '', npc_image_url: o.npc_image_url || '', video_url: o.video_url || '', active: o.active !== false, expiry_date: o.expiry_date || '', one_time_use: o.one_time_use || false, display_days: o.display_days || 0 }); }}><Pencil className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive/40 group-hover:text-destructive" onClick={() => handleDeleteOffer(o)}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'newsletter' && (
                  <div className="space-y-6 animate-fade-in max-w-2xl">
                    <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold hidden lg:block">Newsletter Broadcast</h2></div>
                    <Card className="p-8 border-border/10 space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Campaign Subject</Label>
                        <Input value={newsletterForm.subject} onChange={(e) => setNewsletterForm({ ...newsletterForm, subject: e.target.value })} placeholder="e.g. Weekly PlusOne Highlights" className="h-12 rounded-xl font-bold bg-muted/20" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Hero Image</Label>
                        <div className="relative h-12">
                          <Input type="file" accept="image/*" onChange={handleNewsletterImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          <div className="absolute inset-0 rounded-xl bg-muted/20 flex items-center justify-center gap-2 border border-dashed border-border/40">
                            {newsletterForm.image_url ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Plus className="w-4 h-4 opacity-40" />}
                            <span className="text-[10px] font-bold opacity-60 truncate px-2">{newsletterForm.image_url ? 'Image Ready' : 'Upload Photo'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Video URL (Optional)</Label>
                        <Input value={newsletterForm.video_url} onChange={e => setNewsletterForm({ ...newsletterForm, video_url: e.target.value })} className="h-10 rounded-xl font-medium bg-muted/20 text-xs" placeholder="https://youtube.com/..." />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Email Content (HTML Supported)</Label>
                        <Textarea value={newsletterForm.content} onChange={(e) => setNewsletterForm({ ...newsletterForm, content: e.target.value })} placeholder="Write your message here..." rows={12} className="resize-none rounded-xl font-medium bg-muted/20 text-xs py-4" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Target Audience</Label>
                        <Select
                          value={newsletterForm.target_audience}
                          onValueChange={v => setNewsletterForm({ ...newsletterForm, target_audience: v })}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none px-4 text-xs font-bold">
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">All Users</SelectItem>
                            <SelectItem value="verified">Verified Only</SelectItem>
                            <SelectItem value="unverified">Unverified Only</SelectItem>
                            <SelectItem value="paid">Paid Members Only</SelectItem>
                            <SelectItem value="free">Free Users Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleSendNewsletter} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-2 shadow-lg shadow-indigo-600/20">
                        <Send className="w-3.5 h-3.5" /> Dispatch Broadcast
                      </Button>
                    </Card>
                  </div>
                )}

                {activeTab === 'economy' && (
                  <div className="space-y-8 animate-fade-in pb-10">
                    <div className="flex items-center justify-between sticky top-14 md:top-0 bg-background/95 backdrop-blur-md z-30 py-4 -mx-1 px-1 border-b border-border/5">
                      <h2 className="text-xl font-black uppercase tracking-tighter hidden lg:block">Platform <span className="text-accent">Economy</span></h2>
                      <Button onClick={() => handleUpdateEconomy()} disabled={savingSettings} className="bg-accent hover:bg-accent/90 text-white gap-2 h-10 px-6 rounded-xl font-bold shadow-lg shadow-accent/20">
                        {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Sync Economy
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Taxation & Global Fees */}
                      <Card className="border-border/10 overflow-hidden rounded-2xl shadow-xl shadow-muted/20">
                        <CardHeader className="bg-muted/30 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><DollarSign className="w-5 h-5" /></div>
                            <div>
                              <CardTitle className="text-sm font-black uppercase tracking-widest">Taxation & Global Fees</CardTitle>
                              <CardDescription className="text-[10px] font-bold">Manage GST and transaction charges</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GST Rate (%)</Label>
                              <div className="relative">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                <Input type="number" value={platformCharges.gst_percentage} onChange={e => setPlatformCharges({ ...platformCharges, gst_percentage: parseFloat(e.target.value) })} className="pl-12 h-14 rounded-2xl font-black text-lg bg-muted/20 border-none" />
                              </div>
                              <p className="text-[9px] text-muted-foreground font-medium px-1">Applied globally to all paid plans and diamond packs.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Lifetime Membership Cap */}
                      <Card className="border-border/10 overflow-hidden rounded-2xl shadow-xl shadow-muted/20">
                        <CardHeader className="bg-amber-500/5 pb-4 border-b border-amber-500/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500"><Crown className="w-5 h-5" /></div>
                            <div>
                              <CardTitle className="text-sm font-black uppercase tracking-widest">Lifetime membership</CardTitle>
                              <CardDescription className="text-[10px] font-bold">Exclusivity and user caps</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                          <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-600">Enable Lifetime Plan</Label>
                                <p className="text-[9px] text-muted-foreground font-medium">Toggle visibility globally</p>
                              </div>
                              <Switch checked={platformCharges.lifetime_plan_enabled} onCheckedChange={val => setPlatformCharges({ ...platformCharges, lifetime_plan_enabled: val })} />
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-end px-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membership Cap</Label>
                                <span className="text-xl font-black">{platformCharges.lifetime_users_count || 0} / {platformCharges.lifetime_max_members || 100}</span>
                              </div>
                              <div className="h-4 bg-muted/30 rounded-full overflow-hidden border border-border/5">
                                <div
                                  className={`h-full transition-all duration-1000 ${(platformCharges.lifetime_users_count || 0) >= (platformCharges.lifetime_max_members || 100) ? 'bg-rose-500' : 'bg-amber-500'}`}
                                  style={{ width: `${Math.min(100, ((platformCharges.lifetime_users_count || 0) / (platformCharges.lifetime_max_members || 100)) * 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">Set New Cap</Label>
                                <Input type="number" value={platformCharges.lifetime_max_members} onChange={e => setPlatformCharges({ ...platformCharges, lifetime_max_members: parseInt(e.target.value) || 0 })} className="w-32 h-10 text-right bg-transparent border-none font-black text-lg focus-visible:ring-0" />
                              </div>
                            </div>

                            {(platformCharges.lifetime_users_count || 0) >= (platformCharges.lifetime_max_members || 100) && (
                              <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600">
                                <AlertTriangle className="w-5 h-5 animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-tight">Cap Reached! Lifetime plan is now hidden.</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Free Trial Dynamics */}
                      <Card className="border-border/10 overflow-hidden rounded-[2.5rem] shadow-xl shadow-muted/20">
                        <CardHeader className="bg-blue-500/5 pb-4 border-b border-blue-500/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Clock className="w-5 h-5" /></div>
                            <div>
                              <CardTitle className="text-sm font-black uppercase tracking-widest">Free Trial Dynamics</CardTitle>
                              <CardDescription className="text-[10px] font-bold">New user onboarding flow</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                          <div className="flex items-center justify-between p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600">Enable Auto-Trial</Label>
                              <p className="text-[9px] text-muted-foreground font-medium">Grant trial on first login</p>
                            </div>
                            <Switch checked={platformCharges.free_trial_enabled} onCheckedChange={val => setPlatformCharges({ ...platformCharges, free_trial_enabled: val })} />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Default Trial Days</Label>
                            <div className="relative">
                              <History className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                              <Input type="number" value={platformCharges.trial_days_default} onChange={e => setPlatformCharges({ ...platformCharges, trial_days_default: parseInt(e.target.value) || 0 })} className="pl-12 h-14 rounded-2xl font-black text-lg bg-muted/20 border-none" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'data_backup' && (
                  <DataBackupTab headers={headers} API={API} />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Add-on Management Modal */}
      <Dialog open={addonModal !== null} onOpenChange={(open) => !open && setAddonModal(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-border/10 max-h-[90vh] overflow-y-auto">
          <div className="bg-pink-500 p-8 text-white relative">
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {addonModal === 'new' ? 'New' : 'Edit'} {activeAddonType} Config
            </h2>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Configure diamond-based platform feature</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Configuration Name</Label>
                <Input value={addonForm.name} onChange={e => setAddonForm({ ...addonForm, name: e.target.value })} placeholder="e.g. Basic Pack" className="h-12 rounded-xl font-bold bg-muted/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cost (Diamonds)</Label>
                  <Input type="number" value={addonForm.cost} onChange={e => setAddonForm({ ...addonForm, cost: parseInt(e.target.value) })} className="h-12 rounded-xl font-bold bg-muted/20" />
                </div>

                {activeAddonType === 'chat' ? (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unlocks Count</Label>
                    <Input type="number" value={addonForm.unlocks_count} onChange={e => setAddonForm({ ...addonForm, unlocks_count: parseInt(e.target.value) })} className="h-12 rounded-xl font-bold bg-muted/20" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Duration (Days)</Label>
                    <Input type="number" value={addonForm.duration} onChange={e => setAddonForm({ ...addonForm, duration: parseInt(e.target.value) })} className="h-12 rounded-xl font-bold bg-muted/20" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Offer Percentage (%)</Label>
                <Input
                  type="number"
                  value={addonForm.offer_percentage || ""}
                  onChange={e => {
                    const pct = parseInt(e.target.value) || 0;
                    setAddonForm({ ...addonForm, offer_percentage: pct });
                  }}
                  placeholder="e.g. 20"
                  className="h-12 rounded-xl font-bold bg-muted/20"
                />
              </div>

              <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-pink-500 tracking-widest">Effective Price</p>
                  <p className="text-xl font-black flex items-center gap-2"><Gem className="w-5 h-5" /> {addonForm.cost}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground line-through opacity-50">Was {addonForm.original_price}</p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Saving {addonForm.original_price - addonForm.cost} Gems</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-muted/10 p-4 rounded-xl border border-border/10">
                <Switch checked={addonForm.is_offer} onCheckedChange={val => setAddonForm({ ...addonForm, is_offer: val })} />
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display as "Special Offer"</Label>
              </div>

              {activeAddonType === 'chat' && (
                <p className="text-[10px] text-muted-foreground font-bold px-1">Sets how many chats a user can unlock with these diamonds.</p>
              )}
              {activeAddonType === 'visitors' && (
                <p className="text-[10px] text-muted-foreground font-bold px-1">Sets how many days of visitor insights are granted.</p>
              )}
            </div>
            <Button onClick={handleAddAddon} disabled={savingSettings} size="lg" className="w-full bg-pink-500 hover:bg-pink-600 h-14 rounded-2xl font-bold uppercase tracking-widest gap-2 shadow-xl shadow-pink-500/20">
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : (addonModal === 'new' ? 'Save Configuration' : 'Sync Changes')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Boost Management Modal */}
      <Dialog open={boostModal !== null} onOpenChange={(open) => !open && setBoostModal(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-border/10 max-h-[90vh] overflow-y-auto">
          <div className="bg-pink-500 p-8 text-white relative">
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {boostModal === 'new' ? 'New' : 'Edit'} Boost Plan
            </h2>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Configure profile promotion logic</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan Name</Label>
                <Input value={boostForm.name} onChange={e => setBoostForm({ ...boostForm, name: e.target.value })} placeholder="e.g. Power Boost" className="h-12 rounded-xl font-bold bg-muted/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cost (Diamonds)</Label>
                  <Input type="number" value={boostForm.price} onChange={e => setBoostForm({ ...boostForm, price: parseInt(e.target.value) })} className="h-12 rounded-xl font-bold bg-muted/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Duration</Label>
                  <Select value={boostForm.duration} onValueChange={v => setBoostForm({ ...boostForm, duration: v })}>
                    <SelectTrigger className="h-12 rounded-2xl font-bold bg-muted/20 border-border/5">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">1 Hour</SelectItem>
                      <SelectItem value="daily">24 Hours</SelectItem>
                      <SelectItem value="2days">48 Hours</SelectItem>
                      <SelectItem value="weekly">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Offer Percentage (%)</Label>
                <Input
                  type="number"
                  value={boostForm.offer_percentage || ""}
                  onChange={e => {
                    const pct = parseInt(e.target.value) || 0;
                    setBoostForm({ ...boostForm, offer_percentage: pct });
                  }}
                  placeholder="e.g. 20"
                  className="h-12 rounded-xl font-bold bg-muted/20"
                />
              </div>

              <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-pink-500 tracking-widest">Final Price</p>
                  <p className="text-xl font-black flex items-center gap-2"><Gem className="w-5 h-5" /> {boostForm.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground line-through opacity-50">Was {boostForm.original_price}</p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Saving {boostForm.original_price - boostForm.price} Gems</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-muted/10 p-4 rounded-xl border border-border/10">
                <Switch checked={boostForm.is_offer} onCheckedChange={val => setBoostForm({ ...boostForm, is_offer: val })} />
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Show Special Offer Tag</Label>
              </div>
            </div>
            <Button onClick={handleAddBoost} disabled={savingSettings} size="lg" className="w-full bg-pink-500 hover:bg-pink-600 h-14 rounded-2xl font-bold uppercase tracking-widest gap-2 shadow-xl shadow-pink-500/20">
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : (boostModal === 'new' ? 'Save Boost Plan' : 'Sync Boost Settings')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* Reward Modal */}
      <Dialog open={!!rewardModal} onOpenChange={(open) => !open && setRewardModal(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto pb-16 rounded-[2.5rem] border-none shadow-2xl">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 shadow-xl shadow-pink-500/10"><Gift className="w-7 h-7" /></div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Reward <span className="text-pink-500">User</span></h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Rewarding: {rewardModal?.name}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-1 bg-muted/40 rounded-2xl border border-border/10 mb-4">
              <Button
                variant={rewardForm.action === 'give' ? 'default' : 'ghost'}
                onClick={() => setRewardForm({ ...rewardForm, action: 'give' })}
                className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest h-10"
              >Give</Button>
              <Button
                variant={rewardForm.action === 'take' ? 'destructive' : 'ghost'}
                onClick={() => setRewardForm({ ...rewardForm, action: 'take' })}
                className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest h-10"
              >Take Back</Button>
            </div>

            <VisuallyHidden>
              <DialogTitle>{rewardForm.action === 'give' ? 'Reward' : 'Deduct from'} User {rewardModal?.name}</DialogTitle>
              <DialogDescription>Adjust user's diamond balance or grant subscription plans.</DialogDescription>
            </VisuallyHidden>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reward Type</Label>
                <Select
                  value={rewardForm.type}
                  onValueChange={(v) => setRewardForm({ ...rewardForm, type: v })}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none px-4 text-xs font-bold">
                    <SelectValue placeholder="Select reward type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diamonds">Diamonds</SelectItem>
                    <SelectItem value="plan">Subscription Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {rewardForm.type === 'diamonds' ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{rewardForm.action === 'give' ? 'Amount to Give' : 'Amount to Deduct'}</Label>
                    <div className="relative">
                      <Gem className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${rewardForm.action === 'give' ? 'text-pink-500' : 'text-rose-600'}`} />
                      <Input
                        type="number"
                        value={rewardForm.amount}
                        onChange={(e) => setRewardForm({ ...rewardForm, amount: e.target.value })}
                        className={`pl-10 h-14 rounded-xl font-black bg-muted/20 text-xl ${rewardForm.action === 'take' ? 'text-rose-600 focus-visible:ring-rose-500/20' : 'text-pink-500 focus-visible:ring-pink-500/20'}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reason / Description</Label>
                    <Textarea
                      value={rewardForm.message}
                      onChange={(e) => setRewardForm({ ...rewardForm, message: e.target.value })}
                      placeholder="Briefly describe why this reward is being given/taken..."
                      className="rounded-xl bg-muted/20 border-none min-h-[80px] text-xs font-medium py-3"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Plan</Label>
                  <Select
                    value={rewardForm.plan_id}
                    onValueChange={(v) => setRewardForm({ ...rewardForm, plan_id: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none px-4 text-xs font-bold">
                      <SelectValue placeholder="Select Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p, idx) => (
                        <SelectItem key={p.id || `plan-${idx}`} value={p.id || p.duration}>
                          {p.name} - ₹{p.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button
              onClick={handleGrantReward}
              disabled={granting}
              className={`w-full sticky bottom-0 mt-4 h-14 rounded-2xl font-black text-sm shadow-xl transition-all ${rewardForm.action === 'take' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-500/20'}`}
            >
              {granting ? <Loader2 className="w-5 h-5 animate-spin" /> : rewardForm.action === 'give' ? 'Confirm Delivery' : 'Confirm Deduction'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Free Trial Modal */}
      <Dialog open={!!trialModal} onOpenChange={(open) => !open && setTrialModal(null)}>
        <DialogContent className="max-w-sm rounded-[2.5rem] border-none shadow-2xl p-8 space-y-6 bg-background">
          <VisuallyHidden>
            <DialogTitle>Manage Trial</DialogTitle>
            <DialogDescription>Adjust properties of the user's free trial.</DialogDescription>
          </VisuallyHidden>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10"><Clock className="w-6 h-6" /></div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Free <span className="text-emerald-500">Trial</span></h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{trialModal?.name}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1 rounded-2xl border border-border/10">
              <Button onClick={() => setTrialForm({ ...trialForm, action: 'grant' })} variant={trialForm.action === 'grant' ? 'default' : 'ghost'} className={`h-10 text-[9px] font-black uppercase tracking-widest rounded-xl ${trialForm.action === 'grant' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : ''}`}>Grant New</Button>
              <Button onClick={() => setTrialForm({ ...trialForm, action: 'cancel' })} variant={trialForm.action === 'cancel' ? 'destructive' : 'ghost'} className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl">Remove</Button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1 rounded-2xl border border-border/10">
              <Button onClick={() => setTrialForm({ ...trialForm, action: 'add_days' })} variant={trialForm.action === 'add_days' ? 'default' : 'ghost'} className={`h-10 text-[9px] font-black uppercase tracking-widest rounded-xl ${trialForm.action === 'add_days' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' : ''}`}>+ Add Days</Button>
              <Button onClick={() => setTrialForm({ ...trialForm, action: 'remove_days' })} variant={trialForm.action === 'remove_days' ? 'destructive' : 'ghost'} className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl">- Deduct Days</Button>
            </div>

            {trialForm.action !== 'cancel' && (
              <div className="space-y-2 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Number of Days</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={trialForm.days}
                    onChange={(e) => setTrialForm({ ...trialForm, days: e.target.value })}
                    className="pl-4 h-14 rounded-xl font-black bg-muted/20 text-xl focus-visible:ring-emerald-500/20"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground uppercase">Days</div>
                </div>
              </div>
            )}

            {trialForm.action === 'grant' && (
              <div className="space-y-2 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trial Access Type</Label>
                <div className="grid grid-cols-3 gap-2 bg-muted/40 p-1 rounded-2xl border border-border/10">
                  <Button
                    onClick={() => setTrialForm({ ...trialForm, trial_type: 'customer' })}
                    variant={trialForm.trial_type === 'customer' ? 'default' : 'ghost'}
                    className={`h-10 text-[8px] font-black uppercase tracking-widest rounded-xl ${trialForm.trial_type === 'customer' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' : ''}`}
                  >Finder Only</Button>
                  <Button
                    onClick={() => setTrialForm({ ...trialForm, trial_type: 'companion' })}
                    variant={trialForm.trial_type === 'companion' ? 'default' : 'ghost'}
                    className={`h-10 text-[8px] font-black uppercase tracking-widest rounded-xl ${trialForm.trial_type === 'companion' ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20' : ''}`}
                  >Companion</Button>
                  <Button
                    onClick={() => setTrialForm({ ...trialForm, trial_type: 'both' })}
                    variant={trialForm.trial_type === 'both' ? 'default' : 'ghost'}
                    className={`h-10 text-[8px] font-black uppercase tracking-widest rounded-xl ${trialForm.trial_type === 'both' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : ''}`}
                  >Full Access</Button>
                </div>
                <p className="text-[9px] text-muted-foreground px-1">
                  {trialForm.trial_type === 'customer' ? '🔍 Companion Finder — Browse & book companions' : trialForm.trial_type === 'companion' ? '🌟 Be a Companion — List profile & accept bookings' : '✅ Full Access — Both Finder & Companion features'}
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleManageTrial}
            disabled={managingTrial}
            className={`w-full h-14 rounded-2xl font-black text-sm transition-all shadow-xl ${['grant', 'add_days'].includes(trialForm.action) ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 text-white'}`}
          >
            {managingTrial ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Execute Action'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Word Delete Confirmation Modal */}
      <Dialog open={!!wordToDelete} onOpenChange={(open) => !open && setWordToDelete(null)}>
        <DialogContent className="max-w-xs rounded-2xl border-none shadow-2xl p-6 text-center space-y-6">
          <VisuallyHidden>
            <DialogTitle>Unblock Word</DialogTitle>
            <DialogDescription>Confirm removal of a word from the restricted list.</DialogDescription>
          </VisuallyHidden>
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg">Unblock Word?</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">"{wordToDelete}"</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setWordToDelete(null)} className="rounded-xl font-bold h-12">Cancel</Button>
            <Button
              variant="destructive"
              className="rounded-xl font-bold h-12 shadow-lg shadow-destructive/20"
              onClick={() => {
                setBlockedWords(prev => prev.filter(w => w !== wordToDelete));
                setWordToDelete(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Mail Modal (RESTORED) */}
      <Dialog open={!!mailModal} onOpenChange={(open) => !open && setMailModal(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-background/95 backdrop-blur-3xl">
          <VisuallyHidden>
            <DialogTitle>Direct Message</DialogTitle>
            <DialogDescription>Send an official communication to the user.</DialogDescription>
          </VisuallyHidden>
          <VisuallyHidden>
            <DialogTitle>Send Email to {mailModal?.name}</DialogTitle>
            <DialogDescription>Direct message to {mailModal?.name} ({mailModal?.email})</DialogDescription>
          </VisuallyHidden>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Direct Message</h2>
                  <p className="text-xs text-muted-foreground">Sending to {mailModal?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sender Name</Label>
                  <Input
                    placeholder="PlusOneStar Team"
                    value={mailForm.from_name}
                    onChange={(e) => setMailForm({ ...mailForm, from_name: e.target.value })}
                    className="rounded-xl bg-muted/20 border-none h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject</Label>
                  <Input
                    placeholder="Policy update, Gift received, etc."
                    value={mailForm.subject}
                    onChange={(e) => setMailForm({ ...mailForm, subject: e.target.value })}
                    className="rounded-xl bg-muted/20 border-none h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message Body</Label>
                  <Textarea
                    placeholder="Type your message here..."
                    className="min-h-[150px] rounded-2xl bg-muted/20 border-none resize-none p-4"
                    value={mailForm.message}
                    onChange={(e) => setMailForm({ ...mailForm, message: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setMailModal(null)}>Cancel</Button>
                <Button
                  className="flex-[2] h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 font-black shadow-lg shadow-pink-500/20"
                  onClick={handleSendMail}
                  disabled={mailLoading}
                >
                  {mailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Official Mail'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Subscription Plan Modal (RESTORED & ENHANCED) */}
      <Dialog open={!!planModal} onOpenChange={(open) => !open && setPlanModal(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto pb-16 rounded-[2.5rem] border-none shadow-2xl p-8 space-y-6">
          <VisuallyHidden>
            <DialogTitle>{planModal === 'new' ? 'Create' : 'Edit'} Plan</DialogTitle>
            <DialogDescription>Configure subscription tier details and pricing.</DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Layers className="w-7 h-7" /></div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{planModal === 'new' ? 'Create' : 'Edit'} <span className="text-accent">Subscription Plan</span></h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{planModal === 'new' ? 'Define a new tier' : `ID: ${planModal?.id || planModal?.duration}`}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan Name</Label>
              <Input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Gold Access" className="h-12 rounded-xl font-bold bg-muted/20" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan Type Segment</Label>
              <select
                value={planForm.plan_type || 'companion'}
                onChange={e => setPlanForm({ ...planForm, plan_type: e.target.value })}
                className="w-full h-12 rounded-xl border border-transparent bg-muted/20 px-3 text-xs font-bold outline-none ring-offset-background focus:ring-2 focus:ring-accent"
              >
                <option value="companion">Be Companion (Member)</option>
                <option value="customer">Find Companion (Finder)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price ({platformCharges.currency_symbol})</Label>
              <Input type="number" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })} className="h-12 rounded-xl font-bold bg-muted/20" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Offer Percentage (%)</Label>
              <Input
                type="number"
                value={planForm.offer_percentage || ""}
                onChange={e => {
                  const pct = parseInt(e.target.value) || 0;
                  setPlanForm({ ...planForm, offer_percentage: pct });
                }}
                placeholder="e.g. 20"
                className="h-12 rounded-xl font-bold bg-muted/20"
              />
            </div>
            <div className="flex items-center gap-3 bg-muted/10 p-4 rounded-xl border border-border/10 col-span-2">
              <Switch checked={planForm.is_offer} onCheckedChange={val => setPlanForm({ ...planForm, is_offer: val })} />
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mark Plan as "Special Offer"</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Duration</Label>
              <Select
                value={planForm.duration}
                onValueChange={val => {
                  let days = 30;
                  if (val === '2_months') days = 60;
                  if (val === '3_months') days = 90;
                  if (val === '4_months') days = 120;
                  if (val === '6_months') days = 180;
                  if (val === '1_year') days = 365;
                  if (val === 'lifetime') days = 9999;
                  setPlanForm({ ...planForm, duration: val, duration_days: days });
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none px-4 text-xs font-bold">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_month">1 Month</SelectItem>
                  <SelectItem value="2_months">2 Months</SelectItem>
                  <SelectItem value="3_months">3 Months</SelectItem>
                  <SelectItem value="4_months">4 Months</SelectItem>
                  <SelectItem value="6_months">6 Months</SelectItem>
                  <SelectItem value="1_year">1 Year</SelectItem>
                  <SelectItem value="lifetime">Lifetime Access</SelectItem>
                  <SelectItem value="custom">Custom Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Duration Days</Label>
              <Input
                type="number"
                value={planForm.duration_days}
                onChange={e => setPlanForm({ ...planForm, duration_days: e.target.value })}
                disabled={planForm.duration === 'lifetime'}
                className="h-12 rounded-xl font-bold bg-muted/20 disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Special Offer Tag</Label>
              <Input value={planForm.offers} onChange={e => setPlanForm({ ...planForm, offers: e.target.value })} placeholder="e.g. 20% OFF" className="h-12 rounded-xl font-bold bg-muted/20" />
            </div>
          </div>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/10">
              <div className="space-y-0.5">
                <p className="text-xs font-black">Filter Access</p>
                <p className="text-[9px] text-muted-foreground">Allow user to use advanced search filters</p>
              </div>
              <Switch
                checked={planForm.features?.filter_access}
                onCheckedChange={val => setPlanForm({ ...planForm, features: { ...planForm.features, filter_access: val } })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/10">
              <div className="space-y-0.5">
                <p className="text-xs font-black">Chat Enabled</p>
                <p className="text-[9px] text-muted-foreground">Allow user to initiate chats</p>
              </div>
              <Switch
                checked={planForm.features?.chat_enabled}
                onCheckedChange={val => setPlanForm({ ...planForm, features: { ...planForm.features, chat_enabled: val } })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/10">
              <div className="space-y-0.5">
                <p className="text-xs font-black">Video Call Enabled</p>
                <p className="text-[9px] text-muted-foreground">Allow user to initiate video calls</p>
              </div>
              <Switch
                checked={planForm.features?.video_call_enabled}
                onCheckedChange={val => setPlanForm({ ...planForm, features: { ...planForm.features, video_call_enabled: val } })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/10">
              <div className="space-y-0.5">
                <p className="text-xs font-black">Advanced Features</p>
                <p className="text-[9px] text-muted-foreground">Unlock priority support and VIP badges</p>
              </div>
              <Switch
                checked={planForm.features?.advanced_features}
                onCheckedChange={val => setPlanForm({ ...planForm, features: { ...planForm.features, advanced_features: val } })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/10">
              <div className="space-y-0.5">
                <p className="text-xs font-black">Visitor Insight Access</p>
                <p className="text-[9px] text-muted-foreground">Allow user to see profile visitors</p>
              </div>
              <Switch
                checked={planForm.features?.visitor_insight_access}
                onCheckedChange={val => setPlanForm({ ...planForm, features: { ...planForm.features, visitor_insight_access: val } })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/10">
              <div className="space-y-0.5">
                <p className="text-xs font-black">PAP Badges</p>
                <p className="text-[9px] text-muted-foreground">Show premium badges on profile</p>
              </div>
              <Switch
                checked={planForm.features?.pap_badges}
                onCheckedChange={val => setPlanForm({ ...planForm, features: { ...planForm.features, pap_badges: val } })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chat Unlocks Balance</Label>
                <Input
                  type="number"
                  value={planForm.features?.chat_unlock_limit || 0}
                  onChange={e => setPlanForm({ ...planForm, features: { ...planForm.features, chat_unlock_limit: parseInt(e.target.value) } })}
                  className="h-12 rounded-xl font-bold bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Boost Hours Balance</Label>
                <Input
                  type="number"
                  value={planForm.features?.boost_hours || 0}
                  onChange={e => setPlanForm({ ...planForm, features: { ...planForm.features, boost_hours: parseInt(e.target.value) } })}
                  className="h-12 rounded-xl font-bold bg-muted/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/10">
              <div className="space-y-0.5">
                <p className="text-xs font-black">Auto-Renew Subscription</p>
                <p className="text-[9px] text-muted-foreground">Automatically charge recurring payments</p>
              </div>
              <Switch
                checked={planForm.autopay}
                onCheckedChange={val => setPlanForm({ ...planForm, autopay: val })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max Bookings / Day</Label>
                <Input
                  type="number"
                  value={planForm.features?.max_bookings_per_day || 0}
                  onChange={e => setPlanForm({ ...planForm, features: { ...planForm.features, max_bookings_per_day: parseInt(e.target.value) } })}
                  className="h-12 rounded-xl font-bold bg-muted/20"
                />
                <p className="text-[9px] text-muted-foreground px-1">Set to -1 for unlimited bookings.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Diamond Bonus</Label>
                  <Input
                    type="number"
                    value={planForm.diamond_bonus || 0}
                    onChange={e => setPlanForm({ ...planForm, diamond_bonus: parseInt(e.target.value) })}
                    className="h-12 rounded-xl font-bold bg-muted/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan Rating (User View)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={planForm.rating || 0}
                    onChange={e => setPlanForm({ ...planForm, rating: parseFloat(e.target.value) })}
                    className="h-12 rounded-xl font-bold bg-muted/20"
                  />
                </div>
              </div>
            </div>
          </div>
          <Button onClick={handleSavePlan} className="w-full sticky bottom-0 mt-4 h-14 rounded-2xl bg-accent hover:bg-accent/90 font-black text-sm shadow-xl shadow-accent/20">
            {planModal === 'new' ? 'Build Plan' : 'Update Subscription'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Diamond Pack Modal (NEW) */}
      <Dialog open={diamondPackModal !== null} onOpenChange={(open) => !open && setDiamondPackModal(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>{diamondPackModal === 'new' ? 'Create' : 'Edit'} Diamond Pack</DialogTitle>
            <DialogDescription>Configure diamond count, pricing, and promotional offers.</DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 shadow-xl shadow-pink-500/10"><Gem className="w-7 h-7" /></div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{diamondPackModal === 'new' ? 'Create' : 'Edit'} <span className="text-pink-500">Diamond Pack</span></h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Inventory Management</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Diamonds</Label>
                <Input type="number" value={diamondPackForm.count} onChange={e => setDiamondPackForm({ ...diamondPackForm, count: parseInt(e.target.value) })} className="h-12 rounded-xl font-bold bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Offer Price ({platformCharges.currency_symbol})</Label>
                <Input type="number" value={diamondPackForm.price} onChange={e => setDiamondPackForm({ ...diamondPackForm, price: e.target.value })} className="h-12 rounded-xl font-bold bg-muted/20" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Promo Offer Text</Label>
              <Input value={diamondPackForm.offers} onChange={e => setDiamondPackForm({ ...diamondPackForm, offers: e.target.value })} placeholder="e.g. Best Seller, Recommended" className="h-12 rounded-xl font-bold bg-muted/20" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Offer %</Label>
              <Input
                type="number"
                value={diamondPackForm.offer_percentage || ""}
                onChange={e => {
                  const pct = parseInt(e.target.value) || 0;
                  setDiamondPackForm({ ...diamondPackForm, offer_percentage: pct });
                }}
                placeholder="e.g. 20"
                className="h-12 rounded-xl font-bold bg-muted/20"
              />
            </div>
            <div className="flex items-center gap-3 bg-muted/10 p-4 rounded-xl border border-border/10 col-span-2">
              <Switch checked={diamondPackForm.is_offer} onCheckedChange={val => setDiamondPackForm({ ...diamondPackForm, is_offer: val })} />
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mark as Promotional Offer</Label>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/10 border border-border/10">
              <Switch checked={diamondPackForm.popular} onCheckedChange={val => setDiamondPackForm({ ...diamondPackForm, popular: val })} />
              <div>
                <p className="text-xs font-black">Mark as Popular</p>
                <p className="text-[9px] text-muted-foreground">Adds a highlighted badge and distinctive styling</p>
              </div>
            </div>
          </div>
          <Button onClick={handleSaveDiamondPack} className="w-full h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 font-black text-sm shadow-xl shadow-pink-500/20">
            {diamondPackModal === 'new' ? 'Create Package' : 'Sync Package Changes'}
          </Button>
        </DialogContent>
      </Dialog>
      {/* Campaign Management Modal */}
      <Dialog open={!!campaignModal} onOpenChange={(open) => !open && setCampaignModal(null)}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[2rem] sm:rounded-[3rem] border-none shadow-2xl p-4 sm:p-8 space-y-4 sm:space-y-6">
          <VisuallyHidden>
            <DialogTitle>Manage Campaign</DialogTitle>
            <DialogDescription>Create or edit growth campaigns and rewards.</DialogDescription>
          </VisuallyHidden>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0"><Megaphone className="w-5 h-5 sm:w-7 sm:h-7" /></div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-black tracking-tight truncate">{campaignModal === 'new' ? 'Create' : 'Edit'} <span className="text-accent">Campaign</span></h2>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Growth Engine</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-muted/20 px-4 py-3 rounded-2xl border border-border/10">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Campaign Visibility</p>
                <p className="text-[9px] text-muted-foreground/60 font-medium">Toggle global activation status</p>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="camp-active" className="text-[10px] font-black uppercase tracking-widest text-accent">Active</Label>
                <Switch id="camp-active" checked={campaignForm.active} onCheckedChange={val => setCampaignForm({ ...campaignForm, active: val })} />
              </div>
            </div>
          </div>

          {/* Campaign Type Selector */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Campaign Type</Label>
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
              {[
                { value: 'invitation', label: 'Invitation Programme', icon: '✉', color: 'indigo' },
                { value: 'reward', label: 'Reward Campaign', icon: '💎', color: 'amber' },
                { value: 'general', label: 'General Campaign', icon: '⚡', color: 'accent' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCampaignForm({ ...campaignForm, campaign_type: opt.value })}
                  className={`relative overflow-hidden px-3 py-3 rounded-2xl border-2 text-left transition-all ${campaignForm.campaign_type === opt.value
                    ? opt.value === 'invitation' ? 'border-indigo-500 bg-indigo-500/10'
                      : opt.value === 'reward' ? 'border-amber-500 bg-amber-500/10'
                        : 'border-accent bg-accent/10'
                    : 'border-border/20 bg-muted/10 opacity-50 hover:opacity-80'
                    }`}
                >
                  {opt.value === 'invitation' && campaignForm.campaign_type === 'invitation' && (
                    <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
                      style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1.5px, transparent 1.5px)', backgroundSize: '8px 8px' }} />
                  )}
                  <div className="relative z-10">
                    <p className="text-xs font-black tracking-tight">{opt.label}</p>
                    <p className="text-[9px] text-muted-foreground font-medium mt-0.5">
                      {opt.value === 'invitation' ? 'Invite & earn rewards'
                        : opt.value === 'reward' ? 'Diamond-based rewards'
                          : 'Custom promotion'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {!campaignModal === 'new' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Total Clicks</p>
                <p className="text-xl font-black">{campaignModal.clicks_count || 0}</p>
              </div>
              <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Benefits Granted</p>
                <p className="text-xl font-black">{campaignModal.benefits_granted_count || 0}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="camp-title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Campaign Title</Label>
                <Input id="camp-title" name="camp-title" value={campaignForm.title} onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })} className="h-12 rounded-xl font-bold bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-reward" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Diamond Reward</Label>
                <Input id="camp-reward" name="camp-reward" type="number" value={campaignForm.reward_diamonds} onChange={e => setCampaignForm({ ...campaignForm, reward_diamonds: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl font-bold bg-muted/20" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="camp-desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Public Description</Label>
              <Textarea id="camp-desc" name="camp-desc" value={campaignForm.description} onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={6} className="rounded-xl font-medium bg-muted/20 text-xs py-3" placeholder="Explain the campaign to users..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="camp-rules" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rules / Terms</Label>
              <Textarea id="camp-rules" name="camp-rules" value={campaignForm.rules} onChange={e => setCampaignForm({ ...campaignForm, rules: e.target.value })} rows={6} className="rounded-xl font-medium bg-muted/20 text-xs py-3" placeholder="Enter terms and conditions..." />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Campaign Visuals (Desktop & Mobile)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Desktop Banner */}
                <div className="space-y-2 p-4 bg-muted/10 rounded-2xl border border-border/10">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="camp-banner-pc" className="text-[9px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                      <Monitor className="w-3 h-3" /> Desktop Banner
                    </Label>
                    {campaignForm.desktop_banner_url && <Badge variant="outline" className="text-[7px] bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Uploaded</Badge>}
                  </div>
                  <div className="relative group">
                    <Input id="camp-banner-pc" type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBannerPreviews(prev => ({ ...prev, desktop: reader.result }));
                      };
                      reader.readAsDataURL(file);

                      const fd = new FormData(); fd.append('file', file);
                      try {
                        const res = await axios.post(`${API}/upload`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
                        setCampaignForm(prev => ({ ...prev, desktop_banner_url: res.data.url, banner_url: res.data.url }));
                        toast.success('Campaign Banner synced');
                      } catch {
                        toast.error('Upload failed');
                        setBannerPreviews(prev => ({ ...prev, desktop: '' }));
                      } finally {
                        setIsUploading(false);
                      }
                    }} />
                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-12 rounded-xl border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 text-indigo-600 font-bold transition-all"
                    >
                      <label htmlFor="camp-banner-pc" className="cursor-pointer flex items-center justify-center gap-2">
                        <CloudUpload className="w-4 h-4" />
                        <span>Select Desktop Banner</span>
                      </label>
                    </Button>
                  </div>
                  {bannerPreviews.desktop && (
                    <div className="mt-2 relative group rounded-xl overflow-hidden border border-border/20 aspect-video bg-muted/30 shadow-inner">
                      <img
                        src={getMediaUrl(bannerPreviews.desktop)}
                        alt="Desktop Preview"
                        className="w-full h-full object-cover transition-opacity duration-700"
                        onLoad={(e) => { e.target.style.opacity = 1; }}
                        style={{ opacity: 0 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center -z-10 bg-muted/10">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500/30" />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                        <Button size="sm" variant="ghost" className="text-white text-[9px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20" onClick={() => { setCampaignForm({ ...campaignForm, desktop_banner_url: '', banner_url: '' }); setBannerPreviews(prev => ({ ...prev, desktop: '' })); }}>Remove Asset</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Banner */}
                <div className="space-y-2 p-4 bg-muted/10 rounded-2xl border border-border/10">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="camp-banner-mob" className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                      <Smartphone className="w-3 h-3" /> Mobile Banner
                    </Label>
                    {campaignForm.mobile_banner_url && <Badge variant="outline" className="text-[7px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Uploaded</Badge>}
                  </div>
                  <div className="relative group">
                    <Input id="camp-banner-mob" type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBannerPreviews(prev => ({ ...prev, mobile: reader.result }));
                      };
                      reader.readAsDataURL(file);

                      const fd = new FormData(); fd.append('file', file);
                      try {
                        const res = await axios.post(`${API}/upload`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
                        setCampaignForm(prev => ({ ...prev, mobile_banner_url: res.data.url }));
                        toast.success('Mobile Asset synced');
                      } catch {
                        toast.error('Upload failed');
                        setBannerPreviews(prev => ({ ...prev, mobile: '' }));
                      } finally {
                        setIsUploading(false);
                      }
                    }} />
                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-12 rounded-xl border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-600 font-bold transition-all"
                    >
                      <label htmlFor="camp-banner-mob" className="cursor-pointer flex items-center justify-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        <span>Select Mobile Banner</span>
                      </label>
                    </Button>
                  </div>
                  {bannerPreviews.mobile && (
                    <div className="mt-2 relative group rounded-xl overflow-hidden border border-border/20 h-28 bg-muted/30 shadow-inner">
                      <img
                        src={getMediaUrl(bannerPreviews.mobile)}
                        alt="Mobile Preview"
                        className="w-full h-full object-cover transition-opacity duration-700"
                        onLoad={(e) => { e.target.style.opacity = 1; }}
                        style={{ opacity: 0 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center -z-10 bg-muted/10">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500/30" />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                        <Button size="sm" variant="ghost" className="text-white text-[9px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20" onClick={() => { setCampaignForm({ ...campaignForm, mobile_banner_url: '' }); setBannerPreviews(prev => ({ ...prev, mobile: '' })); }}>Remove Asset</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* NPC Image */}
                <div className="space-y-2 p-4 bg-muted/10 rounded-2xl border border-border/10 col-span-1 sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="camp-npc" className="text-[9px] font-black uppercase tracking-widest text-pink-500 flex items-center gap-2">
                      <UserCircle className="w-3 h-3" /> NPC Image
                    </Label>
                    {campaignForm.npc_image_url && <Badge variant="outline" className="text-[7px] bg-pink-500/10 text-pink-500 border-pink-500/20">Uploaded</Badge>}
                  </div>
                  <div className="relative group">
                    <Input id="camp-npc" type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBannerPreviews(prev => ({ ...prev, npc: reader.result }));
                      };
                      reader.readAsDataURL(file);

                      const fd = new FormData(); fd.append('file', file);
                      try {
                        const res = await axios.post(`${API}/upload`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
                        setCampaignForm(prev => ({ ...prev, npc_image_url: res.data.url }));
                        toast.success('NPC character synced');
                      } catch {
                        toast.error('Upload failed');
                        setBannerPreviews(prev => ({ ...prev, npc: '' }));
                      } finally {
                        setIsUploading(false);
                      }
                    }} />
                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-12 rounded-xl border-dashed border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/50 text-pink-600 font-bold transition-all"
                    >
                      <label htmlFor="camp-npc" className="cursor-pointer flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Select NPC Image</span>
                      </label>
                    </Button>
                  </div>
                  {bannerPreviews.npc && (
                    <div className="mt-2 relative group rounded-xl overflow-hidden border border-border/20 h-28 w-28 mx-auto bg-muted/30 shadow-inner">
                      <img
                        src={getMediaUrl(bannerPreviews.npc)}
                        alt="NPC Preview"
                        className="w-full h-full object-cover transition-opacity duration-700"
                        onLoad={(e) => { e.target.style.opacity = 1; }}
                        style={{ opacity: 0 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center -z-10 bg-muted/10">
                        <Loader2 className="w-6 h-6 animate-spin text-pink-500/30" />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                        <Button size="sm" variant="ghost" className="text-white text-[9px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20" onClick={() => setCampaignForm({ ...campaignForm, npc_image_url: '' })}>Remove</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="camp-video" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Promotional Video (Optional)</Label>
                <div className="flex items-center gap-3">
                  <Input id="camp-video" type="file" accept="video/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData(); fd.append('file', file);
                    try {
                      const res = await axios.post(`${API}/upload`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
                      setCampaignForm({ ...campaignForm, video_url: res.data.url });
                      toast.success('Video uploaded');
                    } catch { toast.error('Upload failed'); }
                  }} className="h-12 rounded-xl font-bold bg-muted/20 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-accent/10 file:text-accent" />
                  {campaignForm.video_url && (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
                      <Play className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-2 opacity-30" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="camp-filter-days" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Filter Access (Days)</Label>
                <Input id="camp-filter-days" name="camp-filter-days" type="number" value={campaignForm.reward_filter_days} onChange={e => setCampaignForm({ ...campaignForm, reward_filter_days: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl font-bold bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-expiry" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expiry Date</Label>
                <Input id="camp-expiry" name="camp-expiry" type="datetime-local" value={campaignForm.expiry_date || ''} onChange={e => setCampaignForm({ ...campaignForm, expiry_date: e.target.value })} className="h-12 rounded-xl font-bold bg-muted/20 w-full" />
              </div>
            </div>
          </div>

          <Button
            disabled={isUploading}
            onClick={async () => {
              try {
                if (campaignModal === 'new') await axios.post(`${API}/admin/campaigns`, campaignForm, { headers });
                else await axios.put(`${API}/admin/campaigns/${campaignModal.id}`, campaignForm, { headers });
                toast.success('Campaign synchronized');
                setCampaignModal(null);
                fetchData();
              } catch (err) {
                toast.error(formatError(err) || 'Failed to save campaign');
              }
            }}
            className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 font-black text-sm shadow-xl shadow-accent/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {campaignModal === 'new' ? 'Launch Global Campaign' : 'Push Campaign Updates'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Promo Code Management Modal */}
      <Dialog open={!!offerModal} onOpenChange={(open) => !open && setOfferModal(null)}>
        <DialogContent className="max-w-xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto rounded-[2rem] sm:rounded-[3rem] border-none shadow-2xl p-8 space-y-6">
          <VisuallyHidden>
            <DialogTitle>Manage Promo Code</DialogTitle>
            <DialogDescription>Create or edit promotional offers and discounts.</DialogDescription>
          </VisuallyHidden>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><Ticket className="w-5 h-5 sm:w-7 sm:h-7" /></div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-black tracking-tight truncate">{offerModal === 'new' ? 'Create' : 'Edit'} <span className="text-emerald-500">Promo Code</span></h2>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Inventory Management</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-emerald-500/5 px-4 py-3 rounded-2xl border border-emerald-500/10">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Reward Status</p>
                <p className="text-[9px] text-muted-foreground/60 font-medium">Toggle availability for users</p>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="offer-active" className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active</Label>
                <Switch id="offer-active" checked={offerForm.active} onCheckedChange={val => setOfferForm({ ...offerForm, active: val })} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer-code" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Promo Code</Label>
                <Input id="offer-code" name="offer-code" value={offerForm.code} onChange={e => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })} placeholder="E.G. WELCOME50" className="h-12 rounded-xl font-black bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Internal Title</Label>
                <Input id="offer-title" name="offer-title" value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} className="h-12 rounded-xl font-black bg-muted/20" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Offer Description</Label>
              <Textarea id="offer-desc" name="offer-desc" value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })} rows={4} className="rounded-xl font-medium bg-muted/20 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer-diamonds" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Diamond Reward</Label>
                <Input id="offer-diamonds" name="offer-diamonds" type="number" value={offerForm.diamond_reward} onChange={e => setOfferForm({ ...offerForm, diamond_reward: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl font-black bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-chat-unlocks" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chat Unlocks</Label>
                <Input id="offer-chat-unlocks" type="number" value={offerForm.reward_chat_unlocks} onChange={e => setOfferForm({ ...offerForm, reward_chat_unlocks: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl font-black bg-muted/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Boost Hours</Label>
                <Input type="number" value={offerForm.reward_boost_hours} onChange={e => setOfferForm({ ...offerForm, reward_boost_hours: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl font-black bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visitor Insights (Days)</Label>
                <Input type="number" value={offerForm.reward_visitor_days} onChange={e => setOfferForm({ ...offerForm, reward_visitor_days: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl font-black bg-muted/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subscription Plan</Label>
                <select value={offerForm.reward_subscription_plan || ''} onChange={e => setOfferForm({ ...offerForm, reward_subscription_plan: e.target.value })} className="flex h-12 w-full rounded-xl border border-input bg-muted/20 px-3 py-2 text-sm font-black">
                  <option value="">None</option>
                  <option value="1_day">1 Day</option>
                  <option value="1_week">1 Week</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Display Days (Active for)</Label>
                <Input type="number" value={offerForm.display_days} onChange={e => setOfferForm({ ...offerForm, display_days: parseInt(e.target.value) || 0 })} placeholder="0 = always" className="h-12 rounded-xl font-black bg-muted/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer-expiry" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expiry Date</Label>
                <Input id="offer-expiry" type="datetime-local" value={offerForm.expiry_date || ''} onChange={e => setOfferForm({ ...offerForm, expiry_date: e.target.value })} className="h-12 rounded-xl font-black bg-muted/20" />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">One-Time Use Only</Label>
                <div className="flex items-center gap-3 h-12 px-3 rounded-xl bg-muted/20 border border-input">
                  <Switch id="offer-onetime" checked={offerForm.one_time_use || false} onCheckedChange={val => setOfferForm({ ...offerForm, one_time_use: val })} />
                  <Label htmlFor="offer-onetime" className="text-xs font-bold cursor-pointer">{offerForm.one_time_use ? 'Yes - per user' : 'No - multiple uses'}</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Offer Visuals (Desktop, Mobile & NPC)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Desktop Banner */}
                <div className="space-y-2 p-4 bg-muted/10 rounded-2xl border border-border/10">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="offer-banner-pc" className="text-[9px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                      <Monitor className="w-3 h-3" /> Desktop Banner
                    </Label>
                    {offerForm.desktop_banner_url && <Badge variant="outline" className="text-[7px] bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Uploaded</Badge>}
                  </div>
                  <div className="relative group">
                    <Input id="offer-banner-pc" type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBannerPreviews(prev => ({ ...prev, offer_desktop: reader.result }));
                      };
                      reader.readAsDataURL(file);

                      const fd = new FormData(); fd.append('file', file);
                      try {
                        const res = await axios.post(`${API}/upload`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
                        setOfferForm(prev => ({ ...prev, desktop_banner_url: res.data.url, banner_url: res.data.url }));
                        toast.success('Offer Asset synced');
                      } catch {
                        toast.error('Upload failed');
                        setBannerPreviews(prev => ({ ...prev, offer_desktop: '' }));
                      } finally {
                        setIsUploading(false);
                      }
                    }} />
                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-12 rounded-xl border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 text-indigo-600 font-bold transition-all"
                    >
                      <label htmlFor="offer-banner-pc" className="cursor-pointer flex items-center justify-center gap-2">
                        <CloudUpload className="w-4 h-4" />
                        <span>Select Desktop</span>
                      </label>
                    </Button>
                  </div>
                  {bannerPreviews.offer_desktop && (
                    <div className="mt-2 relative group rounded-xl overflow-hidden border border-border/20 aspect-video bg-muted/30 shadow-inner">
                      <img
                        src={getMediaUrl(bannerPreviews.offer_desktop)}
                        alt="Desktop Preview"
                        className="w-full h-full object-cover transition-opacity duration-700"
                        onLoad={(e) => { e.target.style.opacity = 1; }}
                        style={{ opacity: 0 }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                        <Button size="sm" variant="ghost" className="text-white text-[9px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20" onClick={() => { setOfferForm({ ...offerForm, desktop_banner_url: '', banner_url: '' }); setBannerPreviews(prev => ({ ...prev, offer_desktop: '' })); }}>Remove</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Banner */}
                <div className="space-y-2 p-4 bg-muted/10 rounded-2xl border border-border/10">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="offer-banner-mob" className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                      <Smartphone className="w-3 h-3" /> Mobile Banner
                    </Label>
                    {offerForm.mobile_banner_url && <Badge variant="outline" className="text-[7px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Uploaded</Badge>}
                  </div>
                  <div className="relative group">
                    <Input id="offer-banner-mob" type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBannerPreviews(prev => ({ ...prev, offer_mobile: reader.result }));
                      };
                      reader.readAsDataURL(file);

                      const fd = new FormData(); fd.append('file', file);
                      try {
                        const res = await axios.post(`${API}/upload`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
                        setOfferForm(prev => ({ ...prev, mobile_banner_url: res.data.url }));
                        toast.success('Offer Asset synced');
                      } catch {
                        toast.error('Upload failed');
                        setBannerPreviews(prev => ({ ...prev, offer_mobile: '' }));
                      } finally {
                        setIsUploading(false);
                      }
                    }} />
                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-12 rounded-xl border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-600 font-bold transition-all"
                    >
                      <label htmlFor="offer-banner-mob" className="cursor-pointer flex items-center justify-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        <span>Select Mobile</span>
                      </label>
                    </Button>
                  </div>
                  {bannerPreviews.offer_mobile && (
                    <div className="mt-2 relative group rounded-xl overflow-hidden border border-border/20 h-20 bg-muted/30 shadow-inner">
                      <img
                        src={getMediaUrl(bannerPreviews.offer_mobile)}
                        alt="Mobile Preview"
                        className="w-full h-full object-cover transition-opacity duration-700"
                        onLoad={(e) => { e.target.style.opacity = 1; }}
                        style={{ opacity: 0 }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                        <Button size="sm" variant="ghost" className="text-white text-[9px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20" onClick={() => { setOfferForm({ ...offerForm, mobile_banner_url: '' }); setBannerPreviews(prev => ({ ...prev, offer_mobile: '' })); }}>Remove</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* NPC Image */}
                <div className="space-y-2 p-4 bg-muted/10 rounded-2xl border border-border/10 col-span-1 sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="offer-npc" className="text-[9px] font-black uppercase tracking-widest text-pink-500 flex items-center gap-2">
                      <UserCircle className="w-3 h-3" /> NPC Image
                    </Label>
                    {offerForm.npc_image_url && <Badge variant="outline" className="text-[7px] bg-pink-500/10 text-pink-500 border-pink-500/20">Uploaded</Badge>}
                  </div>
                  <div className="relative group">
                    <Input id="offer-npc" type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBannerPreviews(prev => ({ ...prev, offer_npc: reader.result }));
                      };
                      reader.readAsDataURL(file);

                      const fd = new FormData(); fd.append('file', file);
                      try {
                        const res = await axios.post(`${API}/upload`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
                        setOfferForm(prev => ({ ...prev, npc_image_url: res.data.url }));
                        toast.success('NPC Asset synced');
                      } catch {
                        toast.error('Upload failed');
                        setBannerPreviews(prev => ({ ...prev, offer_npc: '' }));
                      } finally {
                        setIsUploading(false);
                      }
                    }} />
                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-12 rounded-xl border-dashed border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/50 text-pink-600 font-bold transition-all"
                    >
                      <label htmlFor="offer-npc" className="cursor-pointer flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Select NPC Image</span>
                      </label>
                    </Button>
                  </div>
                  {bannerPreviews.offer_npc && (
                    <div className="mt-2 relative group rounded-xl overflow-hidden border border-border/20 h-28 w-28 mx-auto bg-muted/30 shadow-inner">
                      <img
                        src={getMediaUrl(bannerPreviews.offer_npc)}
                        alt="NPC Preview"
                        className="w-full h-full object-cover transition-opacity duration-700"
                        onLoad={(e) => { e.target.style.opacity = 1; }}
                        style={{ opacity: 0 }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                        <Button size="sm" variant="ghost" className="text-white text-[9px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20" onClick={() => { setOfferForm({ ...offerForm, npc_image_url: '' }); setBannerPreviews(prev => ({ ...prev, offer_npc: '' })); }}>Remove</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Filter Days</Label>
                <Input type="number" value={offerForm.reward_filter_days} onChange={e => setOfferForm({ ...offerForm, reward_filter_days: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl font-black bg-muted/20" />
              </div>
            </div>
          </div>

          <Button
            disabled={isUploading}
            onClick={async () => {
              try {
                if (offerModal === 'new') await axios.post(`${API}/admin/offers`, offerForm, { headers });
                else await axios.put(`${API}/admin/offers/${offerModal.id}`, offerForm, { headers });
                toast.success('Promo Code successfully updated');
                setOfferModal(null);
                fetchData();
              } catch (err) {
                toast.error(formatError(err) || 'Failed to save promo code');
              }
            }}
            className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {offerModal === 'new' ? 'Activate Promo Reward' : 'Confirm Offer Changes'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!teamModal} onOpenChange={setTeamModal}>
        <DialogContent className="max-w-lg rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl gap-0">
          <VisuallyHidden>
            <DialogTitle>Invite Admin</DialogTitle>
            <DialogDescription>Add a new staff member to the administration team.</DialogDescription>
          </VisuallyHidden>

          <div className="bg-indigo-600 p-8 text-white relative">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-sm border border-white/5">
                {teamModal && typeof teamModal === 'object' ? <ShieldCheck className="w-7 h-7" /> : <UserCheck className="w-7 h-7" />}
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">{teamModal && typeof teamModal === 'object' ? 'Manage Staff' : 'Invite Admin'}</h2>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest opacity-80">{teamModal && typeof teamModal === 'object' ? 'Update Access Scope' : 'Expansion & Permissions'}</p>
              </div>
            </div>
          </div>

          <ScrollArea className="max-h-[60vh] px-8 scrollbar-thin-indigo">
            <div className="space-y-6 py-2 pb-8">
              <div className="space-y-5">
                <div className="space-y-2 mt-4">
                  <Label htmlFor="staff-email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Colleague Email</Label>
                  <Input
                    id="staff-email"
                    name="staff-email"
                    value={teamForm.email}
                    onChange={e => setTeamForm({ ...teamForm, email: e.target.value })}
                    placeholder="admin@example.com"
                    disabled={teamModal && typeof teamModal === 'object'}
                    className={`h-13 rounded-2xl font-black bg-muted/30 border-border/5 focus:ring-indigo-500/20 shadow-inner px-5 transition-all focus:bg-muted/50 ${teamModal && typeof teamModal === 'object' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  <p className="text-[9px] text-muted-foreground px-1 font-medium italic opacity-70">
                    {teamModal && typeof teamModal === 'object' ? 'This email is bound to an existing staff identity.' : 'An official staff invitation will be dispatched to this address.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600/70 ml-1">Permissions Scope</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PERMISSION_SCOPES.map(p => (
                      <div
                        key={p.id}
                        className={`flex items-start gap-3 p-4 rounded-[1.5rem] cursor-pointer transition-all border ${(teamForm.permissions || []).includes(p.id)
                          ? 'bg-indigo-600/10 border-indigo-500/30 shadow-sm'
                          : 'bg-muted/20 border-transparent hover:bg-muted/40'
                          }`}
                        onClick={() => {
                          const current = teamForm.permissions || [];
                          if (p.id === 'full_access') {
                            // Clicking Root Admin: toggle between all selected or none
                            if (current.includes('full_access')) {
                              setTeamForm({ ...teamForm, permissions: [] });
                            } else {
                              // Select all permissions including full_access
                              setTeamForm({ ...teamForm, permissions: PERMISSION_SCOPES.map(s => s.id) });
                            }
                          } else {
                            // Clicking other scopes: remove full_access if present
                            const withoutFullAccess = current.filter(x => x !== 'full_access');
                            if (withoutFullAccess.includes(p.id)) {
                              setTeamForm({ ...teamForm, permissions: withoutFullAccess.filter(x => x !== p.id) });
                            } else {
                              setTeamForm({ ...teamForm, permissions: [...withoutFullAccess, p.id] });
                            }
                          }
                        }}
                      >
                        <Checkbox checked={(teamForm.permissions || []).includes(p.id)} className="mt-0.5 border-indigo-500/30 data-[state=checked]:bg-indigo-600" />
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-black leading-tight tracking-tight">{p.label}</p>
                          <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tight opacity-50 leading-tight">{p.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-8 pt-4 border-t border-border/5 bg-background/50">
            <Button
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-2xl shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.98] gap-3 relative overflow-hidden group"
              onClick={async () => {
                if (!teamForm.email) return toast.error('Email is required');
                if (!teamForm.permissions?.length) return toast.error('Select at least one permission');
                try {
                  setSavingSettings(true);
                  if (teamModal && typeof teamModal === 'object' && teamModal.id && !teamModal.id.startsWith('inv_')) {
                    // Update existing staff permissions
                    await axios.put(`${API}/admin/team/${teamModal.id}/permissions`, { permissions: teamForm.permissions }, { headers });
                    toast.success(`Permissions updated for ${teamForm.email}`);
                  } else {
                    // Dispatch new invitation
                    await axios.post(`${API}/admin/team/invite`, teamForm, { headers });
                    toast.success(`Invitation successfully dispatched to ${teamForm.email}`);
                  }
                  setTeamModal(null);
                  setTeamForm({ email: '', permissions: [] });
                  fetchData();
                } catch (err) {
                  toast.error(formatError(err) || 'Action failed');
                } finally {
                  setSavingSettings(false);
                }
              }}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  {teamModal && typeof teamModal === 'object' && !teamModal.id?.startsWith('inv_') ? 'Update Access Scope' : 'Dispatch Staff Invitation'}
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmActionModal} onOpenChange={(open) => !open && setConfirmActionModal(null)}>
        <DialogContent className="max-w-sm rounded-[2.5rem] border-none shadow-2xl p-8 text-center space-y-6">
          <VisuallyHidden>
            <DialogTitle>{confirmActionModal?.title || 'Confirm Action'}</DialogTitle>
            <DialogDescription>{confirmActionModal?.description || 'Please confirm to continue.'}</DialogDescription>
          </VisuallyHidden>
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${confirmActionModal?.color === 'rose' ? 'bg-rose-500/10 text-rose-600' :
            confirmActionModal?.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
              'bg-primary-500/10 text-primary-600'
            }`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight">{confirmActionModal?.title}</h2>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">{confirmActionModal?.description}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-border/40 hover:bg-muted/50" onClick={() => setConfirmActionModal(null)}>Cancel</Button>
            <Button
              className={`flex-1 h-12 rounded-xl font-black text-sm shadow-lg ${confirmActionModal?.color === 'rose' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 text-white' :
                confirmActionModal?.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-white' :
                  'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20 text-white'
                }`}
              onClick={() => {
                confirmActionModal?.action();
                setConfirmActionModal(null);
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Stats Modal (NEW) */}
      <Dialog open={!!statsModal} onOpenChange={() => setStatsModal(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-xl shadow-indigo-500/10"><BarChart3 className="w-7 h-7" /></div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Campaign <span className="text-indigo-500">Stats</span></h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{statsModal?.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-muted/20 border border-border/5 space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Joins</p>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-2xl font-black text-foreground">{statsModal?.joins}</span>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-muted/20 border border-border/5 space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Earned</p>
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-pink-500" />
                <span className="text-2xl font-black text-foreground">{statsModal?.earnings}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Inlet Program Status</p>
              <Badge className="bg-emerald-500 text-[8px] h-4">STABLE</Badge>
            </div>
            <p className="text-[11px] text-emerald-700/70 font-medium leading-relaxed">
              Referral tracking is fully active. System detects how many users referred and how many days they've stayed active.
            </p>
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              onClick={() => {
                toast.success("Checking real-time referral logs...");
                // Mock check delay
                setTimeout(() => toast.info(`${statsModal?.joins} successful joins verified.`), 1500);
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Check referral logs
            </Button>
          </div>

          <Button
            className="w-full h-14 rounded-2xl bg-foreground text-background font-black"
            onClick={() => setStatsModal(null)}
          >
            Close Analytics
          </Button>
        </DialogContent>
      </Dialog>
      {/* Admin User Live Preview Modal (1:1 with ProfilePage) */}
      <Dialog open={!!previewUser} onOpenChange={(open) => {
        if (!open) { setPreviewUser(null); setUserHistory([]); setUserReviews([]); }
      }}>
        <DialogContent className="max-w-[440px] p-0 overflow-hidden bg-background border-none shadow-none rounded-[2.5rem] md:max-w-md animate-in zoom-in-95 duration-300 h-[92vh]">
          <VisuallyHidden>
            <DialogTitle>Admin Live Preview: {previewUser?.name}</DialogTitle>
            <DialogDescription>A pixel-perfect mirrored view of how this profile appears to users.</DialogDescription>
          </VisuallyHidden>

          <div className="max-h-[85vh] md:max-h-[90vh] overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="relative">
              {/* Photo Carousel (Mirrored) */}
              <div className="relative aspect-[3/3.85] bg-zinc-950 w-full overflow-hidden">
                {previewUser?.subscription?.is_active && (
                  <div className="absolute -inset-[1px] z-40 pointer-events-none rounded-t-3xl rounded-b-none" style={{
                    padding: '4px',
                    background: 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    boxShadow: 'inset 0 0 15px rgba(191,149,63,0.3)',
                    borderTopLeftRadius: '1.5rem',
                    borderTopRightRadius: '1.5rem',
                    borderBottomLeftRadius: '0',
                    borderBottomRightRadius: '0',
                    borderBottom: 'none'
                  }} />
                )}
                {(previewUser?.photos || []).length > 0 ? (
                  <>
                    <img
                      src={previewUser.photos[previewPhotoIdx]?.url || previewUser.profile_pic}
                      alt=""
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />

                    {/* Navigation Overlays */}
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 z-30 pointer-events-auto" onClick={(e) => { e.stopPropagation(); setPreviewPhotoIdx(i => i > 0 ? i - 1 : previewUser.photos.length - 1); }}>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-2xl bg-black/20 hover:bg-black/40 text-white border-white/10 border backdrop-blur-md transition-all shadow-xl">
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 z-30 pointer-events-auto" onClick={(e) => { e.stopPropagation(); setPreviewPhotoIdx(i => i < previewUser.photos.length - 1 ? i + 1 : 0); }}>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-2xl bg-black/20 hover:bg-black/40 text-white border-white/10 border backdrop-blur-md transition-all shadow-xl">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Photo Dots Layer - Bottom Right */}
                    <div className="absolute bottom-6 right-6 flex gap-2 z-40 bg-black/20 backdrop-blur-sm p-2 rounded-full border border-white/5">
                      {(previewUser.photos || []).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === previewPhotoIdx ? 'bg-white scale-125 shadow-[0_0_8px_white]' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <User className="w-12 h-12 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">No preview imagery</p>
                  </div>
                )}

                {/* Impact Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Floating Tags */}
                <div className="absolute bottom-6 left-6 right-6 space-y-2 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">{previewUser?.name}, {previewUser?.age}</h2>
                    {previewUser?.is_verified && <div className="w-5 h-5 rounded-full bg-emerald-500/20 backdrop-blur-md flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg"><BadgeCheck className="w-3.5 h-3.5" /></div>}
                  </div>
                  <div className="flex flex-wrap gap-2 text-white">
                    <Badge variant="secondary" className="bg-white/10 backdrop-blur-md text-white border-none text-[10px] font-bold py-1 px-2.5">
                      <MapPin className="w-3 h-3 mr-1 text-rose-400" /> {previewUser?.location?.split(',')[0] || 'India'}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/10 backdrop-blur-md text-white border-none text-[10px] font-bold py-1 px-2.5">
                      <Zap className="w-3 h-3 mr-1 text-amber-400" /> {previewUser?.rating || 'New'} Rating
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Content Area (Step 2 Preview) */}
              <div className="p-8 space-y-6">
                {/* Mode Toggle Mirror */}
                <div className="flex items-center justify-between p-1 bg-muted/40 rounded-2xl border border-border/5 mb-4">
                  <Button
                    variant={previewMode === 'casual' ? 'default' : 'ghost'}
                    onClick={() => setPreviewMode('casual')}
                    className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest h-10 ${previewMode === 'casual' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600' : ''}`}
                  >Casual</Button>
                  <Button
                    variant={previewMode === 'professional' ? 'default' : 'ghost'}
                    onClick={() => setPreviewMode('professional')}
                    className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest h-10 ${previewMode === 'professional' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700' : ''}`}
                  >Professional</Button>
                </div>

                {/* Expandable Section */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Biography</p>
                    <p className="text-sm leading-relaxed font-medium text-foreground/80">
                      "{previewMode === 'casual' ? (previewUser?.companion_profile?.casual_bio || "No casual bio provided.") : (previewUser?.companion_profile?.professional_bio || "No professional bio provided.")}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-muted-foreground">Category</p>
                      <p className="text-xs font-bold">{previewMode === 'casual' ? previewUser?.companion_profile?.casual_category : previewUser?.companion_profile?.professional_category || 'General'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-muted-foreground">Consultation</p>
                      <p className="text-xs font-black text-emerald-600">₹{previewMode === 'casual' ? previewUser?.companion_profile?.casual_price : previewUser?.companion_profile?.professional_price || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-muted-foreground">Height</p>
                      <p className="text-xs font-bold">{previewUser?.height ? `${previewUser.height} cm` : 'Not Set'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-muted-foreground">User ID</p>
                      <p className="text-[10px] font-mono opacity-60">{(previewUser?.uid || previewUser?.id || '').toString().slice(0, 12)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-amber-600/70 tracking-widest flex items-center gap-1"><Gem className="w-3 h-3" /> Remaining Diamonds</p>
                      <p className="text-xl font-black text-amber-500">{previewUser?.diamonds || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-rose-500/70 tracking-widest flex items-center gap-1"><Zap className="w-3 h-3" /> Total Diamonds Spent</p>
                      <p className="text-xl font-black text-rose-500">{previewUser?.total_diamonds_spent || 0}</p>
                    </div>
                  </div>

                  {previewMode === 'professional' && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Professional Skill Set</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(previewUser?.companion_profile?.professional_skills) && previewUser.companion_profile.professional_skills.length > 0 ? (
                          previewUser.companion_profile.professional_skills.slice(0, 10).map(s => (
                            <Badge key={s} variant="outline" className="text-[9px] font-bold px-2 py-0.5 border-blue-500/10 bg-blue-500/5 text-blue-600">{s}</Badge>
                          ))
                        ) : (
                          <p className="text-[10px] text-muted-foreground opacity-50 italic">No professional skills listed.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Interests & Hobbies</p>
                    <div className="flex flex-wrap gap-2">
                      {(previewUser?.hobbies || []).slice(0, 6).map(h => (
                        <Badge key={h} variant="outline" className="text-[9px] font-bold px-2 py-0.5 border-border/10 bg-muted/5">{h}</Badge>
                      ))}
                    </div>
                  </div>

                  <Separator className="opacity-20" />

                  {/* Reviews Implementation */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Member Reviews</p>
                    <div className="space-y-3">
                      {userReviews.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground opacity-50 italic">No reviews recorded yet.</p>
                      ) : (
                        Array.isArray(userReviews) && userReviews.map(r => (
                          <div key={r.id} className="p-4 rounded-2xl bg-muted/20 border border-border/5 space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-2.5 h-2.5 ${i < (r.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                                ))}
                              </div>
                              <span className="text-[8px] opacity-40">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs italic opacity-80">"{r.comment}"</p>
                            <p className="text-[8px] font-black uppercase text-muted-foreground">— {r.reviewer_name || 'Anonymous'}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Separator className="opacity-20" />

                  {/* Admin Reward History Implementation */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Admin Action History</p>
                    <div className="space-y-2">
                      {historyLoading ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                          <p className="text-[10px] text-blue-500 font-bold">Loading activity log...</p>
                        </div>
                      ) : userHistory.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground opacity-50 italic">No bookings or transactions recorded.</p>
                      ) : (
                        Array.isArray(userHistory) && userHistory.slice(0, 8).map(h => (
                          <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <div>
                              <p className="text-[10px] font-bold capitalize">
                                {h.action === 'booking' ? `Appointment — ${h.type}` : `Payment — ${h.amount}`}
                              </p>
                              <p className="text-[8px] opacity-60 italic">{h.plan_id}</p>
                            </div>
                            <span className="text-[8px] font-black opacity-40 uppercase">{new Date(h.timestamp).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>


                  {/* Administrative Management Controls */}
                  <div className="space-y-4 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/70 text-center">Administrative Control Center</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-12 rounded-xl border-dashed border-accent/30 text-accent font-black text-[10px] uppercase tracking-widest bg-accent/5 hover:bg-accent hover:text-white transition-all" onClick={() => { setRewardForm({ type: 'diamonds', amount: 10, plan_id: '' }); setRewardModal(previewUser); }}>
                        <Gift className="w-3.5 h-3.5 mr-2" /> Reward Diamonds
                      </Button>
                      <Button variant="outline" className="h-12 rounded-xl border-dashed border-pink-500/30 text-pink-500 font-black text-[10px] uppercase tracking-widest bg-pink-500/5 hover:bg-pink-500 hover:text-white transition-all" onClick={() => { setMailForm({ subject: '', message: '', from_name: 'PlusOneStar Team' }); setMailModal(previewUser); }}>
                        <Mail className="w-3.5 h-3.5 mr-2" /> Direct Message
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full h-12 rounded-xl border border-emerald-500/30 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-500/5 hover:bg-emerald-500 hover:text-white transition-all shadow-lg" onClick={() => { setTrialForm({ action: 'grant', days: 7 }); setTrialModal(previewUser); }}>
                      <Clock className="w-3.5 h-3.5 mr-2" /> Manage Free Trial
                    </Button>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="h-12 rounded-xl border-amber-500/20 text-amber-600 font-black text-[9px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all" onClick={() => handleAction(previewUser?.id, 'suspend', previewUser)}>Suspend</Button>
                      <Button variant="outline" className="h-12 rounded-xl border-rose-500/20 text-rose-600 font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all" onClick={() => handleAction(previewUser?.id, 'ban', previewUser)}>Ban User</Button>
                      <Button variant="destructive" className="h-12 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-destructive/20" onClick={() => handleAction(previewUser?.id, 'delete', previewUser)}>Delete Account</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Slots Dialog */}
      <Dialog open={slotModal} onOpenChange={setSlotModal}>
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Board Capacity</DialogTitle>
            <DialogDescription className="text-xs font-medium opacity-60">Set the total number of available slots for the elite board.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Desired Total Slots</Label>
              <Input
                type="number"
                value={slotAmount}
                onChange={(e) => setSlotAmount(parseInt(e.target.value) || 0)}
                className="h-12 rounded-xl font-black text-lg text-emerald-500"
              />
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter opacity-60">
                <span>Current: {platformCharges.leaderboard_max_slots || 30}</span>
                <span className={slotAmount < (platformCharges.leaderboard_occupied_slots || 0) ? "text-rose-500" : "text-emerald-500"}>
                  Min Required: {platformCharges.leaderboard_occupied_slots || 0} (Occupied)
                </span>
              </div>
            </div>
            <Button
              className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black disabled:opacity-50 disabled:grayscale"
              disabled={slotAmount < (platformCharges.leaderboard_occupied_slots || 0)}
              onClick={async () => {
                try {
                  await axios.put(`${API}/admin/platform-charges`, { leaderboard_max_slots: slotAmount }, { headers });
                  toast.success(`Board capacity updated to ${slotAmount} slots!`);
                  setSlotModal(false);
                  fetchData();
                } catch (e) {
                  toast.error(e.response?.data?.detail || "Failed to update capacity.");
                }
              }}
            >Update Capacity</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
