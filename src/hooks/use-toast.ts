import { useState, useEffect, useCallback } from 'react';

export type ToastVariant = 'default' | 'destructive';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

type ToastInput = Omit<Toast, 'id'>;

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners: Set<Listener> = new Set();

function emitChange() {
  listeners.forEach(listener => listener([...toasts]));
}

export function toast(input: ToastInput) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { ...input, id }];
  emitChange();
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    emitChange();
  }, 5000);
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>([...toasts]);

  const subscribe = useCallback((listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe(setToastList);
    return () => { unsubscribe(); };
  }, [subscribe]);

  return {
    toasts: toastList,
    toast,
    dismiss: (id: string) => {
      toasts = toasts.filter(t => t.id !== id);
      emitChange();
    },
  };
}
