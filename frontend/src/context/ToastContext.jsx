import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

let seed = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++seed;
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      timers.current[id] = setTimeout(() => dismiss(id), 3800);
      return id;
    },
    [dismiss]
  );

  const toast = useCallback(
    (message, type = 'success') => push(type, message),
    [push]
  );

  const icons = {
    success: (
      <svg className="w-5 h-5 text-success shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-danger shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 00-1.4 1.4L8.6 10l-1.3 1.3a1 1 0 101.4 1.4L10 11.4l1.3 1.3a1 1 0 001.4-1.4L11.4 10l1.3-1.3a1 1 0 00-1.4-1.4L10 8.6 8.7 7.3z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-navy-light shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 w-[min(92vw,380px)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-slide-up flex items-start gap-3 rounded-xl border border-borderc bg-white px-4 py-3 shadow-cardhover"
          >
            {icons[t.type] || icons.info}
            <p className="flex-1 text-sm text-navy leading-snug pt-0.5">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-slatemuted hover:text-navy transition">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.3 5.2a1 1 0 00-1.4 1.4L8.6 10l-3.7 3.4a1 1 0 101.4 1.4L10 11.4l3.4 3.4a1 1 0 001.4-1.4L11.4 10l3.4-3.4a1 1 0 00-1.4-1.4L10 8.6 6.6 5.2z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
