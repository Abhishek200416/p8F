import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Megaphone, Ticket, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';
const STORAGE_KEY = 'plusone_campaign_popup_date';

export default function DailyCampaignPopup() {
  const [show, setShow] = useState(false);
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return; // already shown today

    // Fetch active campaigns/offers
    axios.get(`${API}/campaigns-offers`)
      .then(res => {
        const campaigns = res.data.campaigns || [];
        const offers = res.data.offers || [];
        const all = [...campaigns, ...offers].filter(c => c.active !== false);
        if (all.length > 0) {
          const randomItem = all[Math.floor(Math.random() * all.length)];
          setCampaign(randomItem);
          setTimeout(() => setShow(true), 2000); // show after 2s
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    setShow(false);
  };

  const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const base = API.replace('/api', '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  if (!show || !campaign) return null;

  const isOffer = !!campaign.code;


  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Popup card */}
      <div className="relative w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500 bg-background border border-border/10">
        {/* Banner image */}
        { (campaign.mobile_banner_url || campaign.desktop_banner_url || campaign.banner_url) ? (
          <div className="relative h-56 group">
            <img
              src={getMediaUrl(
                window.innerWidth < 640 
                  ? (campaign.mobile_banner_url || campaign.banner_url || campaign.desktop_banner_url)
                  : (campaign.desktop_banner_url || campaign.banner_url || campaign.mobile_banner_url)
              )}
              alt={campaign.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            {/* NPC Image Overlay */}
            {campaign.npc_image_url && (
              <div className="absolute -bottom-2 -left-2 w-32 h-32 z-10 animate-in fade-in zoom-in duration-700 delay-300">
                <img 
                  src={getMediaUrl(campaign.npc_image_url)} 
                  alt="Character" 
                  className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" 
                />
              </div>
            )}
          </div>
        ) : (
          <div className={`h-32 flex items-center justify-center ${isOffer ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-pink-500 to-rose-600'}`}>
            {isOffer ? <Ticket className="w-16 h-16 text-white/50" /> : <Megaphone className="w-16 h-16 text-white/50" />}
            
            {/* NPC Image Overlay for fallback background too */}
            {campaign.npc_image_url && (
              <div className="absolute -bottom-2 -left-2 w-28 h-28 z-10 animate-in fade-in zoom-in duration-700">
                <img 
                  src={getMediaUrl(campaign.npc_image_url)} 
                  alt="Character" 
                  className="w-full h-full object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.3)]" 
                />
              </div>
            )}
          </div>
        )}

        <div className="bg-background p-6 space-y-4">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 mb-1">
              {isOffer ? (
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Exclusive Offer</span>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-widest text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full">Campaign</span>
              )}
            </div>
            <h3 className="text-xl font-black tracking-tight">{campaign.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{campaign.description}</p>
          </div>

          {isOffer && campaign.code && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Ticket className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Promo Code</p>
                <p className="font-black text-emerald-500 tracking-widest">{campaign.code}</p>
              </div>
            </div>
          )}

          {campaign.diamond_reward > 0 && (
            <p className="text-sm font-bold text-pink-500">Reward: +{campaign.diamond_reward} Diamonds</p>
          )}

          <div className="flex gap-3">
            <Button onClick={handleClose} variant="outline" className="flex-1 h-12 rounded-xl font-black text-xs">
              Later
            </Button>
            <Button
              asChild
              className={`flex-1 h-12 rounded-xl font-black text-xs ${isOffer ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-pink-500 hover:bg-pink-600'} text-white`}
            >
              <Link to="/campaign" onClick={handleClose}>
                {isOffer ? 'Redeem Now' : 'View Campaign'} <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
