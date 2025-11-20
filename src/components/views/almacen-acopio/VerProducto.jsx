import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import productsAcopioService from '../../../services/productsAcopioService';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import FetchData from '../../mixed/FetchData';
import NoData from '../../common/NoData';
import { formatProductoAcopioLog, prepareLogPayload } from '../../../utils/logFormatters';
import useHistorialLogger from '../../ui/HistorialLogger';
import VerMovimientoAcopio from '../movimientos/VerMovimientoAcopio';


function VerProducto({ isOpen, setIsOpen, registro, onProductUpdated, onProductDeleted, typeMeasures = [] }) {

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isRecetaOpen, setIsRecetaOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientosList, setLoadingMovimientosList] = useState(false);
    const [movimientosLoaded, setMovimientosLoaded] = useState(false);
    const [isVerMovimientoOpen, setIsVerMovimientoOpen] = useState(false);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

    // Estado local para el producto actual
    const [productoActual, setProductoActual] = useState(registro);

    const { logAccion } = useHistorialLogger({
        modulo: 'Almacén Acopio'
    });

    // Actualizar el estado local cuando cambie el prop registro
    useEffect(() => {
        setProductoActual(registro);
    }, [registro]);

    // Resetear movimientos cuando cambia el producto
    useEffect(() => {
        setMovimientos([]);
        setMovimientosLoaded(false);
    }, [registro?.id]);

    // Agrupar movimientos por fecha usando useMemo
    const groupedMovements = useMemo(() => {
        if (!movimientos || movimientos.length === 0) return [];

        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterday = new Date(todayOnly);
        yesterday.setDate(yesterday.getDate() - 1);

        const groups = {
            'Hoy': [],
            'Ayer': [],
            'Esta semana': [],
            'Este mes': [],
            'Anteriores': []
        };

        movimientos.forEach(movement => {
            // Parsear la fecha correctamente (timestamp completo)
            const movementDate = new Date(movement.date);
            const movementDateOnly = new Date(movementDate.getFullYear(), movementDate.getMonth(), movementDate.getDate());
            const diffTime = todayOnly - movementDateOnly;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                groups['Hoy'].push(movement);
            } else if (diffDays === 1) {
                groups['Ayer'].push(movement);
            } else if (diffDays <= 7) {
                groups['Esta semana'].push(movement);
            } else if (diffDays <= 30) {
                groups['Este mes'].push(movement);
            } else {
                groups['Anteriores'].push(movement);
            }
        });

        // Ordenar movimientos dentro de cada grupo por timestamp (más reciente primero)
        Object.keys(groups).forEach(groupKey => {
            groups[groupKey].sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA; // Orden descendente (más reciente primero)
            });
        });

        // Filtrar grupos vacíos
        return Object.entries(groups).filter(([_, movements]) => movements.length > 0);
    }, [movimientos]);
    // Función para manejar cuando se cargan los movimientos
    const handleMovimientosLoaded = useCallback((data) => {
        // Limitar a los últimos 10 movimientos
        const limitedMovements = (data || []).slice(0, 10);
        setMovimientos(limitedMovements);
        setMovimientosLoaded(true);
    }, []);

    const handleMovimientoClick = (movimiento) => {
        setMovimientoSeleccionado(movimiento);
        setIsMovimientosOpen(false);
        setIsVerMovimientoOpen(true);
    };

    // Función para manejar la actualización del producto localmente
    const handleProductUpdatedLocal = (updatedProduct) => {
        // Actualizar el estado local del producto
        setProductoActual(updatedProduct);
        
        // Llamar al callback del componente padre para actualizar la lista
        if (onProductUpdated) {
            onProductUpdated(updatedProduct);
        }
        
        // Cerrar el modal de editar
        setIsEditarOpen(false);
        
        // La notificación se maneja en AlmacenAcopio.jsx
    };

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

    // Handle para eliminar producto
    const handleDelete = async () => {
        setLoading(true);
        try {
            // Verificar si tiene movimientos
            const movimientosResponse = await movimientosAcopioService.getByProduct(productoActual.id);
            const tieneMovimientos = movimientosResponse.success && movimientosResponse.data && movimientosResponse.data.length > 0;

            // Verificar si tiene pedidos
            const pedidosResponse = await pedidosAcopioService.verificarProductoEnPedidos(productoActual.id);
            const tienePedidos = pedidosResponse.success && pedidosResponse.data && pedidosResponse.data.tienePedidos;

            if (tieneMovimientos) {
                mostrarNotificacion('error', 'No se puede eliminar el producto porque tiene movimientos registrados');
                setLoading(false);
                return;
            }

            if (tienePedidos) {
                mostrarNotificacion('error', 'No se puede eliminar el producto porque está incluido en pedidos');
                setLoading(false);
                return;
            }

            // Si no tiene movimientos ni pedidos, proceder con la eliminación
            const response = await productsAcopioService.delete(productoActual.id);
            if (response.success) {
                const logDatosAntes = formatProductoAcopioLog(productoActual, {
                    typeMeasures
                });
                const { datosAntes, campos } = prepareLogPayload({
                    accion: 'ELIMINAR',
                    datosAntes: logDatosAntes,
                    datosDespues: null
                });
                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: logDatosAntes?.nombre || productoActual?.name || 'Producto de acopio',
                    registroId: productoActual?.id || null,
                    datosAntes,
                    comentario: 'Eliminación de producto de materia prima',
                    campos
                });
                onProductDeleted(productoActual.id);
                setIsDeleteOpen(false);
                setIsOpen(false);
                mostrarNotificacion('success', 'Producto eliminado correctamente');
            } else {
                mostrarNotificacion('error', response.message || 'No se puede eliminar el producto');
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            // Mostrar el mensaje de error del servidor (incluyendo permisos)
            mostrarNotificacion('error', error.message || 'Error al eliminar el producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} title={productoActual.name}/>
            <div className={styles.container}>
                <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
                <div className={styles.content}>
                    <Dato
                        label="Descripción"
                        value={productoActual?.description || 'Sin descripción'}
                    />
                    <Dato
                        label="Cantidad"
                        value={`${parseFloat(productoActual?.quantity || 0).toFixed(2)} ${productoActual?.type_measure?.code || ''}`}
                    />
                    <Dato
                        label="Tipo de medida"
                        value={productoActual?.type_measure?.name || 'No especificado'}
                    />
                    <Dato
                        label="Categoría"
                        value={productoActual?.category?.name || 'Sin categoría'}
                    />
                    <Dato
                        label="Stock mínimo"
                        value={productoActual?.stock_minimo !== undefined && productoActual?.stock_minimo !== null 
                            ? (productoActual?.grup 
                                ? `${productoActual.stock_minimo} ${productoActual?.type_measure?.code || ''} (${Math.floor(productoActual.stock_minimo / productoActual.grup)} grupos + ${productoActual.stock_minimo % productoActual.grup} ${productoActual?.type_measure?.code || ''})`
                                : `${productoActual?.stock_minimo} ${productoActual?.type_measure?.code || ''}`)
                            : 'No establecido'}
                    />
                </div>

                {/* Botones de acciones */}
                {/* Botón para ver receta - solo si tiene receta */}
                {productoActual?.recetas_acopio && productoActual.recetas_acopio.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label='Receta'
                        onClick={() => setIsRecetaOpen(true)}
                    />
                )}

                {/* Botón para ver movimientos - siempre visible */}
                <Boton
                    className='btn-gray'
                    label='Movimientos'
                    onClick={() => {
                        setIsMovimientosOpen(true);
                    }}
                />

                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Editar Producto'
                        onClick={() => setIsEditarOpen(true)}
                    />
                    <Boton
                        className='btn-red'
                        label='Eliminar Producto'
                        onClick={() => setIsDeleteOpen(true)}
                    />
                </div>
            </div>


            {/* Modal de eliminar*/}
            <ViewModal isOpen={isDeleteOpen} setIsOpen={setIsDeleteOpen}>
                <HeaderModal
                    title="Eliminar"
                    onClose={() => setIsDeleteOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Eliminar el producto "{productoActual?.name}"? Esta acción es irreversible y puede afectar registros relacionados.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsDeleteOpen(false)}
                        />
                        <Boton
                            className='btn-red'
                            label='Si, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleDelete}
                            loading={loading}
                            segundosDisabled={5}
                        />
                    </div>

                </div>
            </ViewModal>
            {/* Modal de editar*/}
            <EditarAgregar
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                data={productoActual}
                tipo='editar'
                onProductUpdated={handleProductUpdatedLocal}
                typeMeasures={typeMeasures}
            />
            {/* Modal de receta */}
            <ViewModal isOpen={isRecetaOpen} setIsOpen={setIsRecetaOpen}>
                <HeaderModal
                    title="Receta del Producto"
                    onClose={() => setIsRecetaOpen(false)}
                />
                <div className={styles.modalContent}>
                    {productoActual?.recetas_acopio && productoActual.recetas_acopio.length > 0 && (
                        <>
                            <Dato
                                label="Descripción de la receta"
                                value={productoActual.recetas_acopio[0]?.description || '--'}
                            />

                            {productoActual.recetas_acopio[0]?.recetas_acopio_detalle && productoActual.recetas_acopio[0].recetas_acopio_detalle.length > 0 && (
                                <>
                                    <p className={styles.subTitle}>INGREDIENTES</p>
                                    <div className={styles.content}>
                                        {productoActual.recetas_acopio[0].recetas_acopio_detalle.map((detalle, index) => {
                                            const tm = detalle.products_acopio?.type_measure || {};
                                            const codeMayor = tm.code || '';
                                            let codeMenor = tm.code_menor || '';
                                            let measureValue = tm.value ? Number(tm.value) : null;
                                            if (!measureValue || !codeMenor) {
                                                const map = {
                                                    'kg': { v: 1000, m: 'gr' },
                                                    'Kg': { v: 1000, m: 'gr' },
                                                    'KG': { v: 1000, m: 'gr' },
                                                    'l': { v: 1000, m: 'ml' },
                                                    'L': { v: 1000, m: 'ml' },
                                                    'Lt': { v: 1000, m: 'ml' },
                                                    'm': { v: 1000, m: 'mm' },
                                                };
                                                const f = map[codeMayor];
                                                if (f) {
                                                    measureValue = measureValue || f.v;
                                                    codeMenor = codeMenor || f.m;
                                                }
                                            }
                                            const cantidadNum = parseFloat(String(detalle.cantidad ?? '0').replace(',', '.'));
                                            let valueText = '0';
                                            if (!isNaN(cantidadNum) && cantidadNum > 0) {
                                                if (measureValue && cantidadNum < 1) {
                                                    const menor = Math.round(cantidadNum * measureValue);
                                                    valueText = `${menor} ${codeMenor}`;
                                                } else {
                                                    const rounded = Math.round(cantidadNum * 1000) / 1000;
                                                    const formatted = Number.isInteger(rounded)
                                                        ? `${rounded}`
                                                        : `${rounded}`.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
                                                    valueText = `${formatted} ${codeMayor}`;
                                                }
                                            }
                                            return (
                                                <Dato
                                                    key={detalle.id || index}
                                                    label={detalle.products_acopio?.name || 'Producto desconocido'}
                                                    value={valueText}
                                                />
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </ViewModal>

            {/* Modal de movimientos */}
            <ViewModal isOpen={isMovimientosOpen} setIsOpen={setIsMovimientosOpen}>
                <HeaderModal
                    title="Movimientos"
                    onClose={() => setIsMovimientosOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>HISTORIAL DE MOVIMIENTOS</p>
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

                            {groupedMovements.map(([dateGroup, groupMovements]) => (
                                <>
                                    <p className={styles.subTitle}>{dateGroup}</p>
                                    {groupMovements.map((movimiento, index) => (
                                        <ItemView
                                            key={movimiento.id || index}
                                            title={`${movimiento.type === 'entrada' ? 'Entrada' : 'Salida'} - ${movimiento.quantity} ${productoActual?.type_measure?.code || ''}`}
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
                                            onClick={() => handleMovimientoClick(movimiento)}
                                        />
                                    ))}
                                </>
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

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Carga de movimientos - solo cuando se abre el modal de movimientos y no se han cargado */}
            {isMovimientosOpen && productoActual?.id && !movimientosLoaded && (
                <FetchData
                    service={movimientosAcopioService}
                    serviceName="movimientosAcopioService"
                    method="getByProduct"
                    methodParams={[productoActual.id]}
                    isOpen={isMovimientosOpen}
                    onDataLoaded={handleMovimientosLoaded}
                    onLoadingStart={() => setLoadingMovimientosList(true)}
                    onLoadingEnd={() => setLoadingMovimientosList(false)}
                />
            )}

            <VerMovimientoAcopio
                isOpen={isVerMovimientoOpen}
                setIsOpen={setIsVerMovimientoOpen}
                movimiento={movimientoSeleccionado}
            />
        </View>
    );
}
export default VerProducto;