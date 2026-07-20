import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import { useToast } from '../../../../context/ToastContext';
import pricesTypesService from '../../../../services/pricesTypesService';

const AgregarEditarPrecio = ({ isOpen, onClose, precioSeleccionado, onGuardar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ name: false });
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    // Limpiar o llenar campos cuando se abre/cierra el modal o cambia el precio
    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ name: false });
            if (precioSeleccionado) {
                setFormData({
                    name: precioSeleccionado.name || precioSeleccionado.nombre || '',
                    description: precioSeleccionado.description || precioSeleccionado.descripcion || ''
                });
            } else {
                setFormData({
                    name: '',
                    description: ''
                });
            }
        }
    }, [isOpen, precioSeleccionado]);

    const handleConfirm = async () => {
        if (!formData.name.trim()) {
            setFieldErrors((prev) => ({ ...prev, name: true }));
            return;
        }

        setFieldErrors({ name: false });

        const datosParaEnviar = {
            name: formData.name.trim(),
            description: formData.description.trim() || null
        };

        setLoading(true);
        try {
            let response;
            const tipo = precioSeleccionado ? 'editar' : 'agregar';

            if (tipo === 'editar') {
                response = await pricesTypesService.update(precioSeleccionado.id, datosParaEnviar);
            } else {
                response = await pricesTypesService.create(datosParaEnviar);
            }

            if (response.success) {
                if (onGuardar) {
                    onGuardar(response.data);
                }

                setLoading(false);
                onClose();
                showSuccess(null, response.message || `Tipo de precio ${tipo === 'editar' ? 'actualizado' : 'creado'} correctamente`);
            } else {
                setLoading(false);
                showDanger(null, response.message || `Error al ${tipo} el tipo de precio`, 5000, false);
            }
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Revisa tu conexión a internet', 5000, false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    return (
        <ModalLateral
            isOpen={isOpen}
            onClose={handleClose}
            title={precioSeleccionado ? "Editar Tipo de Precio" : "Nuevo Tipo de Precio"}
            confirmText="Guardar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
            <Input
                tipo="text"
                required={true}
                label="Tipo de precio"
                value={formData.name}
                onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, name: false }));
                }}
                readOnly={loading}
                error={fieldErrors.name}
                onClearError={() => setFieldErrors((prev) => ({ ...prev, name: false }))}
            />
            <Input
                tipo="text"
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                readOnly={loading}
            />
        </ModalLateral>
    );
};

export default AgregarEditarPrecio;
