import React, { useState, useEffect } from 'react';
import styles from './Clientes.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerCliente from './VerCliente';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import clientService from '../../../services/clientService';
import LoadingSpinner from '../../common/LoadingSpinner';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';


function Clientes({ isOpen, setIsOpen }) {
    // Estados para los modales
    const [isOpenVerCliente, setIsOpenVerCliente] = useState(false);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [personaData, setPersonaData] = useState([]);

    // Estados para la carga
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    

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


    // Función para manejar el click en un cliente
    const handleCliente = (persona) => {
        setIsOpenVerCliente(true);
        setInfoPersona(persona);
    };
    
    // Función para obtener los clientes
    const fetchClients = async (page = 1, reset = true, isSearch = false) => {
        try {
            if (reset) {
                if (isSearch) {
                    setIsSearching(true);
                } else {
                    setLoading(true);
                }
            } else {
                setLoadingMore(true);
            }
            
            const response = await clientService.getAll(page, 20, searchQuery);
            if (response.success && response.data) {
                if (reset) {
                    setPersonaData(response.data);
                } else {
                    setPersonaData(prev => [...prev, ...response.data]);
                }
                
                setCurrentPage(page);
                setHasMorePages(response.pagination?.hasNextPage || false);
            } else if (response.code === 'MODULE_NOT_INCLUDED') {
                setModalConfig({
                    isOpen: true,
                    type: 'warning',
                    title: 'Módulo No Incluido',
                    description: `Tu plan actual (${response.currentPlan}) no incluye acceso al módulo "${response.requiredModule}". Actualiza tu plan para acceder a esta función.`,
                    showButton: true
                });
            } else if (response.code === 'NO_PLAN') {
                setModalConfig({
                    isOpen: true,
                    type: 'warning',
                    title: 'Plan Requerido',
                    description: 'Necesitas un plan activo para acceder a esta función. Actualiza tu plan desde el perfil.',
                    showButton: true
                });
            }
        } catch (error) {
            console.error('Error obteniendo clientes:', error);
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Error de Acceso',
                description: 'No tienes permisos para acceder a esta función.',
                showButton: true
            });
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setIsSearching(false);
        }
    };
    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen]);

    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !loadingMore) {
            fetchClients(currentPage + 1, false);
        }
    };

    // Función para manejar búsqueda
    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
        setHasMorePages(true);
        fetchClients(1, true, true); // isSearch = true
    };
    // Debounce para búsqueda en tiempo real
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== '') {
                handleSearch(searchQuery);
            } else {
                // Si está vacío, cargar todos los clientes
                setCurrentPage(1);
                setHasMorePages(true);
                fetchClients(1, true);
            }
        }, 500); // 500ms de delay para evitar muchas peticiones

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);



    // Función para manejar cuando se crea un nuevo cliente
    const handleClientCreated = (newClient) => {
        // Agregar el nuevo cliente a la lista
        setPersonaData(prev => [newClient, ...prev]);
        // Cerrar el modal
        setIsOpenEditarAgregar(false);
        mostrarNotificacion('success', 'Cliente agregado correctamente')
    };

    // Función para manejar cuando se elimina un cliente
    const handleClientDeleted = (deletedId) => {
        // Remover el cliente eliminado de la lista
        setPersonaData(prev => prev.filter(cliente => cliente.id !== deletedId));
        // Cerrar el modal de ver cliente
        setIsOpenVerCliente(false);
        mostrarNotificacion('success', 'Cliente eliminado correctamente')
    };

    // Función para manejar cuando se actualiza un cliente
    const handleClientUpdated = (updatedClient) => {
        // Actualizar solo el cliente específico en la lista
        setPersonaData(prev => prev.map(cliente => 
            cliente.id === updatedClient.id ? updatedClient : cliente
        ));
        // Cerrar el modal de ver cliente
        setIsOpenVerCliente(false);
        mostrarNotificacion('success', 'Cliente actualizado correctamente')
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Clientes</h1>
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
                    ) : personaData.length > 0 ? (
                        personaData.map((cliente, index) => (
                            <ItemView
                                key={cliente.id || index}
                                title={cliente.name || 'Sin nombre'}
                                arrow={true}
                                onClick={() => handleCliente(cliente)}
                            />
                        ))
                    ) : (
                        <div className={styles.noData}>
                            <p>{searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
                        </div>
                    )}
                    
                    {/* Indicador de carga para más elementos */}
                    {loadingMore && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más clientes...</p>
                        </div>
                    )}
                </div>
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar cliente'
                        onClick={() => setIsOpenEditarAgregar(true)}
                    />
                </div>
            </div>
            
            {/* Modal de Ver Cliente */}
            <VerCliente 
                isOpen={isOpenVerCliente} 
                setIsOpen={setIsOpenVerCliente} 
                usuario={infoPersona}
                onClientDeleted={handleClientDeleted}
                onClientUpdated={handleClientUpdated}
            />

            {/* Modal de Editar/Agregar */}
            <EditarAgregar 
                isOpen={isOpenEditarAgregar} 
                setIsOpen={setIsOpenEditarAgregar} 
                tipo='agregar'
                onClientCreated={handleClientCreated}
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

export default Clientes;