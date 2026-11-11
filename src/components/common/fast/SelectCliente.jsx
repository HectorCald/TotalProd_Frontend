import React, { useEffect, useState } from 'react';
import InputSelectBox from '../inputs/InputSelectBox';
import clientService from '../../../services/clientService';
import useSessionCache from '../../../hooks/useSessionCache';
import AgregarEditarCliente from '../../../modules/gestion/clientes/modals/AgregarEditarCliente';

const SelectCliente = ({ value, onChange, error, label = "Cliente", required = false, fetchTrigger, disabled, ...rest }) => {
    const { value: clientes, setValue: setClientes } = useSessionCache({
        key: 'clientesActivosListado',
        defaultValue: []
    });

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const response = await clientService.getAll(true);
                if (response.success && response.data) {
                    setClientes(response.data);
                }
            } catch (err) {
                console.error("Error al obtener clientes en SelectCliente:", err);
            }
        };
        fetchClientes();
    }, [setClientes, fetchTrigger]);

    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    const options = (clientes || [])
        .filter(c => c.is_active !== false)
        .map(c => ({ value: String(c.id), label: c.name }));

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
                <AgregarEditarCliente
                    isOpen={isAgregarOpen}
                    onClose={() => setIsAgregarOpen(false)}
                    clienteSeleccionado={null}
                    onGuardar={(nuevoCliente) => {
                        const clienteConEstado = { is_active: true, ...nuevoCliente };
                        if (clienteConEstado.is_active !== false) {
                            setClientes(prev => [...(prev || []), clienteConEstado]);
                        }
                        if (onChange) onChange(String(clienteConEstado.id));
                        setIsAgregarOpen(false);
                    }}
                />
            )}
        </>
    );
};

export default SelectCliente;
