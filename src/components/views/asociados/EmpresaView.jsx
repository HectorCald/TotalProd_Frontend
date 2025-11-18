import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemViewPerfil from '../../common/ItemViewPerfil';
import ComponenteFull from '../../common/ComponenteFull';
import ItemProduct from '../../common/ItemProduct';
import NoData from '../../common/NoData';
import LoadingSpinner from '../../common/LoadingSpinner';
import Select from '../../common/Select';
import productsAlmacenService from '../../../services/productsAlmacenService';
import useVirtualPagination from '../../../hooks/useVirtualPagination';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';

const FAVORITES_KEY = 'empresas_favoritas';

function EmpresaView({ isOpen, setIsOpen, empresa }) {
    const { sucursalSeleccionada: sucursalSeleccionadaUsuario } = useUser();
    const { employee, sucursalSeleccionada: sucursalSeleccionadaEmpleado } = useEmployee();
    const isEmployeeMode = !!employee;
    const sucursalSeleccionada = isEmployeeMode ? sucursalSeleccionadaEmpleado : sucursalSeleccionadaUsuario;
    
    // Obtener ID de la empresa actual
    const empresaIdActual = sucursalSeleccionada?.empresas?.id;
    
    // Verificar si la empresa que se está viendo es la empresa actual
    const esEmpresaActual = empresa?.id && empresaIdActual && empresa.id === empresaIdActual;
    
    const [favorites, setFavorites] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);
    
    // Estados para el modal de catálogo
    const [isCatalogoOpen, setIsCatalogoOpen] = useState(false);
    const [productosCatalogo, setProductosCatalogo] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [categoriaFiltro, setCategoriaFiltro] = useState(null); // null = todas, string = nombre de categoría
    const [empresaIdCatalogo, setEmpresaIdCatalogo] = useState(null); // ID de la empresa cuyos productos están cargados

    // Cargar favoritos al montar el componente
    useEffect(() => {
        loadFavorites();
    }, []);

    // Actualizar estado de favorito cuando cambia la empresa o los favoritos
    useEffect(() => {
        if (empresa) {
            setIsFavorite(checkIsFavorite(empresa.id));
        }
    }, [empresa, favorites]);

    // Cargar favoritos desde localStorage
    const loadFavorites = () => {
        try {
            const stored = localStorage.getItem(FAVORITES_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setFavorites(Array.isArray(parsed) ? parsed : []);
            }
        } catch (error) {
            console.error('Error al cargar favoritos:', error);
            setFavorites([]);
        }
    };

    // Verificar si una empresa es favorita
    const checkIsFavorite = (empresaId) => {
        return favorites.some(fav => fav.id === empresaId);
    };

    // Guardar favoritos en localStorage
    const saveFavorites = (newFavorites) => {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            setFavorites(newFavorites);
            // Disparar evento personalizado para notificar cambios
            window.dispatchEvent(new CustomEvent('favorites-updated'));
        } catch (error) {
            console.error('Error al guardar favoritos:', error);
        }
    };

    // Toggle favorito
    const toggleFavorite = () => {
        if (!empresa) return;
        
        // No permitir asociar si es la empresa actual
        if (esEmpresaActual) {
            return;
        }

        const isFav = checkIsFavorite(empresa.id);
        let newFavorites;

        if (isFav) {
            // Remover de favoritos
            newFavorites = favorites.filter(fav => fav.id !== empresa.id);
        } else {
            // Agregar a favoritos
            newFavorites = [...favorites, {
                id: empresa.id,
                name: empresa.name,
                description: empresa.description,
                logo_tipo: empresa.logo_tipo,
                codigo: empresa.codigo,
                tipo: empresa.tipo,
                propietario_id: empresa.propietario_id
            }];
        }

        saveFavorites(newFavorites);
        setIsFavorite(!isFav);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    // Función para procesar productos
    const procesarProductos = (productos) => {
        return productos.map(producto => {
            // Asegurar que category_name esté disponible - múltiples fallbacks
            let categoryName = null;
            
            // Intentar obtener de category_name directo
            if (producto.category_name && producto.category_name !== 'Sin categoría') {
                categoryName = producto.category_name;
            }
            // Intentar obtener de category_almacen.name
            else if (producto.category_almacen) {
                if (typeof producto.category_almacen === 'string') {
                    categoryName = producto.category_almacen;
                } else if (typeof producto.category_almacen === 'object' && producto.category_almacen.name) {
                    categoryName = producto.category_almacen.name;
                }
            }
            
            // Si no se encontró, usar 'Sin categoría'
            if (!categoryName || categoryName === '') {
                categoryName = 'Sin categoría';
            }
            
            return {
                ...producto,
                category_name: categoryName,
                // También guardar el ID de categoría para filtrado
                category_id: producto.category_id || (producto.category_almacen?.id || null)
            };
        });
    };

    // Función para cargar productos (en segundo plano si ya hay datos)
    const cargarProductos = async (empresaId, mostrarLoading = true) => {
        try {
            if (mostrarLoading) {
                setLoadingProductos(true);
            }
            
            const response = await productsAlmacenService.getByEmpresaId(empresaId);
            if (response.success && response.data) {
                const productosProcesados = procesarProductos(response.data);
                setProductosCatalogo(productosProcesados);
                setEmpresaIdCatalogo(empresaId); // Guardar el ID de la empresa
            } else {
                console.error('Error al cargar productos:', response.message);
                // Solo limpiar si estamos mostrando loading (primera carga)
                if (mostrarLoading) {
                    setProductosCatalogo([]);
                    setEmpresaIdCatalogo(null);
                }
            }
        } catch (error) {
            console.error('Error al cargar productos del catálogo:', error);
            // Solo limpiar si estamos mostrando loading (primera carga)
            if (mostrarLoading) {
                setProductosCatalogo([]);
                setEmpresaIdCatalogo(null);
            }
        } finally {
            if (mostrarLoading) {
                setLoadingProductos(false);
            }
        }
    };

    // Función para abrir el catálogo y cargar productos
    const handleAbrirCatalogo = async () => {
        if (!empresa?.id) return;
        
        setIsCatalogoOpen(true);
        setCategoriaFiltro(null); // Resetear filtro al abrir
        
        // Si ya hay productos cargados para esta empresa, solo actualizar en segundo plano
        if (productosCatalogo.length > 0 && empresaIdCatalogo === empresa.id) {
            // Actualizar en segundo plano sin mostrar loading
            cargarProductos(empresa.id, false);
        } else {
            // Si no hay datos o es una empresa diferente, limpiar y cargar mostrando loading
            if (empresaIdCatalogo !== empresa.id) {
                setProductosCatalogo([]);
                setEmpresaIdCatalogo(null);
            }
            await cargarProductos(empresa.id, true);
        }
    };

    // Obtener categorías únicas de los productos
    const categoriasUnicas = useMemo(() => {
        const categoriasMap = new Map();
        
        productosCatalogo.forEach(producto => {
            const categoriaNombre = producto.category_name || 'Sin categoría';
            if (!categoriasMap.has(categoriaNombre)) {
                categoriasMap.set(categoriaNombre, {
                    value: categoriaNombre,
                    label: categoriaNombre,
                    icon: 'tag'
                });
            }
        });
        
        const categorias = Array.from(categoriasMap.values());
        categorias.sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
        
        return [
            { value: 'todas', label: 'Todas las categorías', icon: 'tag' },
            ...categorias
        ];
    }, [productosCatalogo]);

    // Filtrar productos por categoría
    const productosFiltrados = useMemo(() => {
        if (!categoriaFiltro || categoriaFiltro === 'todas') {
            return productosCatalogo;
        }
        
        return productosCatalogo.filter(producto => {
            const categoriaProducto = producto.category_name || 'Sin categoría';
            return categoriaProducto === categoriaFiltro;
        });
    }, [productosCatalogo, categoriaFiltro]);

    // Paginación virtual para mostrar productos progresivamente
    const {
        visibleItems: productosVisibles,
        handleScroll: handleProductosScroll
    } = useVirtualPagination(productosFiltrados, 30);

    if (!empresa) {
        return null;
    }

    const displayImage = empresa.logo_tipo;

    // Preparar badges para el perfil
    const badges = [];
    
    // Badge de tipo de empresa - verificar si existe y no es null/undefined
    if (empresa.tipo && empresa.tipo !== null && empresa.tipo !== undefined && empresa.tipo !== '') {
        const tipoText = empresa.tipo === 'ventas' ? 'Ventas' : empresa.tipo === 'ventas_produccion' ? 'Ventas y Producción' : empresa.tipo;
        badges.push({
            text: tipoText,
            icon: 'store',
            backgroundColor: 'rgba(70, 130, 253, 0.2)',
            color: 'var(--info-color)'
        });
    }

    // Badge de asociación - solo si no es la empresa actual
    if (esEmpresaActual) {
        // Si es la empresa actual, mostrar badge informativo (no clickeable)
        badges.push({
            text: 'Empresa Actual',
            icon: 'check-circle',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            color: 'var(--success-color)'
            // Sin onClick, no es clickeable
        });
    } else {
        // Si no es la empresa actual, mostrar opción de asociarse
        badges.push({
            text: isFavorite ? 'Asociado' : 'Asociarme',
            icon: isFavorite ? 'heart' : 'heart',
            backgroundColor: isFavorite ? 'rgba(239, 68, 68, 0.2)' : 'rgba(79, 79, 79, 0.2)',
            color: isFavorite ? 'var(--error-color)' : 'var(--quinary-color)',
            onClick: toggleFavorite
        });
    }

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView onBack={handleClose} title="Detalles de Empresa" />
            
            <div className={styles.container}>
                {/* Información de la empresa usando ItemViewPerfil */}
                <div className={styles.content} style={{ background: 'none', }}>
                <ItemViewPerfil
                    title={empresa.name || 'Sin nombre'}
                    description={empresa.description || 'Sin descripción'}
                    image={displayImage}
                    icon={displayImage ? undefined : 'building'}
                    badges={badges}
                />

                
                    <ComponenteFull
                        title="Catálogo de productos"
                        subtitle="Ver productos disponibles"
                        icon="package"
                        type="arrow"
                        onClick={handleAbrirCatalogo}
                    />
                </div>
            </div>

            {/* Modal de catálogo de productos */}
            <ViewModal isOpen={isCatalogoOpen} setIsOpen={setIsCatalogoOpen}>
                <HeaderModal
                    title={`Catálogo - ${empresa?.name || 'Empresa'}`}
                    onClose={() => setIsCatalogoOpen(false)}
                />
                <div className={styles.modalContent} onScroll={handleProductosScroll}>
                    {loadingProductos ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            {/* Select de filtro por categorías */}
                            {productosCatalogo.length > 0 && (
                                <Select
                                    placeholder="Filtrar por categoría"
                                    options={categoriasUnicas}
                                    value={categoriaFiltro || 'todas'}
                                    onChange={(value) => setCategoriaFiltro(value === 'todas' ? null : value)}
                                    icon="filter"
                                />
                            )}
                            
                            {/* Subtítulo con cantidad de productos */}
                            {productosCatalogo.length > 0 && (
                                <p className={styles.subTitle}>
                                    {productosFiltrados.length === 1 
                                        ? '1 producto' 
                                        : `${productosFiltrados.length} productos`}
                                    {categoriaFiltro && categoriaFiltro !== 'todas' && (
                                        <span> en esta categoría</span>
                                    )}
                                </p>
                            )}
                            
                            {productosVisibles.length > 0 ? (
                                productosVisibles.map((producto, index) => {
                            // Obtener el primer precio del producto para el badge
                            const primerPrecio = producto.price_product && producto.price_product.length > 0
                                ? producto.price_product[0].valor
                                : undefined;
                            
                            // Formatear el precio para el badge (igual que stockDisplay en AlmacenGeneral)
                            const precioDisplay = primerPrecio !== undefined
                                ? `Bs. ${typeof primerPrecio === 'number' ? primerPrecio.toFixed(2) : primerPrecio}`
                                : undefined;
                            
                            // Obtener la categoría para el prop precio (igual que en AlmacenGeneral tipo almacen)
                            const categoria = producto.category_name || 'Sin categoría';
                            
                            return (
                                <ItemProduct
                                    key={producto.id || index}
                                    title={producto.name || 'Sin nombre'}
                                    descriptionBadge={precioDisplay}
                                    descriptionBadgeColor="warning"
                                    icon="box"
                                    onClick={() => {
                                        // Sin acción al hacer click
                                    }}
                                    precio={categoria}
                                    showStockControls={false}
                                    showArrow={false}
                                />
                            );
                        })
                            ) : (
                                <NoData
                                    icon="box"
                                    title={categoriaFiltro ? "No hay productos" : "No hay productos"}
                                    detail={categoriaFiltro 
                                        ? `No hay productos en la categoría "${categoriaFiltro}"`
                                        : "Esta empresa no tiene productos disponibles en su catálogo"}
                                    transparent={true}
                                    minHeight="200px"
                                />
                            )}
                        </>
                    )}
                </div>
            </ViewModal>
        </View>
    );
}

export default EmpresaView;

