"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareText, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextRefinementModalProps {
  isOpen: boolean;
  onConfirm: (context: string) => Promise<void>;
  onSkip: () => void;
}

export default function ContextRefinementModal({ isOpen, onConfirm, onSkip }: ContextRefinementModalProps) {
  const [contextText, setContextText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContextText("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!contextText.trim()) return;
    setIsSubmitting(true);
    await onConfirm(contextText);
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md glass p-8 sm:p-10 rounded-[3rem] border-white/10 flex flex-col items-center text-center gap-6"
          >
            {/* Header Icon */}
            <div className="w-20 h-20 rounded-3xl bg-brand-red/10 flex items-center justify-center text-brand-red mb-2">
              <ShieldAlert size={40} strokeWidth={1.5} />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
                CONTROL DE DAÑOS
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm font-bold uppercase tracking-widest leading-relaxed">
                ESTO SE REGISTRARÁ COMO COMIDA BASURA.<br/>
                ¿HAY ALGO QUE DEBAMOS SABER?<br/>
                <span className="text-[10px] text-zinc-600">(Ej: Solo comí la mitad, le quité el pan, etc.)</span>
              </p>
            </div>

            {/* Input Area */}
            <div className="w-full relative">
              <div className="absolute top-4 left-4 text-brand-teal">
                <MessageSquareText size={20} />
              </div>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Escribe tu contexto aquí..."
                disabled={isSubmitting}
                className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-zinc-700 outline-none focus:border-brand-teal/50 focus:ring-1 focus:ring-brand-teal/50 transition-all resize-none h-32"
              />
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-3 mt-2">
              <button
                onClick={handleSubmit}
                disabled={!contextText.trim() || isSubmitting}
                className="w-full py-5 rounded-[2rem] bg-brand-teal text-black font-black tracking-widest uppercase hover:scale-105 transition-transform shadow-[0_0_40px_rgba(20,241,149,0.3)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  "AJUSTAR MACROS"
                )}
              </button>
              
              <button
                onClick={onSkip}
                disabled={isSubmitting}
                className="w-full py-4 rounded-[2rem] bg-transparent text-zinc-500 font-bold tracking-widest text-xs uppercase hover:text-white transition-colors disabled:opacity-50"
              >
                OMITIR (Me lo comí todo)
              </button>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
