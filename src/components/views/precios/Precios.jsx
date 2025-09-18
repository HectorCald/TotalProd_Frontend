import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerPrecio from './VerPrecio';
import Boton from '../../common/Boton';
import EditarAgregarPrecio from './EditarAgregarPrecio';
import pricesTypesService from '../../../services/pricesTypesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';
import { usePrecios } from '../../../hooks/useData';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';

function Precios({ isOpen, setIsOpen }) {
    // Estados para los modales
    const [isOpenVerPrecio, setIsOpenVerPrecio] = useState(false);
    const [infoPrecio, setInfoPrecio] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // 🚀 Hook genérico con SWR - Solo se ejecuta cuando el modal está abierto
    const { precios, error, isLoading, refetch } = usePrecios(
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

    // Estados y configuraciones para el modal de información
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        showButton: false
    });

    // Función para manejar el click en un precio
    const handlePrecio = (precio) => {
        setInfoPrecio(precio);
        setIsOpenVerPrecio(true);
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

    // Efecto para manejar errores de SWR
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo precios:', error);
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Error de Acceso',
                description: 'No tienes permisos para acceder a esta función.',
                showButton: true
            });
        }
    }, [error]);

    // Función para manejar cuando se crea un nuevo precio
    const handlePrecioCreated = (newPrecio) => {
        // Actualizar el cache localmente con el precio que devuelve el servidor
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: [newPrecio, ...currentData.data]
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Tipo de precio agregado correctamente');
    };

    // Función para manejar cuando se elimina un precio
    const handlePrecioDeleted = (deletedId) => {
        // Actualizar el cache localmente removiendo el precio eliminado
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: currentData.data.filter(precio => precio.id !== deletedId)
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal de ver precio
        setIsOpenVerPrecio(false);
        mostrarNotificacion('success', 'Tipo de precio eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un precio
    const handlePrecioUpdated = (updatedPrecio) => {
        // Actualizar el cache localmente con el precio actualizado que devuelve el servidor
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: currentData.data.map(precio => 
                    precio.id === updatedPrecio.id ? updatedPrecio : precio
                )
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal de ver precio
        setIsOpenVerPrecio(false);
        mostrarNotificacion('success', 'Tipo de precio actualizado correctamente');
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        Tipos de Precios
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
                        placeholder='Buscar tipo de precio'
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                    />
                </div>
                <div className={styles.content}>
                    {precios.length > 0 ? (
                        precios.map((precio, index) => (
                            <ItemView
                                key={precio.id || index}
                                title={precio.name || 'Sin nombre'}
                                description={precio.description || 'Sin descripción'}
                                icon="dollar"
                                arrow={true}
                                onClick={() => handlePrecio(precio)}
                            />
                        ))
                    ) : (
                        <div className={styles.noData}>
                            <p>{searchQuery ? 'No se encontraron tipos de precio' : 'No hay tipos de precio registrados'}</p>
                        </div>
                    )}

                    {/* Indicador de carga para más elementos */}
                    {isLoading && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más tipos de precio...</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.buttonFooter}>
                <Boton
                    className='btn-original'
                    label='Nuevo tipo de precio'
                    onClick={() => { setIsAgregarOpen(true); }}
                />
            </div>

            {/* Modal de ver precio*/}
            <VerPrecio 
                isOpen={isOpenVerPrecio} 
                setIsOpen={setIsOpenVerPrecio} 
                precio={infoPrecio}
                onPrecioDeleted={handlePrecioDeleted}
                onPrecioUpdated={handlePrecioUpdated}
            />

            {/* Modal de agregar precio*/}
            <EditarAgregarPrecio 
                isOpen={isAgregarOpen} 
                setIsOpen={setIsAgregarOpen} 
                tipo='agregar'
                onPrecioCreated={handlePrecioCreated}
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
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default Precios;
