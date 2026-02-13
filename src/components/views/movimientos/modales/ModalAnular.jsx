import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import Text from '../../../common/Text';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import { buildMovimientoDetallesParaHistorial } from '../../../../utils/logFormatters';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import deudasService from '../../../../services/deudasService';
import styles from '../../../../styles/view.module.css';

function ModalAnular({ 
    isOpen, 
    setIsOpen, 
    movimientoActual, 
    setMovimientoActual,
    movimiento,
    onMovimientoActualizado,
    onMovimientoAnulado
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    
    const { logAccion } = useHistorialLogger({
        modulo: 'Movimientos'
    });

    const handleAnular = async () => {
        setLoading(true);
        try {
            const movimientoAntesRaw = movimientoActual ? JSON.parse(JSON.stringify(movimientoActual)) : null;
            // 1) Si el movimiento tiene deuda_id, limpiar primero el deuda_id del movimiento
            if (movimientoActual?.deuda_id) {
                const updateResponse = await movimientosAlmacenService.update(movimientoActual.id, { deuda_id: null });
                if (!updateResponse.success) {
                    showDanger('Error', `Error al limpiar deuda_id del movimiento: ${updateResponse.message}`);
                    setLoading(false);
                    return;
                }
            }

            // 2) Si el movimiento tiene gasto_id, limpiar y eliminar gasto antes de anular
            if (movimientoActual?.gasto_id) {
                // Limpiar gasto_id en el movimiento
                const limpiarResp = await movimientosAlmacenService.update(movimientoActual.id, { gasto_id: null });
                if (!limpiarResp.success) {
                    showDanger('Error', `Error al limpiar gasto_id del movimiento: ${limpiarResp.message}`);
                    setLoading(false);
                    return;
                }
                // Eliminar el gasto
                try {
                    const gastoResp = await (await import('../../../../services/gastosService')).default.delete(movimientoActual.gasto_id);
                    if (!gastoResp.success) {
                        showDanger('Error', `Error al eliminar gasto asociado: ${gastoResp.message}`);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error('Error eliminando gasto asociado:', e);
                    showDanger('Error', 'Error al eliminar el gasto asociado');
                    setLoading(false);
                    return;
                }
            }

            // 3) Anular el movimiento normalmente
            const response = await movimientosAlmacenService.anular(movimientoActual.id);

            if (response.success) {
                // 4) Si había una deuda, eliminarla después de anular el movimiento
                if (movimientoActual?.deuda_id) {
                    const deudaResponse = await deudasService.delete(movimientoActual.deuda_id);
                    if (!deudaResponse.success) {
                        console.warn('Error al eliminar la deuda después de anular:', deudaResponse.message);
                        // No mostrar error al usuario ya que el movimiento ya se anuló correctamente
                    }
                }

                // Usar la respuesta del servidor que incluye el movimiento actualizado
                const movimientoActualizado = response.data;

                // Preservar los datos originales que podrían perderse al anular
                const movimientoConDatosPreservados = {
                    ...movimientoActualizado,
                    // Preservar datos importantes que podrían perderse
                    fecha: movimientoActualizado.fecha || movimientoActual.fecha,
                    precio: movimientoActualizado.precio || movimientoActual.precio,
                    precio_id: movimientoActualizado.precio_id || movimientoActual.precio_id,
                    agrupado: movimientoActualizado.agrupado !== undefined ? movimientoActualizado.agrupado : movimientoActual.agrupado,
                    metodo_pago: movimientoActualizado.metodo_pago || movimientoActual.metodo_pago,
                    observaciones: movimientoActualizado.observaciones || movimientoActual.observaciones,
                    // Preservar descuento, aumento y porcentaje para el resumen financiero
                    descuento: movimientoActualizado.descuento !== undefined ? movimientoActualizado.descuento : movimientoActual.descuento,
                    aumento: movimientoActualizado.aumento !== undefined ? movimientoActualizado.aumento : movimientoActual.aumento,
                    porcentaje: movimientoActualizado.porcentaje !== undefined ? movimientoActualizado.porcentaje : movimientoActual.porcentaje,
                    // Preservar información del responsable
                    user: movimientoActualizado.user || movimientoActual.user,
                    user_id: movimientoActualizado.user_id || movimientoActual.user_id,
                    personal: movimientoActualizado.personal || movimientoActual.personal,
                    personal_id: movimientoActualizado.personal_id || movimientoActual.personal_id,
                    // Preservar información del cliente/proveedor
                    cliente: movimientoActualizado.cliente || movimientoActual.cliente,
                    cliente_id: movimientoActualizado.cliente_id || movimientoActual.cliente_id,
                    proveedor: movimientoActualizado.proveedor || movimientoActual.proveedor,
                    proveedor_id: movimientoActualizado.proveedor_id || movimientoActual.proveedor_id,
                    // Preservar productos con toda su información
                    productos: (() => {
                        // Si hay productos actualizados, preservar su información completa
                        if (movimientoActualizado.productos && movimientoActualizado.productos.length > 0) {
                            return movimientoActualizado.productos.map((productoActualizado) => {
                                // Buscar el producto original por ID
                                const productoOriginal = movimientoActual.productos?.find(
                                    p => p.producto?.id === productoActualizado.producto?.id
                                );

                                return {
                                    ...productoActualizado,
                                    // Preservar información completa del producto
                                    producto: productoActualizado.producto || productoOriginal?.producto,
                                    precio_unitario: productoActualizado.precio_unitario || productoOriginal?.precio_unitario,
                                    cantidad: productoActualizado.cantidad || productoOriginal?.cantidad,
                                    subtotal: productoActualizado.subtotal || productoOriginal?.subtotal
                                };
                            });
                        }
                        // Si no hay productos actualizados, usar los originales
                        return movimientoActual.productos || [];
                    })()
                };

                // Actualizar el estado local del movimiento
                setMovimientoActual(movimientoConDatosPreservados);

                const detallesPersonalizados = buildMovimientoDetallesParaHistorial(
                    movimientoAntesRaw,
                    null,
                    'ANULAR'
                );
                const codigoMov = movimientoAntesRaw?.codigo ?? movimientoAntesRaw?.id ?? movimientoConDatosPreservados?.id ?? '';
                await logAccion({
                    accion: 'ANULAR',
                    lugarAfectado: `Movimiento ${codigoMov ? '#' + codigoMov : ''}`.trim() || 'Movimiento',
                    registroId: movimientoConDatosPreservados?.id || movimientoAntesRaw?.id || null,
                    comentario: 'Anulación de movimiento',
                    detallesPersonalizados
                });

                // Notificar al componente padre del cambio
                if (onMovimientoActualizado) {
                    onMovimientoActualizado(movimientoConDatosPreservados);
                }

                // También llamar al callback original para mantener compatibilidad
                if (onMovimientoAnulado) {
                    onMovimientoAnulado(movimientoActual.id);
                }

                setIsOpen(false);
                // NO cerrar VerMovimiento, solo actualizar el estado
                showSuccess('Éxito', 'Movimiento anulado correctamente');
            } else {
                // Manejar errores específicos de stock insuficiente
                if (response.productosConStockInsuficiente && response.productosConStockInsuficiente.length > 0) {
                    const productos = response.productosConStockInsuficiente;
                    let mensajeError = 'No se puede anular: Stock insuficiente para revertir el ingreso\n\n';
                    productos.forEach(prod => {
                        mensajeError += `• ${prod.nombre}: Stock actual ${prod.stockActual}, necesitas ${prod.requerido} (faltan ${prod.faltante})\n`;
                    });
                    mensajeError += '\nEsto significa que los productos ingresados ya fueron vendidos o utilizados.';
                    showDanger('Error', mensajeError);
                } else {
                    const msg = response.message || 'Error al anular el movimiento';
                    showDanger('Error', msg);
                }
            }
        } catch (error) {
            console.error('Error anulando movimiento:', error);

            // Manejar errores específicos de stock insuficiente desde el catch
            if (error.response?.data?.productosConStockInsuficiente) {
                const productos = error.response.data.productosConStockInsuficiente;
                let mensajeError = 'No se puede anular: Stock insuficiente para revertir el ingreso\n\n';
                productos.forEach(prod => {
                    mensajeError += `• ${prod.nombre}: Stock actual ${prod.stockActual}, necesitas ${prod.requerido} (faltan ${prod.faltante})\n`;
                });
                mensajeError += '\nEsto significa que los productos ingresados ya fueron vendidos o utilizados.';
                showDanger('Error', mensajeError);
            } else {
                showDanger('Error', error.message || 'Error al anular el movimiento');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Anular Movimiento"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas anular este movimiento? Esta acción no se puede deshacer.
                </p>
                {movimientoActual?.type === 'entrada' && (
                    <div style={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}>
                        <Text type="error" align="left">
                            Si este movimiento restó materia prima según la receta, se le devolverá el total de la materia prima de la receta del producto.
                        </Text>
                    </div>
                )}
                {movimientoActual?.produccion_damabrava_id && movimientoActual?.type === 'entrada' && (
                    <div style={{ marginBottom: '10px', width: '100%' }}>
                        <Text type="warning" align="left">
                            Este movimiento es un ingreso de producción Damabrava. Al anular, si el registro de producción está en estado "Completado" se pondrá a estado "Verificado".
                        </Text>
                    </div>
                )}
                {movimientoActual?.type === 'salida' && (
                    <div style={{ marginBottom: '10px', width: '100%' }}>
                        <Text type="info" align="left">
                            Al anular este movimiento se regresarán todos los productos a tu stock del producto.
                            {movimientoActual?.cliente_id && ' Se quitará el número de pedido o de orden del cliente.'}
                        </Text>
                    </div>
                )}
                {movimientoActual?.metodo_pago?.toLowerCase() === 'credito' && (
                    <div style={{ width: '100%' }}>
                        <Text type="warning" align="left">
                            Al anular este movimiento se eliminará la deuda del apartado de deudas por que este movimiento tiene metodo de pago a credito.
                        </Text>
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
                        className='btn-red'
                        label='Sí, anular'
                        style={{ marginTop: 'auto' }}
                        onClick={handleAnular}
                        loading={loading}
                        segundosDisabled={5}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalAnular;
