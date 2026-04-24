"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Hash, Check, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortionScaleModalProps {
  isOpen: boolean;
  unitName: string;
  baseGrams: number;
  onConfirm: (multiplier: number) => void;
}

type InputMode = "unit" | "measure";

export default function PortionScaleModal({ isOpen, unitName, baseGrams, onConfirm }: PortionScaleModalProps) {
  const [inputMode, setInputMode] = useState<InputMode>("unit");
  const [inputValue, setInputValue] = useState<string>("1");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputMode("unit");
      setInputValue("1");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) return;

    let finalMultiplier = 1;
    if (inputMode === "unit") {
      finalMultiplier = val;
    } else {
      // If user says "30g" and baseGrams is 150g -> 30 / 150 = 0.2
      finalMultiplier = val / Math.max(1, baseGrams);
    }
    
    onConfirm(finalMultiplier);
  };

  const currentMultiplier = () => {
    const val = parseFloat(inputValue) || 0;
    if (inputMode === "unit") return val;
    return val / Math.max(1, baseGrams);
  };

  const isLiquid = ["vaso", "taza", "botella", "lata", "ml", "litro"].some(w => unitName.toLowerCase().includes(w));
  const measureUnit = isLiquid ? "ml" : "g";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md glass p-8 sm:p-10 rounded-[3rem] border-white/10 flex flex-col items-center text-center gap-8"
          >
            {/* Header Icon */}
            <div className="w-20 h-20 rounded-3xl bg-brand-teal/10 flex items-center justify-center text-brand-teal mb-2">
              <Box size={40} strokeWidth={1.5} />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
                AJUSTE DE RACIÓN
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm font-bold uppercase tracking-widest leading-relaxed">
                EL RADAR DETECTÓ 1 <span className="text-brand-teal">{unitName.toUpperCase()}</span> ({baseGrams}{measureUnit}).<br/>
                ¿CUÁNTO CONSUMISTE REALMENTE?
              </p>
            </div>

            {/* Toggle Mode */}
            <div className="flex bg-zinc-900 rounded-2xl p-1 w-full relative">
               <button
                 onClick={() => { setInputMode("unit"); setInputValue("1"); }}
                 className={cn(
                   "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all z-10",
                   inputMode === "unit" ? "text-black" : "text-zinc-500 hover:text-white"
                 )}
               >
                 Por Unidades
               </button>
               <button
                 onClick={() => { setInputMode("measure"); setInputValue(baseGrams.toString()); }}
                 className={cn(
                   "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all z-10",
                   inputMode === "measure" ? "text-black" : "text-zinc-500 hover:text-white"
                 )}
               >
                 Medida Exacta
               </button>
               {/* Background Slider */}
               <div 
                 className={cn(
                   "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-brand-teal rounded-xl transition-all duration-300 ease-spring",
                   inputMode === "unit" ? "left-1" : "left-[calc(50%+2px)]"
                 )}
               />
            </div>

            {/* Input Field */}
            <div className="w-full flex items-center justify-center gap-4">
               <input 
                 type="number"
                 step="any"
                 min="0.1"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 className="w-32 bg-transparent text-5xl font-black text-center text-white border-b-2 border-zinc-800 focus:border-brand-teal outline-none pb-2 transition-colors"
                 placeholder="0"
               />
               <span className="text-2xl font-black text-zinc-600 uppercase">
                 {inputMode === "unit" ? unitName : measureUnit}
               </span>
            </div>

            {/* Multiplier Feedback */}
            <div className="flex flex-col items-center gap-2 text-zinc-500">
               <div className="flex items-center gap-2">
                 <Scale size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Multiplicador Interno: {currentMultiplier().toFixed(2)}x</span>
               </div>
               <p className="text-[10px] text-brand-teal/70 font-bold uppercase tracking-widest">
                  Los macros se multiplicarán por este factor
               </p>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={parseFloat(inputValue) <= 0 || isNaN(parseFloat(inputValue))}
              className="w-full py-6 rounded-3xl bg-white text-black font-black uppercase tracking-[0.3em] text-xs hover:bg-brand-teal hover:shadow-[0_0_40px_rgba(20,241,149,0.4)] transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center gap-3 group"
            >
              CONFIRMAR PORCIÓN <Check size={18} className="group-hover:scale-125 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
