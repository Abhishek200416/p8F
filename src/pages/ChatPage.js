import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Send, ArrowLeft, Loader2, Shield, ShieldCheck,
  Bot, Calendar, Plus, MoreVertical, Flag, Ban, Trash2,
  X as CloseIcon, Phone, Video,
  PhoneOff, Mic, MicOff, VideoOff, Volume2, Heart,
  Reply, Pencil, Smile, CheckCircle, BadgeCheck, Eye, EyeOff, Unlock, User, MessageSquare, XCircle, Info
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { BookingFormModal } from '@/components/BookingFormModal';
import { CompanionProfileDetail } from '@/components/CompanionProfileDetail';
import EmojiPicker, { Emoji } from 'emoji-picker-react';
import axios from 'axios';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
// Standardized Heart icons
const HalfHeart = ({ className = '', size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09a6.51 6.51 0 0 1 4.5-2.09c3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    <path fill={color} stroke="none" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09V21.35z" />
  </svg>
);


const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';



const DEFAULT_ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const QUICK_REACTIONS = [
  { emo: '❤️', unified: '2764-fe0f' },
  { emo: '😂', unified: '1f602' },
  { emo: '😲', unified: '1f632' },
  { emo: '😢', unified: '1f622' },
  { emo: '🙏', unified: '1f64f' },
  { emo: '🔥', unified: '1f525' }
];

const formatChatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }).toUpperCase();
};

// ── Desktop per-message hover actions ──
const DesktopActions = ({ msg, isMine, isMobile, mode, handleReplyMessage, handleToggleReaction, setShowReportDialog, handleEditMessage, user, activeMenuId, setActiveMenuId }) => {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const isMenuOpen = activeMenuId === msg.id;
  const setIsMenuOpen = (open) => setActiveMenuId(open ? msg.id : null);
  const canEdit = isMine && (new Date() - new Date(msg.created_at)) < (5 * 60 * 1000);
  const hasReactions = msg.reactions?.some(r => r.user_id === user?.id);

  return (
    <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-20 transition-all duration-150 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${isMine ? 'right-full mr-1.5' : 'left-full ml-1.5'}`}>
      <button onClick={() => handleReplyMessage(msg)}
        className="w-6 h-6 rounded-full bg-background border border-border/30 shadow-sm flex items-center justify-center hover:bg-muted"
        title="Reply">
        <Reply className="w-3 h-3 text-muted-foreground" />
      </button>
      <Popover open={isMenuOpen} onOpenChange={(open) => { 
        setIsMenuOpen(open);
        if (!open) setEmojiOpen(false); 
      }}>
        <PopoverTrigger asChild>
          <button className="w-6 h-6 rounded-full bg-background border border-border/30 shadow-sm flex items-center justify-center hover:bg-muted" title="React / More">
            <MoreVertical className="w-3 h-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side={isMine ? 'left' : 'right'}
          align="center"
          sideOffset={6}
          className="w-auto p-2 rounded-2xl shadow-2xl border border-border/20 bg-background/95 backdrop-blur-xl z-[100]"
        >
          {(!emojiOpen || isMobile) && (
            <>
              <div className="flex items-center gap-1.5 pb-2 border-b border-border/10 mb-2">
                {QUICK_REACTIONS.slice(0, 10).map(item => (
                  <button key={item.emo} onClick={() => { handleToggleReaction(msg.id, item.emo); setIsMenuOpen(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-transform hover:scale-110">
                    <Emoji unified={item.unified} emojiStyle="apple" size={24} />
                  </button>
                ))}
                <button onClick={() => setEmojiOpen(true)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors ${emojiOpen ? 'bg-muted' : ''}`}>
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </>
          )}

          {/* PC Emoji picker inside Popover */}
          {emojiOpen && !isMobile && (
            <div onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} className="custom-emoji-picker">
              <EmojiPicker
                onEmojiClick={(d) => { 
                  handleToggleReaction(msg.id, d.emoji); 
                  setEmojiOpen(false);
                  setIsMenuOpen(false);
                }}
                theme={mode === 'dark' ? 'dark' : 'light'}
                emojiStyle="apple"
                skinTonesDisabled={true}
                width={320}
                height={280}
                previewConfig={{ showPreview: false }}
                searchDisabled={false}
              />
            </div>
          )}
          
          {/* Mobile Emoji picker as Bottom Sheet */}
          <AnimatePresence>
            {emojiOpen && isMobile && (
              <div className="fixed inset-0 z-[200] flex flex-col justify-end">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" 
                  onClick={() => { setEmojiOpen(false); setIsMenuOpen(false); }}
                />
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200, mass: 0.8 }}
                  className="relative bg-background w-full shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5"
                  style={{ borderRadius: '20px 20px 0 0' }}
                >
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                  </div>
                  <EmojiPicker
                    onEmojiClick={(d) => { 
                      handleToggleReaction(msg.id, d.emoji); 
                      setEmojiOpen(false);
                      setIsMenuOpen(false);
                    }}
                    theme={mode === 'dark' ? 'dark' : 'light'}
                    emojiStyle="apple"
                    skinTonesDisabled={true}
                    width="100%"
                    height="60vh"
                    previewConfig={{ showPreview: false }}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Actions */}
          {(!emojiOpen || isMobile) && (
            <div className="pt-2 mt-2 border-t border-border/10 space-y-0.5">
              <button onClick={() => { handleReplyMessage(msg); setIsMenuOpen(false); }}
                className="w-full py-1.5 px-3 flex items-center justify-between text-[11px] font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors group">
                Reply <Reply className="w-3 h-3 opacity-40" />
              </button>
              
              {canEdit && (
                <button onClick={() => { handleEditMessage(msg); setIsMenuOpen(false); }}
                  className="w-full py-1.5 px-3 flex items-center justify-between text-[11px] font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors group">
                  Edit Message <Pencil className="w-3 h-3 opacity-40" />
                </button>
              )}

              {hasReactions && (
                <button onClick={() => { handleToggleReaction(msg.id, null); setIsMenuOpen(false); }}
                  className="w-full py-1.5 px-3 flex items-center justify-between text-[11px] font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors group">
                  Remove Reaction <XCircle className="w-3 h-3 opacity-40" />
                </button>
              )}

              <button onClick={() => { setActiveMenuMsg(msg); setShowInfoDialog(true); setActiveMenuId(null); }}
                className="w-full py-1.5 px-3 flex items-center justify-between text-[11px] font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors group">
                Message Info <Info className="w-3 h-3 opacity-40" />
              </button>

              <button onClick={() => { setShowReportDialog(true); setIsMenuOpen(false); }}
                className="w-full py-1.5 px-3 flex items-center gap-2 text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors group">
                <Flag className="w-3 h-3 transition-transform group-hover:scale-110" /> Report Message
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};


const formatTimeAgo = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - d) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  const mins = Math.floor(diffInSeconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

const isTouchDevice = () => ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const isOnlyEmojis = (str) => {
  if (!str) return false;
  const stripped = str.replace(/[\s\n]/g, '');
  if (stripped.length === 0) return false;
  return /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u.test(stripped);
};

const parseUnified = (str) => Array.from(str).map(c => c.codePointAt(0).toString(16)).join('-');
const extractEmojis = (str) => str.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu) || [];
const emojiSplitRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
const emojiTestRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;

const renderTextWithEmojis = (str, emoSize = 22, offset = '3px') => {
  if (!str) return null;
  const parts = str.split(emojiSplitRegex);
  return parts.map((part, index) => {
    if (!part) return null;
    if (emojiTestRegex.test(part)) {
      return (
        <span key={index} className="inline-flex items-center justify-center align-middle mx-[1px]" style={{ transform: `translateY(${offset})`, width: emoSize, height: emoSize }}>
          <Emoji unified={parseUnified(part)} emojiStyle="apple" size={emoSize} />
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export default function ChatPage() {
  const { bookingId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isPro = mode === 'professional';
  const accentHex = isPro ? '#3b82f6' : '#f43f5e';
  const isMobile = isTouchDevice();
  const headers = React.useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Core state
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [activeMenuMsg, setActiveMenuMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isAtBottomRef = useRef(true); // track if user is at bottom
  const inputScrollRef = useRef(null);
  const mirrorScrollRef = useRef(null);

  const syncInputScroll = (e) => {
    if (mirrorScrollRef.current) {
      mirrorScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };
  const prevMsgCountRef = useRef(0);

  // UI state
  const [chatUser, setChatUser] = useState(null);
  const [showPoliciesPopup, setShowPoliciesPopup] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [iceConfig, setIceConfig] = useState(DEFAULT_ICE);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [mutualMatch, setMutualMatch] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [showActive, setShowActive] = useState(localStorage.getItem('chat_show_active') !== 'false');
  const [mobileEmojiOpen, setMobileEmojiOpen] = useState(false);
  const [isAccepted, setIsAccepted] = useState(true);
  const [longPressTimer, setLongPressTimer] = useState(null);

  const [isHoldingId, setIsHoldingId] = useState(null);
  const [showConfirmAccept, setShowConfirmAccept] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [chatTheme, setChatTheme] = useState('pink');
  const [isBlocked, setIsBlocked] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [showApptConfirm, setShowApptConfirm] = useState(null); // { action: 'accept'|'deny', msgId }
  
  // First-time user tooltip state
  const [showTooltip, setShowTooltip] = useState(() => {
    return localStorage.getItem('hasSeenChatTooltip') !== 'true';
  });
  const dismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem('hasSeenChatTooltip', 'true');
  };

  // WebRTC
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState('audio');
  const [callStatus, setCallStatus] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [fullCompanionData, setFullCompanionData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [haveSentLike, setHaveSentLike] = useState(false);
  const [userStatus, setUserStatus] = useState({ online: false, last_seen: null });
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [showLikeConfirm, setShowLikeConfirm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callTimerRef = useRef(null);
  const signalPollRef = useRef(null);
  const wsRef = useRef(null);

  // ── Expiry Timer ──
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          toast.error("Chat session has expired.");
          navigate('/chat');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining, navigate]);

  // ── Security: disable right-click, devtools, print ──
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.key === 'F12') { e.preventDefault(); return; }
      if (e.ctrlKey && e.shiftKey && ['I','J','C','K'].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
      if (e.ctrlKey && ['U','S','P'].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        toast.warning('⚠️ Screenshots are not permitted in this chat.');
        axios.post(`${API}/chat/${bookingId}/screenshot-attempt`, {}, { headers }).catch(() => {});
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, token]);

  // ── Profile fetch (Unified) ──
  useEffect(() => {
    if ((showProfileCard || bookingModalOpen) && chatUser?.id) {
      if (fullCompanionData && fullCompanionData.id === chatUser.id) return; // Already have it
      
      setLoadingProfile(true);
      axios.get(`${API}/users/${chatUser.id}`, { headers })
        .then(res => setFullCompanionData(res.data))
        .finally(() => setLoadingProfile(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProfileCard, bookingModalOpen, chatUser?.id, token]);

  // ── ICE config ──
  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/rtc/ice-servers`, { headers }).then(r => {
      if (r.data?.iceServers) setIceConfig(r.data);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── User status: online / last seen ──
  useEffect(() => {
    if (!token || !chatUser?.id) return;
    const fetchStatus = () => {
      axios.get(`${API}/users/${chatUser.id}/status`, { headers })
        .then(res => setUserStatus(res.data || {}))
        .catch(() => {});
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, chatUser?.id]);

  // ── Connection state (has user liked this person?) ──
  useEffect(() => {
    if (!token || !chatUser?.id) return;
    axios.get(`${API}/likes/sent`, { headers }).then(res => {
      const likesList = res.data.likes || [];
      const sent = likesList.some(l => (l.to_user_id || l.id) === chatUser.id);
      setHaveSentLike(sent);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, chatUser?.id]);


  // ── WebSocket ──
  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    let ws = null;
    let pingInterval = null;

    const connect = () => {
      const wsUrl = API.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
      ws = new WebSocket(`${wsUrl}/api/ws/${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) {
          ws.close();
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          if (event.data === 'pong') return;
          const data = JSON.parse(event.data);
          if ((data.type === 'new_message' || data.type === 'message_edited' || data.type === 'reaction_updated') &&
              (data.booking_id === bookingId || data.conversation_id === bookingId)) {
            fetchMessages();
          } else if (data.type === 'incoming_call' && data.booking_id === bookingId) {
            setIncomingCall(data.signal);
          } else if (data.type === 'screenshot_attempt' && data.booking_id === bookingId) {
            toast.warning('⚠️ The other person attempted a screenshot.');
          }
        } catch {}
      };

      ws.onclose = () => { 
        wsRef.current = null;
      };

      pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 30000);
    };

    connect();

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          // The onopen handler will close it once it opens
        }
      }
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, bookingId]);

  // Fetch conversation detail if we only have bookingId
  useEffect(() => {
    if (!token || !bookingId) return;
    
    const loadDetail = async () => {
      try {
        const res = await axios.get(`${API}/chat/conversations`, { headers });
        const convo = res.data.find(c => c.id === bookingId);
        if (convo) {
            setChatUser(convo.other_user);
            setIsAccepted(convo.is_accepted);
            setChatTheme(convo.theme || 'pink');
            setTimeRemaining(convo.time_remaining);
        }
      } catch {}
    };
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, bookingId]);

  // ── Scroll tracking: know if user is near bottom ──
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distFromBottom < 80;
  };



  const handleAppointmentRequest = () => {
    if (!mutualMatch) {
      // No mutual match: send an appointment request message in chat
      handleSendMessage(null, '📅 APPOINTMENT_REQUEST: I would like to schedule an appointment with you. Please accept or decline.');
      setShowPlusMenu(false);
      toast.success('Appointment request sent!');
      return;
    }
    setBookingModalOpen(true);
    setShowPlusMenu(false);
  };

  const handleApptResponse = async (action, msgId) => {
    setShowApptConfirm({ action, msgId });
  };

  const confirmApptResponse = async () => {
    if (!showApptConfirm) return;
    const { action, msgId } = showApptConfirm;
    try {
      if (action === 'accept') {
        handleSendMessage(null, '✅ APPOINTMENT_ACCEPTED: I have accepted your appointment request!');
        toast.success('Appointment request accepted!');
      } else {
        handleSendMessage(null, '❌ APPOINTMENT_DENIED: I have declined your appointment request.');
        toast.info('Appointment request declined.');
      }
    } catch {
      toast.error('Failed to respond');
    }
    setShowApptConfirm(null);
  };



  // ── Fetch messages ──
  const fetchMessages = async (showLoading = true) => {
    if (showLoading && messages.length === 0) setLoading(true);
    try {
      const res = await axios.get(`${API}/chat/${bookingId}`, { headers });
      const msgs = res.data.messages || res.data || [];
      const newMessages = Array.isArray(msgs) ? msgs : [];
      
      // Only update state if data actually changed to prevent flickering
      if (JSON.stringify(newMessages) !== JSON.stringify(messages)) {
        setMessages(newMessages);
      }
      
      setIsAccepted(res.data.is_accepted ?? true);
      if (res.data.recipient) {
        setChatUser(res.data.recipient);
      } else if (!chatUser) {
        try {
          const convRes = await axios.get(`${API}/chat/conversations`, { headers });
          const convo = (convRes.data || []).find(c => c.id === bookingId);
          if (convo?.other_user) {
            setChatUser(convo.other_user);
          } else if (convo?.participants) {
            const otherId = convo.participants.find(p => p !== user?.id);
            if (otherId) {
              const userRes = await axios.get(`${API}/users/${otherId}`, { headers }).catch(() => null);
              if (userRes?.data) setChatUser(userRes.data);
            }
          }
        } catch {}
      }
    } catch (err) {
      if (err.response?.status === 400) toast.error('Chat only available for accepted requests');
      if (err.response?.status === 403) navigate('/chat');
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // ── Smart auto-scroll: only scroll if user is at bottom or initial load ──
  useEffect(() => {
    const count = messages.length;
    const isInitial = prevMsgCountRef.current === 0 && count > 0;
    const hasNew = count > prevMsgCountRef.current;
    prevMsgCountRef.current = count;

    if ((isInitial || (hasNew && isAtBottomRef.current)) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: isInitial ? 'auto' : 'smooth' });
    }
  }, [messages]);



  // ── Modal class ──
  useEffect(() => {
    const isOpen = !!(bookingModalOpen || showPlusMenu || callActive || showPoliciesPopup);
    if (isOpen) document.documentElement.setAttribute('data-modal-open', 'true');
    else document.documentElement.removeAttribute('data-modal-open');
    return () => document.documentElement.removeAttribute('data-modal-open');
  }, [bookingModalOpen, showPlusMenu, callActive, showPoliciesPopup]);

  // ── Call signal polling ──
  useEffect(() => {
    if (!token || !bookingId) return;
    const poll = async () => {
      try {
        const res = await axios.get(`${API}/call/signals/${bookingId}`, { headers });
        if (res.data && res.data.length > 0) {
          for (const signal of res.data) {
            if (signal.signal_type === 'offer' && !callActive) {
              setIncomingCall(signal);
            } else if (signal.signal_type === 'answer' && peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.data));
              setCallStatus('connected'); startCallTimer();
            } else if (signal.signal_type === 'ice-candidate' && peerConnectionRef.current) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.data));
            } else if (signal.signal_type === 'hangup') {
              endCall(false);
            }
          }
        }
      } catch {}
    };
    signalPollRef.current = setInterval(poll, 2000);
    return () => clearInterval(signalPollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, bookingId, callActive]);

  const audioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);

  const playRingtone = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1); 
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 1);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1);
    osc.stop(ctx.currentTime + 1.2);
  }, []);

  useEffect(() => {
    if (callStatus === 'calling') {
      playRingtone();
      ringIntervalRef.current = setInterval(playRingtone, 4000);
    } else {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    }
    return () => { if (ringIntervalRef.current) clearInterval(ringIntervalRef.current); };
  }, [callStatus, playRingtone]);

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  };
  const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const startCall = async (type) => {
    if (!mutualMatch) { setShowMatchPopup(true); return; }
    try {
      handleSendMessage(null, `📞 Started a ${type} Call. Tap to return.`);
      setCallType(type); setCallActive(true); setCallStatus('calling');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = new RTCPeerConnection(iceConfig);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.ontrack = (event) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]; };
      pc.onicecandidate = async (event) => {
        if (event.candidate)
          await axios.post(`${API}/call/signal`, { booking_id: bookingId, signal_type: 'ice-candidate', call_type: type, data: event.candidate.toJSON() }, { headers });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') { setCallStatus('connected'); startCallTimer(); }
        else if (['disconnected','failed'].includes(pc.connectionState)) endCall(false);
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await axios.post(`${API}/call/signal`, { booking_id: bookingId, signal_type: 'offer', call_type: type, data: offer }, { headers });
      setCallStatus('ringing');
    } catch {
      toast.error('Could not access camera/microphone.');
      setCallActive(false); setCallStatus('idle');
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      setCallType(incomingCall.call_type || 'audio'); setCallActive(true); setCallStatus('connecting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incomingCall.call_type === 'video' });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = new RTCPeerConnection(iceConfig);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.ontrack = (event) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]; };
      pc.onicecandidate = async (event) => {
        if (event.candidate)
          await axios.post(`${API}/call/signal`, { booking_id: bookingId, signal_type: 'ice-candidate', call_type: incomingCall.call_type || 'audio', data: event.candidate.toJSON() }, { headers });
      };
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.data));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await axios.post(`${API}/call/signal`, { booking_id: bookingId, signal_type: 'answer', call_type: incomingCall.call_type || 'audio', data: answer }, { headers });
      setIncomingCall(null); setCallStatus('connected'); startCallTimer();
    } catch {
      toast.error('Could not accept call.');
      setCallActive(false); setCallStatus('idle'); setIncomingCall(null);
    }
  };

  const rejectCall = async () => {
    await axios.post(`${API}/call/signal`, { booking_id: bookingId, signal_type: 'hangup', call_type: 'audio', data: {} }, { headers }).catch(() => {});
    setIncomingCall(null);
  };

  const endCall = useCallback(async (sendSignal = true) => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    if (sendSignal) await axios.post(`${API}/call/hangup/${bookingId}`, {}, { headers }).catch(() => {});
    setCallActive(false); setCallStatus('idle'); setCallDuration(0);
    setIsMuted(false); setIsVideoOff(false); setIncomingCall(null);
  }, [bookingId, headers]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getAudioTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
    }
  };
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getVideoTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsVideoOff(!t.enabled); }
    }
  };

  // ── Message actions ──
  const handleSendMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const content = textOverride || newMsg.trim();
    if (!content) return;
    if (!textOverride) setNewMsg('');
    setSending(!textOverride);
    isAtBottomRef.current = true;
    try {
      if (editingMsg) {
        await axios.put(`${API}/chat/messages/${editingMsg.id}`, { content: content }, { headers });
        setEditingMsg(null);
      } else {
        await axios.post(`${API}/chat/${bookingId}`, { content: content, parent_id: replyingTo?.id || null, type: 'text' }, { headers });
        setReplyingTo(null);
      }
      setNewMsg(''); fetchMessages();
    } catch { toast.error('Failed to send message'); }
    setSending(false);
  };

  const handleToggleReaction = async (messageId, emoji) => {
    try {
      await axios.post(`${API}/chat/messages/${messageId}/reactions`, { emoji }, { headers });
      fetchMessages();
    } catch { toast.error('Failed to react'); }
  };

  const handleEditMessage = (msg) => { setEditingMsg(msg); setNewMsg(msg.content); setReplyingTo(null); };
  const handleReplyMessage = (msg) => { setReplyingTo(msg); setEditingMsg(null); };

  const handleLike = async () => {
    if (!token || !chatUser?.id || sending) return;
    setSending(true);
    try {
      if (haveSentLike) {
         // Unlike
         await axios.delete(`${API}/likes/${chatUser.id}`, { headers });
         setHaveSentLike(false);
         toast.success('Connection Removed');
      } else {
         // Like
         const res = await axios.post(`${API}/likes/${chatUser.id}`, {}, { headers });
         setHaveSentLike(true);
         if (res.data?.is_mutual) {
            setMutualMatch(res.data.matched_user || chatUser);
            setShowMatchAnimation(true);
            setTimeout(() => setShowMatchAnimation(false), 3000);
         }
      }
    } catch (err) {
      toast.info(err.response?.data?.detail || 'Action failed');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async () => {
    try {
      if (isAccepted) {
        // Soft delete (Archive) for Unlocked chats
        const stored = JSON.parse(localStorage.getItem('user_hidden_chat_ids') || '[]');
        if (!stored.includes(bookingId)) {
          localStorage.setItem('user_hidden_chat_ids', JSON.stringify([...stored, bookingId]));
        }
        toast.info('Chat archived.');
      } else {
        // Hard delete for pending requests
        await axios.delete(`${API}/chat/${bookingId}`, { headers }).catch(() => {});
        toast.success('Chat deleted.');
      }
      setShowDeleteConfirm(false); 
      navigate('/chat');
    } catch { 
      toast.info('Chat removed from view.'); 
      navigate('/chat'); 
    }
  };

  const handleSubmitReport = async () => {
    if (!reportCategory) { toast.error('Please select a reason.'); return; }
    setReportSubmitting(true);
    try {
      await axios.post(`${API}/reports`, { reported_user_id: chatUser?.id, reason: reportCategory, details: reportMessage, context: 'chat', conversation_id: bookingId }, { headers });
      toast.success('Report submitted.');
      setShowReportDialog(false); setReportCategory(''); setReportMessage('');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to submit report.'); }
    setReportSubmitting(false);
  };

  const handleAcceptRequest = async () => {
    try {
      await axios.post(`${API}/chat/accept`, { conversation_id: bookingId }, { headers });
      setIsAccepted(true); fetchMessages(); toast.success('Request accepted');
    } catch { toast.error('Failed to accept request'); }
  };

  const formatLastSeen = (dateString, isOnline) => {
    if (isOnline) return 'Active now';
    if (!dateString) return 'Offline';
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    if (diffDays === 0 && now.getDate() === d.getDate()) {
      return `Last seen today at ${timeStr}`;
    } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== d.getDate())) {
      return `Last seen yesterday at ${timeStr}`;
    } else if (diffDays < 7) {
      return `Last seen ${d.toLocaleDateString([], { weekday: 'long' })} at ${timeStr}`;
    } else {
      return `Last seen ${diffDays} days ago`;
    }
  };

  // ── Mobile long-press ──
  const handlePointerDown = (e, msg) => {
    if (!isTouchDevice()) return;
    const timer = setTimeout(() => {
      setActiveMenuMsg(msg);
      window.navigator.vibrate?.(40);
      setLongPressTimer(null);
    }, 800); 
    setLongPressTimer(timer);
  };
  const handlePointerUp = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); }
    setIsHoldingId(null);
  };

  // Double tap to like logic
  const [lastBubbleTap, setLastBubbleTap] = useState({ id: null, time: 0 });
  const handleBubbleInteraction = (msg) => {
    const now = Date.now();
    if (lastBubbleTap.id === msg.id && (now - lastBubbleTap.time) < 500) {
      handleToggleReaction(msg.id, '❤️');
      setLastBubbleTap({ id: null, time: 0 });
    } else {
      setLastBubbleTap({ id: msg.id, time: now });
    }
  };



  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('animate-highlight');
      setTimeout(() => el.classList.remove('animate-highlight'), 1500);
    }
  };

  return (
    <>
      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px) rotate(-1deg); } 75% { transform: translateX(5px) rotate(1deg); } }
        .animation-shake { animation: shake 0.35s ease-in-out 3; }
        @keyframes fly-heart-1 { 0% { transform: translate(-80px, 150px) scale(0) rotate(-20deg); opacity: 0; } 50% { transform: translate(10px, 0px) scale(1.3) rotate(-5deg); opacity: 1; } 100% { transform: translate(40px, -30px) scale(1) rotate(0deg); opacity: 0; } }
        @keyframes fly-heart-2 { 0% { transform: translate(80px, 150px) scale(0) rotate(20deg); opacity: 0; } 50% { transform: translate(-10px, 0px) scale(1.3) rotate(5deg); opacity: 1; } 100% { transform: translate(-40px, -30px) scale(1) rotate(0deg); opacity: 0; } }
        .animate-fly-heart-1 { animation: fly-heart-1 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-fly-heart-2 { animation: fly-heart-2 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @media print { body { visibility: hidden !important; display: none !important; } }
        * { -webkit-user-drag: none !important; user-drag: none !important; }
        .epr-search-container input,
        .epr-preview-container,
        .epr-category-nav,
        .epr-header-overlay,
        .epr-body,
        .EmojiPickerReact {
          border-color: rgba(128, 128, 128, 0.15) !important;
        }

        .dark .EmojiPickerReact.epr-dark-theme,
        .dark .EmojiPickerReact.epr-dark-theme .epr-search-container input,
        .dark .EmojiPickerReact.epr-dark-theme .epr-preview-container,
        .dark .EmojiPickerReact.epr-dark-theme .epr-category-nav,
        .dark .EmojiPickerReact.epr-dark-theme .epr-header-overlay,
        .dark .EmojiPickerReact.epr-dark-theme .epr-body {
          background-color: #0c0c0c !important;
          border-color: rgba(255, 255, 255, 0.05) !important;
          --epr-bg-color: #0c0c0c !important;
          --epr-category-label-bg-color: #0c0c0c !important;
          --epr-picker-border-color: rgba(255, 255, 255, 0.05) !important;
          --epr-search-input-bg-color: #0c0c0c !important;
        }

        .epr-emoji-list::-webkit-scrollbar-thumb {
          background: rgba(128, 128, 128, 0.2) !important;
        }

        .dark .epr-emoji-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1) !important;
        }

        .epr-search-container input::placeholder {
          color: rgba(128, 128, 128, 0.5) !important;
        }

        .dark .epr-search-container input::placeholder {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        img, video { pointer-events: none !important; -webkit-user-select: none !important; user-select: none !important; -webkit-user-drag: none !important; }
        .chat-bubble { -webkit-user-select: none; user-select: none; transition: transform 0.1s ease-out; }
        @keyframes highlight-pulse {
          0% { background: rgba(255,255,255,0); }
          50% { background: rgba(255,255,255,0.08); }
          100% { background: rgba(255,255,255,0); }
        }
        .animate-highlight { animation: highlight-pulse 1s ease-in-out; }
        .thick-heart-shadow { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
      `}</style>

      <div className="h-screen bg-background flex flex-col overflow-hidden" data-testid="chat-page">
        <Navbar />

        {/* ── Policies Popup ── */}
        <Dialog open={showPoliciesPopup} onOpenChange={setShowPoliciesPopup}>
          <DialogContent className="max-w-sm rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">Chat Guidelines</DialogTitle>
            <div className="p-5 space-y-3" style={{ background: `linear-gradient(135deg, ${accentHex}12, transparent)` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" style={{ color: accentHex }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Chat Guidelines</h2>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Safety · Privacy · Respect</p>
                </div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {[
                  { icon: '🛡️', text: 'All messages AI-monitored. Violations lead to bans.' },
                  { icon: '📸', text: 'Screenshots STRICTLY PROHIBITED. Any attempt is logged and the other party is notified.' },
                  { icon: '🚫', text: 'Never share phone numbers, social handles, or personal contact info.' },
                  { icon: '🤝', text: 'Be respectful. No offensive or abusive language.' },
                  { icon: '⚠️', text: '3-Strike Policy: warning → suspension → permanent ban.' },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-background/50 border border-border/10">
                    <span className="text-sm shrink-0">{r.icon}</span>
                    <p className="text-muted-foreground leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => setShowPoliciesPopup(false)} className="w-full h-9 rounded-2xl font-semibold text-xs" style={{ background: accentHex }}>
                I Understand & Accept
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Incoming Call ── */}
        {incomingCall && !callActive && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center animate-in fade-in">
            <div className="text-center space-y-5 p-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse border-4 border-emerald-500/30">
                {chatUser?.profile_pic ? <img src={chatUser.profile_pic} className="w-16 h-16 rounded-full object-cover chat-image" alt="" /> : <Phone className="w-8 h-8 text-emerald-400" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{chatUser?.name || 'Incoming call'}</h2>
                <p className="text-xs text-white/60 uppercase tracking-widest mt-0.5">{incomingCall.call_type === 'video' ? 'Video' : 'Audio'} Call</p>
              </div>
              <div className="flex items-center justify-center gap-6">
                <button onClick={rejectCall} className="w-13 h-13 w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
                  <PhoneOff className="w-5 h-5" />
                </button>
                <button onClick={acceptCall} className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl animate-bounce hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Active Call ── */}
        {callActive && (
          <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 to-black flex flex-col items-center justify-between p-5">
            <div className="flex-1 flex items-center justify-center w-full relative">
              {callType === 'video' ? (
                <>
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full max-h-[60vh] object-cover rounded-3xl bg-black" />
                  <div className="absolute top-4 right-4 w-24 h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center border-4 border-white/5">
                    {chatUser?.profile_pic ? <img src={chatUser.profile_pic} className="w-16 h-16 rounded-full object-cover chat-image" alt="" /> : <Volume2 className="w-8 h-8 text-white/40" />}
                  </div>
                  <h2 className="text-base font-semibold text-white">{chatUser?.name}</h2>
                  <p className="text-xs font-medium text-white/50 uppercase tracking-widest">
                    {callStatus === 'calling' ? 'Calling...' : callStatus === 'ringing' ? 'Ringing...' : callStatus === 'connected' ? formatDuration(callDuration) : 'Connecting...'}
                  </p>
                </div>
              )}
            </div>
            {callType === 'video' && (
              <p className="text-xs font-medium text-white/60 uppercase tracking-widest my-2">
                {callStatus === 'connected' ? formatDuration(callDuration) : callStatus === 'calling' ? 'Calling...' : 'Connecting...'}
              </p>
            )}
            <div className="flex items-center gap-5 py-4">
              <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              {callType === 'video' && (
                <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}
              <button onClick={() => endCall(true)} className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* ── Main Chat Layout ── */}
        <div className="flex-1 flex flex-col min-h-0 max-w-2xl mx-auto w-full">

          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/10 bg-card/80 backdrop-blur-sm shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/chat')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0 flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => { if (chatUser) setShowProfileCard(true); }}>
              <div className="relative shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                  (timeRemaining !== null && timeRemaining > 0)
                    ? 'bg-gradient-to-tr from-emerald-500 via-emerald-400 to-emerald-600 p-[2px]' 
                    : (chatUser?.subscription?.is_active || chatUser?.is_plus || chatUser?.is_premium || chatUser?.is_gold
                      || ['plus', 'premium', 'gold'].includes((chatUser?.role || '').toLowerCase())
                      || (chatUser?.subscription?.plan || '').toLowerCase().includes('plus')
                      || (chatUser?.subscription?.plan || '').toLowerCase().includes('pro')
                      || (chatUser?.subscription?.plan || '').toLowerCase().includes('premium'))
                      ? 'bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] p-[2px]'
                      : 'bg-muted border border-border/20 p-0'
                }`}>
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border border-white/10 bg-zinc-900">
                    {chatUser?.profile_pic
                      ? <img src={chatUser.profile_pic} className="w-full h-full object-cover rounded-full" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">{chatUser?.name?.charAt(0)}</div>}
                  </div>
                </div>
                {showActive && userStatus.online && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <h2 className="text-[10px] font-bold tracking-widest truncate uppercase text-foreground/90">{chatUser?.name || 'Loading...'}</h2>
                </div>
                {showActive ? (
                  <p className={`text-[9px] uppercase tracking-widest ${userStatus.online ? 'text-emerald-500 font-medium' : 'text-muted-foreground/50'}`}>
                    {formatLastSeen(userStatus.last_seen, userStatus.online)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Voice call — icon only, no background */}
              <button
                onClick={() => startCall('audio')}
                title="Voice Call"
                className="w-8 h-8 flex items-center justify-center text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <Phone className="w-4 h-4" strokeWidth={2} />
              </button>
              {/* Video call — icon only, no background */}
              <button
                onClick={() => startCall('video')}
                title="Video Call"
                className="w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-400 transition-colors"
              >
                <Video className="w-4 h-4" strokeWidth={2} />
              </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-2xl p-1.5 shadow-2xl border-border/10">
                      <DropdownMenuItem className="gap-2 text-rose-500 font-semibold" onClick={async () => {
                        try {
                          const res = await axios.post(`${API}/likes/${chatUser?.id}`, {}, { headers });
                          if (res.data?.is_mutual) { setMutualMatch(res.data.matched_user || chatUser); setHaveSentLike(true); }
                          else { setHaveSentLike(true); toast.success('Connect request sent!'); }
                        } catch (e) { toast.info(e.response?.data?.detail || 'Already connected'); }
                      }}>
                        {haveSentLike ? <Heart fill size={14} className="text-rose-500" /> : <Heart size={14} className="text-rose-500" />}
                        {haveSentLike ? 'Connection Pending' : 'Send Connect Request'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      
                      {/* Theme Options */}
                      <div className="px-2 py-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2 ml-1">Chat Theme</p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['pink', 'blue', 'purple', 'gold'].map(t => (
                            <button
                              key={t}
                              onClick={async () => {
                                setChatTheme(t);
                                try { await axios.put(`${API}/chat/${bookingId}/theme`, { theme: t }, { headers }); } catch {}
                              }}
                              className={`w-full aspect-square rounded-lg transition-all border-2 ${chatTheme === t ? 'border-primary shadow-lg scale-110' : 'border-transparent opacity-60'}`}
                              style={{ 
                                background: t === 'pink' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' :
                                            t === 'blue' ? 'linear-gradient(135deg, #3b82f6, #2dd4bf)' :
                                            t === 'purple' ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' :
                                            'linear-gradient(135deg, #f59e0b, #d97706)'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2" onClick={() => {
                        const next = !showActive;
                        setShowActive(next);
                        localStorage.setItem('chat_show_active', next.toString());
                      }}>
                        {showActive ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                        {showActive ? 'Hide Online Status' : 'Show Online Status'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2" onClick={() => setShowReportDialog(true)}>
                        <Flag className="w-3.5 h-3.5 text-rose-500" /> Report User
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => setIsBlocked(true)}>
                        <Ban className="w-3.5 h-3.5 text-rose-500" /> Block Conversation
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!isAccepted && (
                        <DropdownMenuItem className="gap-2 text-rose-500 font-medium" onClick={() => setShowDeleteConfirm(true)}>
                          <Trash2 className="w-3.5 h-3.5" /> Delete Chat
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
            </div>
          </div>



          {/* Messages scroll area */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto no-scrollbar min-h-0 py-2"
            style={{ overscrollBehavior: 'contain' }}
          >
                        {/* Announcement & Profile Header */}
                        {showAnnouncement && (
                            <div className="px-6 py-8 flex flex-col items-center text-center animate-in fade-in duration-700">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${ 
                                  (chatUser?.subscription?.is_active || chatUser?.is_plus || chatUser?.is_premium || chatUser?.is_gold
                                  || ['plus', 'premium', 'gold'].includes((chatUser?.role || '').toLowerCase())
                                  || (chatUser?.subscription?.plan || '').toLowerCase().includes('plus')
                                  || (chatUser?.subscription?.plan || '').toLowerCase().includes('pro')
                                  || (chatUser?.subscription?.plan || '').toLowerCase().includes('premium'))
                                  ? 'bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_20px_rgba(191,149,63,0.4)] p-[4px]' : 'p-0'}`}>
                                    <div className="w-full h-full rounded-full overflow-hidden bg-background border border-white/10">
                                        {chatUser?.profile_pic ? (
                                            <img src={chatUser.profile_pic} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                                <Bot className="w-10 h-10 text-muted-foreground/40" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-[10px] font-bold tracking-widest mt-2 uppercase">{chatUser?.name || 'Someone'}</h3>
                                <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                                    PlusOneStar Chat. Stay respectful and enjoy your meaningful connection.
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="mt-4 h-8 rounded-full text-[10px] font-bold px-4 hover:bg-accent/10"
                                    onClick={() => setShowProfileCard(true)}
                                >
                                    View Profile
                                </Button>
                                
                                <div className="w-full max-w-[260px] p-3 rounded-2xl bg-muted/20 border border-border/5 mt-8 text-center">
                                    <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
                                        <span className="font-bold">Chat Policy</span>: Use of contact info, vulgarity, or harassment results in immediate strike/ban. Screenshots are restricted.
                                    </p>
                                </div>
                            </div>
                        )}

                        {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
                <div className="w-20 h-20 rounded-full bg-accent/5 flex items-center justify-center mb-6 ring-1 ring-accent/10">
                  <MessageSquare className="w-10 h-10 text-accent/20" />
                </div>
                <h3 className="text-sm font-black tracking-tight mb-2">Start a Connection</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[240px]">
                  Say hello and break the ice! All conversations are secured with end-to-end AI monitoring.
                </p>
              </div>
            ) : (() => {
              const valid = messages.filter(m => m && m.id);
              const lastIdx = valid.length - 1;
              return valid.map((msg, index) => {
                const isMine = msg.sender_id === user?.id;
                const prevMsg = valid[index - 1];
                const nextMsg = valid[index + 1];
                const isSystem = msg.type === 'system';
                
                const showDate = !prevMsg || new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString();

                const isFirstOfGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id || prevMsg.type === 'system' || showDate;
                const isLastOfGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id || nextMsg.type === 'system' || (new Date(nextMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString());
                const emojiOnly = isOnlyEmojis(msg.content);

                // System messages
                if (isSystem) return (
                  <div key={msg.id} className="flex justify-center py-1">
                    <p className="text-[9px] text-muted-foreground/25 select-none max-w-xs text-center">
                      {msg.content}
                    </p>
                  </div>
                );

                // Appointment Request messages
                const isApptRequest = msg.content?.includes('APPOINTMENT_REQUEST:');
                const isApptAccepted = msg.content?.includes('APPOINTMENT_ACCEPTED:');
                const isApptDenied = msg.content?.includes('APPOINTMENT_DENIED:');
                
                if (isApptRequest || isApptAccepted || isApptDenied) {
                  return (
                    <div key={msg.id} className="flex justify-center py-3 px-4">
                      <div className={`max-w-[300px] w-full rounded-2xl border p-4 space-y-3 ${
                        isApptAccepted ? 'bg-emerald-500/5 border-emerald-500/20' :
                        isApptDenied ? 'bg-rose-500/5 border-rose-500/20' :
                        'bg-amber-500/5 border-amber-500/20'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isApptAccepted ? 'bg-emerald-500/20' :
                            isApptDenied ? 'bg-rose-500/20' :
                            'bg-amber-500/20'
                          }`}>
                            <Calendar className={`w-4 h-4 ${
                              isApptAccepted ? 'text-emerald-500' :
                              isApptDenied ? 'text-rose-500' :
                              'text-amber-500'
                            }`} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              {isApptAccepted ? 'Accepted' : isApptDenied ? 'Declined' : 'Appointment Request'}
                            </p>
                            <p className="text-[9px] text-muted-foreground/40">{formatTimeAgo(msg.created_at)}</p>
                          </div>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          {isApptRequest ? `${isMine ? 'You' : chatUser?.name || 'They'} would like to schedule an appointment.` :
                           isApptAccepted ? `${isMine ? 'You' : chatUser?.name || 'They'} accepted the appointment request!` :
                           `${isMine ? 'You' : chatUser?.name || 'They'} declined the appointment request.`}
                        </p>
                        {/* Show accept/deny buttons only for recipient of the request */}
                        {isApptRequest && !isMine && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleApptResponse('accept', msg.id)}
                              className="flex-1 h-9 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors active:scale-95"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleApptResponse('deny', msg.id)}
                              className="flex-1 h-9 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500/20 transition-colors active:scale-95"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Bubble corner radius
                let br = 'rounded-[1.25rem]';
                if (isMine) {
                  if (isFirstOfGroup && !isLastOfGroup) br = 'rounded-[1.25rem] rounded-br-sm';
                  else if (!isFirstOfGroup && isLastOfGroup) br = 'rounded-[1.25rem] rounded-tr-sm';
                  else if (!isFirstOfGroup && !isLastOfGroup) br = 'rounded-[1.25rem] rounded-r-md';
                } else {
                  if (isFirstOfGroup && !isLastOfGroup) br = 'rounded-[1.25rem] rounded-bl-sm';
                  else if (!isFirstOfGroup && isLastOfGroup) br = 'rounded-[1.25rem] rounded-tl-sm';
                  else if (!isFirstOfGroup && !isLastOfGroup) br = 'rounded-[1.25rem] rounded-l-md';
                }

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-8 sticky top-0 z-10 pointer-events-none">
                        <span className="bg-background/40 backdrop-blur-md px-4 py-1 rounded-full text-[9px] font-black tracking-[0.2em] uppercase text-muted-foreground/50 border border-border/5">
                          {formatChatDate(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} px-3 ${isFirstOfGroup ? 'mt-2' : 'mt-0.5'} relative`}
                      onPointerDown={(e) => handlePointerDown(e, msg)}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      onContextMenu={(e) => {
                        if (isMobile) {
                          e.preventDefault();
                          handlePointerDown(e, msg);
                        }
                      }}
                    >
                    {/* Swipe to Reply Indicator behind message */}
                    {!isMine && (
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-drag-reply transition-opacity">
                        <Reply className="w-4 h-4 text-accent" />
                      </div>
                    )}

                    <motion.div 
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.15}
                      onDragEnd={(e, { offset }) => {
                        if (Math.abs(offset.x) > 80) {
                          handleReplyMessage(msg);
                          window.navigator.vibrate?.(40);
                        }
                      }}
                      className={`flex items-end gap-1.5 max-w-[85%] md:max-w-[70%] relative group transition-transform duration-75`}
                    >
                      {/* Avatar — other user */}
                      {!isMine && (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all duration-500 ${(chatUser?.subscription?.is_active || chatUser?.is_plus || chatUser?.is_premium || chatUser?.is_gold || ['plus', 'premium', 'gold'].includes((chatUser?.role || '').toLowerCase()) || (chatUser?.subscription?.plan || '').toLowerCase().includes('plus') || (chatUser?.subscription?.plan || '').toLowerCase().includes('pro') || (chatUser?.subscription?.plan || '').toLowerCase().includes('premium')) ? 'bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] p-[1.5px] shadow-[0_0_8px_rgba(191,149,63,0.3)]' : 'p-0'}`} style={{ opacity: isLastOfGroup ? 1 : 0 }}>
                          <div className="w-full h-full rounded-full overflow-hidden bg-background border-[0.5px] border-white/5">
                            {chatUser?.profile_pic
                              ? <img src={chatUser.profile_pic} className="w-full h-full object-cover chat-image" alt="" />
                              : <div className="w-full h-full bg-muted flex items-center justify-center text-[8px] font-medium">{chatUser?.name?.charAt(0)}</div>}
                          </div>
                        </div>
                      )}

                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} relative`}>
                        {/* Desktop hover actions */}
                        {!isTouchDevice() && (
                          <DesktopActions 
                            msg={msg} 
                            isMine={isMine} 
                            isMobile={isMobile}
                            mode={mode}
                            handleReplyMessage={handleReplyMessage}
                            handleToggleReaction={handleToggleReaction}
                            setShowReportDialog={setShowReportDialog}
                            handleEditMessage={handleEditMessage}
                            user={user}
                            activeMenuId={activeMenuId}
                            setActiveMenuId={setActiveMenuId}
                          />
                        )}

                        {/* Bubble */}
                         <div 
                           className={`chat-bubble relative cursor-pointer ${
                             emojiOnly
                               ? 'bg-transparent py-0.5 px-0.5'
                               : isMine
                                 ? `theme-bubble-${chatTheme || 'pink'} ${br} px-3.5 py-2 shadow-sm`
                                 : `bg-muted/60 dark:bg-zinc-800/70 text-foreground ${br} px-3.5 py-2`
                           }`} 
                           id={`msg-${msg.id}`}
                           onClick={() => handleBubbleInteraction(msg)}
                         >
                          {msg.parent_msg && (
                            <div 
                              onClick={() => scrollToMessage(msg.parent_id)}
                              className="mb-1.5 pl-2 border-l-2 border-white/40 text-[10px] opacity-70 max-w-[180px] break-words whitespace-pre-wrap cursor-pointer hover:opacity-100 transition-opacity"
                            >
                              {renderTextWithEmojis(msg.parent_msg.content, 12)}
                            </div>
                          )}
                          {emojiOnly
                            ? <div className="flex flex-wrap gap-1 items-center justify-center">
                                {extractEmojis(msg.content.trim()).map((emo, idx) => (
                                  <Emoji key={idx} unified={parseUnified(emo)} emojiStyle="apple" size={44} />
                                ))}
                              </div>
                            : <div className="space-y-0.5 relative pb-3 min-w-[60px]">
                                <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words font-normal">
                                  {renderTextWithEmojis(msg.content)}
                                </p>
                                
                                <div className="absolute bottom-0 right-0 flex items-center gap-1.5 select-none pointer-events-none">
                                  {msg.is_edited && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button className="text-[8px] font-bold text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors uppercase tracking-widest pointer-events-auto">
                                          (edited)
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="p-3 w-64 rounded-xl shadow-2xl bg-background/95 backdrop-blur-xl border-border/20">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Original Message</h4>
                                        <p className="text-xs leading-relaxed opacity-70 italic">"{msg.original_content || msg.content}"</p>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                  <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </p>
                                </div>
                              </div>
                          }
                          

                          {/* Side reveal time side-by-side (Instagram style) */}
                          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-40 transition-opacity hidden md:block">
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                             </p>
                          </div>
                        </div>

                        {/* Reactions */}
                        {msg.reactions?.length > 0 && (
                          <div className={`flex gap-0.5 mt-[-4px] z-10 ${isMine ? 'mr-1' : 'ml-1'}`}>
                            {msg.reactions.map((r, i) => (
                              <span key={i} className="bg-background border border-border/20 rounded-full px-1 py-0.5 shadow-sm text-[11px] leading-none flex items-center justify-center">
                                <Emoji unified={parseUnified(r.emoji)} emojiStyle="apple" size={14} />
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Read status outside bubble */}
                        {isMine && isLastOfGroup && isAccepted && (
                          <div className="mt-1 flex items-center gap-1 opacity-25 select-none px-1 h-3 self-end">
                            {msg.read ? (
                                <span className="text-[7.5px] font-black tracking-widest uppercase text-muted-foreground mr-1">
                                  Seen {formatTimeAgo(msg.read_at || msg.created_at)}
                                </span>
                            ) : (
                                <span className="text-[7.5px] font-black tracking-widest uppercase text-muted-foreground mr-1">
                                  Sent {formatTimeAgo(msg.created_at)}
                                </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </React.Fragment>
                );
              });
            })()}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Plus Menu */}
          {showPlusMenu && (
            <div className="px-3 py-2 bg-muted/20 border-t border-border/10 animate-in slide-in-from-bottom-2 shrink-0">
              <button
                onClick={handleAppointmentRequest}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-background border border-border/20 hover:border-pink-500/40 hover:bg-pink-500/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold">Book an Appointment</p>
                  <p className="text-[10px] text-muted-foreground">Send a formal meeting request</p>
                </div>
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="px-3 py-2 flex flex-col gap-1.5 bg-transparent shrink-0">
            {!isAccepted ? (
              <div className="space-y-2.5 py-1">
                <div className="text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-widest">Message Request</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">The sender won't know you've seen this until you accept.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-9 rounded-2xl text-xs text-rose-500 border-rose-500/20" onClick={() => navigate('/chat')}>Delete</Button>
                  <Button className="flex-[2] h-9 rounded-2xl font-semibold bg-blue-500 hover:bg-blue-600 text-white text-xs" onClick={handleAcceptRequest}>Accept Request</Button>
                </div>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {showTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-[60px] left-4 right-4 sm:left-auto sm:right-4 sm:w-64 z-50 p-4 rounded-[1.5rem] border border-accent/20 bg-card/95 backdrop-blur-xl shadow-2xl"
                    >
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-10 w-4 h-4 bg-card border-b border-r border-accent/20 rotate-45" />
                      <div className="flex gap-3 items-start relative z-10">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex-1 space-y-1 mt-0.5">
                          <h4 className="text-xs font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Start Chatting!</h4>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Type a nice message below to break the ice. Remember to be respectful!
                          </p>
                          <Button onClick={dismissTooltip} className="w-full h-8 mt-2 rounded-xl font-bold bg-accent text-white border-none text-[10px]">
                            Got it
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {(replyingTo || editingMsg) && (
                  <div className="px-2.5 py-1.5 rounded-2xl bg-muted/40 border border-border/10 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-1 blur-in">
                    <div className="min-w-0 border-l-2 border-primary/40 pl-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-primary">
                        {editingMsg ? 'Editing Message' : `Replying to ${replyingTo?.sender_name || 'them'}`}
                      </p>
                      <p className="text-[11px] truncate opacity-80 font-medium">
                        {editingMsg ? editingMsg.content : replyingTo?.content}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full shrink-0 hover:bg-muted" onClick={() => { setEditingMsg(null); setReplyingTo(null); }}>
                      <CloseIcon className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 p-1.5 px-2 relative z-50">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 shrink-0 rounded-full bg-transparent hover:bg-white/5 transition-all duration-300 ${showPlusMenu ? 'rotate-45 opacity-60' : ''}`} 
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>

                  <div className={`flex-1 h-10 bg-transparent border border-border/10 rounded-full px-4 flex items-center gap-2 transition-all duration-300 relative ${
                    mobileEmojiOpen ? 'ring-1 ring-accent/30' : ''
                  }`}>
                    {/* Ghost Mirror Layer (renders Apple Emojis) */}
                    <div 
                      ref={mirrorScrollRef}
                      className="absolute inset-y-0 left-4 right-4 flex items-center pointer-events-none whitespace-nowrap overflow-hidden"
                      style={{ 
                        fontFamily: EMOJI_FONT,
                        fontSize: '15px',
                        lineHeight: '1',
                        color: 'inherit'
                      }}
                    >
                      <span className="opacity-0 invisible">{newMsg ? '' : 'Message...'}</span>
                      {renderTextWithEmojis(newMsg, 18, '1px')}
                      {/* Cursor space buffer */}
                      <span className="w-10 shrink-0" />
                    </div>

                    <Input
                      id="chat-input"
                      ref={inputScrollRef}
                      placeholder={newMsg ? "" : "Message..."}
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onScroll={syncInputScroll}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      onFocus={() => setMobileEmojiOpen(false)}
                      className="flex-1 bg-transparent border-none shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ring-0 outline-none h-full p-0 font-medium placeholder:text-muted-foreground/30 relative z-10 text-transparent caret-foreground selection:bg-accent/30 selection:text-transparent selection:[-webkit-text-fill-color:transparent]"
                      style={{ 
                        fontFamily: EMOJI_FONT,
                        fontSize: '15px',
                        lineHeight: '1',
                        WebkitTextFillColor: 'transparent'
                      }}
                    />
                    {/* Emoji trigger button */}
                    <button 
                        type="button" 
                        className={`text-muted-foreground/30 hover:text-muted-foreground shrink-0 p-0.5 transition-colors ${mobileEmojiOpen ? 'text-accent' : ''}`}
                        onClick={() => setMobileEmojiOpen(!mobileEmojiOpen)}
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* MOBILE: Full-width bottom sheet — no clipping, no overflow */}
                    {isMobile && mobileEmojiOpen && (
                      <div className="fixed inset-0 z-[300] flex flex-col justify-end" style={{ pointerEvents: 'all' }}>
                        {/* Backdrop */}
                        <div 
                          className="absolute inset-0 bg-black/40"
                          onClick={() => setMobileEmojiOpen(false)}
                        />
                        {/* Bottom sheet — full width, slides from bottom */}
                        <div 
                          className="relative w-full"
                          style={{ background: mode === 'dark' ? '#111' : '#fff', borderRadius: '20px 20px 0 0', paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Drag handle */}
                          <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-gray-400/40" />
                          </div>
                          <EmojiPicker
                            onEmojiClick={(emoji) => {
                              setNewMsg(prev => prev + emoji.emoji);
                              setMobileEmojiOpen(false);
                            }}
                            autoFocusSearch={false}
                            theme={mode === 'dark' ? 'dark' : 'light'}
                            emojiStyle="apple"
                            previewConfig={{ showPreview: false }}
                            skinTonesDisabled
                            width="100%"
                            height="55vh"
                          />
                        </div>
                      </div>
                    )}

                    {/* DESKTOP: Popover */}
                    {!isMobile && (
                      <Popover open={mobileEmojiOpen} onOpenChange={setMobileEmojiOpen}>
                        <PopoverTrigger asChild><span /></PopoverTrigger>
                        <PopoverContent
                          side="top" align="center"
                          sideOffset={14}
                          collisionPadding={16}
                          className="p-0 border-none bg-transparent custom-emoji-picker mb-2 shadow-2xl z-[9999]"
                          style={{ width: '350px' }}
                        >
                          <div onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                            <EmojiPicker
                              onEmojiClick={(emoji) => {
                                setNewMsg(prev => prev + emoji.emoji);
                                setMobileEmojiOpen(false);
                              }}
                              autoFocusSearch={false}
                              theme={mode === 'dark' ? 'dark' : 'light'}
                              emojiStyle="apple"
                              emojiSize={16}
                              emojiButtonSize={26}
                              previewConfig={{ showPreview: false }}
                              skinTonesDisabled
                              width="100%"
                              height={320}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  
                  {newMsg.trim() ? (
                    <Button type="submit" disabled={sending} className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white p-0 shrink-0 shadow-md flex items-center justify-center transition-all active:scale-90">
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleLike} 
                      onContextMenu={(e) => { e.preventDefault(); setShowLikeConfirm(true); }}
                      className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center bg-transparent hover:bg-white/5 transition-all active:scale-95 ${mutualMatch ? 'animate-heart-bloom' : ''}`}
                    >
                      {mutualMatch ? (
                        <Heart fill="#f43f5e" size={19} className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                      ) : haveSentLike ? (
                        <HalfHeart size={19} color="#f43f5e" className="drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                      ) : (
                        <Heart size={19} className="text-muted-foreground/30" />
                      )}
                    </button>
                  )}
                </form>
              </>
            )}

            {/* Blocked State Overlay */}
            {isBlocked && (
              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
                  <Ban className="w-10 h-10 text-rose-500" />
                </div>
                <h3 className="text-lg font-black tracking-tight mb-2">Conversation Blocked</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-8">
                  You have blocked this user or been blocked. To protect our community, messages cannot be sent or received during a block.
                </p>
                <div className="flex gap-3 w-full max-w-[240px]">
                   <Button variant="outline" className="flex-1 h-10 rounded-2xl text-xs font-bold" onClick={() => navigate('/chat')}>Go Back</Button>
                   <Button className="flex-1 h-10 rounded-2xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white" onClick={() => setIsBlocked(false)}>Unblock</Button>
                </div>
              </div>
            )}

            {/* Expired State Overlay */}
            {timeRemaining !== null && timeRemaining <= 0 && !isAccepted && (
              <div className="absolute inset-0 z-[60] bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-8 border border-amber-500/20">
                  <Lock className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-3 text-white">Window Expired</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mb-10">
                  Your 24-hour chat window with <b>{chatUser?.name}</b> has closed. Access to this chat has been locked.
                </p>
                <div className="flex flex-col gap-4 w-full max-w-[240px]">
                   <Button 
                    className="w-full h-14 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/20"
                    onClick={() => navigate(`/browse?view=${chatUser?.id}`)}
                   >
                     Re-unlock Connection
                   </Button>
                   <Button variant="ghost" className="w-full h-12 rounded-2xl text-xs font-bold text-zinc-500" onClick={() => navigate('/chat')}>Return to Inbox</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile long-press context menu ── */}
        <Dialog open={!!activeMenuMsg} onOpenChange={(open) => { if (!open) { setActiveMenuMsg(null); setMobileEmojiOpen(false); } }}>
          <DialogContent 
            className="max-w-md w-[96vw] mx-auto rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-zinc-900/80 backdrop-blur-3xl [&>button]:hidden focus:outline-none"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogTitle className="sr-only">Message Actions</DialogTitle>
            <div className="p-3 space-y-2.5">
              {mobileEmojiOpen ? (
                <div className={`rounded-2xl overflow-hidden shadow-2xl ${mode === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
                  <div className="flex justify-between items-center px-4 py-3 border-b border-border/10">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Choose Reaction</span>
                    <button onClick={() => setMobileEmojiOpen(false)} className="p-1 hover:bg-muted rounded-full">
                      <CloseIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <EmojiPicker
                    emojiStyle="apple"
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                    autoFocusSearch={false}
                    width="100%"
                    height={Math.min(window.innerHeight * 0.62, 480)}
                    theme={mode === 'dark' ? 'dark' : 'light'}
                    onEmojiClick={(d) => { handleToggleReaction(activeMenuMsg.id, d.emoji); setMobileEmojiOpen(false); setActiveMenuMsg(null); }}
                  />
                </div>
              ) : (
                <>
                  <div className="px-2 pt-2 pb-1 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between">
                      {QUICK_REACTIONS.map(item => (
                        <button key={item.emo} onClick={() => { handleToggleReaction(activeMenuMsg.id, item.emo); setActiveMenuMsg(null); }}
                          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-white/10 transition-transform active:scale-110">
                          <Emoji unified={item.unified} emojiStyle="apple" size={30} />
                        </button>
                      ))}
                      <button onClick={() => setMobileEmojiOpen(true)}
                          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/5 mx-1 hover:bg-white/10 transition-colors border border-white/5">
                          <Plus className="w-5 h-5 text-white/50" />
                      </button>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="bg-white/10 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5 mt-4">
                    <button onClick={() => { handleReplyMessage(activeMenuMsg); setActiveMenuMsg(null); }}
                      className="w-full py-3.5 px-5 flex items-center justify-between text-white hover:bg-white/5 transition-colors">
                      <span className="text-[13px] font-medium">Reply</span><Reply className="w-4 h-4 opacity-40" />
                    </button>
                      <button onClick={() => { setShowInfoDialog(true); }}
                        className="w-full py-3.5 px-5 flex items-center justify-between text-white hover:bg-white/5 transition-colors">
                        <span className="text-[13px] font-medium">Message Info</span><Info className="w-4 h-4 opacity-40" />
                      </button>
                    {activeMenuMsg?.sender_id === user?.id && (new Date() - new Date(activeMenuMsg.created_at)) < (5 * 60 * 1000) && (
                      <button onClick={() => { handleEditMessage(activeMenuMsg); setActiveMenuMsg(null); }}
                        className="w-full py-3.5 px-5 flex items-center justify-between text-white hover:bg-white/5 transition-colors">
                        <span className="text-[13px] font-medium">Edit Message</span><Pencil className="w-4 h-4 opacity-40" />
                      </button>
                    )}
                    {activeMenuMsg?.reactions?.some(r => r.user_id === user?.id) && (
                      <button onClick={() => { handleToggleReaction(activeMenuMsg.id, null); setActiveMenuMsg(null); }}
                        className="w-full py-3.5 px-5 flex items-center justify-between text-rose-400 hover:bg-rose-500/10 transition-colors">
                        <span className="text-[13px] font-bold">Remove My Reaction</span><XCircle className="w-4 h-4 opacity-70" />
                      </button>
                    )}
                    <div className="py-2 px-5 bg-white/[0.02]">
                       <button onClick={() => { setShowReportDialog(true); setActiveMenuMsg(null); }}
                         className="w-full py-2.5 flex items-center justify-between text-rose-400 hover:text-rose-300 transition-colors">
                         <span className="text-[13px] font-bold">Report Message</span><Flag className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>


        {/* BookingFormModal */}
        <BookingFormModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)}
          companion={fullCompanionData || chatUser} token={token} initialMode={isPro ? 'professional' : 'casual'} />

        {/* Delete Confirmation */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-sm rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogTitle className="sr-only">Delete Chat</DialogTitle>
            <div className="p-5 text-center space-y-3">
              <div className="w-11 h-11 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Delete Chat?</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Removes from your view. The other person's copy remains.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 rounded-xl text-xs" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button className="flex-1 h-9 rounded-xl text-xs font-semibold" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={handleDeleteChat}>Delete</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Match Required Popup */}
        <Dialog open={showMatchPopup} onOpenChange={setShowMatchPopup}>
          <DialogContent className="max-w-[300px] rounded-[2rem] p-6 text-center border-none shadow-2xl bg-zinc-900/95 backdrop-blur-xl">
            <DialogTitle className="sr-only">Match Required</DialogTitle>
            <div className="w-16 h-16 bg-rose-500/10 rounded-full mx-auto flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            </div>
            <h3 className="text-[17px] font-bold text-white mb-2">Mutual Connection</h3>
            <p className="text-[13px] text-white/70 leading-relaxed mb-6">
              Audio Calls and Video Calls unlock automatically when both of you Like each other.
            </p>
            <div className="text-xs text-white/50 bg-white/5 p-3.5 flex flex-col gap-2.5 rounded-xl mb-6 text-left">
              <div className="flex gap-2 items-start"><Heart className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" /> <span>If they swiped Right on you, you'll see a pink border Request.</span></div>
              <div className="flex gap-2 items-start"><Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0 mt-0.5" /> <span>Tap the heart icon in the chat bar below to like them back!</span></div>
            </div>
            <Button className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 py-5 text-[15px] font-semibold shadow-lg hover:opacity-90" onClick={() => setShowMatchPopup(false)}>
              Got it
            </Button>
          </DialogContent>
        </Dialog>

        {/* Match Animation Overlay */}
        {showMatchAnimation && (
          <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center animation-shake">
            <div className="absolute inset-0 bg-rose-500/10 backdrop-blur-sm animate-in fade-in duration-300" />
            <div className="relative w-48 h-48 flex items-center justify-center scale-150">
              <Heart className="w-24 h-24 text-rose-500 fill-rose-500 absolute animate-fly-heart-1 drop-shadow-2xl" />
              <Heart className="w-24 h-24 text-pink-500 fill-pink-500 absolute animate-fly-heart-2 drop-shadow-2xl" />
            </div>
          </div>
        )}

        {/* Message Info Dialog */}
        <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
          <DialogContent className="max-w-[320px] rounded-[2.5rem] p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/10 shadow-2xl">
            <DialogTitle className="sr-only">Message Information</DialogTitle>
            <div className="p-6">
              <div className="flex flex-col items-center gap-4 text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center shadow-inner">
                  <Info className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-[0.2em]">Message Info</h3>
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase mt-1">Delivery details</p>
                </div>
              </div>

              {activeMenuMsg && (
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-[1.5rem] p-5 space-y-4 border border-border/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Sent Date</span>
                      </div>
                      <span className="text-xs font-bold">{new Date(activeMenuMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Sent Time</span>
                      </div>
                      <span className="text-xs font-bold">{new Date(activeMenuMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/5">
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-3.5 h-3.5 ${activeMenuMsg.read ? 'text-accent' : 'text-muted-foreground/40'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Status</span>
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${activeMenuMsg.read ? 'text-accent' : 'text-muted-foreground/40'}`}>
                        {activeMenuMsg.read ? 'Seen' : 'Delivered'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/10 rounded-2xl border border-dashed border-border/20">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-2">Content Preview</p>
                    <p className="text-[13px] line-clamp-2 opacity-50 font-medium italic">"{activeMenuMsg.content}"</p>
                  </div>
                </div>
              )}

              <Button 
                className="w-full h-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] mt-6 bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all duration-300"
                onClick={() => { setShowInfoDialog(false); setActiveMenuMsg(null); }}
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-sm rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogTitle className="sr-only">Report User</DialogTitle>
            <div className="px-5 pt-5 pb-4 text-white" style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Flag className="w-4 h-4 text-red-200" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Report User</h3>
                  <p className="text-white/60 text-[9px] uppercase tracking-wider mt-0.5">Help keep the community safe</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {['Sexual Content', 'Harassment', 'Scam / Fraud', 'Hate Speech', 'Offensive Language', 'Other'].map(cat => (
                  <button key={cat} onClick={() => setReportCategory(cat)}
                    className={"text-[9px] font-semibold uppercase tracking-wider px-2 py-2 rounded-xl border transition-all text-left " +
                      (reportCategory === cat ? 'bg-destructive/10 border-destructive/40 text-destructive' : 'border-border/20 hover:bg-muted/30')}>
                    {cat}
                  </button>
                ))}
              </div>
              <textarea value={reportMessage} onChange={e => setReportMessage(e.target.value)}
                placeholder="Describe what happened..." rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-border/20 bg-muted/20 resize-none focus:outline-none focus:ring-1 focus:ring-destructive/30" maxLength={500} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 rounded-xl text-xs" onClick={() => { setShowReportDialog(false); setReportCategory(''); setReportMessage(''); }}>Cancel</Button>
                <Button className="flex-[2] h-9 rounded-xl text-xs font-semibold gap-1.5" style={{ background: '#ef4444', color: '#fff', border: 'none' }} disabled={reportSubmitting} onClick={handleSubmitReport}>
                  {reportSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mutual Match */}
        <Dialog open={!!mutualMatch} onOpenChange={() => setMutualMatch(null)}>
          <DialogContent className="max-w-sm rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogTitle className="sr-only">It's a Match!</DialogTitle>
            <div className="relative px-6 pt-8 pb-6 text-center" style={{ background: 'linear-gradient(135deg, #be185d 0%, #e11d48 50%, #f97316 100%)' }}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-14 h-14 rounded-full border-4 border-white/40 overflow-hidden bg-white/20 shadow-xl">
                  {user?.profile_pic ? <img src={user.profile_pic} className="w-full h-full object-cover chat-image" alt="" /> : <Heart fill size={22} className="text-white m-auto mt-3" />}
                </div>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40">
                  <Heart fill size={14} className="text-white" />
                </div>
                <div className="w-14 h-14 rounded-full border-4 border-white/40 overflow-hidden bg-white/20 shadow-xl">
                  {mutualMatch?.profile_pic ? <img src={mutualMatch.profile_pic} className="w-full h-full object-cover chat-image" alt="" /> : <Heart className="w-7 h-7 text-white m-auto mt-3" />}
                </div>
              </div>
              <h2 className="text-xl font-bold text-white">It's a Match!</h2>
              <p className="text-white/80 text-sm mt-1">You and <span className="text-white font-semibold">{mutualMatch?.name || chatUser?.name}</span> liked each other!</p>
            </div>
            <div className="p-5 space-y-3">
              <Button className="w-full h-10 rounded-2xl font-semibold text-xs gap-2 text-white" style={{ background: 'linear-gradient(135deg, #be185d, #e11d48)' }} onClick={() => setMutualMatch(null)}>
                <Heart className="w-4 h-4 fill-white" /> Keep Chatting!
              </Button>
              <button onClick={() => setMutualMatch(null)} className="w-full text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground">Dismiss</button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Card */}
        <Dialog open={showProfileCard} onOpenChange={setShowProfileCard}>
          <DialogContent className="max-w-[440px] w-[95vw] p-0 overflow-hidden rounded-[1.5rem] border-none shadow-2xl h-[96vh] max-h-[96vh] flex flex-col">
            <DialogTitle className="sr-only">Companion Profile</DialogTitle>
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
              {loadingProfile ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-black">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  <p className="mt-4 text-xs font-bold text-accent animate-pulse uppercase tracking-[0.2em]">Loading Profile...</p>
                </div>
              ) : fullCompanionData ? (
                <CompanionProfileDetail companion={fullCompanionData} user={user} token={token} isPro={isPro} onClose={() => setShowProfileCard(false)} hideActions={true} hideBooking={true}
                  mutualMatch={!!mutualMatch} haveSentLike={haveSentLike} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-10 bg-black text-center">
                  <div className="p-4 rounded-full bg-zinc-900 mb-4"><User className="w-8 h-8 text-zinc-700" /></div>
                  <h3 className="text-white font-bold mb-1">Preview Missing</h3>
                  <p className="text-muted-foreground text-[10px] max-w-[200px]">We couldn't retrieve the full profile for this user at this moment.</p>
                  <Button variant="outline" className="mt-6 h-10 px-6 rounded-xl border-white/10 text-white" onClick={() => setShowProfileCard(false)}>Dismiss</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>


        {/* Accept Confirmation */}
        <Dialog open={showConfirmAccept} onOpenChange={setShowConfirmAccept}>
          <DialogContent className="max-w-xs rounded-[2rem] p-5 text-center space-y-4 border-none shadow-2xl">
            <DialogTitle className="sr-only">Confirm</DialogTitle>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Confirm Appointment?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">You'll be expected to arrive on time.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-9 rounded-xl text-xs" onClick={() => setShowConfirmAccept(false)}>No</Button>
              <Button className="flex-1 h-9 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white border-none text-xs"
                onClick={async () => {
                  try {
                    await axios.post(`${API}/bookings/${acceptingId}/accept`, {}, { headers });
                    toast.success('Appointment Accepted!');
                    setShowConfirmAccept(false); setSelectedAppointment(null); fetchMessages();
                  } catch { toast.error('Failed to accept'); }
                }}>Yes, Accept</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showLikeConfirm} onOpenChange={setShowLikeConfirm}>
          <DialogContent className="max-w-[280px] rounded-3xl p-6 text-center">
            <DialogTitle className="text-base font-bold">Dislike User?</DialogTitle>
            <DialogDescription className="text-xs pt-2">
              Are you sure you want to remove your like and end this connection?
            </DialogDescription>
            <div className="flex flex-col gap-2 pt-4">
              <Button 
                variant="destructive" 
                className="rounded-2xl h-10 text-xs font-bold"
                onClick={() => {
                  handleLike(); 
                  setShowLikeConfirm(false);
                }}
              >
                Yes, Dislike
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-2xl h-10 text-xs text-muted-foreground"
                onClick={() => setShowLikeConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Appointment Response Confirmation */}
        <Dialog open={!!showApptConfirm} onOpenChange={() => setShowApptConfirm(null)}>
          <DialogContent className="max-w-[280px] rounded-3xl p-6 text-center space-y-4 border-none shadow-2xl">
            <DialogTitle className="sr-only">Confirm Response</DialogTitle>
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${showApptConfirm?.action === 'accept' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <Calendar className={`w-6 h-6 ${showApptConfirm?.action === 'accept' ? 'text-emerald-500' : 'text-rose-500'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {showApptConfirm?.action === 'accept' ? 'Accept Appointment?' : 'Decline Appointment?'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {showApptConfirm?.action === 'accept' 
                  ? 'Are you sure you want to accept this appointment request?' 
                  : 'Are you sure you want to decline this appointment request?'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-9 rounded-xl text-xs" onClick={() => setShowApptConfirm(null)}>Cancel</Button>
              <Button 
                className={`flex-1 h-9 rounded-xl text-xs font-semibold text-white border-none ${showApptConfirm?.action === 'accept' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                onClick={confirmApptResponse}
              >
                {showApptConfirm?.action === 'accept' ? 'Yes, Accept' : 'Yes, Decline'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
