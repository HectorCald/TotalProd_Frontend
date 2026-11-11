import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import SelectMetodoPago from '../../../../components/common/fast/SelectMetodoPago';
import SelectCliente from '../../../../components/common/fast/SelectCliente';
import useSessionCache from '../../../../hooks/useSessionCache';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import clientService from '../../../../services/clientService';
import { reverseGeocodeBolivia } from '../../../principal/ruta-comercial/modals/SeleccionarUbicacionModal';

const normalizeMetodoPago = (val) => {
    if (!val) return '';
    return String(val)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

const parseUbicacionCoords = (loc) => {
    if (!loc) return null;
    if (typeof loc === 'object') {
        const lat = Number(loc.x ?? loc.lat);
        const lng = Number(loc.y ?? loc.lng);
        if (
            (loc.x !== undefined || loc.lat !== undefined) &&
            (loc.y !== undefined || loc.lng !== undefined) &&
            !Number.isNaN(lat) &&
            !Number.isNaN(lng) &&
            (lat !== 0 || lng !== 0)
        ) {
            return {
                lat: Number(lat.toFixed(6)),
                lng: Number(lng.toFixed(6))
            };
        }
        return null;
    }
    const str = String(loc).trim();
    if (!str || str === 'null' || str === 'undefined') return null;
    const clean = str.replace(/[()]/g, '');
    const parts = clean.split(',').map((p) => Number(p.trim()));
    if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1]) && (parts[0] !== 0 || parts[1] !== 0)) {
        return {
            lat: Number(parts[0].toFixed(6)),
            lng: Number(parts[1].toFixed(6))
        };
    }
    return null;
};

const hasClientLocation = (loc) => parseUbicacionCoords(loc) !== null;

const hasDescriptionLocation = (desc) => {
    if (!desc) return false;
    const clean = String(desc).trim();
    return clean !== '' && clean !== 'null' && clean !== 'undefined';
};

const EditarMovimiento = ({ isOpen, onClose, movimientoSeleccionado, onGuardar }) => {
    const { showSuccess, showDanger } = useToast();

    const { value: clientesListado, setValue: setClientesListado } = useSessionCache({
        key: 'clientesActivosListado',
        defaultValue: []
    });

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ metodo_pago: false });
    const [formData, setFormData] = useState({
        metodo_pago: '',
        cliente_id: '',
        concepto: ''
    });

    useEffect(() => {
        if (isOpen && movimientoSeleccionado) {
            setFieldErrors({ metodo_pago: false });
            const clienteActual =
                movimientoSeleccionado.cliente_id ||
                movimientoSeleccionado.clients_id ||
                movimientoSeleccionado.cliente?.id ||
                '';

            setFormData({
                metodo_pago: normalizeMetodoPago(movimientoSeleccionado.metodo_pago),
                cliente_id: clienteActual ? String(clienteActual) : '',
                concepto: movimientoSeleccionado.concepto || ''
            });
        }
    }, [isOpen, movimientoSeleccionado]);

    // Si el cliente asignado/cambiado no tiene location ni description_location, asignarle la ubicación del movimiento actual
    const ensureClientLocationFromMovement = async (clienteId) => {
        if (!clienteId) return { ok: true };

        try {
            let targetClient = (clientesListado || []).find((c) => String(c.id) === String(clienteId));

            if (targetClient && (hasClientLocation(targetClient.location) || hasDescriptionLocation(targetClient.description_location))) {
                return { ok: true };
            }

            try {
                const resClient = await clientService.getById(clienteId);
                if (resClient?.success && resClient.data) {
                    targetClient = resClient.data;
                }
            } catch (_) {
                // Continuar con targetClient obtenido de caché si existe
            }

            if (!targetClient) {
                return {
                    ok: false,
                    message: 'No se pudo verificar la ubicación del cliente seleccionado.'
                };
            }

            if (hasClientLocation(targetClient.location) || hasDescriptionLocation(targetClient.description_location)) {
                return { ok: true };
            }

            const movCoords = parseUbicacionCoords(movimientoSeleccionado?.ubicacion);
            if (!movCoords) {
                return { ok: true };
            }

            const locationPoint = `(${movCoords.lat},${movCoords.lng})`;

            let descriptionLocation = null;
            try {
                descriptionLocation = await reverseGeocodeBolivia(movCoords.lat, movCoords.lng);
            } catch (_) {
                descriptionLocation = 'Ubicación registrada, Bolivia, Bolivia';
            }

            const updateRes = await clientService.updateLocation(
                clienteId,
                locationPoint,
                descriptionLocation
            );

            if (!updateRes?.success) {
                return {
                    ok: false,
                    message: 'No se pudo registrar la ubicación del cliente seleccionado.'
                };
            }

            setClientesListado((prev) =>
                (prev || []).map((c) =>
                    String(c.id) === String(clienteId)
                        ? {
                            ...c,
                            location: updateRes.data?.location ?? locationPoint,
                            description_location: updateRes.data?.description_location ?? descriptionLocation
                        }
                        : c
                )
            );

            return { ok: true };
        } catch (_) {
            return {
                ok: false,
                message: 'No se pudo registrar la ubicación del cliente seleccionado.'
            };
        }
    };

    const handleConfirm = async () => {
        if (!movimientoSeleccionado?.id) {
            showDanger(null, 'ID del movimiento no válido');
            return;
        }

        if (!formData.metodo_pago) {
            setFieldErrors({ metodo_pago: true });
            return;
        }

        const originalClienteId =
            movimientoSeleccionado.cliente_id ||
            movimientoSeleccionado.clients_id ||
            movimientoSeleccionado.cliente?.id ||
            '';
        const isClienteAssignedOrChanged =
            Boolean(formData.cliente_id) &&
            String(formData.cliente_id) !== String(originalClienteId || '');

        setLoading(true);
        try {
            if (isClienteAssignedOrChanged) {
                const locCheck = await ensureClientLocationFromMovement(formData.cliente_id);
                if (!locCheck.ok) {
                    setLoading(false);
                    showDanger('Error de ubicación', locCheck.message, 5000, false);
                    return;
                }
            }

            const updateData = {
                metodo_pago: String(formData.metodo_pago).trim().toUpperCase(),
                cliente_id: formData.cliente_id ? String(formData.cliente_id).trim() : null,
                concepto: formData.concepto && formData.concepto.trim() !== '' ? formData.concepto.trim() : null
            };

            const response = await movimientosAlmacenService.update(movimientoSeleccionado.id, updateData);

            if (response.success) {
                if (onGuardar) {
                    onGuardar(response.data || updateData);
                }
                setLoading(false);
                onClose();
                showSuccess(null, 'Movimiento actualizado exitosamente');
            } else {
                setLoading(false);
                showDanger(null, response.message || 'No se pudo actualizar el movimiento');
            }
        } catch (error) {
            setLoading(false);
            if (error?.status === 403) {
                showDanger(null, error.message || 'No tienes permisos para actualizar movimientos');
            } else {
                showDanger(null, error?.message || 'Revisa tu conexión a internet');
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
            title="Editar movimiento"
            confirmText="Actualizar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
            <SelectMetodoPago
                value={formData.metodo_pago}
                onChange={(val) => {
                    setFormData(prev => ({ ...prev, metodo_pago: val || '' }));
                    setFieldErrors(prev => ({ ...prev, metodo_pago: false }));
                }}
                disabled={loading}
                required={true}
                error={fieldErrors.metodo_pago}
                onClearError={() => setFieldErrors(prev => ({ ...prev, metodo_pago: false }))}
            />

            <SelectCliente
                value={formData.cliente_id}
                onChange={(val) => setFormData(prev => ({ ...prev, cliente_id: val || '' }))}
                disabled={loading}
                required={false}
                fetchTrigger={isOpen}
            />

            <Input
                tipo="text"
                label="Concepto"
                value={formData.concepto}
                onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
                readOnly={loading}
                required={false}
            />
        </ModalLateral>
    );
};

export default EditarMovimiento;

