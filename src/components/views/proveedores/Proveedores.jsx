import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerProveedor from './VerProveedor';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import { useProveedores } from '../../../hooks/useData';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';

import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';

function Proveedores({ isOpen, setIsOpen, modoSeleccion = false, onProveedorSeleccionado }) {
    
    const [isOpenVerProveedor, setIsOpenVerProveedor] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // 🚀 Hook genérico con SWR - Solo se ejecuta cuando el modal está abierto
    const { proveedores, hasMorePages, error, isLoading, refetch } = useProveedores(
        isOpen ? debouncedSearchQuery : '', 
        isOpen ? currentPage : 1,
        isOpen
    );

    // Mostrar indicador cuando se ejecuta fetcher (cualquier cambio en isLoading)
    useEffect(() => {
        if (isLoading && isOpen) {
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
        } else if (!isLoading && showRefreshIndicator) {
            // Cuando termina de cargar, mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    }, [isLoading, isOpen, showRefreshIndicator]);



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


    // Función para manejar el click en un proveedor
    const handleProveedor = (persona) => {
        if (modoSeleccion) {
            // En modo selección, seleccionar el proveedor y cerrar
            if (onProveedorSeleccionado) {
                onProveedorSeleccionado(persona);
            }
            setIsOpen(false);
        } else {
            // Modo normal, abrir modal de ver proveedor
            setIsOpenVerProveedor(true);
            setInfoPersona(persona);
        }
    };


    // 🚀 SWR maneja automáticamente la carga de datos
    // No necesitamos fetchProveedores manual
    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // Función para manejar búsqueda
    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        
        try {
            await refetch();
            
            // Mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        } catch (error) {
            setIsRefreshing(false);
            setShowRefreshIndicator(false);
        }
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Proveedores';
            
            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Plan Insuficiente',
                description: `${errorMessage}`,
                showButton: true
            });
        }
    }, [error, isOpen]);

    // Función para manejar cuando se crea un nuevo proveedor
    const handleProveedorCreated = (newProveedor) => {
        // Actualizar el cache localmente con el proveedor que devuelve el servidor
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: [newProveedor, ...currentData.data]
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal
        setIsOpenEditarAgregar(false);
        mostrarNotificacion('success', 'Proveedor agregado correctamente')
    };

    // Función para manejar cuando se elimina un proveedor
    const handleProveedorDeleted = (deletedId) => {
        // Actualizar el cache localmente removiendo el proveedor eliminado
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: currentData.data.filter(proveedor => proveedor.id !== deletedId)
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal de ver proveedor
        setIsOpenVerProveedor(false);
        mostrarNotificacion('success', 'Proveedor eliminado correctamente')
    };

    // Función para manejar cuando se actualiza un proveedor
    const handleProveedorUpdated = (updatedProveedor) => {
        // Actualizar el cache localmente con el proveedor actualizado que devuelve el servidor
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: currentData.data.map(proveedor => 
                    proveedor.id === updatedProveedor.id ? updatedProveedor : proveedor
                )
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal de ver proveedor
        setIsOpenVerProveedor(false);
        mostrarNotificacion('success', 'Proveedor actualizado correctamente')
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        {modoSeleccion ? 'Seleccionar Proveedor' : 'Proveedores'}
                        <button className={styles.refreshButton} onClick={handleRefresh}>
                            <BoxIcon name='refresh' />
                        </button>
                    </h1>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <div className={styles.searchContainer}>
                    <InputSearch
                        placeholder='Buscar por nombre o teléfono...'
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                    />
                </div>
                <div className={styles.content} onScroll={handleScroll}>
                    {isSearching ? (
                        <div className={styles.searchingData}>
                            <p>Buscando...</p>
                        </div>
                    ) : proveedores.length > 0 ? (
                        proveedores.map((proveedor, index) => (
                            <ItemView
                                key={proveedor.id || index}
                                title={proveedor.name || 'Sin nombre'}
                                description={proveedor.description || 'Sin descripción'}
                                arrow={true}
                                onClick={() => handleProveedor(proveedor)}
                            />
                        ))
                    ) : (
                        <div className={styles.noData}>
                            <p>{searchQuery ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}</p>
                        </div>
                    )}

                    {/* Indicador de carga para más elementos */}
                    {isLoading && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más proveedores...</p>
                        </div>
                    )}
                </div>
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar proveedor'
                        onClick={() => setIsOpenEditarAgregar(true)}
                    />
                </div>
            </div>
            {/* Modal de Ver Proveedor - solo en modo normal */}
            {!modoSeleccion && (
                <VerProveedor
                    isOpen={isOpenVerProveedor}
                    setIsOpen={setIsOpenVerProveedor}
                    usuario={infoPersona}
                    onProveedorDeleted={handleProveedorDeleted}
                    onProveedorUpdated={handleProveedorUpdated}
                />
            )}

            {/* Modal de Editar/Agregar */}
            <EditarAgregar
                isOpen={isOpenEditarAgregar}
                setIsOpen={setIsOpenEditarAgregar}
                tipo='agregar'
                onProveedorCreated={handleProveedorCreated}
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
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}
export default Proveedores;