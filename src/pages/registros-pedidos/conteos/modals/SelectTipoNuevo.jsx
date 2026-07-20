import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import AgregarEditarConteo from './AgregarEditarConteo';

const SelectTipoNuevo = ({ isOpen, onClose }) => {
    const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

    const handleClose = (nuevoConteo) => {
        setTipoSeleccionado(null);
        onClose(nuevoConteo);
    };

    if (!isOpen) return null;

    return (
        <>
            <ModalCentro
                isOpen={isOpen && !tipoSeleccionado}
                onClose={() => handleClose(null)}
                title="Seleccionar Tipo de Conteo"
                hideFooter={true}
            >
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <Boton
                        label="Materia Prima"
                        onClick={() => setTipoSeleccionado('acopio')}
                        className="btn-cancel"
                    />
                    <Boton
                        label="Almacén General"
                        onClick={() => setTipoSeleccionado('almacen')}
                        className="btn-cancel"
                    />
                </div>
            </ModalCentro>
            {tipoSeleccionado && (
                <AgregarEditarConteo
                    isOpen={true}
                    onClose={handleClose}
                    isAcopio={tipoSeleccionado === 'acopio'}
                />
            )}
        </>
    );
};

export default SelectTipoNuevo;
