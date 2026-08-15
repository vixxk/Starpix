import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { WarningCircle, CheckCircle, Info, X } from '@phosphor-icons/react';

const ToastContext = createContext(null);

let idCounter = 0;

const TOAST_META = {
  error: {
    icon: WarningCircle,
    accent: 'bg-red-500',
    title: 'Action Failed',
  },
  success: {
    icon: CheckCircle,
    accent: 'bg-emerald-500',
    title: 'Success',
  },
  info: {
    icon: Info,
    accent: 'bg-sky-500',
    title: 'Notice',
  },
};

function ToastItem({ toast, onClose }) {
  const meta = TOAST_META[toast.type] || TOAST_META.info;
  const Icon = meta.icon;

  return (
    <div
      className={`anim pointer-events-auto bg-ink text-paper-50 border-2 border-ink shadow-hard-lg p-3.5 flex items-start gap-3`}
      role="alert"
    >
      <span className={`w-9 h-9 shrink-0 rounded-[2px] border-2 border-paper-50/40 flex items-center justify-center text-white ${meta.accent}`}>
        <Icon className="w-[18px] h-[18px]" weight="fill" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-xs font-bold text-paper-50 tracking-wide">{meta.title}</p>
        <p className="text-[11px] text-paper-100/80 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-paper-50/60 hover:text-white p-1 -m-1 shrink-0 rounded-[2px] hover:bg-paper-50/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" weight="bold" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      timers.current[id] = setTimeout(() => removeToast(id), 4500);
    },
    [removeToast]
  );

  // Clear pending timers if the provider ever unmounts
  useEffect(() => {
    const pending = timers.current;
    return () => {
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  const toast = useMemo(
    () => ({
      error: (message) => push('error', message),
      success: (message) => push('success', message),
      info: (message) => push('info', message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 w-[min(92vw,360px)] pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return { toast: ctx };
};
