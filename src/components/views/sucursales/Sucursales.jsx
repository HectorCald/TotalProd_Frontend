import React, { useState, useEffect } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerSucursal from './VerSucursal';
import Boton from '../../common/Boton';
import EditarAgregarSucursal from './EditarAgregarSucursal';
import sucursalesService from '../../../services/sucursalesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';
import { useUser } from '../../../context/UserContext';
import { useSucursales } from '../../../hooks/useData';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';

function Sucursales({ isOpen, setIsOpen }) {
    const { user, sucursalSeleccionada } = useUser();
    
    // Estados para los modales
    const [isOpenVerSucursal, setIsOpenVerSucursal] = useState(false);
    const [infoSucursal, setInfoSucursal] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 🚀 Hook genérico con SWR - Solo se ejecuta cuando el modal está abierto
    const { sucursales, error, isLoading, refetch } = useSucursales(
        user?.empresa_id,
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

    // Función para manejar el click en una sucursal
    const handleSucursal = (sucursal) => {
        setInfoSucursal(sucursal);
        setIsOpenVerSucursal(true);
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

    // Efecto para manejar errores de SWR
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo sucursales:', error);
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Error de Acceso',
                description: 'No tienes permisos para acceder a esta función.',
                showButton: true
            });
        }
    }, [error]);

    // Función para manejar cuando se crea una nueva sucursal
    const handleSucursalCreated = (newSucursal) => {
        // Actualizar el cache localmente con la sucursal que devuelve el servidor
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: [newSucursal, ...currentData.data]
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Sucursal agregada correctamente');
    };

    // Función para manejar cuando se elimina una sucursal
    const handleSucursalDeleted = (deletedId) => {
        // Actualizar el cache localmente removiendo la sucursal eliminada
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: currentData.data.filter(sucursal => sucursal.id !== deletedId)
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal de ver sucursal
        setIsOpenVerSucursal(false);
        mostrarNotificacion('success', 'Sucursal eliminada correctamente');
    };

    // Función para manejar cuando se actualiza una sucursal
    const handleSucursalUpdated = (updatedSucursal) => {
        // Actualizar el cache localmente con la sucursal actualizada que devuelve el servidor
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: currentData.data.map(sucursal => 
                    sucursal.id === updatedSucursal.id ? updatedSucursal : sucursal
                )
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        // Cerrar el modal de ver sucursal
        setIsOpenVerSucursal(false);
        mostrarNotificacion('success', 'Sucursal actualizada correctamente');
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        {sucursalSeleccionada?.empresas?.name || 'Empresa'}
                        <button className={styles.refreshButton} onClick={handleRefresh}>
                            <BoxIcon name='refresh' />
                        </button>
                    </h1>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <p className={styles.subTitle}>SUCURSALES</p>
                <div className={styles.content}>
                    {sucursales.length > 0 ? (
                        sucursales.map((sucursal, index) => (
                            <ItemView
                                key={sucursal.id || index}
                                title={sucursal.name || 'Sin nombre'}
                                description={`Creada el ${sucursal.created_at ? new Date(sucursal.created_at).toLocaleDateString('es-ES') : 'Sin fecha'}`}
                                icon="building"
                                arrow={true}
                                onClick={() => handleSucursal(sucursal)}
                            />
                        ))
                    ) : (
                        <div className={styles.noData}>
                            <p>No hay sucursales registradas</p>
                        </div>
                    )}

                    {/* Indicador de carga para más elementos */}
                    {isLoading && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más sucursales...</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.buttonFooter}>
                <Boton
                    className='btn-original'
                    label='Nueva sucursal'
                    onClick={() => { setIsAgregarOpen(true); }}
                />
            </div>

            {/* Modal de ver sucursal*/}
            <VerSucursal 
                isOpen={isOpenVerSucursal} 
                setIsOpen={setIsOpenVerSucursal} 
                sucursal={infoSucursal}
                onSucursalDeleted={handleSucursalDeleted}
                onSucursalUpdated={handleSucursalUpdated}
            />

            {/* Modal de agregar sucursal*/}
            <EditarAgregarSucursal 
                isOpen={isAgregarOpen} 
                setIsOpen={setIsAgregarOpen} 
                tipo='agregar'
                onSucursalCreated={handleSucursalCreated}
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

export default Sucursales;
