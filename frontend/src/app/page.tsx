"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FlashCapture from "@/components/capture/FlashCapture";
import DopamineRoom from "@/components/intervention/DopamineRoom";
import TrendsDashboard from "@/components/dashboard/TrendsDashboard";
import ProfileSetup from "@/components/profile/ProfileSetup";
import { useFoodScan } from "@/hooks/useFoodScan";
import { Trophy, Settings } from "lucide-react";

export default function PrimeStateApp() {
    const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "https://prime-state-api.loca.lt";
    let API_BASE = rawApiBase.trim();
    if (API_BASE && !API_BASE.startsWith('http')) {
        API_BASE = `https://${API_BASE}`;
    }
    API_BASE = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const { scanFood, isProcessing, lastAnalysis, reset } = useFoodScan(API_BASE);
  
  const [showDopamineRoom, setShowDopamineRoom] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // For testing: Hardcoded token
  const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpemtsaG5jZm1rYXpwb3BqemF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ4MDE1NywiZXhwIjoyMDkyMDU2MTU3fQ._nQQ_z2NG7_Kfvrjm6D1stqLR3VTuje4KvWvd5WlK3A";

  // Check profile on load
  useEffect(() => {
    // If we don't have a profile in state, show the setup immediately
    if (!userProfile) {
      setShowProfileSetup(true);
    }
    
    const checkProfile = async () => {
        try {
            await fetch(`${API_BASE}/health`, { headers: { "Authorization": `Bearer ${TEST_TOKEN}` }});
            // Additional check logic if needed
        } catch (e) {
            console.error("Profile check failed (probably tunnel block)", e);
        }
    };
    checkProfile();
  }, [userProfile]);

  const handleCapture = async (blob: Blob) => {
    const result = await scanFood(blob, TEST_TOKEN);
    if (result?.motivation_mode_active) {
      setShowDopamineRoom(true);
    }
  };

  const handleProfileSync = (profile: any) => {
    setUserProfile(profile);
    setShowProfileSetup(false);
  };

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
            protein: lastAnalysis?.analysis.proteina || 0,
            caloriesRemaining: lastAnalysis?.calories_remaining || (userProfile?.calorie_goal || 2000),
            willpowerScore: lastAnalysis?.analysis.calidad_nutricional || 0,
            proteinGoal: userProfile?.protein_goal || 160
          }}
          trendImageUrl={`${API_BASE}/analytics/trends`} 
        />
      </section>

      {/* Profile Setup Modal */}
      <ProfileSetup 
        isOpen={showProfileSetup}
        onSync={handleProfileSync}
        apiBaseUrl={API_BASE}
        authToken={TEST_TOKEN}
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
