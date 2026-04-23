import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'info' | 'success' | 'error';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

interface NotificationContextValue {
  notify: (message: string, type?: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm font-semibold shadow-xl transition transform ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-500/10 border-rose-500 text-rose-100'
                : 'bg-slate-900/95 border-slate-700 text-slate-100'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext).notify;
}
