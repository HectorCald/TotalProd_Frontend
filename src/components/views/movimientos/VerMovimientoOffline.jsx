import React, { useMemo, useState, useEffect } from 'react';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Dato from '../../common/Dato';
import ItemView from '../../common/ItemView';
import Boton from '../../common/Boton';
import styles from '../../../styles/view.module.css';
import { formatCurrency } from '../../../utils/numberUtils';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import { guardarLocal, obtenerLocal, OFFLINE_DB_NAME, MOVIMIENTOS_SALIDA_STORE, PRODUCTOS_STORE, CLIENTES_STORE, PRECIOS_STORE } from '../../../utils/indexedDB';
import { restoreOfflineProductsStock } from '../../../utils/offlineMovements';
import { useLayout } from '../../../context/LayoutContext';
import ModalTable from '../../common/ModalTable';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import deudasService from '../../../services/deudasService';
import Notification from '../../common/Notification';
import DescargaMovimientoBuilder from './DescargaMovimientoBuilder';

const useOfflineReferences = () => {
    const [references, setReferences] = useState({
        productos: [],
        clientes: [],
        precios: []
    });

    const loadReferences = async () => {
        try {
            const [productos, clientes, precios] = await Promise.all([
                obtenerLocal(PRODUCTOS_STORE, OFFLINE_DB_NAME),
                obtenerLocal(CLIENTES_STORE, OFFLINE_DB_NAME),
                obtenerLocal(PRECIOS_STORE, OFFLINE_DB_NAME),
            ]);
            setReferences({
                productos: Array.isArray(productos) ? productos : [],
                clientes: Array.isArray(clientes) ? clientes : [],
                precios: Array.isArray(precios) ? precios : []
            });
        } catch (error) {
            console.error('Error cargando referencias offline:', error);
        }
    };

    return { references, loadReferences };
};

const mapMovimientoData = (movimiento, references) => {
    if (!movimiento) return null;
    const { productos: refProductos, clientes: refClientes, precios: refPrecios } = references;

    const productos = (movimiento?.datos?.productos || []).map(producto => {
        const refProducto = refProductos.find(p => p.id === producto.id) || {};
        return {
            ...producto,
            name: refProducto.name || producto.name || 'Sin nombre',
            stock: refProducto.stock,
            grup: refProducto.grup,
        };
    });

    const cliente = (() => {
        const clienteId = movimiento?.datos?.movimientoData?.cliente_id || movimiento?.datos?.clienteInfo?.id;
        if (!clienteId) return null;
        return refClientes.find(c => c.id === clienteId) || movimiento?.datos?.clienteInfo || null;
    })();

    const precio = (() => {
        const precioId = movimiento?.datos?.movimientoData?.precio_id;
        if (!precioId) return null;
        return refPrecios.find(p => p.id === precioId) || null;
    })();

    return {
        ...movimiento,
        productos,
        cliente,
        precio,
    };
};

const removeMovimientoFromQueue = async (movimientoId) => {
    try {
        const movimientos = await obtenerLocal(MOVIMIENTOS_SALIDA_STORE, OFFLINE_DB_NAME);
        const remaining = (movimientos || []).filter(mov => mov.id !== movimientoId);
        await guardarLocal(MOVIMIENTOS_SALIDA_STORE, OFFLINE_DB_NAME, remaining);
        return remaining;
    } catch (error) {
        console.error('Error eliminando movimiento offline:', error);
        return null;
    }
};

function VerMovimientoOffline({
    isOpen,
    setIsOpen,
    movimiento,
    onMovimientoEliminado,
}) {
    const { references, loadReferences } = useOfflineReferences();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const { isLargeScreen } = useLayout();
    const [isRegistering, setIsRegistering] = useState(false);
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const [movimientoDescargaId, setMovimientoDescargaId] = useState(null);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadReferences();
        }
    }, [isOpen, loadReferences]);

    const movimientoMapeado = useMemo(() => mapMovimientoData(movimiento, references), [movimiento, references]);

    const resumen = movimientoMapeado?.resumen || {};
    const datosMovimiento = movimientoMapeado?.datos?.movimientoData || {};
    const productos = movimientoMapeado?.productos || [];

    const subtotal = Number(resumen.subtotal || 0);
    const descuento = subtotal * (Number(resumen.descuentoPorcentaje || 0) / 100);
    const aumento = subtotal * (Number(resumen.aumentoPorcentaje || 0) / 100);
    const total = subtotal - descuento + aumento;

    const productosRows = useMemo(() => {
        return productos.map(producto => {
            const cantidad = Number(producto.cantidad) || 0;
            const precio = Number(producto.precio) || 0;
            const subtotalProducto = Number(producto.subtotal ?? cantidad * precio) || 0;
            return [
                producto.name || 'Sin nombre',
                `${cantidad} ud`,
                `${formatCurrency(precio)} Bs.`,
                `${formatCurrency(subtotalProducto)} Bs.`
            ];
        });
    }, [productos]);

    if (!movimientoMapeado) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        const productosRestaurar = movimiento?.datos?.productosNormalizados || movimiento?.datos?.productos || [];
        const remaining = await removeMovimientoFromQueue(movimientoMapeado.id);
        await restoreOfflineProductsStock(productosRestaurar);
        setIsDeleting(false);
        setIsOpen(false);
        if (onMovimientoEliminado) {
            onMovimientoEliminado(movimientoMapeado.id, remaining);
        }
    };

    const mostrarNotificacion = (type, text) => {
        setNotification({ isVisible: true, type, text });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    const handleRegistrarSalida = async () => {
        if (!movimientoMapeado?.datos?.movimientoData) {
            mostrarNotificacion('error', 'Datos incompletos del movimiento.');
            return;
        }
        setIsRegistering(true);
        try {
            const movimientoPayload = {
                ...(movimientoMapeado.datos.movimientoData || {})
            };
            if (!movimientoPayload.fecha) {
                movimientoPayload.fecha = movimientoMapeado?.datos?.fechaMovimientoEditando || movimientoMapeado?.createdAt || new Date().toISOString();
            }
            const movimientoResponse = await movimientosAlmacenService.create(movimientoPayload);
            if (!movimientoResponse?.success) {
                throw new Error(movimientoResponse?.message || 'No se pudo registrar la salida.');
            }
            const movimientoId = movimientoResponse?.data?.id;

            if (movimientoMapeado.datos.deudaData && movimientoId) {
                try {
                    const deudaPayload = {
                        ...movimientoMapeado.datos.deudaData,
                        movimiento_salida_id: movimientoId
                    };
                    const deudaResponse = await deudasService.create(deudaPayload);
                    if (deudaResponse?.success) {
                        await movimientosAlmacenService.update(movimientoId, { deuda_id: deudaResponse.data.id });
                    }
                } catch (deudaError) {
                    console.warn('Error registrando deuda offline:', deudaError);
                }
            }

            if (movimientoMapeado.datos.pedidoId && movimientoMapeado.datos.pedidoData) {
                try {
                    await pedidosAlmacenService.update(movimientoMapeado.datos.pedidoId, movimientoMapeado.datos.pedidoData);
                } catch (pedidoError) {
                    console.warn('Error actualizando pedido offline:', pedidoError);
                }
            }

            if (movimientoMapeado.datos.pedidoEstadoPayload?.pedidoId && movimientoId) {
                try {
                    await pedidosAlmacenService.updateEstado(
                        movimientoMapeado.datos.pedidoEstadoPayload.pedidoId,
                        'Entregado',
                        movimientoId,
                        movimientoMapeado.datos.pedidoEstadoPayload.metodoPago || resumen?.metodoPago
                    );
                } catch (estadoError) {
                    console.warn('Error actualizando estado de pedido offline:', estadoError);
                }
            }

            const remaining = await removeMovimientoFromQueue(movimientoMapeado.id);
            mostrarNotificacion('success', 'Movimiento sincronizado correctamente.');
            setMovimientoDescargaId(movimientoId);
            setIsDescargaOpen(true);
            setIsOpen(false);
            if (onMovimientoEliminado) {
                onMovimientoEliminado(movimientoMapeado.id, remaining);
            }
        } catch (error) {
            console.error('Error registrando movimiento offline:', error);
            mostrarNotificacion('error', error.message || 'Error al registrar movimiento offline.');
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderModal
                    title="Movimiento offline"
                    onClose={() => setIsOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                    <div className={styles.content}>
                        <Dato label="Fecha" value={formatFechaLiteral(movimientoMapeado.createdAt)} vertical={false} />
                        <Dato label="Hora" value={formatHoraSinSegundos(movimientoMapeado.createdAt)} vertical={false} />
                        <Dato label="Método de pago" value={resumen.metodoPago || datosMovimiento.metodo_pago || '---'} vertical={false} />
                        <Dato label="Tipo de precio" value={movimientoMapeado.precio?.name || '---'} vertical={false} />
                        <Dato label="Modalidad" value={datosMovimiento.agrupado ? 'Agrupado' : 'Unidades'} vertical={false} />
                        <Dato label="Total estimado" value={`${formatCurrency(total)} Bs.`} vertical={false} especial="green" />
                        {resumen.numeroOrden && <Dato label="N° de orden" value={resumen.numeroOrden} vertical={false} />}
                    </div>

                    {movimientoMapeado.cliente && (
                        <>
                            <p className={styles.subTitle}>CLIENTE</p>
                            <ItemView
                                title={movimientoMapeado.cliente?.name || 'Sin nombre'}
                                description={movimientoMapeado.cliente?.email || movimientoMapeado.cliente?.phone || ''}
                                icon="user"
                                transparent={false}
                            />
                        </>
                    )}

                    {(movimientoMapeado?.datos?.movimientoData?.observaciones || movimientoMapeado?.datos?.movimientoData?.concepto) && (
                        <>
                            <p className={styles.subTitle}>DETALLES</p>
                            <div className={styles.content}>
                                {movimientoMapeado?.datos?.movimientoData?.concepto && (
                                    <Dato
                                        label="Concepto"
                                        value={movimientoMapeado?.datos?.movimientoData?.concepto}
                                        vertical={true}
                                    />
                                )}
                                {movimientoMapeado?.datos?.movimientoData?.observaciones && (
                                    <Dato
                                        label="Observaciones"
                                        value={movimientoMapeado?.datos?.movimientoData?.observaciones}
                                        vertical={true}
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {productos.length > 0 && (
                        <Boton
                            className="btn-gray"
                            label={`Productos (${productos.length})`}
                            onClick={() => setIsProductosOpen(true)}
                        />
                    )}

                    <div className={styles.buttons}>
                        <Boton
                            className="btn-original"
                            label="Registrar salida"
                            onClick={handleRegistrarSalida}
                            loading={isRegistering}
                            disabled={isDeleting}
                        />
                        <Boton
                            className="btn-red"
                            label="Eliminar"
                            onClick={handleDelete}
                            loading={isDeleting}
                            style={{ marginTop: 'auto' }}
                        />
                    </div>
                </div>
            </ViewModal>

            {isLargeScreen ? (
                <ModalTable
                    isOpen={isProductosOpen}
                    title="Productos del movimiento"
                    headers={['Producto', 'Cantidad', 'Precio unitario', 'Subtotal']}
                    rows={productosRows}
                    onClose={() => setIsProductosOpen(false)}
                />
            ) : (
                <ViewModal isOpen={isProductosOpen} setIsOpen={setIsProductosOpen}>
                    <HeaderModal
                        title="Productos del movimiento"
                        onClose={() => setIsProductosOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        {productos.length > 0 ? (
                            productos.map((producto, index) => (
                                <ItemView
                                    key={`${producto.id}-${index}`}
                                    title={producto.name || 'Sin nombre'}
                                    description={`Cantidad: ${producto.cantidad || 0} • Precio: ${formatCurrency(producto.precio || 0)} Bs.`}
                                    description2={`Subtotal: ${formatCurrency(producto.subtotal ?? (producto.precio || 0) * (producto.cantidad || 0))} Bs.`}
                                    icon="package"
                                    transparent={false}
                                />
                            ))
                        ) : (
                            <p style={{ color: 'var(--text-color)' }}>No se registraron productos.</p>
                        )}
                    </div>
                </ViewModal>
            )}
            <DescargaMovimientoBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                movimientoId={movimientoDescargaId}
                tipo="almacen"
            />
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </>
    );
}

export default VerMovimientoOffline;


