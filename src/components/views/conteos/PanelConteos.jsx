import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import conteosService from '../../../services/conteosService';
import NoData from '../../common/NoData';
import VerConteo from './VerConteo';
import InfoModal from '../../common/InfoModal';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import FetchDataProgressive from '../../mixed/FetchDataProgressive';

function PanelConteos({ isOpen, setIsOpen, tipoConteo = 'almacen' }) {
    const { isLargeScreen } = useLayout();

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const [conteos, setConteos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingConteos, setIsLoadingConteos] = useState(false);
    const [error, setError] = useState(null);
    
    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Estado para rastrear qué datos se han cargado
    const [conteosLoaded, setConteosLoaded] = useState(false);

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

    // Callbacks para FetchDataProgressive
    const handleDataLoaded = useCallback((data) => {
        setConteos(data);
        setError(null);
        setConteosLoaded(true);
    }, []);

    const handleLoadingStart = useCallback(() => {
        if (conteos.length === 0) {
            setIsLoading(true);
            setIsLoadingConteos(true);
        }
        
        setActiveRequests(prev => {
            const newCount = prev + 1;
            if (isLargeScreen && newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [conteos.length, isLargeScreen]);

    const handleLoadingEnd = useCallback(() => {
        setIsLoading(false);
        setIsLoadingConteos(false);
        
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
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

    const handleError = useCallback((err) => {
        setError(err);
        // Solo mostrar notificación si NO es un error 403
        if (err.status !== 403) {
            mostrarNotificacion('error', err.message || 'Error al obtener conteos');
        }
    }, [mostrarNotificacion]);

    const handleHasMorePagesChange = useCallback(() => {
        // No hay paginación en conteos, pero el callback debe existir
    }, []);

    // Wrapper para el servicio
    const conteosServiceWrapper = useMemo(() => ({
        getAll: async (page, limit) => {
            const tipo = tipoConteo === 'almacen' ? 'almacen' : tipoConteo === 'acopio' ? 'acopio' : null;
            return await conteosService.getAll({ tipo });
        }
    }), [tipoConteo]);

    // Resetear flags cuando se abre el modal (NO los datos)
    useEffect(() => {
        if (isOpen) {
            setConteosLoaded(false);
        }
    }, [isOpen]);

    // Limpiar indicador cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
        }
    }, [isOpen]);

    // tipoConteo controla el dataset
    useEffect(() => {
        // Limpiar datos cuando cambia el tipo
        setConteos([]);
        setSearchQuery('');
        setConteosLoaded(false);
        // FetchDataProgressive se encargará de recargar automáticamente
    }, [tipoConteo, isOpen]);

    // Función para manejar refresh
    const handleRefresh = async () => {
        // Limpiar estado y resetear flag
        setConteosLoaded(false);
        // FetchDataProgressive se encargará de recargar automáticamente
    };

    const filtered = conteos.filter(c => {
        if (!searchQuery) return true;
        const text = `${c.tipo || ''} ${c.observaciones || ''}`.toLowerCase();
        return text.includes(searchQuery.toLowerCase());
    });

    const opciones = [];

    const tableHeaders = [
        { key: 'tipo', label: 'Tipo', icon: 'category' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'detalles', label: 'Items', icon: 'list-ul' },
        { key: 'observaciones', label: 'Observaciones', icon: 'message-square-detail' }
    ];

    const tableData = filtered.map(c => ({
        id: c.id,
        tipo: c.tipo === 'almacen' ? 'Almacén' : 'Materia Prima',
        fecha: new Date(c.fecha).toLocaleString(),
        detalles: c.detalles_count || 0,
        observaciones: c.observaciones || ''
    }));

    const handleRegistro = (conteo) => {
        // Se abrirá un modal de detalle (VerConteo)
        setSelectedConteo(conteo);
        setIsOpenVerConteo(true);
    };

    const handleConteoDeleted = (deletedConteoId) => {
        // Remover el conteo eliminado del estado local
        setConteos(prevConteos => prevConteos.filter(c => c.id !== deletedConteoId));
        mostrarNotificacion('success', 'Conteo eliminado exitosamente');
    };

    const handleConteoReemplazado = (conteoId) => {
        // Podemos recargar o simplemente notificar; por ahora solo notificar
        mostrarNotificacion('success', 'Stock reemplazado correctamente');
    };

    const [isOpenVerConteo, setIsOpenVerConteo] = useState(false);
    const [selectedConteo, setSelectedConteo] = useState(null);

    // Estados y configuraciones para el modal de información
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        showButton: false
    });

    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Conteos';
            
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

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar conteos..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchClear={() => setSearchQuery('')}
                searchExpanded={isSearchExpanded}
                onSearchToggle={setIsSearchExpanded}
                title={tipoConteo === 'acopio' ? 'Conteos Materia Prima' : tipoConteo === 'almacen' ? 'Conteos Almacén' : 'Conteos'}
            />
            <div className={styles.container}>
                {isLoadingConteos ? (
                    // Mostrar LoadingSpinner cuando está cargando
                    <LoadingSpinner />
                ) : (
                    <>
                        {isLargeScreen ? (
                            // Vista de tabla para pantallas grandes
                            <>
                                <div className={styles.titleContainer}>
                                    <RefreshIndicator
                                        isVisible={showRefreshIndicator}
                                        isLoading={isRefreshing}
                                    />
                                </div>
                                <div className={styles.content} style={{ maxHeight: '100%' }}>
                                <Table
                                    headers={tableHeaders}
                                    data={tableData}
                                    onRowClick={(row) => {
                                        const original = filtered.find(c => c.id === row.id);
                                        handleRegistro(original);
                                    }}
                                    getBadge={() => null}
                                />
                                </div>
                            </>
                        ) : (
                            // Vista de cards para pantallas pequeñas con PullToRefresh
                            <PullToRefresh
                                onRefresh={handleRefresh}
                                screenName="Conteos"
                                containerStyle={{
                                    maxHeight: 'calc(100% - 80px)',
                                    minHeight: 'calc(100% - 80px)'
                                }}
                            >
                                {filtered.length > 0 ? (
                                    filtered.map((c, idx) => (
                                        <ItemView
                                            key={c.id || idx}
                                            title={`${c.tipo === 'almacen' ? 'Almacén' : 'Materia Prima'} - ${new Date(c.fecha).toLocaleDateString()}`}
                                            description={c.observaciones || 'Sin observaciones'}
                                            icon='list-check'
                                            onClick={() => handleRegistro(c)}
                                            flot1={`${c.detalles_count || 0} ítems`}
                                        />
                                    ))
                                ) : (
                                    <NoData 
                                        icon="calculator"
                                        title={searchQuery ? 'Sin resultados' : 'No hay conteos'}
                                        detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar los conteos que necesitas' : 'Realiza conteos de inventario para comenzar a gestionar tu stock'}
                                        transparent={true}
                                        minHeight="200px"
                                    />
                                )}
                            </PullToRefresh>
                        )}
                    </>
                )}
            </div>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
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

            {/* Modal de ver conteo */}
            <VerConteo
                isOpen={isOpenVerConteo}
                setIsOpen={setIsOpenVerConteo}
                conteo={selectedConteo}
                onConteoDeleted={handleConteoDeleted}
                onConteoReplaced={handleConteoReemplazado}
            />

            {/* Carga de datos - solo cuando está abierto */}
            {isOpen && (
                <FetchDataProgressive
                    service={conteosServiceWrapper}
                    method="getAll"
                    methodParams={[]}
                    serviceName="conteosService"
                    isOpen={isOpen && !conteosLoaded}
                    page={1}
                    limit={1}
                    onDataLoaded={handleDataLoaded}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                    onHasMorePagesChange={handleHasMorePagesChange}
                />
            )}
        </View>
    );
}

export default PanelConteos;


