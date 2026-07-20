import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import movimientosAcopioService from '../../../../services/movimientosAcopioService';

const AnularMovimiento = ({ isOpen, onClose, movimientoSeleccionado, onAnular }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!movimientoSeleccionado?.id) {
            showDanger(null, 'ID del movimiento no válido');
            return;
        }

        setLoading(true);
        try {
            const isAcopio = !!movimientoSeleccionado.product;
            const response = isAcopio
                ? await movimientosAcopioService.anular(movimientoSeleccionado.id)
                : await movimientosAlmacenService.anularFast(movimientoSeleccionado.id);

            if (response.success && isAcopio && movimientoSeleccionado.pedidos_entrada) {
                // Si el movimiento tiene un pedido asociado, también actualizamos el pedido a Entregado
                const pedidoArray = Array.isArray(movimientoSeleccionado.pedidos_entrada) 
                    ? movimientoSeleccionado.pedidos_entrada 
                    : [movimientoSeleccionado.pedidos_entrada];
                
                for (const ped of pedidoArray) {
                    if (ped?.id) {
                        // Importamos dinámicamente o usamos fetch directo si no está importado
                        try {
                            const { default: pedidosAcopioService } = await import('../../../../services/pedidosAcopioService');
                            await pedidosAcopioService.updateEstado(ped.id, 'Entregado', null);
                        } catch (e) {
                            console.error('No se pudo actualizar el estado del pedido asociado:', e);
                        }
                    }
                }
            }

            if (response.success) {
                if (onAnular) {
                    onAnular(response.data || { ...movimientoSeleccionado, estado: 'anulado' });
                }
                setLoading(false);
                onClose(true);
                showSuccess(null, response.message || 'Movimiento anulado exitosamente');
            } else {
                setLoading(false);
                showDanger(null, response.message || 'No se pudo anular el movimiento');
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

    if (!movimientoSeleccionado && isOpen) return null;

    const isAcopio = !!movimientoSeleccionado?.product;
    const itemConcepto = isAcopio 
        ? (movimientoSeleccionado?.product?.name || 'Materia Prima') 
        : (movimientoSeleccionado?.concepto || movimientoSeleccionado?.codigo || 'Almacén');

    const tieneGastos = movimientoSeleccionado?.gastos && (Array.isArray(movimientoSeleccionado.gastos) ? movimientoSeleccionado.gastos.length > 0 : Object.keys(movimientoSeleccionado.gastos).length > 0);
    const tieneDeudas = movimientoSeleccionado?.deudas && (Array.isArray(movimientoSeleccionado.deudas) ? movimientoSeleccionado.deudas.length > 0 : Object.keys(movimientoSeleccionado.deudas).length > 0);
    const tienePedidosEntrada = movimientoSeleccionado?.pedidos_entrada && (Array.isArray(movimientoSeleccionado.pedidos_entrada) ? movimientoSeleccionado.pedidos_entrada.length > 0 : Object.keys(movimientoSeleccionado.pedidos_entrada).length > 0);
    const tienePedidosSalida = !isAcopio && movimientoSeleccionado?.pedidos_salida && (Array.isArray(movimientoSeleccionado.pedidos_salida) ? movimientoSeleccionado.pedidos_salida.length > 0 : Object.keys(movimientoSeleccionado.pedidos_salida).length > 0);
    const tienePedidos = tienePedidosEntrada || tienePedidosSalida || (isAcopio && movimientoSeleccionado?.tiene_pedido_relacionado);

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Anular movimiento"
            mensaje={`¿Estás seguro de que deseas anular el movimiento de ${itemConcepto}?`}
            confirmText="Anular"
            confirmColorClass="btn-warning"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                {tieneDeudas && (
                    <Mensaje 
                        type="warning" 
                        title="Deuda asociada detectada" 
                        message="Al confirmar la anulación, la deuda financiera vinculada a este movimiento será eliminada automáticamente del sistema." 
                    />
                )}
                {tieneGastos && (
                    <Mensaje 
                        type="warning" 
                        title="Pago registrado detectado" 
                        message="Al confirmar la anulación, el pago o gasto vinculado a este movimiento será eliminado de los registros financieros." 
                    />
                )}
                {tienePedidos && (
                    <Mensaje 
                        type="warning" 
                        title="Pedido vinculado detectado" 
                        message={isAcopio 
                            ? "Al anular este movimiento, el pedido de materia prima asociado volverá al estado 'Entregado' (el ingreso se anulará)." 
                            : "Si el pedido asociado se encuentra en estado 'Entregado', su entrega será revertida y volverá al estado 'Pendiente'."}
                    />
                )}
            </div>
        </ModalCentro>
    );
};

export default AnularMovimiento;
