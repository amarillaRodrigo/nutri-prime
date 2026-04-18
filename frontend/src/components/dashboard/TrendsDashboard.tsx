"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Flame, Trophy, TrendingUp, Wheat, Droplet, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  max?: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
}

const MetricCard = ({ title, value, max, unit, icon, color }: MetricCardProps) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="glass p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden"
  >
    <div className={cn("p-3 w-fit rounded-2xl bg-opacity-10", color)}>
      {icon}
    </div>
    <div>
      <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-3xl font-black text-white">
          {Math.round(Number(value))}
          {max !== undefined && <span className="text-xl text-white/30">/{Math.round(max)}</span>}
        </span>
        {unit && <span className="text-zinc-500 text-xs font-bold uppercase">{unit}</span>}
      </div>
    </div>
    {/* Decorative blur */}
    <div className={cn("absolute -bottom-4 -right-4 w-16 h-16 blur-2xl opacity-20 rounded-full", color.replace('text-', 'bg-'))} />
  </motion.div>
);

interface HistoryEntry {
  id: string;
  food_name: string;
  calories: number;
  veredicto?: "BUENO" | "MALO" | "MODERADO";
  justificacion?: string;
  created_at: string;
}

interface TrendsDashboardProps {
  metrics: {
    protein: number;
    carbs?: number;
    fats?: number;
    caloriesRemaining: number;
    willpowerScore: number;
    calorieGoal?: number;
    proteinGoal?: number;
    carbsGoal?: number;
    fatsGoal?: number;
  };
  trendImageUrl?: string;
  history?: HistoryEntry[];
  onDelete?: (id: string) => void;
}

export default function TrendsDashboard({ metrics, trendImageUrl, history = [], onDelete }: TrendsDashboardProps) {
  return (
    <div className="w-full space-y-8 pb-12">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Proteína"
          value={metrics.protein}
          max={metrics.proteinGoal}
          unit="g"
          icon={<Zap size={24} className="text-brand-teal" />}
          color="text-brand-teal"
        />
        <MetricCard
          title="Carbos"
          value={metrics.carbs || 0}
          max={metrics.carbsGoal}
          unit="g"
          icon={<Wheat size={24} className="text-amber-400" />}
          color="text-amber-400"
        />
        <MetricCard
          title="Grasas"
          value={metrics.fats || 0}
          max={metrics.fatsGoal}
          unit="g"
          icon={<Droplet size={24} className="text-yellow-200" />}
          color="text-yellow-200"
        />
        <MetricCard
          title="Restante"
          value={metrics.caloriesRemaining}
          max={metrics.calorieGoal}
          unit="kcal"
          icon={<Flame size={24} className="text-orange-500" />}
          color="text-orange-500"
        />
        <MetricCard
          title="Voluntad"
          value={metrics.willpowerScore}
          max={10}
          unit="pts"
          icon={<Trophy size={24} className="text-yellow-500" />}
          color="text-yellow-500"
        />
      </div>

      {/* Main Trend Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[2rem] p-8 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-brand-teal" size={24} />
            <h2 className="text-xl font-black italic tracking-tighter uppercase whitespace-nowrap">
               ESTADO DE FLUJO (7 DÍAS)
            </h2>
          </div>
          <div className="h-2 w-2 rounded-full bg-brand-teal animate-pulse" />
        </div>

        <div className="aspect-[16/10] w-full rounded-2xl bg-zinc-950/50 border border-white/5 overflow-hidden relative flex items-center justify-center">
          {trendImageUrl ? (
            <img 
              src={trendImageUrl} 
              alt="Caloric Trend Visualization" 
              className="w-full h-full object-contain"
            />
          ) : (
             <div className="text-center p-8">
               <div className="flex justify-center gap-2 mb-4">
                  {[...Array(7)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-2 bg-brand-teal/20 rounded-full" 
                      style={{ height: `${20 + Math.random() * 60}%` }} 
                    />
                  ))}
               </div>
               <p className="text-zinc-600 text-[10px] font-bold tracking-[0.3em] uppercase">
                 Iniciando sincronización biométrica...
               </p>
             </div>
          )}
        </div>
      </motion.div>

      {/* New: History Log Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                Bitácora Prime (Últimos Registros)
            </h3>
            <span className="text-[10px] font-bold text-brand-teal uppercase">{history.length} ITEMS</span>
        </div>

        <div className="flex flex-col gap-3">
            {history.length > 0 ? history.map((entry) => (
                <div key={entry.id} className="glass p-4 rounded-2xl flex items-center justify-between group transition-all hover:bg-white/[0.03]">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-black uppercase tracking-tight text-white">{entry.food_name}</span>
                        <div className="flex items-center gap-2">
                             <div className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                                entry.veredicto === 'BUENO' ? "bg-brand-teal/10 text-brand-teal" : 
                                entry.veredicto === 'MALO' ? "bg-brand-red/10 text-brand-red" : "bg-zinc-400/10 text-zinc-400"
                            )}>
                                {entry.veredicto || 'SIN VEREDICTO'}
                            </div>
                            <span className="text-[10px] font-bold text-zinc-600">{entry.calories} kcal</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {onDelete && (
                            <button onClick={() => onDelete(entry.id)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        )}
                        {entry.veredicto === 'BUENO' ? 
                            <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal italic font-black">🔥</div> :
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-700 font-black">?</div>
                        }
                    </div>
                </div>
            )) : (
                <div className="p-8 border border-dashed border-white/5 rounded-3xl text-center">
                    <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest leading-relaxed">
                        No hay registros biológicos detectados.<br/>Inicia tu primer escaneo.
                    </p>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
}
