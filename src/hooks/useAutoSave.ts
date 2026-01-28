import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../stores/canvasStore';

export const useAutoSave = () => {
  const { saveDraft, selectedProduct } = useCanvasStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    if (!selectedProduct) return;

    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      // Only save if at least 30 seconds have passed since last save
      if (now - lastSaveRef.current > 30000) {
        saveDraft();
        lastSaveRef.current = now;
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedProduct, saveDraft]);

  // Save on significant actions (handled by store pushHistory)
  const triggerSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
      lastSaveRef.current = Date.now();
    }, 1000); // Debounce saves
  };

  return { triggerSave };
};

