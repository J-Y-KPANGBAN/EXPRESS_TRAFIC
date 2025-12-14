import React, { createContext, useContext, useState } from "react";
import "./Toast.css";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const show = ({ type = "info", message, duration = 3000 }) => {
    setToast({ type, message });

    setTimeout(() => setToast(null), duration);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

// 👉 Ceci rend ton import compatible
export const Toast = {
  show: ({ type, message, duration }) =>
    window.__toast && window.__toast({ type, message, duration }),
};

// 👉 Injection globale
window.__toast = null;

export const ToastInitializer = () => {
  const { show } = useToast();
  window.__toast = show;
  return null;
};


export default Toast;
