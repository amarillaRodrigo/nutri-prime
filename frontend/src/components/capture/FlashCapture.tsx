"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Sparkles, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashCaptureProps {
  onCapture: (blob: Blob) => void;
  isProcessing: boolean;
}

export default function FlashCapture({ onCapture, isProcessing }: FlashCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else resolve(file); // Fallback to original
          }, 'image/jpeg', 0.7);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      onCapture(compressed);
    }
  };

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[50vh]">
      {/* Native Capture Trigger */}
      <input 
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFile}
      />

      <div className="relative group">
        <label className="cursor-pointer block">
          <input 
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
            disabled={isProcessing}
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative w-48 h-48 rounded-full glass flex flex-col items-center justify-center gap-4 transition-all duration-500",
              "border-2 border-brand-teal/20 hover:border-brand-teal/50 shadow-2xl",
              isProcessing && "opacity-50 grayscale scale-95"
            )}
          >
            <div className="p-5 rounded-full bg-brand-teal/10 text-brand-teal group-hover:scale-110 transition-transform duration-500">
              <Camera size={48} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 group-hover:text-brand-teal transition-colors">
              SCAN FOOD
            </span>

            {/* Liquid Pulse Ring */}
            {!isProcessing && (
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute inset-0 rounded-full border-2 border-brand-teal"
              />
            )}

            {/* Shimmer Effect while processing */}
            {isProcessing && (
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                />
              </div>
            )}
          </motion.div>
        </label>
      </div>

      {/* Gallery Fallback */}
      <div className="mt-8">
        <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
          <ImageIcon size={14} /> Seleccionar de Galería
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {/* Processing Indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute -bottom-16 flex flex-col items-center gap-2"
          >
            <Sparkles className="text-brand-teal animate-pulse" size={20} />
            <span className="text-[9px] font-black tracking-widest text-brand-teal uppercase">IA Analizando...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
