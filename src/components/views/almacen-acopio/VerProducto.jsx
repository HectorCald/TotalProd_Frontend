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


function VerProducto({ isOpen, setIsOpen, registro, onProductUpdated, onProductDeleted, typeMeasures = [] }) {

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isRecetaOpen, setIsRecetaOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
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
            const movimientosResponse = await movimientosAcopioService.getByProduct(registro.id);
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
            const response = await productsAcopioService.delete(registro.id);
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

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {registro?.name}
                    <div className={styles.iconButton} >
                    </div>
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
                <div className={styles.content}>
                    <Dato
                        label="Descripción"
                        value={registro?.description || 'Sin descripción'}
                    />
                    <Dato
                        label="Cantidad"
                        value={`${parseFloat(registro?.quantity || 0).toFixed(2)} ${registro?.type_measure?.code || ''}`}
                    />
                    <Dato
                        label="Tipo de medida"
                        value={registro?.type_measure?.name || 'No especificado'}
                    />
                    <Dato
                        label="Categoría"
                        value={registro?.category?.name || 'Sin categoría'}
                    />
                </div>

                {/* Botones de acciones */}
                {/* Botón para ver receta - solo si tiene receta */}
                {registro?.recetas_acopio && registro.recetas_acopio.length > 0 && (
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
                typeMeasures={typeMeasures}
            />
            {/* Modal de receta */}
            <ViewModal isOpen={isRecetaOpen} setIsOpen={setIsRecetaOpen}>
                <HeaderModal
                    title="Receta del Producto"
                    onClose={() => setIsRecetaOpen(false)}
                />
                <div className={styles.modalContent}>
                    {registro?.recetas_acopio && registro.recetas_acopio.length > 0 && (
                        <>
                            <Dato
                                label="Descripción de la receta"
                                value={registro.recetas_acopio[0]?.description || 'Sin descripción'}
                            />

                            {registro.recetas_acopio[0]?.recetas_acopio_detalle && registro.recetas_acopio[0].recetas_acopio_detalle.length > 0 && (
                                <>
                                    <p className={styles.subTitle}>INGREDIENTES</p>
                                    <div className={styles.content}>
                                        {registro.recetas_acopio[0].recetas_acopio_detalle.map((detalle, index) => (
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
                    title="Movimientos"
                    onClose={() => setIsMovimientosOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>HISTORIAL DE MOVIMIENTOS</p>
                    {loadingMovimientosList ? (
                        <div className={styles.noData}>
                            <p>Cargando movimientos...</p>
                        </div>
                    ) : movimientos.length > 0 ? (
                        <>

                            {groupedMovements.map(([dateGroup, groupMovements]) => (
                                <>
                                    <p className={styles.subTitle}>{dateGroup}</p>
                                    {groupMovements.map((movimiento, index) => (
                                        <ItemView
                                            key={movimiento.id || index}
                                            title={`${movimiento.type === 'entrada' ? 'Entrada' : 'Salida'} - ${movimiento.quantity} ${registro?.type_measure?.code || ''}`}
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
                                        />
                                    ))}
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

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Carga de movimientos - solo cuando está abierto y hay registro */}
            {isOpen && registro?.id && (
                <FetchData
                    service={movimientosAcopioService}
                    serviceName="movimientosAcopioService"
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