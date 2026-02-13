import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerCategoria from './VerCategoria';
import Boton from '../../common/Boton';
import EditarAgregarCategoria from './EditarAgregarCategoria';
import { useToast } from '../../../context/ToastContext';
import categoryAlmacenService from '../../../services/categoryAlmacenService';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FetchData from '../../mixed/FetchData';
import NoData from '../../common/NoData';
import PullToRefresh from '../../common/PullToRefresh';
import LoadingSpinner from '../../common/LoadingSpinner';
import useSessionCache from '../../../hooks/useSessionCache';
    
function CategoriasAlmacen({ isOpen, setIsOpen, modoSeleccion = false, onCategoriaSeleccionada }) {
    const { isLargeScreen } = useLayout();
    const { showSuccess } = useToast();
    // Estados para los modales
    const [isOpenVerCategoria, setIsOpenVerCategoria] = useState(false);
    const [infoCategoria, setInfoCategoria] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);
    
    // Estados para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estados para categorías (cacheadas por sesión)
    const {
        value: categorias,
        setValue: setCategorias,
    } = useSessionCache({
        key: 'categoriasAlmacenListado',
        defaultValue: [],
    });
    const [isLoading, setIsLoading] = useState(false);

    // Función para manejar cuando se cargan las categorías
    const handleCategoriasLoaded = useCallback((data) => {
        setCategorias(data);
    }, []);

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (categorias.length === 0) {
            setIsLoading(true);
        }
        // Incrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = prev + 1;
            // Mostrar RefreshIndicator solo cuando hay peticiones activas
            if (isLargeScreen && newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [categorias.length, isLargeScreen]);

    // Función para manejar cuando termina la carga
    const handleLoadingEnd = useCallback(() => {
        setIsLoading(false);
        // Decrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
            // Ocultar RefreshIndicator cuando no hay peticiones activas
            if (newCount === 0 && isLargeScreen) {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setTimeout(() => {
                        setShowRefreshIndicator(false);
                    }, 500);
                }, 300);
            }
            return newCount;
        });
    }, [isLargeScreen]);

    // Limpiar indicador cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
        }
    }, [isOpen]);

    // Función para manejar el click en una categoría
    const handleCategoria = (categoria) => {
        if (modoSeleccion) {
            // En modo selección, seleccionar la categoría y cerrar
            if (onCategoriaSeleccionada) {
                onCategoriaSeleccionada(categoria);
            }
            setIsOpen(false);
        } else {
            // Modo normal, abrir modal de ver categoría
            setInfoCategoria(categoria);
            setIsOpenVerCategoria(true);
        }
    };

    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await categoryAlmacenService.getAll();
            if (response.success) {
                setCategorias(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar categorías:', error);
        }
    };

    // Funciones para el buscador expandible
    const handleSearchChange = (value) => {
        setSearchQuery(value);
    };

    const handleSearchClear = () => {
        setSearchQuery('');
    };

    const handleSearchToggle = (isExpanded) => {
        setIsSearchExpanded(isExpanded);
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Obtener empresa_id actual (se recalcula cuando cambia la sucursal)
    const empresaIdActual = useMemo(() => {
        try {
            const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
            if (sucursalSeleccionada) {
                const parsed = JSON.parse(sucursalSeleccionada);
                return parsed.empresas?.id;
            }
        } catch (error) {
            console.error('Error al obtener empresa_id:', error);
        }
        return null;
    }, [isOpen]); // Recalcular cuando se abre la vista

    // Filtrar categorías localmente: excluir categorías asociadas y aplicar búsqueda
    const categoriasFiltradas = useMemo(() => {
        return categorias.filter(categoria => {
            // Excluir categorías asociadas (empresa_id diferente a la actual)
            if (empresaIdActual && categoria.empresa_id && categoria.empresa_id !== empresaIdActual) {
                return false;
            }
            
            // Aplicar filtro de búsqueda
            return categoria.name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [categorias, empresaIdActual, searchQuery]);

    // Headers para la tabla
    const tableHeaders = [
        { key: 'name', label: 'Categoría', icon: 'category' }
    ];

    // Datos para la tabla
    const tableData = categoriasFiltradas.map(categoria => ({
        id: categoria.id,
        name: categoria.name || 'Sin nombre'
    }));


    // Función para manejar cuando se crea una nueva categoría
    const handleCategoriaCreated = (newCategoria) => {
        // Actualizar el estado local con la categoría que devuelve el servidor
        setCategorias(prevCategorias => [newCategoria, ...prevCategorias]);
        
        // Cerrar el modal
        setIsAgregarOpen(false);
        showSuccess('Éxito', 'Categoría agregada correctamente');
    };

    // Función para manejar cuando se elimina una categoría
    const handleCategoriaDeleted = (deletedId) => {
        // Actualizar el estado local removiendo la categoría eliminada
        setCategorias(prevCategorias => prevCategorias.filter(categoria => categoria.id !== deletedId));
        
        // Cerrar el modal de ver categoría
        setIsOpenVerCategoria(false);
        showSuccess('Éxito', 'Categoría eliminada correctamente');
    };

    // Función para manejar cuando se actualiza una categoría
    const handleCategoriaUpdated = (updatedCategoria) => {
        // Actualizar el estado local con la categoría actualizada que devuelve el servidor
        setCategorias(prevCategorias => prevCategorias.map(categoria => 
            categoria.id === updatedCategoria.id ? updatedCategoria : categoria
        ));
        
        // Cerrar el modal de ver categoría
        setIsOpenVerCategoria(false);
        showSuccess('Éxito', 'Categoría actualizada correctamente');
    };


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView 
                onBack={() => setIsOpen(false)} 
                title={modoSeleccion ? 'Seleccionar Categoría' : 'Categorías'}
                showSearch={true}
                searchPlaceholder="Buscar categoría"
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
            />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                {isLoading ? (
                        // Mostrar LoadingSpinner cuando está cargando
                        <LoadingSpinner />
                    ) : isLargeScreen ? (
                        // Vista de tabla para pantallas grandes
                        <div className={styles.content} style={{ maxHeight: 'calc(100% - 90px)' }}>
                        <Table
                            headers={tableHeaders}
                            data={tableData}
                            onRowClick={(categoria) => {
                                // Buscar la categoría original sin formatear
                                const categoriaOriginal = categoriasFiltradas.find(c => c.id === categoria.id);
                                handleCategoria(categoriaOriginal);
                            }}
                        />
                        </div>
                    ) : (
                        // Vista de cards para pantallas pequeñas con PullToRefresh
                        <PullToRefresh
                            onRefresh={handleRefresh}
                            screenName="Categorías"
                            containerStyle={{
                                maxHeight: 'calc(100% - 80px)',
                                minHeight: 'calc(100% - 80px)'
                            }}
                        >
                            {categoriasFiltradas.length > 0 ? (
                                categoriasFiltradas.map((categoria, index) => (
                                    <ItemView
                                        key={categoria.id || index}
                                        title={categoria.name || 'Sin nombre'}
                                        icon="category"
                                        arrow={true}
                                        onClick={() => handleCategoria(categoria)}
                                    />
                                ))
                            ) : (
                                <NoData 
                                    icon="category"
                                    title={searchQuery ? 'Sin resultados' : 'No hay categorías'}
                                    detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar las categorías que necesitas' : 'Crea categorías para organizar mejor tus productos del almacén'}
                                    transparent={searchQuery}
                                    minHeight="200px"
                                />
                            )}
                        </PullToRefresh>
                    )}
                
            </div>

            <div className={styles.buttonFooter}>
                <Boton
                    className='btn-original'
                    label='Nueva categoría'
                    onClick={() => { setIsAgregarOpen(true); }}
                />
            </div>

            {/* Modal de ver categoría - solo en modo normal */}
            {!modoSeleccion && (
                <VerCategoria 
                    isOpen={isOpenVerCategoria} 
                    setIsOpen={setIsOpenVerCategoria} 
                    categoria={infoCategoria}
                    onCategoriaDeleted={handleCategoriaDeleted}
                    onCategoriaUpdated={handleCategoriaUpdated}
                />
            )}

            {/* Modal de agregar categoría*/}
            <EditarAgregarCategoria 
                isOpen={isAgregarOpen} 
                setIsOpen={setIsAgregarOpen} 
                tipo='agregar'
                onCategoriaCreated={handleCategoriaCreated}
            />
            {/* Carga de datos - solo cuando está abierto */}
            {isOpen && (
                <FetchData
                    service={categoryAlmacenService}
                    serviceName="categoryAlmacenService"
                    isOpen={isOpen}
                    onDataLoaded={handleCategoriasLoaded}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                />
            )}
        </View>
    );
}

export default CategoriasAlmacen;
