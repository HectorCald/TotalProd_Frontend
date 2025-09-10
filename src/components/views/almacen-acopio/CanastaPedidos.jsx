import React, { useState, useEffect } from 'react';
import styles from './CanastaPedidos.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import ItemLine from '../../common/ItemLine';
import { motion, AnimatePresence } from 'framer-motion';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import PantallaExito from '../../common/PantallaExito';

const medidasPedido = [
    { value: 'kg', label: 'Kilogramo (kg)', icon: 'tag' },
    { value: 'qq', label: 'Quintal (qq)', icon: 'tag' },
    { value: 'ml', label: 'Mililitro (ml)', icon: 'tag' },
    { value: 'l', label: 'Litro (l)', icon: 'tag' },
    { value: 'lbrs', label: 'Libras (lbrs)', icon: 'tag' },
    { value: '@', label: 'Arroba (@)', icon: 'tag' },
];

function CanastaPedidos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false);
    const [isExitoOpen, setIsExitoOpen] = useState(false);
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [pedidoCreado, setPedidoCreado] = useState(null);

    // Guardar en localStorage cuando cambie la canasta
    useEffect(() => {
        if (productosCanasta.length > 0) {
            localStorage.setItem('canastaPedidos', JSON.stringify(productosCanasta));
        } else {
            localStorage.removeItem('canastaPedidos');
        }
    }, [productosCanasta]);

    const handleActualizarCantidad = (productoId, nuevaCantidad) => {
        if (nuevaCantidad <= 0) {
            handleEliminarProducto(productoId);
            return;
        }

        setProductosCanasta(prev => prev.map(p =>
            p.id === productoId
                ? { ...p, cantidad: nuevaCantidad }
                : p
        ));
    };

    const handleEliminarProducto = (productoId) => {
        setProductosCanasta(prev => prev.filter(p => p.id !== productoId));
    };

    const handleActualizarMedida = (productoId, nuevaMedida) => {
        setProductosCanasta(prev => prev.map(p =>
            p.id === productoId
                ? { ...p, medidaPedido: nuevaMedida }
                : p
        ));
    };

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        setIsLimpiarModalOpen(false);
    };

    const handleConfirmarPedido = async () => {
        setLoadingConfirmar(true);
        try {
            // Preparar los datos del pedido
            const pedidoData = {
                productos: productosCanasta,
                observaciones: observacionesGenerales
            };

            // Enviar el pedido al backend
            const response = await pedidosAcopioService.create(pedidoData);

            if (response.success) {
                // Guardar datos del pedido para mostrar en pantalla de éxito
                setPedidoCreado(response.data);
                
                // Limpiar la canasta inmediatamente al mostrar éxito
                setProductosCanasta([]);
                setObservacionesGenerales('');
                
                // Cerrar modal de confirmación
                setIsConfirmarModalOpen(false);
                
                // Mostrar pantalla de éxito
                setIsExitoOpen(true);
                
            } else {
                console.error('Error al crear el pedido:', response.message);
                // Aquí podrías mostrar una notificación de error
            }
        } catch (error) {
            console.error('Error al confirmar el pedido:', error);
            // Aquí podrías mostrar una notificación de error
        } finally {
            setLoadingConfirmar(false);
        }
    };

    const getTotalProductos = () => {
        return productosCanasta.reduce((total, producto) => total + producto.cantidad, 0);
    };


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Canasta
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsLimpiarModalOpen(true)}>
                            <BoxIcon name='trash' className={styles.iconTrash} />
                        </button>
                    </div>

                </h1>
                <p className={styles.subTitle}>({getTotalProductos()} productos)</p>

                {productosCanasta.length > 0 ? (
                    <>
                        <div className={styles.productosList}>
                            <AnimatePresence mode="popLayout">
                                {productosCanasta.map((producto, index) => (
                                    <motion.div
                                        key={`${producto.id}-${index}`}
                                        className={styles.productoItem}
                                        initial={{ opacity: 0, x: -50, scale: 0.8 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{
                                            opacity: 0,
                                            x: -300,
                                            transition: { duration: 0.4, ease: "easeInOut" }
                                        }}
                                        layout
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 30
                                        }}
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
                                            />
                                            <div className={styles.cantidadControl}>
                                                <button
                                                    className={styles.btnCantidad}
                                                    onClick={() => handleActualizarCantidad(producto.id, producto.cantidad - 1)}
                                                    disabled={producto.cantidad <= 1}
                                                >
                                                    <BoxIcon name='minus' />
                                                </button>
                                                <motion.span
                                                    className={styles.cantidad}
                                                    key={producto.cantidad}
                                                    initial={{ scale: 1.2 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                                >
                                                    {producto.cantidad}
                                                </motion.span>
                                                <button
                                                    className={styles.btnCantidad}
                                                    onClick={() => handleActualizarCantidad(producto.id, producto.cantidad + 1)}
                                                >
                                                    <BoxIcon name='plus' />
                                                </button>

                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className={styles.buttons}>
                            <Boton
                                className='btn-original'
                                label='Confirmar Pedido'
                                onClick={() => setIsConfirmarModalOpen(true)}
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

            {/* Modal de confirmar pedido */}
            <ViewModal isOpen={isConfirmarModalOpen} setIsOpen={setIsConfirmarModalOpen}>
                <HeaderModal
                    title="Confirmar Pedido"
                    onClose={() => setIsConfirmarModalOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Resumen del pedido:</p>
                    <div className={styles.content}>
                        <AnimatePresence mode="popLayout">
                            {productosCanasta.map((producto, index) => (
                                <motion.div
                                    key={`resumen-${producto.id}-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <ItemLine
                                        icon='box'
                                        title={producto.name + ' (' + producto.cantidad + ' ' + producto.medidaPedido + ')'}
                                        onClick={() => handleEliminarProducto(producto.id)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <div className={styles.observacionesGenerales}>
                        <InputNormal
                            tipo="text"
                            value={observacionesGenerales}
                            placeholder="Observaciones generales del pedido"
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
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            onClick={() => setIsConfirmarModalOpen(false)}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Pantalla de éxito */}
            <PantallaExito
                isOpen={isExitoOpen}
                setIsOpen={setIsExitoOpen}
                titulo="¡Pedido Creado Exitosamente!"
                descripcion="Tu pedido ha sido registrado correctamente y está en estado 'Pendiente'."
                datosPedido={pedidoCreado?.pedido_acopio_detalle?.map(detalle => ({
                    nombre: detalle.producto?.name || 'Producto',
                    cantidad: detalle.cantidad,
                    medida: detalle.medida
                })) || []}
                onDescargarPDF={() => console.log('Descargar PDF')}
                onDescargarExcel={() => console.log('Descargar Excel')}
                onEnviarWhatsapp={() => console.log('Enviar WhatsApp')}
                onCerrar={() => {
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
