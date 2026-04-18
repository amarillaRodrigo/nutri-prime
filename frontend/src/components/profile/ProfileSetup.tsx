"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Activity, Gauge, Target, ChevronRight, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSetupProps {
  isOpen: boolean;
  onSync: (profile: any) => void;
  apiBaseUrl: string;
  authToken: string;
}

const ACTIVITY_LEVELS = [
  { label: "Sedentario", value: 1.2, desc: "Poco o nada de ejercicio" },
  { label: "Ligero", value: 1.375, desc: "Ejercicio 1-3 días/sem" },
  { label: "Moderado", value: 1.55, desc: "Ejercicio 3-5 días/sem" },
  { label: "Intenso", value: 1.725, desc: "Ejercicio 6-7 días/sem" },
  { label: "Atleta", value: 1.9, desc: "Entrenamiento muy intenso" },
];

const GOAL_TYPES = [
  { label: "Definición (Cut)", value: "cut", icon: "🔥" },
  { label: "Mantenimiento", value: "maintain", icon: "⚖️" },
  { label: "Volumen (Bulk)", value: "bulk", icon: "💪" },
];

export default function ProfileSetup({ isOpen, onSync, apiBaseUrl, authToken }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    weight_kg: 80,
    height_cm: 180,
    age: 25,
    gender: "male",
    activity_level: 1.55,
    goal_type: "maintain",
    calorie_goal_override: null as number | null,
    protein_goal_override: null as number | null,
  });

  const [suggestions, setSuggestions] = useState({ calorie_goal: 0, protein_goal: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Automatic calculation logic (mirrors backend)
  useEffect(() => {
    let tmb = (10 * formData.weight_kg) + (6.25 * formData.height_cm) - (5 * formData.age);
    tmb += formData.gender === "male" ? 5 : -161;
    const maintenance = tmb * formData.activity_level;

    let cal = maintenance;
    let prot = formData.weight_kg * 2.0;

    if (formData.goal_type === "cut") {
      cal = maintenance * 0.8;
      prot = formData.weight_kg * 2.3;
    } else if (formData.goal_type === "bulk") {
      cal = maintenance * 1.15;
      prot = formData.weight_kg * 2.0;
    }

    setSuggestions({
      calorie_goal: Math.round(cal),
      protein_goal: Math.round(prot * 10) / 10
    });
  }, [formData]);

  const handleSync = async () => {
    setIsSyncing(true);
    setErrorStatus(null);
    try {
      let cleanBase = apiBaseUrl.trim();
      if (cleanBase && !cleanBase.startsWith('http')) {
          cleanBase = `https://${cleanBase}`;
      }
      cleanBase = cleanBase.endsWith('/') ? cleanBase.slice(0, -1) : cleanBase;
      const response = await fetch(`${cleanBase}/sync-profile`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error(`Error ${response.status}: Revisa la conexión con el Cerebro.`);
      
      const data = await response.json();
      onSync(data.profile);
    } catch (err: any) {
      console.error("Sync error:", err);
      setErrorStatus(err.message || "Error de conexión");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
            {/* Tunnel Authorization Helper */}
            <div className="mb-6">
                <a 
                    href={apiBaseUrl} 
                    target="_blank" 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-red/10 border border-brand-red/30 text-[10px] font-black text-brand-red uppercase tracking-widest animate-pulse"
                >
                    ⚠️ Autorizar Conexión Cerebro
                </a>
                <p className="text-[9px] text-zinc-600 mt-2 font-bold uppercase tracking-tighter">Toca arriba antes de empezar si tienes error 503</p>
            </div>

            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-brand-teal">Configura tu Perfil</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Paso {step} de 3</p>
        </header>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Peso (kg)" value={formData.weight_kg} onChange={(v) => setFormData({...formData, weight_kg: Number(v)})} />
                <InputGroup label="Altura (cm)" value={formData.height_cm} onChange={(v) => setFormData({...formData, height_cm: Number(v)})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Edad" value={formData.age} onChange={(v) => setFormData({...formData, age: Number(v)})} />
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Género</span>
                    <div className="flex bg-white/5 rounded-xl p-1">
                        <button 
                            className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", formData.gender === 'male' ? "bg-brand-teal text-black" : "text-zinc-500")}
                            onClick={() => setFormData({...formData, gender: 'male'})}
                        >HOMBRE</button>
                        <button 
                            className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", formData.gender === 'female' ? "bg-brand-teal text-black" : "text-zinc-500")}
                            onClick={() => setFormData({...formData, gender: 'female'})}
                        >MUJER</button>
                    </div>
                </div>
              </div>
              <NextButton onClick={() => setStep(2)} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Nivel de Actividad</span>
              {ACTIVITY_LEVELS.map((lvl) => (
                <button
                    key={lvl.value}
                    onClick={() => setFormData({...formData, activity_level: lvl.value})}
                    className={cn(
                        "w-full p-4 rounded-2xl flex items-center justify-between border transition-all duration-300",
                        formData.activity_level === lvl.value ? "bg-brand-teal/10 border-brand-teal text-brand-teal shadow-[0_0_20px_rgba(0,209,178,0.1)]" : "bg-white/5 border-white/10 text-zinc-500"
                    )}
                >
                    <div className="text-left">
                        <p className="text-sm font-black uppercase tracking-tighter">{lvl.label}</p>
                        <p className="text-[10px] opacity-60 font-medium">{lvl.desc}</p>
                    </div>
                    {formData.activity_level === lvl.value && <Activity size={18} />}
                </button>
              ))}
              <NextButton onClick={() => setStep(3)} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Objetivo Final</span>
              <div className="grid grid-cols-1 gap-3">
                {GOAL_TYPES.map((g) => (
                    <button
                        key={g.value}
                        onClick={() => setFormData({...formData, goal_type: g.value})}
                        className={cn(
                            "p-4 rounded-2xl flex items-center gap-4 border transition-all duration-300",
                            formData.goal_type === g.value ? "bg-brand-teal/10 border-brand-teal text-brand-teal" : "bg-white/5 border-white/10 text-zinc-500"
                        )}
                    >
                        <span className="text-2xl">{g.icon}</span>
                        <span className="text-sm font-black uppercase tracking-tighter">{g.label}</span>
                    </button>
                ))}
              </div>

              {/* Automatic Suggestion Panel */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sugerencia Prime</span>
                      <Sparkles size={14} className="text-brand-teal" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <p className="text-2xl font-black italic">{suggestions.calorie_goal}</p>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase">kcal/día</p>
                      </div>
                      <div>
                          <p className="text-2xl font-black italic">{suggestions.protein_goal}g</p>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase">Proteína</p>
                      </div>
                  </div>
              </div>

              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full py-4 bg-brand-teal text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(0,209,178,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isSyncing ? "GUARDANDO..." : <><Save size={18} /> ACTIVAR PERFIL</>}
              </button>

              {errorStatus && (
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-brand-red font-bold uppercase tracking-widest text-center"
                >
                    {errorStatus}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">{label}</span>
            <input 
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-black focus:border-brand-teal focus:outline-none transition-colors"
            />
        </div>
    );
}

function NextButton({ onClick }: { onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="w-full py-4 bg-zinc-100 text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
        >
            SIGUIENTE <ChevronRight size={18} />
        </button>
    );
}
