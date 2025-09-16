import React, { useState, useEffect } from 'react';
import styles from './CanastaMovimientos.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import ItemLine from '../../common/ItemLine';
import { motion } from 'framer-motion';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import pricesTypesService from '../../../services/pricesTypesService';
import PantallaExito from '../../common/PantallaExito';

function CanastaPedidos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onProductosUpdated }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false);
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [isExitoOpen, setIsExitoOpen] = useState(false);
    const [pedidoCreado, setPedidoCreado] = useState(null);
    const [datosParaExito, setDatosParaExito] = useState([]);
    const [animarCantidad, setAnimarCantidad] = useState({});
    const [preciosTipos, setPreciosTipos] = useState([]);
    const [precioSeleccionado, setPrecioSeleccionado] = useState('');
    const [loadingPrecios, setLoadingPrecios] = useState(false);

    // Cargar tipos de precios
    useEffect(() => {
        const loadPreciosTipos = async () => {
            setLoadingPrecios(true);
            try {
                const response = await pricesTypesService.getAll();
                if (response.success) {
                    const mappedOptions = response.data.map(precio => ({
                        value: precio.id,
                        label: precio.name,
                        id: precio.id,
                        name: precio.name,
                        default_value: precio.default_value
                    }));
                    setPreciosTipos(mappedOptions);
                    // Seleccionar el primer precio por defecto
                    if (mappedOptions.length > 0) {
                        setPrecioSeleccionado(mappedOptions[0].value);
                    }
                }
            } catch (error) {
                console.error('Error al cargar tipos de precios:', error);
            } finally {
                setLoadingPrecios(false);
            }
        };

        if (isOpen) {
            loadPreciosTipos();
        }
    }, [isOpen]);

    // Guardar en localStorage cuando cambie la canasta
    useEffect(() => {
        if (productosCanasta.length > 0) {
            localStorage.setItem('canastaPedidos', JSON.stringify(productosCanasta));
        }
    }, [productosCanasta]);

    // Actualizar precios cuando cambie el precio seleccionado
    useEffect(() => {
        if (precioSeleccionado && preciosTipos.length > 0 && productosCanasta.length > 0) {
            const tipoPrecio = preciosTipos.find(p => p.value === precioSeleccionado);
            if (tipoPrecio) {
                setProductosCanasta(prev => prev.map(producto => {
                    // Buscar el precio correspondiente al tipo seleccionado en los precios del producto
                    const precioProducto = producto.price_product?.find(pp => pp.prices_types?.id === tipoPrecio.id);
                    const nuevoPrecio = precioProducto?.valor || tipoPrecio.default_value || 0;
                    
                    return {
                        ...producto,
                        precio: nuevoPrecio
                    };
                }));
            }
        }
    }, [precioSeleccionado, preciosTipos]);

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

    const handleActualizarPrecio = (productoId, nuevoPrecio) => {
        setProductosCanasta(prev => prev.map(p =>
            p.id === productoId
                ? { ...p, precio: parseFloat(nuevoPrecio) || 0 }
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

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        localStorage.removeItem('canastaPedidos'); // Solo eliminar cuando el usuario limpie explícitamente
        setIsLimpiarModalOpen(false);
    };

    const handleConfirmarPedido = async () => {
        setLoadingConfirmar(true);
        try {
            // Preparar datos para enviar al backend
            const pedidoData = {
                observaciones: observacionesGenerales || null,
                productos: productosCanasta.map(producto => ({
                    id: producto.id,
                    cantidad: producto.cantidad,
                    precio: producto.precio || 0
                }))
            };

            // Enviar al backend
            const response = await pedidosAlmacenService.create(pedidoData);

            if (response.success) {
                // Guardar datos del pedido para mostrar en pantalla de éxito
                setPedidoCreado(response.data);
                
                // Guardar datos de los productos para mostrar en la pantalla de éxito
                setDatosParaExito(productosCanasta.map(producto => ({
                    nombre: producto.name,
                    cantidad: `${producto.cantidad} ${producto.type_measure?.code || 'u'} - Bs. ${((producto.precio || 0) * producto.cantidad).toFixed(2)}`,
                    medida: '' // No usar medida aquí ya que está incluida en cantidad
                })));

                // Limpiar la canasta inmediatamente al mostrar éxito
                setProductosCanasta([]);
                setObservacionesGenerales('');
                
                // Cerrar modal de confirmación
                setIsConfirmarModalOpen(false);
                
                // Mostrar pantalla de éxito
                setIsExitoOpen(true);
            } else {
                console.error('Error al crear pedido:', response.message);
                // Aquí podrías mostrar una notificación de error
            }

        } catch (error) {
            console.error('Error al confirmar pedido:', error);
            // Aquí podrías mostrar una notificación de error
        } finally {
            setLoadingConfirmar(false);
        }
    };

    const getTotalProductos = () => {
        return productosCanasta.reduce((total, producto) => total + producto.cantidad, 0);
    };

    const getTotalValor = () => {
        return productosCanasta.reduce((total, producto) => {
            const valorProducto = (producto.precio || 0) * producto.cantidad;
            return total + valorProducto;
        }, 0);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Canasta de Pedidos
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsLimpiarModalOpen(true)}>
                            <BoxIcon name='trash' className={styles.iconTrash} />
                        </button>
                    </div>
                </h1>
                <p className={styles.subTitle}>({getTotalProductos()} productos)</p>

                {/* Selector de precio general */}
                {productosCanasta.length > 0 && (
                    <div className={styles.precioGeneral}>
                        <Select
                            value={precioSeleccionado}
                            onChange={setPrecioSeleccionado}
                            options={preciosTipos}
                            placeholder="Seleccionar precio general"
                            disabled={loadingPrecios}
                            icon='dollar'
                        />
                    </div>
                )}

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
                                                <p className={styles.stockInfo}>
                                                    Disponible: {producto.stock || 0} {producto.type_measure?.code || ''}
                                                </p>
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
                                        <div className={styles.precioControl}>
                                            <label className={styles.precioLabel}>Precio (Bs.)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={producto.precio || 0}
                                                onChange={(e) => handleActualizarPrecio(producto.id, e.target.value)}
                                                className={styles.precioInput}
                                            />
                                        </div>
                                        
                                        <div className={styles.cantidadControl}>
                                             <button
                                                 className={styles.btnCantidad}
                                                 onClick={() => handleActualizarCantidad(producto.id, producto.cantidad - 1, true)}
                                                 disabled={producto.cantidad <= 1}
                                             >
                                                 <BoxIcon name='minus' />
                                             </button>
                                            <motion.span
                                                animate={animarCantidad[producto.id] ? { scale: [1, 1.3, 0.9, 1] } : { scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className={styles.cantidad}
                                            >
                                                <input
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
                                                 <BoxIcon name='plus' />
                                             </button>
                                        </div>
                                    </div>

                                    <div className={styles.productoTotal}>
                                        <span className={styles.totalLabel}>Subtotal:</span>
                                        <span className={styles.totalValue}>
                                            Bs. {((producto.precio || 0) * producto.cantidad).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total general */}
                        <div className={styles.totalGeneral}>
                            <div className={styles.totalGeneralContent}>
                                <span className={styles.totalGeneralLabel}>Total General:</span>
                                <span className={styles.totalGeneralValue}>Bs. {getTotalValor().toFixed(2)}</span>
                            </div>
                        </div>

                        <div className={styles.buttons}>
                            <Boton
                                className='btn-original'
                                label='Resumen de Pedido'
                                onClick={() => setIsConfirmarModalOpen(true)}
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.canastaVacia}>
                        <BoxIcon name='cart' className={styles.iconoVacio} />
                        <p>Tu canasta está vacía</p>
                        <p className={styles.subtexto}>Agrega productos desde la lista para crear pedidos</p>
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

            {/* Modal de confirmar pedido */}
            <ViewModal isOpen={isConfirmarModalOpen} setIsOpen={setIsConfirmarModalOpen}>
                <HeaderModal
                    title="Resumen de Pedido"
                    onClose={() => setIsConfirmarModalOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Productos a pedir:</p>
                    <div className={styles.content}>
                        {productosCanasta.map((producto, index) => (
                            <ItemLine
                                key={`resumen-${producto.id}-${index}`}
                                icon='box'
                                title={`${producto.name} (${producto.cantidad} ${producto.type_measure?.code ||'u'}) - Bs. ${((producto.precio || 0) * producto.cantidad).toFixed(2)}`}
                                onClick={() => handleEliminarProducto(producto.id)}
                            />
                        ))}
                    </div>
                    
                    <div className={styles.totalResumen}>
                        <div className={styles.totalResumenContent}>
                            <span className={styles.totalResumenLabel}>Total:</span>
                            <span className={styles.totalResumenValue}>Bs. {getTotalValor().toFixed(2)}</span>
                        </div>
                    </div>

                    <div className={styles.observacionesGenerales}>
                        <InputNormal
                            tipo="text"
                            value={observacionesGenerales}
                            placeholder="Observaciones del pedido"
                            onChange={(e) => setObservacionesGenerales(e.target.value)}
                        />
                    </div>
                    
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-original'
                            label='Confirmar Pedido'
                            onClick={handleConfirmarPedido}
                            loading={loadingConfirmar}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Pantalla de éxito */}
            <PantallaExito
                isOpen={isExitoOpen}
                setIsOpen={setIsExitoOpen}
                titulo="¡Pedido Creado!"
                descripcion="Tu pedido ha sido creado correctamente y está pendiente de procesamiento."
                datosPedido={datosParaExito}
                totalGeneral={datosParaExito.reduce((total, item) => {
                    // Extraer el precio del texto de cantidad
                    const precioMatch = item.cantidad.match(/Bs\. (\d+\.?\d*)/);
                    return total + (precioMatch ? parseFloat(precioMatch[1]) : 0);
                }, 0)}
                onDescargarPDF={() => console.log('Descargar PDF')}
                onDescargarExcel={() => console.log('Descargar Excel')}
                onEnviarWhatsapp={() => console.log('Enviar WhatsApp')}
                onCerrar={() => {
                    // Limpiar datos de éxito
                    setDatosParaExito([]);
                    setPedidoCreado(null);
                    // Solo cerrar la pantalla de éxito y volver
                    setIsOpen(false);
                    if (onCerrarCanasta) {
                        onCerrarCanasta();
                    }
                }}
            />
        </View>
    );
}

export default CanastaPedidos;