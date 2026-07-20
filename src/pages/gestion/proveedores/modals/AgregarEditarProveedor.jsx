import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import { useToast } from '../../../../context/ToastContext';
import proveedorService from '../../../../services/proveedorService';

const AgregarEditarProveedor = ({ isOpen, onClose, proveedorSeleccionado, onGuardar }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ name: false });
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        description: '',
        location: ''
    });

    // Limpiar o llenar campos cuando se abre/cierra el modal o cambia el proveedor
    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ name: false });
            if (proveedorSeleccionado) {
                setFormData({
                    name: proveedorSeleccionado.name || '',
                    phone: proveedorSeleccionado.phone || '',
                    description: proveedorSeleccionado.description || '',
                    location: proveedorSeleccionado.location || ''
                });
            } else {
                setFormData({
                    name: '',
                    phone: '',
                    description: '',
                    location: ''
                });
            }
        }
    }, [isOpen, proveedorSeleccionado]);

    const handleConfirm = async () => {
        if (!formData.name.trim()) {
            setFieldErrors((prev) => ({ ...prev, name: true }));
            return;
        }

        setFieldErrors({ name: false });

        const datosParaEnviar = {
            name: formData.name,
            phone: formData.phone,
            description: formData.description,
            location: formData.location || null
        };

        setLoading(true);
        try {
            let response;
            const tipo = proveedorSeleccionado ? 'editar' : 'agregar';

            if (tipo === 'editar') {
                response = await proveedorService.update(proveedorSeleccionado.id, datosParaEnviar);
            } else {
                response = await proveedorService.create(datosParaEnviar);
            }

            if (response.success) {
                if (onGuardar) {
                    onGuardar(response.data || datosParaEnviar);
                }
                setLoading(false);
                onClose();
                showSuccess(null, response.message);
            } else {
                setLoading(false);
                showDanger(null, response.message, 5000, false);
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
            title={proveedorSeleccionado ? "Editar Proveedor" : "Nuevo Proveedor"}
            confirmText="Guardar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
            <Input
                tipo="text"
                required={true}
                label="Nombre completo"
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
                tipo="tel"
                label="Celular"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                readOnly={loading}
            />
            <Input
                tipo="text"
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                readOnly={loading}
            />
            <Input
                tipo="text"
                label="Ubicación"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                readOnly={loading}
            />
        </ModalLateral>
    );
};

export default AgregarEditarProveedor;
