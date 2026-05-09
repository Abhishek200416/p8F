import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Loader2, Search, MessageSquare, ShieldCheck, User, MoreVertical, Trash2, Flag, AlertTriangle, UserCheck, Unlock, Heart, Zap, Ban, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Standardized Heart usage


const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

const isTouchDevice = () => {
  return (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
};

// Half-filled heart: left half is filled, right half is outline
const HalfHeart = ({ className = '', size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09a6.51 6.51 0 0 1 4.5-2.09c3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    <path fill={color} stroke="none" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09V21.35z" />
  </svg>
);function DefaultAvatar({ name, size = 10 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-muted/60 flex items-center justify-center border border-border/20 text-xs font-semibold text-muted-foreground`}>
      {name?.charAt(0) || '?'}
    </div>
  );
}

export default function ChatInbox() {
  const { user, token } = useAuth();
  const { mode } = useTheme();
  const isPro = mode === 'professional';
  const accentHex = isPro ? '#3b82f6' : '#f43f5e';
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };

  const [bookings, setBookings] = useState([]);
  const [directConvos, setDirectConvos] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);  // mutual likes
  const [sentLikes, setSentLikes] = useState([]);            // likes I sent (pending)
  const [receivedLikes, setReceivedLikes] = useState([]);    // likes I received (pending)
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reportDialog, setReportDialog] = useState(null);
  const [reportCategory, setReportCategory] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [blockedProfiles, setBlockedProfiles] = useState([]); // full profile objects of people I blocked
  const [unblockedPreviews, setUnblockedPreviews] = useState([]); // { id, name, pic, unblockedAt }
  const [activeTab, setActiveTab] = useState('messages');
  const [hiddenIds, setHiddenIds] = useState(new Set());

  // Load hidden IDs from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user_hidden_chat_ids') || '[]');
    if (stored.length > 0) setHiddenIds(new Set(stored));
  }, []);

  const saveHiddenId = (id) => {
    const updated = new Set([...hiddenIds, id]);
    setHiddenIds(updated);
    localStorage.setItem('user_hidden_chat_ids', JSON.stringify(Array.from(updated)));
  };

  const unhideId = (id) => {
    const updated = new Set(hiddenIds);
    updated.delete(id);
    setHiddenIds(updated);
    localStorage.setItem('user_hidden_chat_ids', JSON.stringify(Array.from(updated)));
  };

  const unhideAll = () => {
    setHiddenIds(new Set());
    localStorage.removeItem('user_hidden_chat_ids');
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const bookRes = await axios.get(`${API}/bookings`, { headers });
        const accepted = (bookRes.data.bookings || bookRes.data || []).filter(b => b.status === 'accepted');
        setBookings(accepted);
      } catch { setBookings([]); }

      try {
        const convRes = await axios.get(`${API}/chat/conversations`, { headers });
        setDirectConvos(convRes.data || []);
      } catch { 
        setDirectConvos([]); 
      }

      if (token) {
        axios.get(`${API}/likes/sent`, { headers })
          .then(res => setSentLikes(res.data.likes || []))
          .catch(() => setSentLikes([]));

        axios.get(`${API}/likes/received`, { headers })
          .then(res => setReceivedLikes(res.data.likes || []))
          .catch(() => setReceivedLikes([]));

        axios.get(`${API}/likes/mutual`, { headers })
          .then(res => setConnectedUsers(res.data.matches || []))
          .catch(() => setConnectedUsers([]));

        axios.get(`${API}/safety/blocks`, { headers })
          .then(res => {
            const ids = new Set();
            const profiles = [];
            if (Array.isArray(res.data)) res.data.forEach(b => {
              // Only track users *I* blocked (where blocker_id === me)
              if (String(b.blocker_id) === String(user?.id)) {
                ids.add(b.blocked_id);
                profiles.push({
                  id: b.blocked_id,
                  name: b.blocked_name || b.blocked_user?.name || 'Blocked User',
                  pic: b.blocked_pic || b.blocked_user?.profile_pic || null,
                  blockedAt: b.created_at,
                });
              } else if (b.blocked_id) {
                ids.add(b.blocked_id);
              }
            });
            if (user?.id) ids.delete(user.id);
            setBlockedIds(ids);
            setBlockedProfiles(profiles);
          }).catch(() => { setBlockedIds(new Set()); setBlockedProfiles([]); });
      }
      setLoading(false);
    };

    fetchAll();

    const interval = setInterval(() => {
      setDirectConvos(prev => prev.map(c => {
        if (c.time_remaining && c.time_remaining > 0) {
          return { ...c, time_remaining: c.time_remaining - 10 };
        }
        return c;
      }));
    }, 10000);

    // Refresh on focus
    window.addEventListener('focus', fetchAll);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchAll);
    };
  }, [token, user?.id]);

  // 24 Hour Filter Helper
  const isRecent = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    return (now - date) < (24 * 60 * 60 * 1000); // 24 Hours
  };

  // Sent-like IDs for fast lookup
  const sentLikeIds = new Set(Array.isArray(sentLikes) ? sentLikes.map(l => l.to_user_id || l.id) : []);
  const mutualIds = new Set(Array.isArray(connectedUsers) ? connectedUsers.map(u => u.id) : []);

  const handleDeleteChat = async () => {
    if (!deleteConfirm) return;
    try {
      await axios.delete(`${API}/chat/${deleteConfirm.id}`, { headers });
      toast.success('Chat deleted');
      if (deleteConfirm.type === 'booking') setBookings(p => p.map(b => b.id === deleteConfirm.id ? { ...b, deleted_by: [...(b.deleted_by || []), user?.id] } : b));
      else setDirectConvos(p => p.map(c => c.id === deleteConfirm.id ? { ...c, deleted_by: [...(c.deleted_by || []), user?.id] } : c));
    } catch { toast.error('Failed to update chat'); }
    setDeleteConfirm(null);
  };

  const handleUnblock = async (blockedUser) => {
    try {
      await axios.delete(`${API}/safety/blocks/${blockedUser.id}`, { headers });
      // Remove from blocked list
      setBlockedIds(prev => { const n = new Set(prev); n.delete(blockedUser.id); return n; });
      setBlockedProfiles(prev => prev.filter(p => p.id !== blockedUser.id));
      // Add to 1-hour preview list
      setUnblockedPreviews(prev => [
        ...prev.filter(p => p.id !== blockedUser.id),
        { ...blockedUser, unblockedAt: Date.now() }
      ]);
      toast.success(`${blockedUser.name} unblocked. You can view their profile for 1 hour.`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to unblock');
    }
  };

  // Clean up expired unblock previews (> 1 hour old)
  useEffect(() => {
    const interval = setInterval(() => {
      setUnblockedPreviews(prev => prev.filter(p => Date.now() - p.unblockedAt < 3600000));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUnblockCountdown = (unblockedAt) => {
    const remaining = 3600000 - (Date.now() - unblockedAt);
    if (remaining <= 0) return null;
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    return m > 0 ? `${m}m left` : `${s}s`;
  };

  const handleReport = async () => {
    if (!reportCategory) { toast.error('Please select a reason'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/reports`, {
        reported_user_id: reportDialog.other_user_id, reason: reportCategory,
        details: reportMessage, context: 'chat_list', conversation_id: reportDialog.id
      }, { headers });
      toast.success('Report submitted');
      setReportDialog(null); setReportCategory(''); setReportMessage('');
    } catch { toast.error('Failed to submit report'); }
    setSubmitting(false);
  };

  // Build chat item lists
  const directItemsDetailed = directConvos
    // Filter removed to ensure persistence as per user request
    .map(c => {
    const isBlocked = blockedIds.has(c.other_user?.id);
    return {
      id: c.id, navId: c.id, type: 'direct',
      name: isBlocked ? 'PlusOneStar User' : (c.other_user?.name || 'Unknown'),
      other_user_id: c.other_user?.id || c.participants?.find(p => p !== user?.id),
      pic: isBlocked ? null : c.other_user?.profile_pic,
      subtitle: (c.deleted_by && user?.id && c.deleted_by.includes(user.id)) 
        ? 'No recent messages' 
        : (c.last_message?.content || 'Unlocked Chat'),
      updated_at: c.last_message?.created_at || c.updated_at,
      unread: c.unread_count || 0,
      deleted_by: c.deleted_by || [],
      is_accepted: c.is_accepted ?? true,
      time_remaining: c.time_remaining,
      unlocked_by: c.unlocked_by,
      last_message_sender_id: c.last_message?.sender_id,
      isBlocked,
      isPremium: !!(c.other_user?.is_premium || c.other_user?.is_plus || c.other_user?.is_gold
        || c.other_user?.subscription?.is_active
        || (c.other_user?.subscription?.plan || c.other_user?.subscription?.plan_id || c.other_user?.subscription_plan || '').toLowerCase().includes('plus')
        || (c.other_user?.subscription?.plan || c.other_user?.subscription?.plan_id || c.other_user?.subscription_plan || '').toLowerCase().includes('pro')
        || (c.other_user?.subscription?.plan || c.other_user?.subscription?.plan_id || c.other_user?.subscription_plan || '').toLowerCase().includes('premium')),
    };
  });

  const bookingItemsDetailed = bookings.map(b => {
    const otherId = user?.id === b.companion_id ? b.customer_id : b.companion_id;
    const isBlocked = blockedIds.has(otherId);
    return {
      id: b.id, navId: b.id, type: 'booking',
      name: isBlocked ? 'PlusOneStar User' : (user?.id === b.companion_id ? b.customer_name : b.companion_name),
      pic: isBlocked ? null : (user?.id === b.companion_id ? b.customer_pic : b.companion_pic),
      subtitle: b.event_name || 'Appointment',
      updated_at: b.updated_at, is_accepted: true, isBlocked,
      isPremium: !!(user?.id === b.companion_id
        ? (b.customer_is_premium || b.customer_is_plus)
        : (b.companion_is_premium || b.companion_is_plus)),
    };
  });

  const allItemsProcessed = [...bookingItemsDetailed, ...directItemsDetailed]
    .filter(i => {
      // Auto-unhide if there are new unread messages (new activity overrides the hide)
      if (hiddenIds.has(i.id) && i.unread > 0) {
        unhideId(i.id);
        return true;
      }
      // If the chat implies it was just deleted directly via UI action, hide it.
      if (user?.id && i.deleted_by?.includes(user.id)) return false;
      return !hiddenIds.has(i.id);
    })
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  const isMe = (testId) => testId && user?.id && String(testId) === String(user.id);

  const likeRequests = (receivedLikes || [])
    .filter(l => !mutualIds.has(l.from_user_id))
    .map(l => ({
      id: `like-${l.id}`,
      navId: `profile-${l.from_user_id}`,
      type: 'like_request',
      name: l.from_user_name,
      pic: l.from_user_pic,
      updated_at: l.created_at,
      subtitle: 'Sent you a like!',
      from_user_id: l.from_user_id,
      isPremium: false,
      unread: !l.seen ? 1 : 0
    }));

  const requestItems = [
    ...allItemsProcessed.filter(i => 
      i.type === 'direct' && !i.is_accepted && !isMe(i.unlocked_by) && !isMe(i.last_message_sender_id)
    ),
    ...likeRequests
  ].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  const messageItems = allItemsProcessed;

  const unlockedItems = directItemsDetailed
    .filter(i => {
      // If timer-based unlock has expired, remove from unlocked tab
      if (i.time_remaining !== undefined && i.time_remaining !== null && i.time_remaining <= 0) return false;
      if (i.is_accepted) return true;
      if (isMe(i.unlocked_by)) return isRecent(new Date(i.updated_at)); 
      return false;
    })
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  // Connected = mutual likes + pending sent likes
  const mutualIds_arr = Array.isArray(connectedUsers) ? connectedUsers : [];
  const pendingLikeUsers = Array.isArray(sentLikes) ? sentLikes.filter(l => !mutualIds.has(l.to_user_id || l.id)) : [];

  const q = search.toLowerCase();
  const filterName = (name) => !q || name?.toLowerCase().includes(q);

  const displayList = activeTab === 'connected' ? null
    : activeTab === 'unlocked' ? unlockedItems.filter(i => filterName(i.name) || (i.subtitle || '').toLowerCase().includes(q))
      : activeTab === 'requests' ? requestItems.filter(i => filterName(i.name))
        : messageItems.filter(i => filterName(i.name) || (i.subtitle || '').toLowerCase().includes(q));

  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diff < 1) return 'now';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  const formatCountdown = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };
  const [subTab, setSubTab] = useState('completed');

  const TABS = [
    { id: 'messages', label: 'Chats', count: messageItems.length || 0 },
    { id: 'unlocked', label: 'Unlocked', count: unlockedItems.length || 0 },
    { id: 'requests', label: 'Requests', count: requestItems.length || 0 },
    { id: 'connected', label: 'Connected', count: connectedUsers.length || 0 },
    { id: 'blocked', label: 'Blocked', count: blockedProfiles.length || 0 },
  ];

  const ChatRow = ({ item }) => (
    <div
      onPointerDown={() => {
        if (!isTouchDevice()) return;
        const t = setTimeout(() => {
          setDeleteConfirm(item);
          window.navigator.vibrate?.(40);
        }, 800);
        return () => clearTimeout(t);
      }}
      className="flex items-center gap-2.5 py-2 cursor-pointer group hover:bg-muted/20 -mx-3 px-3 transition-colors active:bg-muted/30 relative"
      data-testid={`chat-item-${item.id}`}
    >
      <div
        className={`relative w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${item.isPremium ? 'bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_10px_rgba(191,149,63,0.3)] p-[2.5px]' : 'p-0'}`}
        onClick={() => {
          if (item.type === 'like_request') navigate(`/browse?view=${item.from_user_id}`);
          else navigate(`/chat/${item.navId}`);
        }}
      >
        <div className={`w-full h-full rounded-full overflow-hidden bg-muted border border-white/5 flex items-center justify-center`}>
          {item.pic
            ? <img src={item.pic} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground/30">
                <User className="w-5 h-5 opacity-40" />
              </div>}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={() => {
        if (item.type === 'like_request') navigate(`/browse?view=${item.from_user_id}`);
        else navigate(`/chat/${item.navId}`);
      }}>
        <div className="flex items-center gap-1.5">
          <p className={`text-[13px] truncate ${item.unread > 0 ? 'font-semibold' : 'font-normal'}`}>{item.name}</p>
          {item.type === 'booking' && !item.isBlocked && (
            <span className="text-[8px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0 leading-none">appt</span>
          )}
          {activeTab === 'unlocked' && item.time_remaining > 0 && (
            <span className="text-[8px] font-black uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full shrink-0 leading-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block animate-pulse" /> {formatCountdown(item.time_remaining)}
            </span>
          )}
          {item.isBlocked && (
            <span className="text-[8px] font-semibold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full shrink-0 leading-none">blocked</span>
          )}
        </div>
        <p className={`text-[11px] truncate mt-0.5 ${item.unread > 0 ? 'text-foreground' : 'text-muted-foreground/60'}`}>
          {item.subtitle || 'Direct Message'} <span className="text-muted-foreground/40">· {formatTime(item.updated_at)}</span>
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 shrink-0">
        {item.unread > 0 && <div className="w-2 h-2 rounded-full bg-blue-500" />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <button className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted">
              <MoreVertical className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 rounded-xl text-xs">
            {activeTab !== 'unlocked' && (
              <DropdownMenuItem className="gap-2 text-rose-500" onClick={e => { e.stopPropagation(); setDeleteConfirm(item); }}>
                <Trash2 className="w-3 h-3" /> Delete
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="gap-2" onClick={e => { e.stopPropagation(); setReportDialog(item); }}>
              <Flag className="w-3 h-3 text-amber-500" /> Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-background pb-24 md:pb-0" data-testid="chat-inbox">
      <Navbar />
      <div className="max-w-xl mx-auto px-3 py-2 space-y-2">

        {/* Header */}
        <div className="flex items-center justify-between pt-2 pb-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight">Messages</h1>
            <button 
              onClick={() => window.location.reload()} 
              className="p-1 rounded-full hover:bg-muted/50 transition-colors"
              title="Refresh messages"
            >
              <Zap className="w-3 h-3 text-amber-500" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50 uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" style={{ color: accentHex }} /> AI Secured
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
          <Input
            placeholder="Search..."
            className="pl-9 h-8 bg-transparent border border-border/10 rounded-xl text-xs focus-visible:ring-0 placeholder:text-muted-foreground/30 shadow-none hover:border-border/20 transition-colors"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 px-1 py-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 py-2 text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? 'text-foreground font-black'
                  : 'text-muted-foreground/40 hover:text-foreground font-bold'
                }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1 py-0.5 rounded-full text-[8px] font-black leading-none ${activeTab === tab.id ? 'bg-foreground/5 text-foreground' : 'bg-muted-foreground/10 text-muted-foreground'
                  }`}>{tab.count}</span>
              )}
              {activeTab === tab.id && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-current rounded-full opacity-60" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" /></div>
          ) : activeTab === 'connected' ? (
            // ── Connected tab ──
            (connectedUsers.length === 0 && pendingLikeUsers.length === 0) ? (
              <div className="py-12 text-center">
                <UserCheck className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/60">No connections yet</p>
                <p className="text-[11px] text-muted-foreground/40 mt-1 px-8">When you and someone mutually like each other, they appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl self-start mb-2 border border-border/5">
                  <button onClick={() => setSubTab('completed')}
                    className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${subTab === 'completed' ? 'bg-background text-foreground/90 shadow-md font-bold ring-1 ring-border/10' : 'text-muted-foreground/40 hover:text-foreground font-semibold'}`}>
                    Completed ({connectedUsers.length})
                  </button>
                  <button onClick={() => setSubTab('pending')}
                    className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${subTab === 'pending' ? 'bg-background text-foreground/90 shadow-md font-bold ring-1 ring-border/10' : 'text-muted-foreground/40 hover:text-foreground font-semibold'}`}>
                    Pending ({pendingLikeUsers.length})
                  </button>
                </div>

                {subTab === 'completed' && connectedUsers.filter(cu => filterName(cu.name)).map(cu => (
                  <div key={cu.id}
                    onPointerDown={() => {
                        const t = setTimeout(() => {
                           setDeleteConfirm({ id: cu.id, name: cu.name, type: 'match' });
                           window.navigator.vibrate?.(40);
                        }, 800);
                        return () => clearTimeout(t);
                    }}
                    className="flex items-center gap-2.5 py-2 cursor-pointer hover:bg-muted/20 -mx-3 px-3 transition-colors active:bg-muted/30"
                  >
                    <div
                      className={`relative w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer ${cu.is_premium || cu.is_plus ? 'bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_10px_rgba(191,149,63,0.3)] p-[2.5px]' : 'border border-border/10 p-0'}`}
                      onClick={() => navigate(`/browse?view=${cu.id}`)}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-muted border border-white/5">
                        {cu.profile_pic
                          ? <img src={cu.profile_pic} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground/40">{cu.name?.charAt(0)}</div>}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => {
                      const ex = directItemsDetailed.find(d => d.other_user_id === cu.id);
                      navigate(ex ? `/chat/${ex.navId}` : `/browse?view=${cu.id}`);
                    }}>
                      <p className="text-[13px] font-normal truncate">{cu.name}</p>
                      <p className="text-[11px] text-muted-foreground/50 truncate">{cu.city || 'Mutual Connection'}</p>
                    </div>
                    <Heart fill="#f43f5e" size={16} className="text-rose-500 shrink-0 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" />
                  </div>
                ))}

                {subTab === 'pending' && pendingLikeUsers.filter(l => filterName(l.to_user_name || l.name)).map(l => (
                  <div key={l.id || l.to_user_id}
                    className="flex items-center gap-2.5 py-2 -mx-3 px-3 opacity-70 cursor-pointer hover:bg-muted/20 transition-all"
                    onClick={() => navigate(`/browse?view=${l.to_user_id || l.id}`)}
                  >
                    <div
                      className={`relative w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${l.to_user_is_premium || l.to_user_is_plus ? 'bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_10px_rgba(191,149,63,0.3)] p-[2.5px]' : 'border border-border/20 p-0'}`}
                      onClick={() => navigate(`/browse?view=${l.to_user_id || l.id}`)}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-muted border border-white/5">
                        {l.to_user_pic
                          ? <img src={l.to_user_pic} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground/40">{(l.to_user_name || l.name)?.charAt(0)}</div>}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-normal truncate">{l.to_user_name || l.name || 'Unknown'}</p>
                      <p className="text-[11px] text-muted-foreground/50">Waiting for response...</p>
                    </div>
                    {/* Half heart = pending */}
                    <HalfHeart size={20} color="#f43f5e" className="shrink-0 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'blocked' ? (
            // ── Blocked tab ──
            <div>
              {/* Unblocked previews (1h window) */}
              {unblockedPreviews.length > 0 && (
                <div className="mb-4 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/70 px-1 mb-2">Unblocked — View window open</p>
                  {unblockedPreviews.filter(p => Date.now() - p.unblockedAt < 3600000).map(p => (
                    <div key={p.id} className="flex items-center gap-2.5 py-2 cursor-pointer hover:bg-muted/20 -mx-3 px-3 transition-colors rounded-xl"
                      onClick={() => navigate(`/browse?view=${p.id}`)}>
                      <div className="relative w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 p-0">
                        <div className="w-full h-full rounded-full overflow-hidden bg-muted flex items-center justify-center">
                          {p.pic ? <img src={p.pic} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-muted-foreground/50">{p.name?.charAt(0)}</span>}
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[7px] font-black px-1 rounded-full border border-white/20 whitespace-nowrap">
                          {formatUnblockCountdown(p.unblockedAt)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-normal truncate">{p.name}</p>
                        <p className="text-[11px] text-emerald-500/70 font-medium">Profile visible · tap to view</p>
                      </div>
                      <Clock className="w-3.5 h-3.5 text-amber-500/60 shrink-0" />
                    </div>
                  ))}
                  <div className="border-t border-border/10 my-2" />
                </div>
              )}

              {/* Blocked profiles */}
              {blockedProfiles.length === 0 ? (
                <div className="py-12 text-center">
                  <Ban className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground/60">No blocked users</p>
                </div>
              ) : (
                blockedProfiles.filter(b => filterName(b.name)).map(b => (
                  <div key={b.id} className="flex items-center gap-2.5 py-2 -mx-3 px-3 transition-colors">
                    {/* Locked avatar — no DP, no photo */}
                    <div className="relative w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-muted/50 border border-border/20 p-0">
                      <span className="text-lg select-none">🔒</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-normal truncate">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground/40 flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5" /> Blocked
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnblock(b)}
                      className="text-[10px] font-bold uppercase tracking-widest text-amber-500 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-full transition-all shrink-0"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : displayList?.length === 0 ? (
            <div className="py-12 text-center">
              {activeTab === 'unlocked'
                ? <Unlock className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                : <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />}
              <p className="text-xs text-muted-foreground/60">
                {activeTab === 'requests' ? 'No new requests' : activeTab === 'unlocked' ? 'No unlocked chats' : search ? 'No results' : 'No messages yet'}
              </p>
              {activeTab === 'messages' && !search && hiddenIds.size > 0 && (
                <button
                  onClick={unhideAll}
                  className="mt-3 text-[10px] font-bold text-accent/70 hover:text-accent transition-colors underline underline-offset-2"
                >
                  Restore {hiddenIds.size} hidden chat{hiddenIds.size > 1 ? 's' : ''}
                </button>
              )}
            </div>
          ) : activeTab === 'unlocked' ? (
            <div className="flex flex-wrap gap-5 px-2 pb-6 pt-2">
              {displayList.map(item => (
                <div key={item.id} className="flex flex-col items-center gap-1.5 group relative">
                  {/* Always gold-framed in unlocked tab */}
                  <div
                    className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_18px_rgba(191,149,63,0.5)] p-[3.5px]"
                    onClick={() => navigate(`/chat/${item.navId}`)}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-muted border border-white/10">
                      {item.pic
                        ? <img src={item.pic} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full bg-muted flex items-center justify-center"><span className="text-xl font-black text-muted-foreground">{(item.name || '?')[0]}</span></div>
                      }
                    </div>
                    {item.unread > 0 && <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-background" />}
                    {item.time_remaining > 0 && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-xl border border-yellow-200 whitespace-nowrap">
                        <span className="w-1 h-1 rounded-full bg-black inline-block animate-pulse shrink-0" />
                        {formatCountdown(item.time_remaining)}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-tight max-w-[64px] text-center truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                    {item.name?.split(' ')[0]}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {displayList.map(item => <ChatRow key={item.id} item={item} />)}
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-xs rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogTitle className="sr-only">Delete Chat</DialogTitle>
            <div className="p-5 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Clear this chat history?</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Messages will be deleted. You can still message them in <strong>Unlocked</strong>.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 rounded-xl text-xs" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button className="flex-1 h-9 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white" onClick={handleDeleteChat}>Delete</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={!!reportDialog} onOpenChange={() => setReportDialog(null)}>
          <DialogContent className="max-w-xs rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogTitle className="sr-only">Report User</DialogTitle>
            <div className="px-5 pt-4 pb-4 text-white" style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Flag className="w-4 h-4 text-red-200" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Report User</h3>
                  <p className="text-white/60 text-[9px] uppercase tracking-wider">Community Safety</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger className="h-9 rounded-xl border-border/10 bg-muted/30 text-xs">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/10">
                  {['Fake profile / Scammer', 'Inappropriate behavior', 'Harassment or Abuse', 'Underage user', 'Other'].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="Details (optional)..." className="rounded-xl border-border/10 bg-muted/30 min-h-[70px] text-xs resize-none" value={reportMessage} onChange={e => setReportMessage(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 rounded-xl text-xs" onClick={() => { setReportDialog(null); setReportCategory(''); setReportMessage(''); }}>Cancel</Button>
                <Button className="flex-1 h-9 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white" onClick={handleReport} disabled={submitting}>
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Report'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Safety note */}
        <p className="text-[9px] text-center text-muted-foreground/40 pb-1">
          🛡️ Be respectful in your conversations. AI monitoring is active.
        </p>
      </div>
    </div>
  );
}
