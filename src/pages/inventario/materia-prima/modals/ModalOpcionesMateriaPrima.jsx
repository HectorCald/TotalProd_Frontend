import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';

const ModalOpcionesMateriaPrima = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const { user: userInfo } = useUser();
    const { employee: employeeInfo } = useEmployee();
    const isEmployee = !!employeeInfo;
    const usuario = userInfo || employeeInfo;

    if (!isOpen) return null;

    const handleSelect = (route) => {
        navigate(route);
        onClose();
    };

    const hasAccess = (subKey) => {
        if (!isEmployee) return true;
        if (!usuario?.modules) return false;
        return usuario.modules.some(m => m.modulos?.clave === 'materia_prima' && m.name === subKey);
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title="Opciones de Materia Prima"
            hideFooter={true}
            contentStyle={{ padding: '10px 20px 20px 20px' }}
        >
            {hasAccess('realizar_entradas') && <Boton label="Nuevo Ingreso" onClick={() => handleSelect('/materia-prima/entradas')} className="btn-cancel" />}
            {hasAccess('realizar_salidas') && <Boton label="Nueva Salida" onClick={() => handleSelect('/materia-prima/salidas')} className="btn-cancel" />}
            {hasAccess('realizar_pedidos') && <Boton label="Nuevo Pedido" onClick={() => handleSelect('/materia-prima/pedidos')} className="btn-cancel" />}
            {hasAccess('gestionar') && <Boton label="Inventario" onClick={() => handleSelect('/materia-prima/gestionar')} className="btn-cancel" />}
        </ModalCentro>
    );
};

export default ModalOpcionesMateriaPrima;
