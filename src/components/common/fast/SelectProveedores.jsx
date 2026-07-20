import React, { useEffect, useState } from 'react';
import InputSelectBox from '../inputs/InputSelectBox';
import proveedorService from '../../../services/proveedorService';
import useSessionCache from '../../../hooks/useSessionCache';
import AgregarEditarProveedor from '../../../pages/gestion/proveedores/modals/AgregarEditarProveedor';

const SelectProveedores = ({ value, onChange, error, label = "Proveedor", required = false, fetchTrigger, disabled, ...rest }) => {
    const { value: proveedores, setValue: setProveedores } = useSessionCache({
        key: 'proveedoresListado',
        defaultValue: []
    });

    useEffect(() => {
        const fetchProveedores = async () => {
            try {
                const response = await proveedorService.getAll();
                if (response.success && response.data) {
                    setProveedores(response.data);
                }
            } catch (err) {
                console.error("Error al obtener proveedores en SelectProveedores:", err);
            }
        };
        fetchProveedores();
    }, [setProveedores, fetchTrigger]);

    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    const options = proveedores.map(p => ({ value: String(p.id), label: p.name }));

    return (
        <>
            <InputSelectBox
                label={label}
                value={value}
                onChange={onChange}
                options={options}
                error={error}
                required={required}
                disabled={disabled}
                actionIcon="plus"
                onActionClick={() => setIsAgregarOpen(true)}
                actionStyle={{ marginBottom: '0px' }}
                {...rest}
            />
            {isAgregarOpen && (
                <AgregarEditarProveedor
                    isOpen={isAgregarOpen}
                    onClose={() => setIsAgregarOpen(false)}
                    proveedorSeleccionado={null}
                    onGuardar={(nuevoProveedor) => {
                        setProveedores(prev => [...prev, nuevoProveedor]);
                        if (onChange) onChange(String(nuevoProveedor.id));
                        setIsAgregarOpen(false);
                    }}
                />
            )}
        </>
    );
};

export default SelectProveedores;
