import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import Boton from '../../../../components/common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import { useLayout } from '../../../../context/LayoutContext';
import proveedorService from '../../../../services/proveedorService';

const AgregarEditarProveedor = ({ isOpen, onClose, proveedorSeleccionado, onGuardar }) => {
    const { isLargeScreen } = useLayout();
    const { showSuccess, showDanger, showWarning } = useToast();

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

    const handleSeleccionarContacto = async () => {
        if (!('contacts' in navigator && 'ContactsManager' in window)) {
            showWarning(null, 'Tu dispositivo o navegador no soporta la selección de contactos');
            return;
        }

        try {
            let props = ['name', 'tel'];
            if (typeof navigator.contacts.getProperties === 'function') {
                const supportedProps = await navigator.contacts.getProperties();
                props = props.filter((prop) => supportedProps.includes(prop));
            }

            if (props.length === 0) {
                props = ['name', 'tel'];
            }

            const contacts = await navigator.contacts.select(props, { multiple: false });

            if (contacts && contacts.length > 0) {
                const contact = contacts[0];

                let rawName = '';
                if (Array.isArray(contact.name) && contact.name.length > 0) {
                    rawName = contact.name[0];
                } else if (typeof contact.name === 'string') {
                    rawName = contact.name;
                }

                let rawPhone = '';
                if (Array.isArray(contact.tel) && contact.tel.length > 0) {
                    rawPhone = contact.tel[0];
                } else if (typeof contact.tel === 'string') {
                    rawPhone = contact.tel;
                }

                const name = rawName.trim();
                const phone = rawPhone.replace(/[^0-9+]/g, '');

                setFormData((prev) => ({
                    ...prev,
                    ...(name ? { name } : {}),
                    ...(phone ? { phone } : {})
                }));

                if (name) {
                    setFieldErrors((prev) => ({ ...prev, name: false }));
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error al seleccionar contacto:', error);
                showDanger(null, 'No se pudo acceder a los contactos');
            }
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
            {!isLargeScreen && (
                <Boton
                    label="Seleccionar de contactos"
                    className="btn-primary"
                    iconName="user-plus"
                    onClick={handleSeleccionarContacto}
                    disabled={loading}
                    style={{ marginBottom: '15px' }}
                />
            )}
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