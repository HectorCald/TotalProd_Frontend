import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../../components/common/modals/ModalLateral';
import Input from '../../../../../components/common/inputs/Input';
import InputSelect from '../../../../../components/common/inputs/InputSelect';
import SelectProveedores from '../../../../../components/common/fast/SelectProveedores';
import SelectMetodoPago from '../../../../../components/common/fast/SelectMetodoPago';
import { useToast } from '../../../../../context/ToastContext';
import pedidosAcopioService from '../../../../../services/pedidosAcopioService';

const EntregarPedidoAcopio = ({ isOpen, onClose, pedido, onEntregado }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        peso: '',
        medida_peso: 'Kilogramo',
        piezas: '',
        medida_piezas: 'Caja',
        proveedor_id: '',
        costo: '',
        transporte: '',
        metodo_pago: '',
        estado_llegada: 'Llego',
        observaciones: ''
    });

    const [fieldErrors, setFieldErrors] = useState({
        peso: false,
        piezas: false,
        costo: false,
        metodo_pago: false,
        estado_llegada: false
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                peso: '',
                medida_peso: 'Kilogramo',
                piezas: '',
                medida_piezas: 'Caja',
                proveedor_id: '',
                costo: '',
                transporte: '',
                metodo_pago: '',
                estado_llegada: 'Llego',
                observaciones: ''
            });
            setFieldErrors({
                peso: false,
                piezas: false,
                costo: false,
                metodo_pago: false,
                estado_llegada: false
            });
        }
    }, [isOpen]);



    const opcionesMedida = [
        { value: 'Kilogramo', label: 'Kilogramo' },
        { value: 'Litro', label: 'Litro' },
        { value: 'Unidad', label: 'Unidad' },
        { value: 'Metro', label: 'Metro' }
    ];

    const opcionesPiezas = [
        { value: 'Caja', label: 'Caja' },
        { value: 'Bolsa', label: 'Bolsa' },
        { value: 'Saco', label: 'Saco' },
        { value: 'Pieza', label: 'Pieza' }
    ];

    const opcionesEstado = [
        { value: 'Llego', label: 'Llego' },
        { value: 'No llego', label: 'No llego' }
    ];

    const handleConfirm = async () => {
        const newErrors = {
            peso: false,
            piezas: false,
            costo: false,
            metodo_pago: false,
            estado_llegada: false
        };
        let hasErrors = false;

        if (!formData.peso || parseFloat(formData.peso) <= 0) {
            newErrors.peso = true;
            hasErrors = true;
        }
        if (!formData.piezas || parseFloat(formData.piezas) <= 0) {
            newErrors.piezas = true;
            hasErrors = true;
        }
        if (!formData.costo || parseFloat(formData.costo) <= 0) {
            newErrors.costo = true;
            hasErrors = true;
        }
        if (!formData.metodo_pago) {
            newErrors.metodo_pago = true;
            hasErrors = true;
        }
        if (!formData.estado_llegada) {
            newErrors.estado_llegada = true;
            hasErrors = true;
        }

        if (hasErrors) {
            setFieldErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const transporteVal = parseFloat(formData.transporte) || 0;

            // Entregar pedido y actualizar estado (el backend genera los gastos automáticamente)
            const entregaData = {
                cantidadEntregada: parseFloat(formData.peso),
                unidadEntregada: formData.medida_peso,
                cantidadUD: parseFloat(formData.piezas),
                unidadUD: formData.medida_piezas,
                proveedor_id: formData.proveedor_id || null,
                costo: parseFloat(formData.costo),
                transporte_otros: transporteVal > 0 ? transporteVal : null,
                metodo_pago: formData.metodo_pago,
                estado_entrega: formData.estado_llegada,
                observaciones: formData.observaciones || null
            };

            const result = await pedidosAcopioService.entregar(pedido.id, entregaData);

            if (!result?.success) {
                showDanger(null, result?.message || 'No se pudo actualizar el pedido');
                return;
            }

            showSuccess(null, 'Pedido entregado correctamente');

            if (onEntregado) {
                onEntregado({
                    ...pedido,
                    ...result.data
                });
            }

            onClose();
        } catch (error) {
            showDanger(null, 'Error de conexión');
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
            title="Entregar Pedido"
            confirmText="Confirmar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            tipo="number"
                            label="Peso"
                            value={formData.peso}
                            required={true}
                            error={fieldErrors.peso}
                            onChange={(e) => {
                                setFormData({ ...formData, peso: e.target.value });
                                setFieldErrors(prev => ({ ...prev, peso: false }));
                            }}
                            onClearError={() => setFieldErrors(prev => ({ ...prev, peso: false }))}
                            disabled={loading}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <InputSelect
                            label="Medida"
                            options={opcionesMedida}
                            value={formData.medida_peso}
                            onChange={(val) => setFormData({ ...formData, medida_peso: val })}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            tipo="number"
                            label="Piezas"
                            value={formData.piezas}
                            required={true}
                            error={fieldErrors.piezas}
                            onChange={(e) => {
                                setFormData({ ...formData, piezas: e.target.value });
                                setFieldErrors(prev => ({ ...prev, piezas: false }));
                            }}
                            onClearError={() => setFieldErrors(prev => ({ ...prev, piezas: false }))}
                            disabled={loading}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <InputSelect
                            label="Medida"
                            options={opcionesPiezas}
                            value={formData.medida_piezas}
                            onChange={(val) => setFormData({ ...formData, medida_piezas: val })}
                            disabled={loading}
                        />
                    </div>
                </div>

                <SelectProveedores
                    value={formData.proveedor_id}
                    onChange={(val) => setFormData({ ...formData, proveedor_id: val })}
                    disabled={loading}
                    fetchTrigger={isOpen}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            tipo="number"
                            label="Costo"
                            value={formData.costo}
                            required={true}
                            error={fieldErrors.costo}
                            onChange={(e) => {
                                setFormData({ ...formData, costo: e.target.value });
                                setFieldErrors(prev => ({ ...prev, costo: false }));
                            }}
                            onClearError={() => setFieldErrors(prev => ({ ...prev, costo: false }))}
                            disabled={loading}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <Input
                            tipo="number"
                            label="Transporte"
                            value={formData.transporte}
                            onChange={(e) => setFormData({ ...formData, transporte: e.target.value })}
                            disabled={loading}
                        />
                    </div>
                </div>

                <SelectMetodoPago
                    value={formData.metodo_pago}
                    onChange={(val) => {
                        setFormData({ ...formData, metodo_pago: val });
                        setFieldErrors(prev => ({ ...prev, metodo_pago: false }));
                    }}
                    required={true}
                    error={fieldErrors.metodo_pago}
                    disabled={loading}
                    fetchTrigger={isOpen}
                />

                <InputSelect
                    label="Estado"
                    options={opcionesEstado}
                    value={formData.estado_llegada}
                    required={true}
                    error={fieldErrors.estado_llegada}
                    onChange={(val) => {
                        setFormData({ ...formData, estado_llegada: val });
                        setFieldErrors(prev => ({ ...prev, estado_llegada: false }));
                    }}
                    disabled={loading}
                />

                <Input
                    tipo="textarea"
                    label="Observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    disabled={loading}
                />
            </div>
        </ModalLateral>
    );
};

export default EntregarPedidoAcopio;
