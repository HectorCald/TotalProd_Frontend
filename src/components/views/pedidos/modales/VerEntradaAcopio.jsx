import React, { useState, useEffect } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Dato from '../../../common/old/Dato';
import Skeleton from '../../../common/widgets/Skeleton';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../../utils/dateUtils';
import { useLayout } from '../../../../context/LayoutContext';
import { useToast } from '../../../../context/ToastContext';
import movimientosAcopioService from '../../../../services/movimientosAcopioService';
import styles from '../../../../styles/view.module.css';

function VerEntradaAcopio({ 
    isOpen, 
    setIsOpen, 
    movimientoEntradaId
}) {
    const { isLargeScreen } = useLayout();
    const { showDanger } = useToast();
    const [movimientoEntrada, setMovimientoEntrada] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (!movimientoEntradaId) {
                showDanger('Error', 'No se encontró información de la entrada');
                setIsOpen(false);
                return;
            }

            const cargarMovimiento = async () => {
                try {
                    setLoading(true);
                    const response = await movimientosAcopioService.getById(movimientoEntradaId);

                    if (response.success) {
                        setMovimientoEntrada(response.data);
                    } else {
                        showDanger('Error', response.message || 'Error al obtener información del movimiento');
                        setIsOpen(false);
                    }
                } catch (error) {
                    console.error('Error al obtener movimiento:', error);
                    showDanger('Error', 'Error al obtener información del movimiento');
                    setIsOpen(false);
                } finally {
                    setLoading(false);
                }
            };

            cargarMovimiento();
        } else {
            setMovimientoEntrada(null);
        }
    }, [isOpen, movimientoEntradaId, showDanger, setIsOpen]);

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Detalles del Ingreso"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                {loading ? (
                    <>
                        <Skeleton width="100%" height="25px" />
                        <Skeleton width="100%" height="25px" />
                        <Skeleton width="100%" height="25px" />
                        <Skeleton width="100%" height="25px" />
                        <Skeleton width="100%" height="25px" />
                        <Skeleton width="100%" height="25px" />
                        <Skeleton width="100%" height="25px" />
                        <Skeleton width="100%" height="25px" />
                    </>
                ) : movimientoEntrada ? (
                    <>
                        <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                        <Dato
                            label="Tipo"
                            value={movimientoEntrada.type === 'entrada' ? 'Entrada' : 'Salida'}
                        />
                        <Dato
                            label="Producto"
                            value={movimientoEntrada.product?.name || 'Producto no encontrado'}
                        />
                        <Dato
                            label="Cantidad"
                            value={`${parseFloat(movimientoEntrada.quantity || 0).toFixed(2)} ${movimientoEntrada.product?.type_measure?.code || ''}`}
                        />
                        <Dato
                            label="Fecha y Hora"
                            value={movimientoEntrada.date ? `${formatFechaLiteral(movimientoEntrada.date, !isLargeScreen)} ${formatHoraSinSegundos(movimientoEntrada.date)}` : 'No especificada'}
                        />
                        {movimientoEntrada.observations && (
                            <Dato
                                label="Observaciones"
                                value={movimientoEntrada.observations}
                            />
                        )}
                        {movimientoEntrada.proveedor && (
                            <Dato
                                label="Proveedor"
                                value={movimientoEntrada.proveedor.name}
                            />
                        )}
                        {movimientoEntrada.costo && (
                            <Dato
                                label="Costo"
                                value={`Bs. ${parseFloat(movimientoEntrada.costo).toFixed(2)}`}
                                especial='green'
                            />
                        )}
                        {movimientoEntrada.metodo_pago && (
                            <Dato
                                label="Método de Pago"
                                value={movimientoEntrada.metodo_pago}
                            />
                        )}
                        {movimientoEntrada.gasto && (
                            <Dato
                                label="Gasto Asociado"
                                value={`ID: ${movimientoEntrada.gasto.id} - ${movimientoEntrada.gasto.concepto}`}
                            />
                        )}
                        <Dato
                            label="Estado"
                            value={movimientoEntrada.estado === 'anulado' ? 'Anulado' : 'Finalizado'}
                        />
                    </>
                ) : (
                    <p>No se pudo cargar la información del movimiento</p>
                )}
            </div>
        </ViewModal>
    );
}

export default VerEntradaAcopio;
