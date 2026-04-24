"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DopamineRoomProps {
  isOpen: boolean;
  onClose: (proceed: boolean) => void;
  assetUrl?: string;
  message?: string;
}

export default function DopamineRoom({ isOpen, onClose, assetUrl, message }: DopamineRoomProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger Haptic Feedback (Cyber-Luxury high-friction signal)
      if ("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-[#120000]"
        >
          <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 pb-24 safe-pb">
            {/* Pulsating Inner Glow */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute inset-x-0 top-0 h-1/2 bg-brand-red/10 blur-[120px] pointer-events-none"
            />

            <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-4 p-4 rounded-2xl bg-brand-red/20 text-brand-red border border-brand-red/30">
                <AlertTriangle size={40} />
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase sm:text-4xl">
                ¿REALMENTE QUIERES ESTO?
              </h1>
              <p className="mt-4 text-zinc-400 font-medium">
                {message || "Este alimento está saboteando tus niveles de dopamina y tus metas."}
              </p>
            </motion.div>

            {/* Motivational Asset (Conceptual Video Player) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              className="w-full aspect-video glass rounded-3xl overflow-hidden relative group"
            >
              {assetUrl ? (
                 <video 
                   src={assetUrl} 
                   autoPlay 
                   loop 
                   muted 
                   className="w-full h-full object-cover"
                 />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
                   <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 font-bold">Inspiration Engine Active</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </motion.div>

            {/* High-Friction Controls */}
            <div className="mt-4 flex flex-col w-full gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onClose(false)}
                className="w-full py-5 rounded-2xl bg-brand-teal text-black font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,209,178,0.3)]"
              >
                ELEGIR ALGO MEJOR <ArrowRight size={20} />
              </motion.button>

              <button
                onClick={() => onClose(true)}
                className="w-full py-4 text-zinc-500 font-bold text-sm hover:text-white transition-colors uppercase tracking-widest"
              >
                Comer de todas formas (Someterse)
              </button>
            </div>
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
