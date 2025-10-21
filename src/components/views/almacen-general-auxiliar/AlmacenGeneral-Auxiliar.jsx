import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import ItemViewInput from '../../common/ItemViewInput';
import Filtros from '../../common/Filtros';
import FiltroCategorias from '../../mixed/FiltroCategorias';
import FiltroOrdenamiento from '../../mixed/FiltroOrdenamiento';
import FetchData from '../../mixed/FetchData';
import productsAlmacenService from '../../../services/productsAlmacenService';
import pricesTypesService from '../../../services/pricesTypesService';
import sucursalesService from '../../../services/sucursalesService';
import RefreshIndicator from '../../common/RefreshIndicator';
import { useUser } from '../../../context/UserContext';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroDiferenciaConteo from '../../mixed/FiltroDiferenciaConteo';
import Boton from '../../common/Boton';
import Notification from '../../common/Notification';
import conteosService from '../../../services/conteosService';

function AlmacenGeneralAuxiliar({ isOpen, setIsOpen, tipo = 'almacen' }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const { isLargeScreen } = useLayout();

    // Estados para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estados para indicador de carga
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // UI envío y notificación
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notif, setNotif] = useState({ visible: false, text: '', type: 'success' });

    // Estados para filtros locales
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
    const [categoriaFiltroNombre, setCategoriaFiltroNombre] = useState('Categorías');
    const [ordenamiento, setOrdenamiento] = useState('nombre_asc');
    const [isOpenCategoria, setOpenCategoria] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);
    const [isOpenDiferencia, setOpenDiferencia] = useState(false);
    const [filtroDiferencia, setFiltroDiferencia] = useState('todos');

    // Estados para datos
    const [productos, setProductos] = useState([]);
    const [preciosData, setPreciosData] = useState([]);
    const [sucursalesData, setSucursalesData] = useState([]);

    // Estados locales para inputs de conteo (solo UI)
    const [stockInputs, setStockInputs] = useState({}); // { [productoId]: number }
    const [groupInputs, setGroupInputs] = useState({}); // { [productoId]: number }
    const [stockInputsText, setStockInputsText] = useState({}); // { [productoId]: string }
    const [groupInputsText, setGroupInputsText] = useState({}); // { [productoId]: string }

    // Clave para localStorage
    const STORAGE_KEY = 'conteo_almacen_inputs';
    
    // Estado para verificar si se está repitiendo un conteo
    const [isRepeatingConteo, setIsRepeatingConteo] = useState(false);

    // Funciones para manejar localStorage
    const saveToLocalStorage = useCallback((stockInputs, groupInputs, stockInputsText, groupInputsText) => {
        try {
            const data = {
                stockInputs,
                groupInputs,
                stockInputsText,
                groupInputsText,
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
                    setStockInputs(data.stockInputs || {});
                    setGroupInputs(data.groupInputs || {});
                    setStockInputsText(data.stockInputsText || {});
                    setGroupInputsText(data.groupInputsText || {});
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

    // Mapear Información
    const productosMapeados = productos.map(producto => ({
        id: producto.id,
        name: producto.name || '',
        codigo_barras: producto.codigo_barras || '',
        description: producto.description || '',
        stock: producto.stock || 0,
        grup: producto.grup || 0,
        created_at: producto.created_at,
        empresa_id: producto.empresa_id,
        category_id: producto.category_id || '',
        category_name: producto.category_name || 'Sin categoría',
        category_almacen: producto.category_almacen || null,
        price_product: producto.price_product || [],
        recetas: producto.recetas || [],
        productos_sucursal: producto.productos_sucursal || []
    }));

    const preciosTipos = preciosData.map(precio => ({
        value: precio.id,
        label: precio.name,
        id: precio.id,
        name: precio.name,
        default_value: precio.default_value
    }));

    const sucursales = sucursalesData
        .filter(sucursal => sucursal.id !== sucursalActual?.id)
        .map(sucursal => ({
            value: sucursal.id,
            label: sucursal.name,
            id: sucursal.id,
            name: sucursal.name
        }));

    // Handlers de carga de datos
    const handleProductosLoaded = useCallback((data) => {
        setProductos(data);
    }, []);
    const handlePreciosLoaded = useCallback((data) => {
        setPreciosData(data);
    }, []);
    const handleSucursalesLoaded = useCallback((data) => {
        setSucursalesData(data);
    }, []);

    // Efecto para resetear búsqueda y filtros cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setCategoriaFiltro(null);
            setCategoriaFiltroNombre('Categorías');
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
                setStockInputs({});
                setGroupInputs({});
                setStockInputsText({});
                setGroupInputsText({});
            }
        }
    }, [isOpen, tipo, loadFromLocalStorage]);

    // Efecto para guardar cambios en localStorage (solo en modo conteo)
    useEffect(() => {
        if (tipo === 'conteo' && isOpen) {
            saveToLocalStorage(stockInputs, groupInputs, stockInputsText, groupInputsText);
        }
    }, [stockInputs, groupInputs, stockInputsText, groupInputsText, tipo, isOpen, saveToLocalStorage]);

    // Buscador expandible
    const handleSearchChange = (value) => {
        setSearchQuery(value);
    };
    const handleSearchClear = () => {
        setSearchQuery('');
    };
    const handleSearchToggle = (isExpanded) => {
        setIsSearchExpanded(isExpanded);
    };

    // Filtros locales
    const handleCategoriaFilter = (categoriaId, categoriaNombre = null) => {
        setCategoriaFiltro(categoriaId);
        if (categoriaId === null) {
            setCategoriaFiltroNombre('Categorías');
        } else if (categoriaId === '') {
            setCategoriaFiltroNombre('Sin categoría');
        } else if (categoriaNombre) {
            setCategoriaFiltroNombre(categoriaNombre);
        }
    };
    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
    };

    const productosFiltrados = productosMapeados.filter(producto => {
        const matchesSearch = !searchQuery ||
            producto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (producto.description && producto.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (producto.codigo_barras && producto.codigo_barras.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategoria = categoriaFiltro === null ||
            (categoriaFiltro === '' ? !producto.category_id : producto.category_id === categoriaFiltro);
        return matchesSearch && matchesCategoria;
    }).sort((a, b) => {
        switch (ordenamiento) {
            case 'nombre_asc':
                return a.name.localeCompare(b.name);
            case 'nombre_desc':
                return b.name.localeCompare(a.name);
            case 'stock_asc':
                return (a.stock || 0) - (b.stock || 0);
            case 'stock_desc':
                return (b.stock || 0) - (a.stock || 0);
            default:
                return a.name.localeCompare(b.name);
        }
    });

    const getCategoriaNombre = () => {
        if (categoriaFiltro === null) return 'Categorías';
        if (categoriaFiltro === '') return 'Sin categoría';
        return categoriaFiltroNombre || 'Categorías';
    };
    const getOrdenamientoNombre = () => {
        const ordenamientos = {
            'nombre_asc': 'Nombre A-Z',
            'nombre_desc': 'Nombre Z-A',
            'stock_asc': 'Stock ↑',
            'stock_desc': 'Stock ↓'
        };
        return ordenamientos[ordenamiento] || 'Ordenamiento';
    };

    const getDiferenciaNombre = () => {
        const map = {
            'todos': 'Diferencia',
            'faltantes': 'Faltantes',
            'sobrantes': 'Sobrantes',
            'iguales': 'Iguales'
        };
        return map[filtroDiferencia] || 'Diferencia';
    };

    const opciones = [
        {
            label: getCategoriaNombre(),
            active: categoriaFiltro !== null,
            onClick: () => setOpenCategoria(true)
        },
        {
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'nombre_asc',
            onClick: () => setOpenOrden(true)
        },
        ...(tipo === 'conteo' ? [{
            label: getDiferenciaNombre(),
            active: filtroDiferencia !== 'todos',
            onClick: () => setOpenDiferencia(true)
        }] : [])
    ];

    // Headers y datos para la tabla
    const tableHeaders = [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'codigo_barras', label: 'C. Barras', icon: 'barcode' },
        { key: 'stock', label: 'Stock', icon: 'bar-chart-alt-2' },
        { key: 'stock_grup', label: 'Grup', icon: 'package' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' }
    ];
    // Determinar color del borde por diferencia
    const getDiffState = (productoId, rawStock, rawGroups, grupVal) => {
        const u = stockInputs[productoId];
        const g = groupInputs[productoId];
        if (grupVal > 0 && g !== undefined) {
            if (g < rawGroups) return 'faltante';
            if (g > rawGroups) return 'sobrante';
            return 'igual';
        }
        if (u !== undefined) {
            if (u < rawStock) return 'faltante';
            if (u > rawStock) return 'sobrante';
            return 'igual';
        }
        return 'igual';
    };

    const productosFiltradosPorDiferencia = productosFiltrados.filter(producto => {
        if (tipo !== 'conteo' || filtroDiferencia === 'todos') return true;
        const rawStock = Number(producto.stock || 0);
        const grupVal = Number(producto.grup || 0);
        const rawGroups = grupVal > 0 ? Math.floor(rawStock / grupVal) : 0;
        const state = getDiffState(producto.id, rawStock, rawGroups, grupVal);
        if (filtroDiferencia === 'faltantes') return state === 'faltante';
        if (filtroDiferencia === 'sobrantes') return state === 'sobrante';
        if (filtroDiferencia === 'iguales') return state === 'igual';
        return true;
    });

    const tableData = productosFiltradosPorDiferencia
        .map(producto => ({
        id: producto.id,
        name: producto.name,
        codigo_barras: producto.codigo_barras,
        stock: `${producto.stock} Ud.`,
        stock_grup: producto.grup ? Math.floor(producto.stock / producto.grup) + ' Ud.' : '--',
        category_name: producto.category_name,
    }));

    const handleRegistrarConteo = async () => {
        const resultados = productos.map((p) => {
            const rawStock = Number(p.stock || 0);
            const grupVal = Number(p.grup || 0);

            const hasGroupText = groupInputsText[p.id] !== undefined && groupInputsText[p.id] !== '';
            const hasUnitText = stockInputsText[p.id] !== undefined && stockInputsText[p.id] !== '';

            let fisicoUnits = rawStock;
            
            // Prioridad: Si se editó por unidades, usar el valor de unidades (es lo que realmente ingresó el usuario)
            if (hasUnitText || stockInputs[p.id] !== undefined) {
                const u = hasUnitText ? Number(stockInputsText[p.id]) : Number(stockInputs[p.id]);
                fisicoUnits = Number.isFinite(u) ? u : rawStock;
            } 
            // Si solo se editó por grupos (sin tocar unidades), usar el valor de grupos
            else if (grupVal > 0 && (hasGroupText || groupInputs[p.id] !== undefined)) {
                const g = hasGroupText ? Number(groupInputsText[p.id]) : Number(groupInputs[p.id]);
                fisicoUnits = Number.isFinite(g) ? g * grupVal : rawStock;
            }

            return {
                id: p.id,
                stock_sistema: rawStock,
                stock_fisico: fisicoUnits
            };
        });
        // Preparar detalles para API
        const detalles = resultados.map(r => ({
            producto_id: r.id,
            sistema: r.stock_sistema,
            fisico: r.stock_fisico,
            justificacion: null
        }));

        try {
            setIsSubmitting(true);
            const resp = await conteosService.create({ tipo: 'almacen', observaciones: null, detalles });
            if (!resp.success) throw new Error(resp.message || 'Error');
            
            // Limpiar localStorage y resetear valores después de registrar exitosamente
            clearLocalStorage();
            setStockInputs({});
            setGroupInputs({});
            setStockInputsText({});
            setGroupInputsText({});
            
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
        setStockInputs({});
        setGroupInputs({});
        setStockInputsText({});
        setGroupInputsText({});
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
                    title={tipo === 'conteo' ? 'Conteo de Inventario' : 'Almacén'}
                    searchValue={searchQuery}
                    onSearchChange={handleSearchChange}
                    onSearchClear={handleSearchClear}
                    searchExpanded={isSearchExpanded}
                    onSearchToggle={handleSearchToggle}
                />
                <div className={`${styles.container}`}>
                    <div className={styles.titleContainer}>
                        <RefreshIndicator
                            isVisible={showRefreshIndicator}
                            isLoading={isRefreshing}
                        />
                    </div>
                    <Filtros options={opciones} />
                    <div className={styles.content}>
                        {isLargeScreen ? (
                            <Table
                                headers={tableHeaders}
                                data={tableData}
                                onRowClick={() => {}}
                                getBadge={() => null}
                                columnWidths={{
                                    name: '25%',
                                    codigo_barras: '15%',
                                    stock: '15%',
                                    stock_grup: '15%',
                                    category_name: '15%'
                                }}
                                renderCell={(row, key) => {
                                    if (tipo !== 'conteo') return null;
                                    if (key !== 'stock' && key !== 'stock_grup') return null;
                                    const original = productosFiltrados.find(p => p.id === row.id);
                                    if (!original) return null;
                                    const rawStock = Number(original.stock || 0);
                                    const grupVal = Number(original.grup || 0);
                                    const rawGroups = grupVal > 0 ? Math.floor(rawStock / grupVal) : 0;

                                    if (key === 'stock') {
                                        const valueText = stockInputsText[row.id] !== undefined ? stockInputsText[row.id] : String(stockInputs[row.id] !== undefined ? stockInputs[row.id] : rawStock);
                                        const state = getDiffState(row.id, rawStock, rawGroups, grupVal);
                                        return (
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={valueText}
                                                onChange={(e) => {
                                                    const text = e.target.value;
                                                    setStockInputsText(prev => ({ ...prev, [row.id]: text }));
                                                    if (text === '') return; // permitir vacío mientras edita
                                                    const nextUnits = Number(text);
                                                    if (Number.isFinite(nextUnits)) {
                                                        setStockInputs(prev => ({ ...prev, [row.id]: nextUnits }));
                                                        if (grupVal > 0) {
                                                            const nextGroups = Math.floor(nextUnits / grupVal);
                                                            setGroupInputs(prev => ({ ...prev, [row.id]: nextGroups }));
                                                            setGroupInputsText(prev => ({ ...prev, [row.id]: String(nextGroups) }));
                                                        }
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const text = stockInputsText[row.id];
                                                    if (text === '' || text === undefined) {
                                                        setStockInputs(prev => ({ ...prev, [row.id]: rawStock }));
                                                        setStockInputsText(prev => ({ ...prev, [row.id]: String(rawStock) }));
                                                        if (grupVal > 0) {
                                                            setGroupInputs(prev => ({ ...prev, [row.id]: rawGroups }));
                                                            setGroupInputsText(prev => ({ ...prev, [row.id]: String(rawGroups) }));
                                                        }
                                                    }
                                                }}
                                                onWheel={(e) => {
                                                    // Prevenir que el scroll cambie el valor
                                                    e.target.blur();
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                onFocus={(e) => e.target.select()}
                                                style={{
                                                    borderColor: state === 'faltante' ? 'var(--error-color)' : state === 'sobrante' ? 'var(--success-color)' : undefined, maxWidth: '100px'
                                                }}
                                            />
                                        );
                                    }
                                    if (key === 'stock_grup') {
                                        if (grupVal <= 0) {
                                            return null; // dejar contenido por defecto si no se agrupa
                                        }
                                        const valueText = groupInputsText[row.id] !== undefined ? groupInputsText[row.id] : String(groupInputs[row.id] !== undefined ? groupInputs[row.id] : rawGroups);
                                        const state = getDiffState(row.id, rawStock, rawGroups, grupVal);
                                        return (
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={valueText}
                                                onChange={(e) => {
                                                    const text = e.target.value;
                                                    setGroupInputsText(prev => ({ ...prev, [row.id]: text }));
                                                    if (text === '') return; // permitir vacío
                                                    const nextGroups = Number(text);
                                                    if (Number.isFinite(nextGroups)) {
                                                        setGroupInputs(prev => ({ ...prev, [row.id]: nextGroups }));
                                                        const nextUnits = Math.max(0, nextGroups * grupVal);
                                                        setStockInputs(prev => ({ ...prev, [row.id]: nextUnits }));
                                                        setStockInputsText(prev => ({ ...prev, [row.id]: String(nextUnits) }));
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const text = groupInputsText[row.id];
                                                    if (text === '' || text === undefined) {
                                                        setGroupInputs(prev => ({ ...prev, [row.id]: rawGroups }));
                                                        setGroupInputsText(prev => ({ ...prev, [row.id]: String(rawGroups) }));
                                                        setStockInputs(prev => ({ ...prev, [row.id]: rawStock }));
                                                        setStockInputsText(prev => ({ ...prev, [row.id]: String(rawStock) }));
                                                    }
                                                }}
                                                onWheel={(e) => {
                                                    // Prevenir que el scroll cambie el valor
                                                    e.target.blur();
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                onFocus={(e) => e.target.select()}
                                                style={{
                                                    borderColor: state === 'faltante' ? 'var(--error-color)' : state === 'sobrante' ? 'var(--success-color)' : undefined, maxWidth: '100px'
                                                }}
                                            />
                                        );
                                    }
                                    return null;
                                }}
                            />
                        ) : (
                            productosFiltradosPorDiferencia.length > 0 ? (
                                productosFiltradosPorDiferencia.map((producto, index) => {
                                    if (tipo === 'conteo') {
                                        const rawStock = Number(producto.stock || 0);
                                        const grupVal = Number(producto.grup || 0);
                                        const rawGroups = grupVal > 0 ? Math.floor(rawStock / grupVal) : 0;
                                        const state = getDiffState(producto.id, rawStock, rawGroups, grupVal);
                                        const inputs = [];
                                        // Unidades input
                                        inputs.push({
                                            name: `units-${producto.id}`,
                                            label: 'Unidades',
                                            type: 'number',
                                            value: stockInputsText[producto.id] !== undefined ? stockInputsText[producto.id] : String(stockInputs[producto.id] !== undefined ? stockInputs[producto.id] : rawStock),
                                            onChange: (e) => {
                                                const text = e.target.value;
                                                setStockInputsText(prev => ({ ...prev, [producto.id]: text }));
                                                if (text === '') return;
                                                const nextUnits = Number(text);
                                                if (Number.isFinite(nextUnits)) {
                                                    setStockInputs(prev => ({ ...prev, [producto.id]: nextUnits }));
                                                    if (grupVal > 0) {
                                                        const nextGroups = Math.floor(nextUnits / grupVal);
                                                        setGroupInputs(prev => ({ ...prev, [producto.id]: nextGroups }));
                                                        setGroupInputsText(prev => ({ ...prev, [producto.id]: String(nextGroups) }));
                                                    }
                                                }
                                            },
                                            inputProps: {
                                                inputMode: 'numeric',
                                                onFocus: (e) => e.target.select(),
                                                onWheel: (e) => {
                                                    // Prevenir que el scroll cambie el valor
                                                    e.target.blur();
                                                },
                                                onBlur: () => {
                                                    const text = stockInputsText[producto.id];
                                                    if (text === '' || text === undefined) {
                                                        setStockInputs(prev => ({ ...prev, [producto.id]: rawStock }));
                                                        setStockInputsText(prev => ({ ...prev, [producto.id]: String(rawStock) }));
                                                        if (grupVal > 0) {
                                                            setGroupInputs(prev => ({ ...prev, [producto.id]: rawGroups }));
                                                            setGroupInputsText(prev => ({ ...prev, [producto.id]: String(rawGroups) }));
                                                        }
                                                    }
                                                },
                                                style: { borderColor: state === 'faltante' ? 'var(--error-color)' : state === 'sobrante' ? 'var(--success-color)' : undefined }
                                            }
                                        });
                                        // Grupos input (solo si aplica)
                                        if (grupVal > 0) {
                                            inputs.push({
                                                name: `groups-${producto.id}`,
                                                label: 'Grup',
                                                type: 'number',
                                                value: groupInputsText[producto.id] !== undefined ? groupInputsText[producto.id] : String(groupInputs[producto.id] !== undefined ? groupInputs[producto.id] : rawGroups),
                                                onChange: (e) => {
                                                    const text = e.target.value;
                                                    setGroupInputsText(prev => ({ ...prev, [producto.id]: text }));
                                                    if (text === '') return;
                                                    const nextGroups = Number(text);
                                                    if (Number.isFinite(nextGroups)) {
                                                        setGroupInputs(prev => ({ ...prev, [producto.id]: nextGroups }));
                                                        const nextUnits = Math.max(0, nextGroups * grupVal);
                                                        setStockInputs(prev => ({ ...prev, [producto.id]: nextUnits }));
                                                        setStockInputsText(prev => ({ ...prev, [producto.id]: String(nextUnits) }));
                                                    }
                                                },
                                                inputProps: {
                                                    inputMode: 'numeric',
                                                    onFocus: (e) => e.target.select(),
                                                    onWheel: (e) => {
                                                        // Prevenir que el scroll cambie el valor
                                                        e.target.blur();
                                                    },
                                                    onBlur: () => {
                                                        const text = groupInputsText[producto.id];
                                                        if (text === '' || text === undefined) {
                                                            setGroupInputs(prev => ({ ...prev, [producto.id]: rawGroups }));
                                                            setGroupInputsText(prev => ({ ...prev, [producto.id]: String(rawGroups) }));
                                                            setStockInputs(prev => ({ ...prev, [producto.id]: rawStock }));
                                                            setStockInputsText(prev => ({ ...prev, [producto.id]: String(rawStock) }));
                                                        }
                                                    },
                                                    style: { borderColor: state === 'faltante' ? 'var(--error-color)' : state === 'sobrante' ? 'var(--success-color)' : undefined }
                                                }
                                            });
                                        }
                                        return (
                                            <ItemViewInput
                                                key={producto.id || index}
                                                title={producto.name || 'Sin nombre'}
                                                icon="box"
                                                inputs={inputs}
                                                flot1={`${producto.stock} Ud.`}
                                                flot2={grupVal > 0 ? `${Math.floor(producto.stock / grupVal)} Grup` : ''}
                                            />
                                        );
                                    }
                                    // No conteo: fallback original
                                    return (
                                        <ItemView
                                            key={producto.id || index}
                                            title={producto.name || 'Sin nombre'}
                                            description={producto.description || 'Sin descripción'}
                                            icon="box"
                                            onClick={() => {}}
                                            entrada={false}
                                            entradaData={[]}
                                            flot1={producto.stock + ' Ud.'}
                                        />
                                    );
                                })
                            ) : (
                                <div className={styles.noData}>
                                    <p>{searchQuery || categoriaFiltro !== null ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
                {tipo === 'conteo' ? (
                    <div className={styles.buttonFooter}>
                        <Boton
                            className='btn-original'
                            label='Registrar conteo'
                            onClick={handleRegistrarConteo}
                            loading={isSubmitting}
                        />
                        <Boton
                            className='btn-gray'
                            label='Restablecer'
                            onClick={handleRestablecerValores}
                            disabled={isSubmitting}
                        />
                    </div>
                ) : ''}

                {isOpen && (
                    <>
                        <FetchData
                            service={productsAlmacenService}
                            serviceName="productsAlmacenService"
                            isOpen={isOpen}
                            onDataLoaded={handleProductosLoaded}
                            onLoadingStart={() => handleLoading(true)}
                            onLoadingEnd={() => handleLoading(false)}
                        />
                        <FetchData
                            service={pricesTypesService}
                            serviceName="pricesTypesService"
                            isOpen={isOpen}
                            onDataLoaded={handlePreciosLoaded}
                            onLoadingStart={() => handleLoading(true)}
                            onLoadingEnd={() => handleLoading(false)}
                        />
                        <FetchData
                            service={sucursalesService}
                            serviceName="sucursalesService"
                            method="getByEmpresaId"
                            isOpen={isOpen}
                            onDataLoaded={handleSucursalesLoaded}
                            onLoadingStart={() => handleLoading(true)}
                            onLoadingEnd={() => handleLoading(false)}
                        />
                    </>
                )}
            </View>

            {/* Filtro de categorías */}
            <FiltroCategorias
                isOpen={isOpenCategoria}
                setIsOpen={setOpenCategoria}
                onCategoriaSeleccionada={handleCategoriaFilter}
            />
            {/* Filtro de ordenamiento */}
            <FiltroOrdenamiento
                isOpen={isOpenOrden}
                setIsOpen={setOpenOrden}
                onOrdenamientoSeleccionado={handleOrdenamiento}
                opciones={[
                    { value: 'nombre_asc', label: 'Nombre A-Z', icon: 'sort-a-z' },
                    { value: 'nombre_desc', label: 'Nombre Z-A', icon: 'sort-z-a' },
                    { value: 'stock_asc', label: 'Stock ↑', icon: 'up-arrow-alt' },
                    { value: 'stock_desc', label: 'Stock ↓', icon: 'down-arrow-alt' }
                ]}
            />
            {/* Filtro de diferencia */}
            <FiltroDiferenciaConteo
                isOpen={isOpenDiferencia}
                setIsOpen={setOpenDiferencia}
                onDiferenciaSeleccionada={(op) => setFiltroDiferencia(op)}
            />
            <Notification type={notif.type} text={notif.text} isVisible={notif.visible} onClose={() => setNotif(prev => ({ ...prev, visible: false }))} />
        </>
    );
}

export default AlmacenGeneralAuxiliar;