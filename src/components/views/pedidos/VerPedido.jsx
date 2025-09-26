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
import AlmacenGeneral from '../almacen-general/AlmacenGeneral';
import { useUser } from '../../../context/UserContext';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';

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

            let response;
            if (tipoPedido === 'acopio') {
                response = await pedidosAcopioService.eliminar(pedido.id);
            } else {
                response = await pedidosAlmacenService.eliminar(pedido.id);
            }

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
        if (!pedido || tipoPedido === 'acopio') {
            mostrarNotificacion('error', 'Solo se pueden editar pedidos de almacén');
            return;
        }

        // Limpiar completamente la canasta de pedidos en localStorage
        localStorage.removeItem('canastaPedidos');
        localStorage.removeItem('pedidoIdEditando');
        localStorage.removeItem('precioIdEditando');

        // Preparar los productos del pedido para la canasta
        const productosParaCanasta = pedido.pedido_almacen_detalle?.map(detalle => ({
            id: detalle.producto_almacen.id,
            name: detalle.producto_almacen.name,
            description: detalle.producto_almacen.description,
            cantidad: detalle.cantidad,
            precio: detalle.precio,
            // No incluir medidaPedido ni observacionesPedido para pedidos de almacén
            // Estos campos solo se usan para pedidos de acopio
        })) || [];

        // Guardar los productos, el ID del pedido y el precio_id en localStorage para que AlmacenGeneral los cargue
        localStorage.setItem('canastaPedidos', JSON.stringify(productosParaCanasta));
        localStorage.setItem('pedidoIdEditando', pedido.id);
        localStorage.setItem('precioIdEditando', pedido.precio_id || '');

        // Abrir AlmacenGeneral en modo pedido
        setModoAlmacen('pedido');
        setIsAlmacenOpen(true);
    };
    // Función para manejar la entrega de pedido
    const handleEntregaConfirmada = async (productosActualizados, precioId, movimientoId) => {
        if (!pedido) return;

        // Validar que hay productos
        if (!productosActualizados || productosActualizados.length === 0) {
            mostrarNotificacion('error', 'No hay productos para entregar');
            return;
        }

        try {
            setLoading(true);

            // Actualizar el pedido con los nuevos productos y precio
            const pedidoData = {
                precio_id: precioId,
                movimiento_id: movimientoId,
                productos: productosActualizados.map(producto => ({
                    id: producto.id,
                    cantidad: producto.cantidad,
                    precio: producto.precio || 0
                }))
            };

            const response = await pedidosAlmacenService.updateEntrega(pedido.id, pedidoData);

            if (response.success) {
                mostrarNotificacion('success', 'Pedido entregado correctamente');

                // Actualizar el pedido local con los datos de la respuesta
                const pedidoActualizado = response.data;

                if (onPedidoActualizado) {
                    onPedidoActualizado(pedidoActualizado);
                }

                // Limpiar localStorage de entrega
                localStorage.removeItem('pedidoIdEntregando');
                localStorage.removeItem('precioIdEntregando');
                localStorage.removeItem('canastaSalidas');

                // Cerrar modales
                setIsAlmacenOpen(false);
                setIsOpen(false);
                
                // Limpiar loading DESPUÉS de cerrar todo
                setLoading(false);
            } else {
                setLoading(false);
                mostrarNotificacion('error', response.message || 'Error al entregar el pedido');
            }
        } catch (error) {
            setLoading(false);
            console.error('Error al entregar pedido:', error);
            mostrarNotificacion('error', 'Error al entregar el pedido');
        }
    };
    // Función para cancelar entrega
    const handleCancelarEntrega = async () => {
        if (!pedido) return;

        try {
            setLoading(true);

            // Si hay un movimiento asociado, anularlo primero
            if (pedido.movimiento_id) {
                const anularResponse = await movimientosAlmacenService.anular(pedido.movimiento_id);

                if (!anularResponse.success) {
                    mostrarNotificacion('error', 'Error al anular el movimiento: ' + anularResponse.message);
                    return;
                }
            }

            // Cambiar estado del pedido a Pendiente
            const response = await pedidosAlmacenService.updateEstado(pedido.id, 'Pendiente');

            if (response.success) {
                mostrarNotificacion('success', 'Entrega cancelada correctamente');

                // Actualizar el pedido local
                const pedidoActualizado = {
                    ...pedido,
                    estado: 'Pendiente',
                    movimiento_id: null
                };

                if (onPedidoActualizado) {
                    onPedidoActualizado(pedidoActualizado);
                }

                // Cerrar modal y regresar a PanelPedidos
                setIsOpen(false);
            } else {
                mostrarNotificacion('error', response.message || 'Error al cancelar entrega');
            }
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
                tipo: 'entrada',
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

        // Preparar los productos del pedido para la canasta de salidas
        const productosParaSalidas = pedido.pedido_almacen_detalle?.map(detalle => ({
            id: detalle.producto_almacen.id,
            name: detalle.producto_almacen.name,
            description: detalle.producto_almacen.description,
            cantidad: detalle.cantidad,
            precio: detalle.precio || 0,
            // No incluir stock aquí, se actualizará en AlmacenGeneral.jsx
            type_measure: detalle.producto_almacen.type_measure
        })) || [];

        // Guardar los productos del pedido en canastaSalidas
        localStorage.setItem('canastaSalidas', JSON.stringify(productosParaSalidas));
        localStorage.setItem('pedidoIdEntregando', pedido.id);
        localStorage.setItem('precioIdEntregando', pedido.precio_id || '');

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


    // Función para preparar datos de descarga
    // eslint-disable-next-line no-unused-vars
    const prepararDatosDescarga = () => {
        if (!pedido) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Obtener nombre de la sucursal (ya viene del backend)
        const nombreSucursal = pedido?.sucursal?.name || 'Sucursal no encontrada';

        // Información superior
        const informacionSuperior = {
            'Solicitante': pedido?.user?.name || pedido?.personal?.name || 'Usuario desconocido',
            'Sucursal': nombreSucursal,
            'Número de Pedido': `#${pedido.id.slice(-8)}`,
            'Fecha': new Date(pedido.fecha || pedido.created_at).toLocaleString(),
            'Estado': pedido.estado === 'Completado' ? 'Completado' : pedido.estado === 'Cancelado' ? 'Cancelado' : pedido.estado === 'En Proceso' ? 'En Proceso' : pedido.estado === 'Enviado' ? 'Enviado' : 'Pendiente'
        };

        // Para pedidos de acopio
        if (tipoPedido === 'acopio') {
            // Tabla para acopio (un solo producto)
            const tablaHeaders = ['Producto', 'Cantidad', 'Unidad de Medida'];
            const tablaValores = [[
                pedido?.producto_acopio?.name || 'Sin producto',
                pedido?.cantidad || '0',
                pedido?.tipo_medida || ''
            ]];

            return { informacionSuperior, tablaHeaders, tablaValores };
        }

        // Para pedidos de almacén
        if (tipoPedido === 'almacen') {
            if (pedido?.precio?.name) {
                informacionSuperior['Tipo de Precio'] = pedido.precio.name;
            }

            // Calcular total
            const total = (pedido?.pedido_almacen_detalle || []).reduce((sum, detalle) => {
                const precio = detalle.precio || 0;
                const cantidad = detalle.cantidad || 0;
                return sum + (precio * cantidad);
            }, 0);
            informacionSuperior['Total'] = `Bs. ${total.toFixed(2)}`;

            // Tabla para almacén (múltiples productos)
            const tablaHeaders = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
            const tablaValores = (pedido?.pedido_almacen_detalle || []).map(detalle => [
                detalle?.producto_almacen?.name || 'Sin producto',
                detalle?.cantidad || '0',
                `Bs. ${(detalle?.precio || 0).toFixed(2)}`,
                `Bs. ${((detalle?.precio || 0) * (detalle?.cantidad || 0)).toFixed(2)}`
            ]);

            return { informacionSuperior, tablaHeaders, tablaValores };
        }

        return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };
    };

    // Función para obtener los detalles del pedido
    const getDetallesPedido = () => {
        if (!pedido) return [];

        if (tipoPedido === 'acopio') {
            // Para acopio, el pedido es un solo producto
            return [{
                id: pedido.id,
                nombre: pedido.producto_acopio?.name || 'Producto no encontrado',
                cantidad: pedido.cantidad || 0,
                medida: pedido.tipo_medida || 'kg',
                precio: 0, // No hay precio en la nueva estructura
                subtotal: 0
            }];
        } else {
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
        }
    };

    if (!pedido) return null;
    const detalles = getDetallesPedido();



    const puedeEditarPedido = () => {
        if (!pedido || !sucursalActual) return false;
        return pedido.sucu_id === sucursalActual.id && pedido.estado !== 'Enviado' && pedido.estado !== 'Completado';
    };
    const puedeEntregarPedido = () => {
        if (!pedido || !sucursalActual) return false;
        return pedido.pedido_sucursal_id === sucursalActual.id && pedido.estado !== 'Enviado';
    };
    const puedeCancelarEntrega = () => {
        if (!pedido || !sucursalActual) return false;
        return pedido.pedido_sucursal_id === sucursalActual.id && pedido.estado === 'Enviado';
    };
    const puedeIngresarPedido = () => {
        if (!pedido || !sucursalActual) return false;
        return pedido.sucu_id === sucursalActual.id && pedido.estado === 'Enviado';
    };
    const puedeEliminarPedido = () => {
        if (!pedido || !sucursalActual) return false;
        return pedido.sucu_id === sucursalActual.id && pedido.estado !== 'Completado' && pedido.estado !== 'Enviado';
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
                    description2={tipoPedido !== 'acopio' ? `Tipo de precio: ${pedido.precio?.name || 'Precio desconocido'}` : ''}
                    flot6={pedido.estado === 'Completado' ? 'Completado' : pedido.estado === 'Cancelado' ? 'Cancelado' : pedido.estado === 'En Proceso' ? 'En Proceso' : pedido.estado === 'Enviado' ? 'Enviado' : 'Pendiente'}
                    circulo={false}
                    transparent={false}
                />
                {/* Botón para ver productos (solo para almacén) */}
                {tipoPedido !== 'acopio' && detalles.length > 0 && (

                    <Boton
                        className='btn-gray'
                        label={`Productos (${detalles.length})`}
                        onClick={() => setIsProductosOpen(true)}
                    />

                )}

                {tipoPedido === 'acopio' ? (

                    <ItemView
                        title={pedido.producto_acopio?.name || 'Producto no encontrado'}
                        description={`Cantidad: ${pedido.cantidad} ${pedido.tipo_medida}`}
                        icon='package'
                        transparent={false}
                    />

                ) : (
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
                            label='Ingresar Pedido'
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
                                    description={tipoPedido === 'acopio'
                                        ? `${producto.cantidad} ${producto.medida}`
                                        : `Bs. ${producto.precio.toFixed(2)}`
                                    }
                                    description2={tipoPedido === 'acopio'
                                        ? ''
                                        : `Subtotal: Bs. ${producto.subtotal.toFixed(2)}`
                                    }
                                    flot2={tipoPedido === 'acopio'
                                        ? ''
                                        : `${producto.cantidad} Und.`
                                    }
                                    icon='package'
                                />
                            ))}
                        </>
                    )}
                </div>
            </ViewModal>

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Pedido"
                subtitulo="Selecciona el formato que prefieras para descargar este pedido."
                nombreArchivo={`Pedido_${tipoPedido === 'acopio' ? 'Acopio' : 'Almacen'}_${new Date(pedido?.fecha || pedido?.created_at).toLocaleDateString().replace(/\//g, '-')}`}
                {...prepararDatosDescarga()}
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
