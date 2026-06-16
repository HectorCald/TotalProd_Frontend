import React, { useEffect } from 'react';
import InputSelectBox from '../inputs/InputSelectBox';
import InputSelectMultiple from '../inputs/InputSelectMultiple';
import categoryAcopioService from '../../../services/categoryAcopioService';
import useSessionCache from '../../../hooks/useSessionCache';

const SelectCategoriasAcopio = ({ value, onChange, error, label = "Categoría", required = false, fetchTrigger, multiple = false, disabled = false, ...rest }) => {
    const { value: categorias, setValue: setCategorias } = useSessionCache({
        key: 'categoriasAcopioListado',
        defaultValue: []
    });

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const response = await categoryAcopioService.getAll();
                if (response.success && response.data) {
                    setCategorias(response.data);
                }
            } catch (err) {
                console.error("Error al obtener categorías de acopio:", err);
            }
        };
        fetchCategorias();
    }, [setCategorias, fetchTrigger]);

    const options = categorias.map(c => ({ value: String(c.id), label: c.name }));

    if (multiple) {
        return (
            <InputSelectMultiple
                label={label}
                value={value}
                onChange={onChange}
                options={options}
                error={error}
                required={required}
                disabled={disabled}
                {...rest}
            />
        );
    }

    return (
        <InputSelectBox
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            error={error}
            required={required}
            disabled={disabled}
            {...rest}
        />
    );
};

export default SelectCategoriasAcopio;
