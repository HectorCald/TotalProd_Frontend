import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import { getFullTimestamp } from '../../../../utils/dateUtils';
import InputFecha from '../../../../components/common/inputs/InputFecha';
import { useToast } from '../../../../context/ToastContext';
import deudasService from '../../../../services/deudasService';
import useFormatNumber from '../../../../hooks/useFormatNumber';

const AgregarPagoParcial = ({ isOpen, onClose, deuda, onPagoRegistrado }) => {
    const { formatPrice } = useFormatNumber();
    const { showSuccess, showDanger, showWarning } = useToast();
    const [loading, setLoading] = useState(false);
    const [pagoForm, setPagoForm] = useState({ fecha: '', monto: '', detalle: '' });
    const [fieldErrors, setFieldErrors] = useState({ fecha: false, monto: false });

    useEffect(() => {
        setFieldErrors({ fecha: false, monto: false });
        if (isOpen) {
            const hoy = new Date();
            const fechaHoy = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
            setPagoForm({ fecha: fechaHoy, monto: '', detalle: '' });
        }
    }, [isOpen]);

    const handleChange = (field, value) => {
        setPagoForm(prev => ({ ...prev, [field]: value }));
        if (field === 'fecha' || field === 'monto') {
            setFieldErrors(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSubmitPago = async () => {
        if (!pagoForm.fecha) {
            setFieldErrors(prev => ({ ...prev, fecha: true }));
            showWarning('Validación', 'La fecha es obligatoria');
            return;
        }

        const montoNum = parseFloat(String(pagoForm.monto).replace(',', '.'));
        if (pagoForm.monto === '' || pagoForm.monto == null || isNaN(montoNum) || montoNum <= 0) {
            setFieldErrors(prev => ({ ...prev, monto: true }));
            showWarning('Validación', 'El monto es obligatorio y debe ser mayor a 0');
            return;
        }

        if (deuda && montoNum > parseFloat(deuda.saldo_pendiente)) {
            showWarning('Validación', `El monto no puede superar el saldo pendiente (Bs. ${formatPrice(deuda.saldo_pendiente)})`);
            return;
        }

        setFieldErrors({ fecha: false, monto: false });
        setLoading(true);

        try {
            const response = await deudasService.createPagoParcial(deuda.id, {
                monto: montoNum,
                fecha: getFullTimestamp(pagoForm.fecha),
                detalle: pagoForm.detalle?.trim() || null
            });

            if (response.success) {
                showSuccess('Éxito', 'Pago parcial registrado exitosamente');
                if (onPagoRegistrado && response.data) {
                    onPagoRegistrado(response.data);
                }
                onClose();
            } else {
                showDanger('Error', response.message || 'Error al registrar el pago');
            }
        } catch (error) {
            console.error('Error registrando pago parcial:', error);
            showDanger('Error', 'Error de conexión al registrar el pago parcial');
        } finally {
            setLoading(false);
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
            title="Registrar Pago Parcial"
            confirmText="Registrar"
            onConfirm={handleSubmitPago}
            loading={loading}
            disableClose={loading}
        >
            <InputFecha
                label="Fecha del pago"
                value={pagoForm.fecha}
                onChange={(val) => handleChange('fecha', val)}
                required={true}
                readOnly={loading}
                error={fieldErrors.fecha}
                onClearError={() => setFieldErrors(prev => ({ ...prev, fecha: false }))}
            />

            <Input
                tipo="number"
                label="Monto del pago (Bs.)"
                value={pagoForm.monto}
                onChange={(e) => handleChange('monto', e.target.value)}
                step="0.01"
                min="0"
                required={true}
                readOnly={loading}
                error={fieldErrors.monto}
                onClearError={() => setFieldErrors(prev => ({ ...prev, monto: false }))}
            />

            <Input
                tipo="text"
                label="Detalle"
                value={pagoForm.detalle}
                onChange={(e) => handleChange('detalle', e.target.value)}
                readOnly={loading}
            />
        </ModalLateral>
    );
};

export default AgregarPagoParcial;
