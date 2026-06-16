import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/old/Dato';
import Boton from '../../common/botones/Boton';
import EditarAgregar from './EditarAgregar';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import ItemView from '../../common/old/ItemView';
import FetchData from '../../mixed/FetchData';
import Text from '../../common/old/Text';
import VerMovimiento from '../movimientos/VerMovimiento';
import ModalEliminar from './modales/ModalEliminar';
import ModalReceta from './modales/ModalReceta';
import ModalMovimientos from './modales/ModalMovimientos';

function VerProducto({ isOpen, setIsOpen, registro, onProductUpdated, onProductDeleted, preciosTipos = [], loadingPrecios = false }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isRecetaOpen, setIsRecetaOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientosList, setLoadingMovimientosList] = useState(false);
    const [movimientosLoaded, setMovimientosLoaded] = useState(false);
    const [isVerMovimientoOpen, setIsVerMovimientoOpen] = useState(false);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

    // Estado local para el producto actual
    const [productoActual, setProductoActual] = useState(registro);

    // Actualizar el estado local cuando cambie el prop registro
    useEffect(() => {
        console.log('🔍 [VerProducto] es_asociado:', registro?.es_asociado);
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
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{productoActual.name}</h1>
                        <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
                    </div>
                </div>
                {/* Layout de dos columnas como en VerMovimiento */}
                <div className={styles.contentRow}>
                    {/* Primera columna: Información del producto */}
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Información del Producto"
                                transparent={true}
                                icon="package"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <Dato label="Descripción" value={productoActual.description || '--'} vertical={false} />
                            <Dato
                                label="Stock"
                                value={(() => {
                                    const stock = productoActual.stock ?? 0;
                                    const grup = productoActual.grup ?? 0;
                                    if (grup <= 0) return `${stock} unidades`;
                                    const grupos = Math.floor(stock / grup);
                                    const unidades = stock % grup;
                                    if (grupos === 0 && unidades === 0) return '0 unidades';
                                    return `${stock} unidades (${grupos} grupos + ${unidades} unidades)`;
                                })()}
                                vertical={false}
                            />
                            <Dato label="Código de barras" value={productoActual.codigo_barras || '--'} vertical={false} />
                            {(productoActual.grup ?? 0) > 0 ? (
                                <Dato label="Grupo" value={`${productoActual.grup} unidades`} vertical={false} />
                            ) : null}
                            <Dato label="Categoría" value={productoActual.category_name || '--'} vertical={false} />
                            <Dato
                                label="Stock mínimo"
                                value={productoActual.stock_minimo !== undefined && productoActual.stock_minimo !== null
                                    ? (() => {
                                        const min = productoActual.stock_minimo;
                                        const grup = productoActual.grup ?? 0;
                                        if (grup <= 0) return `${min} unidades`;
                                        const grupos = Math.floor(min / grup);
                                        const unidades = min % grup;
                                        if (grupos === 0 && unidades === 0) return '0 unidades';
                                        return `${min} unidades (${grupos} grupos + ${unidades} unidades)`;
                                    })()
                                    : 'No establecido'}
                                vertical={false}
                            />
                            {/** 
                            <Dato
                                label="Costo de producción"
                                value={productoActual.costo_produccion !== undefined && productoActual.costo_produccion !== null
                                    ? `Bs. ${productoActual.costo_produccion}`
                                    : 'No establecido'}
                                vertical={false}
                            />
                            */}
                        </div>
                        {/* Botón para ver receta - habilitado solo si tiene receta */}
                        <Boton
                            className='btn-gray'
                            label='Receta'
                            onClick={() => setIsRecetaOpen(true)}
                            iconName='book'
                            disabled={!(productoActual?.recetas?.length > 0)}
                        />


                        {/* Botón para ver movimientos */}
                        <Boton
                            className='btn-gray'
                            label='Movimientos'
                            onClick={() => setIsMovimientosOpen(true)}
                            iconName='transfer-alt'
                        />
                    </div>
                    {/* Segunda columna: Precios */}
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Precios"
                                transparent={true}
                                icon="dollar-circle"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            {productoActual?.price_product && productoActual.price_product.length > 0 ? (
                                productoActual.price_product.map((precio, index) => (
                                    <Dato
                                        key={precio.id || index}
                                        label={precio.prices_types?.name || 'Precio'}
                                        value={`Bs. ${precio.valor ?? 0}`}
                                        vertical={false}
                                    />
                                ))
                            ) : (
                                <Dato label="Precios" value="No hay precios configurados" vertical={false} />
                            )}
                        </div>
                    </div>
                </div>



                {/* Mensaje informativo para productos asociados */}
                {productoActual?.es_asociado && (
                    <Text type="info" icon="info-circle" align="left">
                        Este producto pertenece a una empresa asociada. No es posible modificarlo o eliminarlo desde esta cuenta.
                    </Text>
                )}

                {/* Solo mostrar botones de editar y eliminar si NO es un producto asociado */}
                {!productoActual?.es_asociado && (
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Editar Producto'
                            onClick={() => setIsEditarOpen(true)}
                            iconName='edit'
                            hideTextOnMobile={true}
                        />
                        <Boton
                            className='btn-red'
                            label='Eliminar Producto'
                            onClick={() => setIsDeleteOpen(true)}
                            iconName='trash'
                            hideTextOnMobile={true}
                        />
                    </div>
                )}
            </div>


            <ModalEliminar
                isOpen={isDeleteOpen}
                setIsOpen={setIsDeleteOpen}
                productoActual={productoActual}
                preciosTipos={preciosTipos}
                setIsOpenVerProducto={setIsOpen}
                onProductDeleted={onProductDeleted}
            />

            {/* Modal de editar */}
            <EditarAgregar
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                data={productoActual}
                tipo='editar'
                onProductUpdated={handleProductUpdatedLocal}
                preciosTipos={preciosTipos}
                loadingPrecios={loadingPrecios}
            />
            <ModalReceta
                isOpen={isRecetaOpen}
                setIsOpen={setIsRecetaOpen}
                productoActual={productoActual}
            />

            <ModalMovimientos
                isOpen={isMovimientosOpen}
                setIsOpen={setIsMovimientosOpen}
                productoActual={productoActual}
                movimientos={movimientos}
                loadingMovimientosList={loadingMovimientosList}
                groupedMovements={groupedMovements}
                onMovimientoClick={handleMovimientoClick}
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

            <VerMovimiento
                isOpen={isVerMovimientoOpen}
                setIsOpen={setIsVerMovimientoOpen}
                movimiento={movimientoSeleccionado}
            />
        </View>
    );
}
export default VerProducto;