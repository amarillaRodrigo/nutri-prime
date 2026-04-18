"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, PartyPopper, Brain, CheckCircle2, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface StrategyAdvisorProps {
  apiBaseUrl: string;
  authToken: string;
  metrics: {
    caloriesRemaining: number;
    protein: number;
    carbs: number;
    fats: number;
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatsGoal: number;
  };
}

export default function StrategyAdvisor({ apiBaseUrl, authToken, metrics }: StrategyAdvisorProps) {
  const [isPartyMode, setIsPartyMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const generateStrategy = async () => {
    setIsGenerating(true);
    setStrategy(null);
    setShowModal(true);

    try {
      const payload = {
        available_food: "", // Optional, could be added to UI
        calories_left: metrics.caloriesRemaining,
        protein_left: Math.max(0, metrics.proteinGoal - metrics.protein),
        carbs_left: Math.max(0, metrics.carbsGoal - metrics.carbs),
        fat_left: Math.max(0, metrics.fatsGoal - metrics.fats),
        calories_consumed: metrics.calorieGoal - metrics.caloriesRemaining,
        protein_consumed: metrics.protein,
        carbs_consumed: metrics.carbs,
        fat_consumed: metrics.fats,
        is_party_mode: isPartyMode
      };

      const res = await fetch(`${apiBaseUrl}/advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setStrategy(data);
      }
    } catch (e) {
      console.error("Failed to generate strategy", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full">
      <div className="glass p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 border-brand-teal/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center text-brand-red">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase italic tracking-tight">CUARTO DE GUERRA</h3>
            <p className="text-zinc-500 text-sm font-bold">ESTRATEGIA PRIME PARA EL RESTO DEL DÍA</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setIsPartyMode(!isPartyMode)}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black transition-all",
              isPartyMode 
                ? "bg-brand-teal text-black shadow-lg shadow-brand-teal/20" 
                : "bg-zinc-900 text-zinc-500 border border-zinc-800"
            )}
          >
            <PartyPopper size={18} />
            {isPartyMode ? "MODO BOLICHE: ON" : "MODO BOLICHE: OFF"}
          </button>

          <button
            onClick={generateStrategy}
            className="flex-1 sm:flex-none bg-white text-black px-8 py-3 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform active:scale-95"
          >
            ESTRATEGIA PRIME
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isGenerating && setShowModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl glass p-8 rounded-[40px] max-h-[85vh] overflow-y-auto border-brand-teal/30"
            >
              {isGenerating ? (
                <div className="py-12 flex flex-col items-center justify-center gap-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="text-brand-teal"
                  >
                    <Loader2 size={48} />
                  </motion.div>
                  <div className="text-center">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">SINCRONIZANDO CEREBRO...</h2>
                    <p className="text-zinc-500 font-bold">ANALIZANDO FRACASOS Y DISEÑANDO VICTORIA</p>
                  </div>
                </div>
              ) : strategy ? (
                <div className="space-y-8 pb-4">
                  <header className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="flex items-center gap-3 text-brand-teal">
                      <Brain size={32} />
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter">PRIME STRATEGY</h2>
                    </div>
                    <button 
                      onClick={() => setShowModal(false)}
                      className="text-zinc-500 hover:text-white font-black text-sm uppercase tracking-widest"
                    >
                      Cerrar
                    </button>
                  </header>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-brand-red">
                      <AlertTriangle size={20} />
                      <h4 className="font-black uppercase tracking-widest text-sm italic">SITUACIÓN CRÍTICA:</h4>
                    </div>
                    <p className="text-zinc-300 font-bold leading-relaxed whitespace-pre-wrap italic">
                      {strategy.context_message}
                    </p>
                  </section>

                  <section className="bg-brand-teal/10 p-6 rounded-3xl border border-brand-teal/20 space-y-4">
                    <div className="flex items-center gap-2 text-brand-teal">
                      <Sparkles size={20} />
                      <h4 className="font-black uppercase tracking-widest text-sm italic">HOJA DE RUTA:</h4>
                    </div>
                    <div className="prose prose-invert max-w-none text-white font-medium leading-relaxed">
                        {strategy.emergency_strategy}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-black uppercase tracking-widest text-sm text-zinc-500 italic">Sugerencias Específicas:</h4>
                    <div className="grid gap-3">
                      {strategy.suggestions?.map((item: any, i: number) => (
                        <div key={i} className="glass p-4 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-black text-white group-hover:bg-brand-teal group-hover:text-black transition-colors">
                              {i + 1}
                            </span>
                            <div>
                                <p className="font-black text-white uppercase italic">{item.name}</p>
                                <p className="text-xs text-zinc-500 font-bold tracking-tight">{item.reason}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-white">OBJETIVO</p>
                            <p className="text-[10px] text-zinc-500 font-bold">CUMPLIR MACROS</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="pt-6">
                    <button
                      onClick={() => setShowModal(false)}
                      className="w-full bg-brand-teal text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={20} />
                       ENTENDIDO. HORA DE EJECUTAR.
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
