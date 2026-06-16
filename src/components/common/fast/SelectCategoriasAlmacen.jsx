import React, { useEffect } from 'react';
import InputSelectBox from '../inputs/InputSelectBox';
import InputSelectMultiple from '../inputs/InputSelectMultiple';
import categoryAlmacenService from '../../../services/categoryAlmacenService';
import useSessionCache from '../../../hooks/useSessionCache';

const SelectCategoriasAlmacen = ({ value, onChange, error, label = "Categorías", required = false, fetchTrigger, multiple = true, disabled = false, ...rest }) => {
    const { value: categorias, setValue: setCategorias } = useSessionCache({
        key: 'categoriasAlmacenListado',
        defaultValue: []
    });

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const response = await categoryAlmacenService.getAll();
                if (response.success && response.data) {
                    setCategorias(response.data);
                }
            } catch (err) {
                console.error("Error al obtener categorías de almacén:", err);
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

export default SelectCategoriasAlmacen;
