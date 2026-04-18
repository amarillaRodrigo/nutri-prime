"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Flame, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
}

const MetricCard = ({ title, value, unit, icon, color }: MetricCardProps) => (
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
        <span className="text-3xl font-black text-white">{value}</span>
        {unit && <span className="text-zinc-500 text-xs font-bold uppercase">{unit}</span>}
      </div>
    </div>
    {/* Decorative blur */}
    <div className={cn("absolute -bottom-4 -right-4 w-16 h-16 blur-2xl opacity-20 rounded-full", color.replace('text-', 'bg-'))} />
  </motion.div>
);

interface TrendsDashboardProps {
  metrics: {
    protein: number;
    caloriesRemaining: number;
    willpowerScore: number;
  };
  trendImageUrl?: string;
}

export default function TrendsDashboard({ metrics, trendImageUrl }: TrendsDashboardProps) {
  return (
    <div className="w-full space-y-8 pb-12">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Proteína"
          value={metrics.protein}
          unit="gramos"
          icon={<Zap size={24} className="text-brand-teal" />}
          color="text-brand-teal"
        />
        <MetricCard
          title="Restante"
          value={metrics.caloriesRemaining}
          unit="kcal"
          icon={<Flame size={24} className="text-orange-500" />}
          color="text-orange-500"
        />
        <MetricCard
          title="Voluntad"
          value={metrics.willpowerScore}
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
    </div>
  );
}
