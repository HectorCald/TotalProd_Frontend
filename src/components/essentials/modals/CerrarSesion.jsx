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

        // Guardar valores que queremos mantener
        const rememberSession = localStorage.getItem('rememberSession');
        const savedEmail = localStorage.getItem('savedEmail');

        // Limpiar todo el storage
        localStorage.clear();
        sessionStorage.clear();

        // Restaurar los valores si existían
        if (rememberSession !== null) {
            localStorage.setItem('rememberSession', rememberSession);
        }
        if (savedEmail !== null) {
            localStorage.setItem('savedEmail', savedEmail);
        }

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
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default CerrarSesion;
