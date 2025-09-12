import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import EditarAgregarPrecio from './EditarAgregarPrecio';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import pricesTypesService from '../../../services/pricesTypesService';
import productsAlmacenService from '../../../services/productsAlmacenService';
import LoadingSpinner from '../../common/LoadingSpinner';
import Notification from '../../common/Notification';

function VerPrecio({ isOpen, setIsOpen, precio, onPrecioDeleted, onPrecioUpdated }) {
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Función para obtener los productos con este tipo de precio
    const fetchProductsByPriceType = async () => {
        if (!precio?.id) return;
        
        setLoadingProducts(true);
        try {
            const response = await productsAlmacenService.getAll();
            if (response.success && response.data) {
                // Filtrar productos que tienen este tipo de precio
                const productosFiltrados = response.data.filter(producto => 
                    producto.price_product && producto.price_product.some(pp => pp.prices_types && pp.prices_types.id === precio.id)
                );
                setProducts(productosFiltrados);
            }
        } catch (error) {
            console.error('Error obteniendo productos del tipo de precio:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        if (isOpen && precio) {
            fetchProductsByPriceType();
        }
    }, [isOpen, precio]);

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

    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await pricesTypesService.delete(precio.id);
            if (response.success) {
                setIsEliminarOpen(false);
                setIsOpen(false);
                if (onPrecioDeleted) {
                    onPrecioDeleted(precio.id);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar el tipo de precio');
            }
        } catch (error) {
            console.error('Error eliminando tipo de precio:', error);
            mostrarNotificacion('error', 'Error al eliminar el tipo de precio');
        } finally {
            setLoading(false);
        }
    };

    const handlePrecioUpdated = (updatedPrecio) => {
        if (onPrecioUpdated) {
            onPrecioUpdated(updatedPrecio);
        }
        setIsEditarOpen(false);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {precio?.name}
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsEliminarOpen(true)}>
                            <BoxIcon
                                name='trash'
                                className={styles.iconTrash}
                            />
                        </button>
                        <button className={styles.iconButton} onClick={() => setIsEditarOpen(true)}>
                            <BoxIcon
                                name='edit'
                                className={styles.icon}
                            />
                        </button>
                    </div>
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL TIPO DE PRECIO</p>
                <div className={styles.content}>
                    <Dato
                        label="Nombre"
                        value={precio?.name || 'Sin nombre'}
                    />
                    <Dato
                        label="Descripción"
                        value={precio?.description || 'Sin descripción'}
                    />
                    <Dato
                        label="Total de productos"
                        value={`${products.length} productos`}
                    />
                </div>

                <p className={styles.subTitle}>PRODUCTOS CON ESTE TIPO DE PRECIO</p>

                {loadingProducts ? (
                    <LoadingSpinner iconName='dollar' />
                ) : products.length > 0 ? (
                    products.map((product, index) => {
                        // Encontrar el precio específico para este tipo de precio
                        const precioProducto = product.price_product?.find(pp => 
                            pp.prices_types && pp.prices_types.id === precio.id
                        );
                        
                        return (
                            <ItemView
                                key={product.id || index}
                                title={product.name || 'Sin nombre'}
                                description={product.description || 'Sin descripción'}
                                icon="box"
                                arrow={false}
                                flot1={`Bs. ${precioProducto?.valor || 0}`}
                            />
                        );
                    })
                ) : (
                    <div className={styles.noData}>
                        <p>No hay productos con este tipo de precio</p>
                    </div>
                )}
            </div>

            {/* Modal de editar precio */}
            <EditarAgregarPrecio
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                data={precio}
                tipo='editar'
                onPrecioUpdated={handlePrecioUpdated}
            />

            {/* Modal de eliminar precio */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Tipo de Precio"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar este tipo de precio? Esta acción no se puede deshacer. Si el tipo de precio tiene productos asignados, no se podrá eliminar.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Sí, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleEliminar}
                            loading={loading}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(false)}
                        />
                    </div>
                </div>
            </ViewModal>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default VerPrecio;
