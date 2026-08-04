import React from 'react';
import ModalCentro from '../../../modals/ModalCentro';
import Boton from '../../../botones/Boton';

const SelectTipoFecha = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    const handleSelect = (tipo) => {
        onSelect(tipo);
        onClose();
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title="Seleccionar Tipo de Fecha"
            hideFooter={true}
            contentStyle={{ padding: '10px 20px 20px 20px' }}
        >
           
                <Boton
                    label="Diario"
                    onClick={() => handleSelect('diario')}
                    className="btn-cancel"
                />
                <Boton
                    label="Semanal"
                    onClick={() => handleSelect('semanal')}
                    className="btn-cancel"
                />
                <Boton
                    label="Mensual"
                    onClick={() => handleSelect('mensual')}
                    className="btn-cancel"
                />
                <Boton
                    label="Anual"
                    onClick={() => handleSelect('anual')}
                    className="btn-cancel"
                />
                <Boton
                    label="Fecha personalizada"
                    onClick={() => handleSelect('personalizada')}
                    className="btn-cancel"
                />
            
        </ModalCentro>
    );
};

export default SelectTipoFecha;
