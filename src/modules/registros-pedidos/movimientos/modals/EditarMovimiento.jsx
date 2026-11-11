import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import SelectMetodoPago from '../../../../components/common/fast/SelectMetodoPago';
import SelectCliente from '../../../../components/common/fast/SelectCliente';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';

const normalizeMetodoPago = (val) => {
    if (!val) return '';
    return String(val)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

const EditarMovimiento = ({ isOpen, onClose, movimientoSeleccionado, onGuardar }) => {
    const { showSuccess, showDanger } = useToast();

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

    const handleConfirm = async () => {
        if (!movimientoSeleccionado?.id) {
            showDanger(null, 'ID del movimiento no válido');
            return;
        }

        if (!formData.metodo_pago) {
            setFieldErrors({ metodo_pago: true });
            return;
        }

        setLoading(true);
        try {
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

