'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; type: ToastType };

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

const CONFIG: Record<ToastType, {
  bg: string; border: string; iconBg: string; icon: string; glow: string; textColor: string;
}> = {
  success: {
    bg: 'rgba(0,229,160,0.08)',
    border: 'rgba(0,229,160,0.25)',
    iconBg: 'rgba(0,229,160,0.2)',
    icon: '✓',
    glow: '0 8px 32px rgba(0,229,160,0.15)',
    textColor: 'rgba(0,229,160,0.9)',
  },
  error: {
    bg: 'rgba(255,77,106,0.08)',
    border: 'rgba(255,77,106,0.25)',
    iconBg: 'rgba(255,77,106,0.2)',
    icon: '✕',
    glow: '0 8px 32px rgba(255,77,106,0.15)',
    textColor: 'rgba(255,77,106,0.9)',
  },
  info: {
    bg: 'rgba(99,195,255,0.08)',
    border: 'rgba(99,195,255,0.25)',
    iconBg: 'rgba(99,195,255,0.2)',
    icon: 'i',
    glow: '0 8px 32px rgba(99,195,255,0.15)',
    textColor: 'rgba(99,195,255,0.9)',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none w-full max-w-xs px-4">
        {toasts.map((t) => {
          const cfg = CONFIG[t.type];
          return (
            <div
              key={t.id}
              className="w-full pointer-events-auto animate-slide-up flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                boxShadow: `${cfg.glow}, 0 2px 0 rgba(255,255,255,0.04) inset`,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              {/* Icon */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-none"
                style={{ background: cfg.iconBg, color: cfg.textColor }}
              >
                {cfg.icon}
              </div>

              {/* Message */}
              <span
                className="text-sm font-medium leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {t.message}
              </span>

              {/* Accent bar */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-2/3 rounded-full"
                style={{ background: cfg.textColor }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
