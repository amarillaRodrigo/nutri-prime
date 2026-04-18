import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeApiUrl(url: string | undefined): string {
    const fallback = "https://prime-state-api.loca.lt";
    if (!url) return fallback;
    
    let sanitized = url.trim();
    
    // Remove leading slashes (causes relative path issues in browsers)
    while (sanitized.startsWith('/')) {
        sanitized = sanitized.substring(1);
    }
    
    // Prepend protocol if missing
    if (sanitized && !sanitized.startsWith('http')) {
        sanitized = `https://${sanitized}`;
    }
    
    // Remove trailing slashes
    while (sanitized.endsWith('/')) {
        sanitized = sanitized.substring(0, sanitized.length - 1);
    }
    
    return sanitized || fallback;
}
