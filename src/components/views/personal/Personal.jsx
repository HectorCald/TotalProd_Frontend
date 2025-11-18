import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerPersona from './VerPersona';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import FetchData from '../../mixed/FetchData';
import personalService from '../../../services/personalService';
import sucursalesService from '../../../services/sucursalesService';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/LoadingSpinner';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import NoData from '../../common/NoData';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import useSessionCache from '../../../hooks/useSessionCache';


function Personal({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();
    
    const [isOpenVerPersona, setIsOpenVerPersona] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);

    // Estados para personal
    const {
        value: personal,
        setValue: setPersonal,
    } = useSessionCache({
        key: 'personalListado',
        defaultValue: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Estado para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estados para sucursales
    const [sucursales, setSucursales] = useState([]);

    // Callbacks para FetchData
    const handlePersonalLoaded = useCallback((data) => {
        setPersonal(data || []);
        setError(null); // Limpiar error cuando se cargan datos exitosamente
    }, []);

    const handleSucursalesLoaded = useCallback((data) => {
        setSucursales(data || []);
    }, []);

    // Función para manejar errores de FetchData
    const handleError = useCallback((error) => {
        setError(error);
    }, []);

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (personal.length === 0) {
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
    }, [personal.length]);

    // Función para manejar cuando termina la carga
    const handleLoadingEnd = useCallback(() => {
        setIsLoading(false);
        // Decrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
            // Ocultar RefreshIndicator cuando no hay peticiones activas
            if (newCount === 0) {
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



    // Estado para la notificación
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

    // Estados y configuraciones para el modal de información
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        showButton: false
    });


    // Función para manejar el click en un personal
    const handlePersonal = (persona) => {
        setIsOpenVerPersona(true);
        setInfoPersona(persona);
    };


    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            // Cargar personal
            const personalResponse = await personalService.getAll();
            if (personalResponse.success) {
                setPersonal(personalResponse.data);
            }

            // Cargar sucursales
            const sucursalesResponse = await sucursalesService.getByEmpresaId();
            if (sucursalesResponse.success) {
                setSucursales(sucursalesResponse.data);
            }
        } catch (error) {
            console.error('Error al refrescar datos:', error);
        }
    };


    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

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

    // Filtrar personal localmente basado en la búsqueda
    const personalFiltrado = personal.filter(persona => 
        `${persona.first_name} ${persona.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (persona.codigo && persona.codigo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (persona.cargo && persona.cargo.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const personalOrdenado = [...personalFiltrado].sort((a, b) =>
        (`${a.first_name || ''} ${a.last_name || ''}`).localeCompare(`${b.first_name || ''} ${b.last_name || ''}`)
    );

    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Personal';
            
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

    // Función para manejar cuando se crea un nuevo personal
    const handlePersonalCreated = (newPersonal) => {
        // Actualizar el estado local con el personal que devuelve el servidor
        setPersonal(prevPersonal => [newPersonal, ...prevPersonal]);
        
        // Cerrar el modal
        setIsOpenEditarAgregar(false);
        mostrarNotificacion('success', 'Personal agregado correctamente');
    };

    // Función para manejar cuando se elimina un personal
    const handlePersonalDeleted = (deletedId) => {
        // Actualizar el estado local removiendo el personal eliminado
        setPersonal(prevPersonal => prevPersonal.filter(personal => personal.id !== deletedId));
        
        // Cerrar el modal de ver personal
        setIsOpenVerPersona(false);
        mostrarNotificacion('success', 'Personal eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un personal
    const handlePersonalUpdated = (updatedPersonal) => {
        // Actualizar el estado local con el personal actualizado que devuelve el servidor
        setPersonal(prevPersonal => prevPersonal.map(personal => 
            personal.id === updatedPersonal.id ? updatedPersonal : personal
        ));
        
        // NO cerrar el modal de ver personal - se queda abierto para ver los cambios
        // El modal VerPersona maneja su propia actualización local
        mostrarNotificacion('success', 'Personal actualizado correctamente');
    };

    // Headers para la tabla
    const tableHeaders = [
        { key: 'nombre', label: 'Nombre', icon: 'user' },
        { key: 'cargo', label: 'Cargo', icon: 'briefcase' },
        { key: 'codigo', label: 'Código', icon: 'id-card' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' },
        { key: 'sucursal', label: 'Sucursal', icon: 'store' }
    ];

    // Datos para la tabla
    const tableData = personalOrdenado.map(persona => ({
        id: persona.id,
        nombre: `${persona.first_name} ${persona.last_name}`,
        cargo: persona.cargo || '--',
        codigo: persona.codigo || '--',
        estado: persona.is_active ? 'Activo' : 'Inactivo',
        sucursal: persona.sucursal?.name || 'Sin sucursal'
    }));

    // Función para obtener el badge de estado
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'estado') {
            const estado = item.estado;
            const badgeConfig = {
                'Activo': {
                    text: 'Activo',
                    className: 'success' // verde
                },
                'Inactivo': {
                    text: 'Inactivo',
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
                searchPlaceholder="Buscar por nombre o código..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title='Personal'
            />
            <div className={styles.container}>
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
                        {isLargeScreen ? (
                    // Vista de tabla para pantallas grandes
                    <>
                        <div className={styles.content} style={{
                            maxHeight: 'calc(100% - 80px)',
                            minHeight: 'calc(100% - 80px)'
                        }}>
                            <Table
                                headers={tableHeaders}
                                data={tableData}
                                onRowClick={(persona) => {
                                    // Buscar la persona original sin formatear
                                    const personaOriginal = personalFiltrado.find(p => p.id === persona.id);
                                    handlePersonal(personaOriginal);
                                }}
                                getCellBadge={getCellBadge}
                            />
                        </div>
                    </>
                        ) : (
                    // Vista de cards para pantallas pequeñas con PullToRefresh
                    <PullToRefresh
                        onRefresh={handleRefresh}
                        screenName="Personal"
                        containerStyle={{
                            maxHeight: 'calc(100% - 80px)',
                            minHeight: 'calc(100% - 80px)'
                        }}
                    >
                        {personalOrdenado.length > 0 ? (
                            personalOrdenado.map((persona, index) => (
                                <ItemView
                                    key={persona.id || index}
                                    title={`${persona.first_name} ${persona.last_name}`}
                                    description={persona.cargo || 'Sin cargo'}
                                    arrow={true}
                                    onClick={() => handlePersonal(persona)}
                                    float2={persona.is_active ? 'Activo' : 'Inactivo'}
                                />
                            ))
                        ) : (
                            <NoData 
                                icon="user-check"
                                title={searchQuery ? 'Sin resultados' : 'No hay personal'}
                                detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar el personal que necesitas' : 'Registra personal para comenzar a gestionar tu equipo de trabajo'}
                                transparent={true}
                                minHeight="200px"
                            />
                        )}
                    </PullToRefresh>
                        )}
                    </>
                )}
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar personal'
                        onClick={() => setIsOpenEditarAgregar(true)}
                    />
                </div>
            </div>
            {/* Modal de Ver Personal */}
            <VerPersona
                isOpen={isOpenVerPersona}
                setIsOpen={setIsOpenVerPersona}
                usuario={infoPersona}
                onProveedorDeleted={handlePersonalDeleted}
                onProveedorUpdated={handlePersonalUpdated}
                sucursales={sucursales}
            />

            {/* Modal de Editar/Agregar */}
            <EditarAgregar
                isOpen={isOpenEditarAgregar}
                setIsOpen={setIsOpenEditarAgregar}
                tipo='agregar'
                onPersonalCreated={handlePersonalCreated}
                sucursales={sucursales}
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
                onButtonClick={(setIsOpen)}
            />
            {/* FetchData para personal */}
            {isOpen && (
                <FetchData
                    service={personalService}
                    serviceName="personalService"
                    isOpen={isOpen}
                    onDataLoaded={handlePersonalLoaded}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                    onRefresh={isLargeScreen ? handleRefresh : undefined}
                />
            )}

            {/* FetchData para sucursales */}
            {isOpen && (
                <FetchData
                    service={sucursalesService}
                    serviceName="sucursalesService"
                    method="getByEmpresaId"
                    isOpen={isOpen}
                    onDataLoaded={handleSucursalesLoaded}
                />
            )}

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}
export default Personal;