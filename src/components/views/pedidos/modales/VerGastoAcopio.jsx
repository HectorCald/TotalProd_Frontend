import React, { useState, useEffect } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Dato from '../../../common/old/Dato';
import Skeleton from '../../../common/widgets/Skeleton';
import { formatFechaLiteral } from '../../../../utils/dateUtils';
import { useLayout } from '../../../../context/LayoutContext';
import { useToast } from '../../../../context/ToastContext';
import { useUser } from '../../../../context/UserContext';
import gastosService from '../../../../services/gastosService';
import styles from '../../../../styles/view.module.css';

function VerGastoAcopio({ 
    isOpen, 
    setIsOpen, 
    gastoId
}) {
    const { isLargeScreen } = useLayout();
    const { showDanger } = useToast();
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const [gasto, setGasto] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (!gastoId) {
                showDanger('Error', 'No se encontró información del gasto');
                setIsOpen(false);
                return;
            }

            const cargarGasto = async () => {
                try {
                    setLoading(true);
                    const empresaId = sucursalActual?.empresas?.id || null;
                    const response = await gastosService.getById(gastoId, empresaId);

                    if (response.success) {
                        setGasto(response.data);
                    } else {
                        showDanger('Error', response.message || 'Error al obtener información del gasto');
                        setIsOpen(false);
                    }
                } catch (error) {
                    console.error('Error al obtener gasto:', error);
                    if (error.status === 403) {
                        showDanger('Error', error.message || 'No tienes acceso al módulo de Gastos');
                    } else {
                        showDanger('Error', 'Error al obtener información del gasto');
                    }
                    setIsOpen(false);
                } finally {
                    setLoading(false);
                }
            };

            cargarGasto();
        } else {
            setGasto(null);
        }
    }, [isOpen, gastoId, sucursalActual, showDanger, setIsOpen]);

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Detalles del Gasto"
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
                    </>
                ) : gasto ? (
                    <>
                        <p className={styles.subTitle}>INFORMACIÓN DEL GASTO</p>
                        <Dato
                            label="Concepto"
                            value={gasto.concepto || 'Sin concepto'}
                        />
                        <Dato
                            label="Monto"
                            value={`Bs. ${(gasto.valor || 0).toFixed(2)}`}
                            especial='green'
                        />
                        <Dato
                            label="Método de Pago"
                            value={gasto.metodo_pago || 'No especificado'}
                        />
                        <Dato
                            label="Proveedor"
                            value={gasto.proveedor?.name || 'No especificado'}
                        />
                        <Dato
                            label="Fecha"
                            value={gasto.fecha_gasto ? formatFechaLiteral(gasto.fecha_gasto, !isLargeScreen) : 'No especificada'}
                        />
                        {gasto.observaciones && (
                            <Dato
                                label="Observaciones"
                                value={gasto.observaciones}
                            />
                        )}
                    </>
                ) : (
                    <p>No se pudo cargar la información del gasto</p>
                )}
            </div>
        </ViewModal>
    );
}

export default VerGastoAcopio;
