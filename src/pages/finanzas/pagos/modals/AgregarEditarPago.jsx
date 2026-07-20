import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import InputFecha from '../../../../components/common/inputs/InputFecha';
import SelectMetodoPago from '../../../../components/common/fast/SelectMetodoPago';
import SelectProveedores from '../../../../components/common/fast/SelectProveedores';
import { useToast } from '../../../../context/ToastContext';
import gastosService from '../../../../services/gastosService';

const AgregarEditarPago = ({ isOpen, onClose, pagoSeleccionado, onGuardar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ fecha_gasto: false, valor: false, concepto: false, metodo_pago: false });

    const obtenerFechaActual = () => {
        const hoy = new Date();
        return hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    };

    const [formData, setFormData] = useState({
        fecha_gasto: obtenerFechaActual(),
        valor: '',
        concepto: '',
        metodo_pago: 'efectivo',
        proveedor_id: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ fecha_gasto: false, valor: false, concepto: false, metodo_pago: false });
            
            if (pagoSeleccionado) {
                setFormData({
                    fecha_gasto: pagoSeleccionado.fecha_gasto || obtenerFechaActual(),
                    valor: pagoSeleccionado.valor?.toString() || '',
                    concepto: pagoSeleccionado.concepto || '',
                    metodo_pago: pagoSeleccionado.metodo_pago || 'efectivo',
                    proveedor_id: pagoSeleccionado.proveedor_id || ''
                });
            } else {
                setFormData({
                    fecha_gasto: obtenerFechaActual(),
                    valor: '',
                    concepto: '',
                    metodo_pago: 'efectivo',
                    proveedor_id: ''
                });
            }
        }
    }, [isOpen, pagoSeleccionado]);

    const handleConfirm = async () => {
        let hasErrors = false;
        const newFieldErrors = { fecha_gasto: false, valor: false, concepto: false, metodo_pago: false };

        if (!formData.fecha_gasto) {
            newFieldErrors.fecha_gasto = true;
            hasErrors = true;
        }

        const valorNum = parseFloat(String(formData.valor).replace(',', '.'));
        if (formData.valor === '' || formData.valor == null || isNaN(valorNum) || valorNum <= 0) {
            newFieldErrors.valor = true;
            hasErrors = true;
        }

        if (!formData.concepto.trim()) {
            newFieldErrors.concepto = true;
            hasErrors = true;
        }

        if (!formData.metodo_pago) {
            newFieldErrors.metodo_pago = true;
            hasErrors = true;
        }

        if (hasErrors) {
            setFieldErrors(newFieldErrors);
            return;
        }

        setLoading(true);
        try {
            const pagoData = {
                fecha_gasto: formData.fecha_gasto,
                valor: parseFloat(formData.valor),
                concepto: formData.concepto.trim(),
                metodo_pago: formData.metodo_pago,
                proveedor_id: formData.proveedor_id || null
            };

            let response;
            if (pagoSeleccionado) {
                response = await gastosService.update(pagoSeleccionado.id, pagoData);
            } else {
                response = await gastosService.create(pagoData);
            }

            if (response.success) {
                if (onGuardar) {
                    const savedData = response.data || pagoData;
                    if (!savedData.id && response.id) savedData.id = response.id;
                    onGuardar(savedData);
                }
                setLoading(false);
                onClose();
                showSuccess(null, pagoSeleccionado ? 'Pago actualizado exitosamente' : 'Pago creado exitosamente');
            } else {
                setLoading(false);
                showDanger(null, response.message);
            }
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Revisa tu conexión a internet');
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
                title={pagoSeleccionado ? "Editar Pago" : "Nuevo Pago"}
                confirmText="Guardar"
                onConfirm={handleConfirm}
                loading={loading}
                disableClose={loading}
            >
                <InputFecha
                    label="Fecha del pago"
                    value={formData.fecha_gasto}
                    onChange={(val) => {
                        setFormData({ ...formData, fecha_gasto: val });
                        setFieldErrors(prev => ({ ...prev, fecha_gasto: false }));
                    }}
                    required={true}
                    readOnly={loading}
                    error={fieldErrors.fecha_gasto}
                    onClearError={() => setFieldErrors(prev => ({ ...prev, fecha_gasto: false }))}
                />

                <Input
                    tipo="number"
                    label="Valor (Bs.)"
                    value={formData.valor}
                    onChange={(e) => {
                        setFormData({ ...formData, valor: e.target.value });
                        setFieldErrors(prev => ({ ...prev, valor: false }));
                    }}
                    step="0.01"
                    min="0"
                    required={true}
                    readOnly={loading}
                    error={fieldErrors.valor}
                    onClearError={() => setFieldErrors(prev => ({ ...prev, valor: false }))}
                />

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

                <SelectMetodoPago
                    required={true}
                    value={formData.metodo_pago}
                    onChange={(val) => {
                        setFormData({ ...formData, metodo_pago: val });
                        setFieldErrors(prev => ({ ...prev, metodo_pago: false }));
                    }}
                    disabled={loading}
                    error={fieldErrors.metodo_pago}
                    onClearError={() => setFieldErrors(prev => ({ ...prev, metodo_pago: false }))}
                />

                <SelectProveedores
                    value={String(formData.proveedor_id || '')}
                    onChange={(val) => setFormData({ ...formData, proveedor_id: val })}
                    disabled={loading}
                    fetchTrigger={isOpen}
                />
            </ModalLateral>
    );
};

export default AgregarEditarPago;