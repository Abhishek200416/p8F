import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Navigation, Shield, Loader2, AlertTriangle, MapPin, Clock, CheckCircle, ArrowRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

// Safety notice overlay shown before form
function SafetyNoticeStep({ companion, accentHex, onContinue, onClose }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-5 flex-1">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Before You Book</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Please read these important guidelines carefully before sending a companion request.
          </p>
        </div>

        {/* Notices */}
        <div className="space-y-3">
          {[
            {
              icon: MapPin,
              color: 'text-blue-500',
              bg: 'bg-blue-500/10 border-blue-500/25',
              title: 'Verify the Venue Yourself',
              desc: 'PlusOneStar is a bridge platform. We do NOT verify venues. You are fully responsible for confirming the venue is legitimate, safe, and publicly accessible before committing.'
            },
            {
              icon: AlertTriangle,
              color: 'text-rose-500',
              bg: 'bg-rose-500/10 border-rose-500/25',
              title: 'Never Pay in Advance',
              desc: 'Do NOT transfer any payment before meeting the companion at the venue. All payments should happen in person after you verify their identity at the confirmed location.'
            },
            {
              icon: CheckCircle,
              color: 'text-emerald-500',
              bg: 'bg-emerald-500/10 border-emerald-500/25',
              title: 'Meet at Public Places Only',
              desc: 'All meetings must happen at fully public venues. Never agree to meet at private residences, secluded spots, or unverified locations.'
            },
            {
              icon: Shield,
              color: 'text-amber-500',
              bg: 'bg-amber-500/10 border-amber-500/25',
              title: 'Protect Your Personal Information',
              desc: 'Do not share personal details — your home address, financial information, or private social media — until you feel completely comfortable and safe. Never fall for anything that seems suspicious. Stay conscious and trust your instincts.'
            },
            {
              icon: Info,
              color: 'text-purple-500',
              bg: 'bg-purple-500/10 border-purple-500/25',
              title: 'Your Responsibility',
              desc: 'PlusOneStar provides identity verification and safety notices only. Every interaction and all decisions are the sole responsibility of the parties involved.'
            }
          ].map(({ icon: Icon, color, bg, title, desc }, i) => (
            <div key={i} className={`flex gap-4 p-4 rounded-2xl border-2 ${bg} mb-3 last:mb-0`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-4.5 h-4.5 ${color} shrink-0`} />
              </div>
              <div className="space-y-1.5">
                <p className={`text-xs font-black ${color} tracking-wide`}>{title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-border/10 bg-background/80 backdrop-blur-sm space-y-2">
        <Button
          className="w-full h-12 font-black text-sm gap-2"
          style={{ background: accentHex, color: '#fff', border: 'none' }}
          onClick={onContinue}
        >
          I Understand — Continue to Book <ArrowRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={onClose}>
          Go Back
        </Button>
      </div>
    </div>
  );
}

export function BookingFormModal({ isOpen, onClose, companion, token, initialMode = 'casual' }) {
  const [step, setStep] = useState('notice'); // 'notice' | 'form' | 'confirm'
  const [submitting, setSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    event_name: '', event_type: initialMode, venue: '', venue_address: '',
    google_maps_link: '', reason: '', instructions: '',
    date: '', time: '', meeting_time: '',
    prep_instructions: '', meeting_point_details: '',
    duration_hours: 2
  });

  // Hide bottom nav when modal is open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.setAttribute('data-modal-open', 'true');
    } else {
      document.documentElement.removeAttribute('data-modal-open');
    }
    return () => document.documentElement.removeAttribute('data-modal-open');
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setBookingForm(prev => ({ ...prev, event_type: initialMode }));
      setStep('notice');
    }
  }, [isOpen, initialMode]);

  const handleClose = () => {
    onClose();
    setStep('notice');
  };

  const submitBooking = async () => {
    if (!bookingForm.event_name || !bookingForm.venue || !bookingForm.date || !bookingForm.time) {
      toast.error('Please fill all required fields');
      setStep('form');
      return;
    }
    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/bookings`, {
        companion_id: companion.id,
        ...bookingForm,
        duration_hours: parseInt(bookingForm.duration_hours)
      }, { headers });
      toast.success('Companion request sent successfully!');
      handleClose();
      setBookingForm({
        event_name: '', event_type: initialMode, venue: '', venue_address: '',
        google_maps_link: '', reason: '', instructions: '',
        date: '', time: '', meeting_time: '',
        prep_instructions: '', meeting_point_details: '',
        duration_hours: 2
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Booking request failed');
      setStep('form');
    }
    setSubmitting(false);
  };

  if (!companion) return null;

  const cp = companion.companion_profile || {};
  
  const casualPrice = cp.casual_price || companion.casual_price || 0;
  const proPrice = cp.professional_price || companion.professional_price || 0;

  const currentPrice = bookingForm.event_type === 'casual' ? casualPrice : proPrice;

  const totalCost = currentPrice * (parseInt(bookingForm.duration_hours) || 0);

  const currentBio = bookingForm.event_type === 'casual'
    ? (companion.casual_bio || cp.casual_bio || 'No casual bio available.')
    : (companion.professional_bio || cp.professional_bio || 'No professional bio available.');

  const accentHex = bookingForm.event_type === 'casual' ? '#f43f5e' : '#3b82f6';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden p-0 border-none shadow-2xl rounded-none sm:rounded-[2rem] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 bg-muted/20 border-b border-border/10 shrink-0">
          <DialogTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accentHex}18` }}>
                <Calendar className="w-4 h-4" style={{ color: accentHex }} />
              </div>
              <div>
                <p className="text-base font-black leading-tight">Request {companion.name || 'Companion'}</p>
                <p className="text-[10px] font-medium text-muted-foreground">
                  {step === 'notice' ? 'Safety Guidelines' : step === 'confirm' ? 'Confirm Booking' : 'Booking Details'}
                </p>
              </div>
            </div>
            {/* Step indicator */}
            <div className="flex gap-1.5">
              {['notice', 'form', 'confirm'].map((s, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${step === s ? 'w-6' : 'w-2'}`}
                  style={{ background: step === s ? accentHex : `${accentHex}30` }} />
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Step: Safety Notice */}
        {step === 'notice' && (
          <div className="flex-1 overflow-y-auto">
            <SafetyNoticeStep
              companion={companion}
              accentHex={accentHex}
              onContinue={() => setStep('form')}
              onClose={handleClose}
            />
          </div>
        )}

        {/* Step: Form */}
        {step === 'form' && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-5 pb-32 sm:pb-10 space-y-12 max-w-full">
              {/* Event Mode Selection */}
              <div className="space-y-4 pb-4 border-b border-border/5">
                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 block text-center">Companion Mode *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingForm({ ...bookingForm, event_type: 'casual' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${bookingForm.event_type === 'casual' ? 'border-rose-500 bg-rose-500/5' : 'border-border/30 hover:border-rose-500/40'}`}
                  >
                    <p className="text-xs font-black text-rose-500">Casual</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{casualPrice > 0 ? `₹${casualPrice}/hr` : 'Contact for Price'}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingForm({ ...bookingForm, event_type: 'professional' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${bookingForm.event_type === 'professional' ? 'border-blue-500 bg-blue-500/5' : 'border-border/30 hover:border-blue-500/40'}`}
                  >
                    <p className="text-xs font-black text-blue-500">Professional</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{proPrice > 0 ? `₹${proPrice}/hr` : 'Contact for Price'}</p>
                  </button>
                </div>
                {currentBio && (
                  <div className="p-3 rounded-xl bg-muted/15 border border-border/10 text-[10px] text-muted-foreground leading-relaxed italic">
                    "{currentBio}"
                  </div>
                )}
              </div>

              {/* Event Name */}
              <div className="space-y-4 pb-4 border-b border-border/5">
                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 block text-center">Event Details *</Label>
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Event Name *</Label>
                    <Input
                      placeholder="e.g. Corporate Gala, Birthday Party"
                      value={bookingForm.event_name}
                      onChange={e => setBookingForm({ ...bookingForm, event_name: e.target.value })}
                      className="h-11 rounded-xl border-border/40 focus-visible:ring-1"
                      style={{ '--tw-ring-color': accentHex }}
                    />
                  </div>

                  {/* Duration + Cost */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs font-medium">Duration (Hours)</Label>
                      <Input
                        type="number" min={1}
                        value={bookingForm.duration_hours}
                        onChange={e => setBookingForm({ ...bookingForm, duration_hours: e.target.value })}
                        className="h-11 rounded-xl border-border/40"
                      />
                    </div>
                    <div className="shrink-0 pb-1 text-right">
                      <p className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest">Estimated</p>
                      <p className="text-xl font-black" style={{ color: accentHex }}>₹{totalCost}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4 pb-4 border-b border-border/5">
                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 block text-center">Location & Venue *</Label>
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Public Venue Name *</Label>
                    <Input
                      placeholder="e.g. The Taj Mahal Hotel, Mumbai"
                      value={bookingForm.venue}
                      onChange={e => setBookingForm({ ...bookingForm, venue: e.target.value })}
                      className="h-11 rounded-xl border-border/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Navigation className="w-3 h-3" /> Google Maps Link
                    </Label>
                    <Input
                      placeholder="https://maps.google.com/..."
                      value={bookingForm.google_maps_link}
                      onChange={e => setBookingForm({ ...bookingForm, google_maps_link: e.target.value })}
                      className="h-11 rounded-xl border-border/40"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4 pb-4 border-b border-border/5">
                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 block text-center">Schedule & Timing *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Event Date *</Label>
                    <Input
                      type="date"
                      value={bookingForm.date}
                      onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                      onClick={e => { try { e.target.showPicker(); } catch (err) {} }}
                      className="h-11 rounded-xl border-border/40 w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Start Time *</Label>
                    <Input
                      type="time"
                      value={bookingForm.time}
                      onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })}
                      onClick={e => { try { e.target.showPicker(); } catch (err) {} }}
                      className="h-11 rounded-xl border-border/40 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5" style={{ color: accentHex }}>
                    <Clock className="w-3 h-3" /> Meeting Time (when to arrive)
                  </Label>
                  <Input
                    type="time"
                    value={bookingForm.meeting_time}
                    onChange={e => setBookingForm({ ...bookingForm, meeting_time: e.target.value })}
                    onClick={e => { try { e.target.showPicker(); } catch (err) {} }}
                    className="h-11 rounded-xl border-border/40 w-full"
                    style={{ borderColor: `${accentHex}40` }}
                  />
                </div>
              </div>

              {/* Coordination */}
              <div className="space-y-4">
                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 block text-center">Coordination Instructions</Label>
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Getting Ready Instructions</Label>
                    <Textarea
                      placeholder="e.g. Please wear formal attire, arrive 30 mins early"
                      rows={2}
                      value={bookingForm.prep_instructions}
                      onChange={e => setBookingForm({ ...bookingForm, prep_instructions: e.target.value })}
                      className="rounded-xl border-border/40 text-xs resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Meeting Point Details</Label>
                    <Input
                      placeholder="e.g. Near main elevator, 3rd floor lobby"
                      value={bookingForm.meeting_point_details}
                      onChange={e => setBookingForm({ ...bookingForm, meeting_point_details: e.target.value })}
                      className="h-11 rounded-xl border-border/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Additional Instructions / Requests</Label>
                    <Textarea
                      placeholder="Any other specific requests or notes..."
                      rows={3}
                      value={bookingForm.instructions}
                      onChange={e => setBookingForm({ ...bookingForm, instructions: e.target.value })}
                      className="rounded-xl border-border/40 text-xs resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="px-6 pb-8 pt-2 space-y-3">
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 h-11 rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-[2] h-11 rounded-xl font-black text-sm"
                  style={{ background: accentHex, color: '#fff', border: 'none' }}
                  onClick={() => {
                    if (!bookingForm.event_name || !bookingForm.venue || !bookingForm.date || !bookingForm.time) {
                      toast.error('Please fill Event Name, Venue, Date and Time');
                      return;
                    }
                    setStep('confirm');
                  }}
                >
                  Review Booking <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-muted/10 border border-border/20 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Booking Summary</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Event</span>
                    <span className="font-bold">{bookingForm.event_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Companion</span>
                    <span className="font-bold">{companion.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Venue</span>
                    <span className="font-bold text-right max-w-[60%]">{bookingForm.venue}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span className="font-bold">{bookingForm.date} at {bookingForm.time}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-bold">{bookingForm.duration_hours} hours</span>
                  </div>
                  <div className="h-px bg-border/30 my-1" />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Cost</span>
                    <span className="text-lg font-black" style={{ color: accentHex }}>₹{totalCost}</span>
                  </div>
                </div>
              </div>

              {/* Critical warnings */}
              <div className="space-y-8">
                <div className="p-4 rounded-3xl border border-rose-500/25 bg-rose-500/5 flex gap-4 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-black text-rose-600 uppercase tracking-[0.1em]">⚠ Do Not Pay in Advance</p>
                    <p className="text-[11px] text-rose-700/80 leading-relaxed font-medium">
                      Never transfer money before meeting the companion in person. Pay only after you verify their identity at the confirmed public venue.
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-3xl border border-amber-500/25 bg-amber-500/5 flex gap-4 shadow-sm">
                  <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-black text-amber-600 uppercase tracking-[0.1em]">Verify the Venue First</p>
                    <p className="text-[11px] text-amber-700/80 leading-relaxed font-medium">
                      PlusOneStar does not verify venues. Please confirm your venue is safe, public, and accessible before meeting. All responsibility lies with you.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-center text-muted-foreground/60 leading-relaxed">
                By confirming, you acknowledge that PlusOneStar is a bridge platform only. All interactions, payments, and safety decisions are your own responsibility.
              </p>
            </div>

            <div className="px-6 pb-8 pt-2 space-y-2.5">
              <Button
                className="w-full h-12 font-black text-sm rounded-xl shadow-lg"
                style={{ background: accentHex, color: '#fff', border: 'none' }}
                disabled={submitting}
                onClick={submitBooking}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {submitting ? 'Sending Request...' : 'Confirm & Send Request'}
              </Button>
              <Button variant="ghost" className="w-full text-xs" onClick={() => setStep('form')}>
                ← Back to Edit
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
