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
    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Movimientos del Producto"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                {loadingMovimientosList ? (
                    <NoData
                        icon="loader-alt"
                        title="Cargando movimientos..."
                        detail="Obteniendo el historial completo de movimientos del producto"
                        transparent={true}
                        minHeight="150px"
                    />
                ) : movimientos.length > 0 ? (
                    <>
                        <p className={styles.subTitle}>HISTORIAL DE MOVIMIENTOS</p>
                        {groupedMovements.map(([dateGroup, groupMovements]) => (
                            <div key={dateGroup}>
                                <p className={styles.subTitle}>{dateGroup}</p>
                                {groupMovements.map((movimiento, index) => {
                                    const productoMovimiento = movimiento.productos?.find(p => p.producto?.id === productoActual?.id);
                                    const cantidad = parseFloat(productoMovimiento?.cantidad) || 0;
                                    const grup = parseFloat(productoMovimiento?.producto?.grup) || 0;
                                    const esAgrupado = movimiento?.agrupado && grup > 0;
                                    let cantidadTexto;
                                    if (esAgrupado) {
                                        const grupos = Math.floor(cantidad / grup);
                                        const unidades = cantidad % grup;
                                        cantidadTexto = unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                                    } else {
                                        cantidadTexto = `${cantidad} ud`;
                                    }
                                    return (
                                        <ItemView
                                            key={`${movimiento.id}-${index}`}
                                            title={`${movimiento.type === 'entrada' ? 'Entrada' : 'Salida'} - ${cantidadTexto}`}
                                            description={
                                                <div>
                                                    <div>{movimiento.observaciones || 'Sin observaciones'}</div>
                                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                        {new Date(movimiento.fecha).toLocaleDateString()}
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
                                    );
                                })}
                            </div>
                        ))}
                    </>
                ) : (
                    <NoData
                        icon="history"
                        title="No hay movimientos"
                        detail="Este producto no tiene historial de movimientos registrado aún"
                        transparent={false}
                        minHeight="150px"
                    />
                )}
            </div>
        </ViewModal>
    );
}

export default ModalMovimientos;
