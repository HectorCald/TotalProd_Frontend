import React, { useState, useEffect, useRef } from 'react';
import styles from '../../styles/Canasta.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/old/HeaderView';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/old/HeaderModal';
import Boton from '../../common/botones/Boton';
import InputNormal from '../../common/old/InputNormal';
import Select from '../../common/old/Select';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import { useToast } from '../../../context/ToastContext';

const medidasPedido = [
    { value: 'kg', label: 'Kilogramo', icon: 'tag' },
    { value: 'qq', label: 'Quintal', icon: 'tag' },
    { value: 'l', label: 'Litro', icon: 'tag' },
    { value: 'lbrs', label: 'Libras', icon: 'tag' },
    { value: '@', label: 'Arroba', icon: 'tag' },
    { value: 'cj', label: 'Caja', icon: 'tag' },
];

function CanastaPedidos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onPedidoCreado, isCartMode = false, onPedidoCreadoConDescarga = null, onWhatsAppSelect = null }) {
    const { showDanger } = useToast();
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    // const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false); // Ya no se usa
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [animarCantidad, setAnimarCantidad] = useState({});

    // Referencias para el auto-focus en inputs de cantidad
    const cantidadInputRefs = useRef({});
    const lastFocusedProductoIdRef = useRef(null);

    // Auto-focus en input de cantidad cuando se agrega un producto nuevo (solo en pantallas grandes)
    useEffect(() => {
        if (!isCartMode) return;
        if (!productosCanasta || productosCanasta.length === 0) {
            lastFocusedProductoIdRef.current = null;
            return;
        }

        const ultimoProducto = productosCanasta[productosCanasta.length - 1];
        if (!ultimoProducto) return;

        if (lastFocusedProductoIdRef.current === ultimoProducto.id) {
            return;
        }

        const inputRef = cantidadInputRefs.current[ultimoProducto.id];

        if (inputRef) {
            // Pequeño delay para asegurar que el DOM se haya actualizado
            setTimeout(() => {
                inputRef.focus();
                inputRef.select(); // Seleccionar todo el texto para facilitar la edición
            }, 100);
            lastFocusedProductoIdRef.current = ultimoProducto.id;
        }
    }, [productosCanasta, isCartMode]);


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
                ? { ...p, cantidad: nuevaCantidad, ...(p.cantidadTemp !== undefined ? { cantidadTemp: undefined } : {}) }
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
            const productosParaGuardar = productosCanasta.map(producto => {
                const { cantidadTemp, ...resto } = producto;
                return resto;
            });
            localStorage.setItem('canastaPedidosAcopio', JSON.stringify(productosParaGuardar));
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
                showDanger('Error', response.message || 'Error al crear el pedido');
            }
        } catch (error) {
            console.error('Error al confirmar el pedido:', error);
            showDanger('Error', error.message || 'Error al confirmar el pedido');
        } finally {
            setLoadingConfirmar(false);
        }
    };



    const headerRightContent = (
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
                    containerStyle={{ background: 'none', width: 'fit-content' }}
                />

            )}

            <button className={styles.iconButton} onClick={() => setIsLimpiarModalOpen(true)}>
                <BoxIcon name='trash' className={styles.iconTrash} />
            </button>
        </div>
    );

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isCart={isCartMode}>
            <HeaderView
                title="Canasta de Pedidos"
                onBack={() => setIsOpen(false)}
                showBackButton={!isCartMode}
                rightContent={headerRightContent}
            />
            <div className={`${styles.container} ${styles.acopio} ${isCartMode ? styles.cartPanel : ''}`}>
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
                                                    min="1"
                                                    onChange={(e) => {
                                                        const valor = e.target.value;
                                                        if (valor === '') {
                                                            setProductosCanasta(prev => prev.map(p =>
                                                                p.id === producto.id
                                                                    ? { ...p, cantidadTemp: '' }
                                                                    : p
                                                            ));
                                                            return;
                                                        }
                                                        const nuevaCantidad = parseInt(valor, 10);
                                                        if (Number.isNaN(nuevaCantidad)) {
                                                            return;
                                                        }
                                                        handleActualizarCantidad(producto.id, nuevaCantidad, false);
                                                    }}
                                                    onBlur={(e) => {
                                                        const valor = e.target.value;
                                                        if (valor === '') {
                                                            setProductosCanasta(prev => prev.map(p =>
                                                                p.id === producto.id
                                                                    ? { ...p, cantidadTemp: undefined }
                                                                    : p
                                                            ));
                                                            return;
                                                        }
                                                        const nuevaCantidad = parseInt(valor, 10);
                                                        if (Number.isNaN(nuevaCantidad) || nuevaCantidad < 1) {
                                                            handleActualizarCantidad(producto.id, 1, false);
                                                        }
                                                    }}
                                                    value={producto.cantidadTemp !== undefined ? producto.cantidadTemp : producto.cantidad}
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

        </View>
    );
}

export default CanastaPedidos;
