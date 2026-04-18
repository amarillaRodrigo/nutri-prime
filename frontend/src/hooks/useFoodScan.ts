"use client";

import { useState } from "react";
import { sanitizeApiUrl } from "@/lib/utils";

export type FoodAnalysis = {
  alimento: string;
  cantidad_estimada_gramos: number;
  proteina: number;
  carbohidratos: number;
  grasas: number;
  calidad_nutricional: number;
  total_estimated_calories: number;
};

export type ScanResponse = {
  analysis: FoodAnalysis;
  motivation_mode_active: boolean;
  calories_remaining: number;
  message: string;
  asset_url?: string;
};

export function useFoodScan(apiBaseUrl: string = process.env.NEXT_PUBLIC_API_URL || "https://prime-state-api.loca.lt") {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanBase = sanitizeApiUrl(apiBaseUrl);

  const scanFood = async (imageBlob: Blob, token: string) => {
    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", imageBlob, "food_capture.jpg");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for AI

      const response = await fetch(`${cleanBase}/upload-image`, {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
        } catch (e) {}
        throw new Error(`Error del Cerebro: ${errorDetail}`);
      }

      const data: ScanResponse = await response.json();
      setLastAnalysis(data);
      return data;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError("El servidor tardó demasiado. Reintentando...");
      } else {
        setError(err.message || "Error al conectar con la IA.");
      }
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    scanFood,
    isProcessing,
    lastAnalysis,
    error,
    reset: () => setLastAnalysis(null)
  };
}
