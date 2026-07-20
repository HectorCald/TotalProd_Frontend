import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';

const ModalOpcionesAlmacen = ({ isOpen, onClose }) => {
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
        return usuario.modules.some(m => m.modulos?.clave === 'almacen_general' && m.name === subKey);
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title="Opciones de Almacén General"
            hideFooter={true}
            contentStyle={{ padding: '10px 20px 20px 20px' }}
        >
            {hasAccess('realizar_salidas') && <Boton label="Venta" onClick={() => handleSelect('/almacen/salidas')} className="btn-cancel" />}
            {hasAccess('realizar_entradas') && <Boton label="Nuevo Ingreso" onClick={() => handleSelect('/almacen/entradas')} className="btn-cancel" />}
            {hasAccess('realizar_pedidos') && <Boton label="Nuevo Pedido" onClick={() => handleSelect('/almacen/pedidos')} className="btn-cancel" />}
            {hasAccess('cotizar') && <Boton label="Nueva Cotización" onClick={() => handleSelect('/almacen/cotizar')} className="btn-cancel" />}
            {hasAccess('gestionar') && <Boton label="Inventario" onClick={() => handleSelect('/almacen/gestionar')} className="btn-cancel" />}
        </ModalCentro>
    );
};

export default ModalOpcionesAlmacen;
