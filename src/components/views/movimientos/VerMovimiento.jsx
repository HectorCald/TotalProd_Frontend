import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import ModalDescarga from '../../ui/ModalDescarga';

function VerMovimiento({ isOpen, setIsOpen, movimiento, tipoMovimiento, onMovimientoAnulado, onMovimientoEliminado }) {
    const [loading, setLoading] = useState(false);
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientosList, setLoadingMovimientosList] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);


    // Cargar los movimientos relacionados
    useEffect(() => {
        const loadMovimientos = async () => {
            if (movimiento?.id && isOpen) {
                setLoadingMovimientosList(true);
                try {
                    let response;
                    if (tipoMovimiento === 'acopio' && movimiento.product_id) {
                        response = await movimientosAcopioService.getByProduct(movimiento.product_id);
                    } else {
                        // Para almacén general, no cargamos movimientos relacionados por ahora
                        setMovimientos([]);
                        setLoadingMovimientosList(false);
                        return;
                    }

                    if (response.success) {
                        // Limitar a los últimos 10 movimientos
                        const limitedMovements = (response.data || []).slice(0, 10);
                        setMovimientos(limitedMovements);
                    } else {
                        setMovimientos([]);
                    }
                } catch (error) {
                    console.error('Error cargando movimientos:', error);
                    setMovimientos([]);
                } finally {
                    setLoadingMovimientosList(false);
                }
            }
        };

        loadMovimientos();
    }, [movimiento?.id, isOpen, tipoMovimiento]);

    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Detalles
                    {movimiento?.estado === 'anulado' ? (
                        <div 
                            className={styles.iconButton} 
                            onClick={() => setIsEliminarOpen(true)}
                        >
                            <BoxIcon
                                name='trash'
                                className={styles.iconTrash}
                            />
                        </div>
                    ) : (
                        <div 
                            className={styles.iconButton} 
                            onClick={() => setIsAnularOpen(true)}
                        >
                            <BoxIcon
                                name='no-entry'
                                className={styles.iconTrash}
                            />
                        </div>
                    )}
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                <div className={styles.content}>
                    <Dato
                        label="Tipo"
                        value={movimiento?.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                    />
                    <Dato
                        label="Estado"
                        value={movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado'}
                        especial={movimiento?.estado === 'anulado' ? 'red' : 'green'}
                    />
                    {tipoMovimiento === 'acopio' && (
                        <Dato
                            label="Cantidad"
                            value={`${movimiento?.quantity || '0'} ${movimiento?.product?.type_measure?.code || ''}`}
                        />
                    )}
                    {tipoMovimiento === 'acopio' && (
                        <Dato
                            label="Producto"
                            value={movimiento?.product?.name || 'Sin producto'}
                        />
                    )}
                    <Dato
                        label="Observaciones"
                        value={movimiento?.observations || 'Sin observaciones'}
                    />
                    <Dato
                        label="Fecha"
                        value={new Date(tipoMovimiento === 'acopio' ? movimiento?.date : movimiento?.fecha).toLocaleString()}
                    />

                    {movimiento?.tipo === 'entrada' && movimiento?.proveedor?.name && (
                        <Dato
                            label="Proveedor"
                            value={movimiento.proveedor.name}
                        />
                    )}
                    {movimiento?.tipo === 'salida' && movimiento?.cliente?.name && (
                        <Dato
                            label="Cliente"
                            value={movimiento.cliente.name}
                        />
                    )}
                    {movimiento?.metodo_pago && (
                        <Dato
                            label="Método de pago"
                            value={movimiento.metodo_pago}
                        />
                    )}
                    {/* Total calculado para movimientos de almacén */}
                    {tipoMovimiento === 'almacen' && movimiento?.productos && movimiento.productos.length > 0 && (
                        <Dato
                            label="Total del Movimiento"
                            value={`Bs. ${(movimiento.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0)).toFixed(2)}`}
                        />
                    )}


                </div>
                {tipoMovimiento === 'almacen' && <p className={styles.subTitle}>DETALLES DE PRODUCTOS Y SUBTOTAL</p>}
                {/* Botón para ver productos - solo para movimientos de almacén con múltiples productos */}
                {tipoMovimiento === 'almacen' && movimiento?.productos && movimiento.productos.length > 0 && (
                    <div className={styles.content} style={{ padding: '10px 15px' }}>
                        <Boton
                            className='btn-default'
                            label={`Ver Productos (${movimiento.productos.length})`}
                            onClick={() => setIsProductosOpen(true)}
                        />
                    </div>
                )}

                    <Boton
                        className='btn-default'
                        label='Descargar Movimiento'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsDescargaOpen(true)}
                    />
            </div>



            {/* Modal de productos */}
            <ViewModal isOpen={isProductosOpen} setIsOpen={setIsProductosOpen}>
                <HeaderModal
                    title="Productos del Movimiento"
                    onClose={() => setIsProductosOpen(false)}
                />
                <div className={styles.modalContent}>
                    {movimiento?.productos && movimiento.productos.length > 0 && (
                        <>
                            <p className={styles.subTitle}>PRODUCTOS INCLUIDOS</p>

                            {movimiento.productos.map((productoMovimiento, index) => (
                                <ItemView
                                    title={productoMovimiento.producto?.name || 'Sin nombre'}
                                    description={`${productoMovimiento.cantidad || 0} ud - ${productoMovimiento.precio_unitario || 0} BOB`}
                                    flot2={productoMovimiento.subtotal + ' BOB' || 0}
                                />
                            ))}

                        </>
                    )}
                </div>
            </ViewModal>

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Movimiento"
                subtitulo="Selecciona el formato que prefieras para descargar este movimiento."
            />

            {/* Modal de anular movimiento */}
            <ViewModal isOpen={isAnularOpen} setIsOpen={setIsAnularOpen}>
                <HeaderModal
                    title="Anular Movimiento"
                    onClose={() => setIsAnularOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas anular este movimiento? Esta acción no se puede deshacer y si en el movimiento se consumio materia prima se devolvera el peso correspondiente.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Sí, anular'
                            style={{ marginTop: 'auto' }}
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    let response;
                                    if (tipoMovimiento === 'acopio') {
                                        response = await movimientosAcopioService.anular(movimiento.id);
                                    } else {
                                        response = await movimientosAlmacenService.anular(movimiento.id);
                                    }

                                    if (response.success) {
                                        setIsAnularOpen(false);
                                        setIsOpen(false);
                                        
                                        if (onMovimientoAnulado) {
                                            onMovimientoAnulado(movimiento.id);
                                        }
                                    } else {
                                        mostrarNotificacion('error', response.message || 'Error al anular el movimiento');
                                    }
                                } catch (error) {
                                    console.error('Error anulando movimiento:', error);
                                    mostrarNotificacion('error', 'Error al anular el movimiento');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            loading={loading}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsAnularOpen(false)}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de eliminar movimiento */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Movimiento"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar permanentemente este movimiento? Esta acción no se puede deshacer.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Sí, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    let response;
                                    if (tipoMovimiento === 'acopio') {
                                        response = await movimientosAcopioService.eliminar(movimiento.id);
                                    } else {
                                        response = await movimientosAlmacenService.eliminar(movimiento.id);
                                    }

                                    if (response.success) {
                                        setIsEliminarOpen(false);
                                        setIsOpen(false);
                                        
                                        if (onMovimientoEliminado) {
                                            onMovimientoEliminado(movimiento.id);
                                        }
                                    } else {
                                        mostrarNotificacion('error', response.message || 'Error al eliminar el movimiento');
                                    }
                                } catch (error) {
                                    console.error('Error eliminando movimiento:', error);
                                    mostrarNotificacion('error', 'Error al eliminar el movimiento');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            loading={loading}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(false)}
                        />
                    </div>
                </div>
            </ViewModal>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}
export default VerMovimiento;
