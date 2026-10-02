import * as React from 'react';
import { cn } from '@/lib/utils';

// Toast simples (sem deps radix)
type ToastItem = { id: string; title?: string; description?: string; variant?: 'default' | 'destructive' | 'success'; duration?: number };
type ToastCtx = { toasts: ToastItem[]; push: (t: Omit<ToastItem, 'id'>) => void; remove: (id: string) => void };

const ToastContext = React.createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const remove = React.useCallback((id: string) => setToasts((cur) => cur.filter((t) => t.id !== id)), []);
  const push = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const duration = t.duration ?? 4000;
    setToasts((cur) => [...cur, { id, ...t }]);
    setTimeout(() => remove(id), duration);
  }, [remove]);
  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-md border p-4 shadow-md text-sm bg-background',
              t.variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground',
              t.variant === 'success' && 'border-success bg-success text-success-foreground',
            )}
          >
            {t.title && <div className="font-semibold">{t.title}</div>}
            {t.description && <div className="opacity-90">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}