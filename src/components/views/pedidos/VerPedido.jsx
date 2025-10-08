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
import DescargaPedidoBuilder from './DescargaPedidoBuilder';
import AlmacenGeneral from '../almacen-general/AlmacenGeneral';
import { useUser } from '../../../context/UserContext';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import deudasService from '../../../services/deudasService';

function VerPedido({ isOpen, setIsOpen, pedido, tipoPedido, onPedidoEliminado, onPedidoActualizado }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const [loading, setLoading] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);
    const [modoAlmacen, setModoAlmacen] = useState('pedido'); // 'pedido' o 'entregar'


    // Función para manejar cuando se actualiza un pedido
    const handlePedidoActualizado = (pedidoActualizado) => {
        if (onPedidoActualizado) {
            onPedidoActualizado(pedidoActualizado);
        }
        // Cerrar AlmacenGeneral cuando se actualiza el pedido
        setIsAlmacenOpen(false);
    };
    // Función para eliminar pedido
    const handleEliminarPedido = async () => {
        if (!pedido) return;

        try {
            setLoading(true);
            const response = await pedidosAlmacenService.eliminar(pedido.id);

            if (response.success) {
                mostrarNotificacion('success', 'Pedido eliminado correctamente');
                setIsEliminarOpen(false);

                // Llamar a la función para actualizar la lista en el padre
                if (onPedidoEliminado) {
                    onPedidoEliminado(pedido.id);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar el pedido');
            }
        } catch (error) {
            console.error('Error al eliminar pedido:', error);
            mostrarNotificacion('error', 'Error al eliminar el pedido');
        } finally {
            setLoading(false);
        }
    };
    // Función para editar pedido
    const handleEditarPedido = () => {
        if (!pedido) {
            mostrarNotificacion('error', 'No hay pedido para editar');
            return;
        }

        // Limpiar completamente la canasta de pedidos en localStorage
        localStorage.removeItem('canastaPedidos');
        localStorage.removeItem('pedidoIdEditando');
        localStorage.removeItem('precioIdEditando');
        localStorage.removeItem('pedidoAgrupadoEditando');
        localStorage.removeItem('productosPedidoEditando');

        // Guardar datos del pedido para edición (similar a entrega)
        localStorage.setItem('pedidoIdEditando', pedido.id);
        localStorage.setItem('precioIdEditando', pedido.precio_id || '');
        localStorage.setItem('pedidoAgrupadoEditando', pedido.agrupado ? 'agrupado' : 'no_agrupado');
        
        // Guardar productos del pedido para cargar automáticamente (solo ID y cantidad)
        const productosPedido = pedido.pedido_almacen_detalle?.map(detalle => ({
            id: detalle.producto_almacen.id,
            cantidad: detalle.cantidad
        })) || [];
        localStorage.setItem('productosPedidoEditando', JSON.stringify(productosPedido));

        // Guardar cliente si existe para preseleccionarlo en CanastaPedidos
        if (pedido.cliente?.id) {
            localStorage.setItem('clienteIdEditando', pedido.cliente.id);
            localStorage.setItem('clienteNameEditando', pedido.cliente.name || '');
        } else {
            localStorage.removeItem('clienteIdEditando');
            localStorage.removeItem('clienteNameEditando');
        }

        // Abrir AlmacenGeneral en modo pedido
        setModoAlmacen('pedido');
        setIsAlmacenOpen(true);
    };
    // Función para manejar la entrega de pedido (ya no se usa, la lógica está en CanastaMovimientos)
    const handleEntregaConfirmada = async (movimientoId, pedidoActualizadoData) => {
        // Esta función ya no se usa porque la lógica de entrega está en el backend
        // Solo actualizar el pedido local si viene de CanastaMovimientos
        if (onPedidoActualizado) {
            const pedidoActualizado = {
                ...pedido,
                estado: 'Entregado',
                movimiento_id: movimientoId,
                // Si viene pedidoActualizadoData del update, usar esos datos
                ...(pedidoActualizadoData && { ...pedidoActualizadoData })
            };
            onPedidoActualizado(pedidoActualizado);
        }

        // Cerrar AlmacenGeneral (VerPedido se cerrará desde PanelPedidos después de actualizar)
        setIsAlmacenOpen(false);
    };
    // Función para cancelar entrega
    const handleCancelarEntrega = async () => {
        if (!pedido) return;

        try {
            setLoading(true);

            // Guardar los IDs antes de empezar
            const movimientoId = pedido.movimiento_salida_id;
            const deudaId = pedido.deuda_id;

            console.log('PASO 1: Anulando movimiento...');
            // 1) PRIMERO: Anular el movimiento (desde pedido)
            if (movimientoId) {
                const anularResponse = await movimientosAlmacenService.anular(movimientoId, true);
                if (!anularResponse.success) {
                    mostrarNotificacion('error', 'Error al anular el movimiento: ' + anularResponse.message);
                    return;
                }
                console.log('✅ Movimiento anulado correctamente');
            }

            console.log('PASO 2: Limpiando campos del pedido...');
            // 2) SEGUNDO: Limpiar movimiento_salida_id y deuda_id del pedido (sin cambiar estado)
            const limpiarCamposResponse = await pedidosAlmacenService.updateEstado(pedido.id, pedido.estado, null, null);
            if (!limpiarCamposResponse.success) {
                mostrarNotificacion('error', 'Error al limpiar campos del pedido: ' + limpiarCamposResponse.message);
                return;
            }
            console.log('✅ Campos del pedido limpiados (movimiento_salida_id y deuda_id)');

            console.log('PASO 3: Eliminando deuda...');
            // 3) TERCERO: Eliminar la deuda
            if (deudaId) {
                const eliminarDeudaResponse = await deudasService.delete(deudaId);
                if (!eliminarDeudaResponse.success) {
                    mostrarNotificacion('error', 'Error al eliminar la deuda: ' + eliminarDeudaResponse.message);
                    return;
                }
                console.log('✅ Deuda eliminada correctamente');
            }

            console.log('PASO 4: Eliminando movimiento...');
            // 4) CUARTO: Eliminar el movimiento
            if (movimientoId) {
                const eliminarMovimientoResponse = await movimientosAlmacenService.eliminar(movimientoId);
                if (!eliminarMovimientoResponse.success) {
                    mostrarNotificacion('error', 'Error al eliminar el movimiento: ' + eliminarMovimientoResponse.message);
                    return;
                }
                console.log('✅ Movimiento eliminado correctamente');
            }

            console.log('PASO 5: Cambiando estado del pedido a Pendiente...');
            // 5) QUINTO: Cambiar estado del pedido a Pendiente
            const cambiarEstadoResponse = await pedidosAlmacenService.updateEstado(pedido.id, 'Pendiente');
            if (!cambiarEstadoResponse.success) {
                mostrarNotificacion('error', 'Error al cambiar estado del pedido: ' + cambiarEstadoResponse.message);
                return;
            }
            console.log('✅ Estado del pedido cambiado a Pendiente');

            mostrarNotificacion('success', 'Entrega cancelada correctamente');

            // Actualizar el pedido local y cerrar
            const pedidoActualizado = {
                ...pedido,
                estado: 'Pendiente',
                movimiento_salida_id: null,
                deuda_id: null
            };

            if (onPedidoActualizado) {
                onPedidoActualizado(pedidoActualizado);
            }

            // Cerrar modal y regresar a PanelPedidos
            setIsOpen(false);

        } catch (error) {
            console.error('Error al cancelar entrega:', error);
            mostrarNotificacion('error', 'Error al cancelar entrega');
        } finally {
            setLoading(false);
        }
    };
    // Función para ingresar pedido
    const handleIngresarPedido = async () => {
        if (!pedido) return;

        try {
            setLoading(true);

            // Si la sucursal actual comparte almacén, solo finalizar sin crear movimiento
            const usaAlmacenCompartido = !!(sucursalActual && sucursalActual.almacen_sucursal_id);
            if (usaAlmacenCompartido) {
                const estadoResponse = await pedidosAlmacenService.updateEstado(pedido.id, 'Completado');
                if (estadoResponse.success) {
                    mostrarNotificacion('success', 'Pedido finalizado correctamente');
                    const pedidoActualizado = {
                        ...pedido,
                        estado: 'Completado'
                    };
                    if (onPedidoActualizado) {
                        onPedidoActualizado(pedidoActualizado);
                    }
                    setIsOpen(false);
                    return;
                } else {
                    mostrarNotificacion('error', 'Error al finalizar el pedido: ' + estadoResponse.message);
                    return;
                }
            }

            // Preparar los productos del pedido para el ingreso
            const productosParaIngreso = pedido.pedido_almacen_detalle?.map(detalle => ({
                id: detalle.producto_almacen.id,
                cantidad: detalle.cantidad,
                precio: detalle.precio || 0
            })) || [];

            if (productosParaIngreso.length === 0) {
                mostrarNotificacion('error', 'No hay productos para ingresar');
                return;
            }

            // Crear el movimiento de entrada usando el MVC de movimientos
            const movimientoData = {
                type: 'entrada',
                observaciones: `Ingreso automático del pedido #${pedido.id.slice(-8)}`,
                productos: productosParaIngreso,
                precio_id: pedido.precio_id
            };

            const movimientoResponse = await movimientosAlmacenService.create(movimientoData);

            if (movimientoResponse.success) {
                // Actualizar el estado del pedido a Completado y registrar el movimiento de entrada
                const estadoResponse = await pedidosAlmacenService.updateEstado(pedido.id, 'Completado', movimientoResponse.data.id);

                if (estadoResponse.success) {
                    mostrarNotificacion('success', 'Pedido ingresado correctamente');

                    // Actualizar el pedido local
                    const pedidoActualizado = {
                        ...pedido,
                        estado: 'Completado'
                    };

                    if (onPedidoActualizado) {
                        onPedidoActualizado(pedidoActualizado);
                    }

                    // Cerrar modal y regresar a PanelPedidos
                    setIsOpen(false);
                } else {
                    mostrarNotificacion('error', 'Error al actualizar estado del pedido: ' + estadoResponse.message);
                }
            } else {
                mostrarNotificacion('error', 'Error al crear el ingreso: ' + movimientoResponse.message);
            }
        } catch (error) {
            console.error('Error al ingresar pedido:', error);
            mostrarNotificacion('error', 'Error al ingresar pedido');
        } finally {
            setLoading(false);
        }
    };
    // Función para entregar pedido
    const handleEntregarPedido = () => {
        if (!pedido || tipoPedido === 'acopio') {
            mostrarNotificacion('error', 'Solo se pueden entregar pedidos de almacén');
            return;
        }

        // Limpiar completamente la canasta de salidas en localStorage
        localStorage.removeItem('canastaSalidas');
        localStorage.removeItem('pedidoIdEntregando');
        localStorage.removeItem('precioIdEntregando');
        localStorage.removeItem('pedidoDestinoSucursalId');
        localStorage.removeItem('pedidoDestinoSucursalName');

        // Guardar datos del pedido para entrega
        localStorage.setItem('pedidoIdEntregando', pedido.id);
        localStorage.setItem('precioIdEntregando', pedido.precio_id || '');
        localStorage.setItem('pedidoAgrupadoEntregando', pedido.agrupado ? 'agrupado' : 'no_agrupado');
        localStorage.setItem('pedidoDestinoSucursalId', pedido.sucursal_id || '');
        localStorage.setItem('pedidoDestinoSucursalName', pedido.sucursal?.name || '');
        
        // Guardar productos del pedido para cargar automáticamente
        const productosPedido = pedido.pedido_almacen_detalle?.map(detalle => ({
            id: detalle.producto_almacen.id,
            cantidad: detalle.cantidad
        })) || [];
        localStorage.setItem('productosPedidoEntregando', JSON.stringify(productosPedido));

        // Abrir AlmacenGeneral en modo salida
        setModoAlmacen('entregar');
        setIsAlmacenOpen(true);
    };


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



    // Función para obtener los detalles del pedido
    const getDetallesPedido = () => {
        if (!pedido) return [];

        // Para almacén, usar la estructura de detalles
        const detalles = pedido.pedido_almacen_detalle || [];
        return detalles.map(detalle => {
            const producto = detalle.producto_almacen || {};
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



    const puedeEditarPedido = () => {
        if (!pedido || !sucursalActual) return false;
        return pedido.sucursal_id === sucursalActual.id && pedido.estado !== 'Entregado' && pedido.estado !== 'Completado';
    };
    const puedeEntregarPedido = () => {
        if (!pedido || !sucursalActual) return false;
        return pedido.sucursal_destino_id === sucursalActual.id && pedido.estado !== 'Entregado' && pedido.estado !== 'Completado';
    };
    const puedeCancelarEntrega = () => {
        if (!pedido || !sucursalActual) return false;
        return pedido.sucursal_destino_id === sucursalActual.id && pedido.estado === 'Entregado';
    };
    const puedeIngresarPedido = () => {
        if (!pedido || !sucursalActual) return false;
        return pedido.sucursal_id === sucursalActual.id && pedido.estado === 'Entregado';
    };
    const puedeEliminarPedido = () => {
        if (!pedido || !sucursalActual) return false;
        return pedido.sucursal_id === sucursalActual.id && pedido.estado !== 'Completado' && pedido.estado !== 'Entregado';
    };


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Detalles del Pedido
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsDescargaOpen(true)}>
                            <BoxIcon
                                name='download'
                                className={styles.iconDownload}
                            />
                        </button>
                    </div>
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL SOLICITANTE</p>
                <ItemView
                    title={pedido.user?.name || pedido.personal?.name || 'Usuario desconocido'}
                    description={pedido.sucursal?.name || 'Sucursal desconocida'}
                    transparent={false}
                />
                <p className={styles.subTitle}>INFORMACIÓN DEL PEDIDO</p>
                <ItemView
                    title={`Pedido #${pedido.id.slice(-8)}`}
                    description={`Fecha y hora: ${new Date(pedido.fecha || pedido.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}`}
                    description2={`Tipo de precio: ${pedido.precio?.name || 'Precio desconocido'}`}
                    flot6={pedido.estado === 'Completado' ? 'Completado' : pedido.estado === 'Cancelado' ? 'Cancelado' : pedido.estado === 'Entregado' ? 'Entregado' : 'Pendiente'}
                    circulo={false}
                    transparent={false}
                />
                <ItemView
                    title={pedido.agrupado ? 'Agrupado' : 'Unidades'}
                    description="Modo de pedido"
                    transparent={false}
                />
                {pedido?.cliente?.name && (
                    <ItemView
                        title={pedido.cliente.name}
                        description="Cliente"
                        transparent={false}
                    />
                )}
                {/* Botón para ver productos */}
                {detalles.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label={`Productos (${detalles.length})`}
                        onClick={() => setIsProductosOpen(true)}
                    />
                )}

                <Dato
                    label="Total"
                    value={`Bs. ${(pedido.pedido_almacen_detalle || []).reduce((total, detalle) => {
                        const precio = detalle.precio || 0;
                        const cantidad = detalle.cantidad || 0;
                        return total + (precio * cantidad);
                    }, 0).toFixed(2)}`}
                    especial='green'
                    vertical={false}
                />
                <Dato
                    label="Observaciones"
                    value={pedido.observaciones || 'Sin observaciones'}
                    vertical={false}
                />
                
                {/* Mostrar método de pago si el pedido está entregado */}
                {pedido.estado === 'Entregado' && pedido?.movimiento_salida?.metodo_pago && (
                    <Dato
                        label="Método de Pago"
                        value={pedido.movimiento_salida.metodo_pago}
                        vertical={false}
                        especial="green"
                    />
                )}


                <div className={styles.buttons}>
                    {puedeEliminarPedido() && (
                        <Boton
                            className='btn-red'
                            label='Eliminar Pedido'
                            onClick={() => setIsEliminarOpen(true)}
                        />
                    )}
                    {puedeEditarPedido() && (
                        <Boton
                            className='btn-default'
                            label='Editar Pedido'
                            onClick={handleEditarPedido}
                        />
                    )}
                    {puedeEntregarPedido() && (
                        <Boton
                            className='btn-green'
                            label='Entregar Pedido'
                            onClick={handleEntregarPedido}
                        />
                    )}
                    {puedeCancelarEntrega() && (
                        <Boton
                            className='btn-orange'
                            label='Cancelar Entrega'
                            onClick={handleCancelarEntrega}
                            loading={loading}
                        />
                    )}
                    {puedeIngresarPedido() && (
                        <Boton
                            className='btn-green'
                            label={sucursalActual?.almacen_sucursal_id ? 'Finalizar Pedido' : 'Ingresar Pedido'}
                            onClick={handleIngresarPedido}
                            loading={loading}
                        />
                    )}
                </div>
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
                                    description={`Bs. ${producto.precio.toFixed(2)}`}
                                    description2={`Subtotal: Bs. ${producto.subtotal.toFixed(2)}`}
                                    flot2={`${producto.cantidad} Und.`}
                                    icon='package'
                                />
                            ))}
                        </>
                    )}
                </div>
            </ViewModal>

            {/* Modal de descarga */}
            <DescargaPedidoBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                pedidoId={pedido?.id}
                pedidoData={pedido}
                tipo="almacen"
            />

            {/* Modal de eliminar pedido */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Pedido"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar permanentemente este pedido? Esta acción no se puede deshacer.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Sí, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleEliminarPedido}
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

            {/* Notificación */}
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Modal de AlmacenGeneral para editar pedido */}
            <AlmacenGeneral
                isOpen={isAlmacenOpen}
                setIsOpen={setIsAlmacenOpen}
                tipo={modoAlmacen === 'entregar' ? 'salida' : 'pedido'}
                onPedidoActualizado={handlePedidoActualizado}
                onEntregaConfirmada={modoAlmacen === 'entregar' ? handleEntregaConfirmada : null}
                pedidoIdEditando={modoAlmacen === 'pedido' ? pedido?.id : null}
            />
        </View>
    );
}

export default VerPedido;
