import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';
import { useToast } from '../../../../context/ToastContext';

const ModalOpcionesRecursosHumanos = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { showWarning } = useToast();

    const { user: userInfo } = useUser();
    const { employee: employeeInfo } = useEmployee();
    const isEmployee = !!employeeInfo;
    const usuario = userInfo || employeeInfo;

    if (!isOpen) return null;

    const handleSelect = (route, isBuilding) => {
        if (isBuilding) {
            showWarning('En construcción', 'Este módulo aún está en construcción');
            return;
        }
        navigate(route);
        onClose();
    };

    const hasAccess = (subKey) => {
        if (!isEmployee) return true;
        if (!usuario?.modules) return false;
        return usuario.modules.some(m => m.modulos?.clave === 'recursos_humanos' && m.name === subKey);
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title="Opciones de Recursos Humanos"
            hideFooter={true}
            contentStyle={{ padding: '10px 20px 20px 20px' }}
        >
            {hasAccess('personal') && (
                <Boton
                    label="Personal"
                    onClick={() => handleSelect('/recursos-humanos/personal', false)}
                    className="btn-cancel"
                />
            )}
            {hasAccess('organigrama') && (
                <Boton
                    label="Organigrama"
                    onClick={() => handleSelect('/recursos-humanos/organigrama', false)}
                    className="btn-cancel"
                />
            )}
            {hasAccess('planificador') && (
                <Boton
                    label="Planificador"
                    onClick={() => handleSelect('/recursos-humanos/planificador', false)}
                    className="btn-cancel"
                />
            )}
        </ModalCentro>
    );
};

export default ModalOpcionesRecursosHumanos;
