"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FlashCapture from "@/components/capture/FlashCapture";
import DopamineRoom from "@/components/intervention/DopamineRoom";
import TrendsDashboard from "@/components/dashboard/TrendsDashboard";
import ProfileSetup from "@/components/profile/ProfileSetup";
import { useFoodScan } from "@/hooks/useFoodScan";
import { Trophy, Settings } from "lucide-react";
import { sanitizeApiUrl } from "@/lib/utils";

const LiveClock = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-20" />;

  return (
    <div className="flex flex-col items-center justify-center space-y-1 py-4 border-b border-white/5 mb-8">
      <span className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em]">
        {time.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </span>
      <span className="text-4xl font-black tabular-nums tracking-tighter text-white">
        {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-[10px] text-brand-teal uppercase font-bold tracking-widest mt-2 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" /> Daily Counters Flowing
      </span>
    </div>
  );
};

export default function PrimeStateApp() {
    const API_BASE = sanitizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    
    // Debug logging for production deployment
    useEffect(() => {
        console.log("%c[PRIME-DEBUG] API Base URL:", "color: #00d1b2; font-weight: bold;", API_BASE);
    }, [API_BASE]);

  const { scanFood, isProcessing, lastAnalysis, reset, error: scanError } = useFoodScan(API_BASE);
  
  const [showDopamineRoom, setShowDopamineRoom] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [todayTotals, setTodayTotals] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // For testing: Hardcoded token
  const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpemtsaG5jZm1rYXpwb3BqemF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ4MDE1NywiZXhwIjoyMDkyMDU2MTU3fQ._nQQ_z2NG7_Kfvrjm6D1stqLR3VTuje4KvWvd5WlK3A";

  // 1. Initial Load: Server-First Persistence
  useEffect(() => {
    const initializeApp = async () => {
        console.log("[PRIME-INIT] Verificando identidad en el Cerebro...");
        
        // Try LocalStorage first for instant UI
        const savedProfile = localStorage.getItem("prime_user_profile");
        if (savedProfile) {
            try {
                setUserProfile(JSON.parse(savedProfile));
                setShowProfileSetup(false);
                setIsInitializing(false);
                console.log("[PRIME-INIT] Perfil recuperado de memoria local.");
                return;
            } catch (e) {
                console.warn("[PRIME-INIT] Error en memoria local, consultando servidor...");
            }
        }

        // Fallback to Backend (Source of Truth)
        try {
            const res = await fetch(`${API_BASE}/profile`, {
                headers: { "Authorization": `Bearer ${TEST_TOKEN}` }
            });
            if (res.ok) {
                const profile = await res.json();
                setUserProfile(profile);
                localStorage.setItem("prime_user_profile", JSON.stringify(profile));
                setShowProfileSetup(false);
                console.log("[PRIME-INIT] Perfil recuperado del Cerebro (Railway).");
            } else {
                console.log("[PRIME-INIT] Usuario nuevo detectado.");
                setShowProfileSetup(true);
            }
        } catch (e) {
            console.error("[PRIME-INIT] Error de conexión con el Cerebro.", e);
            setShowProfileSetup(true);
        } finally {
            setIsInitializing(false);
        }
    };
    
    if (API_BASE) initializeApp();
  }, [API_BASE]);

  // 2. Health & Warmup (Background) + History Fetch
  useEffect(() => {
    if (!isInitializing && userProfile) {
        fetchHistory();
    }
  }, [isInitializing, userProfile]);

  // Helper: ensure server has profile, otherwise sync it
  const ensureProfileSynced = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      });
      if (res.ok) return true; // already exists
      // If 404, attempt sync using current local profile
      if (res.status === 404 && userProfile) {
        console.warn('[PRIME-AUTOSYNC] Perfil no encontrado en servidor, sincronizando automáticamente...');
        const syncRes = await fetch(`${API_BASE}/sync-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${TEST_TOKEN}`,
          },
          body: JSON.stringify(userProfile),
        });
        if (!syncRes.ok) {
          const errData = await syncRes.json().catch(() => ({}));
          throw new Error(errData.detail || `Sync failed: ${syncRes.status}`);
        }
        const data = await syncRes.json();
        handleProfileSync(data.profile);
        return true;
      }
    } catch (e) {
      console.error('[PRIME-AUTOSYNC] Error al intentar sincronizar perfil', e);
    }
    return false;
  };

  const fetchHistory = async () => {
    try {
        const res = await fetch(`${API_BASE}/history?limit=5`, {
            headers: { "Authorization": `Bearer ${TEST_TOKEN}` }
        });
        if (res.ok) {
            const data = await res.json();
            setScanHistory(data.history || []);
            if (data.today_totals) {
                setTodayTotals(data.today_totals);
            }
        }
    } catch (e) {
        console.error("Failed to fetch history", e);
    }
  };

  const handleCapture = async (blob: Blob) => {
    // Ensure profile exists on backend before uploading image
    const profileReady = await ensureProfileSynced();
    if (!profileReady) {
      setShowProfileSetup(true);
      return;
    }

    const result = await scanFood(blob, TEST_TOKEN);
    
    // Auto-fix: If backend still reports missing profile after scan
    if (!result && scanError && scanError.includes("Profile not found")) {
        console.warn("[PRIME-AUTOFIX] Perfil no encontrado en servidor, abriendo configuración...");
        setShowProfileSetup(true);
        return;
    }

    if (result) {
        fetchHistory(); // Refresh history after scan
    }
    if (result?.motivation_mode_active) {
      setShowDopamineRoom(true);
    }
  };

  const handleProfileSync = (profile: any) => {
    setUserProfile(profile);
    localStorage.setItem("prime_user_profile", JSON.stringify(profile));
    setShowProfileSetup(false);
  };

  if (isInitializing) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-t-2 border-brand-teal animate-spin" />
        </div>
    );
  }

  return (
    <main className="relative min-h-screen px-6 pt-12 max-w-2xl mx-auto flex flex-col gap-12">
      {/* Header */}
      <header className="flex items-center justify-between">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center">
            <Trophy size={18} className="text-black" />
          </div>
          <span className="font-black italic tracking-tighter text-2xl uppercase">PRIME STATE</span>
        </motion.div>
        
        <button 
            onClick={() => setShowProfileSetup(true)}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <Settings size={20} />
        </button>
      </header>

      <LiveClock />

      {/* Global Error Display */}
      {scanError && (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-center"
        >
            <p className="text-[10px] font-black uppercase tracking-widest">{scanError}</p>
        </motion.div>
      )}

      {/* Main Experience */}
      <section className="flex-1 flex flex-col justify-center">
        <FlashCapture 
          onCapture={handleCapture}
          isProcessing={isProcessing} 
        />
      </section>

      {/* Dashboard View */}
      <section>
        <TrendsDashboard 
          metrics={{
            protein: todayTotals?.protein || 0,
            carbs: todayTotals?.carbs || 0,
            fats: todayTotals?.fats || 0,
            caloriesRemaining: userProfile?.calorie_goal ? Math.max(0, userProfile.calorie_goal - (todayTotals?.calories || 0)) : (lastAnalysis?.calories_remaining || 2000),
            willpowerScore: lastAnalysis?.analysis?.calidad_nutricional || 0,
            proteinGoal: userProfile?.protein_goal || 160
          }}
          trendImageUrl={`${API_BASE}/analytics/trends`} 
          history={scanHistory}
        />
      </section>

      {/* Profile Setup Modal */}
      <ProfileSetup 
        isOpen={showProfileSetup}
        onSync={handleProfileSync}
        apiBaseUrl={API_BASE}
        authToken={TEST_TOKEN}
        initialData={userProfile}
      />

      {/* Interventions */}
      <DopamineRoom 
        isOpen={showDopamineRoom}
        onClose={(proceed) => {
            setShowDopamineRoom(false);
            if (!proceed) reset();
        }}
        assetUrl={lastAnalysis?.asset_url}
        message={lastAnalysis?.message}
      />

      <footer className="pb-8 text-center mt-auto">
         <p className="text-[10px] text-zinc-600 font-bold tracking-[0.4em] uppercase">
            Designed for High Performance
         </p>
      </footer>
    </main>
  );
}
