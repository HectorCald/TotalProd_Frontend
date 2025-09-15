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

function Precios({ isOpen, setIsOpen }) {
    // Estados para los modales
    const [isOpenVerPrecio, setIsOpenVerPrecio] = useState(false);
    const [infoPrecio, setInfoPrecio] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para la carga
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para los datos
    const [precioData, setPrecioData] = useState([]);

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

    // Función para obtener los precios
    const fetchPrecios = async () => {
        try {
            setLoading(true);
            const response = await pricesTypesService.getAll();
            if (response.success && response.data) {
                setPrecioData(response.data);
                setHasMorePages(false); // Los precios no tienen paginación
                // Cerrar modal si estaba abierto y ahora tenemos datos
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            } else {
                setPrecioData([]);
            }
        } catch (error) {
            console.error('Error obteniendo precios:', error);
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Error de Acceso',
                description: 'No tienes permisos para acceder a esta función.',
                showButton: true
            });
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    // Función para manejar búsqueda
    const handleSearch = (query) => {
        if (query.trim() === '') {
            fetchPrecios();
        } else {
            const filtered = precioData.filter(precio =>
                precio.name.toLowerCase().includes(query.toLowerCase())
            );
            setPrecioData(filtered);
        }
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Efecto único para cargar datos y búsqueda
    useEffect(() => {
        if (isOpen) {
            // Asegurar que el modal esté cerrado al abrir el componente
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            
            // Si hay búsqueda, buscar; si no, cargar todos
            if (debouncedSearchQuery) {
                handleSearch(debouncedSearchQuery);
            } else {
                fetchPrecios();
            }
        }
    }, [isOpen, debouncedSearchQuery]);

    // Función para manejar cuando se crea un nuevo precio
    const handlePrecioCreated = (newPrecio) => {
        // Agregar el nuevo precio a la lista
        setPrecioData(prev => [newPrecio, ...prev]);
        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Tipo de precio agregado correctamente');
    };

    // Función para manejar cuando se elimina un precio
    const handlePrecioDeleted = (deletedId) => {
        // Remover el precio eliminado de la lista
        setPrecioData(prev => prev.filter(precio => precio.id !== deletedId));
        // Cerrar el modal de ver precio
        setIsOpenVerPrecio(false);
        mostrarNotificacion('success', 'Tipo de precio eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un precio
    const handlePrecioUpdated = (updatedPrecio) => {
        // Actualizar solo el precio específico en la lista
        setPrecioData(prev => prev.map(precio =>
            precio.id === updatedPrecio.id ? updatedPrecio : precio
        ));
        // Cerrar el modal de ver precio
        setIsOpenVerPrecio(false);
        mostrarNotificacion('success', 'Tipo de precio actualizado correctamente');
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner iconName='dollar' />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Tipos de Precios</h1>
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
                <div className={styles.content} style={{ height: 'calc(100vh - 235px)' }}>
                    {isSearching ? (
                        <div className={styles.searchingData}>
                            <p>Buscando...</p>
                        </div>
                    ) : precioData.length > 0 ? (
                        precioData.map((precio, index) => (
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
