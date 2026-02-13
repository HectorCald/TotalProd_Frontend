import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import Text from '../../../common/Text';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import { formatPedidoLog, prepareLogPayload } from '../../../../utils/logFormatters';
import pedidosAlmacenService from '../../../../services/pedidosAlmacenService';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import styles from '../../../../styles/view.module.css';

function ModalIngresar({ 
    isOpen, 
    setIsOpen, 
    pedidoActual,
    setPedidoActual,
    onPedidoActualizado,
    setIsOpenVerPedido,
    sucursalActual,
    detalles,
    setIsProductosOpen
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    
    const { logAccion } = useHistorialLogger({
        modulo: 'Pedidos'
    });

    const handleConfirmarIngreso = async () => {
        if (!pedidoActual) return;

        try {
            setLoading(true);

            // Si la sucursal actual comparte almacén, solo finalizar sin crear movimiento
            const usaAlmacenCompartido = !!(sucursalActual && sucursalActual.almacen_sucursal_id);
            if (usaAlmacenCompartido) {
                const pedidoAntes = pedidoActual ? JSON.parse(JSON.stringify(pedidoActual)) : null;
                const estadoResponse = await pedidosAlmacenService.updateEstado(pedidoActual.id, 'Completado');
                if (estadoResponse.success) {
                    showSuccess('Éxito', 'Pedido finalizado correctamente');
                    // Usar la respuesta del servidor que incluye total_pedidos actualizado
                    const pedidoActualizado = estadoResponse.data;
                    const logAntes = formatPedidoLog(pedidoAntes);
                    const logDespues = formatPedidoLog(pedidoActualizado);
                    const { datosAntes, datosDespues, campos } = prepareLogPayload({
                        accion: 'EDITAR',
                        datosAntes: logAntes,
                        datosDespues: logDespues
                    });
                    await logAccion({
                        accion: 'EDITAR',
                        lugarAfectado: `Pedido #${logDespues?.numero ?? logAntes?.numero ?? pedidoActualizado?.id ?? pedidoAntes?.id ?? ''}`,
                        registroId: pedidoActualizado?.id || pedidoAntes?.id || null,
                        datosAntes,
                        datosDespues,
                        comentario: 'Finalización de pedido (almacén compartido)',
                        campos
                    });
                    if (onPedidoActualizado) {
                        onPedidoActualizado(pedidoActualizado);
                    }
                    setIsOpen(false);
                    setIsOpenVerPedido(false);
                    return;
                } else {
                    showDanger('Error', 'Error al finalizar el pedido: ' + estadoResponse.message);
                    return;
                }
            }

            // Obtener el movimiento de salida para copiar descuento/aumento
            let descuentoSalida = 0;
            let aumentoSalida = 0;
            let porcentajeSalida = null;

            if (pedidoActual?.movimiento_salida_id) {
                try {
                    const movimientoSalidaResponse = await movimientosAlmacenService.getById(pedidoActual.movimiento_salida_id);
                    if (movimientoSalidaResponse.success && movimientoSalidaResponse.data) {
                        const movimientoSalida = movimientoSalidaResponse.data;
                        descuentoSalida = parseFloat(movimientoSalida.descuento) || 0;
                        aumentoSalida = parseFloat(movimientoSalida.aumento) || 0;
                        porcentajeSalida = movimientoSalida.porcentaje;
                    }
                } catch (error) {
                    console.warn('Error al obtener movimiento de salida para copiar descuento/aumento:', error);
                    // Continuar sin descuento/aumento si falla
                }
            }

            // Preparar los productos del pedido para el ingreso
            const productosParaIngreso = pedidoActual.pedido_almacen_detalle?.map(detalle => ({
                id: detalle.producto_almacen.id,
                cantidad: detalle.cantidad,
                precio: detalle.precio || 0
            })) || [];

            if (productosParaIngreso.length === 0) {
                showDanger('Error', 'No hay productos para ingresar');
                return;
            }

            // Crear el movimiento de entrada usando el MVC de movimientos
            const movimientoData = {
                type: 'entrada',
                observaciones: `Ingreso automático del pedido Nº ${pedidoActual.numero_pedido || 'N/A'}`,
                productos: productosParaIngreso,
                precio_id: pedidoActual.precio_id,
                descuento: descuentoSalida,
                aumento: aumentoSalida,
                porcentaje: porcentajeSalida
            };

            const movimientoResponse = await movimientosAlmacenService.create(movimientoData);

            if (movimientoResponse.success) {
                // Actualizar el estado del pedido a Completado y registrar el movimiento de entrada
                const pedidoAntes = pedidoActual ? JSON.parse(JSON.stringify(pedidoActual)) : null;
                const estadoResponse = await pedidosAlmacenService.updateEstado(pedidoActual.id, 'Completado', undefined, undefined, movimientoResponse.data.id);

                if (estadoResponse.success) {
                    showSuccess('Éxito', 'Pedido ingresado correctamente');

                    // Usar la respuesta del servidor que incluye total_pedidos actualizado
                    const pedidoActualizado = estadoResponse.data;

                    const logAntes = formatPedidoLog(pedidoAntes);
                    const logDespues = formatPedidoLog(pedidoActualizado);
                    const { datosAntes, datosDespues, campos } = prepareLogPayload({
                        accion: 'EDITAR',
                        datosAntes: logAntes,
                        datosDespues: logDespues
                    });
                    await logAccion({
                        accion: 'EDITAR',
                        lugarAfectado: `Pedido #${logDespues?.numero ?? logAntes?.numero ?? pedidoActualizado?.id ?? pedidoAntes?.id ?? ''}`,
                        registroId: pedidoActualizado?.id || pedidoAntes?.id || null,
                        datosAntes,
                        datosDespues,
                        comentario: 'Ingreso de pedido al almacén',
                        campos
                    });

                    if (onPedidoActualizado) {
                        onPedidoActualizado(pedidoActualizado);
                    }

                    // Cerrar modales y regresar a PanelPedidos
                    setIsOpen(false);
                    setIsOpenVerPedido(false);
                } else {
                    showDanger('Error', 'Error al actualizar estado del pedido: ' + estadoResponse.message);
                }
            } else {
                showDanger('Error', 'Error al crear el ingreso: ' + movimientoResponse.message);
            }
        } catch (error) {
            console.error('Error al ingresar pedido:', error);
            showDanger('Error', 'Error al ingresar pedido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Ingresar Pedido"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas ingresar este pedido? Esta acción registrará el ingreso de todos los productos.
                </p>
                <div style={{ marginTop: '10px', width: '100%' }}>
                    <Text type="info" align="left">
                        Se ingresarán automáticamente todas las cantidades de los productos del pedido al almacén.
                    </Text>
                </div>
                {/* Botón para ver productos */}
                {detalles && detalles.length > 0 && (
                    <div style={{ marginTop: '15px', width: '100%' }}>
                        <Boton
                            className='btn-gray'
                            label={`Ver Productos (${detalles.length})`}
                            onClick={() => setIsProductosOpen(true)}
                        />
                    </div>
                )}
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                    <Boton
                        className='btn-green'
                        label='Sí, ingresar'
                        style={{ marginTop: 'auto' }}
                        onClick={handleConfirmarIngreso}
                        loading={loading}
                        segundosDisabled={5}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalIngresar;
