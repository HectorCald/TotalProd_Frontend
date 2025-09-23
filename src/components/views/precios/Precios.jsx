import React, { useState, useEffect } from 'react';
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
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';

function Precios({ isOpen, setIsOpen }) {
    // Estados para los modales
    const [isOpenVerPrecio, setIsOpenVerPrecio] = useState(false);
    const [infoPrecio, setInfoPrecio] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Estado para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');

    // Estados para precios
    const [precios, setPrecios] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para cargar precios
    const cargarPrecios = async () => {
        console.log('cargando precios');
        setIsLoading(true);
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        setError(null);
        
        try {
            const response = await pricesTypesService.getAll();
            if (response.success) {
                setPrecios(response.data);
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

    // Cargar precios cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            cargarPrecios();
        }
    }, [isOpen]);

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
        await cargarPrecios();
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Tipos de Precios';
            
            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Plan Insuficiente',
                description: `${errorMessage}`,
                showButton: true
            });
        }
    }, [error, isOpen]);

    // Filtrar precios localmente basado en la búsqueda
    const preciosFiltrados = precios.filter(precio => 
        precio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (precio.description && precio.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Función para manejar cuando se crea un nuevo precio
    const handlePrecioCreated = (newPrecio) => {
        // Actualizar el estado local con el precio que devuelve el servidor
        setPrecios(prevPrecios => [newPrecio, ...prevPrecios]);
        
        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Tipo de precio agregado correctamente');
    };

    // Función para manejar cuando se elimina un precio
    const handlePrecioDeleted = (deletedId) => {
        // Actualizar el estado local removiendo el precio eliminado
        setPrecios(prevPrecios => prevPrecios.filter(precio => precio.id !== deletedId));
        
        // Cerrar el modal de ver precio
        setIsOpenVerPrecio(false);
        mostrarNotificacion('success', 'Tipo de precio eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un precio
    const handlePrecioUpdated = (updatedPrecio) => {
        // Actualizar el estado local con el precio actualizado que devuelve el servidor
        setPrecios(prevPrecios => prevPrecios.map(precio => 
            precio.id === updatedPrecio.id ? updatedPrecio : precio
        ));
        
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
                    {preciosFiltrados.length > 0 ? (
                        preciosFiltrados.map((precio, index) => (
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
