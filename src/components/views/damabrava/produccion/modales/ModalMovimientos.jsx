import React, { useState, useEffect } from 'react';
import styles from '../../../../../styles/view.module.css';
import ViewModal from '../../../../ui/ViewModal';
import HeaderModal from '../../../../common/old/HeaderModal';
import ItemView from '../../../../common/old/ItemView';
import NoData from '../../../../common/widgets/NoData';
import { useToast } from '../../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../../services/movimientosAlmacenService';

function ModalMovimientos({ isOpen, setIsOpen, registroId, onMovimientoClick, formatFechaLiteral, isLargeScreen }) {
    const { showDanger, showWarning } = useToast();
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !registroId) {
            setMovimientos([]);
            return;
        }
        setLoading(true);
        movimientosAlmacenService
            .getByProduccionDamabrava(registroId)
            .then((response) => {
                if (response.success) {
                    setMovimientos(response.data || []);
                } else {
                    showWarning('Advertencia', response.message || 'Error al obtener los movimientos');
                    setMovimientos([]);
                }
            })
            .catch((error) => {
                console.error('Error obteniendo movimientos:', error);
                showDanger('Error', error.message || 'Error al obtener los movimientos');
                setMovimientos([]);
            })
            .finally(() => setLoading(false));
    }, [isOpen, registroId]);

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Movimientos de la Producción"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                {loading ? (
                    <NoData
                        icon="loader-alt"
                        title="Cargando movimientos..."
                        detail="Obteniendo el historial de movimientos de la producción"
                        transparent={true}
                        minHeight="150px"
                    />
                ) : movimientos.length > 0 ? (
                    <>
                        <p className={styles.subTitle}>HISTORIAL DE MOVIMIENTOS</p>
                        {movimientos.map((movimiento, index) => (
                            <ItemView
                                key={movimiento.id || index}
                                title={movimiento.productos && movimiento.productos.length > 0
                                    ? movimiento.productos.length === 1
                                        ? `${movimiento.productos[0]?.producto?.name || 'Sin producto'}`
                                        : `${movimiento.productos.length} productos`
                                    : 'Sin productos'
                                }
                                description={`${movimiento.observaciones || 'Sin observaciones'} • ${formatFechaLiteral(movimiento.fecha, !isLargeScreen)}`}
                                circulo={false}
                                onClick={() => onMovimientoClick(movimiento)}
                                arrow={false}
                                flot3={movimiento?.estado === 'anulado' ? 'Anulado' : ''}
                                flot1={movimiento?.estado === 'anulado' ? '' : 'Finalizado'}
                            />
                        ))}
                    </>
                ) : (
                    <NoData
                        icon="history"
                        title="No hay movimientos"
                        detail="Esta producción no tiene movimientos registrados aún"
                        transparent={false}
                        minHeight="150px"
                    />
                )}
            </div>
        </ViewModal>
    );
}

export default ModalMovimientos;
