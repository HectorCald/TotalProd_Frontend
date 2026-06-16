import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/old/Dato';
import Boton from '../../common/botones/Boton';
import ItemView from '../../common/old/ItemView';
import DescargaMovimientoBuilder from './DescargaMovimientoBuilder';
import Text from '../../common/old/Text';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import { useLayout } from '../../../context/LayoutContext';
import ModalAnularAcopio from './modales/ModalAnularAcopio';
import ModalEliminarAcopio from './modales/ModalEliminarAcopio';
import StatusBadge from '../../common/old/StatusBadge';

function VerMovimientoAcopio({ isOpen, setIsOpen, movimiento, onMovimientoAnulado, onMovimientoEliminado }) {
    const { isLargeScreen } = useLayout();
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);

    // Estado local para el movimiento actual
    const [movimientoActual, setMovimientoActual] = useState(movimiento);

    // Actualizar el estado local cuando cambie el prop movimiento
    useEffect(() => {
        setMovimientoActual(movimiento);
    }, [movimiento]);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{movimientoActual?.codigo || 'Detalles'}<StatusBadge estado={movimientoActual?.estado} /></h1>
                        <p className={styles.subTitle}> Registrado el {formatFechaLiteral(movimientoActual?.date, !isLargeScreen) + ' - ' + formatHoraSinSegundos(movimientoActual?.date)}</p>
                    </div>
                    <div className={styles.iconButton}>
                        <Boton
                            iconName='download'
                            label='Descargar'
                            className='btn-default'
                            onClick={() => setIsDescargaOpen(true)}
                            hideTextOnMobile={true}
                        />
                    </div>
                </div>

                <div className={styles.contentRow}>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Detalles del Producto"
                                transparent={true}
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                icon="box"
                            />
                            <Dato
                                label="Producto"
                                value={movimientoActual?.product?.name || 'Sin producto'}
                                vertical={false}
                            />
                            <Dato
                                label="Cantidad"
                                value={`${movimientoActual?.quantity || 0} ${movimientoActual?.product?.type_measure?.code || ''}`}
                                vertical={false}
                            />
                            <Dato
                                label="Unidad de medida"
                                value={movimientoActual?.product?.type_measure?.code || 'Sin unidad de medida'}
                                vertical={false}
                            />
                            {movimientoActual?.type === 'entrada' && (
                                <Dato
                                    label="Proveedor"
                                    value={movimientoActual?.proveedor?.name || 'Sin proveedor'}
                                    vertical={false}
                                />
                            )}
                            {movimientoActual?.type === 'salida' && (
                                <Dato
                                    label="Cliente"
                                    value={movimientoActual?.cliente?.name || 'Sin cliente'}
                                    vertical={false}
                                />
                            )}
                        </div>

                    </div>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Detalles del Movimiento"
                                transparent={true}
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                icon="package"
                            />
                            <Dato
                                label="Responsable"
                                value={movimientoActual?.user?.name || movimientoActual?.personal?.name || 'Usuario desconocido'}
                                vertical={false}
                            />
                            <Dato
                                label="Tipo de movimiento"
                                value={movimientoActual?.type === 'entrada' ? 'Entrada' : 'Salida'}
                                vertical={false}
                            />
                            <Dato
                                label="Cantidad"
                                value={`${movimientoActual?.quantity || 0} ${movimientoActual?.product?.type_measure?.code || ''}`}
                                vertical={false}
                            />
                            <Dato
                                label="Sucursal"
                                value={movimientoActual?.sucursal?.name || 'Sin sucursal'}
                                vertical={false}
                            />
                        </div>
                    </div>
                </div>
                {/* Mostrar costo solo para movimientos de entrada */}
                {movimientoActual?.type === 'entrada' && (
                    <div className={styles.content}>

                        <>
                            <ItemView
                                title="Detalles del Costo"
                                transparent={true}
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                icon="money"
                            />
                            <Dato
                                label="Costo"
                                value={`Bs. ${(movimientoActual?.costo || 0).toFixed(2)}`}
                                vertical={false}
                            />
                            <Dato
                                label="Restar Ingredientes"
                                value={movimientoActual?.restar_ingredientes ? 'Sí' : 'No'}
                                vertical={false}
                            />
                            <Dato
                                label="Método de pago"
                                value={movimientoActual?.metodo_pago?.toUpperCase() || 'No especificado'}
                                vertical={false}
                            />
                        </>
                    </div>
                )}

                {/* Observaciones del movimiento */}
                {(movimientoActual?.observations || movimientoActual?.observaciones) && (
                    <div className={styles.content}>
                        <Dato
                            label="Observaciones"
                            value={movimientoActual.observations || movimientoActual.observaciones}
                            vertical={true}
                        />
                    </div>
                )}

                {/* Mensaje informativo si el movimiento está asociado a una entrada que restó ingredientes */}
                {movimientoActual?.movimiento_entrada_id && (
                    <div style={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}>
                        <Text type="info" align="left">
                            Este movimiento no se puede anular porque está asociado a un movimiento de entrada que restó ingredientes. Para anular este movimiento, primero debes anular la entrada asociada.
                        </Text>
                    </div>
                )}

                <div className={styles.buttons}>
                    {/* No mostrar botones si tiene movimiento_entrada_id (es una salida asociada a una entrada) */}
                    {movimientoActual?.movimiento_entrada_id ? null : movimientoActual?.estado === 'anulado' ? (
                        <Boton
                            className='btn-red'
                            label='Eliminar Movimiento'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(true)}
                            hideTextOnMobile={true}
                            iconName='trash'
                        />
                    ) : !movimientoActual?.tiene_pedido_relacionado ? (
                        <Boton
                            className='btn-red'
                            label='Anular Movimiento'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsAnularOpen(true)}
                            hideTextOnMobile={true}
                            iconName='block'
                        />
                    ) : null}
                </div>
            </div>

            {/* Modal de descarga */}
            <DescargaMovimientoBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                movimientoId={movimientoActual?.id}
                movimientoData={movimientoActual}
                tipo="acopio"
            />

            {/* Modal de anular movimiento */}
            <ModalAnularAcopio
                isOpen={isAnularOpen}
                setIsOpen={setIsAnularOpen}
                movimientoActual={movimientoActual}
                setMovimientoActual={setMovimientoActual}
                movimiento={movimiento}
                onMovimientoAnulado={onMovimientoAnulado}
            />

            {/* Modal de eliminar movimiento */}
            <ModalEliminarAcopio
                isOpen={isEliminarOpen}
                setIsOpen={setIsEliminarOpen}
                movimientoActual={movimientoActual}
                setIsOpenVerMovimiento={setIsOpen}
                onMovimientoEliminado={onMovimientoEliminado}
            />
        </View>
    );
}

export default VerMovimientoAcopio;