import { useState, useEffect, useRef, useCallback } from 'react';

interface PendingUpdate {
  key: string;
  value: any;
  timestamp: number;
}

export function useSmartAutoSave<T extends Record<string, any>>(
  onSave: (updates: Partial<T>) => Promise<void>,
  delay: number = 2000
) {
  const [isSaving, setIsSaving] = useState(false);
  const pendingUpdates = useRef<Map<string, PendingUpdate>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const savePendingUpdates = useCallback(async () => {
    if (pendingUpdates.current.size === 0) return;

    const updates: Partial<T> = {};
    pendingUpdates.current.forEach((update) => {
      updates[update.key as keyof T] = update.value;
    });

    try {
      setIsSaving(true);
      await onSave(updates);
      pendingUpdates.current.clear();
    } catch (error) {
      console.error('Smart auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const queueUpdate = useCallback((key: string, value: any) => {
    // Add to pending updates
    pendingUpdates.current.set(key, {
      key,
      value,
      timestamp: Date.now()
    });

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(savePendingUpdates, delay);
  }, [delay, savePendingUpdates]);

  const saveImmediately = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await savePendingUpdates();
  }, [savePendingUpdates]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    queueUpdate,
    saveImmediately,
    isSaving,
    hasPendingUpdates: pendingUpdates.current.size > 0
  };
}