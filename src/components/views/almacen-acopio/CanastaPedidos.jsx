import React, { useState, useEffect, useRef } from 'react';
import styles from '../../styles/Canasta.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import Notification from '../../common/Notification';

const medidasPedido = [
    { value: 'kg', label: 'Kilogramo (kg)', icon: 'tag' },
    { value: 'qq', label: 'Quintal (qq)', icon: 'tag' },
    { value: 'l', label: 'Litro (l)', icon: 'tag' },
    { value: 'lbrs', label: 'Libras (lbrs)', icon: 'tag' },
    { value: '@', label: 'Arroba (@)', icon: 'tag' },
    { value: 'cj', label: 'Caja (cj)', icon: 'tag' },
];

function CanastaPedidos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onPedidoCreado, isCartMode = false, onPedidoCreadoConDescarga = null, onWhatsAppSelect = null }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    // const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false); // Ya no se usa
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [animarCantidad, setAnimarCantidad] = useState({});


    // Estado para notificaciones
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'error',
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

    // Referencias para el auto-focus en inputs de cantidad
    const cantidadInputRefs = useRef({});

    // Auto-focus en input de cantidad cuando se agrega un producto nuevo (solo en pantallas grandes)
    useEffect(() => {
        if (isCartMode && productosCanasta.length > 0) {
            // Encontrar el último producto agregado (el más reciente)
            const ultimoProducto = productosCanasta[productosCanasta.length - 1];
            const inputRef = cantidadInputRefs.current[ultimoProducto.id];

            if (inputRef) {
                // Pequeño delay para asegurar que el DOM se haya actualizado
                setTimeout(() => {
                    inputRef.focus();
                    inputRef.select(); // Seleccionar todo el texto para facilitar la edición
                }, 100);
            }
        }
    }, [productosCanasta.length, isCartMode]);


    const handleActualizarCantidad = (productoId, nuevaCantidad, animar = false) => {
        if (nuevaCantidad <= 0) {
            handleEliminarProducto(productoId);
            return;
        }

        // Si debe animar, activar la animación
        if (animar) {
            setAnimarCantidad(prev => ({
                ...prev,
                [productoId]: true
            }));

            // Desactivar la animación después de 300ms
            setTimeout(() => {
                setAnimarCantidad(prev => ({
                    ...prev,
                    [productoId]: false
                }));
            }, 300);
        }

        setProductosCanasta(prev => prev.map(p =>
            p.id === productoId
                ? { ...p, cantidad: nuevaCantidad }
                : p
        ));
    };

    const handleEliminarProducto = (productoId) => {
        // Agregar clase de animación antes de eliminar
        const elemento = document.querySelector(`[data-producto-id="${productoId}"]`);
        if (elemento) {
            elemento.classList.add(styles.eliminando);
            setTimeout(() => {
                setProductosCanasta(prev => prev.filter(p => p.id !== productoId));
            }, 300);
        } else {
            setProductosCanasta(prev => prev.filter(p => p.id !== productoId));
        }
    };

    const handleActualizarMedida = (productoId, nuevaMedida) => {
        setProductosCanasta(prev => prev.map(p =>
            p.id === productoId
                ? { ...p, medidaPedido: nuevaMedida }
                : p
        ));
    };

    // Guardar en localStorage cuando cambie la canasta
    useEffect(() => {
        if (productosCanasta.length > 0) {
            localStorage.setItem('canastaPedidosAcopio', JSON.stringify(productosCanasta));
        }
        // NO remover del localStorage aquí para evitar que se borre al recargar la página
        // La limpieza se maneja en las funciones específicas
    }, [productosCanasta]);

    // Cargar canasta desde localStorage al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const canastaGuardada = localStorage.getItem('canastaPedidosAcopio');
            if (canastaGuardada) {
                try {
                    const productosGuardados = JSON.parse(canastaGuardada);
                    setProductosCanasta(productosGuardados);
                } catch (error) {
                    console.error('Error al cargar canasta desde localStorage:', error);
                }
            }
        }
    }, [isOpen]);

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        localStorage.removeItem('canastaPedidosAcopio');
        setIsLimpiarModalOpen(false);
        setIsOpen(false);
    };

    const handleConfirmarPedido = async () => {
        setLoadingConfirmar(true);
        try {
            // Preparar los datos del pedido
            const pedidoData = {
                productos: productosCanasta,
                observaciones: observacionesGenerales
            };

            // Guardar pedido en localStorage antes de enviar al backend
            const pedidoParaHistorial = {
                id: Date.now(),
                fecha: new Date().toLocaleDateString('es-ES'),
                hora: new Date().toLocaleTimeString('es-ES'),
                productos: productosCanasta.map(producto => ({
                    nombre: producto.name,
                    cantidad: producto.cantidad,
                    medida: producto.medidaPedido || 'kg'
                })),
                observaciones: observacionesGenerales,
                totalProductos: productosCanasta.length
            };

            // Guardar como último pedido
            localStorage.setItem('ultimoPedidoAcopio', JSON.stringify(pedidoParaHistorial));

            // Agregar al historial
            const historialExistente = JSON.parse(localStorage.getItem('historialPedidosAcopio') || '[]');
            historialExistente.unshift(pedidoParaHistorial); // Agregar al inicio
            localStorage.setItem('historialPedidosAcopio', JSON.stringify(historialExistente));

            // Enviar el pedido al backend
            const response = await pedidosAcopioService.create(pedidoData);

            if (response.success) {
                // Limpiar la canasta
                setProductosCanasta([]);
                setObservacionesGenerales('');

                // Limpiar localStorage de la canasta
                localStorage.removeItem('canastaPedidosAcopio');

                // Cerrar la canasta y notificar al padre
                setIsOpen(false);
                if (onPedidoCreado) {
                    onPedidoCreado(response.data);
                }

                // Si hay función para manejar descarga automática, llamarla con el primer pedido creado
                if (onPedidoCreadoConDescarga && response.data && response.data.length > 0) {
                    onPedidoCreadoConDescarga(response.data[0].id);
                }

            } else {
                console.error('Error al crear el pedido:', response.message);
                mostrarNotificacion('error', response.message || 'Error al crear el pedido');
            }
        } catch (error) {
            console.error('Error al confirmar el pedido:', error);
            mostrarNotificacion('error', error.message || 'Error al confirmar el pedido');
        } finally {
            setLoadingConfirmar(false);
        }
    };



    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isCart={isCartMode}>
            {!isCartMode && <HeaderView onBack={() => setIsOpen(false)} />}
            <div className={`${styles.container} ${styles.acopio} ${isCartMode ? styles.cartPanel : ''}`}>
                <h1 className={styles.title}>Canasta de Pedidos
                    <div className={styles.titleButtons}>
                        {isCartMode && onWhatsAppSelect && (

                            <Select
                                icon="whatsapp"
                                iconOnly={true}
                                options={[
                                    { value: 'historial', label: 'Historial', icon: 'history' },
                                    { value: 'ultimo-pedido', label: 'Último pedido', icon: 'time-five' }
                                ]}
                                onChange={onWhatsAppSelect}
                                dropdownDirection="right"
                                containerStyle={{ background: 'none', width:'fit-content' }}
                            />

                        )}

                        <button className={styles.iconButton} onClick={() => setIsLimpiarModalOpen(true)}>
                            <BoxIcon name='trash' className={styles.iconTrash} />
                        </button>

                    </div>
                </h1>

                {productosCanasta.length > 0 ? (
                    <>
                        <div className={styles.productosList}>
                            {productosCanasta.map((producto, index) => (
                                <div
                                    key={`${producto.id}-${index}`}
                                    className={styles.productoItem}
                                    data-producto-id={producto.id}
                                >
                                    <div className={styles.productoInfo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div className={styles.productoInfoContent}>
                                            <BoxIcon name='box' className={styles.productoIcon} />
                                            <div>
                                                <h3 className={styles.productoNombre}>{producto.name}</h3>
                                                <p className={styles.descripcion}>{producto.description}</p>
                                            </div>
                                        </div>

                                        <button
                                            className={styles.btnEliminar}
                                            onClick={() => handleEliminarProducto(producto.id)}
                                        >
                                            <BoxIcon name='trash' className={styles.btnEliminarIcon} />
                                        </button>
                                    </div>

                                    <div className={styles.productoControles}>

                                        <Select
                                            value={producto.medidaPedido || 'kg'}
                                            onChange={(value) => handleActualizarMedida(producto.id, value)}
                                            options={medidasPedido}
                                            placeholder="Medida"
                                            containerStyle={{ maxWidth: '200px' }}
                                        />

                                        <div className={styles.cantidadControl}>
                                            <button
                                                className={styles.btnCantidad}
                                                onClick={() => handleActualizarCantidad(producto.id, producto.cantidad - 1, true)}
                                                disabled={producto.cantidad <= 1}
                                            >
                                                <BoxIcon name='minus' className={styles.iconMinus} />
                                            </button>
                                            <motion.span
                                                animate={animarCantidad[producto.id] ? { scale: [1, 1.3, 0.9, 1] } : { scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className={styles.cantidad}
                                            >
                                                <input
                                                    ref={(el) => {
                                                        if (el) {
                                                            cantidadInputRefs.current[producto.id] = el;
                                                        }
                                                    }}
                                                    type="number"
                                                    value={producto.cantidad}
                                                    min="1"
                                                    onChange={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        handleActualizarCantidad(producto.id, nuevaCantidad, false);
                                                    }}
                                                    onBlur={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        if (nuevaCantidad < 1) {
                                                            handleActualizarCantidad(producto.id, 1, false);
                                                        }
                                                    }}
                                                />
                                            </motion.span>
                                            <button
                                                className={styles.btnCantidad}
                                                onClick={() => handleActualizarCantidad(producto.id, producto.cantidad + 1, true)}
                                            >
                                                <BoxIcon name='plus' className={styles.iconPlus} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.buttons}>
                            <Boton
                                className='btn-original'
                                label='Confirmar Pedido'
                                onClick={handleConfirmarPedido}
                                loading={loadingConfirmar}
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.canastaVacia}>
                        <BoxIcon name='cart' className={styles.iconoVacio} />
                        <p>Tu canasta está vacía</p>
                        <p className={styles.subtexto}>Agrega productos desde la lista para crear tu pedido</p>
                    </div>
                )}
            </div>

            {/* Modal de limpiar canasta */}
            <ViewModal isOpen={isLimpiarModalOpen} setIsOpen={setIsLimpiarModalOpen}>
                <HeaderModal
                    title="Limpiar Canasta"
                    onClose={() => setIsLimpiarModalOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estás seguro que deseas limpiar toda la canasta? Esta acción no se puede deshacer.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Si, limpiar'
                            onClick={handleLimpiarCanasta}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            onClick={() => setIsLimpiarModalOpen(false)}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Input de observaciones */}
            <div className={styles.observacionesGenerales}>
                <InputNormal
                    tipo="text"
                    value={observacionesGenerales}
                    placeholder="Observaciones generales del pedido"
                    onChange={(e) => setObservacionesGenerales(e.target.value)}
                />
            </div>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default CanastaPedidos;
