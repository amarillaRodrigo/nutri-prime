"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, ChevronRight, Hash, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortionScaleModalProps {
  isOpen: boolean;
  unitName: string;
  onConfirm: (multiplier: number) => void;
}

export default function PortionScaleModal({ isOpen, unitName, onConfirm }: PortionScaleModalProps) {
  const [multiplier, setMultiplier] = useState(1);
  const options = [0.5, 1, 1.5, 2, 3, 4];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md glass p-10 rounded-[3rem] border-white/10 flex flex-col items-center text-center gap-8"
          >
            {/* Header Icon */}
            <div className="w-20 h-20 rounded-3xl bg-brand-teal/10 flex items-center justify-center text-brand-teal mb-2">
              <Box size={40} strokeWidth={1.5} />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
                AJUSTE DE RACIÓN
              </h2>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest leading-relaxed">
                EL RADAR DETECTÓ 1 <span className="text-brand-teal">{unitName.toUpperCase()}</span>.<br/>
                ¿CUÁNTOS CONSUMISTE REALMENTE?
              </p>
            </div>

            {/* Quick Select Grid */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setMultiplier(opt)}
                  className={cn(
                    "py-4 rounded-2xl font-black text-sm transition-all border",
                    multiplier === opt 
                      ? "bg-brand-teal text-black border-brand-teal shadow-[0_0_20px_rgba(20,241,149,0.3)]" 
                      : "bg-white/5 text-zinc-400 border-white/5 hover:border-white/20"
                  )}
                >
                  {opt}x
                </button>
              ))}
            </div>

            {/* Manual Entry or Custom logic could go here */}
            <div className="flex items-center gap-2 text-zinc-600">
               <Hash size={12} />
               <span className="text-[10px] font-black uppercase tracking-widest">Multiplicador seleccionado: {multiplier}x</span>
            </div>

            {/* Confirm Button */}
            <button
              onClick={() => onConfirm(multiplier)}
              className="w-full py-6 rounded-3xl bg-white text-black font-black uppercase tracking-[0.3em] text-xs hover:bg-brand-teal hover:shadow-[0_0_40px_rgba(20,241,149,0.4)] transition-all flex items-center justify-center gap-3 group"
            >
              CONFIRMAR PORCIÓN <Check size={18} className="group-hover:scale-125 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
