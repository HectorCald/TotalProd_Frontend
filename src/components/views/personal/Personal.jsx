import React, { useState, useEffect } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerPersona from './VerPersona';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import LoadingSpinner from '../../common/LoadingSpinner';
import { usePersonal } from '../../../hooks/useData';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';

import personalService from '../../../services/personalService';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';


function Personal({ isOpen, setIsOpen }) {
    const [isOpenVerPersona, setIsOpenVerPersona] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 🚀 Hook genérico con SWR - Solo se ejecuta cuando el modal está abierto
    const { personal, hasMorePages, error, isLoading, refetch } = usePersonal(
        '', // No hay búsqueda en personal
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


    // Función para manejar el click en un personal
    const handlePersonal = (persona) => {
        setIsOpenVerPersona(true);
        setInfoPersona(persona);
    };

    // 🚀 SWR maneja automáticamente la carga de datos
    // No necesitamos fetchPersonal manual
    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading) {
            setCurrentPage(prev => prev + 1);
        }
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

    // Efecto para resetear página cuando se abre
    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Efecto para manejar errores de SWR
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo personal:', error);
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Error de Acceso',
                description: 'No tienes permisos para acceder a esta función.',
                showButton: true
            });
        }
    }, [error]);

    // Función para manejar cuando se crea un nuevo personal
    const handlePersonalCreated = (newPersonal) => {
        // Actualizar el cache localmente con el personal que devuelve el servidor
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: [newPersonal, ...currentData.data]
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal
        setIsOpenEditarAgregar(false);
        mostrarNotificacion('success', 'Personal agregado correctamente');
    };

    // Función para manejar cuando se elimina un personal
    const handlePersonalDeleted = (deletedId) => {
        // Actualizar el cache localmente removiendo el personal eliminado
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: currentData.data.filter(personal => personal.id !== deletedId)
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal de ver personal
        setIsOpenVerPersona(false);
        mostrarNotificacion('success', 'Personal eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un personal
    const handlePersonalUpdated = (updatedPersonal) => {
        // Actualizar el cache localmente con el personal actualizado que devuelve el servidor
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: currentData.data.map(personal => 
                    personal.id === updatedPersonal.id ? updatedPersonal : personal
                )
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal de ver personal
        setIsOpenVerPersona(false);
        mostrarNotificacion('success', 'Personal actualizado correctamente');
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        Personal
                        <button className={styles.refreshButton} onClick={handleRefresh}>
                            <BoxIcon name='refresh' />
                        </button>
                    </h1>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <div className={styles.content} onScroll={handleScroll}>
                    {personal.length > 0 ? (
                        personal.map((personal, index) => (
                            <ItemView
                                key={personal.id || index}
                                title={`${personal.first_name} ${personal.last_name}`}
                                description={`Código: ${personal.codigo}`}
                                arrow={true}
                                onClick={() => handlePersonal(personal)}
                                float2={personal.is_active ? 'Activo' : 'Inactivo'}
                            />
                        ))
                    ) : (
                        <div className={styles.noData}>
                            <p>No hay personal registrado</p>
                        </div>
                    )}

                    {/* Indicador de carga para más elementos */}
                    {isLoading && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más personal...</p>
                        </div>
                    )}
                </div>
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
            />

            {/* Modal de Editar/Agregar */}
            <EditarAgregar
                isOpen={isOpenEditarAgregar}
                setIsOpen={setIsOpenEditarAgregar}
                tipo='agregar'
                onPersonalCreated={handlePersonalCreated}
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
export default Personal;