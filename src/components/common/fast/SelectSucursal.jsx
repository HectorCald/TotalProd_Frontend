import React, { useEffect } from 'react';
import InputSelect from '../inputs/InputSelect';
import sucursalesService from '../../../services/sucursalesService';
import useSessionCache from '../../../hooks/useSessionCache';

const SelectSucursal = ({ value, onChange, error, label = "Sucursal", required = false, fetchTrigger, onLoaded, ...rest }) => {
    const { value: sucursales, setValue: setSucursales } = useSessionCache({
        key: 'sucursalesListado',
        defaultValue: []
    });

    useEffect(() => {
        const fetchSucursales = async () => {
            try {
                const response = await sucursalesService.getByEmpresaId();
                if (response.success && response.data) {
                    setSucursales(response.data);
                    if (onLoaded) onLoaded(response.data);
                }
            } catch (err) {
                console.error("Error al obtener sucursales en SelectSucursal:", err);
            }
        };
        fetchSucursales();
    }, [setSucursales, fetchTrigger]);

    const options = sucursales.map(s => ({ value: String(s.id), label: s.name }));

    return (
        <InputSelect
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            error={error}
            required={required}
            {...rest}
        />
    );
};

export default SelectSucursal;
