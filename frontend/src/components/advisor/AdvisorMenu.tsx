"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, X, ChevronRight, Utensils, Zap, Wheat, Droplet, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvisorRequest {
  available_food: string;
  calories_left: number;
  protein_left: number;
  carbs_left: number;
  fat_left: number;
}

interface AdvisorSuggestion {
  nombre: string;
  descripcion: string;
  macros: {
    proteina: number;
    carbohidratos: number;
    grasas: number;
    calorias: number;
  };
  justificacion: string;
}

interface AdvisorResponse {
  suggestions: AdvisorSuggestion[];
  context_message: string;
}

interface AdvisorMenuProps {
  remainingMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  apiBaseUrl: string;
  authToken: string;
}

export default function AdvisorMenu({ remainingMacros, apiBaseUrl, authToken }: AdvisorMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableFood, setAvailableFood] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [recommendations, setRecommendations] = useState<AdvisorResponse | null>(null);

  const handleAsk = async () => {
    if (!availableFood.trim()) return;
    setIsAsking(true);
    setRecommendations(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for complex AI advice

    try {
      const response = await fetch(`${apiBaseUrl}/advisor/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          available_food: availableFood,
          calories_left: remainingMacros.calories,
          protein_left: remainingMacros.protein,
          carbs_left: remainingMacros.carbs,
          fat_left: remainingMacros.fats
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.error("Advisor Timeout");
      } else {
        console.error("Advisor Error:", e);
      }
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="w-full">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full glass p-6 rounded-[2rem] flex items-center justify-between group transition-all hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 flex items-center justify-center text-brand-teal group-hover:scale-110 transition-transform">
            <Brain size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-black italic tracking-tighter uppercase text-white">¿QUÉ PUEDO COMER?</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
              Asistente Prime basado en tus macros
            </p>
          </div>
        </div>
        <ChevronRight className="text-zinc-700 group-hover:text-brand-teal group-hover:translate-x-1 transition-all" size={20} />
      </button>

      {/* Fullscreen Overlay/Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-teal flex items-center justify-center text-black">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black italic tracking-tighter uppercase">PRIME ADVISOR</h2>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">CAL: {Math.round(remainingMacros.calories)}</span>
                      <span className="text-[9px] font-bold text-brand-teal uppercase">PROT: {Math.round(remainingMacros.protein)}g</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Inputs */}
                <div className="space-y-4 text-center">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                    ¿Qué tienes en la cocina?
                  </h3>
                  <textarea
                    value={availableFood}
                    onChange={(e) => setAvailableFood(e.target.value)}
                    placeholder="Escribe tus ingredientes... (ej: pechuga de pollo, arroz, 2 huevos, palta)"
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-brand-teal/50 transition-colors resize-none h-32 text-sm font-medium"
                  />
                  <button
                    onClick={handleAsk}
                    disabled={isAsking || !availableFood.trim()}
                    className={cn(
                      "w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-2",
                      isAsking || !availableFood.trim() 
                        ? "bg-zinc-900 text-zinc-700 cursor-not-allowed" 
                        : "bg-brand-teal text-black shadow-[0_0_30px_rgba(20,241,149,0.3)] hover:scale-[1.02]"
                    )}
                  >
                    {isAsking ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>CALCULAR ESTRATEGIA <ChevronRight size={18} /></>
                    )}
                  </button>
                </div>

                {/* Recommendations */}
                {recommendations && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="p-4 rounded-2xl bg-brand-teal/5 border border-brand-teal/10">
                      <p className="text-[10px] font-bold text-brand-teal uppercase tracking-widest leading-relaxed">
                        {recommendations.context_message}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {recommendations.suggestions.map((s, i) => (
                        <div key={i} className="glass p-6 rounded-3xl space-y-4 border-white/5 hover:border-brand-teal/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black uppercase tracking-tight text-white flex items-center gap-2">
                              <Utensils size={14} className="text-brand-teal" /> {s.nombre}
                            </h4>
                            <span className="text-xs font-black text-white">{Math.round(s.macros.calorias)} kcal</span>
                          </div>
                          
                          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                            {s.descripcion}
                          </p>

                          <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5">
                            <div className="text-center">
                              <p className="text-[8px] font-black text-zinc-600 uppercase">PROT</p>
                              <p className="text-xs font-bold text-brand-teal">{s.macros.proteina}g</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[8px] font-black text-zinc-600 uppercase">CARB</p>
                              <p className="text-xs font-bold text-amber-500">{s.macros.carbohidratos}g</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[8px] font-black text-zinc-600 uppercase">FAT</p>
                              <p className="text-xs font-bold text-yellow-500">{s.macros.grasas}g</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Brain size={12} className="text-zinc-600 mt-0.5 shrink-0" />
                            <p className="text-[9px] font-bold text-zinc-500 italic leading-snug">
                              {s.justificacion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
              
              <footer className="p-6 text-center border-t border-white/5">
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">
                  Prime Advisor Engine v1.0
                </p>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
