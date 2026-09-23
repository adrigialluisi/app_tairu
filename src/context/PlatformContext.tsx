import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Platform = 'ios' | 'android';

interface PlatformContextValue {
  platform: Platform;
  setPlatform: (platform: Platform) => void;
  togglePlatform: () => void;
}

const PlatformContext = createContext<PlatformContextValue | undefined>(undefined);

function detectDefaultPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'ios';
  const ua = navigator.userAgent || '';
  return /android/i.test(ua) ? 'android' : 'ios';
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<Platform>(detectDefaultPlatform);

  const value = useMemo<PlatformContextValue>(
    () => ({
      platform,
      setPlatform,
      togglePlatform: () => setPlatform((p) => (p === 'ios' ? 'android' : 'ios')),
    }),
    [platform],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform precisa estar dentro de <PlatformProvider>');
  return ctx;
}
