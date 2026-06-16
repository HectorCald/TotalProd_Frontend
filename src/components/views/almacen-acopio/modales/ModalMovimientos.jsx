import React from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import ItemView from '../../../common/old/ItemView';
import NoData from '../../../common/widgets/NoData';
import styles from '../../../../styles/view.module.css';

function ModalMovimientos({
    isOpen,
    setIsOpen,
    productoActual,
    movimientos,
    loadingMovimientosList,
    groupedMovements,
    onMovimientoClick
}) {
    const codeMeasure = productoActual?.type_measure?.code || '';

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Movimientos"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                {loadingMovimientosList ? (
                    <NoData
                        icon="loader-alt"
                        title="Cargando movimientos..."
                        detail="Obteniendo el historial de movimientos"
                        transparent={false}
                        minHeight="150px"
                    />
                ) : movimientos.length > 0 ? (
                    <>
                        <p className={styles.subTitle}>HISTORIAL DE MOVIMIENTOS</p>
                        {groupedMovements.map(([dateGroup, groupMovements]) => (
                            <div key={dateGroup}>
                                <p className={styles.subTitle}>{dateGroup}</p>
                                {groupMovements.map((movimiento, index) => (
                                    <ItemView
                                        key={movimiento.id || index}
                                        title={`${movimiento.type === 'entrada' ? 'Entrada' : 'Salida'} - ${movimiento.quantity} ${codeMeasure}`}
                                        description={
                                            <div>
                                                <div>{movimiento.observations || 'Sin observaciones'}</div>
                                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                    {new Date(movimiento.date).toLocaleDateString()}
                                                    {movimiento.type === 'entrada' && movimiento.proveedor?.name && ` • ${movimiento.proveedor.name}`}
                                                    {movimiento.type === 'salida' && movimiento.cliente?.name && ` • ${movimiento.cliente.name}`}
                                                </div>
                                            </div>
                                        }
                                        icon={movimiento.type === 'entrada' ? 'plus-circle' : 'minus-circle'}
                                        arrow={false}
                                        colorIcon={movimiento.type === 'entrada' ? 'verde' : 'rojo'}
                                        flot3={movimiento?.estado === 'anulado' ? 'Anulado' : ''}
                                        flot1={movimiento?.estado === 'anulado' ? '' : 'Finalizado'}
                                        onClick={() => onMovimientoClick(movimiento)}
                                    />
                                ))}
                            </div>
                        ))}
                    </>
                ) : (
                    <NoData
                        icon="history"
                        title="No hay movimientos registrados"
                        detail="Este producto no tiene historial de movimientos aún"
                        transparent={false}
                        minHeight="150px"
                    />
                )}
            </div>
        </ViewModal>
    );
}

export default ModalMovimientos;
