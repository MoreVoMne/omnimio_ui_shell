import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onUndo?: () => void;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onUndo, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✗',
  };

  const colors = {
    success: 'bg-green-50 border-green-500 text-green-700',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    error: 'bg-red-50 border-red-500 text-red-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`border rounded-[12px] p-4 ${colors[type]} flex items-center justify-between gap-4 min-w-[300px] max-w-md`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icons[type]}</span>
        <span className="font-mono text-xs uppercase tracking-widest">{message}</span>
      </div>
      <div className="flex items-center gap-2">
        {onUndo && (
          <button
            onClick={onUndo}
            className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:opacity-70"
          >
            Undo
          </button>
        )}
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: ToastType;
    onUndo?: () => void;
  }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onUndo={toast.onUndo}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

