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
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Haptic feedback if supported (success pattern)
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } else {
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!isFs) {
        setIsPlaying(false);
        if (videoRef.current) {
          videoRef.current.style.opacity = "0";
          videoRef.current.style.pointerEvents = "none";
          videoRef.current.pause();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handlePlayFullscreen = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      // Synchronous style update to fix browser rendering before React cycle
      videoRef.current.style.opacity = "1";
      videoRef.current.style.pointerEvents = "auto";
      
      videoRef.current.play().catch(console.error);
      const elem = videoRef.current as any;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitEnterFullscreen) {
        elem.webkitEnterFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden"
        >
          {/* Hidden Video Element for Native Playback */}
          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              style={{ opacity: isPlaying ? 1 : 0, pointerEvents: isPlaying ? 'auto' : 'none' }}
              className="absolute inset-0 z-50 w-full h-full object-contain bg-black transition-opacity duration-300"
              controls={isPlaying}
              playsInline
            />
          )}

          {/* Prime Aesthetic Background */}
          <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
            <div className="absolute w-[500px] h-[500px] bg-brand-teal/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/80 to-black" />
          </div>

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

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="w-full max-w-sm mt-8 flex flex-col gap-3"
            >
              {videoUrl && (
                <button
                  onClick={handlePlayFullscreen}
                  className="w-full py-5 rounded-[2rem] bg-brand-teal text-black font-black tracking-widest uppercase hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(20,241,149,0.5)]"
                >
                  <Play size={20} fill="currentColor" /> RECLAMAR RECOMPENSA
                </button>
              )}
              
              <button
                onClick={onClose}
                className="w-full py-5 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 text-white font-black tracking-widest uppercase hover:bg-white/20 transition-colors"
              >
                CONTINUAR EL LEGADO
              </button>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
