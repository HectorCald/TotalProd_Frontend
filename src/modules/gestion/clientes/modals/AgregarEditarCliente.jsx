import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import InputCall from '../../../../components/common/inputs/InputCall';
import Boton from '../../../../components/common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import { useLayout } from '../../../../context/LayoutContext';
import clientService from '../../../../services/clientService';
import SeleccionarUbicacionModal from '../../../principal/ruta-comercial/modals/SeleccionarUbicacionModal';

const normalizeLocationValue = (loc) => {
    if (!loc) return '';
    if (typeof loc === 'object') {
        const lat = loc.x ?? loc.lat;
        const lng = loc.y ?? loc.lng;
        if (lat !== undefined && lng !== undefined) {
            return `(${lat},${lng})`;
        }
        return '';
    }
    return String(loc);
};

const AgregarEditarCliente = ({ isOpen, onClose, clienteSeleccionado, onGuardar }) => {
    const { isLargeScreen } = useLayout();
    const { showSuccess, showDanger, showWarning } = useToast();

    const [loading, setLoading] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ name: false });
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        description: '',
        total_orders: '',
        location: '',
        description_location: ''
    });

    // Limpiar o llenar campos cuando se abre/cierra el modal o cambia el cliente
    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ name: false });
            setIsMapModalOpen(false);
            if (clienteSeleccionado) {
                setFormData({
                    name: clienteSeleccionado.name || '',
                    phone: clienteSeleccionado.phone || '',
                    description: clienteSeleccionado.description || '',
                    total_orders: clienteSeleccionado.total_orders !== undefined ? clienteSeleccionado.total_orders : '',
                    location: normalizeLocationValue(clienteSeleccionado.location),
                    description_location: clienteSeleccionado.description_location || ''
                });
            } else {
                setFormData({
                    name: '',
                    phone: '',
                    description: '',
                    total_orders: '',
                    location: '',
                    description_location: ''
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
            location: formData.location || null,
            description_location: formData.description_location || null
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

    const ubicacionDisplayText =
        formData.description_location ||
        (formData.location ? 'Ubicación seleccionada en mapa' : '');

    return (
        <>
            <ModalLateral
                isOpen={isOpen}
                onClose={handleClose}
                title={clienteSeleccionado ? "Editar Cliente" : "Nuevo Cliente"}
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
                    tipo="number"
                    label="Total de pedidos"
                    value={formData.total_orders}
                    onChange={(e) => setFormData({ ...formData, total_orders: e.target.value })}
                    readOnly={loading}
                />
                <InputCall
                    label="Ubicación"
                    placeholder="Seleccionar ubicación en el mapa"
                    value={ubicacionDisplayText}
                    onClick={() => setIsMapModalOpen(true)}
                    onClear={() =>
                        setFormData((prev) => ({
                            ...prev,
                            location: '',
                            description_location: ''
                        }))
                    }
                    readOnly={loading}
                />
            </ModalLateral>

            <SeleccionarUbicacionModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                initialLocation={formData.location}
                initialDescription={formData.description_location}
                onSelectLocation={({ location, description_location }) => {
                    setFormData((prev) => ({
                        ...prev,
                        location,
                        description_location
                    }));
                }}
            />
        </>
    );
};

export default AgregarEditarCliente;