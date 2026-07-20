import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import { useNavigate } from 'react-router-dom';

const ModalOpcionesMovimientos = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSelect = (route) => {
        navigate(route);
        onClose();
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title="Seleccionar Movimiento"
            hideFooter={true}
            contentStyle={{ padding: '10px 20px 20px 20px' }}
        >
            <Boton label="Almacén" onClick={() => handleSelect('/movimientos/almacen')} className="btn-cancel" />
            <Boton label="Materia Prima" onClick={() => handleSelect('/movimientos/acopio')} className="btn-cancel" />
        </ModalCentro>
    );
};

export default ModalOpcionesMovimientos;
