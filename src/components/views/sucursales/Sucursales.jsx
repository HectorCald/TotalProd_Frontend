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

    // Estados para sucursales
    const [sucursales, setSucursales] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para cargar sucursales
    const cargarSucursales = async () => {
        console.log('cargando sucursales');
        setIsLoading(true);
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        setError(null);
        
        try {
            const response = await sucursalesService.getByEmpresaId();
            if (response.success) {
                setSucursales(response.data);
            } else {
                setError(response);
            }
        } catch (error) {
            setError(error);
        } finally {
            setIsLoading(false);
            // Mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    };

    // Cargar sucursales cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            cargarSucursales();
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
        await cargarSucursales();
    };

    // Efecto para manejar errores
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
        // Actualizar el estado local con la sucursal que devuelve el servidor
        setSucursales(prevSucursales => [newSucursal, ...prevSucursales]);
        
        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Sucursal agregada correctamente');
    };

    // Función para manejar cuando se elimina una sucursal
    const handleSucursalDeleted = (deletedId) => {
        // Actualizar el estado local removiendo la sucursal eliminada
        setSucursales(prevSucursales => prevSucursales.filter(sucursal => sucursal.id !== deletedId));
        
        // Cerrar el modal de ver sucursal
        setIsOpenVerSucursal(false);
        mostrarNotificacion('success', 'Sucursal eliminada correctamente');
    };

    // Función para manejar cuando se actualiza una sucursal
    const handleSucursalUpdated = (updatedSucursal) => {
        // Actualizar el estado local con la sucursal actualizada que devuelve el servidor
        setSucursales(prevSucursales => prevSucursales.map(sucursal => 
            sucursal.id === updatedSucursal.id ? updatedSucursal : sucursal
        ));
        
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
