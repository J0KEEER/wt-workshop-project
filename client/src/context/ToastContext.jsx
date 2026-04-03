import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type };
        
        setToasts((prev) => [...prev, newToast]);

        if (duration) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const contextValue = useMemo(() => ({
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
    }), [addToast]);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={18} color="var(--success)" />;
            case 'error': return <AlertCircle size={18} color="var(--danger)" />;
            default: return <Info size={18} color="var(--info)" />;
        }
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        {getIcon(toast.type)}
                        <div className="toast-message">{toast.message}</div>
                        <button 
                            className="modal-close" 
                            onClick={() => removeToast(toast.id)}
                            style={{ marginLeft: 'auto', padding: '4px' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
