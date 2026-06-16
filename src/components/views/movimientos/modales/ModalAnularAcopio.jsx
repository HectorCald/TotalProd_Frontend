import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Boton from '../../../common/botones/Boton';
import Text from '../../../common/old/Text';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import { buildMovimientoAcopioDetallesParaHistorial } from '../../../../utils/logFormatters';
import movimientosAcopioService from '../../../../services/movimientosAcopioService';
import styles from '../../../../styles/view.module.css';

function ModalAnularAcopio({ 
    isOpen, 
    setIsOpen, 
    movimientoActual, 
    setMovimientoActual,
    movimiento,
    onMovimientoAnulado
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    const { logAccion } = useHistorialLogger({ modulo: 'Movimientos Acopio' });

    const handleAnular = async () => {
        setLoading(true);
        try {
            const movimientoAntesRaw = movimientoActual ? JSON.parse(JSON.stringify(movimientoActual)) : null;
            const response = await movimientosAcopioService.anular(movimientoActual.id);

            if (response.success) {
                // Usar la respuesta del servidor que incluye el movimiento actualizado
                const movimientoActualizado = response.data;

                // Preservar los datos originales que podrían perderse al anular
                const movimientoConDatosPreservados = {
                    ...movimientoActualizado,
                    // Preservar datos importantes que podrían perderse
                    date: movimientoActualizado.date || movimientoActual.date,
                    quantity: movimientoActualizado.quantity || movimientoActual.quantity,
                    costo: movimientoActualizado.costo || movimientoActual.costo,
                    metodo_pago: movimientoActualizado.metodo_pago || movimientoActual.metodo_pago,
                    observations: movimientoActualizado.observations || movimientoActual.observations,
                    observaciones: movimientoActualizado.observaciones || movimientoActual.observaciones,
                    restar_ingredientes: movimientoActualizado.restar_ingredientes !== undefined ? movimientoActualizado.restar_ingredientes : movimientoActual.restar_ingredientes,
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
                    // Preservar información del producto
                    product: movimientoActualizado.product || movimientoActual.product,
                    product_id: movimientoActualizado.product_id || movimientoActual.product_id
                };

                // Actualizar el estado local del movimiento
                setMovimientoActual(movimientoConDatosPreservados);

                const detallesPersonalizados = buildMovimientoAcopioDetallesParaHistorial(
                    movimientoAntesRaw,
                    null,
                    'ANULAR'
                );
                const codigoMov = movimientoAntesRaw?.codigo ?? movimientoAntesRaw?.id ?? movimientoConDatosPreservados?.id ?? '';
                await logAccion({
                    accion: 'ANULAR',
                    lugarAfectado: `Movimiento ${codigoMov ? '#' + codigoMov : ''}`.trim() || 'Movimiento materia prima',
                    registroId: movimientoConDatosPreservados?.id || movimientoAntesRaw?.id || null,
                    comentario: 'Anulación de movimiento materia prima',
                    detallesPersonalizados
                });

                setIsOpen(false);
                // NO cerrar VerMovimientoAcopio, solo actualizar el estado

                // Notificar al componente padre del cambio
                if (onMovimientoAnulado) {
                    // Pasar el ID del movimiento anulado y los IDs de las salidas eliminadas
                    onMovimientoAnulado(movimientoActual.id, response.salidasEliminadas || []);
                }

                showSuccess('Éxito', 'Movimiento anulado correctamente');
            } else {
                const msg = response.message || 'Error al anular el movimiento';
                showDanger('Error', msg);
            }
        } catch (error) {
            console.error('Error anulando movimiento:', error);
            showDanger('Error', error.message || 'Error al anular el movimiento');
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
                <div style={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}>
                    <Text type="warning" align="left">
                        Si este movimiento está relacionado con un pedido de acopio, el pedido será actualizado a estado "Entregado" y se podrá hacer un nuevo ingreso.
                    </Text>
                </div>
                {movimientoActual?.restar_ingredientes && (
                    <div style={{ marginTop: '0', marginBottom: '10px', width: '100%' }}>
                        <Text type="error" align="left">
                            Este movimiento restó materia prima. Al anular este movimiento se devolverá el total de la materia prima de la receta del producto.
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

export default ModalAnularAcopio;
