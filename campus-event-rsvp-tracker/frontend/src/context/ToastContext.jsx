import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, removeToast }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const isSuccess = toast.type === 'success';

  return (
    <div 
      className={`flex items-center gap-3 p-4 rounded-2xl shadow-lg border animate-in slide-in-from-right-8 fade-in duration-300 ${
        isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="font-medium text-sm">{toast.message}</span>
      <button 
        onClick={() => removeToast(toast.id)} 
        className={`p-1 rounded-lg transition-colors ${
          isSuccess ? 'hover:bg-emerald-100' : 'hover:bg-red-100'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Custom hook helper
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  
  return {
    success: (msg) => context.addToast(msg, 'success'),
    error: (msg) => context.addToast(msg, 'error')
  };
}
