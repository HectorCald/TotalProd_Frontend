import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import productsAlmacenService from '../../../services/productsAlmacenService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import FetchData from '../../mixed/FetchData';
import NoData from '../../common/NoData';
import { formatProductoAlmacenLog, prepareLogPayload } from '../../../utils/logFormatters';
import useHistorialLogger from '../../ui/HistorialLogger';
function VerProducto({ isOpen, setIsOpen, registro, onProductUpdated, onProductDeleted, preciosTipos = [], loadingPrecios = false }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isRecetaOpen, setIsRecetaOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
    const [isPreciosOpen, setIsPreciosOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientosList, setLoadingMovimientosList] = useState(false);
    const [movimientosLoaded, setMovimientosLoaded] = useState(false);

    // Estado local para el producto actual
    const [productoActual, setProductoActual] = useState(registro);

    const { logAccion } = useHistorialLogger({
        modulo: 'Almacén General'
    });

    // Actualizar el estado local cuando cambie el prop registro
    useEffect(() => {
        setProductoActual(registro);
    }, [registro]);

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
            const movementDate = new Date(movement.fecha || movement.date);
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
                const dateA = new Date(a.fecha || a.date);
                const dateB = new Date(b.fecha || b.date);
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
        
        // La notificación se maneja en AlmacenGeneral.jsx
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
            // Verificar si tiene movimientos (ULTRA OPTIMIZADO)
            const movimientosResponse = await movimientosAlmacenService.hasMovements(productoActual.id);
            const tieneMovimientos = movimientosResponse.success && movimientosResponse.hasMovements;

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
            const response = await productsAlmacenService.delete(productoActual.id);
            
            if (response.success) {
                const logDatosAntes = formatProductoAlmacenLog(productoActual, {
                    precioTipos: preciosTipos
                });
                const { datosAntes, campos } = prepareLogPayload({
                    accion: 'ELIMINAR',
                    datosAntes: logDatosAntes,
                    datosDespues: null
                });
                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: logDatosAntes?.nombre || productoActual?.name || 'Producto de almacén',
                    registroId: productoActual?.id || null,
                    datosAntes,
                    comentario: 'Eliminación de producto de almacén',
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

    // Validar que productoActual existe
    if (!productoActual) {
        return (
            <View isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderView onBack={() => setIsOpen(false)} />
                <div className={styles.container}>
                    <h1 className={styles.title}>Error</h1>
                    <p className={styles.subTitle}>No se pudo cargar la información del producto</p>
                </div>
            </View>
        );
    }

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>{productoActual.name}</h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
                <div className={styles.content}>
                    <Dato
                        label="Descripción"
                        value={productoActual.description || '--'}
                    />
                    <Dato
                        label="Stock"
                        value={
                            productoActual.grup 
                                ? `${productoActual.stock || 0} unidades (${Math.floor((productoActual.stock || 0) / productoActual.grup)} grupos + ${(productoActual.stock || 0) % productoActual.grup} unidades)`
                                : `${productoActual.stock || 0} unidades`
                        }
                    />
                    <Dato
                        label="Código de barras"
                        value={productoActual.codigo_barras || '--'}
                    />
                    <Dato
                        label="Grupo"
                        value={productoActual.grup ? `${productoActual.grup} unidades` : 'No agrupado'}
                    />
                    <Dato
                        label="Categoría"
                        value={productoActual.category_name || '--'}
                    />
                    <Dato
                        label="Stock mínimo"
                        value={productoActual.stock_minimo !== undefined && productoActual.stock_minimo !== null 
                            ? (productoActual.grup 
                                ? `${productoActual.stock_minimo} unidades (${Math.floor(productoActual.stock_minimo / productoActual.grup)} grupos + ${productoActual.stock_minimo % productoActual.grup} unidades)`
                                : `${productoActual.stock_minimo} unidades`)
                            : 'No establecido'}
                    />
                    <Dato
                        label="Costo de producción"
                        value={productoActual.costo_produccion !== undefined && productoActual.costo_produccion !== null 
                            ? `Bs. ${productoActual.costo_produccion}` 
                            : 'No establecido'}
                    />
                </div>


                {/* Botones de acciones */}
                {/* Botón para ver precios - siempre visible */}
                {productoActual?.price_product && productoActual.price_product.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label='Precios'
                        onClick={() => setIsPreciosOpen(true)}
                    />
                )}

                {/* Botón para ver receta - solo si tiene receta */}
                {productoActual?.recetas && productoActual.recetas.length > 0 && (
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
                        setMovimientosLoaded(false); // Reset para cargar movimientos
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
                preciosTipos={preciosTipos}
                loadingPrecios={loadingPrecios}
            />
            {/* Modal de receta */}
            <ViewModal isOpen={isRecetaOpen} setIsOpen={setIsRecetaOpen}>
                <HeaderModal
                    title="Receta del Producto"
                    onClose={() => setIsRecetaOpen(false)}
                />
                <div className={styles.modalContent}>
                    {productoActual?.recetas && productoActual.recetas.length > 0 && (
                        <>
                            <Dato
                                label="Descripción de la receta"
                                value={productoActual.recetas[0]?.descripcion || '--'}
                            />

                            {productoActual.recetas[0]?.recetas_detalle && productoActual.recetas[0].recetas_detalle.length > 0 && (
                                <>
                                    <p className={styles.subTitle}>INGREDIENTES</p>
                                    <div className={styles.content}>
                                        {productoActual.recetas[0].recetas_detalle.map((detalle, index) => {
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
                    title="Movimientos del Producto"
                    onClose={() => setIsMovimientosOpen(false)}
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
                                    <p className={styles.subTitle}>
                                        {dateGroup}
                                    </p>
                                    {groupMovements.map((movimiento, index) => {
                                        // Para movimientos de almacén, obtener la cantidad del producto específico
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

            {/* Modal de precios */}
            <ViewModal isOpen={isPreciosOpen} setIsOpen={setIsPreciosOpen}>
                <HeaderModal
                    title="Precios del Producto"
                    onClose={() => setIsPreciosOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>PRECIOS CONFIGURADOS</p>
                    {productoActual?.price_product && productoActual.price_product.length > 0 ? (
                        <div className={styles.content}>
                            {productoActual.price_product.map((precio, index) => (
                                <Dato
                                    key={precio.id || index}
                                    label={precio.prices_types?.name || 'Precio'}
                                    value={`Bs. ${precio.valor || 0}`}
                                />
                            ))}
                        </div>
                    ) : (
                        <NoData 
                            icon="dollar"
                            title="No hay precios"
                            detail="Este producto no tiene precios configurados. Configura los precios para poder vender este producto"
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
                    service={movimientosAlmacenService}
                    serviceName="movimientosAlmacenService"
                    method="getByProduct"
                    methodParams={[productoActual.id]}
                    isOpen={isMovimientosOpen}
                    onDataLoaded={handleMovimientosLoaded}
                    onLoadingStart={() => setLoadingMovimientosList(true)}
                    onLoadingEnd={() => setLoadingMovimientosList(false)}
                />
            )}
        </View>
    );
}
export default VerProducto;