import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, CreditCard, Zap, Shield, Crown, Loader2, ArrowRight, Gift, Star, Gem, ShieldCheck, MessageSquare, Eye, Settings2, Calendar, Plus, Info, Sparkles, ArrowUpRight, PartyPopper, Diamond, Clock, Ticket, X } from 'lucide-react';
import axios from 'axios';
import { PurchaseSuccessOverlay } from '@/components/PurchaseSuccessOverlay';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : (process.env.REACT_APP_API_URL || '/api');

export default function SubscriptionPage() {
  const { user, token, fetchUser } = useAuth();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };
  const [plans, setPlans] = useState({ customer_plans: [], companion_plans: [], gst_percentage: 18 });
  const [loading, setLoading] = useState(true);
  const [planType, setPlanType] = useState('customer');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [paying, setPaying] = useState(null);
  const [systemReferralEnabled, setSystemReferralEnabled] = useState(false);
  const [promoRewardData, setPromoRewardData] = useState(null); // { title, rewards[], discount }

  // Diamond Economy Integration
  const [viewMode, setViewMode] = useState('diamonds');
  const [activeStoreTab, setActiveStoreTab] = useState('chat');
  const [chatQuantity, setChatQuantity] = useState(1);
  const [boostQuantity, setBoostQuantity] = useState(1);
  const [insightQuantity, setInsightQuantity] = useState(1);
  const [diamondBalance, setDiamondBalance] = useState(0);
  const [diamondLoading, setDiamondLoading] = useState(null);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type, action, title, message }
  const [successData, setSuccessData] = useState(null); // { title, message, type }
  const { fetchDiamonds } = useAuth();


  const location = useLocation();

  useEffect(() => {
    axios.get(`${API}/subscriptions/plans`).then(r => {
      const data = r.data;
      if (!data.diamond_packs && data.diamondPacks) data.diamond_packs = data.diamondPacks;
      setPlans(data);
      setLoading(false);
    }).catch(() => setLoading(false));
    axios.get(`${API}/campaigns-offers`).then(r => { setSystemReferralEnabled(r.data.system_referral_enabled !== false); }).catch(() => { });
    if (token) fetchDiamondBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Auto-hide bottom nav when plan details modal is open
  useEffect(() => {
    if (selectedPlanDetails) {
      document.documentElement.setAttribute('data-modal-open', 'true');
    } else {
      document.documentElement.removeAttribute('data-modal-open');
    }
    return () => document.documentElement.removeAttribute('data-modal-open');
  }, [selectedPlanDetails]);

  useEffect(() => {
    if (location.state?.viewMode) {
      setViewMode(location.state.viewMode);
    }
  }, [location]);

  const fetchDiamondBalance = async () => {
    try {
      const res = await axios.get(`${API}/user/diamonds`, { headers });
      setDiamondBalance(res.data.diamonds || 0);
    } catch { }
  };

  const handleBoostProfile = async (planId, cost = 0) => {
    if (diamondBalance < cost) {
      toast.error('Insufficient diamonds. Redirecting to top-up...');
      setViewMode('diamonds');
      return;
    }
    setConfirmModal({
      title: `Activate ${quantity} Boost(s)?`,
      message: `Are you sure you want to activate this boost ${quantity}x for ${cost * quantity} Diamonds?`,
      action: async () => {
        try {
          setLoading(true);
          for (let i = 0; i < quantity; i++) {
            await axios.post(`${API}/users/activate-boost`, { plan_id: planId }, { headers });
          }
          await fetchUser();
          if (fetchDiamonds) await fetchDiamonds();
          fetchDiamondBalance();
          setSuccessData({ title: 'Profile Boosted!', message: quantity > 1 ? `Success! ${quantity} boosts activated.` : 'You are now at the top for 1 hour!', type: 'diamond' });
          setBoostQuantity(1);
        } catch (err) {
          const detail = err.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Failed to boost profile');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleUnlockAddon = async (type, id, cost, quantity = 1) => {
    const totalCost = cost * quantity;
    if (diamondBalance < totalCost) {
      toast.error('Insufficient diamonds.');
      return;
    }

    setConfirmModal({
      title: `Unlock ${quantity} ${type === 'chat' ? 'Chat Token' : type === 'visitors' ? 'Insights' : type}(s)?`,
      message: `This will cost ${totalCost} diamonds.`,
      icon: type === 'chat' ? MessageSquare : type === 'visitors' ? Eye : ArrowUpRight,
      action: async () => {
        try {
          setLoading(true);
          // Loop the unlock request for multi-purchase
          for (let i = 0; i < quantity; i++) {
            await axios.post(`${API}/users/unlock-addon`, {
              addon_type: type,
              addon_id: id
            }, { headers });
          }
          await fetchUser();
          if (fetchDiamonds) await fetchDiamonds();
          fetchDiamondBalance();
          setSuccessData({
            title: 'Feature Unlocked!',
            message: quantity > 1 ? `Success! ${quantity} items added.` : 'You have gained new powers!',
            type: 'diamond'
          });
          setChatQuantity(1); // Reset
          setInsightQuantity(1); // Reset
        } catch (err) {
          const detail = err.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Failed to unlock feature');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handlePayment = async (planDuration) => {
    setConfirmModal({
      title: 'Confirm Premium Plan',
      message: `Are you sure you want to proceed with the ${planDuration.replace('_', ' ')} plan purchase?`,
      type: 'premium',
      action: async () => {
        setPaying(planDuration);
        try {
          const orderRes = await axios.post(`${API}/subscriptions/create-order`, {
            plan_type: planType,
            plan_duration: planDuration,
            promo_code: promoDiscount > 0 ? promoCode : null
          }, { headers });

          const { order_id, amount, key_id, base_amount, gst_amount, total } = orderRes.data;

          const options = {
            key: key_id,
            amount: amount,
            currency: "INR",
            name: "PlusOneStar",
            description: `${planType} - ${planDuration.replace('_', ' ')} plan`,
            order_id: order_id,
            handler: async function (response) {
              try {
                await axios.post(`${API}/subscriptions/verify-payment`, {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan_type: planType,
                  plan_duration: planDuration
                }, { headers });
                toast.success('Payment successful! Subscription activated.');
                fetchUser();
              } catch {
                toast.error('Payment verification failed. Contact support.');
              }
              setPaying(null);
            },
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
              contact: user?.phone || ""
            },
            notes: { user_id: user?.id },
            theme: { color: "#ec4899" },
            modal: {
              ondismiss: function () { setPaying(null); }
            }
          };

          if (window.Razorpay) {
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
              toast.error('Payment failed: ' + response.error.description);
              setPaying(null);
            });
            rzp.open();
          } else {
            toast.error('Payment gateway not loaded. Please refresh the page.');
            setPaying(null);
          }
        } catch (err) {
          toast.error(err.response?.data?.detail || 'Failed to create payment order');
          setPaying(null);
        }
      }
    });
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setApplyingPromo(true);
    try {
      const validateRes = await axios.post(`${API}/subscriptions/validate-promo`, {
        code: promoCode, plan_type: planType
      }, { headers });
      setPromoDiscount(validateRes.data.discount_percent || 0);

      // Always attempt full redeem to collect all rewards
      try {
        const redeemRes = await axios.post(`${API}/coupons/redeem`, { code: promoCode }, { headers });
        const rewards = redeemRes.data?.rewards || [];
        await fetchUser(); // refresh user wallet / subscription immediately
        setPromoRewardData({
          title: validateRes.data.title || 'Promo Code',
          code: promoCode.toUpperCase(),
          discount: validateRes.data.discount_percent || 0,
          rewards
        });
      } catch (redeemErr) {
        const msg = redeemErr.response?.data?.detail || '';
        if (msg.includes('Already used')) {
          toast.info('You have already used this promo code.');
        } else if (validateRes.data.discount_percent > 0) {
          toast.success(`${validateRes.data.discount_percent}% discount applied!`);
        } else {
          toast.success('Promo code accepted!');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid or expired promo code');
      setPromoDiscount(0);
    }
    setApplyingPromo(false);
  };

  const handleDiamondTopup = async (count) => {
    setConfirmModal({
      title: "Confirm Purchase",
      message: `Proceed to top-up and buy ${count} Diamonds?`,
      action: async () => {
        setDiamondLoading(count);
        try {
          const orderRes = await axios.post(`${API}/diamonds/topup`, { diamond_count: count }, { headers });
          const { order_id, amount, key_id } = orderRes.data;

          const options = {
            key: key_id,
            amount: amount,
            currency: "INR",
            name: "PlusOneStar Diamonds",
            description: `Top-up ${count} Diamonds`,
            order_id: order_id,
            handler: async function (response) {
              try {
                await axios.post(`${API}/diamonds/verify`, {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }, { headers });
                toast.success(`Successfully added ${count} diamonds! 💎`);
                await fetchUser();
                if (fetchDiamonds) await fetchDiamonds();
                fetchDiamondBalance();
              } catch {
                toast.error('Payment verification failed.');
              }
              setDiamondLoading(false);
            },
            prefill: { name: user?.name || "", email: user?.email || "", contact: user?.phone || "" },
            theme: { color: "#ec4899" },
            modal: { ondismiss: function () { setDiamondLoading(false); } }
          };

          if (window.Razorpay) {
            new window.Razorpay(options).open();
          } else {
            toast.error('Payment gateway not loaded.');
            setDiamondLoading(false);
          }
        } catch (err) {
          const detail = err.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Failed to initiate purchase');
          setDiamondLoading(false);
        }
      }
    });
  };

  const sub = user?.subscription || {};
  const isActive = sub.is_active && new Date(sub.end_date) > new Date();

  const currentPlans = planType === 'customer' ? plans.customer_plans : plans.companion_plans;
  const planIcons = [Zap, Crown, Shield];
  const getPlanIcon = (duration) => {
    const d = (duration || '').toLowerCase();
    if (d.includes('trial')) return Sparkles;
    if (d.includes('day')) return Zap;
    if (d.includes('week')) return Shield;
    return Crown;
  };

  return (
    <div className="min-h-screen bg-background" data-testid="subscription-page">
      <Navbar />
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 pt-8 pb-32">

        {/* Global View Toggle - Sub Toggles as requested */}
        <div className="flex flex-col gap-4 mb-10 p-2 rounded-[2rem] bg-muted/20 border border-border/10 backdrop-blur-xl">
          <div className="flex flex-wrap bg-background/50 p-1 rounded-2xl w-full gap-1">
            {[
              { id: 'plans', label: 'PLANS', icon: Crown },
              { id: 'addons', label: 'DIAMOND STORE', icon: Sparkles },
              { id: 'diamonds', label: 'DIAMONDS', icon: Gem },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`flex-1 min-w-[120px] px-6 py-3 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2.5 ${viewMode === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Header Section (PC) */}
        {viewMode === 'plans' && (
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-16 animate-fade-in px-2">

            {/* Left: Special Offer */}
            {systemReferralEnabled && (
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-2.5 px-4 flex items-center gap-3 shadow-none hover:border-amber-500/40 transition-colors max-w-sm lg:max-w-md w-full shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-md">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-[10px] sm:text-[11px] text-foreground uppercase tracking-tight">Special Offer!</h3>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 leading-tight">Get Premium free by inviting friends.</p>
                </div>
              </div>
            )}

            {/* Middle/Right: Promo & Toggles Container */}
            <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
              {/* Promo Code Entry (Now in Header) */}
              <div className="flex gap-2 p-1 rounded-xl bg-muted/30 border border-border/10 focus-within:border-accent/40 transition-all w-full md:w-64">
                <Input
                  placeholder="PROMO CODE"
                  className="border-none bg-transparent shadow-none h-8 focus-visible:ring-0 text-[10px] font-black uppercase px-3"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                />
                <Button
                  size="sm"
                  className={`rounded-lg h-8 px-3 text-[10px] font-black ${promoDiscount > 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'btn-pro'}`}
                  onClick={handleApplyPromo}
                  disabled={applyingPromo || !promoCode}
                >
                  {applyingPromo ? <Loader2 className="w-3 h-3 animate-spin" /> : promoDiscount > 0 ? 'APPLIED' : 'APPLY'}
                </Button>
              </div>

              {/* Plan Type Toggle */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/20 border border-border/10 backdrop-blur-sm w-full md:w-auto overflow-x-auto no-scrollbar">
                <Button
                  variant={planType === 'customer' ? 'default' : 'ghost'}
                  onClick={() => setPlanType('customer')}
                  className={`h-9 px-4 text-[11px] font-black rounded-xl transition-all flex-1 md:flex-none ${planType === 'customer' ? 'shadow-lg shadow-primary/20' : ''}`}
                  size="sm"
                >
                  FIND COMPANION
                </Button>
                <Button
                  variant={planType === 'companion' ? 'default' : 'ghost'}
                  onClick={() => setPlanType('companion')}
                  className={`h-9 px-4 text-[11px] font-black rounded-xl transition-all flex-1 md:flex-none ${planType === 'companion' ? 'shadow-lg shadow-primary/20' : ''}`}
                  size="sm"
                >
                  BE COMPANION
                </Button>
              </div>
            </div>
          </div>
        )}



        {/* Current Subscription */}
        {isActive && viewMode === 'plans' && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 mb-8">
            <CardContent className="p-5 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Active: {sub.plan?.replace('_', ' ')} ({sub.type})</p>
                <p className="text-xs text-green-600/70 dark:text-green-500/70">
                  {sub.is_trial ? 'Free Trial' : 'Paid Plan'} &middot; Expires {new Date(sub.end_date).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}


        {promoDiscount > 0 && (
          <p className="text-[10px] text-emerald-500 font-bold mb-8 text-center animate-bounce">
            🎉 NICE! {promoDiscount}% discount is applied to all plans below.
          </p>
        )}

        {/* Plans Grid */}
        {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}
        {!loading && viewMode === 'plans' && (
          <>


            {/* Paid Plans Grid */}
            <div className={`grid grid-cols-2 md:grid-cols-2 ${planType === 'customer' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 md:gap-8`}>
              {/* Free Plan Card Integrated into Grid */}
              {planType === 'customer' && (
                <Card className="card-hover border-border/40 rounded-[1.5rem] overflow-hidden flex flex-col scale-95 md:scale-100" data-testid="plan-free">
                  <CardContent className="p-4 md:p-6 space-y-4 flex-1 flex flex-col">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Free</h3>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Standard</p>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black tracking-tight">&#8377;0</span>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 opacity-60">Forever</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-lg mt-auto text-[10px] font-black border-emerald-500/20 hover:bg-emerald-500/5"
                      onClick={() => setSelectedPlanDetails({
                        name: 'Free',
                        duration_days: 0,
                        price: 0,
                        max_bookings_per_day: (plans?.free_plan_features || {}).max_bookings_per_day || 1,
                        free_plan: true,
                        features: plans?.free_plan_features
                      })}
                    >
                      VIEW DETAILS
                    </Button>
                  </CardContent>
                </Card>
              )}

              {currentPlans.filter(p => p.duration !== 'lifetime' || plans.lifetime_plan_enabled).map((plan, i) => {
                const Icon = getPlanIcon(plan.duration); // Use the new helper function
                const gstAmount = Math.ceil(plan.price * plans.gst_percentage / 100);
                const total = plan.price + gstAmount;
                const isPopular = plan.duration === '3_months' || plan.duration === 'lifetime' || plan.is_trial;
                const isBestValue = plan.duration === 'lifetime';
                const isTrial = plan.is_trial;
                return (
                  <Card key={plan.id || `plan-${plan.duration}-${i}`} className={`card-hover border-2 rounded-[1.25rem] overflow-hidden flex flex-col scale-90 md:scale-100 ${isPopular ? 'border-primary shadow-xl shadow-primary/10 z-10' : 'border-border/40'} ${isBestValue ? 'border-amber-500 shadow-amber-500/10' : ''} ${isTrial ? 'border-emerald-500 shadow-emerald-500/10' : ''}`} data-testid={`plan-${plan.duration}`}>
                    <CardContent className="p-2.5 md:p-5 space-y-2 md:space-y-3 flex-1 flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                        </div>
                        {(plan.offer_percentage || plan.is_offer || plan.duration === 'lifetime' || isTrial) && (
                          <div className="flex flex-col items-end gap-1 -mr-1 -mt-1">
                            <Badge className={`${isTrial ? 'bg-emerald-500' : 'bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700'} text-white text-[12px] md:text-[14px] font-black border-none px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl uppercase animate-pulse shadow-xl transform hover:scale-110 transition-transform cursor-default tracking-tighter ring-1 ring-white/20`}>
                              {isTrial ? 'FREE TRIAL' : (plan.duration === 'lifetime' ? '65% OFF' : `${plan.offer_percentage || 50}% OFF`)}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-sm md:text-lg font-black tracking-tight leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>{plan.name}</h3>
                        <p className="text-[7px] md:text-[9px] font-bold text-muted-foreground uppercase opacity-60 tracking-wider">
                          {plan.duration === 'lifetime' ? 'Unlimited Validity' : `${plan.duration_days} Days`}
                        </p>
                      </div>
                      <div className="py-0.5">
                        {promoDiscount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground line-through opacity-40 font-bold">&#8377;{plan.price}</span>
                            <span className="text-lg md:text-2xl font-black text-emerald-500">&#8377;{Math.floor(plan.price * (1 - promoDiscount / 100))}</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg md:text-2xl font-black tracking-tight">&#8377;{plan.price}</span>
                            {(plan.offer_percentage > 0 || plan.original_price > 0) && (
                              <span className="text-[8px] md:text-xs text-muted-foreground line-through opacity-30 font-bold">
                                &#8377;{plan.original_price || Math.ceil(plan.price / (1 - (plan.offer_percentage || 20) / 100))}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <p className="text-[7px] md:text-[9px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">Excl. {plans.gst_percentage || 18}% GST</p>
                          <p className="text-[7.5px] md:text-[11px] text-primary font-black uppercase tracking-tight">Total: &#8377;{total} <span className="text-muted-foreground font-bold opacity-50">(incl. &#8377;{gstAmount} GST)</span></p>
                        </div>
                      </div>
                      <Separator className="opacity-10 hidden md:block" />
                      <ul className="space-y-1 flex-1 px-0.5 hidden md:block">
                        <li className="text-[9px] md:text-[10px] font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="opacity-80">{plan.max_bookings_per_day === -1 || plan.max_bookings_per_day > 90 ? 'Unlimited' : plan.max_bookings_per_day} Day Request</span>
                        </li>
                        <li className="text-[9px] md:text-[10px] font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="opacity-80">Premium Chat</span>
                        </li>
                      </ul>
                      <div className="mt-auto space-y-1.5 md:space-y-3">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedPlanDetails(plan)}
                          className="w-full h-8 md:h-9 rounded-lg text-[8px] font-black uppercase tracking-widest border-primary/10 hover:bg-primary/5"
                        >
                          DETAILS
                        </Button>
                        <Button
                          className={`w-full h-8 md:h-11 rounded-lg gap-2 shadow-xl group text-[9px] font-black uppercase tracking-tight ${isBestValue ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' : 'btn-pro shadow-primary/10'}`}
                          onClick={() => {
                            if (plan.is_trial && !user?.face_verified) {
                              toast.error("Face verification required for Free Trial");
                              navigate('/profile');
                              return;
                            }
                            handlePayment(plan.duration);
                          }}
                          disabled={paying === plan.duration}
                        >
                          {paying === plan.duration ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>{plan.is_trial ? 'ACTIVATE' : 'SELECT'}</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}


        {/* Diamonds View */}
        {!loading && viewMode === 'diamonds' && (
          <div className="space-y-10 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {(plans.diamond_packs || []).map(pack => (
                <Card key={pack.id || pack.count} className={`rounded-[1.5rem] relative border-none shadow-lg transition-all hover:scale-[1.02] flex flex-col scale-95 md:scale-100 lg:max-w-[280px] ${pack.popular ? 'ring-1 ring-pink-500 shadow-pink-500/5' : 'bg-muted/10'}`}>
                  <CardContent className="p-3 md:p-5 flex flex-col justify-between h-full space-y-2 pt-6">
                    <div className="flex items-start justify-between absolute -top-2 -right-2">
                      <div className="flex flex-col items-end gap-1">
                        {(pack.offer_percentage || pack.is_offer || pack.popular) && (
                          <Badge className="bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 text-white text-[10px] md:text-[14px] font-black border-none px-3 py-1.5 rounded-xl uppercase animate-pulse shadow-lg shadow-rose-500/30 transform hover:scale-110 transition-transform cursor-default tracking-tighter ring-1 ring-white/10">
                            {pack.offer_percentage || 50}% OFF
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0 shadow-lg shadow-pink-500/5">
                      <Gem className="w-4 h-4" />
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-sm md:text-lg font-black tracking-tight flex items-center gap-1.5">Get {pack.count} <Gem className="w-3 h-3" /></h3>
                      <p className="text-[8px] md:text-[11px] font-bold text-muted-foreground uppercase opacity-60">Gems Pack</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black">{plans?.currency_symbol || '₹'}{pack.price}</span>
                          {(pack.offer_percentage > 0 || pack.original_price > 0) && (
                            <span className="text-[8px] text-muted-foreground line-through opacity-30 font-bold">
                              {plans?.currency_symbol || '₹'}{pack.original_price || Math.ceil(pack.price / (1 - (pack.offer_percentage || 30) / 100))}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col mt-0.5">
                          <p className="text-[7px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">Excl. {plans.gst_percentage || 18}% GST</p>
                          <p className="text-[8px] text-pink-500 font-bold uppercase tracking-tight">Total: {plans?.currency_symbol || '₹'}{Math.ceil(pack.price * (1 + (plans.gst_percentage || 18) / 100))} <span className="text-muted-foreground opacity-50">(incl. GST)</span></p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDiamondTopup(pack.count)}
                      className="w-full h-10 rounded-lg bg-pink-500 hover:bg-pink-600 font-black text-[9px] md:text-[10px]"
                      disabled={diamondLoading === pack.count}
                    >
                      {diamondLoading === pack.count ? <Loader2 className="w-3 h-3 animate-spin" /> : 'BUY NOW'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-pink-500/5 to-primary/5 border border-border/10 flex flex-col md:flex-row items-center gap-8 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-30" />
              <div className="w-20 h-20 rounded-3xl bg-background flex items-center justify-center shadow-xl shrink-0"><ShieldCheck className="w-10 h-10 text-pink-500" /></div>
              <div className="text-center md:text-left flex-1">
                <h3 className="font-black text-lg">Use Diamonds for Rank Bidding</h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">Boost your profile to the top of the "Today" leaderboard. Higher visibility leads to more connections and more meaningful interactions.</p>
                <div className="mt-4 p-3 rounded-xl bg-pink-500/5 border border-pink-500/10 inline-block">
                  <p className="text-[10px] font-bold text-pink-600 flex items-center gap-2 italic">
                    <Info className="w-3 h-3" /> Use these diamonds for bidding in a later board. You can also purchase items in the Diamond Store using diamonds.
                  </p>
                </div>
              </div>
              <Button variant="ghost" className="md:ml-auto gap-2 font-bold text-xs" onClick={() => navigate('/leaderboard')}>View Leaderboard <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* Add-ons View - Glow Store Edition */}
        {!loading && viewMode === 'addons' && (
          <div className="space-y-10 animate-fade-in max-w-6xl mx-auto relative">
            {/* Background Glows */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="flex flex-col gap-8 relative z-10">
              {/* Visuals / Wallet section removed as per user request (redundant) */}

              {/* 3-Tab Store Toggle */}
              <div className="flex bg-muted/20 p-1 rounded-2xl w-full md:w-fit mx-auto border border-border/10 backdrop-blur-xl flex-wrap justify-center sm:flex-nowrap">
                {[
                  { id: 'chat', label: 'CHAT', icon: MessageSquare },
                  { id: 'boost', label: 'BOOST', icon: ArrowUpRight },
                  { id: 'visitors', label: 'INSIGHTS', icon: Eye }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStoreTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[9px] font-black transition-all flex-1 sm:flex-none ${activeStoreTab === tab.id ? 'bg-background shadow-lg text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 ${activeStoreTab === tab.id ? 'text-primary' : ''}`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 py-4">
                {activeStoreTab === 'chat' && (plans?.add_ons?.chat || []).map((addon, index) => (
                  <Card key={addon.id || `chat_${index}`} className="rounded-[2rem] relative border-white/5 bg-background/40 backdrop-blur-3xl p-4 md:p-5 space-y-2 group hover:border-emerald-500/30 transition-all pt-8">
                    <div className="flex items-start justify-between absolute -top-3 -right-3">
                      <div className="flex flex-col items-end gap-1.5">
                        {(addon.offer_percentage || addon.is_offer) && (
                          <Badge className="bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 text-white text-[12px] md:text-[14px] font-black border-none px-4 py-2 rounded-2xl uppercase animate-pulse shadow-2xl shadow-rose-500/50 transform hover:scale-110 transition-transform cursor-default tracking-tighter ring-2 ring-white/20">
                            {addon.offer_percentage ? `${addon.offer_percentage}% OFF` : 'OFFER'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/5">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg tracking-tight">{addon.name}</h4>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                        {addon.unlocks_count || 1} Premium Conversations
                      </p>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-baseline gap-2">
                        <p className="text-xl font-black flex items-center gap-1.5"><Gem className="w-5 h-5 text-pink-500" /> {addon.cost * chatQuantity}</p>
                        {(addon.is_offer === true || addon.is_offer === 'true') && addon.original_price && (
                          <span className="text-[10px] text-muted-foreground line-through font-bold opacity-30">{addon.original_price * chatQuantity}</span>
                        )}
                      </div>

                      {/* Quantity Selector Chat */}
                      <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-secondary/30 border border-border/10">
                        <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity</span>
                        <div className="flex items-center justify-between px-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setChatQuantity(Math.max(1, chatQuantity - 1)); }}
                            className="w-6 h-6 rounded-lg bg-background/50 hover:bg-background flex items-center justify-center transition-colors border border-border/10 shadow-sm"
                          >
                            <span className="text-foreground font-bold text-xs">-</span>
                          </button>
                          <span className="text-[11px] font-black text-emerald-500">{chatQuantity}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setChatQuantity(Math.min(20, chatQuantity + 1)); }}
                            className="w-6 h-6 rounded-lg bg-background/50 hover:bg-background flex items-center justify-center transition-colors border border-border/10 shadow-sm"
                          >
                            <span className="text-foreground font-bold text-xs">+</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    <Button
                      onClick={() => handleUnlockAddon('chat', addon.id || addon.name, addon.cost, chatQuantity)}
                      className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black text-[9px] shadow-xl shadow-emerald-500/20 uppercase"
                    >
                      UNLOCK {chatQuantity > 1 ? `(${chatQuantity})` : ''}
                    </Button>

                  </Card>
                ))}

                {activeStoreTab === 'boost' && (plans?.boost_plans || []).map((bp, index) => (
                  <Card key={bp.id || `boost_${index}`} className="rounded-[2rem] relative border-white/5 bg-background/40 backdrop-blur-3xl p-4 md:p-5 space-y-2 group hover:border-amber-500/30 transition-all pt-8">
                    <div className="flex items-start justify-between absolute -top-3 -right-3">
                      <div className="flex flex-col items-end gap-1.5">
                        {(bp.offer_percentage || bp.is_offer) && (
                          <Badge className="bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 text-white text-[12px] md:text-[14px] font-black border-none px-4 py-2 rounded-2xl uppercase animate-pulse shadow-2xl shadow-rose-500/50 transform hover:scale-110 transition-transform cursor-default tracking-tighter ring-2 ring-white/20">
                            {bp.offer_percentage ? `${bp.offer_percentage}% OFF` : 'OFFER'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/5">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg tracking-tight">{bp.name}</h4>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                        {bp.duration} Priority Visibility
                      </p>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-col">
                        <p className="text-xl font-black flex items-center gap-1.5"><Gem className="w-5 h-5 text-pink-500" /> {bp.price * boostQuantity}</p>
                        {(bp.offer_percentage > 0 || bp.original_price > 0) && (
                          <span className="text-[10px] text-muted-foreground line-through font-bold opacity-30">
                            {(bp.original_price || Math.ceil(bp.price / (1 - (bp.offer_percentage || 20) / 100))) * boostQuantity}
                          </span>
                        )}
                      </div>

                      {/* Quantity Selector Boost */}
                      <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-secondary/30 border border-border/10">
                        <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity</span>
                        <div className="flex items-center justify-between px-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setBoostQuantity(Math.max(1, boostQuantity - 1)); }}
                            className="w-6 h-6 rounded-lg bg-background/50 hover:bg-background flex items-center justify-center transition-colors border border-border/10 shadow-sm"
                          >
                            <span className="text-foreground font-bold text-xs">-</span>
                          </button>
                          <span className="text-[11px] font-black text-amber-500">{boostQuantity}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setBoostQuantity(Math.min(20, boostQuantity + 1)); }}
                            className="w-6 h-6 rounded-lg bg-background/50 hover:bg-background flex items-center justify-center transition-colors border border-border/10 shadow-sm"
                          >
                            <span className="text-foreground font-bold text-xs">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleBoostProfile(bp.id || bp.name, bp.price, boostQuantity)}
                      className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 font-black text-[9px] shadow-xl shadow-amber-500/20 uppercase"
                    >
                      BOOST {boostQuantity > 1 ? `(${boostQuantity})` : ''}
                    </Button>
                  </Card>
                ))}

                {activeStoreTab === 'visitors' && (plans?.add_ons?.visitors || []).map((addon, index) => (
                  <Card key={addon.id || `visitor_${index}`} className="rounded-[2rem] relative border-white/5 bg-background/40 backdrop-blur-3xl p-4 md:p-5 space-y-2 group hover:border-blue-500/30 transition-all pt-8">
                    <div className="flex items-start justify-between absolute -top-3 -right-3">
                      <div className="flex flex-col items-end gap-1.5">
                        {(addon.offer_percentage || addon.is_offer) && (
                          <Badge className="bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 text-white text-[12px] md:text-[14px] font-black border-none px-4 py-2 rounded-2xl uppercase animate-pulse shadow-2xl shadow-rose-500/50 transform hover:scale-110 transition-transform cursor-default tracking-tighter ring-2 ring-white/20">
                            {addon.offer_percentage ? `${addon.offer_percentage}% OFF` : 'OFFER'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/5">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg tracking-tight">{addon.name}</h4>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                        {addon.duration} Days Full Analytics
                      </p>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-baseline gap-2">
                        <p className="text-xl font-black flex items-center gap-1.5"><Gem className="w-5 h-5 text-pink-500" /> {addon.cost * insightQuantity}</p>
                        {(addon.is_offer === true || addon.is_offer === 'true') && addon.original_price && (
                          <span className="text-[10px] text-muted-foreground line-through font-bold opacity-30">{addon.original_price * insightQuantity}</span>
                        )}
                      </div>

                      {/* Quantity Selector Insights */}
                      <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-secondary/30 border border-border/10">
                        <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity</span>
                        <div className="flex items-center justify-between px-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setInsightQuantity(Math.max(1, insightQuantity - 1)); }}
                            className="w-6 h-6 rounded-lg bg-background/50 hover:bg-background flex items-center justify-center transition-colors border border-border/10 shadow-sm"
                          >
                            <span className="text-foreground font-bold text-xs">-</span>
                          </button>
                          <span className="text-[11px] font-black text-blue-500">{insightQuantity}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setInsightQuantity(Math.min(20, insightQuantity + 1)); }}
                            className="w-6 h-6 rounded-lg bg-background/50 hover:bg-background flex items-center justify-center transition-colors border border-border/10 shadow-sm"
                          >
                            <span className="text-foreground font-bold text-xs">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUnlockAddon('visitors', addon.id || addon.name, addon.cost, insightQuantity)}
                      className="w-full h-10 rounded-xl bg-blue-500 hover:bg-blue-700 font-black text-[9px] shadow-xl shadow-blue-600/20 uppercase"
                    >
                      UNMASK {insightQuantity > 1 ? `(${insightQuantity})` : ''}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'plans' && (
          <p className="text-center text-[10px] text-muted-foreground mt-12 max-w-2xl mx-auto opacity-60">
            * Lifetime plans are valid only while the platform remains operational. Admin reserves the right to enable/disable or modify lifetime plans at any time. Subscription fees are non-refundable unless approved.
          </p>
        )}

        <footer className="mt-24 border-t border-border/10 pt-12 pb-16 flex flex-col items-center justify-center gap-6 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
            <Star className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-2">
            <span className="text-lg font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>PlusOneStar Premium</span>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed opacity-70">
              The ultimate companion experience. Join thousands of users finding their perfect match every day.
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-4">
            &copy; {new Date().getFullYear()} PlusOneStar. All rights reserved.<br />
            Contact: support@plusonestar.com
          </p>
        </footer>
      </div>
      {/* Plan Details Modal */}
      <Dialog open={!!selectedPlanDetails} onOpenChange={(open) => !open && setSelectedPlanDetails(null)}>
        <DialogContent className="max-w-md w-[95%] sm:w-full rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-3xl max-h-[90vh] flex flex-col mx-auto transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]">
          <DialogTitle className="sr-only">Confirm Transaction</DialogTitle>
          <div className="bg-primary p-3.5 md:p-6 text-white relative shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Crown className="w-3.5 h-3.5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-base md:text-2xl font-black uppercase tracking-tighter leading-none">{selectedPlanDetails?.name}</h2>
                <p className="text-[7.5px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{selectedPlanDetails?.duration_days} Days Access</p>
              </div>
            </div>
            <button onClick={() => setSelectedPlanDetails(null)} className="absolute top-3.5 right-4 md:top-6 md:right-6 text-white/40 hover:text-white transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 md:p-6 space-y-2.5 md:y-5 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="p-2.5 md:p-4 rounded-2xl bg-muted/20 border border-border/5">
                <p className="text-[7.5px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Price</p>
                <p className="text-sm md:text-xl font-black text-primary">&#8377;{selectedPlanDetails?.price}</p>
              </div>
              <div className="p-2.5 md:p-4 rounded-2xl bg-muted/20 border border-border/5">
                <p className="text-[7.5px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Validity</p>
                <p className="text-sm md:text-[11px] font-black text-primary capitalize">{selectedPlanDetails?.duration_days} Days</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground px-1">Detailed Features</h3>
              <div className="grid grid-cols-1 gap-0.5 p-1 rounded-2xl bg-muted/10 border border-border/5">
                {[
                  { label: "Daily Booking Requests", value: selectedPlanDetails?.max_bookings_per_day === -1 ? 'Unlimited' : selectedPlanDetails?.max_bookings_per_day, active: true },
                  { label: "Premium Chat Unlocks", value: selectedPlanDetails?.free_plan ? `${selectedPlanDetails.features?.chat_unlock_limit || 0}` : "Unlimited", active: true },
                  { label: "Instant Chat Access", active: !selectedPlanDetails?.free_plan },
                  { label: "High-Speed Video Calls", active: selectedPlanDetails?.video_calls_enabled || selectedPlanDetails?.features?.video_call_enabled },
                  { label: "Advanced Search Filters", active: selectedPlanDetails?.advanced_features || selectedPlanDetails?.features?.filter_access },
                  { label: "Premium Profile Highlights", active: selectedPlanDetails?.pap_badges || selectedPlanDetails?.features?.pap_badges },
                  { label: "Visitor Insights History", active: selectedPlanDetails?.features?.visitor_insights },
                  { label: "Professional Mode", active: !selectedPlanDetails?.free_plan },
                  { label: "Priority Support", active: true }
                ].map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-1 md:p-2 rounded-xl hover:bg-muted/20 transition-all duration-200">
                    <div className="flex items-center gap-2">
                      {f.active ? <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-500/10" /> : <XCircle className="w-3 h-3 text-rose-500/30" />}
                      <span className={`text-[9px] md:text-[11px] font-bold ${f.active ? 'text-foreground' : 'text-muted-foreground/40'}`}>{f.label}</span>
                    </div>
                    {f.value && <span className="text-[7.5px] font-black text-primary/60 uppercase">{f.value}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 pb-12 md:pb-6 md:p-6 bg-background border-t border-border/5 shrink-0">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-10 md:h-11 rounded-xl font-black text-[9px] uppercase tracking-widest" onClick={() => setSelectedPlanDetails(null)}>
                Cancel
              </Button>
              <Button
                className="flex-[2] h-10 md:h-11 rounded-xl btn-pro font-black text-[10.5px] uppercase tracking-widest shadow-xl shadow-primary/20"
                onClick={() => {
                  const duration = selectedPlanDetails.duration;
                  setSelectedPlanDetails(null);
                  handlePayment(duration);
                }}
              >
                Confirm & Purchase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ PROMO CODE REWARD POPUP ═══ */}
      {promoRewardData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_60%)]" />
            <div className="absolute top-4 left-8 w-2 h-2 bg-white/60 rounded-full animate-bounce" />
            <div className="absolute top-8 right-10 w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            <div className="absolute bottom-12 left-6 w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
            <button
              onClick={() => setPromoRewardData(null)}
              className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="relative px-7 pt-8 pb-7 flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl">
                <span className="text-4xl select-none">🎉</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-1">Promo Code Applied</p>
                <h2 className="text-2xl font-black text-white leading-tight">Congratulations!</h2>
                <p className="text-sm text-white/80 font-semibold mt-1">
                  Code <span className="font-black text-white">{promoRewardData.code}</span> redeemed ✓
                </p>
              </div>
              {promoRewardData.rewards.length > 0 && (
                <div className="w-full space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Your Rewards</p>
                  {promoRewardData.rewards.map((reward, i) => {
                    const isD = reward.includes('diamond');
                    const isSub = reward.includes('subscription') || (reward.includes('day') && !reward.includes('visitor') && !reward.includes('filter'));
                    const isChat = reward.includes('chat');
                    const isBoost = reward.includes('boost');
                    const isVisit = reward.includes('visitor');
                    return (
                      <div key={i} className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                        <span className="text-xl">{isD ? '💎' : isSub ? '👑' : isChat ? '💬' : isBoost ? '⚡' : isVisit ? '👁️' : '🎁'}</span>
                        <span className="text-sm font-black text-white capitalize">{reward}</span>
                      </div>
                    );
                  })}
                  {promoRewardData.discount > 0 && (
                    <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                      <span className="text-xl">🏷️</span>
                      <span className="text-sm font-black text-white">{promoRewardData.discount}% discount on checkout</span>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => setPromoRewardData(null)}
                className="w-full h-12 rounded-2xl bg-white text-amber-600 font-black uppercase tracking-widest text-xs shadow-lg hover:bg-white/90 transition-all hover:-translate-y-0.5"
              >
                Awesome, Thanks! 🙌
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Universal Confirm Dialog - Premium Card Edition */}
      <Dialog open={!!confirmModal} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent className="max-w-[360px] w-[95vw] rounded-[3rem] p-0 overflow-hidden border-none bg-zinc-950 shadow-2xl no-scrollbar animate-in zoom-in-95 duration-200">
          <DialogTitle className="sr-only">Confirm Transaction</DialogTitle>

          <div className="relative overflow-hidden rounded-[3rem]">
            {/* Shimmering Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900" />
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative p-8 flex flex-col items-center text-center gap-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 ${
                confirmModal?.title?.toLowerCase().includes('premium') || confirmModal?.type === 'premium' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                confirmModal?.title?.toLowerCase().includes('boost') ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                'bg-gradient-to-br from-emerald-400 to-emerald-600'
              }`}>
                {confirmModal?.title?.toLowerCase().includes('boost') ? (
                  <Zap className="w-10 h-10 text-white fill-white/20" />
                ) : confirmModal?.title?.toLowerCase().includes('unlock') ? (
                  <MessageSquare className="w-10 h-10 text-white fill-white/20" />
                ) : (
                  <Crown className="w-10 h-10 text-white fill-white/20" />
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tighter" style={{ fontFamily: 'var(--font-heading)' }}>
                  {confirmModal?.title || 'Confirm Action'}
                </h2>
                <div className="h-0.5 w-12 bg-primary/50 mx-auto rounded-full" />
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-4">
                  {confirmModal?.message}
                </p>
              </div>

              <div className="w-full flex flex-col gap-2 pt-4">
                <Button
                  className="h-12 rounded-2xl bg-white hover:bg-zinc-100 text-black font-black shadow-xl shadow-white/5 uppercase tracking-wider text-[10px]"
                  onClick={() => {
                    if (confirmModal?.action) confirmModal.action();
                    setConfirmModal(null);
                  }}
                >
                  Yes, Proceed with Purchase
                </Button>
                <Button
                  variant="ghost"
                  className="h-10 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[9px]"
                  onClick={() => setConfirmModal(null)}
                >
                  Cancel Request
                </Button>
              </div>
            </div>
            
            {/* Premium Gold Border Overlay (Optional for Premium) */}
            {(confirmModal?.title?.toLowerCase().includes('premium') || confirmModal?.type === 'premium') && (
              <div className="absolute inset-0 z-40 pointer-events-none rounded-[3rem]" style={{
                padding: '2.5px',
                background: 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }} />
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Success Overlay Expansion */}
      <PurchaseSuccessOverlay
        isOpen={!!successData}
        onClose={() => setSuccessData(null)}
        title={successData?.title}
        message={successData?.message}
        type={successData?.type}
      />
    </div>
  );
}
