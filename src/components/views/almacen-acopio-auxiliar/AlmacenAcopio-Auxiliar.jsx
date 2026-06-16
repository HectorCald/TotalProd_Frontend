import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/old/ItemView';
import ItemViewInput from '../../common/old/ItemViewInput';
import Filtros from '../../common/old/Filtros';
import LoadingSpinner from '../../common/old/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/old/Table';
import FiltroCategoriasAcopio from '../../mixed/FiltroCategoriasAcopio';
import FiltroTipoMedida from '../../mixed/FiltroTipoMedida';
import FiltroOrdenamientoAcopio from '../../mixed/FiltroOrdenamientoAcopio';
import FiltroDiferenciaConteo from '../../mixed/FiltroDiferenciaConteo';
import FetchData from '../../mixed/FetchData';
import NoData from '../../common/widgets/NoData';
import productsAcopioService from '../../../services/productsAcopioService';
import categoryAcopioService from '../../..//services/categoryAcopioService';
import typeMeasureService from '../../..//services/typeMeasureService';
import Boton from '../../common/botones/Boton';
import { useToast } from '../../../context/ToastContext';
import conteosService from '../../../services/conteosService';
import PullToRefresh from '../../common/old/PullToRefresh';
import RefreshIndicator from '../../common/old/RefreshIndicator';
import DescargaConteoBuilder from './DescargaConteoBuilder';
import useVirtualPagination from '../../../hooks/useVirtualPagination';
import useSessionCache from '../../../hooks/useSessionCache';

function AlmacenAcopioAuxiliar({ isOpen, setIsOpen, tipo = 'almacen' }) {
    const { isLargeScreen } = useLayout();
    const { showSuccess, showDanger } = useToast();

    // Estados: búsqueda y loading
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // UI: envío
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpenDescarga, setIsOpenDescarga] = useState(false);

    // Datos (compartidos con AlmacenAcopio principal vía sessionStorage)
    const {
        value: productos,
        setValue: setProductos,
        hasCache: hasProductosCache,
    } = useSessionCache({
        key: 'almacenAcopioProductos',
        defaultValue: [],
    });
    const [categorias, setCategorias] = useState([]);
    const [tiposMedida, setTiposMedida] = useState([]);
    
    // Estados para rastrear qué datos se han cargado
    const [productosLoaded, setProductosLoaded] = useState(false);
    const [categoriasLoaded, setCategoriasLoaded] = useState(false);
    const [tiposMedidaLoaded, setTiposMedidaLoaded] = useState(false);

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

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (productos.length === 0) {
            setIsLoading(true);
        }
        // Incrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = prev + 1;
            // Mostrar RefreshIndicator cuando hay peticiones activas (en PC y móvil)
            if (newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [productos.length]);

    // Función para manejar cuando termina la carga
    const handleLoadingEnd = useCallback(() => {
        // Decrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
            // Solo ocultar loading y RefreshIndicator cuando no hay peticiones activas
            if (newCount === 0) {
                setIsLoading(false);
                setTimeout(() => {
                    setIsRefreshing(false);
                    setTimeout(() => {
                        setShowRefreshIndicator(false);
                    }, 500);
                }, 300);
            }
            return newCount;
        });
    }, []);


    useEffect(() => {
        if (!isOpen) {
            // Limpiar la variable de repetición cuando se cierre
            localStorage.removeItem('isRepeatingConteo');
        }
    }, [isOpen]);

    // Carga de datos
    const handleProductosLoaded = useCallback((data) => {
        setProductos(data);
        setProductosLoaded(true);
    }, []);

    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await productsAcopioService.getAll();
            if (response.success) {
                setProductos(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar productos:', error);
        }
    };

    // Mapeo de productos
    const productosMapeados = productos.map(producto => ({
        id: producto.id,
        name: producto.name || '',
        description: producto.description || '',
        quantity: producto.quantity || 0,
        stock_minimo: producto.stock_minimo || 0,
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
            
            // Resetear estados de carga
            setProductosLoaded(hasProductosCache && productos.length > 0);
            setCategoriasLoaded(false);
            setTiposMedidaLoaded(false);
            
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
    }, [isOpen, tipo, loadFromLocalStorage, hasProductosCache, productos.length]);

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

    // Paginación virtual - mostrar solo 30 elementos inicialmente
    const { visibleItems, hasMore, handleScroll } = useVirtualPagination(productosFiltradosPorDiferencia, 30);

    const tableData = visibleItems
        .map(p => ({
            id: p.id,
            name: p.name,
            quantity: `${parseFloat(p.quantity || 0).toFixed(2)} ${p.type_measure?.code || ''}`,
            justificacion: justificationInputsText[p.id] || '',
            category_name: p.category_name || '--',
            type_measure_name: p.type_measure?.name || '--'
        }));

    const handleRegistrarConteo = async () => {
        console.log('[CONTEO ACOPIO] Iniciando registro de conteo');
        console.log('[CONTEO ACOPIO] Total de productos disponibles:', productos.length);
        
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
        
        console.log('[CONTEO ACOPIO] Resultados procesados:', resultados.length);
        console.log('[CONTEO ACOPIO] Primeros 5 resultados:', resultados.slice(0, 5));
        
        // Preparar detalles para API
        const detalles = resultados.map(r => ({
            producto_id: r.id,
            sistema: r.quantity_sistema,
            fisico: r.quantity_fisico,
            justificacion: r.justificacion
        }));

        console.log('[CONTEO ACOPIO] Detalles preparados para enviar:', detalles.length);
        console.log('[CONTEO ACOPIO] Primeros 5 detalles:', detalles.slice(0, 5));
        console.log('[CONTEO ACOPIO] Últimos 5 detalles:', detalles.slice(-5));

        try {
            setIsSubmitting(true);
            console.log('[CONTEO ACOPIO] Enviando conteo al backend con', detalles.length, 'productos');
            const resp = await conteosService.create({ tipo: 'acopio', observaciones: null, detalles });
            console.log('[CONTEO ACOPIO] Respuesta del backend:', resp);
            if (!resp.success) throw new Error(resp.message || 'Error');
            
            // Limpiar localStorage y resetear valores después de registrar exitosamente
            clearLocalStorage();
            setQuantityInputs({});
            setQuantityInputsText({});
            setJustificationInputsText({});
            
            showSuccess('Éxito', 'Conteo registrado correctamente');
        } catch (e) {
            showDanger('Error', e.message || 'Error al registrar conteo');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRestablecerValores = () => {
        // Limpiar localStorage y resetear todos los valores a originales
        clearLocalStorage();
        setQuantityInputs({});
        setQuantityInputsText({});
        setJustificationInputsText({});
        showSuccess('Éxito', 'Valores restablecidos correctamente');
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
                    {isLoading ? (
                        // Mostrar LoadingSpinner cuando está cargando
                        <LoadingSpinner />
                    ) : (
                        <>
                            <div className={styles.titleContainer}>
                                <RefreshIndicator
                                    isVisible={showRefreshIndicator}
                                    isLoading={isRefreshing}
                                />
                            </div>
                            <Filtros options={opciones} />
                            {isLargeScreen ? (
                                // Vista de tabla para pantallas grandes
                                <div 
                                    className={styles.content}
                                    onScroll={handleScroll}
                                    style={{
                                        overflowY: 'auto'
                                    }}
                                >
                                    <Table
                                        headers={tableHeaders}
                                        data={tableData}
                                        onRowClick={() => {}}
                                        getBadge={() => null}
                                        onScroll={handleScroll}
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
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={valueText}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            const text = raw.replace(/,/g, '.');
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
                                                        onWheel={(e) => {
                                                            // Prevenir que el scroll cambie el valor
                                                            e.target.blur();
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onFocus={(e) => e.target.select()}
                                                        style={{ borderColor: state === 'faltante' ? 'var(--error-color)' : state === 'sobrante' ? 'var(--success-color)' : undefined, maxWidth: '100px' }}
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
                                                        style={{ maxWidth: '100%' }}
                                                    />
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </div>
                            ) : (
                                // Vista de cards para pantallas pequeñas con PullToRefresh
                                <PullToRefresh
                                    onRefresh={handleRefresh}
                                    screenName="Almacén"
                                    containerStyle={{
                                        maxHeight: 'calc(100% - 80px)',
                                        minHeight: 'calc(100% - 80px)'
                                    }}
                                    onScroll={handleScroll}
                                >
                                        {visibleItems.length > 0 ? (
                                            visibleItems.map((p, index) => {
                                                if (tipo === 'conteo') {
                                                    const rawQty = parseFloat(p.quantity || 0);
                                                    const state = getDiffState(p.id, rawQty);
                                                    const inputs = [{
                                                        name: `qty-${p.id}`,
                                                        label: 'Cantidad',
                                                        type: 'number',
                                                        width: 30, // 30% del ancho
                                                        diffState: state,
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
                                                            inputMode: 'decimal',
                                                            onFocus: (e) => e.target.select(),
                                                            onWheel: (e) => {
                                                                // Prevenir que el scroll cambie el valor
                                                                e.target.blur();
                                                            },
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
                                                            }
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
                                                            diffState={state}
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
                                            <NoData 
                                                icon="box"
                                                title={searchQuery || categoriaFiltro !== null || tipoMedidaFiltro !== null ? 'Sin resultados' : 'No hay productos'}
                                                detail={searchQuery || categoriaFiltro !== null || tipoMedidaFiltro !== null ? 'Intenta ajustar los filtros de búsqueda para encontrar los productos que necesitas' : 'Agrega productos de materia prima para comenzar a gestionar tu inventario de acopio'}
                                                transparent={true}
                                                minHeight="200px"
                                            />
                                        )}
                                </PullToRefresh>
                            )}
                        </>
                    )}
                </div>
                {tipo === 'conteo' ? (
                    <div className={styles.buttonFooter}>
                        <Boton className='btn-original' label='Registrar' onClick={handleRegistrarConteo} loading={isSubmitting} />
                        
                            <Boton className='btn-gray' label='Restablecer' onClick={handleRestablecerValores} disabled={isSubmitting} />
                            <Boton className='btn-gray' buttonIcon='download' onClick={() => setIsOpenDescarga(true)} disabled={isSubmitting} />
                     
                    </div>
                ) : ''}

                {isOpen && (
                    <>
                        <FetchData
                            service={productsAcopioService}
                            serviceName="productsAcopioService"
                            isOpen={isOpen}
                            onDataLoaded={handleProductosLoaded}
                            onLoadingStart={handleLoadingStart}
                            onLoadingEnd={handleLoadingEnd}
                        />
                        <FetchData
                            service={categoryAcopioService}
                            serviceName="categoryAcopioService"
                            isOpen={isOpen}
                            onDataLoaded={(data) => {
                                setCategorias(data);
                                setCategoriasLoaded(true);
                            }}
                            onLoadingStart={handleLoadingStart}
                            onLoadingEnd={handleLoadingEnd}
                        />
                        <FetchData
                            service={typeMeasureService}
                            serviceName="typeMeasureService"
                            isOpen={isOpen}
                            onDataLoaded={(data) => {
                                setTiposMedida(data);
                                setTiposMedidaLoaded(true);
                            }}
                            onLoadingStart={handleLoadingStart}
                            onLoadingEnd={handleLoadingEnd}
                        />
                    </>
                )}
            </View>

            {/* Filtros */}
            <FiltroTipoMedida isOpen={isOpenTipoMedida} setIsOpen={setOpenTipoMedida} onTipoMedidaSeleccionado={handleTipoMedidaFilter} />
            <FiltroCategoriasAcopio isOpen={isOpenCategoria} setIsOpen={setOpenCategoria} onCategoriaSeleccionada={handleCategoriaFilter} />
            <FiltroOrdenamientoAcopio isOpen={isOpenOrden} setIsOpen={setOpenOrden} onOrdenamientoSeleccionado={handleOrdenamiento} />
            <FiltroDiferenciaConteo isOpen={isOpenDiferencia} setIsOpen={setOpenDiferencia} onDiferenciaSeleccionada={(op) => setFiltroDiferencia(op)} />
            {tipo === 'conteo' && (
                <DescargaConteoBuilder
                    isOpen={isOpenDescarga}
                    setIsOpen={setIsOpenDescarga}
                    productos={productos}
                    quantityInputs={quantityInputs}
                    quantityInputsText={quantityInputsText}
                    justificationInputsText={justificationInputsText}
                />
            )}
        </>
    );
}

export default AlmacenAcopioAuxiliar;


