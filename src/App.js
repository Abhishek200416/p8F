import "@/App.css";
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import RiskPopup from "@/components/RiskPopup";
import DailyCampaignPopup from "@/components/DailyCampaignPopup";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import ProfilePage from "@/pages/ProfilePage";
import BrowseCompanions from "@/pages/BrowseCompanions";
import SubscriptionPage from "@/pages/SubscriptionPage";
import AdminPanel from "@/pages/AdminPanel";
import TermsPage from "@/pages/TermsPage";
import ChatPage from "@/pages/ChatPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import AboutPage from "@/pages/AboutPage";
import BlogsPage from "@/pages/BlogsPage";
import ChatInbox from "@/pages/ChatInbox";
import CampaignPage from "@/pages/CampaignPage";
import ReferralPage from "@/pages/ReferralPage";
import ReferralTerms from "@/pages/ReferralTerms";
import LeaderboardPage from "@/pages/LeaderboardPage";
import SpotlightPage from "@/pages/SpotlightPage";
import { MobileAppBanner } from "@/components/MobileAppBanner";
import { ArrowUp } from "lucide-react";

function ScrollToTopFAB() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const fn = () => setV(window.scrollY > 300);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  if(!v) return null;
  return (
    <button 
      onClick={() => window.scrollTo({top:0, behavior:'smooth'})} 
      className="fixed bottom-24 sm:bottom-8 right-6 z-[100] w-8 h-8 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 animate-in slide-in-from-bottom-8 opacity-95 hover:opacity-100 ring-2 ring-background" 
      style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))' }}
    >
      <ArrowUp className="w-3.5 h-3.5" />
    </button>
  );
}

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" replace />;
  const isProfileComplete = (user.name && user.gender) || user.is_admin;
  if (!isProfileComplete && location.pathname !== '/profile') {
    return <Navigate to="/profile" state={{ mustComplete: true }} replace />;
  }
  return children;
};

// Redirect logged-in users away from auth pages (NOT info pages)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="spinner" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const JoinRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('pendingReferralCode', ref.trim().toUpperCase());
    }
    navigate(`/auth?tab=signup${ref ? `&ref=${ref}` : ''}`, { replace: true });
  }, [searchParams, navigate]);
  return <div className="min-h-screen flex items-center justify-center bg-background"><div className="spinner" /></div>;
};

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // DevTools unblocked for debugging
    /*
    const blockDevTools = (e) => {
      if (e.key === 'F12') { e.preventDefault(); return; }
      if (e.ctrlKey && e.shiftKey && ['I','J','C','K'].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
      if (e.ctrlKey && ['U','S','P'].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
    };
    document.addEventListener('keydown', blockDevTools);
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      document.removeEventListener('keydown', blockDevTools);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
    */
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster 
            position="top-right" 
            richColors 
            closeButton 
            expand={false}
            toastOptions={{
              className: "group pointer-events-auto flex items-center gap-3 p-4 rounded-3xl bg-background/60 backdrop-blur-3xl border border-border/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] animate-in slide-in-from-right-8 duration-500 max-w-[320px]",
              style: { fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' },
              descriptionClassName: "text-[10px] opacity-70 font-medium",
              titleClassName: "text-xs font-black tracking-tight"
            }} 
          />
          <RiskPopup />
          <ScrollToTopFAB />
          <MobileAppBanner deferredPrompt={deferredPrompt} setDeferredPrompt={setDeferredPrompt} />
          <Routes>
            {/* Landing — accessible without login, but no Join Now button shown after login */}
            <Route path="/" element={<LandingPage />} />
            {/* Auth-only routes */}
            <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/join" element={<JoinRedirect />} />
            {/* Info pages — accessible regardless of login */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            {/* Campaign & Referral pages */}
            <Route path="/campaign" element={<ProtectedRoute><CampaignPage /></ProtectedRoute>} />
            <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
            <Route path="/referral/terms" element={<ProtectedRoute><ReferralTerms /></ProtectedRoute>} />
            {/* Protected app routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><BrowseCompanions /></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/spotlight" element={<ProtectedRoute><SpotlightPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
            <Route path="/chat/:bookingId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatInbox /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <DailyCampaignPopup />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
