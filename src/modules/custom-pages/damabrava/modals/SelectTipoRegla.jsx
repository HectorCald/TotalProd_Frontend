import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import NuevaRegla from './NuevaRegla';

const SelectTipoRegla = ({ isOpen, onClose, onReglaRegistrada }) => {
    const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

    const handleClose = () => {
        setTipoSeleccionado(null);
        onClose();
    };

    const handleReglaRegistrada = (nuevaRegla) => {
        setTipoSeleccionado(null);
        if (onReglaRegistrada) {
            onReglaRegistrada(nuevaRegla);
        }
        onClose();
    };

    if (!isOpen && !tipoSeleccionado) return null;

    return (
        <>
            <ModalCentro
                isOpen={isOpen && !tipoSeleccionado}
                onClose={handleClose}
                title="Seleccionar Tipo de Regla"
                hideFooter={true}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 20px 20px 20px' }}>
                    <Boton
                        label="Regla General"
                        onClick={() => setTipoSeleccionado('general')}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                    />
                    <Boton
                        label="Regla Especial"
                        onClick={() => setTipoSeleccionado('especial')}
                        className="btn-cancel"
                        style={{ width: '100%', justifyContent: 'center' }}
                    />
                    <Boton
                        label="Regla por Gramaje"
                        onClick={() => setTipoSeleccionado('gramaje')}
                        className="btn-cancel"
                        style={{ width: '100%', justifyContent: 'center' }}
                    />
                </div>
            </ModalCentro>
            {tipoSeleccionado && (
                <NuevaRegla
                    isOpen={true}
                    onClose={() => setTipoSeleccionado(null)}
                    tipoRegla={tipoSeleccionado}
                    onReglaRegistrada={handleReglaRegistrada}
                />
            )}
        </>
    );
};

export default SelectTipoRegla;
