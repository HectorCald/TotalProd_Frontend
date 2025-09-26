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
function VerProducto({ isOpen, setIsOpen, registro, onProductUpdated, onProductDeleted, preciosTipos = [], loadingPrecios = false }) {

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isRecetaOpen, setIsRecetaOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
    const [isPreciosOpen, setIsPreciosOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientosList, setLoadingMovimientosList] = useState(false);

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
    }, []);

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
            const movimientosResponse = await movimientosAlmacenService.getByProduct(registro.id);
            const tieneMovimientos = movimientosResponse.success && movimientosResponse.data && movimientosResponse.data.length > 0;

            // Verificar si tiene pedidos
            const pedidosResponse = await pedidosAcopioService.verificarProductoEnPedidos(registro.id);
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
            const response = await productsAlmacenService.delete(registro.id);
            if (response.success) {
                onProductDeleted(registro.id);
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

    // Validar que registro existe
    if (!registro) {
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
                <h1 className={styles.title}>{registro.name}</h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
                <div className={styles.content}>
                    <Dato
                        label="Descripción"
                        value={registro.description || '--'}
                    />
                    <Dato
                        label="Stock"
                        value={`${registro.stock || 0} unidades`}
                    />
                    <Dato
                        label="Código de barras"
                        value={registro.codigo_barras || '--'}
                    />
                    <Dato
                        label="Categoría"
                        value={registro.category_name || '--'}
                    />
                </div>


                {/* Botones de acciones */}
                {/* Botón para ver precios - siempre visible */}
                {registro?.price_product && registro.price_product.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label='Precios'
                        onClick={() => setIsPreciosOpen(true)}
                    />
                )}

                {/* Botón para ver receta - solo si tiene receta */}
                {registro?.recetas && registro.recetas.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label='Receta'
                        onClick={() => setIsRecetaOpen(true)}
                    />
                )}

                {/* Botón para ver movimientos - siempre visible */}
                <Boton
                    className='btn-gray'
                    label={`Movimientos (${movimientos.length})`}
                    onClick={() => setIsMovimientosOpen(true)}
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
                    <p className={styles.subTitle}>¿Eliminar el producto "{registro?.name}"? Esta acción es irreversible y puede afectar registros relacionados.</p>
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
                        />
                    </div>

                </div>
            </ViewModal>


            {/* Modal de editar*/}
            <EditarAgregar
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                data={registro}
                tipo='editar'
                onProductUpdated={onProductUpdated}
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
                    {registro?.recetas && registro.recetas.length > 0 && (
                        <>
                            <Dato
                                label="Descripción de la receta"
                                value={registro.recetas[0]?.descripcion || '--'}
                            />

                            {registro.recetas[0]?.recetas_detalle && registro.recetas[0].recetas_detalle.length > 0 && (
                                <>
                                    <p className={styles.subTitle}>INGREDIENTES</p>
                                    <div className={styles.content}>
                                        {registro.recetas[0].recetas_detalle.map((detalle, index) => (
                                            <Dato
                                                label={detalle.products_acopio?.name || 'Producto desconocido'}
                                                value={`${detalle.cantidad} ${detalle.products_acopio?.type_measure?.code || ''}`}
                                            />
                                        ))}
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
                        <div className={styles.noData}>
                            <p>Cargando movimientos...</p>
                        </div>
                    ) : movimientos.length > 0 ? (
                        <>
                            <p className={styles.subTitle}>HISTORIAL DE MOVIMIENTOS</p>
                            {groupedMovements.map(([dateGroup, groupMovements]) => (
                                <>
                                    <p className={styles.subTitle}>
                                        {dateGroup}
                                    </p>
                                    {groupMovements.map((movimiento, index) => {
                                        // Para movimientos de almacén, obtener la cantidad del producto específico
                                        const productoMovimiento = movimiento.productos?.find(p => p.producto?.id === registro?.id);
                                        const cantidad = productoMovimiento?.cantidad || 0;

                                        return (
                                            <ItemView
                                                key={movimiento.id || index}
                                                title={`${movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'} - ${cantidad} ud`}
                                                description={
                                                    <div>
                                                        <div>{movimiento.observaciones || 'Sin observaciones'}</div>
                                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                            {new Date(movimiento.fecha).toLocaleDateString()}
                                                            {movimiento.tipo === 'entrada' && movimiento.proveedor?.name && ` • ${movimiento.proveedor.name}`}
                                                            {movimiento.tipo === 'salida' && movimiento.cliente?.name && ` • ${movimiento.cliente.name}`}
                                                        </div>
                                                    </div>
                                                }
                                                icon={movimiento.tipo === 'entrada' ? 'plus-circle' : 'minus-circle'}
                                                arrow={false}
                                            />
                                        );
                                    })}
                                </>
                            ))}
                        </>
                    ) : (
                        <div className={styles.noData}>
                            <p>No hay movimientos registrados</p>
                        </div>
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
                    {registro?.price_product && registro.price_product.length > 0 ? (
                        <div className={styles.content}>
                            {registro.price_product.map((precio, index) => (
                                <Dato
                                    key={precio.id || index}
                                    label={precio.prices_types?.name || 'Precio'}
                                    value={`Bs. ${precio.valor || 0}`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noData}>
                            <p>No hay precios configurados para este producto</p>
                        </div>
                    )}
                </div>
            </ViewModal>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Carga de movimientos - solo cuando está abierto y hay registro */}
            {isOpen && registro?.id && (
                <FetchData
                    service={movimientosAlmacenService}
                    serviceName="movimientosAlmacenService"
                    method="getByProduct"
                    methodParams={[registro.id]}
                    isOpen={isOpen}
                    onDataLoaded={handleMovimientosLoaded}
                    onLoadingStart={() => setLoadingMovimientosList(true)}
                    onLoadingEnd={() => setLoadingMovimientosList(false)}
                />
            )}
        </View>
    );
}
export default VerProducto;