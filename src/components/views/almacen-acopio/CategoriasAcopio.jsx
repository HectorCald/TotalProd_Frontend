import React, { useState, useEffect } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerCategoria from './VerCategoria';
import Boton from '../../common/Boton';
import EditarAgregarCategoria from './EditarAgregarCategoria';
import Notification from '../../common/Notification';
import categoryAcopioService from '../../../services/categoryAcopioService';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';

function CategoriasAlmacen({ isOpen, setIsOpen, modoSeleccion = false, onCategoriaSeleccionada }) {
    // Estados para los modales
    const [isOpenVerCategoria, setIsOpenVerCategoria] = useState(false);
    const [infoCategoria, setInfoCategoria] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Estado para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');

    // Estados para categorías
    const [categorias, setCategorias] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para cargar categorías
    const cargarCategorias = async () => {
        setIsLoading(true);
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        setError(null);
        
        try {
            const response = await categoryAcopioService.getAll();
            if (response.success) {
                setCategorias(response.data);
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

    // Cargar categorías cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            cargarCategorias();
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


    // Función para manejar el click en una categoría
    const handleCategoria = (categoria) => {
        if (modoSeleccion) {
            // En modo selección, seleccionar la categoría y cerrar
            if (onCategoriaSeleccionada) {
                onCategoriaSeleccionada(categoria);
            }
            setIsOpen(false);
        } else {
            // Modo normal, abrir modal de ver categoría
            setInfoCategoria(categoria);
            setIsOpenVerCategoria(true);
        }
    };

    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        await cargarCategorias();
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Filtrar categorías localmente basado en la búsqueda
    const categoriasFiltradas = categorias.filter(categoria => 
        categoria.name.toLowerCase().includes(searchQuery.toLowerCase())
    );


    // Función para manejar cuando se crea una nueva categoría
    const handleCategoriaCreated = (newCategoria) => {
        // Actualizar el estado local con la categoría que devuelve el servidor
        setCategorias(prevCategorias => [newCategoria, ...prevCategorias]);
        
        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Categoría agregada correctamente');
    };

    // Función para manejar cuando se elimina una categoría
    const handleCategoriaDeleted = (deletedId) => {
        // Actualizar el estado local removiendo la categoría eliminada
        setCategorias(prevCategorias => prevCategorias.filter(categoria => categoria.id !== deletedId));
        
        // Cerrar el modal de ver categoría
        setIsOpenVerCategoria(false);
        mostrarNotificacion('success', 'Categoría eliminada correctamente');
    };

    // Función para manejar cuando se actualiza una categoría
    const handleCategoriaUpdated = (updatedCategoria) => {
        // Actualizar el estado local con la categoría actualizada que devuelve el servidor
        setCategorias(prevCategorias => prevCategorias.map(categoria => 
            categoria.id === updatedCategoria.id ? updatedCategoria : categoria
        ));
        
        // Cerrar el modal de ver categoría
        setIsOpenVerCategoria(false);
        mostrarNotificacion('success', 'Categoría actualizada correctamente');
    };


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        {modoSeleccion ? 'Seleccionar Categoría' : 'Categorías de Almacén'}
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
                        placeholder='Buscar categoría'
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                    />
                </div>
                <div className={styles.content}>
                    {categoriasFiltradas.length > 0 ? (
                        categoriasFiltradas.map((categoria, index) => (
                            <ItemView
                                key={categoria.id || index}
                                title={categoria.name || 'Sin nombre'}
                                icon="category"
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

            {/* Modal de ver categoría - solo en modo normal */}
            {!modoSeleccion && (
                <VerCategoria 
                    isOpen={isOpenVerCategoria} 
                    setIsOpen={setIsOpenVerCategoria} 
                    categoria={infoCategoria}
                    onCategoriaDeleted={handleCategoriaDeleted}
                    onCategoriaUpdated={handleCategoriaUpdated}
                />
            )}

            {/* Modal de agregar categoría */}
            <EditarAgregarCategoria 
                isOpen={isAgregarOpen} 
                setIsOpen={setIsAgregarOpen} 
                tipo='agregar'
                onCategoriaCreated={handleCategoriaCreated}
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
