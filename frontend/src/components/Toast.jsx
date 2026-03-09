import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, open, onClose, type = 'success', duration = 2000 }) => {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className={`toast toast-${type}`} role="status" aria-live="polite">
      {message}
    </div>
  );
};

export default Toast;