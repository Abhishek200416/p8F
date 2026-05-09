import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  Gift, Share2, Copy, CheckCircle, Info, Timer, Zap, Megaphone, Ticket,
  ChevronRight, ArrowLeft, Users, X, Shield, Gem, Star, ChevronDown,
  MapPin, Calendar, ExternalLink, UserPlus, History, Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : (process.env.REACT_APP_API_URL || '/api');
const BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

const formatMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const CampaignPage = () => {
  const { user, token } = useAuth();
  const [data, setData] = useState({ campaigns: [], offers: [] });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ongoing');
  const [activeTab, setActiveTab] = useState('campaigns');
  const [systemReferralEnabled, setSystemReferralEnabled] = useState(true);

  const [expandedId, setExpandedId] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [joinedIds, setJoinedIds] = useState([]);
  const [campaignHistory, setCampaignHistory] = useState([]);
  const [memberCounts, setMemberCounts] = useState({});
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const { mode } = useTheme();
  const isPro = mode === 'professional';
  const accentHex = isPro ? '#3b82f6' : '#f43f5e';

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (token) fetchMyJoined(); }, [token]);

  const fetchData = async () => {
    try {
      const resp = await axios.get(`${API}/campaigns-offers`);
      if (resp && resp.data) {
        const campaigns = Array.isArray(resp.data.campaigns) ? resp.data.campaigns : [];
        setData({
          campaigns,
          offers: Array.isArray(resp.data.offers) ? resp.data.offers : []
        });
        setSystemReferralEnabled(resp.data.system_referral_enabled !== false);
        // Fetch member counts for each campaign
        const counts = {};
        await Promise.all(campaigns.map(async (c) => {
          try {
            const r = await axios.get(`${API}/campaigns/${c.id}/members`, { headers });
            counts[c.id] = r.data.count || 0;
          } catch { counts[c.id] = c.member_count || 0; }
        }));
        setMemberCounts(counts);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyJoined = async () => {
    try {
      const res = await axios.get(`${API}/campaigns/my-joined`, { headers });
      setJoinedIds((res.data.joined || []).filter(e => e.is_active_member).map(e => e.campaign_id));
      setCampaignHistory(res.data.joined || []);
    } catch { /* not logged in or error */ }
  };

  // Fetch referral stats when referral panel opens
  useEffect(() => {
    if (expandedId === 'system-referral' && token) {
      fetchReferralStats();
    }
  }, [expandedId, token]);

  const fetchReferralStats = async () => {
    try {
      const res = await axios.get(`${API}/referrals/mine`, { headers: { Authorization: `Bearer ${token}` } });
      setReferralStats(res.data);
    } catch { /* ignore */ }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleShare = () => {
    const link = `${window.location.origin}/auth?ref=${user?.referral_code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join PlusOneStar',
        text: 'Come join me on PlusOneStar and get 7 days free premium trial!',
        url: link
      });
    } else {
      copyToClipboard(link);
    }
  };

  const filterByStatus = (items) => {
    const now = new Date();
    return items.filter(item => {
      const start = item.start_date ? new Date(item.start_date) : null;
      const end = item.expiry_date ? new Date(item.expiry_date) : null;
      if (statusFilter === 'ongoing') {
        return item.active && (!start || start <= now) && (!end || end >= now);
      }
      if (statusFilter === 'upcoming') {
        return item.active && start && start > now;
      }
      if (statusFilter === 'expired') {
        return !item.active || (end && end < now);
      }
      return true;
    });
  };

  // Never filter out the system-referral card — just show it as disabled/expired when off
  const filteredCampaigns = filterByStatus(data.campaigns).filter(c => c.id !== 'system-referral');
  // System referral card is shown separately and always rendered (enabled or disabled state)
  const hasSystemReferral = true; // always show the invitation programme card
  const filteredOffers = filterByStatus(data.offers);

  const togglePanel = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleJoin = async (campaignId) => {
    if (!token) { toast.error('Please log in to join campaigns'); return; }
    const isJoined = joinedIds.includes(campaignId);
    try {
      if (isJoined) {
        await axios.delete(`${API}/campaigns/${campaignId}/join`, { headers });
        setJoinedIds(prev => prev.filter(id => id !== campaignId));
        setMemberCounts(prev => ({ ...prev, [campaignId]: Math.max(0, (prev[campaignId] || 1) - 1) }));
        toast('You have left this event.');
      } else {
        await axios.post(`${API}/campaigns/${campaignId}/join`, {}, { headers });
        setJoinedIds(prev => [...prev, campaignId]);
        setMemberCounts(prev => ({ ...prev, [campaignId]: (prev[campaignId] || 0) + 1 }));
        toast.success('🎉 You joined this event! Show up & earn diamonds!');
        // Refresh history
        fetchMyJoined();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update participation');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-32">
      <Navbar />

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 space-y-2">
          <Badge className="bg-accent/10 text-accent border-none mb-2">Rewards & Growth</Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Growth & <span style={{ color: accentHex }}>Offers</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Explore active campaigns and special offers. Share the love and earn rewards.
          </p>
        </header>

        <Tabs defaultValue="campaigns" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-11 p-1 bg-muted/30 rounded-2xl mb-6">
            <TabsTrigger value="campaigns" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 text-xs font-bold">
              <Megaphone className="w-3.5 h-3.5" /> Campaigns
            </TabsTrigger>
            <TabsTrigger value="offers" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 text-xs font-bold">
              <Ticket className="w-3.5 h-3.5" /> Offers
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 text-xs font-bold">
              <History className="w-3.5 h-3.5" /> My Events
            </TabsTrigger>
          </TabsList>

          {/* Status Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {['ongoing', 'upcoming', 'expired'].map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(f)}
                className={`rounded-full px-4 text-[10px] font-black uppercase tracking-widest h-7 ${statusFilter === f ? 'shadow-md' : 'opacity-50'}`}
                style={statusFilter === f ? { background: accentHex, color: '#fff' } : {}}
              >
                {f}
              </Button>
            ))}
          </div>

          {/* ═══ CAMPAIGNS TAB ═══ */}
          <TabsContent value="campaigns" className="space-y-3">

            {/* Invitation Programme — shown based on active/inactive state only */}
            {systemReferralEnabled && (statusFilter === 'ongoing' || statusFilter === 'all') && (
              /* ENABLED — show live invite card */
              <CampaignListItem
                key="system-referral"
                campaign={{
                  id: 'system-referral',
                  title: 'Invitation Programme',
                  description: 'Invite friends and earn diamonds. Share your referral link now.',
                  active: true,
                  campaign_type: 'invitation'
                }}
                isExpanded={expandedId === 'system-referral'}
                onToggle={() => togglePanel('system-referral')}
                accentHex={accentHex}
                isReferral={true}
                user={user}
                referralStats={referralStats}
                onShare={handleShare}
                onCopy={copyToClipboard}
              />
            )}

            {!systemReferralEnabled && (statusFilter === 'expired' || statusFilter === 'all') && (
              /* DISABLED — show expired/inactive state */
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 overflow-hidden bg-muted/20 opacity-60">
                <div className="flex items-center gap-3.5 p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-200 dark:bg-slate-700">
                    <Gift className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-muted-foreground">Invitation Programme</h4>
                      <Badge className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0 h-4 bg-slate-200 dark:bg-slate-700 text-slate-500 border-none">
                        Expired
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      Invitation campaign has been expired. Referral invitations are currently unavailable.
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider shrink-0">Inactive</span>
                </div>
              </div>
            )}

            {/* Regular custom campaigns */}
            {filteredCampaigns.length === 0 && !systemReferralEnabled && statusFilter === 'ongoing' ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border/30 bg-muted/5">
                <Megaphone className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No active campaigns</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border/30 bg-muted/5">
                <Megaphone className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No {statusFilter} campaigns</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCampaigns.map((c) => (
                  <CampaignListItem
                    key={c.id}
                    campaign={{ ...c, memberCount: memberCounts[c.id] || c.member_count || 0 }}
                    isExpanded={expandedId === c.id}
                    onToggle={() => togglePanel(c.id)}
                    accentHex={accentHex}
                    isReferral={false}
                    user={user}
                    referralStats={referralStats}
                    onShare={handleShare}
                    onCopy={copyToClipboard}
                    isJoined={joinedIds.includes(c.id)}
                    onJoin={() => handleJoin(c.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          {/* ═══ OFFERS TAB ═══ */}
          <TabsContent value="offers" className="space-y-4">
            {filteredOffers.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-border/30 bg-muted/5">
                <Ticket className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No {statusFilter} offers</p>
              </div>
            ) : (
              filteredOffers.map((offer) => (
                <OfferListItem
                  key={offer.id}
                  offer={offer}
                  isExpanded={expandedId === offer.id}
                  onToggle={() => togglePanel(offer.id)}
                  accentHex={accentHex}
                  onCopy={copyToClipboard}
                />
              ))
            )}
          </TabsContent>


          <TabsContent value="history" className="space-y-4">
            {!token ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-border/30 bg-muted/5">
                <History className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Log in to see your event history</p>
              </div>
            ) : campaignHistory.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-border/30 bg-muted/5">
                <Trophy className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No campaigns joined yet</p>
                <p className="text-[11px] text-muted-foreground/60 mt-2">Join campaigns to see them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Trophy className="w-4 h-4" style={{ color: accentHex }} />
                  <h2 className="text-sm font-black uppercase tracking-widest">My Campaign History</h2>
                  <Badge className="text-[9px] h-5 px-2 ml-auto" style={{ background: `${accentHex}20`, color: accentHex, border: 'none' }}>
                    {joinedIds.length} Active
                  </Badge>
                </div>
                {campaignHistory.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-border/15 bg-card">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentHex}15` }}>
                      {entry.is_active_member
                        ? <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} />
                        : <X className="w-5 h-5 text-muted-foreground/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate">{entry.title || entry.campaign_data?.title || 'Campaign'}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Joined {new Date(entry.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <Badge
                      className={`text-[8px] font-black uppercase px-2 h-5 border-none shrink-0 ${entry.is_active_member ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground/60'}`}
                    >
                      {entry.is_active_member ? 'Active' : 'Left'}
                    </Badge>
                  </div>
                ))}
                {/* Co-campaign reward info */}
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Gem className="w-4 h-4 text-amber-500" />
                    <p className="text-xs font-black text-amber-600 uppercase tracking-wider">Co-Campaign Reward</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    When you book a companion who also joined the same campaign and the booking is <strong>completed</strong>, <strong>both of you earn 50 diamonds</strong> automatically! 🎉
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CAMPAIGN LIST ITEM — clean row with expandable inline panel
// ═══════════════════════════════════════════════════════════════
function CampaignListItem({ campaign, isExpanded, onToggle, accentHex, isReferral, user, referralStats, onShare, onCopy, isJoined, onJoin }) {
  const isLive = campaign.active && (!campaign.expiry_date || new Date(campaign.expiry_date) > new Date());
  const hasBanner = campaign.banner_url || campaign.banner_image || campaign.image_url || campaign.image;

  return (
    <div className="rounded-2xl border-[0.5px] border-amber-500/30 overflow-hidden transition-all bg-gradient-to-br from-background to-amber-500/5 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] relative" style={{ transition: 'all 0.3s' }}>
      {/* Banner image thumbnail strip */}
      {hasBanner && !isReferral && (
        <div className="w-full h-28 sm:h-36 overflow-hidden relative">
          <img
            src={formatMediaUrl(hasBanner)}
            alt={campaign.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          {isLive && (
            <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />Live
            </span>
          )}
        </div>
      )}

      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3.5 p-4 text-left hover:bg-muted/5 transition-colors"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-inner"
          style={{ background: `linear-gradient(135deg, ${accentHex}20, ${accentHex}05)`, color: accentHex, border: `0.5px solid ${accentHex}30` }}
        >
          {isReferral ? <Gift className="w-5 h-5" /> : <Megaphone className="w-5 h-5 drop-shadow-sm" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black truncate bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-600 drop-shadow-sm">{campaign.title}</h4>
            {isReferral && (
              <Badge className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0 h-4" style={{ background: `${accentHex}20`, color: accentHex, border: 'none' }}>
                Featured
              </Badge>
            )}
            {!isReferral && campaign.campaign_type === 'event' && (
              <Badge className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0 h-4 bg-violet-500/15 text-violet-600 border-none">
                Event
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{campaign.description}</p>
          {/* Quick meta */}
          <div className="flex items-center gap-3 mt-1">
            {campaign.event_date && (
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground/60 font-medium">
                <Calendar className="w-2.5 h-2.5" />{new Date(campaign.event_date).toLocaleDateString()}
              </span>
            )}
            {campaign.location && (
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground/60 font-medium">
                <MapPin className="w-2.5 h-2.5" />{campaign.location}
              </span>
            )}
            {!isReferral && (campaign.memberCount > 0 || campaign.member_count > 0) && (
              <span className="flex items-center gap-1 text-[9px] font-bold" style={{ color: accentHex }}>
                <Users className="w-2.5 h-2.5" />{campaign.memberCount || campaign.member_count} joined
              </span>
            )}

          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && !hasBanner && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
            </span>
          )}
          <ChevronDown
            className="w-4 h-4 text-muted-foreground transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Expandable inline panel */}
      {isExpanded && (
        <div className="border-t border-border/10 animate-in fade-in slide-in-from-top-1 duration-200">
          {isReferral ? (
            <ReferralPanel user={user} stats={referralStats} onShare={onShare} onCopy={onCopy} accentHex={accentHex} />
          ) : (
            <GenericCampaignPanel campaign={campaign} onShare={onShare} accentHex={accentHex} isJoined={isJoined} onJoin={onJoin} />
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REFERRAL PANEL — Full stats, code, share, rewards, T&C
// ═══════════════════════════════════════════════════════════════
function ReferralPanel({ user, stats, onShare, onCopy, accentHex }) {
  const totalRefs = stats?.stats?.invited || user?.referral_count || 0;
  const rewardsGiven = stats?.stats?.rewards_given || user?.referral_rewards || 0;
  const pending = totalRefs - rewardsGiven;

  return (
    <div className="p-5 space-y-5">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-muted/20 border border-border/10 text-center">
          <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">Invited</p>
          <p className="text-xl font-black">{totalRefs}</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/20 border border-border/10 text-center">
          <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">Pending</p>
          <p className="text-xl font-black">{pending >= 0 ? pending : 0}</p>
        </div>
        <div className="p-3 rounded-xl border text-center" style={{ background: `${accentHex}08`, borderColor: `${accentHex}20` }}>
          <p className="text-[9px] font-bold uppercase mb-1 tracking-wider" style={{ color: accentHex }}>Earned</p>
          <p className="text-xl font-black" style={{ color: accentHex }}>{rewardsGiven}d</p>
        </div>
      </div>

      {/* Referral code + share */}
      <div className="rounded-xl border border-border/15 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Referral Code</span>
          <Badge variant="outline" className="text-[8px] border-accent/20" style={{ color: accentHex }}>Personal</Badge>
        </div>
        <div className="flex items-center gap-3 bg-muted/20 rounded-lg p-3 border border-border/10">
          <code className="text-base font-black tracking-[0.15em] flex-1">{user?.referral_code || '—'}</code>
          <button
            onClick={() => onCopy(user?.referral_code)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent/10 transition-colors"
            style={{ color: accentHex }}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        <Button
          className="w-full h-11 text-xs font-black uppercase tracking-widest shadow-lg"
          onClick={onShare}
          style={{ background: accentHex, color: '#fff', border: 'none' }}
        >
          <Share2 className="w-3.5 h-3.5 mr-2" /> Share Invite Link
        </Button>
      </div>

      {/* What you & they get */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 bg-emerald-500/6 border border-emerald-500/15">
          <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">What You Get</p>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" /> +1 Day Premium
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Per verified friend joined</p>
        </div>
        <div className="rounded-xl p-3 bg-blue-500/6 border border-blue-500/15">
          <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5">What They Get</p>
          <p className="text-sm font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" /> 7 Days Free
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Premium access trial</p>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="rounded-xl p-4 bg-muted/10 border border-border/10 space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Shield className="w-3 h-3" /> Terms & Conditions
        </h4>
        <ul className="space-y-2">
          {[
            'Friend must sign up using your referral code or link.',
            'Friend must complete face verification to activate the reward.',
            'You earn +1 day premium per verified referral.',
            'Your friend receives 7 days of free premium access on sign-up.',
            'Rewards are automatically added to your active subscription.',
            'Self-referrals or fake accounts will result in a ban.',
            'PlusOneStar reserves the right to modify or pause this program.',
          ].map((t, i) => (
            <li key={i} className="flex gap-2 text-[10px] text-muted-foreground items-start leading-relaxed">
              <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" /> {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GENERIC CAMPAIGN PANEL (non-referral campaigns)
// ═══════════════════════════════════════════════════════════════
function GenericCampaignPanel({ campaign, onShare, accentHex, isJoined, onJoin }) {
  const hasBanner = campaign.banner_url || campaign.banner_image || campaign.image_url || campaign.image;
  const hasVideo = campaign.video_url;

  return (
    <div className="p-5 space-y-5">
      {/* VIDEO only — banner image is already shown in the card header strip above.
          Never show the banner image again here to avoid duplication. */}
      {hasVideo && (
        <div className="w-full rounded-2xl overflow-hidden border border-amber-500/20 shadow-lg">
          <video
            src={hasVideo}
            controls
            autoPlay={false}
            playsInline
            className="w-full max-h-64 object-cover bg-black"
            poster={hasBanner || undefined}
          />
        </div>
      )}

      <p className="text-sm text-muted-foreground leading-relaxed">{campaign.description}</p>

      {/* Event meta info */}
      {(campaign.event_date || campaign.location || campaign.external_link) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {campaign.event_date && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/10">
              <Calendar className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Date</p>
                <p className="text-xs font-bold">{new Date(campaign.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          )}
          {campaign.location && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/10">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Location</p>
                <p className="text-xs font-bold truncate">{campaign.location}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-muted/20 border border-border/10">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Reward</p>
          <p className="text-sm font-black flex items-center gap-1.5" style={{ color: accentHex }}>
            {campaign.benefit || 'Variable Bonus'}
            {(campaign.benefit?.toLowerCase().includes('diamond') || campaign.description?.toLowerCase().includes('diamond')) && <Gem className="w-3.5 h-3.5 text-pink-500" />}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-muted/20 border border-border/10">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Validity</p>
          <p className="text-sm font-bold">{campaign.expiry_date ? new Date(campaign.expiry_date).toLocaleDateString() : 'Ongoing'}</p>
        </div>
      </div>

      {/* How to participate — FIXED SPACING */}
      <div className="space-y-4 mt-6 p-4 rounded-xl border-[0.5px] border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600/80">How to Participate</h4>
        <div className="space-y-3">
          {[
            'Ensure your profile is verified and active.',
            campaign.reward_type === 'subscription_extension' ? 'Share your unique invite link with friends.' : 'Show up at the event or complete the required action.',
            'Rewards are credited automatically after validation.',
          ].map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-amber-900 shrink-0 mt-0.5 shadow-sm border-[0.5px] border-amber-500/30 bg-gradient-to-br from-amber-300 to-amber-500"
              >
                {i + 1}
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Terms */}
      {campaign.terms && (
        <div className="rounded-xl p-3 bg-muted/10 border border-border/10">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Shield className="w-3 h-3" /> Terms</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{campaign.terms}</p>
        </div>
      )}

      {/* External link if any */}
      {campaign.external_link && (
        <a
          href={campaign.external_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold underline underline-offset-2"
          style={{ color: accentHex }}
        >
          <ExternalLink className="w-3.5 h-3.5" /> View More Details
        </a>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {/* JOIN / RSVP button */}
        <Button
          className="flex-1 h-11 text-xs font-black uppercase tracking-widest shadow-lg gap-2"
          onClick={onJoin}
          style={isJoined
            ? { background: '#22c55e', color: '#fff', border: 'none' }
            : { background: accentHex, color: '#fff', border: 'none' }
          }
        >
          <UserPlus className="w-3.5 h-3.5" />
          {isJoined ? '✓ Joined Event' : 'Join This Event'}
        </Button>
        <Button
          variant="outline"
          className="h-11 px-4 text-xs font-bold"
          onClick={onShare}
        >
          <Share2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OFFER LIST ITEM — with expandable details
// ═══════════════════════════════════════════════════════════════
function OfferListItem({ offer, isExpanded, onToggle, accentHex, onCopy }) {
  const daysLeft = offer.expiry_date ? Math.ceil((new Date(offer.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 3 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const hasBanner = offer.banner_url || offer.image_url || offer.image;
  const hasVideo = offer.video_url;

  return (
    <div className={`rounded-2xl overflow-hidden transition-all bg-gradient-to-br from-background to-amber-500/5 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] ${isExpiringSoon ? 'border-[0.5px] border-orange-500/40' : isExpired ? 'border-[0.5px] border-red-500/20 opacity-60' : 'border-[0.5px] border-amber-500/30'}`}>
      {/* Banner strip on offer card */}
      {hasBanner && !isExpired && (
        <div className="w-full h-24 sm:h-32 overflow-hidden relative">
          <img
            src={formatMediaUrl(hasBanner)}
            alt={offer.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          {isExpiringSoon && (
            <span className="absolute top-2 right-2 text-[9px] font-black text-white bg-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              Expiring Soon!
            </span>
          )}
        </div>
      )}
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3.5 p-4 text-left hover:bg-muted/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner" style={{ background: `linear-gradient(135deg, ${accentHex}20, ${accentHex}05)`, color: accentHex, border: `0.5px solid ${accentHex}30` }}>
          <Ticket className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-black truncate bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-600">{offer.title}</h4>
            {offer.benefit && (
              <Badge className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0 h-4 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none">
                {offer.benefit}
              </Badge>
            )}
            {offer.one_time_use && (
              <Badge className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0 h-4 bg-amber-500/15 text-amber-600 border-none">
                1x Only
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{offer.description}</p>
          {daysLeft !== null && (
            <p className={`text-[10px] font-black mt-0.5 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-orange-500 animate-pulse' : 'text-muted-foreground/60'}`}>
              {isExpired ? 'Expired' : isExpiringSoon ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!` : `${daysLeft} days left`}
            </p>
          )}
        </div>
        <ChevronDown
          className="w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Expandable panel */}
      {isExpanded && (
        <div className="border-t border-amber-500/10 px-4 py-5 space-y-5 bg-gradient-to-b from-amber-500/5 to-transparent">
          {/* VIDEO only — banner image is already shown in the card strip above, never show it again here */}
          {hasVideo && (
            <div className="w-full rounded-2xl overflow-hidden border border-amber-500/20 shadow-lg">
              <video
                src={formatMediaUrl(hasVideo)}
                controls
                playsInline
                className="w-full max-h-56 object-cover bg-black"
                poster={formatMediaUrl(hasBanner) || undefined}
              />
            </div>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed">{offer.description}</p>

          {/* Promo code */}
          {offer.code && (
            <div className="flex items-center gap-3 rounded-xl p-3 border border-amber-500/30 bg-amber-500/5">
              <div className="flex-1">
                <p className="text-[9px] font-bold text-amber-600/80 uppercase tracking-widest mb-0.5">Promo Code</p>
                <code className="text-sm font-black tracking-[0.12em] bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-600">{offer.code}</code>
              </div>
              <button
                onClick={() => onCopy(offer.code)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-amber-500/10 transition-colors"
                style={{ color: accentHex }}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <p className="text-[9px] font-bold text-amber-600/70 uppercase tracking-wider mb-1">Benefit</p>
              <p className="text-xs font-black" style={{ color: accentHex }}>{offer.benefit || 'Special Discount'}</p>
            </div>
            <div className={`p-3 rounded-xl border border-border/10 ${isExpiringSoon ? 'bg-orange-500/10 border-orange-500/20' : 'bg-muted/15'}`}>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Expires</p>
              <p className={`text-xs font-bold ${isExpiringSoon ? 'text-orange-500' : ''}`}>
                {offer.expiry_date ? (
                  isExpired ? 'Expired' :
                  isExpiringSoon ? `in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!` :
                  new Date(offer.expiry_date).toLocaleDateString()
                ) : 'No Expiry'}
              </p>
            </div>
          </div>

          {offer.one_time_use && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">⚡ One-time use per user — Apply on Plans page</span>
            </div>
          )}

          {offer.terms && (
            <div className="rounded-xl p-3 bg-muted/10 border border-border/10">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Info className="w-3 h-3" /> Terms</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{offer.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CampaignPage;
