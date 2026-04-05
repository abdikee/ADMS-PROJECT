/**
 * Lightweight toast utility replacing `sonner`.
 * Exports:
 *   - Toaster component (renders toasts via portal)
 *   - toast object with .success(), .error(), .info() methods
 *
 * Usage:
 *   toast.success('Message')
 *   toast.error('Message', { description: 'Details' })
 *   toast.success('Message', { description: 'Details', duration: 3000 })
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from './utils.js';

// ─── Internal event bus ───────────────────────────────────────────────────────
let _addToast = null;

function registerAddToast(fn) {
  _addToast = fn;
}

let _nextId = 1;

function emitToast(type, message, options = {}) {
  if (_addToast) {
    _addToast({ id: _nextId++, type, message, ...options });
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const toast = {
  success: (message, options) => emitToast('success', message, options),
  error: (message, options) => emitToast('error', message, options),
  info: (message, options) => emitToast('info', message, options),
};

// ─── Toast item component ─────────────────────────────────────────────────────
const ICONS = {
  success: <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />,
  error: <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />,
  info: <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
};

const BG = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
};

function ToastItem({ toast: t, onRemove }) {
  useEffect(() => {
    const duration = t.duration ?? 4000;
    const timer = setTimeout(() => onRemove(t.id), duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onRemove]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-md w-80 max-w-full',
        BG[t.type] || BG.info
      )}
    >
      {ICONS[t.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 break-words">{t.message}</p>
        {t.description && (
          <p className="mt-1 text-xs text-gray-600 break-words whitespace-pre-line">{t.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(t.id)}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Toaster component ────────────────────────────────────────────────────────
export function Toaster({ position = 'top-right', richColors }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    registerAddToast(addToast);
    return () => {
      if (_addToast === addToast) _addToast = null;
    };
  }, [addToast]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className={cn(
        'fixed z-[9999] flex flex-col gap-2',
        positionClasses[position] || positionClasses['top-right']
      )}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
}
