import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import { useToast } from '../../../../context/ToastContext';
import clientService from '../../../../services/clientService';

const AgregarEditarCliente = ({ isOpen, onClose, clienteSeleccionado, onGuardar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ name: false });
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        description: '',
        total_orders: '',
        location: ''
    });

    // Limpiar o llenar campos cuando se abre/cierra el modal o cambia el cliente
    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ name: false });
            if (clienteSeleccionado) {
                setFormData({
                    name: clienteSeleccionado.name || '',
                    phone: clienteSeleccionado.phone || '',
                    description: clienteSeleccionado.description || '',
                    total_orders: clienteSeleccionado.total_orders !== undefined ? clienteSeleccionado.total_orders : '',
                    location: clienteSeleccionado.location || ''
                });
            } else {
                setFormData({
                    name: '',
                    phone: '',
                    description: '',
                    total_orders: '',
                    location: ''
                });
            }
        }
    }, [isOpen, clienteSeleccionado]);

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
            total_orders: formData.total_orders === '' ? 0 : parseInt(formData.total_orders, 10),
            location: formData.location || null
        };

        setLoading(true);
        try {
            let response;
            const tipo = clienteSeleccionado ? 'editar' : 'agregar';

            if (tipo === 'editar') {
                response = await clientService.update(clienteSeleccionado.id, datosParaEnviar);
            } else {
                response = await clientService.create(datosParaEnviar);
            }

            if (response.success) {
                if (onGuardar) {
                    onGuardar(response.data || datosParaEnviar);
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message);
            } else {
                setLoading(false);
                showDanger('Operación fallida', response.message, 5000, false);
            }
        } catch (error) {
            setLoading(false);
            showDanger('Error de conexión', error.message || 'Error de conexión con el servidor', 5000, false);
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
            title={clienteSeleccionado ? "Editar Cliente" : "Nuevo Cliente"}
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
                tipo="number"
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
                tipo="number"
                label="Total de pedidos"
                value={formData.total_orders}
                onChange={(e) => setFormData({ ...formData, total_orders: e.target.value })}
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

export default AgregarEditarCliente;