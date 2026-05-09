import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Diamond } from 'lucide-react';

export const PurchaseSuccessOverlay = ({ isOpen, onClose, title = "Success!", message = "Purchased Successfully", type = "diamond" }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 500);
      }, 2500); // Slightly faster dismissal for a snappier feel
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            className="relative bg-zinc-900 border border-white/10 p-12 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex flex-col items-center text-center max-w-sm w-full overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-60 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
            
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.1 
              }}
              className="w-28 h-28 rounded-full bg-emerald-500/10 flex items-center justify-center mb-8 relative border border-emerald-500/20"
            >
              <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/30 opacity-20" />
              <CheckCircle2 className="w-14 h-14 text-emerald-400" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2>
              <p className="text-muted-foreground font-medium text-sm tracking-wide px-4 leading-relaxed">{message}</p>
            </motion.div>

            {type === 'diamond' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10"
              >
                <Diamond className="w-4 h-4 text-purple-400 fill-purple-400" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Balance Updated</span>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
