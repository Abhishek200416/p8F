import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, Heart, X, Sparkles } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

export default function VerseOfTheDay({ show, onClose }) {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('greeting'); // 'greeting' | 'verse'

  useEffect(() => {
    if (show) {
      setPhase('greeting');
      fetchVerse();
    }
  }, [show]);

  const fetchVerse = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/verse-of-the-day`);
      setVerse(res.data);
    } catch (err) {
      console.error('Failed to fetch verse:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm w-[92vw] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-background animate-in fade-in zoom-in-95 duration-300">

        {/* Close button */}
        <button
          onClick={onClose}
          data-testid="verse-close-btn"
          className="absolute top-4 right-4 z-20 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all backdrop-blur-sm"
        >
          <X className="w-3.5 h-3.5 text-white/80" />
        </button>

        {phase === 'greeting' ? (
          /* ===== GREETING PHASE ===== */
          <div className="relative overflow-hidden">
            {/* Gradient header area */}
            <div className="relative px-8 pt-12 pb-10 flex flex-col items-center text-center bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500">
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl pointer-events-none" />

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5 shadow-lg border border-white/20">
                <BookOpen className="w-8 h-8 text-white" />
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/70 mb-2">
                A Moment of Peace
              </p>
              <h2 className="text-2xl font-black text-white leading-tight mb-2">
                A special word<br />
                <span className="text-white/80 font-medium text-lg">prepared for you today</span>
              </h2>

              {/* Animated line */}
              <div className="w-px h-8 bg-gradient-to-b from-white/0 via-white/50 to-white/0 mt-3 animate-pulse" />
            </div>

            {/* Bottom card area */}
            <div className="px-6 py-6 space-y-4 bg-background">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Scroll through today's inspirational word prepared just for your journey.
              </p>
              <Button
                data-testid="verse-show-btn"
                onClick={() => setPhase('verse')}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black uppercase tracking-[0.15em] text-xs shadow-lg shadow-teal-500/25 transition-all hover:-translate-y-0.5 border-none gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Open the Word
              </Button>
            </div>
          </div>

        ) : (
          /* ===== VERSE PHASE ===== */
          <div className="flex flex-col max-h-[88vh]">
            {/* Compact header */}
            <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)] pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3 shadow-sm border border-white/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/70 mb-1">Word of the Day</p>
              <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                {verse?.date ? new Date(verse.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''}
              </p>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 space-y-5">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-[3px] border-teal-100 border-t-teal-500 rounded-full animate-spin" />
                  </div>
                ) : verse ? (
                  <>
                    {/* Verse quote block */}
                    <div className="relative rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 px-6 py-6 border border-teal-200/40 dark:border-teal-700/20">
                      <span className="absolute -top-3 left-4 text-5xl text-teal-400/30 dark:text-teal-500/20 font-serif select-none leading-none">"</span>
                      <blockquote
                        data-testid="verse-text"
                        className="text-base leading-relaxed text-foreground font-semibold italic text-center pt-2"
                      >
                        {verse.text || verse.verse}
                      </blockquote>
                      <div className="w-10 h-0.5 bg-gradient-to-r from-teal-400 to-emerald-400 mx-auto mt-4 rounded-full" />
                    </div>

                    {/* Reference pill */}
                    <div className="flex justify-center">
                      <span
                        data-testid="verse-reference"
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 bg-teal-500/8 dark:bg-teal-500/15 px-5 py-1.5 rounded-full border border-teal-500/20"
                      >
                        {verse.reference}
                      </span>
                    </div>

                    {/* Encouragement block */}
                    {verse.encouragement && (
                      <div className="rounded-2xl p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/40 dark:border-rose-800/20 flex flex-col items-center text-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        </div>
                        <p className="text-sm font-semibold text-foreground/80 leading-relaxed">
                          {verse.encouragement}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60">You are never alone on this journey.</p>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="pt-1 pb-2">
                      <Button
                        data-testid="verse-continue-btn"
                        onClick={onClose}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-0.5 border-none gap-2"
                      >
                        <Heart className="w-3.5 h-3.5 fill-white" />
                        Continue with Faith
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    Unable to load verse. Please try again later.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
