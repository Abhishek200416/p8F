import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Gift, Users, Copy, Share2, CheckCircle, Clock, XCircle, Info, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';
const BASE_URL = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

export default function ReferralPage() {
  const { user, token } = useAuth();
  const { mode } = useTheme();
  const isPro = mode === 'professional';
  const accentHex = isPro ? '#3b82f6' : '#f43f5e';
  const headers = { Authorization: `Bearer ${token}` };
  const navigate = useNavigate();

  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ invited: 0, joined: 0, rewards_given: 0 });
  const referralCode = user?.referral_code || `REF${user?.id?.slice(0, 8)?.toUpperCase() || 'XXXXXX'}`;
  const inviteLink = `${BASE_URL}/join?ref=${referralCode}`;

  useEffect(() => {
    axios.get(`${API}/referrals/mine`, { headers })
      .then(r => {
        setReferrals(r.data.referrals || []);
        setStats(r.data.stats || { invited: 0, joined: 0, rewards_given: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => toast.success('Invite link copied!')).catch(() => toast.error('Copy failed'));
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: 'Join PlusOneStar!', text: 'Use my invite link and get 1 week free!', url: inviteLink });
    } else {
      copyLink();
    }
  };

  const canRefer = user?.face_verified;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="rounded-2xl p-6 text-center relative overflow-hidden border border-border/20" style={{ background: `linear-gradient(135deg, ${accentHex}15, ${accentHex}05)` }}>
          <div className="text-5xl mb-3">🎁</div>
          <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>Invite a Friend</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Both you and your friend get <strong>1 week free</strong> when they join via your invite link and complete verification.
          </p>
          <Link to="/referral/terms" className="text-[11px] text-accent underline mt-2 inline-block">View Terms &amp; Conditions</Link>
        </div>

        {/* Eligibility notice */}
        {!canRefer && (
          <div className="flex items-start gap-3 p-4 rounded-xl border bg-amber-500/5 border-amber-500/20 text-sm">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              You need to <strong>verify your identity</strong> (profile photo verification) before you can refer friends and earn rewards.
            </p>
          </div>
        )}

        {/* Your referral code */}
        <Card className="border-border/20">
          <CardContent className="p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Invite Link</p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyLink} title="Copy"><Copy className="w-4 h-4" /></Button>
              <Button size="icon" onClick={shareLink} style={{ background: accentHex }} title="Share"><Share2 className="w-4 h-4 text-white" /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs gap-1"><Gift className="w-3 h-3" /> Code: {referralCode}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Invited', value: stats.invited, icon: '📨' },
            { label: 'Joined', value: stats.joined, icon: '✅' },
            { label: 'Rewards Given', value: stats.rewards_given, icon: '🎁' },
          ].map(s => (
            <Card key={s.label} className="border-border/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl">{s.icon}</p>
                <p className="text-xl font-black mt-1">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral List */}
        <Card className="border-border/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4" /> People You Invited</p>
            </div>
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Loading…</p>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-3xl">🤝</p>
                <p className="text-sm text-muted-foreground">No referrals yet. Share your link to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-border/10 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
                      {r.referred_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.referred_name || r.referred_email}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      {r.status === 'joined' && r.verified ? (
                        <Badge className="text-[10px] bg-emerald-500 text-white gap-1"><CheckCircle className="w-3 h-3" /> Rewarded</Badge>
                      ) : r.status === 'joined' ? (
                        <Badge variant="outline" className="text-[10px] gap-1"><Clock className="w-3 h-3" /> Pending verify</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] gap-1"><Clock className="w-3 h-3" /> Invited</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="border-border/20 bg-muted/20">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-bold">How It Works</p>
            {[
              '1. Share your invite link with a friend',
              '2. They sign up using your link (only @gmail.com)',
              '3. They complete identity verification',
              '4. You both get 1 week free subscription automatically',
              '5. One reward per person — no duplicate accounts',
            ].map(s => <p key={s} className="text-xs text-muted-foreground">{s}</p>)}
          </CardContent>
        </Card>

      </div>
      <Footer />
    </div>
  );
}
