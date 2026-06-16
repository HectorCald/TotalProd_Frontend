import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import InputFecha from '../../../../components/common/inputs/InputFecha';
import SelectCliente from '../../../../components/common/fast/SelectCliente';
import { useToast } from '../../../../context/ToastContext';
import deudasService from '../../../../services/deudasService';

const AgregarEditarDeuda = ({ isOpen, onClose, deudaSeleccionada, onGuardar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ fecha_deuda: false, fecha_vencimiento: false, monto_total: false, concepto: false });

    const [formData, setFormData] = useState({
        fecha_deuda: '',
        fecha_vencimiento: '',
        monto_total: '',
        saldo_pendiente: '',
        concepto: '',
        estado: 'pendiente',
        cliente_id: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ fecha_deuda: false, fecha_vencimiento: false, monto_total: false, concepto: false });
            
            if (deudaSeleccionada) {
                setFormData({
                    fecha_deuda: deudaSeleccionada.fecha_deuda || '',
                    fecha_vencimiento: deudaSeleccionada.fecha_vencimiento || '',
                    monto_total: deudaSeleccionada.monto_total?.toString() || '',
                    saldo_pendiente: deudaSeleccionada.saldo_pendiente?.toString() || '',
                    concepto: deudaSeleccionada.concepto || '',
                    estado: deudaSeleccionada.estado || 'pendiente',
                    cliente_id: deudaSeleccionada.cliente_id || ''
                });
            } else {
                const hoy = new Date();
                const fechaHoy = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
                
                const fechaVencimiento = new Date(hoy);
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
                const fechaVencimientoStr = fechaVencimiento.getFullYear() + '-' + String(fechaVencimiento.getMonth() + 1).padStart(2, '0') + '-' + String(fechaVencimiento.getDate()).padStart(2, '0');
                
                setFormData({
                    fecha_deuda: fechaHoy,
                    fecha_vencimiento: fechaVencimientoStr,
                    monto_total: '',
                    saldo_pendiente: '',
                    concepto: '',
                    estado: 'pendiente',
                    cliente_id: ''
                });
            }
        }
    }, [isOpen, deudaSeleccionada]);

    const handleConfirm = async () => {
        let hasErrors = false;
        const newFieldErrors = { fecha_deuda: false, fecha_vencimiento: false, monto_total: false, concepto: false };

        const soloVencimiento = deudaSeleccionada && deudaSeleccionada.movimiento_salida_id;

        if (!soloVencimiento && !formData.fecha_deuda) {
            newFieldErrors.fecha_deuda = true;
            hasErrors = true;
        }

        if (!formData.fecha_vencimiento) {
            newFieldErrors.fecha_vencimiento = true;
            hasErrors = true;
        }

        const montoNum = parseFloat(String(formData.monto_total).replace(',', '.'));
        if (!soloVencimiento && (formData.monto_total === '' || formData.monto_total == null || isNaN(montoNum) || montoNum <= 0)) {
            newFieldErrors.monto_total = true;
            hasErrors = true;
        }

        if (!formData.concepto.trim()) {
            newFieldErrors.concepto = true;
            hasErrors = true;
        }

        if (!soloVencimiento && formData.fecha_vencimiento && formData.fecha_deuda) {
            if (new Date(formData.fecha_vencimiento) <= new Date(formData.fecha_deuda)) {
                newFieldErrors.fecha_vencimiento = true;
                newFieldErrors.fecha_deuda = true;
                hasErrors = true;
                showWarning('Validación', 'La fecha de vencimiento debe ser posterior a la fecha de deuda');
            }
        }

        if (hasErrors) {
            setFieldErrors(newFieldErrors);
            return;
        }

        setLoading(true);
        try {
            const deudaData = deudaSeleccionada ? (
                soloVencimiento ? {
                    fecha_vencimiento: formData.fecha_vencimiento,
                    concepto: formData.concepto.trim()
                } : {
                    fecha_deuda: formData.fecha_deuda,
                    fecha_vencimiento: formData.fecha_vencimiento,
                    monto_total: parseFloat(formData.monto_total),
                    saldo_pendiente: formData.saldo_pendiente !== '' ? parseFloat(formData.saldo_pendiente) : parseFloat(formData.monto_total),
                    concepto: formData.concepto.trim(),
                    estado: formData.estado,
                    cliente_id: formData.cliente_id || null
                }
            ) : {
                fecha_deuda: formData.fecha_deuda,
                fecha_vencimiento: formData.fecha_vencimiento,
                monto_total: parseFloat(formData.monto_total),
                saldo_pendiente: formData.saldo_pendiente ? parseFloat(formData.saldo_pendiente) : parseFloat(formData.monto_total),
                concepto: formData.concepto.trim(),
                estado: formData.estado,
                cliente_id: formData.cliente_id || null
            };

            let response;
            if (deudaSeleccionada) {
                response = await deudasService.update(deudaSeleccionada.id, deudaData);
            } else {
                response = await deudasService.create(deudaData);
            }

            if (response.success) {
                if (onGuardar) {
                    const savedData = response.data || deudaData;
                    if (!savedData.id && response.id) savedData.id = response.id;
                    onGuardar(savedData);
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', deudaSeleccionada ? 'Deuda actualizada exitosamente' : 'Deuda creada exitosamente');
            } else {
                setLoading(false);
                showDanger('Operación fallida', response.message);
            }
        } catch (error) {
            setLoading(false);
            showDanger('Error de conexión', error.message || 'Error de conexión con el servidor');
        }
    };

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    const esEdicionLimitada = deudaSeleccionada && deudaSeleccionada.movimiento_salida_id;

    return (
        <ModalLateral
            isOpen={isOpen}
            onClose={handleClose}
            title={deudaSeleccionada ? "Editar Deuda" : "Nueva Deuda"}
            confirmText="Guardar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
            {!esEdicionLimitada && (
                <InputFecha
                    label="Fecha de deuda"
                    value={formData.fecha_deuda}
                    onChange={(val) => {
                        setFormData({ ...formData, fecha_deuda: val });
                        setFieldErrors(prev => ({ ...prev, fecha_deuda: false }));
                    }}
                    required={true}
                    readOnly={loading}
                    error={fieldErrors.fecha_deuda}
                    onClearError={() => setFieldErrors(prev => ({ ...prev, fecha_deuda: false }))}
                />
            )}

            <InputFecha
                label="Fecha de vencimiento"
                value={formData.fecha_vencimiento}
                onChange={(val) => {
                    setFormData({ ...formData, fecha_vencimiento: val });
                    setFieldErrors(prev => ({ ...prev, fecha_vencimiento: false }));
                }}
                required={true}
                readOnly={loading}
                error={fieldErrors.fecha_vencimiento}
                onClearError={() => setFieldErrors(prev => ({ ...prev, fecha_vencimiento: false }))}
            />

            {!esEdicionLimitada && (
                <Input
                    tipo="number"
                    label="Monto total (Bs.)"
                    value={formData.monto_total}
                    onChange={(e) => {
                        setFormData({ ...formData, monto_total: e.target.value, saldo_pendiente: e.target.value });
                        setFieldErrors(prev => ({ ...prev, monto_total: false }));
                    }}
                    step="0.01"
                    min="1"
                    required={true}
                    readOnly={loading}
                    error={fieldErrors.monto_total}
                    onClearError={() => setFieldErrors(prev => ({ ...prev, monto_total: false }))}
                />
            )}

            <Input
                tipo="text"
                label="Concepto"
                value={formData.concepto}
                onChange={(e) => {
                    setFormData({ ...formData, concepto: e.target.value });
                    setFieldErrors(prev => ({ ...prev, concepto: false }));
                }}
                required={true}
                readOnly={loading}
                error={fieldErrors.concepto}
                onClearError={() => setFieldErrors(prev => ({ ...prev, concepto: false }))}
            />

            {!esEdicionLimitada && (
                <SelectCliente
                    value={String(formData.cliente_id || '')}
                    onChange={(val) => setFormData({ ...formData, cliente_id: val })}
                    disabled={loading}
                    fetchTrigger={isOpen}
                />
            )}
        </ModalLateral>
    );
};

export default AgregarEditarDeuda;