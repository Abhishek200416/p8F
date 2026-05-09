import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Gem, Zap, ShieldCheck, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : (process.env.REACT_APP_API_URL || '/api');


export default function DiamondsPage() {
  const { user, token, fetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [diamondPacks, setDiamondPacks] = useState([]);
  const [settings, setSettings] = useState({ currency_symbol: '₹' });

  useEffect(() => {
    fetchBalance();
    fetchPacks();
  }, [token]);

  const fetchPacks = async () => {
    try {
      const res = await axios.get(`${API}/subscriptions/plans`);
      const packs = res.data.diamond_packs || res.data.diamondPacks || (Array.isArray(res.data) ? res.data : []);
      setDiamondPacks(packs);
      // Optionally fetch full settings if needed, but currency is usually ₹
    } catch {}
  };

  const fetchBalance = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/user/diamonds`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(res.data.diamonds || 0);
    } catch {}
  };

  const handleTopup = async (count) => {
    if (!token) {
      toast.error('Please log in to purchase diamonds');
      return;
    }
    setLoading(true);
    try {
      const orderRes = await axios.post(`${API}/diamonds/topup`, 
        { diamond_count: count }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { order_id, amount, key_id, total_amount } = orderRes.data;

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
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            toast.success(`Successfully added ${count} diamonds! 💎`);
            fetchUser();
            fetchBalance();
          } catch {
            toast.error('Payment verification failed.');
          }
          setLoading(false);
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || ""
        },
        theme: { color: "#ec4899" }, // Pinkish theme for diamonds
        modal: {
          ondismiss: function () { setLoading(false); }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error('Payment gateway not loaded. Please refresh.');
        setLoading(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to initiate purchase');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-6 md:pt-10 pb-32">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12 space-y-3">
          <div className="inline-flex items-center justify-center p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] bg-pink-500/10 border border-pink-500/20 shadow-2xl shadow-pink-500/10 animate-bounce-in">
            <Gem className="w-8 h-8 md:w-10 md:h-10 text-pink-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Top-up <span className="text-pink-500">Diamonds</span>
          </h1>
          <p className="text-muted-foreground text-[10px] md:text-sm max-w-xs md:max-w-md mx-auto leading-relaxed">
            Use diamonds to bid for rank positions on the <strong>Today</strong> leaderboard and gain massive profile visibility.
          </p>
          
          <div className="flex items-center justify-center gap-2 pt-2">
            <Badge variant="outline" className="h-8 md:h-10 px-4 md:px-6 rounded-xl md:rounded-2xl bg-pink-500/5 text-pink-500 border-pink-500/20 text-[10px] md:text-sm font-black">
              Balance: {balance} 💎
            </Badge>
          </div>
        </div>

        {/* Packs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
          {diamondPacks.map((pack) => (
            <Card 
              key={pack.id || pack.count} 
              className={`relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] transition-all duration-300 hover:scale-[1.02] border-none shadow-lg
                ${pack.popular ? 'ring-1 ring-pink-500 shadow-pink-500/10' : 'bg-muted/5'}`}
            >
              {pack.popular && (
                <div className="absolute top-0 right-4 md:right-6 bg-pink-500 text-white text-[7px] md:text-[8px] font-black uppercase px-2 md:px-3 py-0.5 md:py-1 rounded-b-lg tracking-widest z-10 shadow-md">
                  POPULAR
                </div>
              )}
              
              <CardContent className="p-4 md:p-6 space-y-3 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-1">
                      <h3 className="text-lg md:text-2xl font-black tracking-tighter leading-none">{pack.count}</h3>
                      <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Gems</p>
                    </div>
                    {pack.offers && <p className="text-[7px] md:text-[8px] font-black text-pink-500 uppercase tracking-tighter leading-none">{pack.offers}</p>}
                  </div>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${pack.popular ? 'bg-pink-500/10 text-pink-500' : 'bg-muted/20 text-muted-foreground'}`}>
                    <Gem className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>

                <div className="space-y-1 flex-1 min-h-[40px] md:min-h-[60px]">
                  <div className="flex items-center gap-1 text-[8px] md:text-[9px] font-bold opacity-70">
                    <CheckCircle className="w-2 md:w-2.5 h-2 md:h-2.5 text-emerald-500 shrink-0" />
                    <span>Instant Credit</span>
                  </div>
                  {pack.count >= 1000 && (
                     <div className="flex items-center gap-1 text-[8px] md:text-[9px] font-black opacity-80 text-pink-600">
                       <Zap className="w-2 md:w-2.5 h-2 md:h-2.5 text-amber-500 shrink-0" />
                       <span className="uppercase tracking-tighter">VIP Perks</span>
                     </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <p className="text-base md:text-lg font-black tracking-tight leading-none">{settings.currency_symbol}{pack.price}</p>
                    <p className="text-[6px] md:text-[7px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">incl. tax</p>
                  </div>
                  <Button 
                    onClick={() => handleTopup(pack.count)}
                    disabled={loading}
                    className="w-full h-8 md:h-11 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest"
                  >
                    {loading ? <Loader2 className="w-3 md:w-3.5 h-3 md:h-3.5 animate-spin" /> : 'Buy Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footnote */}
        <div className="mt-8 p-4 rounded-2xl bg-pink-500/5 border border-pink-500/10 text-center">
          <p className="text-[10px] md:text-xs font-bold text-pink-600 flex items-center justify-center gap-2 italic">
            <Info className="w-3 md:w-4 h-3 md:h-4 shrink-0" />
            Use these diamonds for bidding in a later board. You can also purchase items in the Diamond Store using diamonds.
          </p>
        </div>

        {/* Info Footer */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-background border border-border/10 flex md:block items-center md:text-left gap-4 space-y-0 md:space-y-3">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
               <ShieldCheck className="w-5 h-5 md:w-8 md:h-8 text-pink-500" />
             </div>
             <div>
               <h4 className="font-bold text-sm md:text-base">Secure Payment</h4>
               <p className="text-[9px] md:text-[10px] text-muted-foreground leading-relaxed">Secure transaction processing with 256-bit encryption.</p>
             </div>
          </div>
          <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-background border border-border/10 flex md:block items-center md:text-left gap-4 space-y-0 md:space-y-3">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
               <Zap className="w-5 h-5 md:w-8 md:h-8 text-amber-500" />
             </div>
             <div>
               <h4 className="font-bold text-sm md:text-base">Instant Activation</h4>
               <p className="text-[9px] md:text-[10px] text-muted-foreground leading-relaxed">Diamonds are credited immediately upon successful payment.</p>
             </div>
          </div>
          <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-background border border-border/10 flex md:block items-center md:text-left gap-4 space-y-0 md:space-y-3">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
               <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-emerald-500" />
             </div>
             <div>
               <h4 className="font-bold text-sm md:text-base">Flexible Price</h4>
               <p className="text-[9px] md:text-[10px] text-muted-foreground leading-relaxed">1 Diamond ≈ ₹3 base value. All taxes included.</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
