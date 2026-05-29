import { useCallback, useEffect, useState } from 'react';
import type { ThemeMode } from '@/types';

const STORAGE_KEY = 'ott-theme';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? getSystemTheme() : mode;
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return stored ?? 'system';
  });

  const resolved = resolveTheme(mode);

  const apply = useCallback((theme: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f8fafc');
  }, []);

  useEffect(() => {
    apply(resolved);
  }, [resolved, apply]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => apply(getSystemTheme());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode, apply]);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
  }, []);

  const toggle = useCallback(() => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    setMode(next);
  }, [resolved, setMode]);

  return { mode, setMode, resolved, toggle };
}
