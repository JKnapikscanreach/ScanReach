import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DebugEntry {
  id: string;
  timestamp: Date;
  type: 'supabase' | 'fetch' | 'edge-function' | 'upload' | 'error' | 'info';
  method?: string;
  url?: string;
  request?: any;
  response?: any;
  duration?: number;
  status?: number;
  error?: string;
  source?: string;
}

interface DebugContextType {
  entries: DebugEntry[];
  isEnabled: boolean;
  addEntry: (entry: Omit<DebugEntry, 'id' | 'timestamp'>) => void;
  clearEntries: () => void;
  toggleDebug: () => void;
  exportEntries: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};

interface DebugProviderProps {
  children: ReactNode;
}

export const DebugProvider: React.FC<DebugProviderProps> = ({ children }) => {
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);

  const addEntry = (entry: Omit<DebugEntry, 'id' | 'timestamp'>) => {
    if (!isEnabled) return;
    
    const newEntry: DebugEntry = {
      ...entry,
      id: `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setEntries(prev => {
      const updated = [newEntry, ...prev];
      // Keep only last 500 entries to prevent memory issues
      return updated.slice(0, 500);
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Debug Entry:', newEntry);
    }
  };

  const clearEntries = () => {
    setEntries([]);
  };

  const toggleDebug = () => {
    setIsEnabled(prev => !prev);
    if (!isEnabled) {
      addEntry({
        type: 'info',
        source: 'DebugContext',
        request: { action: 'Debug mode enabled' },
      });
    }
  };

  const exportEntries = () => {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-log-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DebugContext.Provider
      value={{
        entries,
        isEnabled,
        addEntry,
        clearEntries,
        toggleDebug,
        exportEntries,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
};
