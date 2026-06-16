import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/old/Dato';
import Boton from '../../common/botones/Boton';
import EditarAgregar from './EditarAgregar';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import ItemView from '../../common/old/ItemView';
import ListaProfesional from '../../common/old/ListaProfesional';
import Notification from '../../common/old/Notification';
import FetchData from '../../mixed/FetchData';
import VerMovimientoAcopio from '../movimientos/VerMovimientoAcopio';
import ModalEliminar from './modales/ModalEliminar';
import ModalMovimientos from './modales/ModalMovimientos';

function formatCantidadIngredienteAcopio(detalle) {
    const tm = detalle.products_acopio?.type_measure || {};
    const codeMayor = tm.code || '';
    let codeMenor = tm.code_menor || '';
    let measureValue = tm.value ? Number(tm.value) : null;
    if (!measureValue || !codeMenor) {
        const map = {
            'kg': { v: 1000, m: 'gr' }, 'Kg': { v: 1000, m: 'gr' }, 'KG': { v: 1000, m: 'gr' },
            'l': { v: 1000, m: 'ml' }, 'L': { v: 1000, m: 'ml' }, 'Lt': { v: 1000, m: 'ml' },
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
    return valueText;
}

function VerProducto({ isOpen, setIsOpen, registro, onProductUpdated, onProductDeleted, typeMeasures = [] }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientosList, setLoadingMovimientosList] = useState(false);
    const [movimientosLoaded, setMovimientosLoaded] = useState(false);
    const [isVerMovimientoOpen, setIsVerMovimientoOpen] = useState(false);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
    const [productoActual, setProductoActual] = useState(registro);
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });

    const mostrarNotificacion = useCallback((tipo, texto) => {
        setNotification({ isVisible: true, type: tipo, text: texto });
        setTimeout(() => setNotification(prev => ({ ...prev, isVisible: false })), 3000);
    }, []);

    useEffect(() => {
        setProductoActual(registro);
    }, [registro]);

    useEffect(() => {
        setMovimientos([]);
        setMovimientosLoaded(false);
    }, [registro?.id]);

    const groupedMovements = useMemo(() => {
        if (!movimientos || movimientos.length === 0) return [];
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterday = new Date(todayOnly);
        yesterday.setDate(yesterday.getDate() - 1);
        const groups = { 'Hoy': [], 'Ayer': [], 'Esta semana': [], 'Este mes': [], 'Anteriores': [] };
        movimientos.forEach(movement => {
            const movementDate = new Date(movement.date);
            const movementDateOnly = new Date(movementDate.getFullYear(), movementDate.getMonth(), movementDate.getDate());
            const diffDays = Math.ceil((todayOnly - movementDateOnly) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) groups['Hoy'].push(movement);
            else if (diffDays === 1) groups['Ayer'].push(movement);
            else if (diffDays <= 7) groups['Esta semana'].push(movement);
            else if (diffDays <= 30) groups['Este mes'].push(movement);
            else groups['Anteriores'].push(movement);
        });
        Object.keys(groups).forEach(groupKey => {
            groups[groupKey].sort((a, b) => new Date(b.date) - new Date(a.date));
        });
        return Object.entries(groups).filter(([_, movements]) => movements.length > 0);
    }, [movimientos]);

    const handleMovimientosLoaded = useCallback((data) => {
        setMovimientos((data || []).slice(0, 10));
        setMovimientosLoaded(true);
    }, []);

    const handleMovimientoClick = (movimiento) => {
        setMovimientoSeleccionado(movimiento);
        setIsMovimientosOpen(false);
        setIsVerMovimientoOpen(true);
    };

    const handleProductUpdatedLocal = (updatedProduct) => {
        setProductoActual(updatedProduct);
        if (onProductUpdated) onProductUpdated(updatedProduct);
        setIsEditarOpen(false);
    };

    const recetaItems = useMemo(() => {
        const receta = productoActual?.recetas_acopio?.[0];
        if (!receta) return [];
        const descripcion = receta.description?.trim() || 'Sin descripción';
        const detalle = receta.recetas_acopio_detalle || [];
        const ingredientes = detalle.map((d) => {
            const nombre = d.products_acopio?.name || 'Producto desconocido';
            const cantidad = formatCantidadIngredienteAcopio(d);
            return { label: `${nombre} — ${cantidad}` };
        });
        return [
            { label: 'Descripción', children: [{ label: descripcion }] },
            { label: 'Ingredientes', children: ingredientes.length > 0 ? ingredientes : [{ label: 'Sin ingredientes' }] },
        ];
    }, [productoActual?.recetas_acopio]);

    const tituloReceta = productoActual?.name ? `Receta: ${productoActual.name}` : 'Receta';

    if (!productoActual) {
        return (
            <View isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderView onBack={() => setIsOpen(false)} title="Producto" />
                <div className={styles.container}>
                    <p className={styles.subTitle}>No se pudo cargar la información del producto</p>
                </div>
            </View>
        );
    }

    const codeMeasure = productoActual?.type_measure?.code || '';
    const stockMin = productoActual?.stock_minimo;
    const grup = productoActual?.grup ?? 0;
    const stockMinimoValue = stockMin !== undefined && stockMin !== null
        ? (grup <= 0
            ? `${stockMin} ${codeMeasure}`
            : (() => {
                const grupos = Math.floor(stockMin / grup);
                const unidades = stockMin % grup;
                if (grupos === 0 && unidades === 0) return `0 ${codeMeasure}`;
                return `${stockMin} ${codeMeasure} (${grupos} grupos + ${unidades} ${codeMeasure})`;
            })())
        : 'No establecido';

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{productoActual.name || 'Producto'}</h1>
                        <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
                    </div>
                </div>

                <div className={styles.contentRow}>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Información del Producto"
                                transparent={true}
                                icon="package"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <Dato label="Descripción" value={productoActual?.description || 'Sin descripción'} vertical={false} />
                            <Dato
                                label="Cantidad"
                                value={`${parseFloat(productoActual?.quantity || 0).toFixed(2)} ${codeMeasure}`}
                                vertical={false}
                            />
                            <Dato label="Tipo de medida" value={productoActual?.type_measure?.name || 'No especificado'} vertical={false} />
                            <Dato label="Categoría" value={productoActual?.category?.name || 'Sin categoría'} vertical={false} />
                            <Dato label="Stock mínimo" value={stockMinimoValue} vertical={false} />
                        </div>
                    </div>

                    {recetaItems.length > 0 && (
                        <div className={styles.contentHalf}>
                            <div className={styles.content} style={{ height: '100%' }}>
                                <ItemView
                                    title="Receta"
                                    transparent={true}
                                    icon="book"
                                    iconShape="square"
                                    style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                />
                                <ListaProfesional items={recetaItems} />
                            </div>
                        </div>
                    )}
                </div>

                <Boton
                    className='btn-gray'
                    label='Movimientos'
                    onClick={() => setIsMovimientosOpen(true)}
                    iconName='transfer-alt'
                    hideTextOnMobile={true}
                />

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
            </div>

            <ModalEliminar
                isOpen={isDeleteOpen}
                setIsOpen={setIsDeleteOpen}
                productoActual={productoActual}
                typeMeasures={typeMeasures}
                setIsOpenVerProducto={setIsOpen}
                onProductDeleted={onProductDeleted}
                onSuccess={(msg) => mostrarNotificacion('success', msg)}
                onError={(msg) => mostrarNotificacion('error', msg)}
            />

            <EditarAgregar
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                data={productoActual}
                tipo='editar'
                onProductUpdated={handleProductUpdatedLocal}
                typeMeasures={typeMeasures}
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

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

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
