import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerCategoria from './VerCategoria';
import Boton from '../../common/Boton';
import EditarAgregarCategoria from './EditarAgregarCategoria';
import categoryAcopioService from '../../../services/categoryAcopioService';
import LoadingSpinner from '../../common/LoadingSpinner';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';

function CategoriasAlmacen({ isOpen, setIsOpen }) {
    // Estados para los modales
    const [isOpenVerCategoria, setIsOpenVerCategoria] = useState(false);
    const [infoCategoria, setInfoCategoria] = useState(null);
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
    const [categoriaData, setCategoriaData] = useState([]);

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

    // Estados para filtros
    const [filtroActivo, setFiltroActivo] = useState('todos');

    // Función para manejar el click en una categoría
    const handleCategoria = (categoria) => {
        setInfoCategoria(categoria);
        setIsOpenVerCategoria(true);
    };

    // Función para obtener las categorías
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await categoryAcopioService.getAll();
            if (response.success && response.data) {
                setCategoriaData(response.data);
                setHasMorePages(false); // Las categorías no tienen paginación
                // Cerrar modal si estaba abierto y ahora tenemos datos
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            } else {
                setCategoriaData([]);
            }
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
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
            fetchCategories();
        } else {
            const filtered = categoriaData.filter(categoria =>
                categoria.name.toLowerCase().includes(query.toLowerCase())
            );
            setCategoriaData(filtered);
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
                fetchCategories();
            }
        }
    }, [isOpen, debouncedSearchQuery]);

    // Función para manejar cuando se crea una nueva categoría
    const handleCategoriaCreated = (newCategoria) => {
        // Agregar la nueva categoría a la lista
        setCategoriaData(prev => [newCategoria, ...prev]);
        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Categoría agregada correctamente');
    };

    // Función para manejar cuando se elimina una categoría
    const handleCategoriaDeleted = (deletedId) => {
        // Remover la categoría eliminada de la lista
        setCategoriaData(prev => prev.filter(categoria => categoria.id !== deletedId));
        // Cerrar el modal de ver categoría
        setIsOpenVerCategoria(false);
        mostrarNotificacion('success', 'Categoría eliminada correctamente');
    };

    // Función para manejar cuando se actualiza una categoría
    const handleCategoriaUpdated = (updatedCategoria) => {
        // Actualizar solo la categoría específica en la lista
        setCategoriaData(prev => prev.map(categoria =>
            categoria.id === updatedCategoria.id ? updatedCategoria : categoria
        ));
        // Cerrar el modal de ver categoría
        setIsOpenVerCategoria(false);
        mostrarNotificacion('success', 'Categoría actualizada correctamente');
    };


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner iconName='tag' />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Categorías de Almacén</h1>
                <div className={styles.searchContainer}>
                    <InputSearch
                        placeholder='Buscar categoría'
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                    />
                </div>
                <div className={styles.content}style={{ height: 'calc(100vh - 235px)' }}>
                    {isSearching ? (
                        <div className={styles.searchingData}>
                            <p>Buscando...</p>
                        </div>
                    ) : categoriaData.length > 0 ? (
                        categoriaData.map((categoria, index) => (
                            <ItemView
                                key={categoria.id || index}
                                title={categoria.name || 'Sin nombre'}
                                icon="tag"
                                arrow={true}
                                onClick={() => handleCategoria(categoria)}
                            />
                        ))
                    ) : (
                        <div className={styles.noData}>
                            <p>{searchQuery ? 'No se encontraron categorías' : 'No hay categorías registradas'}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.buttonFooter}>
                <Boton
                    className='btn-original'
                    label='Nueva categoría'
                    onClick={() => { setIsAgregarOpen(true); }}
                />
            </div>

            {/* Modal de ver categoría*/}
            <VerCategoria 
                isOpen={isOpenVerCategoria} 
                setIsOpen={setIsOpenVerCategoria} 
                categoria={infoCategoria}
                onCategoriaDeleted={handleCategoriaDeleted}
                onCategoriaUpdated={handleCategoriaUpdated}
            />

            {/* Modal de agregar categoría*/}
            <EditarAgregarCategoria 
                isOpen={isAgregarOpen} 
                setIsOpen={setIsAgregarOpen} 
                tipo='agregar'
                onCategoriaCreated={handleCategoriaCreated}
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

export default CategoriasAlmacen;
