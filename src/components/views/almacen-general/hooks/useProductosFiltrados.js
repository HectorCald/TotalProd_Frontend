import { useMemo, useState, useCallback } from 'react';
import useVirtualPagination from '../../../../hooks/useVirtualPagination';
import { normalizeSearchValue, normalizedIncludes } from '../../../common/HeaderView';

const normalizeText = (text) => normalizeSearchValue(text);

function useProductosFiltrados({
    productos = [],
    paginaTamano = 30,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchQueryNormalized, setSearchQueryNormalized] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
    const [categoriaFiltroNombre, setCategoriaFiltroNombre] = useState('Categorías');
    const [ordenamiento, setOrdenamiento] = useState('nombre_asc');

    const handleSearchChange = useCallback((value) => {
        setSearchQuery(value);
    }, []);

    const handleSearchNormalizedChange = useCallback((normalizedValue) => {
        setSearchQueryNormalized(normalizedValue || '');
    }, []);

    const handleSearchClear = useCallback(() => {
        setSearchQuery('');
        setSearchQueryNormalized('');
    }, []);

    const handleSearchToggle = useCallback((isExpanded) => {
        setIsSearchExpanded(isExpanded);
    }, []);

    const handleCategoriaFilter = useCallback((categoriaId, categoriaNombre = null) => {
        setCategoriaFiltro(categoriaId);
        if (categoriaId === null) {
            setCategoriaFiltroNombre('Categorías');
        } else if (categoriaId === '') {
            setCategoriaFiltroNombre('Sin categoría');
        } else if (categoriaNombre) {
            setCategoriaFiltroNombre(categoriaNombre);
        }
    }, []);

    const handleOrdenamiento = useCallback((orden) => {
        setOrdenamiento(orden);
    }, []);

    const getCategoriaNombre = useCallback(() => {
        if (categoriaFiltro === null) return 'Categorías';
        if (categoriaFiltro === '') return 'Sin categoría';
        return categoriaFiltroNombre || 'Categorías';
    }, [categoriaFiltro, categoriaFiltroNombre]);

    const getOrdenamientoNombre = useCallback(() => {
        const ordenamientos = {
            'nombre_asc': 'Nombre A-Z',
            'nombre_desc': 'Nombre Z-A',
            'stock_asc': 'Stock ↑',
            'stock_desc': 'Stock ↓'
        };
        return ordenamientos[ordenamiento] || 'Ordenamiento';
    }, [ordenamiento]);

    const productosMapeados = useMemo(() => {
        return productos.map(producto => ({
            id: producto.id,
            name: producto.name || '',
            codigo_barras: producto.codigo_barras || '',
            description: producto.description || '',
            stock: producto.stock || 0,
            grup: producto.grup || 0,
            stock_minimo: producto.stock_minimo || 0,
            costo_produccion: producto.costo_produccion || null,
            created_at: producto.created_at,
            empresa_id: producto.empresa_id,
            es_asociado: producto.es_asociado || false,
            category_id: producto.category_id || '',
            category_name: producto.category_name || 'Sin categoría',
            category_almacen: producto.category_almacen || null,
            price_product: producto.price_product || [],
            recetas: producto.recetas || [],
            productos_sucursal: producto.productos_sucursal || []
        }));
    }, [productos]);

    const productosFiltrados = useMemo(() => {
        const query = searchQueryNormalized || normalizeText(searchQuery);
        return productosMapeados
            .filter(producto => {
                const matchesSearch = !query ||
                    normalizedIncludes(normalizeText(producto.name), query) ||
                    (producto.description && normalizedIncludes(normalizeText(producto.description), query)) ||
                    (producto.codigo_barras && normalizedIncludes(normalizeText(producto.codigo_barras), query));

                const matchesCategoria = categoriaFiltro === null ||
                    (categoriaFiltro === '' ? !producto.category_id : producto.category_id === categoriaFiltro);

                return matchesSearch && matchesCategoria;
            })
            .sort((a, b) => {
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
    }, [productosMapeados, searchQuery, searchQueryNormalized, categoriaFiltro, ordenamiento]);

    const {
        visibleItems,
        hasMore,
        handleScroll
    } = useVirtualPagination(productosFiltrados, paginaTamano);

    const resetFilters = useCallback(() => {
        setSearchQuery('');
        setSearchQueryNormalized('');
        setIsSearchExpanded(false);
        setCategoriaFiltro(null);
        setCategoriaFiltroNombre('Categorías');
        setOrdenamiento('nombre_asc');
    }, []);

    return {
        productosMapeados,
        productosFiltrados,
        visibleItems,
        hasMore,
        handleScroll,
        searchQuery,
        searchQueryNormalized,
        isSearchExpanded,
        categoriaFiltro,
        categoriaFiltroNombre,
        ordenamiento,
        handleSearchChange,
        handleSearchClear,
        handleSearchNormalizedChange,
        handleSearchToggle,
        handleCategoriaFilter,
        handleOrdenamiento,
        getCategoriaNombre,
        getOrdenamientoNombre,
        resetFilters,
    };
}

export default useProductosFiltrados;

