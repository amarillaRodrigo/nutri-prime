"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Play, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface RewardRoomProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  message?: string;
}

export default function RewardRoom({ isOpen, onClose, videoUrl, message }: RewardRoomProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Haptic feedback if supported (success pattern)
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      // Auto-play video on open
      if (videoRef.current) {
        videoRef.current.play().catch(e => console.warn("Auto-play prevented", e));
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isOpen, videoUrl]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden"
        >
          {/* Immersive Video Background */}
          {videoUrl ? (
            <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover opacity-90"
                loop
                playsInline
                autoPlay
                muted={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 z-0 bg-brand-teal/10 animate-pulse flex items-center justify-center">
              <Zap size={64} className="text-brand-teal opacity-50" />
            </div>
          )}

          {/* Content Overlay */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-between p-6 pb-24 safe-pt safe-pb">
            
            {/* Header */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-full pt-8 flex flex-col items-center text-center gap-2"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-teal/20 backdrop-blur-md border border-brand-teal/50 mb-4 shadow-[0_0_30px_rgba(20,241,149,0.3)]">
                <Check size={32} className="text-brand-teal" strokeWidth={3} />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase drop-shadow-lg">
                PRIME STATE
              </h1>
              <p className="text-brand-teal font-black tracking-[0.2em] uppercase text-sm drop-shadow-md">
                DOPAMINE REWARD UNLOCKED
              </p>
            </motion.div>

            {/* AI Message */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-sm glass p-6 rounded-3xl border-brand-teal/30 bg-black/40 backdrop-blur-xl text-center"
            >
              <p className="text-white/90 font-bold text-sm leading-relaxed">
                {message || "Decisión impecable. Sigue acumulando victorias y construyendo tu mejor versión."}
              </p>
            </motion.div>

            {/* Action Button */}
            <motion.button
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full max-w-sm py-5 mt-8 rounded-[2rem] bg-brand-teal text-black font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(20,241,149,0.5)]"
            >
              <Play size={20} fill="currentColor" /> CONTINUAR EL LEGADO
            </motion.button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
