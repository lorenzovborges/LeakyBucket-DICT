import { createContext, useCallback, useContext } from 'react';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let nextId = 0;
export function useCreateToastState() {
  const toasts: Toast[] = [];

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    // This is a simplified version - the real implementation uses state
    void message;
    void type;
  };

  const removeToast = (id: number) => {
    void id;
  };

  return { toasts, addToast, removeToast };
}

export function getNextToastId() {
  return ++nextId;
}
