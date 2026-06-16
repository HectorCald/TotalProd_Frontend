import React, { useState } from 'react';
import ModalCentro from '../../common/modals/ModalCentro';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import { useToast } from '../../../context/ToastContext';

const CerrarSesion = ({ isOpen, onClose }) => {
    const { clearUser } = useUser();
    const { clearEmployee } = useEmployee();
    const { showSuccess } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = () => {
        // Limpiar datos de ambos contextos (estos métodos también limpian el token internamente)
        clearUser();
        clearEmployee();

        // Asegurarnos de eliminar explícitamente el token del local
        localStorage.removeItem('cacheVersion');
        localStorage.removeItem('sidebarCollapsed');
        localStorage.removeItem('sucursalIdSeleccionada');
        localStorage.removeItem('token');
        sessionStorage.clear();

        // Dispatch event to notify App.jsx of token change immediately
        window.dispatchEvent(new Event('local-logout'));

        onClose();
    };

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Cerrar sesión"
            mensaje="¿Estás seguro de que deseas cerrar sesión?"
            detalle="Tendrás que volver a ingresar tus credenciales para acceder a la aplicación."
            confirmText="Cerrar sesión"
            confirmColorClass="btn-red"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default CerrarSesion;
