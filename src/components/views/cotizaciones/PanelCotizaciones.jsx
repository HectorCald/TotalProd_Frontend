import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerCotizacion from './VerCotizacion';
import Filtros from '../../common/Filtros';
import Notification from '../../common/Notification';
import InfoModal from '../../common/InfoModal';
import cotizacionesService from '../../../services/cotizacionesService';
import RefreshIndicator from '../../common/RefreshIndicator';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroEstadoCotizacion from '../../mixed/FiltroEstadoCotizacion';
import NoData from '../../common/NoData';
import FetchData from '../../mixed/FetchData';


function PanelCotizaciones({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();
    
    // Estados para los modales
    const [isOpenVerCotizacion, setIsOpenVerCotizacion] = useState(false);
    const [infoCotizacion, setInfoCotizacion] = useState(null);

    // Estados para búsqueda
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Estado para acumular o reemplazar las cotizaciones mostradas
    const [allCotizaciones, setAllCotizaciones] = useState([]);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // Estados para cotizaciones
    const [cotizaciones, setCotizaciones] = useState([]);
    const [error, setError] = useState(null);

    // Estados y configuraciones para el modal de información
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        showButton: false
    });


    // Función para manejar cuando se cargan las cotizaciones
    const handleCotizacionesLoaded = useCallback((data) => {
        setCotizaciones(data);
        setAllCotizaciones(data);
    }, []);

    // Función para manejar el loading de cotizaciones
    const handleCotizacionesLoading = useCallback((isLoading) => {
        setShowRefreshIndicator(isLoading);
        setIsRefreshing(isLoading);
    }, []);

    // Limpiar indicador cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
        }
    }, [isOpen]);

    // Estados para la notificación
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

    // Estados para filtros y modales
    const [isOpenFiltroEstado, setIsOpenFiltroEstado] = useState(false);
    const [filtroEstadoNombre, setFiltroEstadoNombre] = useState('Todos los estados');

    // Función para manejar el click en una cotización
    const handleRegistro = (cotizacion) => {
        setInfoCotizacion(cotizacion);
        setIsOpenVerCotizacion(true);
    };


    // Función para manejar filtro de estado
    const handleFiltroEstado = (estado) => {
        setFiltroEstado(estado);
        
        // Actualizar el nombre del filtro
        if (estado === null) {
            setFiltroEstadoNombre('Todos los estados');
        } else if (estado === 'pendiente') {
            setFiltroEstadoNombre('Pendientes');
        } else if (estado === 'aprobada') {
            setFiltroEstadoNombre('Aprobadas');
        } else if (estado === 'anulado') {
            setFiltroEstadoNombre('Anuladas');
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
            setFiltroEstado(null);
            setFiltroEstadoNombre('Todos los estados');
            setOrdenamiento('fecha_desc');
        }
    }, [isOpen]);

    // Efecto para manejar errores
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo cotizaciones:', error);
        }
    }, [error]);

    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Cotizaciones';
            
            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Modulo no incluido',
                description: `${errorMessage}`,
                showButton: true
            });
        } else if (!error || error.status !== 403) {
            // Si no hay error o el error no es 403, cerrar el modal
            setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    }, [error, isOpen]);

    // Función para manejar cuando se anula una cotización
    const handleCotizacionAnulada = (cotizacionId) => {
        // Actualizar el estado local acumulado
        setAllCotizaciones(prevCotizaciones => 
            prevCotizaciones.map(cotizacion => 
                cotizacion.id === cotizacionId 
                    ? { ...cotizacion, estado: 'anulado' }
                    : cotizacion
            )
        );
        
        mostrarNotificacion('success', 'Cotización anulada correctamente');
    };

    // Función para manejar cuando se elimina una cotización
    const handleCotizacionEliminada = (cotizacionId) => {
        // Actualizar el estado local acumulado
        setAllCotizaciones(prevCotizaciones => 
            prevCotizaciones.filter(cotizacion => cotizacion.id !== cotizacionId)
        );
        
        mostrarNotificacion('success', 'Cotización eliminada correctamente');
    };

    // Función para obtener el nombre del filtro de estado
    const getEstadoNombre = () => {
        return filtroEstadoNombre;
    };


    const opciones = [
        {
            label: getEstadoNombre(),
            active: filtroEstado !== null,
            onClick: () => setIsOpenFiltroEstado(true)
        }
    ];

    // Headers para la tabla
    const tableHeaders = [
        { key: 'numero_cotizacion', label: 'Nº', icon: 'hash' },
        { key: 'cliente', label: 'Cliente', icon: 'user' },
        { key: 'total', label: 'Total', icon: 'dollar' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' },
        { key: 'metodo_pago', label: 'Método', icon: 'credit-card' }
    ];

    // Función para normalizar texto (quitar acentos, espacios, guiones, convertir a minúsculas)
    const normalizeText = (text) => {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[-\s]/g, '') // Quitar guiones y espacios
            .trim();
    };

    // Filtrar cotizaciones localmente
    const cotizacionesFiltradas = allCotizaciones.filter(cotizacion => {
        // Filtro de búsqueda normalizado
        const searchQueryNormalized = normalizeText(searchQuery);
        
        // Debug: Log de búsqueda si hay query
        if (searchQuery && searchQuery.trim()) {
            console.log('[PanelCotizaciones] Buscando:', {
                query: searchQuery,
                normalized: searchQueryNormalized,
                cotizacionId: cotizacion.id,
                numero: cotizacion.numero_cotizacion,
                cliente: cotizacion.cliente?.name,
                productos: cotizacion.productos?.length || 0
            });
        }
        
        const matchesSearch = !searchQuery ||
            normalizeText(cotizacion.numero_cotizacion?.toString() || '').includes(searchQueryNormalized) ||
            normalizeText(cotizacion.cliente?.name || '').includes(searchQueryNormalized) ||
            normalizeText(cotizacion.observaciones || '').includes(searchQueryNormalized) ||
            // Buscar en productos de la cotización
            (cotizacion.productos && cotizacion.productos.some(producto => 
                normalizeText(producto.producto?.name || '').includes(searchQueryNormalized) ||
                normalizeText(producto.producto?.description || '').includes(searchQueryNormalized)
            ));

        // Filtro de estado
        const matchesEstado = filtroEstado === null || cotizacion.estado === filtroEstado;

        return matchesSearch && matchesEstado;
    }).sort((a, b) => {
        // Ordenamiento
        switch (ordenamiento) {
            case 'fecha_desc':
                return new Date(b.fecha) - new Date(a.fecha);
            case 'fecha_asc':
                return new Date(a.fecha) - new Date(b.fecha);
            case 'numero_desc':
                return (b.numero_cotizacion || 0) - (a.numero_cotizacion || 0);
            case 'numero_asc':
                return (a.numero_cotizacion || 0) - (b.numero_cotizacion || 0);
            default:
                return new Date(b.fecha) - new Date(a.fecha);
        }
    });

    // Datos para la tabla
    const tableData = cotizacionesFiltradas.map(cotizacion => {
        // Procesar nombre del usuario/personal
        let responsable = 'Usuario desconocido';
        if (cotizacion.user) {
            responsable = `${cotizacion.user.first_name || ''} ${cotizacion.user.last_name || ''}`.trim();
        } else if (cotizacion.personal) {
            responsable = `${cotizacion.personal.first_name || ''} ${cotizacion.personal.last_name || ''}`.trim();
        }

        return {
            id: cotizacion.id,
            numero_cotizacion: cotizacion.numero_cotizacion || 'Sin número',
            cliente: cotizacion.cliente?.name || 'Sin cliente',
            total: `Bs. ${(parseFloat(cotizacion.total) || 0).toFixed(2)}`,
            fecha: new Date(cotizacion.fecha).toLocaleDateString(),
            estado: cotizacion.estado === 'anulado' ? 'Anulado' : cotizacion.estado === 'aprobada' ? 'Aprobada' : 'Pendiente',
            metodo_pago: cotizacion.metodo_pago || '--',
            responsable: responsable
        };
    });

    // Función para obtener el badge de estado
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'estado') {
            const estado = item.estado;
            const badgeConfig = {
                'Pendiente': {
                    text: 'Pendiente',
                    className: 'warning' // amarillo
                },
                'Aprobada': {
                    text: 'Aprobada',
                    className: 'success' // verde
                },
                'Anulado': {
                    text: 'Anulado',
                    className: 'error' // rojo
                },
            };
            
            return badgeConfig[estado] || {
                text: estado,
                className: 'default'
            };
        }
        
        return null;
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView 
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar por número, cliente o productos..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title="Cotizaciones"
            />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <Filtros options={opciones} />
                <div
                    className={styles.content}
                    style={{
                        maxHeight: '100%'
                    }}
                >
                    {isLargeScreen ? (
                        // Vista de tabla para pantallas grandes
                        <Table
                            headers={tableHeaders}
                            data={tableData}
                            onRowClick={(cotizacion) => {
                                // Buscar la cotización original sin formatear
                                const cotizacionOriginal = cotizacionesFiltradas.find(c => c.id === cotizacion.id);
                                handleRegistro(cotizacionOriginal);
                            }}
                            getCellBadge={getCellBadge}
                            columnWidths={{
                                numero_cotizacion: '5%',
                                cliente: '25%',
                                total: '15%',
                                fecha: '15%',
                                estado: '15%',
                                metodo_pago: '15%'
                            }}
                        />
                    ) : (
                        // Vista de cards para pantallas pequeñas
                        cotizacionesFiltradas.length > 0 ? (
                            cotizacionesFiltradas.map((cotizacion, index) => {
                                return (
                                    <ItemView
                                        key={cotizacion.id || index}
                                        title={`Cotización #${cotizacion.numero_cotizacion || 'Sin número'} - ${cotizacion.cliente?.name || 'Sin cliente'}`}
                                        description={`Total: Bs. ${(parseFloat(cotizacion.total) || 0).toFixed(2)} • ${new Date(cotizacion.fecha).toLocaleDateString()}${cotizacion.metodo_pago ? ` • ${cotizacion.metodo_pago}` : ''}`}
                                        icon='file'
                                        onClick={() => handleRegistro(cotizacion)}
                                        arrow={false}
                                        flot3={cotizacion?.estado === 'anulado' ? 'Anulado' : ''}
                                        flot4={cotizacion?.estado === 'aprobada' ? 'Aprobada' : ''}
                                        flot2={cotizacion?.estado === 'pendiente' ? 'Pendiente' : ''}
                                        colorIcon='azul'
                                    />
                                );
                            })
                        ) : (
                            <NoData 
                                icon="file"
                                title={searchQuery || filtroEstado !== null ? 'Sin resultados' : 'No hay cotizaciones'}
                                detail={searchQuery || filtroEstado !== null ? 'Intenta ajustar los filtros de búsqueda para encontrar las cotizaciones que necesitas' : 'Crea cotizaciones para comenzar a gestionar tus presupuestos'}
                                transparent={true}
                                minHeight="200px"
                            />
                        )
                    )}

                </div>
            </div>
            
            {/* Modal de ver cotización*/}
            <VerCotizacion
                isOpen={isOpenVerCotizacion}
                setIsOpen={setIsOpenVerCotizacion}
                cotizacion={infoCotizacion}
                onCotizacionAnulada={handleCotizacionAnulada}
                onCotizacionEliminada={handleCotizacionEliminada}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Filtro de estado de cotización */}
            <FiltroEstadoCotizacion
                isOpen={isOpenFiltroEstado}
                setIsOpen={setIsOpenFiltroEstado}
                onEstadoSeleccionado={handleFiltroEstado}
            />

            {/* Modal de Información */}
            <InfoModal
                isOpen={modalConfig.isOpen}
                setIsOpen={(isOpen) => setModalConfig(prev => ({ ...prev, isOpen }))}
                type={modalConfig.type}
                title={modalConfig.title}
                description={modalConfig.description}
                showButton={modalConfig.showButton}
                buttonText="Aceptar"
                onButtonClick={() => setIsOpen(false)}
            />

            {/* Carga de datos - solo cuando está abierto */}
            {isOpen && (
                <FetchData
                    service={cotizacionesService}
                    serviceName="cotizacionesService"
                    isOpen={isOpen}
                    onDataLoaded={handleCotizacionesLoaded}
                    onLoadingStart={() => handleCotizacionesLoading(true)}
                    onLoadingEnd={() => handleCotizacionesLoading(false)}
                />
            )}

        </View>

    );
}
export default PanelCotizaciones;
