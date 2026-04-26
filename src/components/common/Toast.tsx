import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  confirmDialog: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const confirmDialog = useCallback((message: string): Promise<boolean> => {
    return new Promise(resolve => setDialog({ message, resolve }));
  }, []);

  const handleConfirm = (value: boolean) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };

  return (
    <ToastContext.Provider value={{ toast, confirmDialog }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[99999] space-y-2" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`${colors[t.type]} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm animate-[slideIn_0.2s_ease-out]`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {dialog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black bg-opacity-50" />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <p className="text-gray-900 mb-4">{dialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => handleConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
