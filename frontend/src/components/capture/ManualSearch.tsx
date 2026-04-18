"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Utensils, X, ChevronRight, Hash, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualSearchResult {
  nombre: string;
  macros_per_100g: {
    proteina: number;
    carbohidratos: number;
    grasas: number;
    calorias: number;
  };
  veredicto: string;
  justificacion_breve: string;
}

interface ManualSearchProps {
  apiBaseUrl: string;
  authToken: string;
  onSuccess: (data: any) => void;
}

export default function ManualSearch({ apiBaseUrl, authToken, onSuccess }: ManualSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ManualSearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<ManualSearchResult | null>(null);
  const [grams, setGrams] = useState(100);
  const [isLogging, setIsLogging] = useState(false);

  // Debounced search logic (optional, keeping it simple with a button for now)
  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults([]);
    try {
      const res = await fetch(`${apiBaseUrl}/search-food?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (e) {
      console.error("Search Error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogManual = async () => {
    if (!selectedFood) return;
    setIsLogging(true);
    
    // Calculate final macros based on grams
    const factor = grams / 100;
    const finalLog = {
      nombre: selectedFood.nombre,
      calories: selectedFood.macros_per_100g.calorias * factor,
      protein: selectedFood.macros_per_100g.proteina * factor,
      carbs: selectedFood.macros_per_100g.carbohidratos * factor,
      fat: selectedFood.macros_per_100g.grasas * factor,
      grams: grams,
      veredicto: selectedFood.veredicto,
      justificacion: selectedFood.justificacion_breve
    };

    try {
      const res = await fetch(`${apiBaseUrl}/log-manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(finalLog)
      });
      
      if (res.ok) {
        const data = await res.json();
        onSuccess(data);
        // Reset
        setSelectedFood(null);
        setQuery("");
        setResults([]);
      }
    } catch (e) {
      console.error("Logging Error:", e);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Busca comida (ej: Tira de asado, 2 rebanadas de pan)"
          className="w-full glass bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-teal/50 transition-all font-medium text-sm"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-teal transition-colors" size={18} />
        
        {query && !isSearching && (
           <button 
             onClick={handleSearch}
             className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-teal text-black p-1.5 rounded-lg hover:scale-105 transition-transform"
           >
             <ChevronRight size={16} />
           </button>
        )}

        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
             <div className="w-4 h-4 border-2 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {results.length > 0 && !selectedFood && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass bg-zinc-950/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl overflow-y-auto max-h-60"
          >
            {results.map((food, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedFood(food);
                  setGrams(100); // Default to 100g
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-black uppercase text-white tracking-tight">{food.nombre}</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">
                    {food.macros_per_100g.calorias} kcal / 100g • {food.veredicto}
                  </span>
                </div>
                <Utensils size={14} className="text-zinc-700" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gram Detail Modal/Section */}
      <AnimatePresence>
        {selectedFood && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass bg-brand-teal/5 border border-brand-teal/20 rounded-3xl p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-teal flex items-center justify-center text-black">
                  <Sparkles size={18} />
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase italic tracking-tighter text-white">
                        {selectedFood.nombre}
                    </h4>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">
                        Ajustar cantidad biológica
                    </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFood(null)}
                className="p-2 hover:text-white text-zinc-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Macro Preview (Dynamic) */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: "CAL", val: Math.round(selectedFood.macros_per_100g.calorias * (grams/100)), col: "text-white" },
                    { label: "PROT", val: Math.round(selectedFood.macros_per_100g.proteina * (grams/100)), col: "text-brand-teal" },
                    { label: "CARB", val: Math.round(selectedFood.macros_per_100g.carbohidratos * (grams/100)), col: "text-amber-500" },
                    { label: "FAT", val: Math.round(selectedFood.macros_per_100g.grasas * (grams/100)), col: "text-yellow-500" }
                ].map((m, i) => (
                    <div key={i} className="text-center bg-white/5 rounded-xl py-3 border border-white/5">
                        <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">{m.label}</p>
                        <p className={cn("text-xs font-bold", m.col)}>{m.val}{m.label === 'CAL' ? '' : 'g'}</p>
                    </div>
                ))}
            </div>

            {/* Gram Slider / Input */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cantidad (Gramos)</span>
                    <div className="flex items-center gap-2">
                        <Hash size={12} className="text-brand-teal" />
                        <input 
                            type="number"
                            value={grams}
                            onChange={(e) => setGrams(Number(e.target.value))}
                            className="w-16 bg-transparent border-b border-brand-teal text-right font-black text-white text-sm focus:outline-none"
                        />
                        <span className="text-[10px] font-black text-zinc-600">G</span>
                    </div>
                </div>
                <input 
                    type="range"
                    min="1"
                    max="1000"
                    step="5"
                    value={grams}
                    onChange={(e) => setGrams(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-teal"
                />
            </div>

            <button
              onClick={handleLogManual}
              disabled={isLogging}
              className="w-full py-4 rounded-2xl bg-brand-teal text-black font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(20,241,149,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              {isLogging ? (
                 <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>GUARDAR REGRESO MANUAL <Check size={14} /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
