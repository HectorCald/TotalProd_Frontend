import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';
import styles from '../components/common/Toast.module.css';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe usarse dentro de ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback(({ tipo = 'info', titulo, detalle, duracion = 5000, showErrorActions = true }) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, tipo, titulo, detalle, duracion, showErrorActions }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showSuccess = useCallback((titulo, detalle, duracion) => {
        return showToast({ tipo: 'success', titulo, detalle, duracion });
    }, [showToast]);

    const showInfo = useCallback((titulo, detalle, duracion) => {
        return showToast({ tipo: 'info', titulo, detalle, duracion });
    }, [showToast]);

    const showDanger = useCallback((titulo, detalle, duracion, showErrorActions = true) => {
        return showToast({ tipo: 'danger', titulo, detalle, duracion, showErrorActions });
    }, [showToast]);

    const showWarning = useCallback((titulo, detalle, duracion) => {
        return showToast({ tipo: 'warning', titulo, detalle, duracion });
    }, [showToast]);

    const value = {
        showToast,
        showSuccess,
        showInfo,
        showDanger,
        showWarning,
        removeToast
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toasts.length > 0 && (
                <div className={styles.toastContainer}>
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            id={toast.id}
                            tipo={toast.tipo}
                            titulo={toast.titulo}
                            detalle={toast.detalle}
                            duracion={toast.duracion}
                            showErrorActions={toast.showErrorActions}
                            onClose={removeToast}
                        />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
};

export default ToastContext;
