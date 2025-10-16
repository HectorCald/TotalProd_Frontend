import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import ItemViewInput from '../../common/ItemViewInput';
import Filtros from '../../common/Filtros';
import RefreshIndicator from '../../common/RefreshIndicator';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroCategoriasAcopio from '../../mixed/FiltroCategoriasAcopio';
import FiltroTipoMedida from '../../mixed/FiltroTipoMedida';
import FiltroOrdenamientoAcopio from '../../mixed/FiltroOrdenamientoAcopio';
import FiltroDiferenciaConteo from '../../mixed/FiltroDiferenciaConteo';
import FetchData from '../../mixed/FetchData';
import productsAcopioService from '../../../services/productsAcopioService';
import categoryAcopioService from '../../..//services/categoryAcopioService';
import typeMeasureService from '../../..//services/typeMeasureService';
import Boton from '../../common/Boton';
import Notification from '../../common/Notification';
import conteosService from '../../../services/conteosService';

function AlmacenAcopioAuxiliar({ isOpen, setIsOpen, tipo = 'almacen' }) {
    const { isLargeScreen } = useLayout();

    // Estados: búsqueda y loading
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // UI: envío y notificación
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notif, setNotif] = useState({ visible: false, text: '', type: 'success' });

    // Datos
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [tiposMedida, setTiposMedida] = useState([]);

    // Filtros
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
    const [tipoMedidaFiltro, setTipoMedidaFiltro] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('nombre_asc');
    const [isOpenCategoria, setOpenCategoria] = useState(false);
    const [isOpenTipoMedida, setOpenTipoMedida] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);
    const [isOpenDiferencia, setOpenDiferencia] = useState(false);
    const [filtroDiferencia, setFiltroDiferencia] = useState('todos');

    // Estados de conteo (solo UI), con texto para permitir vacío durante edición
    const [quantityInputs, setQuantityInputs] = useState({}); // { [id]: number }
    const [quantityInputsText, setQuantityInputsText] = useState({}); // { [id]: string }
    const [justificationInputsText, setJustificationInputsText] = useState({}); // { [id]: string }

    // Clave para localStorage
    const STORAGE_KEY = 'conteo_acopio_inputs';
    
    // Estado para verificar si se está repitiendo un conteo
    const [isRepeatingConteo, setIsRepeatingConteo] = useState(false);

    // Funciones para manejar localStorage
    const saveToLocalStorage = useCallback((quantityInputs, quantityInputsText, justificationInputsText) => {
        try {
            const data = {
                quantityInputs,
                quantityInputsText,
                justificationInputsText,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    }, []);

    const loadFromLocalStorage = useCallback(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                // Verificar que no sea muy antiguo (24 horas)
                const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
                if (isRecent) {
                    setQuantityInputs(data.quantityInputs || {});
                    setQuantityInputsText(data.quantityInputsText || {});
                    setJustificationInputsText(data.justificationInputsText || {});
                } else {
                    // Limpiar datos antiguos
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error('Error cargando desde localStorage:', error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const clearLocalStorage = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error limpiando localStorage:', error);
        }
    }, []);

    const handleLoading = useCallback((isLoading) => {
        setShowRefreshIndicator(isLoading);
        setIsRefreshing(isLoading);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
            // Limpiar la variable de repetición cuando se cierre
            localStorage.removeItem('isRepeatingConteo');
        }
    }, [isOpen]);

    // Carga de datos
    const handleProductosLoaded = useCallback((data) => {
        setProductos(data);
    }, []);

    // Mapeo de productos
    const productosMapeados = productos.map(producto => ({
        id: producto.id,
        name: producto.name || '',
        description: producto.description || '',
        quantity: producto.quantity || 0,
        created_at: producto.created_at,
        empresa_id: producto.empresa_id,
        category_id: producto.category_id || '',
        category_name: producto.category?.name || 'Sin categoría',
        category: producto.category || null,
        type_measure_id: producto.type_measure_id || '',
        type_measure: producto.type_measure || null,
        recetas_acopio: producto.recetas_acopio || []
    }));

    // Reset al abrir
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setCategoriaFiltro(null);
            setTipoMedidaFiltro(null);
            setOrdenamiento('nombre_asc');
            
            // Verificar si se está repitiendo un conteo
            const isRepeating = localStorage.getItem('isRepeatingConteo') === 'true';
            setIsRepeatingConteo(isRepeating);
            
            // Borrar la variable después de 1 segundo
            if (isRepeating) {
                setTimeout(() => {
                    localStorage.removeItem('isRepeatingConteo');
                }, 1000);
            }
            
            // Cargar datos guardados del localStorage solo en modo conteo
            if (tipo === 'conteo') {
                loadFromLocalStorage();
            } else {
                // Reiniciar estados de inputs al abrir en modo normal
                setQuantityInputs({});
                setQuantityInputsText({});
                setJustificationInputsText({});
            }
        }
    }, [isOpen, tipo, loadFromLocalStorage]);

    // Efecto para guardar cambios en localStorage (solo en modo conteo)
    useEffect(() => {
        if (tipo === 'conteo' && isOpen) {
            saveToLocalStorage(quantityInputs, quantityInputsText, justificationInputsText);
        }
    }, [quantityInputs, quantityInputsText, justificationInputsText, tipo, isOpen, saveToLocalStorage]);

    // Buscador
    const handleSearchChange = (v) => setSearchQuery(v);
    const handleSearchClear = () => setSearchQuery('');
    const handleSearchToggle = (e) => setIsSearchExpanded(e);

    // Filtros locales
    const handleCategoriaFilter = (id) => setCategoriaFiltro(id);
    const handleTipoMedidaFilter = (id) => setTipoMedidaFiltro(id);
    const handleOrdenamiento = (o) => setOrdenamiento(o);

    // Filtrado y ordenamiento
    const productosFiltrados = productosMapeados.filter(p => {
        const matchSearch = !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchCat = categoriaFiltro === null || (categoriaFiltro === '' ? !p.category_id : p.category_id === categoriaFiltro);
        const matchTm = tipoMedidaFiltro === null || (tipoMedidaFiltro === '' ? !p.type_measure_id : p.type_measure_id === tipoMedidaFiltro);
        return matchSearch && matchCat && matchTm;
    }).sort((a, b) => {
        switch (ordenamiento) {
            case 'nombre_asc': return a.name.localeCompare(b.name);
            case 'nombre_desc': return b.name.localeCompare(a.name);
            case 'cantidad_asc': return parseFloat(a.quantity || 0) - parseFloat(b.quantity || 0);
            case 'cantidad_desc': return parseFloat(b.quantity || 0) - parseFloat(a.quantity || 0);
            default: return a.name.localeCompare(b.name);
        }
    });

    // Nombres de filtros
    const getCategoriaNombre = () => {
        if (categoriaFiltro === null) return 'Categorías';
        if (categoriaFiltro === '') return 'Sin categoría';
        const categoria = categorias.find(c => c.id === categoriaFiltro);
        return categoria ? categoria.name : 'Categorías';
    };
    const getTipoMedidaNombre = () => {
        if (tipoMedidaFiltro === null) return 'Medidas';
        if (tipoMedidaFiltro === '') return 'Sin medida';
        const tm = tiposMedida.find(t => t.id === tipoMedidaFiltro);
        return tm ? tm.name : 'Medidas';
    };
    const getOrdenamientoNombre = () => {
        const map = { 'nombre_asc': 'Nombre A-Z', 'nombre_desc': 'Nombre Z-A', 'cantidad_asc': 'Cantidad ↑', 'cantidad_desc': 'Cantidad ↓' };
        return map[ordenamiento] || 'Ordenamiento';
    };
    const getDiferenciaNombre = () => {
        const map = { 'todos': 'Diferencia', 'faltantes': 'Faltantes', 'sobrantes': 'Sobrantes', 'iguales': 'Iguales' };
        return map[filtroDiferencia] || 'Diferencia';
    };

    const opciones = [
        { label: getCategoriaNombre(), active: categoriaFiltro !== null, onClick: () => setOpenCategoria(true) },
        { label: getTipoMedidaNombre(), active: tipoMedidaFiltro !== null, onClick: () => setOpenTipoMedida(true) },
        { label: getOrdenamientoNombre(), active: ordenamiento !== 'nombre_asc', onClick: () => setOpenOrden(true) },
        ...(tipo === 'conteo' ? [{ label: getDiferenciaNombre(), active: filtroDiferencia !== 'todos', onClick: () => setOpenDiferencia(true) }] : [])
    ];

    // Tabla
    const tableHeaders = [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'quantity', label: 'Cantidad', icon: 'bar-chart-alt-2' },
        { key: 'justificacion', label: 'Justificación', icon: 'message-square-detail' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' },
        { key: 'type_measure_name', label: 'Medida', icon: 'ruler' }
    ];

    const getDiffState = (productoId, rawQty) => {
        const u = quantityInputs[productoId];
        if (u !== undefined) {
            const nu = parseFloat(u);
            const rq = parseFloat(rawQty);
            if (nu < rq) return 'faltante';
            if (nu > rq) return 'sobrante';
            return 'igual';
        }
        return 'igual';
    };

    const productosFiltradosPorDiferencia = productosFiltrados.filter(p => {
        if (tipo !== 'conteo' || filtroDiferencia === 'todos') return true;
        const state = getDiffState(p.id, p.quantity || 0);
        if (filtroDiferencia === 'faltantes') return state === 'faltante';
        if (filtroDiferencia === 'sobrantes') return state === 'sobrante';
        if (filtroDiferencia === 'iguales') return state === 'igual';
        return true;
    });

    const tableData = productosFiltradosPorDiferencia
        .map(p => ({
            id: p.id,
            name: p.name,
            quantity: `${parseFloat(p.quantity || 0).toFixed(2)} ${p.type_measure?.code || ''}`,
            justificacion: justificationInputsText[p.id] || '',
            category_name: p.category_name || '--',
            type_measure_name: p.type_measure?.name || '--'
        }));

    const handleRegistrarConteo = async () => {
        const resultados = productos.map((p) => {
            const rawQty = parseFloat(p.quantity || 0);
            const txt = quantityInputsText[p.id];
            const hasTxt = txt !== undefined && txt !== '';
            const fisico = hasTxt ? parseFloat(txt) : (quantityInputs[p.id] !== undefined ? parseFloat(quantityInputs[p.id]) : rawQty);
            const justificacion = justificationInputsText[p.id] || '';
            return {
                id: p.id,
                quantity_sistema: rawQty,
                quantity_fisico: Number.isFinite(fisico) ? parseFloat(fisico.toFixed(2)) : rawQty,
                justificacion
            };
        });
        // Preparar detalles para API
        const detalles = resultados.map(r => ({
            producto_id: r.id,
            sistema: r.quantity_sistema,
            fisico: r.quantity_fisico,
            justificacion: r.justificacion
        }));

        try {
            setIsSubmitting(true);
            const resp = await conteosService.create({ tipo: 'acopio', observaciones: null, detalles });
            if (!resp.success) throw new Error(resp.message || 'Error');
            
            // Limpiar localStorage y resetear valores después de registrar exitosamente
            clearLocalStorage();
            setQuantityInputs({});
            setQuantityInputsText({});
            setJustificationInputsText({});
            
            setNotif({ visible: true, text: 'Conteo registrado correctamente', type: 'success' });
        } catch (e) {
            setNotif({ visible: true, text: e.message || 'Error al registrar conteo', type: 'error' });
        } finally {
            setTimeout(() => setNotif(prev => ({ ...prev, visible: false })), 2500);
            setIsSubmitting(false);
        }
    };

    const handleRestablecerValores = () => {
        // Limpiar localStorage y resetear todos los valores a originales
        clearLocalStorage();
        setQuantityInputs({});
        setQuantityInputsText({});
        setJustificationInputsText({});
        setNotif({ visible: true, text: 'Valores restablecidos correctamente', type: 'success' });
        setTimeout(() => setNotif(prev => ({ ...prev, visible: false })), 2500);
    };

    return (
        <>
            <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={!isRepeatingConteo}>
                <HeaderView
                    onBack={() => setIsOpen(false)}
                    showSearch={true}
                    searchPlaceholder="Buscar producto"
                    title={tipo === 'conteo' ? 'Conteo de Materia Prima' : 'Materia Prima'}
                    searchValue={searchQuery}
                    onSearchChange={handleSearchChange}
                    onSearchClear={handleSearchClear}
                    searchExpanded={isSearchExpanded}
                    onSearchToggle={handleSearchToggle}
                />
                <div className={`${styles.container}`}>
                    <div className={styles.titleContainer}>
                        <RefreshIndicator isVisible={showRefreshIndicator} isLoading={isRefreshing} />
                    </div>
                    <Filtros options={opciones} />
                    <div className={styles.content}>
                        {isLargeScreen ? (
                            <Table
                                headers={tableHeaders}
                                data={tableData}
                                onRowClick={() => {}}
                                getBadge={() => null}
                                renderCell={(row, key) => {
                                    if (tipo !== 'conteo') return null;
                                    if (key !== 'quantity' && key !== 'justificacion') return null;
                                    const original = productosFiltrados.find(p => p.id === row.id);
                                    if (!original) return null;
                                    const rawQty = parseFloat(original.quantity || 0);
                                    if (key === 'quantity') {
                                        const valueText = quantityInputsText[row.id] !== undefined ? quantityInputsText[row.id] : String(quantityInputs[row.id] !== undefined ? quantityInputs[row.id] : rawQty.toFixed(2));
                                        const state = getDiffState(row.id, rawQty);
                                        return (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={valueText}
                                                onChange={(e) => {
                                                    const text = e.target.value;
                                                    setQuantityInputsText(prev => ({ ...prev, [row.id]: text }));
                                                    if (text === '') return;
                                                    const next = parseFloat(text);
                                                    if (Number.isFinite(next)) {
                                                        const fixed = parseFloat(next.toFixed(2));
                                                        setQuantityInputs(prev => ({ ...prev, [row.id]: fixed }));
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const text = quantityInputsText[row.id];
                                                    if (text === '' || text === undefined) {
                                                        const raw = parseFloat(rawQty.toFixed(2));
                                                        setQuantityInputs(prev => ({ ...prev, [row.id]: raw }));
                                                        setQuantityInputsText(prev => ({ ...prev, [row.id]: raw.toFixed(2) }));
                                                    } else {
                                                        const next = parseFloat(text);
                                                        if (Number.isFinite(next)) {
                                                            const fixed = parseFloat(next.toFixed(2));
                                                            setQuantityInputs(prev => ({ ...prev, [row.id]: fixed }));
                                                            setQuantityInputsText(prev => ({ ...prev, [row.id]: fixed.toFixed(2) }));
                                                        }
                                                    }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ borderColor: state === 'faltante' ? 'var(--error-color)' : state === 'sobrante' ? 'var(--success-color)' : undefined }}
                                            />
                                        );
                                    }
                                    if (key === 'justificacion') {
                                        const value = justificationInputsText[row.id] || '';
                                        return (
                                            <input
                                                type="text"
                                                value={value}
                                                placeholder="Motivo del ajuste"
                                                onChange={(e) => {
                                                    const text = e.target.value;
                                                    setJustificationInputsText(prev => ({ ...prev, [row.id]: text }));
                                                }}
                                                onBlur={() => {
                                                    const text = justificationInputsText[row.id] || '';
                                                    // no log en tiempo real; resumen se imprime al registrar
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        );
                                    }
                                    return null;
                                }}
                            />
                        ) : (
                            productosFiltradosPorDiferencia.length > 0 ? (
                                productosFiltradosPorDiferencia.map((p, index) => {
                                    if (tipo === 'conteo') {
                                        const rawQty = parseFloat(p.quantity || 0);
                                        const state = getDiffState(p.id, rawQty);
                                        const inputs = [{
                                            name: `qty-${p.id}`,
                                            label: 'Cantidad',
                                            type: 'number',
                                            value: quantityInputsText[p.id] !== undefined ? quantityInputsText[p.id] : String(quantityInputs[p.id] !== undefined ? quantityInputs[p.id] : rawQty.toFixed(2)),
                                            onChange: (e) => {
                                                const text = e.target.value;
                                                setQuantityInputsText(prev => ({ ...prev, [p.id]: text }));
                                                if (text === '') return;
                                                const next = parseFloat(text);
                                                if (Number.isFinite(next)) {
                                                    setQuantityInputs(prev => ({ ...prev, [p.id]: parseFloat(next.toFixed(2)) }));
                                                }
                                            },
                                            inputProps: {
                                                step: '0.01',
                                                onBlur: () => {
                                                    const text = quantityInputsText[p.id];
                                                    if (text === '' || text === undefined) {
                                                        setQuantityInputs(prev => ({ ...prev, [p.id]: parseFloat(rawQty.toFixed(2)) }));
                                                        setQuantityInputsText(prev => ({ ...prev, [p.id]: rawQty.toFixed(2) }));
                                                    } else {
                                                        const next = parseFloat(text);
                                                        if (Number.isFinite(next)) {
                                                            const fixed = parseFloat(next.toFixed(2));
                                                            setQuantityInputs(prev => ({ ...prev, [p.id]: fixed }));
                                                            setQuantityInputsText(prev => ({ ...prev, [p.id]: fixed.toFixed(2) }));
                                                            console.log('[JUSTIFICACION:QTY]', { id: p.id, quantity_fisico: fixed });
                                                        }
                                                    }
                                                },
                                                style: { borderColor: state === 'faltante' ? 'var(--error-color)' : state === 'sobrante' ? 'var(--success-color)' : undefined }
                                            }
                                        },
                                        {
                                            name: `jus-${p.id}`,
                                            label: 'Justificación',
                                            type: 'text',
                                            value: justificationInputsText[p.id] || '',
                                            onChange: (e) => {
                                                const text = e.target.value;
                                                setJustificationInputsText(prev => ({ ...prev, [p.id]: text }));
                                            },
                                            inputProps: {
                                                placeholder: 'Motivo del ajuste',
                                                onBlur: () => {
                                                    const text = justificationInputsText[p.id] || '';
                                                    if (text.trim() !== '') {
                                                        console.log('[JUSTIFICACION]', { id: p.id, justificacion: text });
                                                    }
                                                }
                                            }
                                        }];
                                        return (
                                            <ItemViewInput
                                                key={p.id || index}
                                                title={p.name || 'Sin nombre'}
                                                icon="box"
                                                inputs={inputs}
                                                flot1={`${parseFloat(p.quantity || 0).toFixed(2)} ${p.type_measure?.code || ''}`}
                                            />
                                        );
                                    }
                                    return (
                                        <ItemView
                                            key={p.id || index}
                                            title={p.name || 'Sin nombre'}
                                            description={p.description || 'Sin descripción'}
                                            icon="box"
                                            onClick={() => {}}
                                            entrada={false}
                                            entradaData={[]}
                                            flot1={`${parseFloat(p.quantity || 0).toFixed(2)} ${p.type_measure?.code || ''}`}
                                        />
                                    );
                                })
                            ) : (
                                <div className={styles.noData}>
                                    <p>{searchQuery || categoriaFiltro !== null || tipoMedidaFiltro !== null ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
                {tipo === 'conteo' ? (
                    <div className={styles.buttonFooter}>
                        <Boton className='btn-original' label='Registrar conteo' onClick={handleRegistrarConteo} loading={isSubmitting} />
                        <Boton className='btn-gray' label='Restablecer valores' onClick={handleRestablecerValores} disabled={isSubmitting} />
                    </div>
                ) : ''}

                {isOpen && (
                    <>
                        <FetchData
                            service={productsAcopioService}
                            serviceName="productsAcopioService"
                            isOpen={isOpen}
                            onDataLoaded={handleProductosLoaded}
                            onLoadingStart={() => handleLoading(true)}
                            onLoadingEnd={() => handleLoading(false)}
                        />
                        <FetchData
                            service={categoryAcopioService}
                            serviceName="categoryAcopioService"
                            isOpen={isOpen}
                            onDataLoaded={setCategorias}
                        />
                        <FetchData
                            service={typeMeasureService}
                            serviceName="typeMeasureService"
                            isOpen={isOpen}
                            onDataLoaded={setTiposMedida}
                        />
                    </>
                )}
            </View>

            {/* Filtros */}
            <FiltroTipoMedida isOpen={isOpenTipoMedida} setIsOpen={setOpenTipoMedida} onTipoMedidaSeleccionado={handleTipoMedidaFilter} />
            <FiltroCategoriasAcopio isOpen={isOpenCategoria} setIsOpen={setOpenCategoria} onCategoriaSeleccionada={handleCategoriaFilter} />
            <FiltroOrdenamientoAcopio isOpen={isOpenOrden} setIsOpen={setOpenOrden} onOrdenamientoSeleccionado={handleOrdenamiento} />
            <FiltroDiferenciaConteo isOpen={isOpenDiferencia} setIsOpen={setOpenDiferencia} onDiferenciaSeleccionada={(op) => setFiltroDiferencia(op)} />
            <Notification type={notif.type} text={notif.text} isVisible={notif.visible} onClose={() => setNotif(prev => ({ ...prev, visible: false }))} />
        </>
    );
}

export default AlmacenAcopioAuxiliar;


