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
import pricesTypesService from '../../../services/pricesTypesService';
import proveedorService from '../../../services/proveedorService';
import clientService from '../../../services/clientService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import EditarAgregar from '../proveedores/EditarAgregar';
import EditarAgregarCliente from '../clientes/EditarAgregar';
import PantallaExito from '../../common/PantallaExito';
import Switch from '../../common/Switch';

function CanastaMovimientos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, tipoMovimiento, onCerrarCanasta, onProductosUpdated, esEntrega = false }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false);
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [isExitoOpen, setIsExitoOpen] = useState(false);
    const [movimientoCreado, setMovimientoCreado] = useState(null);
    const [datosParaExito, setDatosParaExito] = useState([]);
    const [animarCantidad, setAnimarCantidad] = useState({});
    const [preciosTipos, setPreciosTipos] = useState([]);
    const [precioSeleccionado, setPrecioSeleccionado] = useState('');
    const [loadingPrecios, setLoadingPrecios] = useState(false);

    // Estados para clientes y proveedores
    const [proveedores, setProveedores] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loadingProveedores, setLoadingProveedores] = useState(false);
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [proveedoresError, setProveedoresError] = useState('');
    const [clientesError, setClientesError] = useState('');
    const [isProveedorOpen, setIsProveedorOpen] = useState(false);
    const [isClienteOpen, setIsClienteOpen] = useState(false);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('');
    const [restarIngredientes, setRestarIngredientes] = useState(() => {
        const saved = localStorage.getItem('restarIngredientes');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Opciones de métodos de pago
    const metodosPago = [
        { value: 'qr', label: 'QR', icon: 'qr-scan' },
        { value: 'transferencia', label: 'Transferencia', icon: 'transfer' },
        { value: 'tarjeta', label: 'Tarjeta', icon: 'credit-card' },
        { value: 'efectivo', label: 'Efectivo', icon: 'money' }
    ];

    // Cargar tipos de precios
    useEffect(() => {
        const loadPreciosTipos = async () => {
            setLoadingPrecios(true);
            try {
                const response = await pricesTypesService.getAll();
                if (response.success) {
                    const mappedOptions = response.data.map(precio => ({
                        value: precio.id,
                        label: precio.name, // Solo mostrar el nombre, no el valor
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

    // Cargar proveedores (solo para entradas)
    useEffect(() => {
        const loadProveedores = async () => {
            if (tipoMovimiento !== 'entrada') return;
            
            setLoadingProveedores(true);
            setProveedoresError('');
            setProveedores([]);
            try {
                const response = await proveedorService.getAll();
                if (response.success) {
                    const mappedOptions = response.data.map(prov => ({
                        value: prov.id,
                        label: prov.name,
                        id: prov.id,
                        name: prov.name
                    }));
                    setProveedores(mappedOptions);
                } else {
                    setProveedoresError(response.message || 'Error al cargar proveedores');
                }
            } catch (error) {
                setProveedoresError('Error al cargar proveedores');
            } finally {
                setLoadingProveedores(false);
            }
        };

        if (isOpen && tipoMovimiento === 'entrada') {
            loadProveedores();
        }
    }, [isOpen, tipoMovimiento]);

    // Cargar clientes (solo para salidas normales)
    useEffect(() => {
        const loadClientes = async () => {
            if (tipoMovimiento !== 'salida' || esEntrega) return;
            
            setLoadingClientes(true);
            setClientesError('');
            setClientes([]);
            try {
                const response = await clientService.getAll();
                if (response.success) {
                    const mappedOptions = response.data.map(cliente => ({
                        value: cliente.id,
                        label: cliente.name,
                        id: cliente.id,
                        name: cliente.name
                    }));
                    setClientes(mappedOptions);
                } else {
                    setClientesError(response.message || 'Error al cargar clientes');
                }
            } catch (error) {
                setClientesError('Error al cargar clientes');
            } finally {
                setLoadingClientes(false);
            }
        };

        if (isOpen && tipoMovimiento === 'salida' && !esEntrega) {
            loadClientes();
        }
    }, [isOpen, tipoMovimiento, esEntrega]);


    // Guardar en localStorage cuando cambie la canasta (separado por tipo)
    useEffect(() => {
        const localStorageKey = tipoMovimiento === 'entrada' ? 'canastaEntradas' : 'canastaSalidas';
        if (productosCanasta.length > 0) {
            localStorage.setItem(localStorageKey, JSON.stringify(productosCanasta));
        } else {
            localStorage.removeItem(localStorageKey);
        }
    }, [productosCanasta, tipoMovimiento]);

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

        // Obtener el producto actual para validar el stock
        const productoActual = productosCanasta.find(p => p.id === productoId);
        if (!productoActual) return;

        // Validar que no exceda el stock disponible
        if (nuevaCantidad > productoActual.stock) {
            console.warn(`No se puede exceder el stock disponible: ${productoActual.stock}`);
            return; // No actualizar si excede el stock
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

    const handleActualizarPrecio = (productoId, nuevoPrecio) => {
        setProductosCanasta(prev => prev.map(p =>
            p.id === productoId
                ? { ...p, precio: parseFloat(nuevoPrecio) || 0 }
                : p
        ));
    };

    // Función para manejar cuando se crea un nuevo proveedor
    const handleProveedorCreated = (newProveedor) => {
        setProveedores(prev => [...prev, {
            value: newProveedor.id,
            label: newProveedor.name,
            id: newProveedor.id,
            name: newProveedor.name
        }]);
        setProveedorSeleccionado(newProveedor.id);
        setIsProveedorOpen(false);
    };

    // Función para manejar cuando se crea un nuevo cliente
    const handleClienteCreated = (newCliente) => {
        setClientes(prev => [...prev, {
            value: newCliente.id,
            label: newCliente.name,
            id: newCliente.id,
            name: newCliente.name
        }]);
        setClienteSeleccionado(newCliente.id);
        setIsClienteOpen(false);
    };

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        setIsLimpiarModalOpen(false);
    };

    const handleConfirmarMovimientos = async () => {
        setLoadingConfirmar(true);
        try {
            // Preparar datos para enviar al backend
            const movimientoData = {
                tipo: tipoMovimiento,
                observaciones: observacionesGenerales || null,
                metodo_pago: tipoMovimiento === 'salida' ? (metodoPagoSeleccionado || null) : null,
                cliente_id: tipoMovimiento === 'salida' ? (clienteSeleccionado || null) : null,
                proveedor_id: tipoMovimiento === 'entrada' ? (proveedorSeleccionado || null) : null,
                restar_ingredientes: tipoMovimiento === 'entrada' && restarIngredientes && tieneProductosConRecetas(),
                productos: productosCanasta.map(producto => ({
                    id: producto.id,
                    cantidad: producto.cantidad,
                    precio: producto.precio || 0
                }))
            };

            // Enviar al backend
            const response = await movimientosAlmacenService.create(movimientoData);

            if (response.success) {
                // Actualizar productos con los datos del backend (stock actualizado)
                if (response.data?.productos && onProductosUpdated) {
                    const productosActualizados = response.data.productos.map(productoMovimiento => ({
                        ...productoMovimiento.producto,
                        stock: productoMovimiento.producto.stock // Stock actualizado del backend
                    }));
                    onProductosUpdated(productosActualizados);
                }

                // Guardar datos del movimiento para mostrar en pantalla de éxito
                setMovimientoCreado(response.data);
                
                // Guardar datos de los productos para mostrar en la pantalla de éxito
                setDatosParaExito(productosCanasta.map(producto => ({
                    nombre: producto.name,
                    cantidad: `${producto.cantidad} ${producto.type_measure?.code || 'u'} - Bs. ${((producto.precio || 0) * producto.cantidad).toFixed(2)}`,
                    medida: '' // No usar medida aquí ya que está incluida en cantidad
                })));

                // Limpiar la canasta inmediatamente al mostrar éxito
                setProductosCanasta([]);
                setObservacionesGenerales('');
                setProveedorSeleccionado('');
                setClienteSeleccionado('');
                setMetodoPagoSeleccionado('');
                
                // Cerrar modal de confirmación
                setIsConfirmarModalOpen(false);
                
                // Mostrar pantalla de éxito
                setIsExitoOpen(true);
            } else {
                console.error('Error al crear movimiento:', response.message);
                // Aquí podrías mostrar una notificación de error
            }

        } catch (error) {
            console.error('Error al confirmar movimientos:', error);
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

    // Verificar si algún producto en la canasta tiene recetas
    const tieneProductosConRecetas = () => {
        return productosCanasta.some(producto => 
            producto.recetas && producto.recetas.length > 0
        );
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Canasta de {tipoMovimiento === 'entrada' ? 'Entradas' : 'Salidas'}
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
                                                    Stock actual: {producto.stock || 0} {producto.type_measure?.code || ''}
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
                                                    max={producto.stock}
                                                    onChange={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        handleActualizarCantidad(producto.id, nuevaCantidad, false);
                                                    }}
                                                    onBlur={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        if (nuevaCantidad < 1) {
                                                            handleActualizarCantidad(producto.id, 1, false);
                                                        } else if (nuevaCantidad > producto.stock) {
                                                            // Si excede el stock, ajustar al stock máximo
                                                            handleActualizarCantidad(producto.id, producto.stock, false);
                                                        }
                                                    }}
                                                />
                                            </motion.span>
                                             <button
                                                 className={styles.btnCantidad}
                                                 onClick={() => handleActualizarCantidad(producto.id, producto.cantidad + 1, true)}
                                                 disabled={producto.cantidad >= producto.stock}
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
                                label={`Resumen de ${tipoMovimiento === 'entrada' ? 'Entradas' : 'Salidas'}`}
                                onClick={() => setIsConfirmarModalOpen(true)}
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.canastaVacia}>
                        <BoxIcon name='cart' className={styles.iconoVacio} />
                        <p>Tu canasta está vacía</p>
                        <p className={styles.subtexto}>Agrega productos desde la lista para crear {tipoMovimiento === 'entrada' ? 'entradas' : 'salidas'}</p>
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

            {/* Modal de confirmar movimientos */}
            <ViewModal isOpen={isConfirmarModalOpen} setIsOpen={setIsConfirmarModalOpen}>
                <HeaderModal
                    title={`Resumen de ${tipoMovimiento === 'entrada' ? 'Entradas' : 'Salidas'}`}
                    onClose={() => setIsConfirmarModalOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Productos a {tipoMovimiento === 'entrada' ? 'ingresar' : 'retirar'}:</p>
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

                    {/* Selector de proveedor para entradas */}
                    {tipoMovimiento === 'entrada' && (
                        <div className={styles.content} style={{ padding: '10px 15px' }}>
                            <Select
                                value={proveedorSeleccionado}
                                onChange={setProveedorSeleccionado}
                                options={proveedores}
                                placeholder='Proveedor (opcional)'
                                disabled={loadingProveedores || !!proveedoresError}
                                icon='store'
                            />

                            {!proveedoresError && (
                                <Boton
                                    className='btn-default'
                                    label='Nuevo Proveedor'
                                    onClick={() => setIsProveedorOpen(true)}
                                    style={{ minWidth: '80px' }}
                                />
                            )}
                            {proveedoresError && (
                                <div style={{ 
                                    color: '#dc3545',
                                    fontSize: '13px',
                                    textAlign: 'center',
                                }}>
                                    {proveedoresError}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selector de cliente para salidas normales */}
                    {tipoMovimiento === 'salida' && !esEntrega && (
                        <div className={styles.content} style={{ padding: '10px 15px' }}>
                            <Select
                                value={clienteSeleccionado}
                                onChange={setClienteSeleccionado}
                                options={clientes}
                                placeholder='Cliente (opcional)'
                                disabled={loadingClientes || !!clientesError}
                                icon='user'
                            />

                            {!clientesError && (
                                <Boton
                                    className='btn-default'
                                    label='Nuevo Cliente'
                                    onClick={() => setIsClienteOpen(true)}
                                    style={{ minWidth: '80px' }}
                                />
                            )}
                            {clientesError && (
                                <div style={{ 
                                    color: '#dc3545',
                                    fontSize: '13px',
                                    textAlign: 'center',
                                }}>
                                    {clientesError}
                                </div>
                            )}
                        </div>
                    )}


                    {/* Selector de método de pago para salidas */}
                    {tipoMovimiento === 'salida' && (
                        <div className={styles.content} style={{ padding: '10px 15px' }}>
                            <Select
                                value={metodoPagoSeleccionado}
                                onChange={setMetodoPagoSeleccionado}
                                options={metodosPago}
                                placeholder='Método de pago (opcional)'
                                icon='credit-card'
                            />
                        </div>
                    )}

                    {/* Switch para restar ingredientes (solo para entradas y si hay productos con recetas) */}
                    {tipoMovimiento === 'entrada' && tieneProductosConRecetas() && (
                        <div className={styles.content} style={{ padding: '10px 15px' }}>
                            <Switch
                                title="Restar ingredientes"
                                subtitle="Restar automáticamente los ingredientes de las recetas del stock"
                                checked={restarIngredientes}
                                onChange={(value) => {
                                    setRestarIngredientes(value);
                                    localStorage.setItem('restarIngredientes', JSON.stringify(value));
                                }}
                                icon="minus-circle"
                            />
                        </div>
                    )}

                    <div className={styles.observacionesGenerales}>
                        <InputNormal
                            tipo="text"
                            value={observacionesGenerales}
                            placeholder="Observaciones generales"
                            onChange={(e) => setObservacionesGenerales(e.target.value)}
                        />
                    </div>
                    
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-original'
                            label={esEntrega ? 'Entregar Pedido' : `Confirmar ${tipoMovimiento === 'entrada' ? 'Entradas' : 'Salidas'}`}
                            onClick={handleConfirmarMovimientos}
                            loading={loadingConfirmar}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de nuevo proveedor */}
            <EditarAgregar
                isOpen={isProveedorOpen}
                setIsOpen={setIsProveedorOpen}
                tipo='agregar'
                onProveedorCreated={handleProveedorCreated}
            />

            {/* Modal de nuevo cliente */}
            <EditarAgregarCliente
                isOpen={isClienteOpen}
                setIsOpen={setIsClienteOpen}
                tipo='agregar'
                onClienteCreated={handleClienteCreated}
            />

            {/* Pantalla de éxito */}
            <PantallaExito
                isOpen={isExitoOpen}
                setIsOpen={setIsExitoOpen}
                titulo={`¡${tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'} Registrada!`}
                descripcion={`Tu ${tipoMovimiento === 'entrada' ? 'entrada' : 'salida'} ha sido registrada correctamente.`}
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
                    setMovimientoCreado(null);
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

export default CanastaMovimientos;
