import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import {
  Moon, Sun, Menu, X, LayoutDashboard, User, CreditCard,
  Shield, LogOut, Home, Search, Bell, MessageSquare, Settings, Star, Gift, Trophy, Gem, Trash2
} from 'lucide-react';
import axios from 'axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

export const Navbar = ({ hideHeader, hideBottomNav }) => {
  const { user, logout, token, diamonds, fetchDiamonds } = useAuth();
  const { theme, mode, setMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [systemCampActive, setSystemCampActive] = useState(false);
  const bellRef = useRef(null);
  const [bannerHidden, setBannerHidden] = useState(false);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const isPro = mode === 'professional';

  useEffect(() => {
    const hiddenUntil = localStorage.getItem('disclaimer_hidden_until');
    if (hiddenUntil && new Date().getTime() < parseInt(hiddenUntil)) {
      setBannerHidden(true);
    }
  }, []);

  const dismissBanner = () => {
    const hideUntil = new Date().getTime() + (12 * 60 * 60 * 1000); // 12 hours
    localStorage.setItem('disclaimer_hidden_until', hideUntil.toString());
    setBannerHidden(true);
  };

  const isActive = (p) => location.pathname === p;

  const authNavLinks = [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/browse', label: 'Browse', icon: Search },
    { path: '/spotlight', label: 'Spotlight', icon: Star },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/subscription', label: 'Plans', icon: CreditCard },
  ];

  const infoNavLinks = [
    { path: '/how-it-works', label: 'How It Works' },
    ...(systemCampActive ? [{ path: '/campaign', label: 'Campaigns' }] : []),
    { path: '/about', label: 'About' },
  ];

  // Fetch notifications
  useEffect(() => {
    if (!token) return;
    const fetchNotifs = async () => {
      try {
        const res = await axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        setNotifications(res.data || []);
      } catch {}
    };
    const fetchCampStatus = async () => {
       try {
         const res = await axios.get(`${API}/campaigns-offers`);
         if (!res || !res.data) return;
         // Campaigns page is ALWAYS visible. system_referral_enabled only controls the invite card inside it.
         setSystemCampActive(true);
       } catch (err) {
         console.error("Failed to fetch campaigns status:", err);
       }
    };
    const fetchDiamonds = async () => {
      try {
        const res = await axios.get(`${API}/user/diamonds`, { headers: { Authorization: `Bearer ${token}` } });
        setDiamonds(res.data.diamonds || 0);
      } catch {}
    };
    const fetchUnreadMessages = async () => {
      try {
        const res = await axios.get(`${API}/chat/unread-total`, { headers: { Authorization: `Bearer ${token}` } });
        setTotalUnreadMessages(res.data.total || 0);
      } catch {}
    }
    fetchNotifs();
    fetchCampStatus();
    fetchDiamonds();
    fetchUnreadMessages();
    const interval = setInterval(() => { 
      fetchNotifs(); 
      fetchCampStatus(); 
      fetchDiamonds();
      fetchUnreadMessages();
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Close bell on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;

  const markRead = async () => {
    if (!token || unreadCount === 0) return;
    try {
      await axios.put(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const handleClearAll = async () => {
    if (!token) return;
    try {
      await axios.delete(`${API}/notifications/clear-all`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications([]);
      setBellOpen(false);
    } catch {}
  };

  const handleLogout = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Logout triggered");
    setShowLogoutDialog(true);
  };
  const executeLogout = () => { logout(); navigate('/'); setMobileOpen(false); setShowLogoutDialog(false); };

  const shouldHide = hideHeader; // Removed mobileOpen check so it doesn't disappear when menu active
  
  return (
    <div className="w-full flex flex-col relative">
      {/* Disclaimer bar - now outside sticky header so it scrolls away */}
      {!shouldHide && !bannerHidden && (
        <div className="w-full py-1 px-4 text-center bg-background border-b border-border/10 relative group/banner" style={{ background: 'rgba(212,175,55,0.08)' }} data-testid="disclaimer-bar">
          <p className="text-[10px] font-medium pr-6" style={{ color: 'rgba(212,175,55,0.85)' }}>
            All interactions at your own risk. 18+ verified platform. Public venues only.
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline ml-1">Terms apply</a>
          </p>
          <button 
            onClick={dismissBanner}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5 text-amber-500/40 hover:text-amber-500 transition-colors"
            title="Dismiss for 12h"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <header className={`sticky top-0 z-40 bg-background/95 backdrop-blur-2xl border-b border-border/20 shadow-sm transition-all duration-300 ${shouldHide ? 'h-0 border-none overflow-hidden' : ''}`} data-testid="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between h-12 transition-all ${shouldHide ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>


            {/* Logo */}
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0" data-testid="nav-logo">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="PlusOneStar Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-black tracking-tight hidden sm:inline" style={{ fontFamily: 'var(--font-heading)' }}>PlusOneStar</span>
            </Link>

            {/* Center: Mode Toggle ONLY (single) */}
            <div className="mode-pill" data-testid="mode-toggle">
              <button
                onClick={() => setMode('professional')}
                className={isPro ? 'active-pro' : ''}
                data-testid="mode-professional"
              >Pro</button>
              <button
                onClick={() => setMode('casual')}
                className={!isPro ? 'active-casual' : ''}
                data-testid="mode-casual"
              >Casual</button>
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-1.5">
              {user && authNavLinks.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path}>
                  <Button
                    variant={isActive(path) ? 'secondary' : 'ghost'}
                    size="sm"
                    className={`h-8 gap-1.5 text-xs font-medium ${isActive(path) ? '' : 'text-muted-foreground'}`}
                    data-testid={`nav-${label.toLowerCase()}`}
                  >
                    <Icon className="w-3.5 h-3.5" />{label}
                  </Button>
                </Link>
              ))}
              {user?.is_admin && (
                <Link to="/admin">
                  <Button variant={isActive('/admin') ? 'secondary' : 'ghost'} size="sm" className="h-8 gap-1.5 text-xs" data-testid="nav-admin">
                    <Shield className="w-3.5 h-3.5" />Admin
                  </Button>
                </Link>
              )}
              {/* Campaigns removed from header - accessible via homepage */}


              {/* Diamond Wallet */}
              {user && (
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/5 border border-pink-500/10 hover:bg-pink-500 hover:text-white transition-all cursor-pointer group"
                  onClick={() => navigate('/subscription', { state: { viewMode: 'diamonds' } })}
                  title="Your Diamonds"
                >
                  <div className="relative">
                    <Gem className="w-4 h-4 text-pink-500 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-[12px] font-black text-pink-500 ml-0.5 group-hover:text-white transition-colors">{diamonds}</span>
                </div>
              )}

              {/* Leaderboard / Rank */}
              {user && (
                <Link to="/leaderboard" title="Elite Leaderboard">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-500/10 transition-colors relative" data-testid="leaderboard-btn">
                    <Trophy className="w-4 h-4" />
                  </button>
                </Link>
              )}

              {/* Bell Notification */}
              {user && (
                <div className="relative" ref={bellRef}>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative"
                    onClick={() => { setBellOpen(!bellOpen); if (!bellOpen) markRead(); }}
                    data-testid="bell-icon"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>

                  {/* Bell Dropdown */}
                  {bellOpen && (
                    <div className="absolute right-0 top-10 w-72 bg-card border border-border/30 rounded-xl shadow-2xl overflow-hidden animate-slide-down z-50" data-testid="bell-dropdown">
                      <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between bg-muted/20">
                        <span className="text-xs font-bold">Notifications</span>
                        <div className="flex items-center gap-2">
                          {notifications.length > 0 && (
                            <button 
                              onClick={handleClearAll}
                              className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                              title="Clear all"
                            >
                              <Trash2 className="w-3 h-3" /> Clear
                            </button>
                          )}
                          <button onClick={() => setBellOpen(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-6">No notifications</p>
                        ) : (
                          notifications.slice(0, 8).map(n => (
                            <div
                              key={n.id}
                              className={`px-3 py-2.5 border-b border-border/10 hover:bg-muted/30 transition-colors cursor-pointer ${!n.read ? 'bg-accent/5' : ''}`}
                              onClick={() => { setBellOpen(false); if (n.link) navigate(n.link); }}
                            >
                              <p className={`text-xs font-semibold ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                              <p className="text-[9px] text-muted-foreground/60 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="px-3 py-2 text-center">
                        <Link to="/dashboard" onClick={() => setBellOpen(false)}>
                          <span className="text-[10px] text-accent hover:underline cursor-pointer">View all notifications</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme} 
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all mr-1.5 border border-border/10 shadow-sm"
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              {user ? (
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-border/20">
                  <Link to="/profile">
                    <div className={`w-7 h-7 rounded-lg overflow-hidden border-2 ${user.online_status ? 'border-emerald-500' : 'border-border/30'} cursor-pointer`}>
                      {user.profile_pic ? (
                        <img src={user.profile_pic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-accent/15 text-accent">
                          {user.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                  </Link>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:bg-destructive hover:text-white gap-1" onClick={handleLogout} data-testid="logout-btn">
                    <LogOut className="w-3.5 h-3.5" /> Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-border/20">
                  {/* Info links — visible even without login */}
                  {infoNavLinks.map(l => (
                    <Link key={l.path} to={l.path}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">{l.label}</Button>
                    </Link>
                  ))}
                  <Link to="/auth?tab=signup">
                    <Button size="sm" className="h-8 btn-pro btn-glow text-xs" data-testid="nav-signup">Join Free</Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="h-8 text-xs" data-testid="nav-login">Sign In</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-1.5 py-2">
              {user && (
                <div 
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-pink-500/5 mr-1"
                  onClick={() => navigate('/subscription', { state: { viewMode: 'diamonds' } })}
                >
                  <div className="relative mr-1.5 -translate-y-px">
                    <Gem className="w-4 h-4 text-pink-500" />
                  </div>
                  <span className="text-[11px] font-black text-pink-500">{diamonds}</span>
                </div>
              )}
              {user && (
                <div className="relative" ref={bellRef}>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground relative" onClick={() => { setBellOpen(!bellOpen); if (!bellOpen) markRead(); }} data-testid="mobile-bell">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>
                  {bellOpen && (
                    <div className="absolute right-0 top-10 w-64 bg-card border border-border/30 rounded-xl shadow-2xl overflow-hidden animate-slide-down z-50">
                      <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
                        <span className="text-xs font-bold">Notifications</span>
                        {notifications.length > 0 && (
                          <button onClick={handleClearAll} className="text-[10px] text-destructive font-medium">Clear All</button>
                        )}
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No notifications</p>
                        ) : (
                          notifications.slice(0, 5).map(n => (
                            <div 
                              key={n.id} 
                              className={`px-3 py-2 border-b border-border/10 cursor-pointer ${!n.read ? 'bg-accent/5' : ''}`}
                              onClick={() => { setBellOpen(false); if (n.link) navigate(n.link); }}
                            >
                              <p className="text-xs font-semibold">{n.title}</p>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="px-3 py-2 border-t border-border/10 bg-muted/5">
                          <Link to="/dashboard" onClick={() => setBellOpen(false)}>
                            <p className="text-[10px] text-center text-accent font-medium">View all on Dashboard</p>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => setMobileOpen(!mobileOpen)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${mobileOpen ? 'bg-accent/10 text-accent' : 'text-muted-foreground'}`} data-testid="mobile-menu-toggle">
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>


        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden bg-background/98 backdrop-blur-xl border-t border-border/15 animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {user ? (
                <>
                  <div className="flex items-center gap-3 pb-3 border-b border-border/15 mb-2">
                    <div className={`w-10 h-10 rounded-xl overflow-hidden border-2 ${user.online_status ? 'border-emerald-500' : 'border-border/30'}`}>
                      {user.profile_pic ? (
                        <img src={user.profile_pic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-accent/15 text-accent">{user.name?.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground/80">{user.email}</p>
                    </div>
                  </div>

                  {/* Top Actions: Theme & Logout (Side-by-Side) */}
                  <div className="flex gap-2 mb-6 px-2">
                    <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl bg-muted/10 text-xs text-muted-foreground hover:text-foreground transition-all">
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span className="truncate">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                    </button>
                    <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl bg-destructive/5 text-xs text-destructive hover:bg-destructive/10 transition-all">
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {/* Primary Links */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Features</p>
                      {[
                        { path: '/dashboard', label: 'Dashboard', icon: Home },
                        { path: '/leaderboard', label: 'Today (Rankings)', icon: Trophy },
                        { path: '/browse', label: 'Browse Companions', icon: Search },
                        { path: '/chat', label: 'Chat', icon: MessageSquare },
                        { path: '/subscription', label: 'Subscription Plans', icon: CreditCard },
                        { path: '/reviews', label: 'User Reviews', icon: Star },
                      ].map(({ path, label, icon: Icon }) => (
                        <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
                          <Button variant={isActive(path) ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start gap-4 py-6 text-sm mb-1 bg-muted/10">
                            <Icon className="w-5 h-5" />{label}
                          </Button>
                        </Link>
                      ))}
                    </div>

                    {/* Account Section */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">My Account</p>
                      <Link to="/profile" onClick={() => setMobileOpen(false)}>
                        <Button variant={isActive('/profile') ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start gap-4 py-6 text-sm mb-1 bg-muted/10">
                          <User className="w-5 h-5" />My Profile
                        </Button>
                      </Link>
                      {user?.is_admin && (
                        <Link to="/admin" onClick={() => setMobileOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full justify-start gap-4 py-6 text-sm mb-1 bg-accent/10 text-accent">
                            <Shield className="w-5 h-5" />Admin Panel
                          </Button>
                        </Link>
                      )}
                    </div>

                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-2 pb-2">
                    <Link to="/auth" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full text-xs">Log In</Button>
                    </Link>
                    <Link to="/auth" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full text-xs btn-pro">Get Started</Button>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between px-2 py-2 border-t border-border/15">
                    <button onClick={toggleTheme} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="mobile-guest-theme-toggle">
                      {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Bottom nav - mobile only for logged-in users */}
      {user && !mobileOpen && !hideBottomNav && !location.pathname.startsWith('/chat/') && (
        <nav className={`bottom-nav md:hidden ${mobileOpen ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'} transition-all duration-300 shadow-[0_-8px_20px_rgba(0,0,0,0.1)]`} data-testid="bottom-nav">
          <div className="flex items-center justify-around py-0.5 px-2 pb-[env(safe-area-inset-bottom,4px)]">
            {[
              { path: '/dashboard', icon: Home, label: 'Home', dot: unreadCount > 0 },
              { path: '/leaderboard', icon: Trophy, label: 'Today' },
              { path: '/chat', icon: MessageSquare, label: 'Chat', count: totalUnreadMessages },
              { path: '/browse', icon: Search, label: 'Browse' },
              { path: '/subscription', icon: CreditCard, label: 'Plans' },
              { path: '/profile', icon: User, avatar: user?.profile_pic, label: 'Profile' },
            ].map(({ path, icon: Icon, avatar, label, dot, count }) => (
              <Link key={path} to={path} className={`flex flex-col items-center gap-0.5 px-2 py-0.5 transition-colors relative ${isActive(path) ? 'text-[hsl(var(--accent))]' : 'text-muted-foreground hover:text-foreground'}`}>
                <div className="relative">
                  {avatar ? (
                    <div className={`w-5 h-5 rounded-full overflow-hidden border ${isActive(path) ? 'border-primary' : (user.online_status ? 'border-emerald-500' : 'border-border/30')}`}>
                      <img src={avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  {/* Notification Dot */}
                  {dot && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-background" />}
                  {/* Message Count */}
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black min-w-[12px] h-[12px] px-1 rounded-full flex items-center justify-center border border-background">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-[340px] rounded-2xl border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden z-[9999]">
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-2 text-destructive">
              <LogOut className="w-8 h-8" />
            </div>
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-xl font-black tracking-tight text-center">Leaving Already?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground text-center px-2">
                Are you sure you want to sign out? You'll need to log back in to access your chat, bookings, and diamonds.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col gap-2 mt-4">
              <AlertDialogAction 
                onClick={executeLogout}
                className="w-full py-6 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold transition-all shadow-lg shadow-destructive/20"
              >
                Log Out Now
              </AlertDialogAction>
              <AlertDialogCancel 
                className="w-full py-6 rounded-xl border-border/40 bg-muted/30 hover:bg-muted font-bold transition-all"
              >
                Stay Connected
              </AlertDialogCancel>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Navbar;
