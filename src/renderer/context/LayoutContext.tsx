import React, { createContext, useCallback, useContext, useState } from 'react';
import type { LayoutMode } from '../../shared/types';

interface LayoutContextValue {
  mode: LayoutMode;
  setMode: (mode: LayoutMode) => void;
  cycleMode: () => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  mode: 'classic',
  setMode: () => {},
  cycleMode: () => {},
});

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<LayoutMode>('classic');

  const cycleMode = useCallback(() => {
    setMode((prev) => {
      if (prev === 'classic') return 'compact';
      if (prev === 'compact') return 'vertical';
      return 'classic';
    });
  }, []);

  return (
    <LayoutContext.Provider value={{ mode, setMode, cycleMode }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
