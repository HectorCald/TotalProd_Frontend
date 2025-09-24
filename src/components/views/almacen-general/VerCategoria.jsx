import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import EditarAgregarCategoria from './EditarAgregarCategoria';
import ItemView from '../../common/ItemView';
import categoryAlmacenService from '../../../services/categoryAlmacenService';
import productsAlmacenService from '../../../services/productsAlmacenService';
import Notification from '../../common/Notification';

function VerCategoria({ isOpen, setIsOpen, categoria, onCategoriaUpdated, onCategoriaDeleted }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loading, setLoading] = useState(false);

    // Función para obtener los productos de la categoría
    const fetchProductsByCategory = async () => {
        if (!categoria?.id) return;

        setLoadingProducts(true);
        try {
            const response = await productsAlmacenService.getAll();
            if (response.success && response.data) {
                // Filtrar productos por categoría
                const productosFiltrados = response.data.filter(producto =>
                    producto.category_almacen && producto.category_almacen.id === categoria.id
                );
                setProducts(productosFiltrados);
            }
        } catch (error) {
            console.error('Error obteniendo productos de la categoría:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        if (isOpen && categoria) {
            fetchProductsByCategory();
        }
    }, [isOpen, categoria]);


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
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {categoria?.name}
                    <div className={styles.iconButton} >
                    </div>
                </h1>

                <p className={styles.subTitle}>INFORMACIÓN DE LA CATEGORÍA</p>
                <div className={styles.content}>
                    <Dato
                        label="Total de productos"
                        value={`${products.length} productos`}
                    />
                </div>

                {/* Botón para ver productos */}
                <Boton
                    className='btn-gray'
                    label='Productos'
                    onClick={() => setIsProductosOpen(true)}
                />

                <div className={styles.buttons}>
                    <Boton
                        className='btn-red'
                        label='Eliminar Categoría'
                        onClick={() => setIsDeleteOpen(true)}
                    />
                    <Boton
                        className='btn-default'
                        label='Editar Categoría'
                        onClick={() => setIsEditarOpen(true)}
                    />
                </div>
            </div>

            {/* Modal de eliminar*/}
            <ViewModal isOpen={isDeleteOpen} setIsOpen={setIsDeleteOpen}>
                <HeaderModal
                    title="Eliminar"
                    onClose={() => setIsDeleteOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Eliminar la categoría "{categoria?.name}"? Esta acción es irreversible y puede afectar registros relacionados.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Si, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    const response = await categoryAlmacenService.delete(categoria.id);
                                    if (response.success) {
                                        onCategoriaDeleted(categoria.id);
                                        setIsDeleteOpen(false);
                                        setIsOpen(false);
                                    } else {
                                        mostrarNotificacion('error', response.message || 'Error al eliminar la categoría');
                                    }
                                } catch (error) {
                                    console.error('Error al eliminar categoría:', error);
                                    mostrarNotificacion('error', 'Error al eliminar la categoría');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            loading={loading}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsDeleteOpen(false)}
                        />
                    </div>

                </div>
            </ViewModal>

            {/* Modal de editar*/}
            <EditarAgregarCategoria
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                data={categoria}
                tipo='editar'
                onCategoriaUpdated={onCategoriaUpdated}
            />

            {/* Modal de productos*/}
            <ViewModal isOpen={isProductosOpen} setIsOpen={setIsProductosOpen}>
                <HeaderModal
                    title={`Productos de ${categoria?.name}`}
                    onClose={() => setIsProductosOpen(false)}
                />
                <div className={styles.modalContent}>
                    {loadingProducts ? (
                        <div className={styles.noData}>
                            <p>Cargando productos...</p>
                        </div>
                    ) : products.length > 0 ? (
                        <>
                            <p className={styles.subTitle}>PRODUCTOS EN ESTA CATEGORÍA</p>
                            {products.map((product, index) => (
                                <ItemView
                                    key={product.id || index}
                                    title={product.name || 'Sin nombre'}
                                    description={product.description || 'Sin descripción'}
                                    icon="box"
                                    arrow={false}
                                    flot1={`${product.stock || 0} Ud.`}
                                />
                            ))}
                        </>
                    ) : (
                        <div className={styles.noData}>
                            <p>No hay productos en esta categoría</p>
                        </div>
                    )}
                </div>
            </ViewModal>

            {/* Modal de notificación*/}
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default VerCategoria;
