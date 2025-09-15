import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import ModalDescarga from '../../ui/ModalDescarga';
import Select from '../../common/Select';

function VerPedido({ isOpen, setIsOpen, pedido, tipoPedido, onEstadoActualizado }) {
    const [loading, setLoading] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isCambiarEstadoOpen, setIsCambiarEstadoOpen] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [nuevoEstado, setNuevoEstado] = useState('');

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
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Opciones de estados
    const estadosOpciones = [
        { value: 'Pendiente', label: 'Pendiente' },
        { value: 'En Proceso', label: 'En Proceso' },
        { value: 'Completado', label: 'Completado' },
        { value: 'Cancelado', label: 'Cancelado' }
    ];

    // Función para formatear fecha
    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Función para obtener el color del estado
    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'Pendiente': return '#f39c12';
            case 'En Proceso': return '#3498db';
            case 'Completado': return '#27ae60';
            case 'Cancelado': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    // Función para calcular el total del pedido
    const calcularTotal = () => {
        if (!pedido) return 0;

        const detalles = pedido.pedido_almacen_detalle || pedido.pedido_acopio_detalle || [];
        return detalles.reduce((total, detalle) => {
            const precio = detalle.precio || 0;
            const cantidad = detalle.cantidad || 0;
            return total + (precio * cantidad);
        }, 0);
    };

    // Función para cambiar estado
    const handleCambiarEstado = async () => {
        if (!nuevoEstado || !pedido) return;

        try {
            setLoading(true);
            if (onEstadoActualizado) {
                await onEstadoActualizado(pedido.id, nuevoEstado);
                setIsCambiarEstadoOpen(false);
                setNuevoEstado('');
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            mostrarNotificacion('error', 'Error al cambiar estado');
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener los detalles del pedido
    const getDetallesPedido = () => {
        if (!pedido) return [];

        const detalles = pedido.pedido_almacen_detalle || pedido.pedido_acopio_detalle || [];
        return detalles.map(detalle => {
            const producto = detalle.producto_almacen || detalle.producto_acopio || {};
            return {
                id: detalle.id,
                nombre: producto.name || 'Producto no encontrado',
                cantidad: detalle.cantidad || 0,
                medida: detalle.medida || producto.type_measure?.code || 'u',
                precio: detalle.precio || 0,
                subtotal: (detalle.precio || 0) * (detalle.cantidad || 0)
            };
        });
    };

    if (!pedido) return null;

    const detalles = getDetallesPedido();
    const total = calcularTotal();

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Detalles del Pedido</h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL PEDIDO</p>
                <div className={styles.content}>
                    <Dato
                        label="ID del Pedido"
                        value={`#${pedido.id.slice(-8)}`}
                    />
                    <Dato
                        label="Estado"
                        value={pedido.estado}
                        especial={pedido.estado === 'Cancelado' ? 'red' : pedido.estado === 'Completado' ? 'green' : 'orange'}
                    />
                    <Dato
                        label="Fecha"
                        value={formatearFecha(pedido.fecha || pedido.created_at)}
                    />
                    <Dato
                        label="Total"
                        value={`Bs. ${total.toFixed(2)}`}
                    />
                    <Dato
                        label="Observaciones"
                        value={pedido.observaciones || 'Sin observaciones'}
                    />
                </div>

                {/* Botón para ver productos */}
                {detalles.length > 0 && (
                    <div className={styles.content} style={{ padding: '10px 15px' }}>
                        <Boton
                            className='btn-default'
                            label={`Ver Productos (${detalles.length})`}
                            onClick={() => setIsProductosOpen(true)}
                        />
                    </div>
                )}

                <Boton
                    className='btn-default'
                    label='Descargar Pedido'
                    style={{ marginTop: 'auto' }}
                    onClick={() => setIsDescargaOpen(true)}
                />
            </div>

            {/* Modal de productos */}
            <ViewModal isOpen={isProductosOpen} setIsOpen={setIsProductosOpen}>
                <HeaderModal
                    title="Productos del Pedido"
                    onClose={() => setIsProductosOpen(false)}
                />
                <div className={styles.modalContent}>
                    {detalles.length > 0 && (
                        <>
                            <p className={styles.subTitle}>PRODUCTOS INCLUIDOS</p>
                            {detalles.map((producto, index) => (
                                <ItemView
                                    key={producto.id || index}
                                    title={producto.nombre}
                                    description={`${producto.cantidad} ${producto.medida} - Bs. ${producto.precio.toFixed(2)} c/u`}
                                    flot2={`Bs. ${producto.subtotal.toFixed(2)}`}
                                />
                            ))}
                        </>
                    )}
                </div>
            </ViewModal>

            {/* Modal para cambiar estado */}
            <ViewModal isOpen={isCambiarEstadoOpen} setIsOpen={setIsCambiarEstadoOpen}>
                <HeaderModal
                    title="Cambiar Estado del Pedido"
                    onClose={() => setIsCambiarEstadoOpen(false)}
                />
                <div className={styles.modalContent}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nuevo Estado:</label>
                        <Select
                            value={nuevoEstado}
                            onChange={setNuevoEstado}
                            options={estadosOpciones}
                            placeholder="Seleccionar estado"
                            icon="check-circle"
                        />
                    </div>
                    <div className={styles.buttons}>
                        <Boton
                            className="btn-original"
                            label="Confirmar"
                            onClick={handleCambiarEstado}
                            loading={loading}
                        />
                        <Boton
                            className="btn-default"
                            label="Cancelar"
                            onClick={() => setIsCambiarEstadoOpen(false)}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Pedido"
                onDescargarPDF={() => console.log('Descargar PDF')}
                onDescargarExcel={() => console.log('Descargar Excel')}
                onEnviarWhatsapp={() => console.log('Enviar WhatsApp')}
            />

            {/* Notificación */}
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default VerPedido;
