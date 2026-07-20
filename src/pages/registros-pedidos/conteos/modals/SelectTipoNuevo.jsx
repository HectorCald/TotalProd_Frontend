import React, { useState, useEffect } from 'react';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import AgregarEditarConteo from './AgregarEditarConteo';

const SelectTipoNuevo = ({ isOpen, onClose }) => {
    const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

    const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
    const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
    const sucursalSeleccionada = userSucursal || employeeSucursal;
    const tipoEmpresa = sucursalSeleccionada?.empresas?.tipo || userInfo?.empresa?.tipo || employeeInfo?.sucursal?.empresas?.tipo || 'ventas_produccion';
    const isSoloVentas = tipoEmpresa === 'ventas';

    useEffect(() => {
        if (isOpen && isSoloVentas && !tipoSeleccionado) {
            setTipoSeleccionado('almacen');
        }
    }, [isOpen, isSoloVentas, tipoSeleccionado]);

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
