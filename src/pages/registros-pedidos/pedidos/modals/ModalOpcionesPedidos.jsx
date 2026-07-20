import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import { useNavigate } from 'react-router-dom';

const ModalOpcionesPedidos = ({ isOpen, onClose }) => {
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
            title="Seleccionar Pedido"
            hideFooter={true}
            contentStyle={{ padding: '10px 20px 20px 20px' }}
        >
            <Boton label="Almacén" onClick={() => handleSelect('/pedidos/almacen')} className="btn-cancel" />
            <Boton label="Materia Prima" onClick={() => handleSelect('/pedidos/acopio')} className="btn-cancel" />
        </ModalCentro>
    );
};

export default ModalOpcionesPedidos;
