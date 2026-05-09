import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/Navbar';
import CameraVerify from '@/components/CameraVerify';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  User, Briefcase, MapPin, Shield, Save, Loader2, Camera, X,
  GraduationCap, Heart, Sparkles, ImagePlus, Eye, Navigation,
  Zap, Star, CheckCircle, BadgeCheck, ArrowLeft, CreditCard, Lock,
  Crop, Upload, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Star as StarIcon, Gift, Copy,
  MessageSquare, MessageCircle, Flag, Info, Gem, BadgeHelp, Users, Mail, Check, Bell, BellOff
} from 'lucide-react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { SKILL_CATEGORIES, MASTER_SKILLS_LIST } from '@/constants/skills';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

const renderTextWithEmojis = (str, emoSize = 14, offset = '0px') => {
  if (!str) return null;
  const parts = str.split(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g);
  return parts.map((part, i) => {
    if (/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(part)) {
      return (
        <span key={i} style={{ fontSize: `${emoSize}px`, verticalAlign: offset, display: 'inline-block' }}>
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};


const HOBBY_OPTIONS = [
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

// ── Canvas-based crop modal with zoom/pan – portrait 3:4 rectangle ──
function CropModal({ imageSrc, onCrop, onSkip, onCancel }) {
  const canvasRef = useRef(null);
  const loadedImg = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  const PW = 210; const PH = 280; // 3:4 preview canvas

  useEffect(() => {
    const img = new Image();
    img.onload = () => { loadedImg.current = img; setReady(true); };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!ready || !canvasRef.current || !loadedImg.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = PW; canvas.height = PH;
    ctx.clearRect(0, 0, PW, PH);

    const img = loadedImg.current;
    const scale = Math.min(PW / img.width, PH / img.height) * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (PW - w) / 2 + offset.x;
    const y = (PH - h) / 2 + offset.y;

    // Rounded rectangle clip
    const R = 12;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, PW, PH, R);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(1, 1, PW - 2, PH - 2, R);
    ctx.stroke();
  }, [ready, zoom, offset]);

  const doCrop = () => {
    if (!loadedImg.current) return imageSrc;
    const OW = 450; const OH = 600; // 3:4 output
    const canvas = document.createElement('canvas');
    canvas.width = OW; canvas.height = OH;
    const ctx = canvas.getContext('2d');
    const img = loadedImg.current;
    const scale = Math.min(PW / img.width, PH / img.height) * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (PW - w) / 2 + offset.x;
    const y = (PH - h) / 2 + offset.y;
    const sx = OW / PW; const sy = OH / PH;
    ctx.drawImage(img, x * sx, y * sy, w * sx, h * sy);
    return canvas.toDataURL('image/jpeg', 0.84);
  };

  const onPointerDown = (e) => { setDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); };
  const onPointerMove = (e) => { if (!dragging) return; setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const onPointerUp = () => setDragging(false);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
          <h3 className="font-bold text-sm flex items-center gap-2"><Crop className="w-4 h-4" /> Adjust Photo</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={PW} height={PH}
              className="rounded-xl cursor-grab active:cursor-grabbing bg-black/50 border border-border/20"
              style={{ touchAction: 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onWheel={(e) => { e.preventDefault(); setZoom(z => Math.max(0.5, Math.min(4, z + (e.deltaY > 0 ? -0.1 : 0.1)))); }}
            />
          </div>
          <div className="flex items-center gap-3 px-2">
            <span className="text-[10px] text-muted-foreground">−</span>
            <input type="range" min="0.5" max="4" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="flex-1 h-1 accent-rose-500" />
            <span className="text-[10px] text-muted-foreground">+</span>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">Drag to move • Scroll/slide to zoom</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1.5 text-xs" onClick={onSkip}>
              <Upload className="w-3.5 h-3.5" /> As-Is
            </Button>
            <Button className="flex-1 gap-1.5 text-xs" onClick={() => onCrop(doCrop())} style={{ background: '#f43f5e', color: '#fff', border: 'none' }}>
              <Crop className="w-3.5 h-3.5" /> Crop & Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, token, updateUser, fetchUser } = useAuth();
  const { mode } = useTheme();
  const isPro = mode === 'professional';
  const location = useLocation();
  const navigate = useNavigate();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, permission: pushPermission, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe, testPush } = usePushNotifications(token);
  const [pushToggling, setPushToggling] = useState(false);
  const isMasterAdmin = (u) => u?.email === 'plusone@admin.com' || u?.email === 'promptforge.dev@gmail.com';
  const mustComplete = location.state?.mustComplete;
  const headers = { Authorization: `Bearer ${token}` };
  const [saving, setSaving] = useState(false);
  const [pendingPhotoId, setPendingPhotoId] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewMode, setPreviewMode] = useState('casual'); // local toggle for preview
  const [isEditing, setIsEditing] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('casual');
  const [faceVerifying, setFaceVerifying] = useState(false);
  const [faceResult, setFaceResult] = useState(null);
  const [systemReferralEnabled, setSystemReferralEnabled] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/campaigns-offers`);
        if (res && res.data) {
          setSystemReferralEnabled(res.data.system_referral_enabled !== false);
        }
      } catch { }
    };
    fetchSettings();
  }, []);

  // Emergency OTP state
  const [emergencyOtpSent, setEmergencyOtpSent] = useState(false);
  const [emergencyOtp, setEmergencyOtp] = useState('');
  const [sendingEmergencyOtp, setSendingEmergencyOtp] = useState(false);
  const [verifyingEmergencyOtp, setVerifyingEmergencyOtp] = useState(false);
  // Backup state for verification rollback
  const [prevProfilePic, setPrevProfilePic] = useState(null);
  const [prevPhotoState, setPrevPhotoState] = useState(null);
  // Crop + delete states
  const [cropSrc, setCropSrc] = useState(null);         // raw image DataURL for crop modal
  const [cropFile, setCropFile] = useState(null);       // original file
  const [deleteConfirm, setDeleteConfirm] = useState(null); // photoId pending deletion
  const [form, setForm] = useState({
    name: '', phone: '', location: '', gender: '', age: '', dob: '',
    college: '', role: 'customer', profile_pic: '',
    companion_category: '', casual_price: '', professional_price: '',
    casual_bio: '', professional_bio: '',
    casual_category: '', professional_category: '',
    casual_interests: '', professional_interests: '',
    professional_skills: [],
    languages: '', interests: '', availability: false, online_status: false,
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
    blood_group: '', religion: '', occupation: '', height: undefined, _heightUnit: 'cm'
  });
  const [hobbies, setHobbies] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // photo detail modal
  const [previewPhotoIdx, setPreviewPhotoIdx] = useState(0); // preview carousel index
  const [touchStartX, setTouchStartX] = useState(null); // for swipe detection
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [unlockingVisitors, setUnlockingVisitors] = useState(false);
  const [visitorData, setVisitorData] = useState({ visitors: [], total_count: 0 });

  // Email Change State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState('tech');

  // Audible alerts for premium actions
  const playAlert = (type = 'success') => {
    try {
      const audio = new Audio(type === 'success'
        ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
        : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => { }); // ignore browser blocks
    } catch { }
  };

  const fetchUnlockedConversations = async () => {
    try {
      const res = await axios.get(`${API}/chat/conversations`, { headers });
      if (res && res.data) {
        const map = {};
        res.data.forEach(c => {
          const other = c.participants?.find(p => p !== user.id);
          if (other) map[other] = c.id;
        });
        setUnlockedConversations(map);
      }
    } catch { /* ignore */ }
  };

  const fetchVisitors = async () => {
    try {
      const res = await axios.get(`${API}/users/profile/visitors`, { headers });
      if (res && res.data) {
        setVisitorData({
          visitors: Array.isArray(res.data.visitors) ? res.data.visitors : [],
          total_count: res.data.total_count || 0
        });
      }
    } catch { /* ignore */ }
  };

  const fetchUnlockedMapping = async () => {
    try {
      const res = await axios.get(`${API}/chat/unlocked-mapping`, { headers });
      if (res && res.data) {
        setUnlockedConversations(res.data);
      }
    } catch { /* ignore */ }
  };

  const handleUnlockVisitors = async () => {
    navigate('/subscription', { state: { viewMode: 'addons', activeStoreTab: 'visitors' } });
  };

  const [boostModalOpen, setBoostModalOpen] = useState(false);
  const [boostPlans, setBoostPlans] = useState([]);
  const [boosting, setBoosting] = useState(false);
  const [chatUnlockInfoOpen, setChatUnlockInfoOpen] = useState(false);
  const [unlockedConversations, setUnlockedConversations] = useState({}); // { visitor_id: conversation_id }
  const [selectedVisitor, setSelectedVisitor] = useState(null); // mini profile sheet

  const fetchBoostPlans = async () => {
    try {
      const res = await axios.get(`${API}/subscriptions/plans`);
      if (res && res.data) {
        setBoostPlans(Array.isArray(res.data.boost_plans) ? res.data.boost_plans : []);
      }
    } catch { /* ignore */ }
  };

  const handleActivateBoost = async () => {
    const balance = user?.boost_hours_balance || 0;
    if (balance <= 0) {
      navigate('/subscription', { state: { viewMode: 'diamonds', activeStoreTab: 'boost' } });
      return;
    }
    setBoosting(true);
    try {
      const res = await axios.post(`${API}/users/activate-boost`, {}, { headers });
      playAlert('success');
      toast.success(res.data.message || '🚀 Profile Boosted for 1 Hour! You are now at the top.');
      await fetchUser();
      setBoostModalOpen(false);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Boost failed';
      if (detail.includes('No boost hours')) {
        toast.error('No boost hours left. Buy more in Diamond Store.');
        navigate('/subscription', { state: { viewMode: 'diamonds', activeStoreTab: 'boost' } });
      } else {
        toast.error(detail);
      }
    } finally {
      setBoosting(false);
    }
  };

  const handleBoostProfile = () => {
    setBoostModalOpen(true);
  };

  // Auto-hide bottom nav when any modal is open
  useEffect(() => {
    const isOpen = !!(showCamera || cropSrc || previewOpen || giftOpen || selectedPhoto || deleteConfirm || emergencyOtpSent || visitorModalOpen || showEmailModal || boostModalOpen);
    if (isOpen) {
      document.documentElement.setAttribute('data-modal-open', 'true');
    } else {
      document.documentElement.removeAttribute('data-modal-open');
    }
    return () => document.documentElement.removeAttribute('data-modal-open');
  }, [showCamera, cropSrc, previewOpen, giftOpen, selectedPhoto, deleteConfirm, emergencyOtpSent, visitorModalOpen, showEmailModal, boostModalOpen]);

  // Enforce First Photo = Profile Pic rule — auto-sync first photo as profile pic
  useEffect(() => {
    if (photos.length > 0 && photos[0].url !== user?.profile_pic) {
      setAsProfilePic(photos[0], true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, user?.profile_pic]);

  // Refresh user data on mount to keep photos/profile_pic in sync
  useEffect(() => {
    if (token) {
      if (visitorModalOpen) {
        fetchVisitors();
        fetchUnlockedMapping();
      }
      if (boostModalOpen) fetchBoostPlans();
    }
  }, [token, visitorModalOpen, boostModalOpen]);

  const gpsWatchRef = useRef(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize the form from the user context once on mount or when switching users (id change)
    // This prevents local unsaved changes from being wiped when updateUser() is called elsewhere.
    if (user && (!hasInitialized.current || hasInitialized.current === user.id)) {
      const cp = user.companion_profile || {};
      const ec = user.emergency_contact || {};
      setForm({
        name: user.name || '', phone: user.phone || '',
        location: user.location || '', gender: user.gender || '',
        age: user.age || '', dob: user.dob || '', college: user.college || '',
        role: user.role || 'customer', profile_pic: user.profile_pic || '',
        companion_category: cp.category || '',
        casual_price: cp.casual_price || '', professional_price: cp.professional_price || '',
        casual_bio: cp.casual_bio || '', professional_bio: cp.professional_bio || '',
        casual_category: cp.casual_category || cp.category || '',
        professional_category: cp.professional_category || cp.category || '',
        casual_interests: (cp.casual_interests || cp.interests || []).join(', '),
        professional_interests: (cp.professional_interests || cp.interests || []).join(', '),
        professional_skills: cp.professional_skills || [],
        languages: (cp.languages || []).join(', '),
        interests: (cp.interests || []).join(', '),
        availability: cp.availability || false,
        online_status: user.online_status || false,
        emergency_contact_name: ec.name || '',
        emergency_contact_phone: ec.phone || '',
        emergency_contact_email: ec.email || '',
        emergency_contact_relationship: ec.relationship || '',
        blood_group: user.blood_group || '',
        religion: user.religion || '',
        occupation: user.occupation || '',
        height: user.height || undefined,
        _heightUnit: form._heightUnit || 'cm'
      });
      setHobbies(user.hobbies || []);
      setPhotos(user.photos || []);

      hasInitialized.current = user.id;
    }
  }, [user]);

  // ── Emergency OTP Handlers ──
  const handleSendEmergencyOtp = async () => {
    if (!form.emergency_contact_email) return toast.error('Please enter an emergency email');
    setSendingEmergencyOtp(true);
    try {
      await axios.post(`${API}/auth/send-emergency-otp`, { email: form.emergency_contact_email }, { headers });
      setEmergencyOtpSent(true);
      toast.success('Verification code sent to emergency email!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send verification code');
    }
    setSendingEmergencyOtp(false);
  };

  const handleVerifyEmergencyOtp = async () => {
    if (!emergencyOtp) return toast.error('Please enter the OTP');
    setVerifyingEmergencyOtp(true);
    try {
      await axios.post(`${API}/auth/verify-emergency-otp`, { email: form.emergency_contact_email, otp: emergencyOtp }, { headers });
      toast.success('Emergency contact verified successfully!');
      setEmergencyOtpSent(false);
      setEmergencyOtp('');
      await updateUser();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid or expired OTP');
    }
    setVerifyingEmergencyOtp(false);
  };


  // ── Profile completion ──
  const profileCompletion = (() => {
    const fields = [form.name, form.phone, form.location, form.gender,
    form.age, form.college, form.occupation, form.religion, form.blood_group,
    form.languages, form.emergency_contact_name];
    const photoScore = Math.min(photos.length, 5) / 5;
    const fieldScore = fields.filter(Boolean).length / fields.length;
    const hobbyScore = hobbies.length > 0 ? 1 : 0;
    return Math.round(((fieldScore * 0.6) + (photoScore * 0.3) + (hobbyScore * 0.1)) * 100);
  })();

  // ── Photo upload: show crop modal first ──
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    // reset input so same file can be re-selected
    e.target.value = '';
    if (!file) return;
    if (photos.length >= 5) { toast.error('Maximum 5 photos allowed'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('Photo must be under 20MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropSrc(reader.result);
      setCropFile(file);
    };
    reader.readAsDataURL(file);
  };

  // ── Upload the (optionally cropped) image ──
  const doUpload = async (dataUrl) => {
    setCropSrc(null); setCropFile(null);
    setPhotoUploading(true);
    try {
      const compressed = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 800;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
            else { width = Math.round(width * MAX / height); height = MAX; }
          }
          const c = document.createElement('canvas');
          c.width = width; c.height = height;
          c.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.src = dataUrl;
      });
      const res = await axios.post(`${API}/users/photos`, { photo_data: compressed }, { headers });
      const newPhoto = res.data.photo;
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      const isFirstPhoto = photos.length === 0;
      const newProfilePic = isFirstPhoto ? newPhoto.url : (user?.profile_pic || photos[0]?.url || newPhoto.url);
      setForm(prev => ({ ...prev, profile_pic: newProfilePic }));
      updateUser({ photos: updatedPhotos, profile_pic: newProfilePic });
      if (isFirstPhoto && !isMasterAdmin(user)) {
        setPrevProfilePic(user?.profile_pic || '');
        // Only verify on the first (main/profile) photo
        setPendingPhotoId(newPhoto.id);
        toast.success('Profile photo added. Now verify your identity.');
        setTimeout(() => setShowCamera(true), 600);
      } else {
        toast.success(`Photo ${res.data.total}/5 added!`);
      }
    } catch {
      toast.error('Upload failed. Please try again.');
    }
    setPhotoUploading(false);
  };

  // ── Set a photo as the profile picture (and trigger verify if not verified) ──
  const setAsProfilePic = async (photo, isAuto = false) => {
    if (selectedPhoto) setSelectedPhoto(null);
    if (!photo || photo.url === user?.profile_pic) return;

    const resetsVerification = !isMasterAdmin(user) && !user?.face_verified;
    const updates = { photos: photos, profile_pic: photo.url, face_verified: user?.face_verified ?? !resetsVerification };

    setForm(prev => ({ ...prev, profile_pic: photo.url }));
    updateUser(updates);

    try {
      await axios.put(`${API}/users/profile`, {
        profile_pic: photo.url,
        face_verified: user?.face_verified ?? !resetsVerification
      }, { headers });
    } catch { /* ignore */ }

    if (!isMasterAdmin(user) && !user?.face_verified && !isAuto) {
      setPrevProfilePic(user?.profile_pic || '');
      setPendingPhotoId(photo.id);
      toast.info('Please verify your identity for your new profile picture.');
      setTimeout(() => setShowCamera(true), 400);
    } else if (!isAuto) {
      toast.success('Main profile picture updated.');
    }
  };


  // ── Delete with confirmation ──
  const confirmDeletePhoto = (photoId) => setDeleteConfirm(photoId);

  const deletePhoto = async () => {
    const photoId = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await axios.delete(`${API}/users/photos/${photoId}`, { headers });
      setPhotos(prev => {
        const next = prev.filter(p => p.id !== photoId);
        const updates = { photos: next };
        if (next.length === 0) {
          updates.profile_pic = '';
          const resetsVerification = !isMasterAdmin(user);
          updates.face_verified = !resetsVerification;
          updates.online_status = !resetsVerification;
          setForm(f => ({ ...f, profile_pic: '' }));
          // Force offline + clear verification on backend (Master Admin Exempt)
          axios.put(`${API}/users/profile`, {
            face_verified: !resetsVerification,
            online_status: !resetsVerification,
            profile_pic: ''
          }, { headers }).catch(() => { });
          if (resetsVerification) toast.info('All photos removed. Verification reset.');
        } else {
          updates.profile_pic = next[0].url;
          setForm(f => ({ ...f, profile_pic: next[0].url }));
        }
        updateUser(updates); // sync to global context immediately
        if (photoId === pendingPhotoId) setPendingPhotoId(null);
        return next;
      });
      toast.success('Photo removed');
    } catch {
      toast.error('Failed to remove photo');
    }
  };

  // ── If user closes verify without passing — rollback or remove photo ──
  const handleVerifyClose = async () => {
    setShowCamera(false);
    if (pendingPhotoId && !user?.face_verified) {
      if (prevPhotoState) {
        const updates = { photos: prevPhotoState.photos, profile_pic: prevPhotoState.profile_pic, face_verified: prevPhotoState.face_verified };
        setPhotos(prevPhotoState.photos);
        setForm(f => ({ ...f, profile_pic: prevPhotoState.profile_pic }));
        updateUser(updates);
        axios.put(`${API}/users/profile`, { profile_pic: prevPhotoState.profile_pic, face_verified: prevPhotoState.face_verified }, { headers }).catch(() => { });
        toast.warning('Verification incomplete. Reverted main profile photo.');
      } else if (prevProfilePic !== null && prevProfilePic !== '') {
        const updates = { profile_pic: prevProfilePic, face_verified: false };
        setForm(f => ({ ...f, profile_pic: prevProfilePic }));
        updateUser(updates);
        axios.put(`${API}/users/profile`, updates, { headers }).catch(() => { });
        toast.warning('Verification incomplete. Reverted main profile photo.');
      } else {
        // Silently remove the unverified first photo
        try {
          await axios.delete(`${API}/users/photos/${pendingPhotoId}`, { headers });
          setPhotos(prev => {
            const next = prev.filter(p => p.id !== pendingPhotoId);
            const newPic = next.length > 0 ? next[0].url : '';
            setForm(f => ({ ...f, profile_pic: newPic }));
            updateUser({ photos: next, profile_pic: newPic, face_verified: false });
            return next;
          });
          toast.warning('Photo removed — verification not completed. Please upload and verify again.');
        } catch { /* ignore */ }
      }
      setPendingPhotoId(null);
      setPrevProfilePic(null);
    }
  };

  const toggleHobby = (hobby) => {
    setHobbies(prev => prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]);
  };

  const toggleOnlineStatus = async () => {
    // Must be face-verified to go online
    if (!form.online_status && !user?.face_verified) {
      toast.error('Please verify your identity first before going online', { duration: 4000 });
      return;
    }
    const newStatus = !form.online_status;
    setForm(prev => ({ ...prev, online_status: newStatus }));
    try {
      await axios.put(`${API}/users/online-status`, { online_status: newStatus }, { headers });
      updateUser({ online_status: newStatus });
      toast.success(newStatus ? 'You are now Online' : 'You are now Offline');
    } catch {
      setForm(prev => ({ ...prev, online_status: !newStatus }));
      toast.error('Failed to update status');
    }
  };

  // Auto-calculate age from DOB
  const calcAge = (dob) => {
    if (!dob) return '';
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age > 0 ? age : '';
  };

  const handleFaceVerify = () => {
    if (photos.length === 0 && !form.profile_pic) {
      toast.error('Please upload at least one photo first');
      return;
    }
    setShowCamera(true);
  };

  const handleVerifyComplete = (result) => {
    setShowCamera(false);
    setPendingPhotoId(null);
    setPrevProfilePic(null);
    setPrevPhotoState(null);
    if (result?.verified) {
      setForm(prev => ({ ...prev, face_verified: true }));
      toast.success('Face verified! Your profile will now be visible to others.');
    }
  };

  // ── GPS: get location once on demand ──
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const data = await res.json();
      const addr = data.address || {};
      const country = addr.country || 'India';
      const state = addr.state || addr.state_district || '';
      let city = addr.city || addr.town || addr.village || addr.suburb || '';
      city = city.replace(/\s+(Municipal Corporation|District|City|Township)$/i, '');
      return [city, state, country].filter(Boolean).join(', ');
    } catch { return null; }
  };

  const handleGetGPSLocation = async () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const locStr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (locStr) { setForm(prev => ({ ...prev, location: locStr })); toast.success('Location detected!'); }
        else toast.error('Could not get location details');
        setGpsLoading(false);
      },
      () => { toast.error('Location permission denied'); setGpsLoading(false); }
    );
  };

  // ── Continuous GPS watch: silently update location in background ──
  useEffect(() => {
    if (!navigator.geolocation || !token) return;
    let lastUpdate = 0;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastUpdate < 120000) return; // throttle to every 2 minutes
        lastUpdate = now;
        const locStr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (locStr) {
          setForm(prev => ({ ...prev, location: locStr }));
          // silently save to backend
          axios.put(`${API}/users/profile`, { location: locStr }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
        }
      },
      () => { /* ignore watch errors */ },
      { enableHighAccuracy: false, maximumAge: 120000, timeout: 30000 }
    );
    return () => { if (gpsWatchRef.current != null) navigator.geolocation.clearWatch(gpsWatchRef.current); };
  }, [token]);

  const handleSaveBankDetails = async () => { }; // removed - no longer needed

  const validateBio = (bio) => {
    if (!bio) return null;
    const phonePattern = /(\+?91[-\s]?)?[6-9]\d{9}/g;
    const socialPattern = /(instagram|facebook|twitter|snapchat|telegram|whatsapp|@\w+)/gi;
    const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
    if (phonePattern.test(bio)) return 'Bio cannot contain phone numbers';
    if (socialPattern.test(bio)) return 'Bio cannot contain social media handles or platform names';
    if (emailPattern.test(bio)) return 'Bio cannot contain email addresses';
    return null;
  };

  const handleSave = async () => {
    if (!form.name || !form.gender) {
      toast.error('Name and Gender are required');
      return;
    }
    const casualBioError = validateBio(form.casual_bio);
    if (casualBioError) { toast.error(`Casual Bio: ${casualBioError}`); return; }
    const profBioError = validateBio(form.professional_bio);
    if (profBioError) { toast.error(`Professional Bio: ${profBioError}`); return; }

    // Enforce 100 minimum for prices
    if (form.casual_price && parseInt(form.casual_price) < 100) {
      toast.error('Minimum Casual Trust must be ₹100');
      return;
    }
    if (form.professional_price && parseInt(form.professional_price) < 100) {
      toast.error('Minimum Professional Trust must be ₹100');
      return;
    }

    setSaving(true);
    try {
      if (!form.height || parseInt(form.height) < 100 || parseInt(form.height) > 250) {
        toast.error('Please enter a valid height (100cm - 250cm)');
        const heightEl = document.getElementById('height_input');
        if (heightEl) heightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setSaving(false);
        return;
      }

      const data = {
        name: form.name, phone: form.phone,
        location: form.location, role: form.role,
        dob: form.dob || undefined, college: form.college || undefined,
        hobbies: hobbies.length > 0 ? hobbies : undefined,
        gender: form.gender || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        profile_pic: form.profile_pic || (photos[0]?.url) || undefined,
        companion_category: form.casual_category || form.companion_category || undefined,
        casual_price: form.casual_price ? parseInt(form.casual_price) : undefined,
        professional_price: form.professional_price ? parseInt(form.professional_price) : undefined,
        languages: form.languages ? form.languages.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        interests: form.interests ? form.interests.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        availability: form.availability,
        casual_bio: form.casual_bio || undefined,
        professional_bio: form.professional_bio || undefined,
        casual_category: form.casual_category || undefined,
        professional_category: form.professional_category || undefined,
        casual_interests: form.casual_interests ? form.casual_interests.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        professional_interests: form.professional_interests ? form.professional_interests.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        professional_skills: form.professional_skills && form.professional_skills.length > 0 ? form.professional_skills : undefined,
        emergency_contact_name: form.emergency_contact_name || undefined,
        emergency_contact_phone: form.emergency_contact_phone || undefined,
        emergency_contact_email: form.emergency_contact_email || undefined,
        emergency_contact_relationship: form.emergency_contact_relationship || undefined,
        blood_group: form.blood_group || undefined,
        religion: form.religion || undefined,
        occupation: form.occupation || undefined,
        height: form.height ? parseInt(form.height) : null
      };
      const res = await axios.put(`${API}/users/profile`, data, { headers });
      updateUser(res.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    }
    setSaving(false);
  };

  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', otp: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleRequestPasswordOtp = async () => {
    setOtpLoading(true);
    try {
      await axios.post(`${API}/users/password/otp`, {}, { headers });
      toast.success('Verification code sent to your email');
      setShowOtpField(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    }
    setOtpLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.new) return;
    if (!passwordForm.current && !passwordForm.otp) {
      toast.error('Please enter current password or verification code');
      return;
    }
    setPasswordSaving(true);
    try {
      await axios.put(`${API}/users/password`, {
        new_password: passwordForm.new,
        current_password: passwordForm.current || undefined,
        otp: passwordForm.otp || undefined
      }, { headers });
      toast.success('Password updated successfully');
      setPasswordForm({ current: '', new: '', otp: '' });
      setShowOtpField(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update password');
    }
    setPasswordSaving(false);
  };

  const handleSendEmailChangeOtp = async () => {
    if (!newEmail) return toast.error("Please enter your new email address");
    setEmailOtpLoading(true);
    try {
      await axios.post(`${API}/auth/change-email/otp`, { new_email: newEmail }, { headers });
      setEmailOtpSent(true);
      toast.success("Verification code sent to your new email");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!emailOtp) return toast.error("Please enter the verification code");
    setEmailChanging(true);
    try {
      const res = await axios.put(`${API}/users/change-email`, { new_email: newEmail, otp: emailOtp }, { headers });
      updateUser({ email: res.data.new_email });
      toast.success("Account email updated successfully!");
      setShowEmailModal(false);
      setEmailOtpSent(false);
      setEmailOtp('');
      setNewEmail('');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Verification failed");
    } finally {
      setEmailChanging(false);
    }
  };

  const isCompanion = form.role === 'companion' || form.role === 'both';
  const profilePic = form.profile_pic || photos[0]?.url || '';
  const accentHex = isPro ? '#3b82f6' : '#f43f5e';

  // Pre-compute deduplicated visitor list (group repeated visits by visitor_id)
  const uniqueVisitors = Object.values(
    (visitorData?.visitors || []).reduce((acc, v) => {
      const vid = v.visitor_id || v.id;
      if (vid) {
        if (!acc[vid]) acc[vid] = { ...v, visitCount: 1 };
        else acc[vid].visitCount++;
      }
      return acc;
    }, {})
  );

  return (
    <div className="min-h-[100dvh] bg-background pb-32 md:pb-0" data-testid="profile-page">
      <Navbar hideHeader={showCamera || !!cropSrc || previewOpen || giftOpen || !!selectedPhoto || !!deleteConfirm || emergencyOtpSent} />
      {showCamera && (
        <CameraVerify
          existingPhotoUrl={photos[0]?.url || form.profile_pic}
          token={token}
          forceLive={true}
          onVerify={(result) => {
            if (result?.verified) {
              updateUser({ face_verified: true });
              setPendingPhotoId(null);
            }
            setShowCamera(false);
          }}
          onClose={handleVerifyClose}
        />
      )}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header with profile pic and online status */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {/* Completion ring */}
              <svg className="absolute -inset-1.5 w-[68px] h-[68px]" viewBox="0 0 68 68">
                <circle cx="34" cy="34" r="30" fill="none" stroke="currentColor" strokeWidth="3" className="text-border/30" />
                <circle cx="34" cy="34" r="30" fill="none" strokeWidth="3"
                  stroke={accentHex}
                  strokeDasharray={`${2 * Math.PI * 30 * profileCompletion / 100} ${2 * Math.PI * 30}`}
                  strokeLinecap="round"
                  transform="rotate(-90 34 34)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${form.online_status ? 'border-emerald-500' : 'border-border'} shadow-lg`}>
                {profilePic ? (
                  <img src={profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentHex}40, ${accentHex}20)` }}>
                    <span className="text-white text-xl font-bold">{form.name?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 ${form.online_status ? 'online-dot' : 'offline-dot'}`} />
              {/* Completion % badge */}
              <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm" style={{ background: accentHex }}>
                {profileCompletion}%
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                {mustComplete ? 'Complete Your Profile' : 'Edit Profile'}
                {user?.is_admin && (
                  <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                    <Shield className="w-2.5 h-2.5 fill-indigo-600/10" /> {isMasterAdmin(user) ? 'Master Admin' : 'Staff'}
                  </Badge>
                )}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {mustComplete ? 'Fill required details to continue' : 'Manage your profile and settings'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
            <div className="flex items-center gap-2 order-1 sm:order-none">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 px-2.5"
                onClick={() => setPreviewOpen(true)}
                data-testid="preview-profile-btn"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">View as Others</span>
                <span className="xs:hidden">Preview</span>
              </Button>
              {user?.role !== 'customer' && (
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-1.5 text-xs h-8 px-2.5 ${(user?.is_boosted && user?.boost_expiry && new Date(user.boost_expiry) > now) ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-violet-500/30 text-violet-600'}`}
                  onClick={() => setBoostModalOpen(true)}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${(user?.is_boosted && user?.boost_expiry && new Date(user.boost_expiry) > now) ? 'text-amber-500 animate-pulse' : 'text-violet-500'}`} />
                  {(user?.is_boosted && user?.boost_expiry && new Date(user.boost_expiry) > now) ? 'Boosted' : 'Boost Profile'}
                </Button>
              )}
            </div>

            {/* Mobile Stats - Now positioned below on small screens */}
            <div className="flex flex-row sm:flex-row flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 order-2">
              <div
                className="flex-1 sm:flex-none flex items-center gap-1.5 bg-muted/30 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted/50 transition-all border border-border/10 group"
                onClick={() => setVisitorModalOpen(true)}
              >
                <div className="flex flex-col items-center min-w-[40px]">
                  <span className="text-[10px] font-black leading-none text-rose-500 group-hover:scale-110 transition-transform">{visitorData?.total_count || 0}</span>
                  <span className="text-[8px] font-bold uppercase tracking-tighter opacity-50">Visitors</span>
                </div>
              </div>

              {user?.role !== 'customer' && (
                <>
                  <div
                    className="flex-1 sm:flex-none flex items-center gap-1.5 bg-muted/30 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20 group"
                    onClick={() => setChatUnlockInfoOpen(true)}
                    title="Chat unlock tokens — click to learn more"
                  >
                    <div className="flex flex-col items-center min-w-[40px]">
                      <span className="text-[10px] font-black leading-none text-emerald-500 group-hover:scale-110 transition-transform">{user?.chat_unlocks_balance || 0}</span>
                      <span className="text-[8px] font-bold uppercase tracking-tighter opacity-50">Unlocks</span>
                    </div>
                  </div>
                  <div
                    className="flex-1 sm:flex-none flex items-center gap-1.5 bg-muted/30 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20 group"
                    onClick={() => setBoostModalOpen(true)}
                    title={(user?.boost_hours_balance || 0) > 0 ? `Use 1 boost hour (${user?.boost_hours_balance} left)` : 'Buy boost hours'}
                  >
                    <div className="flex flex-col items-center min-w-[40px]">
                      <span className="text-[10px] font-black leading-none text-amber-500 group-hover:scale-110 transition-transform">{user?.boost_hours_balance || 0}H</span>
                      <span className="text-[8px] font-bold uppercase tracking-tighter opacity-50">Boost</span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-2.5 py-1.5 ml-auto sm:ml-0">
                <Switch
                  checked={form.online_status}
                  onCheckedChange={toggleOnlineStatus}
                  data-testid="online-status-toggle"
                />
                <span className={`text-[10px] font-black uppercase tracking-tight ${form.online_status ? 'text-emerald-500' : 'text-muted-foreground opacity-50'}`}>
                  {form.online_status ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {mustComplete && (
          <Card className="border-amber-500/20 bg-amber-500/5 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <Sparkles className={`w-5 h-5 text-amber-500 shrink-0`} />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Complete your profile with at least your <strong>name</strong>, <strong>gender</strong>, and a <strong>photo</strong> to start using PlusOneStar.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Photo Gallery */}
          <Card className="border-border/20 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="w-4 h-4" style={{ color: accentHex }} /> Photos ({photos.length}/5)
              </CardTitle>
              <p className="text-xs text-muted-foreground">Tap a photo to manage it. First photo = your profile picture and must be verified.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {photos.map((photo, i) => (
                  <div
                    key={photo.id}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group ring-0 hover:ring-2 transition-all"
                    style={{ '--tw-ring-color': accentHex }}
                    onClick={() => setSelectedPhoto(photo)}
                    data-testid={`photo-thumb-${i}`}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute top-1/2 left-2 -translate-y-1/2 z-20" onClick={(e) => { e.stopPropagation(); setPreviewPhotoIdx(i => i > 0 ? i - 1 : photos.length - 1); }}>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white border-white/10 border backdrop-blur-sm">
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute top-1/2 right-2 -translate-y-1/2 z-20" onClick={(e) => { e.stopPropagation(); setPreviewPhotoIdx(i => i < photos.length - 1 ? i + 1 : 0); }}>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white border-white/10 border backdrop-blur-sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="absolute top-0 bottom-0 left-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); setPreviewPhotoIdx(i => i > 0 ? i - 1 : photos.length - 1); }} />
                      <div className="absolute top-0 bottom-0 right-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); setPreviewPhotoIdx(i => i < photos.length - 1 ? i + 1 : 0); }} />
                    </div>
                    {i === 0 && (
                      <div className="absolute top-1.5 left-1.5">
                        <Badge className="text-[8px] text-white px-1.5 py-0.5" style={{ background: accentHex }}>Main</Badge>
                      </div>
                    )}
                    {user?.face_verified && i === 0 && (
                      <div className="absolute bottom-1.5 right-1.5">
                        <Badge className="text-[8px] bg-emerald-500 text-white gap-0.5 px-1.5"><CheckCircle className="w-2.5 h-2.5" /> Verified</Badge>
                      </div>
                    )}
                  </div>
                ))}
                {photos.length < 5 && (
                  <label className="aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/30 transition-all" style={{ borderColor: `${accentHex}30` }} data-testid="upload-photo-btn">
                    {photoUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentHex }} />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5" style={{ color: accentHex }} />
                        <span className="text-[10px] text-muted-foreground">Add Photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="border-border/20">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" style={{ color: accentHex }} /> Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="profile-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="profile-phone" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2 mb-2 sm:mb-0">
                  <Label htmlFor="gender" className="text-xs font-bold text-muted-foreground ml-1">Gender *</Label>
                  <Select id="gender" name="gender" value={form.gender || ""} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger id="gender-trigger" data-testid="profile-gender" className="h-11 bg-background/50 border-border/40 focus:ring-accent/20 transition-all"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" name="age" type="number" max="150" value={form.age} onChange={(e) => {
                    let newAge = e.target.value;
                    if (newAge && parseInt(newAge) > 150) newAge = '150';
                    let newDob = form.dob;
                    if (newAge && parseInt(newAge) > 0) {
                      const birthYear = new Date().getFullYear() - parseInt(newAge);
                      const currentMonth = form.dob ? form.dob.split('-')[1] : '01';
                      const currentDay = form.dob ? form.dob.split('-')[2] : '01';
                      newDob = `${birthYear}-${currentMonth}-${currentDay}`;
                    }
                    setForm({ ...form, age: newAge, dob: newDob });
                  }} data-testid="profile-age" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" name="dob" type="date" value={form.dob}
                    className="w-[160px] sm:w-[200px] h-10 px-3 bg-muted/10 border-border/30 hover:border-accent/40 transition-colors"
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    onChange={(e) => {
                      const age = calcAge(e.target.value);
                      setForm({ ...form, dob: e.target.value, age: age.toString() });
                    }}
                    onClick={(e) => {
                      try { e.target.showPicker(); } catch (err) { /* fallback */ }
                    }}
                    data-testid="profile-dob" />
                </div>

              </div>

              <div className="grid sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select id="blood_group" name="blood_group" value={form.blood_group || ""} onValueChange={v => setForm({ ...form, blood_group: v })}>
                    <SelectTrigger id="blood_group-trigger" data-testid="profile-blood-group"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-[10px] font-black uppercase text-muted-foreground/60">Your Height</Label>
                  <div className="flex items-center gap-2">
                    {(!form._heightUnit || form._heightUnit === 'cm') ? (
                      <Input
                        type="number" id="height_input" placeholder="cm" min={100} max={250}
                        className="h-10 w-24 text-xs font-bold bg-muted/10 border-border/30"
                        value={form.height || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setForm({ ...form, height: val > 0 ? val : undefined });
                        }}
                      />
                    ) : (
                      <div className="flex gap-2 items-center">
                        <Input type="number" placeholder="Ft" min={3} max={8} className="w-14 h-10 text-xs font-bold bg-muted/10 border-border/30" value={form.height ? Math.floor(form.height / 30.48) : ""} onChange={(e) => { const ft = parseInt(e.target.value) || 0; const existingIn = form.height ? Math.round((form.height / 2.54) % 12) : 0; const newCm = Math.round((ft * 12 + existingIn) * 2.54); setForm({ ...form, height: newCm > 0 ? newCm : undefined }); }} />
                        <Input type="number" placeholder="In" min={0} max={11} className="w-14 h-10 text-xs font-bold bg-muted/10 border-border/30" value={form.height ? Math.round((form.height / 2.54) % 12) : ""} onChange={(e) => { const inches = parseInt(e.target.value) || 0; const existingFt = form.height ? Math.floor(form.height / 30.48) : 0; const newCm = Math.round((existingFt * 12 + inches) * 2.54); setForm({ ...form, height: newCm > 0 ? newCm : undefined }); }} />
                      </div>
                    )}
                    <button type="button" onClick={() => setForm(f => ({ ...f, _heightUnit: f._heightUnit === 'ft' ? 'cm' : 'ft' }))} className="px-2 h-10 rounded-xl bg-muted/20 border border-border/30 text-[10px] font-black uppercase tracking-tight">{form._heightUnit === 'ft' ? 'FT' : 'CM'}</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Select id="religion" name="religion" value={form.religion || ""} onValueChange={v => setForm({ ...form, religion: v })}>
                    <SelectTrigger id="religion-trigger" data-testid="profile-religion"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Atheist', 'Other'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Select id="occupation" name="occupation" value={form.occupation || ""} onValueChange={v => setForm({ ...form, occupation: v })}>
                    <SelectTrigger id="occupation-trigger" data-testid="profile-occupation"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['Student', 'Working Professional', 'Self-Employed', 'Freelancer', 'Business Owner', 'Artist', 'Doctor', 'Engineer', 'Lawyer', 'Teacher', 'Homemaker', 'Other'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <Input id="location" name="location" placeholder="India > State > City" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="pr-24" data-testid="profile-location" />
                    <Button type="button" size="sm" variant="outline" className="absolute right-1 top-1 h-7 text-xs gap-1 px-2" onClick={handleGetGPSLocation} disabled={gpsLoading} data-testid="gps-btn">
                      {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Navigation className="w-3 h-3" /> GPS</>}
                    </Button>
                  </div>
                  {form.location && <p className="text-[10px] text-muted-foreground">{form.location}</p>}
                </div>
                <div className="space-y-2">
                  <Label><GraduationCap className="w-3.5 h-3.5 inline mr-1" />College</Label>
                  <Input placeholder="e.g., IIT Delhi" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} data-testid="profile-college" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger data-testid="profile-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Companion Finder</SelectItem>
                    <SelectItem value="companion">Be a Companion</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card className="border-border/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: accentHex }} /> Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/20 border border-border/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Account Email</p>
                    <p className="text-sm font-black">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 rounded-xl font-bold bg-background/50 hover:bg-background"
                  onClick={() => setShowEmailModal(true)}
                >
                  Change Email
                </Button>
              </div>

              <form className="space-y-5" onSubmit={handlePasswordChange}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Update Security Password</p>
                  </div>
                  {/* Current Password / OTP Verification FIRST */}
                  {showOtpField ? (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-semibold">Verification Code</Label>
                        <button type="button" onClick={() => setShowOtpField(false)} className="text-[11px] text-muted-foreground hover:underline">Use Password instead</button>
                      </div>
                      <Input
                        placeholder="6-digit code from email"
                        className="h-11 bg-background/50 border-accent/30"
                        value={passwordForm.otp}
                        onChange={(e) => setPasswordForm({ ...passwordForm, otp: e.target.value })}
                        data-testid="profile-otp"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-semibold">Current Password</Label>
                        <button type="button" onClick={handleRequestPasswordOtp} disabled={otpLoading} className="text-[11px] font-bold hover:underline" style={{ color: accentHex }}>
                          {otpLoading ? 'Sending...' : 'Forgot? Use OTP'}
                        </button>
                      </div>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Verify your identity"
                        className="h-11 bg-background/50"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        data-testid="profile-current-password"
                      />
                    </div>
                  )}

                  {/* New Password SECOND */}
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-sm font-semibold">New Password</Label>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Min 6 characters"
                      className="h-11 bg-background/50"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      data-testid="profile-new-password"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    disabled={!passwordForm.new || (!passwordForm.current && !passwordForm.otp) || passwordSaving}
                    className="w-full h-11 font-bold shadow-lg shadow-black/20 btn-glow"
                    style={{ background: accentHex, color: '#fff', border: 'none' }}
                    data-testid="profile-save-password"
                  >
                    {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Update Password'}
                  </Button>

                  <div className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg bg-muted/20 border border-border/10">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-[10px] text-muted-foreground leading-tight text-center">
                      PlusOneStar uses encrypted security. Your password is never shared.
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Administrative Access Card */}
          {user?.is_admin && (
            <Card className="border-indigo-500/20 bg-indigo-500/[0.02] overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 mix-blend-overlay opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                <Shield className="w-32 h-32 text-indigo-600" />
              </div>
              <CardHeader className="pb-3 border-b border-indigo-500/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" /> Administrative Access
                  </CardTitle>
                  <Badge className="bg-indigo-600 text-white font-black uppercase tracking-widest text-[8px] px-2 py-0.5 rounded-full shadow-lg shadow-indigo-600/20">Active Staff</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                    <BadgeCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">Authorized Official</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">PlusOneStar Network Infrastructure</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Permissions Scope</p>
                  <div className="flex flex-wrap gap-2">
                    {user?.admin_permissions?.map(p => (
                      <Badge key={p} variant="secondary" className="bg-indigo-500/10 text-indigo-700 border-indigo-500/20 text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                        {p.replace('_', ' ')}
                      </Badge>
                    ))}
                    {(!user?.admin_permissions || user?.admin_permissions.length === 0) && (
                      <span className="text-[10px] text-muted-foreground italic">Restricted Access</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-indigo-500/10 text-[10px] text-muted-foreground leading-relaxed italic">
                  Security Message: You have been granted access to sensitive platform modules. All administrative actions are logged and audited in real-time.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hobbies */}
          <Card className="border-border/20">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="w-4 h-4" style={{ color: accentHex }} /> Hobbies & Interests</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {HOBBY_OPTIONS.map(h => {
                  const val = h.value || h;
                  const label = h.label || h;
                  return (
                  <button
                    key={val}
                    onClick={() => toggleHobby(val)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${hobbies.includes(val)
                        ? 'text-white shadow-sm'
                        : 'bg-muted text-foreground border border-border/50 hover:bg-accent/10 hover:text-accent hover:border-accent/30'
                      }`}
                    style={hobbies.includes(val) ? { background: accentHex } : {}}
                  >
                    {renderTextWithEmojis(label, 14, '-1px')}
                  </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Face Verification section hidden — moved into Photo Gallery */}

          {/* Companion Settings - Dual Profile */}
          {isCompanion && (
            <Card className="border-border/20 animate-fade-in mt-8">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4" style={{ color: accentHex }} /> Companion Profile</CardTitle></CardHeader>
              <CardContent className="space-y-8">
                {/* Dual Profile Tabs */}
                <div className="flex rounded-lg border border-border/30 overflow-hidden">
                  <button
                    onClick={() => setProfileTab('casual')}
                    className={`flex-1 py-2 text-xs font-semibold transition-all ${profileTab === 'casual' ? 'bg-rose-500 text-white' : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'}`}
                    data-testid="tab-casual-profile"
                  >Casual Mode</button>
                  <button
                    onClick={() => setProfileTab('professional')}
                    className={`flex-1 py-2 text-xs font-semibold transition-all ${profileTab === 'professional' ? 'bg-blue-500 text-white' : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'}`}
                    data-testid="tab-professional-profile"
                  >Professional Mode</button>
                </div>

                {profileTab === 'casual' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <Label>Casual Bio</Label>
                      <Textarea placeholder="Describe yourself for casual social events..." rows={3} value={form.casual_bio} onChange={(e) => setForm({ ...form, casual_bio: e.target.value })} data-testid="casual-bio" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6 mt-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-rose-500/80 ml-1">Casual Category</Label>
                        <Select value={form.casual_category} onValueChange={(v) => setForm({ ...form, casual_category: v })}>
                          <SelectTrigger data-testid="casual-category" className="h-11 border-rose-500/20 bg-rose-500/5 focus:ring-rose-500/20 transition-all"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {['All', 'Social Outing', 'Concert Companion', 'Dining Companion', 'Festival Buddy', 'Movie Partner', 'Travel Companion', 'Party Companion'].map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-rose-500/80 ml-1">Casual Trust (INR/hr)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₹</span>
                          <Input type="number" min="100" className="pl-7 h-11 border-rose-500/20 bg-rose-500/5 focus:ring-rose-500/20" value={form.casual_price} onChange={(e) => setForm({ ...form, casual_price: e.target.value })} data-testid="profile-casual-price" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Casual Interests <span className="text-muted-foreground text-xs">(comma separated)</span></Label>
                      <Input placeholder="Music, Concerts, Art..." value={form.casual_interests} onChange={(e) => setForm({ ...form, casual_interests: e.target.value })} data-testid="casual-interests" />
                    </div>
                  </div>
                )}

                {profileTab === 'professional' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <Label>Professional Bio</Label>
                      <Textarea placeholder="Describe yourself for professional events..." rows={8} className="min-h-[200px]" value={form.professional_bio} onChange={(e) => setForm({ ...form, professional_bio: e.target.value })} data-testid="professional-bio" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6 mt-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-blue-500/80 ml-1">Professional Category</Label>
                        <Select value={form.professional_category} onValueChange={(v) => setForm({ ...form, professional_category: v })}>
                          <SelectTrigger data-testid="professional-category" className="h-11 border-blue-500/20 bg-blue-500/5 focus:ring-blue-500/20 transition-all"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {['All', 'Corporate Event', 'Business Networking', 'Conference', 'Gala / Charity', 'Award Ceremony', 'Product Launch', 'Investor Meeting'].map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-blue-500/80 ml-1">Professional Trust (INR/hr)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₹</span>
                          <Input type="number" min="100" className="pl-7 h-11 border-blue-500/20 bg-blue-500/5 focus:ring-blue-500/20" value={form.professional_price} onChange={(e) => setForm({ ...form, professional_price: e.target.value })} data-testid="profile-pro-price" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Professional Focus <span className="text-muted-foreground text-xs">(comma separated)</span></Label>
                      <Input placeholder="Networking, Public Speaking, Business Etiquette..." value={form.professional_interests} onChange={(e) => setForm({ ...form, professional_interests: e.target.value })} data-testid="professional-interests" />
                    </div>

                    {/* NEW Professional Skill Set */}
                    <div className="space-y-4 pt-4 border-t border-border/10">
                      <div className="flex items-center justify-between px-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-500/80">Skill Set</Label>
                        <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-tight">Select expertise</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-blue-500/[0.03] border border-blue-500/5 min-h-[40px]">
                        {form.professional_skills?.map(skill => (
                          <Badge key={skill} className="bg-blue-500 hover:bg-blue-600 text-white border-none gap-1 px-2 py-0.5 font-bold uppercase text-[8px] transition-all">
                            {skill}
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, professional_skills: form.professional_skills.filter(s => s !== skill) })}
                              className="opacity-60 hover:opacity-100 transition-opacity"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </Badge>
                        ))}
                        {(!form.professional_skills || form.professional_skills.length === 0) && (
                          <p className="text-[9px] text-muted-foreground/40 italic py-0.5">Categorize your expertise below...</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        {/* Domain Dropdown - Premium Neat Replacement */}
                        <div className="relative z-20">
                          <Select value={activeSkillTab} onValueChange={setActiveSkillTab}>
                            <SelectTrigger className="h-9 text-[10px] bg-muted/20 border-border/10 rounded-xl font-black uppercase tracking-widest focus:ring-blue-500/10">
                              <SelectValue placeholder="Select Domain" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/10 bg-background/95 backdrop-blur-xl z-[100]">
                              {SKILL_CATEGORIES.map(cat => (
                                <SelectItem key={cat.id} value={cat.id} className="text-[10px] font-bold uppercase tracking-wider py-2 focus:bg-blue-500/10">
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="min-h-[100px]">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeSkillTab}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="flex flex-wrap gap-1.5 p-1"
                            >
                              {(MASTER_SKILLS_LIST[activeSkillTab] || []).map(suggested => (
                                <button
                                  key={suggested}
                                  type="button"
                                  onClick={() => {
                                    if (!form.professional_skills.includes(suggested)) {
                                      setForm({ ...form, professional_skills: [...form.professional_skills, suggested] });
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all ${form.professional_skills.includes(suggested)
                                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                      : 'bg-background/40 border-border/20 text-muted-foreground/70 hover:border-blue-300'
                                    }`}
                                >
                                  + {suggested}
                                </button>
                              ))}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                        <div className="relative mt-2">
                          <Input
                            placeholder="Add custom... (MBA, AWS, etc.)"
                            className="h-9 text-[10px] bg-background/50 border-blue-500/10 pl-8 focus-visible:ring-blue-500/10 rounded-xl"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                e.preventDefault();
                                const val = e.target.value.trim();
                                if (!form.professional_skills.includes(val)) {
                                  setForm({ ...form, professional_skills: [...form.professional_skills, val] });
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-500/30" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Languages Spoken <span className="text-muted-foreground text-xs">(comma separated)</span></Label>
                  <Input placeholder="English, Hindi, Tamil" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} data-testid="profile-languages" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.availability} onCheckedChange={(v) => setForm({ ...form, availability: v })} data-testid="profile-availability" />
                  <Label>Available for bookings</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Contact */}
          <Card className="border-border/20">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" style={{ color: accentHex }} /> Emergency Contact</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} data-testid="emergency-name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} data-testid="emergency-phone" />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input placeholder="Parent, Friend..." value={form.emergency_contact_relationship} onChange={(e) => setForm({ ...form, emergency_contact_relationship: e.target.value })} data-testid="emergency-relationship" />
                </div>
              </div>
              <div className="space-y-4">
                <Label>Emergency Email <span className="text-muted-foreground text-xs">(will be notified in SOS)</span></Label>
                <div className="rounded-xl p-4 space-y-2 border shadow-sm transition-colors" style={{ background: `${accentHex}0f`, borderColor: `${accentHex}30` }}>
                  <p className="text-[12px] font-black flex items-center gap-2" style={{ color: accentHex, fontFamily: 'var(--font-heading)' }}><Shield className="w-4 h-4" /> PAYMENT &amp; SAFETY ALERT</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed"><strong>NEVER</strong> pay in advance. Give money <strong>ONLY AFTER</strong> meeting. PlusOneStar does NOT handle transactions. Only meet at <strong>PUBLIC VENUES</strong>. Report fraud immediately.</p>
                </div>

                {user?.emergency_contact_verified && user?.emergency_contact_email === form.emergency_contact_email ? (
                  <div className="flex items-center gap-2 mt-4">
                    <Input disabled value={form.emergency_contact_email || ''} className="opacity-70 font-medium bg-muted/30" />
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 gap-1 shrink-0"><CheckCircle className="w-3.5 h-3.5" /> Verified</Badge>
                    <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, emergency_contact_email: '' })} className="text-xs h-9">Change</Button>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Input type="email" placeholder="contact@email.com" value={form.emergency_contact_email || ''} autoComplete="off" onChange={(e) => {
                        setForm({ ...form, emergency_contact_email: e.target.value });
                        setEmergencyOtpSent(false);
                      }} data-testid="emergency-email" disabled={emergencyOtpSent} />
                      <Button onClick={handleSendEmergencyOtp} disabled={sendingEmergencyOtp || !form.emergency_contact_email} style={{ background: accentHex, color: '#fff' }} className="shrink-0 h-10 w-full sm:w-28 text-xs font-bold shadow-md">
                        {sendingEmergencyOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : (emergencyOtpSent ? 'Resend OTP' : 'Verify Email')}
                      </Button>
                    </div>

                    {emergencyOtpSent && (
                      <div className="animate-in slide-in-from-top-2 mt-4 space-y-6">
                        <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-muted/10 border border-border/10 shadow-inner">
                          <div className="space-y-1.5 text-center">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Verification Code</Label>
                            <p className="text-[11px] font-medium text-muted-foreground">Sent to {form.emergency_contact_email}</p>
                          </div>

                          <div className="flex gap-2">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                              <div key={i} className={`w-10 h-12 rounded-xl bg-background border-2 flex items-center justify-center text-lg font-black transition-all ${emergencyOtp.length > i ? 'border-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]' : 'border-border/30'}`}>
                                {emergencyOtp[i] || ''}
                              </div>
                            ))}
                          </div>

                          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />

                          <div className="relative w-full">
                            <Input
                              placeholder="Type code here..."
                              value={emergencyOtp}
                              onChange={(e) => setEmergencyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="h-12 text-center font-black tracking-[1em] text-lg bg-background/50 border-none focus-visible:ring-0 opacity-0 absolute inset-0 z-10"
                              autoFocus
                            />
                            <div className="h-12 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground pointer-events-none">
                              {emergencyOtp.length === 6 ? 'Code ready' : 'Complete 6 digits'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <Button
                            onClick={handleVerifyEmergencyOtp}
                            disabled={verifyingEmergencyOtp || emergencyOtp.length < 6}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 rounded-2xl"
                          >
                            {verifyingEmergencyOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Identity'}
                          </Button>
                          <button
                            type="button"
                            onClick={() => { setEmergencyOtpSent(false); setEmergencyOtp(''); }}
                            className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:underline mx-auto"
                          >
                            Use different email
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">This email will receive an alert if you trigger the SOS button</p>
              </div>
            </CardContent>
          </Card>

          {/* Push Notifications Settings */}
          <Card className="border-border/20" data-testid="push-notifications-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: accentHex }} /> Push Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/30 bg-muted/10">
                  <div className="flex items-center gap-3 min-w-0">
                    {pushSubscribed ? (
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accentHex}18` }}>
                        <Bell className="w-4.5 h-4.5" style={{ color: accentHex }} />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                        <BellOff className="w-4.5 h-4.5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">Browser Notifications</p>
                      <p className="text-[11px] text-muted-foreground leading-snug">Get notified about bookings, messages &amp; updates</p>
                    </div>
                  </div>
                  <Switch
                    data-testid="push-notifications-toggle"
                    checked={pushSubscribed}
                    disabled={pushToggling || !pushSupported}
                    onCheckedChange={async (checked) => {
                      setPushToggling(true);
                      try {
                        if (checked) {
                          const ok = await pushSubscribe();
                          if (ok) toast.success('Push notifications enabled!');
                          else if (pushPermission === 'denied') toast.error('Notifications blocked by browser. Enable them in your browser settings.');
                          else toast.error('Could not enable notifications');
                        } else {
                          await pushUnsubscribe();
                          toast.success('Push notifications disabled');
                        }
                      } catch { toast.error('Failed to update notification settings'); }
                      setPushToggling(false);
                    }}
                  />
                </div>

                {!pushSupported && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Your browser does not support push notifications</p>
                )}
                {pushPermission === 'denied' && pushSupported && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Notifications are blocked. Please enable them in your browser settings.</p>
                )}

                {pushSubscribed && (
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="push-test-btn"
                    className="text-xs h-8 gap-1.5"
                    onClick={async () => {
                      const res = await testPush();
                      if (res?.status === 'sent') toast.success('Test notification sent!');
                      else toast.info('No active subscription found');
                    }}
                  >
                    <Bell className="w-3.5 h-3.5" /> Send Test Notification
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>


          {/* Email Change Dialog */}
          <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
            <DialogContent className="max-w-md rounded-[2.5rem] p-8 space-y-6 border-none shadow-2xl">
              <DialogTitle className="sr-only">Confirm Photo Deletion</DialogTitle>

              <DialogTitle className="sr-only">Help & Support</DialogTitle>
              <DialogHeader>
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-2">
                  <Mail className="w-7 h-7" />
                </div>
                <DialogTitle className="text-xl font-black">Update <span className="text-indigo-600">Email Address</span></DialogTitle>
                <p className="text-xs text-muted-foreground font-medium">For security, we'll send a verification code to your new email address.</p>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="new-email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Email Address</Label>
                  <Input
                    id="new-email"
                    name="new-email"
                    type="email"
                    placeholder="example@email.com"
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); setEmailOtpSent(false); }}
                    className="h-12 rounded-xl font-bold bg-muted/20 border-border/10 transition-all focus:ring-indigo-500/20"
                    disabled={emailOtpSent}
                  />
                </div>

                {!emailOtpSent ? (
                  <Button
                    className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20"
                    onClick={handleSendEmailChangeOtp}
                    disabled={emailOtpLoading || !newEmail}
                  >
                    {emailOtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification Code"}
                  </Button>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-otp" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Verification Code</Label>
                        <button
                          type="button"
                          onClick={() => setEmailOtpSent(false)}
                          className="text-[10px] font-black text-rose-500 hover:underline px-1"
                        >
                          Wrong email?
                        </button>
                      </div>
                      <Input
                        id="email-otp"
                        name="email-otp"
                        placeholder="••••••"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                        className="h-14 rounded-xl font-black text-center tracking-[1em] text-lg bg-muted/20 border-border/10"
                      />
                    </div>
                    <Button
                      className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-600/20"
                      onClick={handleVerifyEmailChange}
                      disabled={emailChanging || emailOtp.length < 6}
                    >
                      {emailChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Email Address"}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleSave}
            disabled={saving}
            className={`w-full h-12 font-semibold btn-pro btn-glow gap-2 rounded-xl`}
            data-testid="save-profile"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Profile</>}
          </Button>
        </div>
      </div>

      {/* ── Photo Detail Modal ── */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[998] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pb-safe" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-card border border-border/30 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up max-h-[90dvh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="relative aspect-[3/4] w-full" style={{ maxHeight: '55dvh' }}>
              <img src={selectedPhoto.url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setSelectedPhoto(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
              {photos[0]?.id === selectedPhoto.id && (
                <div className="absolute top-3 left-3">
                  <Badge style={{ background: accentHex }} className="text-white text-[10px]">Main Photo</Badge>
                </div>
              )}
              {user?.face_verified && photos[0]?.id === selectedPhoto.id && (
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-emerald-500 text-white text-[10px] gap-1"><CheckCircle className="w-3 h-3" /> Verified</Badge>
                </div>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {photos[0]?.id !== selectedPhoto.id && (
                  <Button
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => setAsProfilePic(selectedPhoto)}
                  >
                    <Star className="w-3.5 h-3.5" style={{ color: accentHex }} /> Set as Profile Pic
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className={`gap-1.5 text-xs ${photos[0]?.id !== selectedPhoto.id ? '' : 'col-span-2'}`}
                  onClick={() => { setSelectedPhoto(null); confirmDeletePhoto(selectedPhoto.id); }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Photo
                </Button>
              </div>
              {!user?.face_verified && photos[0]?.id === selectedPhoto.id && (
                <Button className="w-full text-xs gap-1.5 font-bold" style={{ background: accentHex, color: '#fff', border: 'none' }} onClick={() => { setSelectedPhoto(null); setShowCamera(true); }}>
                  <BadgeCheck className="w-3.5 h-3.5" /> Verify This Photo
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── View as Others Dialog — Two-Step Premium Disclosure ── */}
      <Dialog open={previewOpen} onOpenChange={(v) => { if (!v) { setPreviewOpen(false); setPreviewExpanded(false); setPreviewPhotoIdx(0); } }}>
        <DialogContent className="p-0 gap-0 max-w-sm w-full overflow-hidden border-0 bg-black flex flex-col" style={{ height: '94dvh', maxHeight: '94dvh', borderRadius: '2rem' }}>
          <DialogTitle className="sr-only">Photo Viewer</DialogTitle>

          <DialogTitle className="sr-only">View Profile Image</DialogTitle>

          {/* Step 1: Impact View (Compact) */}
          {!previewExpanded ? (
            <div className="relative w-full h-full flex flex-col justify-end bg-black">
              {/* Immersive Scrollable Background for Step 1 */}
              <div className="absolute inset-0 flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none" onScroll={(e) => {
                const idx = Math.round(e.target.scrollLeft / e.target.offsetWidth);
                setPreviewPhotoIdx(idx);
              }}>
                {photos.length > 0 ? photos.map((p, i) => (
                  <img key={i} src={p.url} alt="" className="w-full h-full object-cover shrink-0 snap-center" />
                )) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-4xl font-bold opacity-20">{form.name?.charAt(0)}</div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />

              {/* Photo Indicators for Step 1 */}
              {photos.length > 1 && (
                <div className="absolute top-12 left-0 right-0 flex justify-center gap-1 z-20">
                  {photos.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === previewPhotoIdx ? 'w-6 bg-white' : 'w-2 bg-white/30'}`} />
                  ))}
                </div>
              )}
              {/* Arrow buttons for Step 1 */}
              {photos.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all"
                    onClick={() => {
                      const scroller = document.querySelector('.snap-x.snap-mandatory');
                      if (scroller) scroller.scrollBy({ left: -scroller.offsetWidth, behavior: 'smooth' });
                    }}
                    data-testid="preview-photo-prev"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all"
                    onClick={() => {
                      const scroller = document.querySelector('.snap-x.snap-mandatory');
                      if (scroller) scroller.scrollBy({ left: scroller.offsetWidth, behavior: 'smooth' });
                    }}
                    data-testid="preview-photo-next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <div className="absolute top-10 right-4 flex flex-col gap-2 z-10">
                {user?.is_boosted && user?.boost_expiry && new Date(user.boost_expiry) > now && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black text-white border border-amber-300/50" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.94),rgba(239,68,68,0.80))', boxShadow: '0 0 12px rgba(245,158,11,0.55)' }}>
                    <Zap className="w-3 h-3" style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8))' }} />
                    Boosted • {getBoostTimeLeft(user.boost_expiry)}
                  </div>
                )}
                {user?.face_verified && <Badge className="bg-emerald-500/90 text-white gap-1 text-[10px]"><CheckCircle className="w-3 h-3" /> Verified</Badge>}
                {form.online_status && <Badge className="bg-blue-500/90 text-white text-[10px]">● Online</Badge>}
              </div>
              <div className="relative z-10 px-6 pb-12 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-4xl font-black text-white leading-none" style={{ fontFamily: 'var(--font-heading)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {form.name || 'Anonymous'}{form.age ? `, ${form.age}` : ''}
                  </h3>
                  <div className="flex items-center gap-2 text-white/70 text-sm font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>{form.location || 'India'}</span>
                    <span>•</span>
                    <span className="capitalize">{form.gender || 'Unknown'}</span>
                  </div>
                </div>
                <Button
                  className="w-full h-14 rounded-2xl btn-pro text-white font-black text-sm tracking-widest uppercase shadow-2xl flex items-center justify-center gap-2 group transition-all active:scale-95"
                  onClick={() => { setPreviewExpanded(true); setPreviewMode(isPro ? 'professional' : 'casual'); }}
                >
                  Explore Full Profile
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ) : (
            /* Step 2: Expanded View (Dual Bio + Scrollable Gallery) */
            <div className="flex flex-col h-full bg-background animate-in slide-in-from-bottom-4 duration-500 rounded-b-[2rem] overflow-hidden">

              {/* Native-like Vertical Scroll Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden touch-pan-y no-scrollbar" id="profile-preview-scroller" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

                {/* Photo Header — Moved Inside for vertical scrolling */}
                <div className="relative h-[65dvh] md:h-[60%] bg-black shrink-0">
                  <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none" onScroll={(e) => {
                    const idx = Math.round(e.target.scrollLeft / e.target.offsetWidth);
                    setPreviewPhotoIdx(idx);
                  }}>
                    {photos.length > 0 ? photos.map((p, i) => (
                      <img key={i} src={p.url} alt="" className="w-full h-full object-cover shrink-0 snap-center" />
                    )) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-4xl font-bold opacity-20">{form.name?.charAt(0)}</div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  {/* Dots / Indicators */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-40">
                      {photos.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === previewPhotoIdx ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40'}`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Profile Details Content */}
                <div className="p-6 space-y-6 pb-24">
                  {/* Header & Mode Multi-Toggle */}
                  <div className="space-y-4 border-b border-border/5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{form.name || 'Anonymous'}</h2>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {form.location || 'India'}</span>
                          <span>·</span>
                          {form.age > 0 && <span>{form.age} Years</span>}
                        </div>
                      </div>
                      {user?.face_verified && <BadgeCheck className="w-6 h-6 text-emerald-500" />}
                    </div>

                    {/* Mode Selector (Simulation) */}
                    <div className="flex p-1 bg-muted/30 rounded-xl">
                      <button
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${previewMode === 'casual' ? 'bg-background text-rose-500 shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                        onClick={() => setPreviewMode('casual')}
                      >
                        Casual
                      </button>
                      <button
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${previewMode === 'professional' ? 'bg-background text-blue-500 shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                        onClick={() => setPreviewMode('professional')}
                      >
                        Professional
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-muted/20 border border-border/10 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Reputation</p>
                      <div className="flex items-center justify-center gap-2">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-black">{user?.companion_profile?.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-2xl border border-border/10 text-center ${previewMode === 'professional' ? 'bg-blue-500/5' : 'bg-rose-500/5'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${previewMode === 'professional' ? 'text-blue-500' : 'text-rose-500'}`}>Price</p>
                      <p className="text-sm font-black text-foreground">₹{previewMode === 'professional' ? (form.professional_price || '0') : (form.casual_price || '0')} <span className="text-[10px] opacity-40">/ hr</span></p>
                    </div>
                  </div>

                  {/* Dual Bio Section */}
                  <div className="space-y-4">
                    {/* Primary current mode bio */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${previewMode === 'professional' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About Me</h3>
                      </div>
                      <p className={`text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap pl-3.5 border-l-2 ${previewMode === 'professional' ? 'border-blue-500/20' : 'border-rose-500/20'}`}>
                        {previewMode === 'professional' ? (form.professional_bio || 'No professional bio provided.') : (form.casual_bio || 'No casual bio provided.')}
                      </p>
                    </div>

                    {/* Secondary (The "Other" mode) preview */}
                    <div className="p-4 rounded-2xl bg-muted/10 border border-dashed border-border/20 opacity-60">
                      <p className="text-[9px] font-black text-muted-foreground uppercase mb-2">Also active in {previewMode === 'casual' ? 'Professional' : 'Casual'} Mode</p>
                      <p className="text-[11px] line-clamp-2">
                        {previewMode === 'casual' ? (form.professional_bio || 'No professional bio.') : (form.casual_bio || 'No casual bio.')}
                      </p>
                    </div>
                  </div>

                  {/* Detail Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/10">
                      <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Occupation</p>
                      <p className="text-xs font-bold">{form.occupation || 'Private'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/10">
                      <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Linguistic</p>
                      <p className="text-xs font-bold truncate">{form.languages || 'English'}</p>
                    </div>
                  </div>

                  {/* Hobbies / Interests */}
                  {hobbies.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {hobbies.map(h => (
                          <Badge key={h} variant="secondary" className="bg-muted/30 py-1 px-3 rounded-lg text-[10px] border-none">{h}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-6 border-t border-border/10">
                    <div className="p-6 rounded-3xl bg-muted/10 border border-border/10 text-center">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Client reviews will appear here</p>
                    </div>

                    <Button className="w-full h-12 rounded-2xl font-black text-xs tracking-widest uppercase border border-border/20 hover:bg-muted transition-colors" onClick={() => { setPreviewOpen(false); setPreviewExpanded(false); }}>
                      Exit Preview
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Gallery Modals */}
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onCrop={(data) => doUpload(data)}
          onSkip={() => doUpload(cropSrc)}
          onCancel={() => { setCropSrc(null); setCropFile(null); }}
        />
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[320px] p-6 text-center">
          <DialogTitle className="sr-only">OTP Verification Status</DialogTitle>

          <DialogTitle className="sr-only">Confirmation</DialogTitle>
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold mb-2">Delete Photo?</h3>
          <p className="text-xs text-muted-foreground mb-6">This action cannot be undone. If you delete your last photo, your verification will be reset.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={deletePhoto}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gift / Referral Modal */}
      <Dialog open={giftOpen} onOpenChange={setGiftOpen}>
        <DialogContent className="sm:max-w-sm w-[94vw] max-h-[90vh] overflow-y-auto p-0 mx-auto rounded-[2rem] border-none shadow-2xl bg-background" style={{ scrollbarWidth: 'none' }}>
          <DialogTitle className="sr-only">Visitor Insights</DialogTitle>

          <DialogTitle className="sr-only">Edit Profile</DialogTitle>
          <div className="pt-12 pb-8 px-6 text-center space-y-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', borderRadius: '0 0 2rem 2rem' }}>
            {/* Decorative Glass Circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/30 rotate-3">
                <Gift className="w-10 h-10 text-white drop-shadow-md" />
              </div>
              <h2 className="text-white font-black text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Share & Earn</h2>
              <p className="text-white/80 text-xs font-semibold max-w-[240px] mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>Invite friends to unlock guaranteed premium rewards for both of you.</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Rewards - Premium Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group overflow-hidden py-4 px-3 rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/5 to-transparent text-center shadow-sm hover:border-amber-500/30 transition-all">
                <div className="text-4xl font-black text-amber-500 mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>+1</div>
                <div className="text-[11px] font-black text-foreground uppercase tracking-widest">Day Free</div>
                <div className="inline-block mt-2 px-2 py-0.5 rounded-full bg-amber-500/10 text-[9px] font-black text-amber-600 uppercase tracking-widest">For You</div>
              </div>
              <div className="relative group overflow-hidden py-4 px-3 rounded-2xl border border-orange-500/10 bg-gradient-to-br from-orange-500/5 to-transparent text-center shadow-sm hover:border-orange-500/30 transition-all">
                <div className="text-4xl font-black text-orange-500 mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>+7</div>
                <div className="text-[11px] font-black text-foreground uppercase tracking-widest">Days Free</div>
                <div className="inline-block mt-2 px-2 py-0.5 rounded-full bg-orange-500/10 text-[9px] font-black text-orange-600 uppercase tracking-widest">For Friend</div>
              </div>
            </div>

            {/* Your referral code */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.2em]" style={{ color: accentHex }}>Invite Code</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/60 rounded-xl px-4 py-3 font-mono text-sm sm:text-base font-black tracking-[0.25em] border border-border/50 text-center shadow-inner">
                  {user?.referral_code || `REF${user?.id?.slice(0, 8)?.toUpperCase() || 'XXXXXX'}`}
                </div>
                <Button size="icon" variant="outline" className="shrink-0 h-[46px] w-[46px] rounded-xl shadow-sm" onClick={() => {
                  const code = user?.referral_code || `REF${user?.id?.slice(0, 8)?.toUpperCase() || 'XXXXXX'}`;
                  navigator.clipboard?.writeText(code);
                  toast.success('Code copied!');
                }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Share link */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.2em]" style={{ color: accentHex }}>Invite Link</p>
              <div className="flex flex-col gap-2">
                <div className="bg-muted/60 rounded-xl px-4 py-3 text-[11px] text-muted-foreground border border-border/50 text-center shadow-inner leading-relaxed break-all pointer-events-none">
                  {`${window.location.origin}/join?ref=${user?.referral_code || `REF${user?.id?.slice(0, 8)?.toUpperCase() || 'XXXXXX'}`}`}
                </div>
                <Button className="w-full h-12 rounded-xl shadow-md font-bold" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', border: 'none' }} onClick={() => {
                  const code = user?.referral_code || `REF${user?.id?.slice(0, 8)?.toUpperCase() || 'XXXXXX'}`;
                  const link = `${window.location.origin}/join?ref=${code}`;
                  navigator.clipboard?.writeText(link);
                  toast.success('Link copied! Paste it anywhere.');
                }}>
                  Share Link
                </Button>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-muted/30 border border-border/30 rounded-2xl p-5 mt-4 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 font-mono flex items-center gap-2">
                <Star className="w-3.5 h-3.5" /> How It Works
              </p>
              <div className="space-y-4">
                {[
                  ['1', 'Share your referral code from above.'],
                  ['2', 'Friend registers with the code.'],
                  ['3', 'You BOTH instantly get free days.'],
                ].map(([n, text]) => (
                  <div key={n} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-lg flex flex-shrink-0 items-center justify-center text-white text-[11px] font-black shadow-sm" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>{n}</div>
                    <p className="text-[13px] font-medium leading-normal" style={{ fontFamily: 'var(--font-body)' }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={visitorModalOpen} onOpenChange={setVisitorModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-border/10 sm:mb-0 mb-20 max-h-[85vh] overflow-y-auto">
          <DialogTitle className="sr-only">Change Email</DialogTitle>

          <DialogTitle className="sr-only">Wallet & Transactions</DialogTitle>
          <div className="relative p-8 text-white flex flex-col justify-end min-h-[160px] overflow-hidden" style={{ background: 'linear-gradient(135deg, #b45309, #d97706, #db2777)' }}>
            {/* Shine gloss overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.18), transparent 55%)' }} />
            <div className="absolute top-6 left-8 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 border border-white/20">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black uppercase tracking-wider">{visitorData?.total_count || 0} Total Views</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none">Visitor Insights</h3>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.15em] mt-2">See who is checking out your profile</p>
            </div>
          </div>

          <div className="p-6">
            {!(user?.unlocked_features?.some(f => f.type === 'visitors') || (user?.visitor_insight_expiry && new Date(user.visitor_insight_expiry) > new Date())) ? (
              <div className="space-y-6">
                {/* Unlock Prompt at Top */}
                <div className="text-center space-y-3 px-2 border-b border-border/10 pb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-2">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Locked Feature</span>
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight text-foreground">Unlock Visitor Insights</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">"Reveal the identities and exact visit times of people checking out your profile."</p>
                  <Button
                    onClick={handleUnlockVisitors}
                    disabled={unlockingVisitors}
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 text-xs mt-4 text-white border-none transition-all duration-200" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b 45%, #db2777)", boxShadow: "0 6px 20px rgba(219,39,119,0.30), inset 0 1px 0 rgba(255,255,255,0.20)" }}
                  >
                    {unlockingVisitors ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Unlock Profile Visitors</>}
                  </Button>
                </div>

                <div className="relative p-4 overflow-hidden rounded-2xl">
                  <div className="flex flex-wrap gap-4 opacity-60 pointer-events-none">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className="w-14 h-14 rounded-full bg-muted/60 overflow-hidden border-2 border-border/15" style={{ filter: 'blur(6px)' }} />
                        <div className="h-2 w-10 bg-muted/40 rounded-full" style={{ filter: 'blur(3px)' }} />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/70 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0">

                {/* TODAY section */}
                {(() => {
                  const todayVisits = uniqueVisitors.filter(v => {
                    const d = new Date(v.timestamp);
                    const now = new Date();
                    return d.toDateString() === now.toDateString();
                  });
                  const prevVisits = uniqueVisitors.filter(v => {
                    const d = new Date(v.timestamp);
                    const now = new Date();
                    return d.toDateString() !== now.toDateString();
                  });
                  return (
                    <div className="space-y-5 py-2 px-3 max-h-[460px] overflow-y-auto custom-scrollbar">
                      {/* Today */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Today</span>
                          <span className="flex-1 h-px bg-border/20" />
                          <span className="text-[9px] font-bold text-muted-foreground">{todayVisits.length} visit{todayVisits.length !== 1 ? 's' : ''}</span>
                        </div>
                        {todayVisits.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground/50 font-bold px-2 py-3">No visits today yet</p>
                        ) : (
                          <div className="flex flex-wrap gap-3 pb-2">
                            {todayVisits.map((v, i) => {
                              const vid = v.visitor_id || v.id;
                              return (
                                <button key={vid || i} onClick={() => { navigate('/browse?view=' + vid + '&restricted=true'); setVisitorModalOpen(false); }} className="flex flex-col items-center gap-1.5 group">
                                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/50 shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform">
                                    {v.visitor_pic
                                      ? <img src={v.visitor_pic} className="w-full h-full object-cover" alt="" />
                                      : <div className="w-full h-full bg-muted flex items-center justify-center"><span className="text-lg font-black text-muted-foreground">{(v.visitor_name || '?')[0]}</span></div>
                                    }
                                    {v.visitCount > 1 && (
                                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-500 rounded-full text-[8px] font-black text-white flex items-center justify-center border border-background">{v.visitCount}</span>
                                    )}
                                  </div>
                                  <p className="text-[9px] font-black uppercase tracking-tight max-w-[56px] truncate">{v.visitor_name?.split(' ')[0] || 'User'}</p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Previous Days */}
                      {prevVisits.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Previous</span>
                            <span className="flex-1 h-px bg-border/20" />
                          </div>
                          <div className="flex flex-wrap gap-3 pb-2">
                            {prevVisits.map((v, i) => {
                              const vid = v.visitor_id || v.id;
                              return (
                                <button key={vid || i} onClick={() => { navigate('/browse?view=' + vid + '&restricted=true'); setVisitorModalOpen(false); }} className="flex flex-col items-center gap-1.5 group">
                                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-border/20 shadow-sm group-hover:scale-105 transition-transform">
                                    {v.visitor_pic
                                      ? <img src={v.visitor_pic} className="w-full h-full object-cover" alt="" />
                                      : <div className="w-full h-full bg-muted flex items-center justify-center"><span className="text-lg font-black text-muted-foreground">{(v.visitor_name || '?')[0]}</span></div>
                                    }
                                    {v.visitCount > 1 && (
                                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-muted-foreground/60 rounded-full text-[8px] font-black text-white flex items-center justify-center border border-background">{v.visitCount}</span>
                                    )}
                                  </div>
                                  <p className="text-[9px] font-black uppercase tracking-tight max-w-[56px] truncate text-muted-foreground">{v.visitor_name?.split(' ')[0] || 'User'}</p>
                                  <p className="text-[7px] text-muted-foreground/50 font-bold">{new Date(v.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {uniqueVisitors.length === 0 && (
                        <div className="text-center py-12 opacity-30">
                          <Users className="w-10 h-10 mx-auto mb-2" />
                          <p className="text-xs font-black uppercase tracking-[0.2em]">No visitors yet</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Visitor profile now opens via /browse?view=ID&restricted=true */}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={boostModalOpen} onOpenChange={setBoostModalOpen}>
        <DialogContent className="sm:max-w-sm w-[94vw] max-h-[90vh] overflow-y-auto p-0 mx-auto rounded-[2rem] border-border/10 shadow-2xl bg-background" style={{ scrollbarWidth: 'none' }}>
          <DialogTitle className="sr-only">Emergency Contact Details</DialogTitle>

          <DialogTitle className="sr-only">Withdraw Funds</DialogTitle>
          {/* Header */}
          <div className="relative px-6 pt-7 pb-6 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 60%, #c2410c 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.14), transparent 55%)' }} />
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1 border border-white/15">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] font-black uppercase tracking-wider">Top Results</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.20)', boxShadow: '0 0 16px rgba(251,191,36,0.30)' }}>
                <Zap className="w-5 h-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))' }} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight leading-none">Rocket Boost</h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mt-0.5">10× more visibility</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* Balance pill */}
            <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.07), rgba(251,191,36,0.05))', borderColor: 'rgba(124,58,237,0.15)' }}>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Boost Balance</p>
                <p className="text-2xl font-black flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className={(user?.boost_hours_balance || 0) > 0 ? 'text-amber-500' : 'text-destructive'}>{user?.boost_hours_balance || 0}</span>
                  <span className="text-xs font-bold text-muted-foreground">hrs remaining</span>
                </p>
              </div>
              {(user?.boost_hours_balance || 0) > 0
                ? <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                : <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.10)' }}><Zap className="w-4 h-4 text-amber-500" /></div>
              }
            </div>

            {/* Active countdown */}
            {user?.is_boosted && user?.boost_expiry && new Date(user.boost_expiry) > new Date() && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl border" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.06))', borderColor: 'rgba(245,158,11,0.25)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.90), rgba(239,68,68,0.75))', boxShadow: '0 0 10px rgba(245,158,11,0.40)' }}>
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Boost Active</p>
                  <p className="text-base font-black text-amber-700 leading-none">{getBoostTimeLeft(user.boost_expiry)}</p>
                </div>
              </div>
            )}

            {/* Analytics — shown whether active or past boost */}
            {(user?.boost_stats || user?.is_boosted || user?.boost_expiry) && (() => {
              const stats = user?.boost_stats || {};
              const isExpired = !user?.is_boosted || (user?.boost_expiry && new Date(user.boost_expiry) <= new Date());
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      {isExpired ? 'Previous Boost Analytics' : 'Live Boost Analytics'}
                    </p>
                    {isExpired && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">Ended</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Appearances', value: stats.impressions || 0, icon: <Eye className="w-4 h-4 text-violet-400" /> },
                      { label: 'Profile Visits', value: stats.visits || 0, icon: <Users className="w-4 h-4 text-blue-400" /> },
                      { label: 'Bookings', value: stats.appointments || 0, icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-2xl border text-center" style={{ background: `rgba(124,58,237,${isExpired ? '0.03' : '0.05'})`, borderColor: `rgba(124,58,237,${isExpired ? '0.08' : '0.12'})` }}>
                        <div className="flex justify-center mb-1" style={{ opacity: isExpired ? 0.6 : 1 }}>{s.icon}</div>
                        <p className="text-base font-black text-foreground leading-none">{s.value}</p>
                        <p className="text-[8px] font-bold text-muted-foreground mt-1 uppercase tracking-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Action button */}
            {(user?.boost_hours_balance || 0) > 0 && !user?.is_boosted ? (
              <Button
                className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest gap-2 shadow-xl transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #f59e0b)', color: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}
                disabled={boosting}
                onClick={handleActivateBoost}
              >
                {boosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {boosting ? 'Boosting...' : `Use 1 Hour · ${user?.boost_hours_balance || 0} hrs left`}
              </Button>
            ) : (user?.boost_hours_balance || 0) > 0 && user?.is_boosted ? (
              <div className="h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-black text-amber-700 border" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}>
                <Zap className="w-4 h-4" /> Boost Active — {getBoostTimeLeft(user.boost_expiry)}
              </div>
            ) : (
              <Button
                className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest gap-2 shadow-xl"
                style={{ background: 'linear-gradient(135deg, #1a0533, #3b0764)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
                onClick={() => { setBoostModalOpen(false); navigate('/subscription', { state: { viewMode: 'diamonds', activeStoreTab: 'boost' } }); }}
              >
                <Gem className="w-5 h-5" /> Buy Boost Hours
              </Button>
            )}

            {/* How it works */}
            <div className="space-y-2 pt-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">How It Works</p>
              {[
                { icon: <Zap className="w-3.5 h-3.5 text-amber-500" />, text: 'Spend 1 boost hour to appear at the TOP of browse results for 60 minutes.' },
                { icon: <Eye className="w-3.5 h-3.5 text-violet-500" />, text: 'Your profile gets a glowing "Boosted" badge visible to all browsing users.' },
                { icon: <Users className="w-3.5 h-3.5 text-blue-500" />, text: 'Track real-time visits, appearances, and booking conversions in analytics.' },
                { icon: <Gem className="w-3.5 h-3.5 text-pink-500" />, text: 'Buy more boost hours using Diamonds from the Diamond Store.' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/5">
                  <div className="mt-0.5 shrink-0">{s.icon}</div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">{s.text}</p>
                </div>
              ))}
            </div>

          </div>
        </DialogContent>
      </Dialog>

      <Footer />
      {/* ── Chat Unlock Info Popup ── */}
      <Dialog open={chatUnlockInfoOpen} onOpenChange={setChatUnlockInfoOpen}>
        <DialogContent className="max-w-sm rounded-[2rem] p-0 overflow-hidden border-border/10 shadow-2xl">
          <DialogTitle className="sr-only">Boost Profile</DialogTitle>

          <DialogTitle className="sr-only">Verify Identity</DialogTitle>
          {/* Header */}
          <div className="relative px-6 pt-7 pb-5 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1d4ed8 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(59,130,246,0.18), transparent 55%)' }} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.20)', boxShadow: '0 0 14px rgba(59,130,246,0.25)' }}>
                <MessageCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight leading-none">Chat Unlock Tokens</h3>
                <p className="text-white/55 text-[10px] font-bold mt-0.5">Unlock private chats with visitors</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Balance display */}
            <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(16,185,129,0.05))', borderColor: 'rgba(59,130,246,0.15)' }}>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Your Balance</p>
                <p className="text-2xl font-black flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className={(user?.chat_unlocks_balance || 0) > 0 ? 'text-blue-600' : 'text-destructive'}>{user?.chat_unlocks_balance || 0}</span>
                  <span className="text-xs font-bold text-muted-foreground">unlocks left</span>
                </p>
                {Object.keys(unlockedConversations).length > 0 && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {Object.keys(unlockedConversations).length} chat{Object.keys(unlockedConversations).length > 1 ? 's' : ''} unlocked so far
                  </p>
                )}
              </div>
              {(user?.chat_unlocks_balance || 0) > 0
                ? <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                : <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.10)' }}><Lock className="w-4 h-4 text-destructive" /></div>
              }
            </div>

            {/* How it works */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">How It Works</p>
              {[
                { IconComp: CheckCircle, iconColor: 'text-blue-500', bgColor: 'rgba(59,130,246,0.10)', title: 'Use 1 Token', desc: 'Spend 1 chat unlock token to start a private chat with any visitor.' },
                { IconComp: MessageCircle, iconColor: 'text-emerald-500', bgColor: 'rgba(34,197,94,0.10)', title: 'Chat Opens', desc: 'The conversation stays open forever — no re-unlocking needed.' },
                { IconComp: Gem, iconColor: 'text-violet-500', bgColor: 'rgba(124,58,237,0.10)', title: 'Buy More', desc: 'Purchase additional unlock tokens from the Diamond Store anytime.' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.bgColor }}>
                    <item.IconComp className={`w-4 h-4 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black">{item.title}</p>
                    <p className="text-[9px] text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {(user?.chat_unlocks_balance || 0) <= 0 ? (
              <Button
                className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest gap-2 shadow-xl"
                style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)', color: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(59,130,246,0.30)' }}
                onClick={() => { setChatUnlockInfoOpen(false); navigate('/subscription', { state: { viewMode: 'diamonds', activeStoreTab: 'chat' } }); }}
              >
                <Gem className="w-4 h-4" /> Buy Chat Unlocks in Diamond Store
              </Button>
            ) : (
              <Button
                className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest gap-2"
                variant="outline"
                onClick={() => setChatUnlockInfoOpen(false)}
              >
                Got It — Use My Tokens
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
