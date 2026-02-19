import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toastEventName } from '../../utils/toast';
import type { ToastPayload } from '../../utils/toast';

type ToastItem = Required<Pick<ToastPayload, 'id' | 'message' | 'type'>> & {
  duration: number;
};

const iconByType = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const classByType = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export const ToastHost: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastPayload>;
      const nextToast: ToastItem = {
        id: customEvent.detail.id,
        message: customEvent.detail.message,
        type: customEvent.detail.type,
        duration: customEvent.detail.duration ?? 2800,
      };

      setToasts(prev => [...prev, nextToast]);
      window.setTimeout(() => {
        setToasts(prev => prev.filter(item => item.id !== nextToast.id));
      }, nextToast.duration);
    };

    window.addEventListener(toastEventName, handleToast as EventListener);
    return () => {
      window.removeEventListener(toastEventName, handleToast as EventListener);
    };
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[1000] flex max-w-sm flex-col gap-2">
      {toasts.map(toast => {
        const Icon = iconByType[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow ${classByType[toast.type]}`}
            role="status"
            aria-live="polite"
          >
            <Icon size={16} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm leading-5">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
