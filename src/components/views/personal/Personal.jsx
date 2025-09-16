import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerProveedor from './VerPersona';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import LoadingSpinner from '../../common/LoadingSpinner';

import proveedorService from '../../../services/proveedorService';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';


function Personal({ isOpen, setIsOpen }) {
    const [isOpenVerProveedor, setIsOpenVerProveedor] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);

    const [proveedorData, setProveedorData] = useState([]);

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
        setIsOpenVerProveedor(true);
        setInfoPersona(persona);
    };


    // Función para obtener los proveedores
    const fetchProveedores = async (page = 1, reset = true, isSearch = false) => {
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

            const response = await proveedorService.getAll(page, 20, searchQuery);
            if (response.success && response.data) {
                if (reset) {
                    setProveedorData(response.data);
                } else {
                    setProveedorData(prev => [...prev, ...response.data]);
                }

                setCurrentPage(page);
                setHasMorePages(response.pagination?.hasNextPage || false);

                // Cerrar modal si estaba abierto y ahora tenemos datos
                setModalConfig(prev => ({ ...prev, isOpen: false }));
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
            } else {
                // Si no es éxito pero tampoco es un error de plan, no abrir modal
                console.log('Respuesta del servidor:', response);
            }
        } catch (error) {
            console.error('Error obteniendo proveedores:', error);
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
    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !loadingMore) {
            fetchProveedores(currentPage + 1, false);
        }
    };

    // Función para manejar búsqueda
    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
        setHasMorePages(true);
        fetchProveedores(1, true, true); // isSearch = true
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
            console.log('Proveedores - Cargando datos');
            // Asegurar que el modal esté cerrado al abrir el componente
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            setCurrentPage(1);
            setHasMorePages(true);
            
            // Si hay búsqueda, buscar; si no, cargar todos
            if (debouncedSearchQuery) {
                handleSearch(debouncedSearchQuery);
            } else {
                fetchProveedores(1, true);
            }
        }
    }, [isOpen, debouncedSearchQuery]);

    // Función para manejar cuando se crea un nuevo proveedor
    const handleProveedorCreated = (newProveedor) => {
        // Agregar el nuevo proveedor a la lista
        setProveedorData(prev => [newProveedor, ...prev]);
        // Cerrar el modal
        setIsOpenEditarAgregar(false);
        mostrarNotificacion('success', 'Proveedor agregado correctamente')
    };

    // Función para manejar cuando se elimina un proveedor
    const handleProveedorDeleted = (deletedId) => {
        // Remover el proveedor eliminado de la lista
        setProveedorData(prev => prev.filter(proveedor => proveedor.id !== deletedId));
        // Cerrar el modal de ver proveedor
        setIsOpenVerProveedor(false);
        mostrarNotificacion('success', 'Proveedor eliminado correctamente')
    };

    // Función para manejar cuando se actualiza un proveedor
    const handleProveedorUpdated = (updatedProveedor) => {
        // Actualizar solo el proveedor específico en la lista
        setProveedorData(prev => prev.map(proveedor =>
            proveedor.id === updatedProveedor.id ? updatedProveedor : proveedor
        ));
        // Cerrar el modal de ver proveedor
        setIsOpenVerProveedor(false);
        mostrarNotificacion('success', 'Proveedor actualizado correctamente')
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner iconName='user' />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Personal</h1>
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
                    ) : proveedorData.length > 0 ? (
                        proveedorData.map((proveedor, index) => (
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
                    {loadingMore && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más proveedores...</p>
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
            {/* Modal de Ver Proveedor */}
            <VerProveedor
                isOpen={isOpenVerProveedor}
                setIsOpen={setIsOpenVerProveedor}
                usuario={infoPersona}
                onProveedorDeleted={handleProveedorDeleted}
                onProveedorUpdated={handleProveedorUpdated}
            />

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
export default Personal;