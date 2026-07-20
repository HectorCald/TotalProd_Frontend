import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Text from '../../../../components/common/old/Text';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import pedidosAlmacenService from '../../../../services/pedidosAlmacenService';
import useHistorialLogger from '../../../../components/ui/HistorialLogger';

const IngresarPedido = ({ isOpen, setIsOpen, pedido, movimientoSalida, onIngresado }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const { logAccion } = useHistorialLogger({
        modulo: 'Pedidos'
    });

    const handleConfirm = async () => {
        if (!pedido || !movimientoSalida) return;

        try {
            setLoading(true);

            // 1. Preparar payload para entrada
            const payload = {
                type: 'entrada',
                concepto: `Ingreso del Pedido Nro ${pedido.numero_pedido || pedido.id}`,
                restar_ingredientes: false,
                precio_id: movimientoSalida.precio_id,
                agrupado: movimientoSalida.agrupado,
                productos: (movimientoSalida.productos || []).map(p => ({
                    id: p.producto?.id || p.producto_id || p.id,
                    cantidad: p.cantidad,
                    precio: p.precio_unitario || p.precio
                }))
            };

            // 2. Realizar la entrada
            const result = await movimientosAlmacenService.createFast(payload);

            if (!result.success) {
                showDanger(null, result.message || 'Error al registrar el ingreso del pedido');
                setLoading(false);
                return;
            }

            // 3. Actualizar el estado del pedido a Completado
            const updateResult = await pedidosAlmacenService.updateEstado(
                pedido.id, 
                'Completado', 
                undefined, 
                undefined, 
                result.data.id
            );

            if (!updateResult.success) {
                showDanger(null, 'Ingreso creado pero error al actualizar el estado del pedido: ' + updateResult.message);
                setLoading(false);
                return;
            }

            showSuccess(null, 'Pedido ingresado correctamente');
            setIsOpen(false);

            await logAccion({
                accion: 'INGRESAR_PEDIDO',
                lugarAfectado: `Pedido #${pedido.numero_pedido || pedido.id}`,
                registroId: pedido.id
            });

            if (onIngresado) {
                onIngresado(updateResult.data || pedido);
            }

        } catch (error) {
            console.error('Error al ingresar pedido:', error);
            showDanger(null, 'Error al ingresar el pedido');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setIsOpen(false);
    };

    if (!pedido && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Ingresar Pedido"
            mensaje={`¿Estás seguro que deseas ingresar el pedido Nro ${pedido.numero_pedido || pedido.id}?`}
            detalle={
                <div style={{ marginTop: '10px', width: '100%' }}>
                    <Text type="info" align="left">
                        Se ingresarán automáticamente todos los productos entregados en el movimiento de salida a tu stock actual. Esta acción cambiará el estado del pedido a "Completado".
                    </Text>
                </div>
            }
            confirmText="Sí, ingresar pedido"
            confirmColorClass="btn-primary"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default IngresarPedido;
