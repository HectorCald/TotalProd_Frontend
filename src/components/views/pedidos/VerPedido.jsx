import React, { useState, useEffect, useMemo } from 'react';
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
import { useLayout } from '../../../context/LayoutContext';
import ModalTable from '../../common/ModalTable';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import deudasService from '../../../services/deudasService';
import VerMovimiento from '../movimientos/VerMovimiento';

function VerPedido({ isOpen, setIsOpen, pedido, tipoPedido, onPedidoEliminado, onPedidoActualizado }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const { isLargeScreen } = useLayout();
    const [loading, setLoading] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);
    const [modoAlmacen, setModoAlmacen] = useState('pedido'); // 'pedido' o 'entregar'
    const [isVerMovimientoOpen, setIsVerMovimientoOpen] = useState(false);
    const [movimientoSalida, setMovimientoSalida] = useState(null);
    const [loadingSalida, setLoadingSalida] = useState(false);

    // Estado local para el pedido actual
    const [pedidoActual, setPedidoActual] = useState(pedido);

    // Actualizar el estado local cuando cambie el prop pedido
    useEffect(() => {
        setPedidoActual(pedido);
    }, [pedido]);

    // Efecto para sincronizar información cuando se cierra el almacén
    useEffect(() => {
        if (!isAlmacenOpen && modoAlmacen === 'entregar') {
            // Cuando se cierra el almacén después de una entrega, 
            // asegurar que la información esté sincronizada
            if (onPedidoActualizado && pedidoActual) {
                onPedidoActualizado(pedidoActual);
            }
        }
    }, [isAlmacenOpen, modoAlmacen, onPedidoActualizado, pedidoActual]);

    // Función para manejar cuando se actualiza un pedido
    const handlePedidoActualizado = (pedidoActualizado) => {
        // Actualizar el estado local del pedido
        setPedidoActual(pedidoActualizado);

        if (onPedidoActualizado) {
            onPedidoActualizado(pedidoActualizado);
        }

        // NO cerrar AlmacenGeneral automáticamente para entregas
        // Solo cerrar para ediciones de pedidos (modo 'pedido')
        if (modoAlmacen === 'pedido') {
            setIsAlmacenOpen(false);
        }
    };

    // Función para ver el movimiento de salida del pedido
    const handleVerSalida = async () => {
        if (!pedidoActual?.movimiento_salida_id) {
            mostrarNotificacion('error', 'No hay movimiento de salida asociado a este pedido');
            return;
        }

        try {
            setLoadingSalida(true);
            
            const response = await movimientosAlmacenService.getById(pedidoActual.movimiento_salida_id);
            
            if (response.success) {
                setMovimientoSalida(response.data);
                setIsVerMovimientoOpen(true);
            } else {
                mostrarNotificacion('error', response.message || 'Error al obtener el movimiento de salida');
            }
        } catch (error) {
            console.error('Error obteniendo movimiento de salida:', error);
            mostrarNotificacion('error', 'Error al obtener el movimiento de salida');
        } finally {
            setLoadingSalida(false);
        }
    };

    // Función para ver el movimiento de entrada del pedido
    const handleVerEntrada = async () => {
        if (!pedidoActual?.movimiento_entrada_id) {
            mostrarNotificacion('error', 'No hay movimiento de entrada asociado a este pedido');
            return;
        }

        try {
            setLoadingSalida(true);
            
            const response = await movimientosAlmacenService.getById(pedidoActual.movimiento_entrada_id);
            
            if (response.success) {
                setMovimientoSalida(response.data);
                setIsVerMovimientoOpen(true);
            } else {
                mostrarNotificacion('error', response.message || 'Error al obtener el movimiento de entrada');
            }
        } catch (error) {
            console.error('Error obteniendo movimiento de entrada:', error);
            mostrarNotificacion('error', 'Error al obtener el movimiento de entrada');
        } finally {
            setLoadingSalida(false);
        }
    };
    // Función para eliminar pedido
    const handleEliminarPedido = async () => {
        if (!pedidoActual) return;

        try {
            setLoading(true);
            const response = await pedidosAlmacenService.eliminar(pedidoActual.id);

            if (response.success) {
                mostrarNotificacion('success', 'Pedido eliminado correctamente');
                setIsEliminarOpen(false);

                // Llamar a la función para actualizar la lista en el padre
                if (onPedidoEliminado) {
                    onPedidoEliminado(pedidoActual.id);
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
        if (!pedidoActual) {
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
        localStorage.setItem('pedidoIdEditando', pedidoActual.id);
        localStorage.setItem('precioIdEditando', pedidoActual.precio_id || '');
        localStorage.setItem('pedidoAgrupadoEditando', pedidoActual.agrupado ? 'agrupado' : 'no_agrupado');

        // Guardar productos del pedido para cargar automáticamente (solo ID y cantidad)
        const productosPedido = pedidoActual.pedido_almacen_detalle?.map(detalle => {
            let cantidadParaGuardar = detalle.cantidad;

            // Si el pedido es agrupado, convertir la cantidad a grupos
            if (pedidoActual.agrupado && detalle.producto_almacen?.grup) {
                cantidadParaGuardar = Math.round(detalle.cantidad / detalle.producto_almacen.grup);
            }

            return {
                id: detalle.producto_almacen.id,
                cantidad: cantidadParaGuardar
            };
        }) || [];
        localStorage.setItem('productosPedidoEditando', JSON.stringify(productosPedido));

        // Guardar cliente si existe para preseleccionarlo en CanastaPedidos
        if (pedidoActual.cliente?.id) {
            localStorage.setItem('clienteIdEditando', pedidoActual.cliente.id);
            localStorage.setItem('clienteNameEditando', pedidoActual.cliente.name || '');
        } else {
            localStorage.removeItem('clienteIdEditando');
            localStorage.removeItem('clienteNameEditando');
        }

        // Abrir AlmacenGeneral en modo pedido
        setModoAlmacen('pedido');
        setIsAlmacenOpen(true);
    };
    // Función para manejar la entrega de pedido
    const handleEntregaConfirmada = async (productosActualizados, precioId, movimientoId, pedidoActualizadoData) => {
        // Actualizar el estado local del pedido
        if (pedidoActualizadoData) {
            setPedidoActual(pedidoActualizadoData);
        }

        // Actualizar el pedido en el componente padre
        if (onPedidoActualizado && pedidoActualizadoData) {
            onPedidoActualizado(pedidoActualizadoData);
        }

        // NO cerrar AlmacenGeneral automáticamente para permitir que se muestre el modal de descarga
        // El almacén se cerrará cuando el usuario cierre el modal de descarga o cierre VerPedido

        // Mostrar notificación de éxito
        mostrarNotificacion('success', 'Pedido entregado correctamente');
    };
    // Función para cancelar entrega
    const handleCancelarEntrega = async () => {
        if (!pedidoActual) return;

        try {
            setLoading(true);

            // Guardar los IDs antes de empezar
            const movimientoId = pedidoActual.movimiento_salida_id;
            const deudaId = pedidoActual.deuda_id;

            console.log('PASO 1: Anulando movimiento...');
            // 1) PRIMERO: Anular el movimiento (desde pedido)
            if (movimientoId) {
                const anularResponse = await movimientosAlmacenService.anular(movimientoId, true);
                if (!anularResponse.success) {
                    // Si el error es porque ya está anulado, continuar con el proceso
                    if (anularResponse.message && anularResponse.message.includes('anulado')) {
                        console.log('⚠️ Movimiento ya estaba anulado, continuando...');
                    } else {
                        mostrarNotificacion('error', 'Error al anular el movimiento: ' + anularResponse.message);
                        return;
                    }
                } else {
                    console.log('✅ Movimiento anulado correctamente');
                }
            }

            console.log('PASO 2: Limpiando campos del pedido...');
            // 2) SEGUNDO: Limpiar movimiento_salida_id y deuda_id del pedido (sin cambiar estado)
            const limpiarCamposResponse = await pedidosAlmacenService.updateEstado(pedidoActual.id, pedidoActual.estado, null, null);
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
                    // Si el error es porque ya no existe, continuar con el proceso
                    if (eliminarDeudaResponse.message && (eliminarDeudaResponse.message.includes('no encontrado') || eliminarDeudaResponse.message.includes('no existe'))) {
                        console.log('⚠️ Deuda ya estaba eliminada, continuando...');
                    } else {
                        mostrarNotificacion('error', 'Error al eliminar la deuda: ' + eliminarDeudaResponse.message);
                        return;
                    }
                } else {
                    console.log('✅ Deuda eliminada correctamente');
                }
            }

            console.log('PASO 4: Eliminando movimiento...');
            // 4) CUARTO: Eliminar el movimiento
            if (movimientoId) {
                const eliminarMovimientoResponse = await movimientosAlmacenService.eliminar(movimientoId);
                if (!eliminarMovimientoResponse.success) {
                    // Si el error es porque ya no existe, continuar con el proceso
                    if (eliminarMovimientoResponse.message && (eliminarMovimientoResponse.message.includes('no encontrado') || eliminarMovimientoResponse.message.includes('no existe'))) {
                        console.log('⚠️ Movimiento ya estaba eliminado, continuando...');
                    } else {
                        mostrarNotificacion('error', 'Error al eliminar el movimiento: ' + eliminarMovimientoResponse.message);
                        return;
                    }
                } else {
                    console.log('✅ Movimiento eliminado correctamente');
                }
            }

            console.log('PASO 5: Cambiando estado del pedido a Pendiente...');
            // 5) QUINTO: Cambiar estado del pedido a Pendiente
            const cambiarEstadoResponse = await pedidosAlmacenService.updateEstado(pedidoActual.id, 'Pendiente');
            if (!cambiarEstadoResponse.success) {
                mostrarNotificacion('error', 'Error al cambiar estado del pedido: ' + cambiarEstadoResponse.message);
                return;
            }
            console.log('✅ Estado del pedido cambiado a Pendiente');

            mostrarNotificacion('success', 'Entrega cancelada correctamente');

            // Usar la respuesta actualizada del servidor que incluye total_pedidos actualizado
            const pedidoActualizado = cambiarEstadoResponse.data;

            // Actualizar el estado local del pedido
            setPedidoActual(pedidoActualizado);

            if (onPedidoActualizado) {
                onPedidoActualizado(pedidoActualizado);
            }

            // No cerrar VerPedido, solo actualizar el estado

        } catch (error) {
            console.error('Error al cancelar entrega:', error);
            mostrarNotificacion('error', 'Error al cancelar entrega');
        } finally {
            setLoading(false);
        }
    };
    // Función para ingresar pedido
    const handleIngresarPedido = async () => {
        if (!pedidoActual) return;

        try {
            setLoading(true);

            // Si la sucursal actual comparte almacén, solo finalizar sin crear movimiento
            const usaAlmacenCompartido = !!(sucursalActual && sucursalActual.almacen_sucursal_id);
            if (usaAlmacenCompartido) {
                const estadoResponse = await pedidosAlmacenService.updateEstado(pedidoActual.id, 'Completado');
                if (estadoResponse.success) {
                    mostrarNotificacion('success', 'Pedido finalizado correctamente');
                    // Usar la respuesta del servidor que incluye total_pedidos actualizado
                    const pedidoActualizado = estadoResponse.data;
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
            const productosParaIngreso = pedidoActual.pedido_almacen_detalle?.map(detalle => ({
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
                observaciones: `Ingreso automático del pedido Nº ${pedidoActual.numero_pedido || 'N/A'}`,
                productos: productosParaIngreso,
                precio_id: pedidoActual.precio_id
            };

            const movimientoResponse = await movimientosAlmacenService.create(movimientoData);

            if (movimientoResponse.success) {
                // Actualizar el estado del pedido a Completado y registrar el movimiento de entrada
                const estadoResponse = await pedidosAlmacenService.updateEstado(pedidoActual.id, 'Completado', undefined, undefined, movimientoResponse.data.id);

                if (estadoResponse.success) {
                    mostrarNotificacion('success', 'Pedido ingresado correctamente');

                    // Usar la respuesta del servidor que incluye total_pedidos actualizado
                    const pedidoActualizado = estadoResponse.data;

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
        if (!pedidoActual || tipoPedido === 'acopio') {
            mostrarNotificacion('error', 'Solo se pueden entregar pedidos de almacén');
            return;
        }

        // Limpiar completamente la canasta de salidas en localStorage
        localStorage.removeItem('canastaSalidas');
        localStorage.removeItem('pedidoIdEntregando');
        localStorage.removeItem('precioIdEntregando');
        localStorage.removeItem('pedidoDestinoSucursalId');
        localStorage.removeItem('pedidoDestinoSucursalName');
        localStorage.removeItem('clienteIdEntregando');
        localStorage.removeItem('clienteNameEntregando');

        // Guardar datos del pedido para entrega
        localStorage.setItem('pedidoIdEntregando', pedidoActual.id);
        localStorage.setItem('precioIdEntregando', pedidoActual.precio_id || '');
        localStorage.setItem('pedidoAgrupadoEntregando', pedidoActual.agrupado ? 'agrupado' : 'no_agrupado');
        localStorage.setItem('pedidoDestinoSucursalId', pedidoActual.sucursal_id || '');
        localStorage.setItem('pedidoDestinoSucursalName', pedidoActual.sucursal?.name || '');

        // Guardar información del cliente si existe
        if (pedidoActual.cliente?.id) {
            localStorage.setItem('clienteIdEntregando', pedidoActual.cliente.id);
            localStorage.setItem('clienteNameEntregando', pedidoActual.cliente.name || '');
        } else {
            localStorage.removeItem('clienteIdEntregando');
            localStorage.removeItem('clienteNameEntregando');
        }

        // Guardar productos del pedido para cargar automáticamente
        const productosPedido = pedidoActual.pedido_almacen_detalle?.map(detalle => {
            let cantidadParaGuardar = detalle.cantidad;

            // Si el pedido es agrupado, convertir la cantidad a grupos
            if (pedidoActual.agrupado && detalle.producto_almacen?.grup) {
                cantidadParaGuardar = Math.round(detalle.cantidad / detalle.producto_almacen.grup);
            }

            return {
                id: detalle.producto_almacen.id,
                cantidad: cantidadParaGuardar
            };
        }) || [];
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
        if (!pedidoActual || !pedidoActual.pedido_almacen_detalle) return [];

        // Para almacén, usar la estructura de detalles
        const detalles = pedidoActual.pedido_almacen_detalle || [];
        return detalles.map(detalle => {
            const producto = detalle.producto_almacen || {};

            // Si el pedido es agrupado, mostrar la cantidad visual (agrupada)
            // Si no es agrupado, mostrar la cantidad real (unidades)
            let cantidadVisual = detalle.cantidad || 0;
            let medidaVisual = detalle.medida || producto.type_measure?.code || 'u';

            if (pedidoActual.agrupado && producto.grup) {
                // Calcular cantidad agrupada: cantidad real / factor de agrupación
                const factorAgrupacion = producto.grup || 1;
                cantidadVisual = Math.round((detalle.cantidad || 0) / factorAgrupacion);
                medidaVisual = 'grp';
            }

            return {
                id: detalle.id,
                nombre: producto.name || 'Producto no encontrado',
                cantidad: cantidadVisual,
                medida: medidaVisual,
                precio: detalle.precio || 0,
                subtotal: (detalle.precio || 0) * (detalle.cantidad || 0) // El subtotal siempre usa la cantidad real para el cálculo
            };
        });
    };

    // Filas preparadas para ModalTable (para PC)
    const rowsMemo = useMemo(() => {
        if (!pedidoActual || !pedidoActual.pedido_almacen_detalle) return [];

        return pedidoActual.pedido_almacen_detalle
            .sort((a, b) => (a?.producto_almacen?.name || '').localeCompare(b?.producto_almacen?.name || '', 'es', { sensitivity: 'base' }))
            .map((detalle) => {
            const producto = detalle.producto_almacen || {};
            const cantidad = parseFloat(detalle.cantidad) || 0;
            const grup = parseFloat(producto.grup) || 0;
            const esAgrupado = pedidoActual?.agrupado && grup > 0;
            const precio = parseFloat(detalle.precio) || 0;

            let cantidadTexto;
            let precioTexto;

            if (esAgrupado) {
                const grupos = Math.floor(cantidad / grup);
                const unidades = cantidad % grup;
                cantidadTexto = unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                // Precio unitario multiplicado por la cantidad de agrupación
                precioTexto = `${(precio * grup).toFixed(2)} BOB`;
            } else {
                cantidadTexto = `${cantidad} ud`;
                precioTexto = `${precio.toFixed(2)} BOB`;
            }

            return [
                producto.name || 'Sin nombre',
                cantidadTexto,
                precioTexto,
                `${(precio * cantidad).toFixed(2)} BOB`
            ];
        });
    }, [pedidoActual]);

    if (!pedidoActual) return null;
    const detalles = getDetallesPedido();



    const puedeEditarPedido = () => {
        if (!pedidoActual || !sucursalActual) return false;
        return pedidoActual.sucursal_id === sucursalActual.id && pedidoActual.estado !== 'Entregado' && pedidoActual.estado !== 'Completado';
    };
    const puedeEntregarPedido = () => {
        if (!pedidoActual || !sucursalActual) return false;
        return pedidoActual.sucursal_destino_id === sucursalActual.id && pedidoActual.estado !== 'Entregado' && pedidoActual.estado !== 'Completado';
    };
    const puedeCancelarEntrega = () => {
        if (!pedidoActual || !sucursalActual) return false;
        return pedidoActual.sucursal_destino_id === sucursalActual.id && pedidoActual.estado === 'Entregado';
    };
    const puedeIngresarPedido = () => {
        if (!pedidoActual || !sucursalActual) return false;
        return pedidoActual.sucursal_id === sucursalActual.id && pedidoActual.estado === 'Entregado';
    };
    const puedeEliminarPedido = () => {
        if (!pedidoActual || !sucursalActual) return false;
        return pedidoActual.sucursal_id === sucursalActual.id && pedidoActual.estado !== 'Completado' && pedidoActual.estado !== 'Entregado';
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
                    title={pedidoActual.user?.name || pedidoActual.personal?.name || 'Usuario desconocido'}
                    description={pedidoActual.sucursal?.name || 'Sucursal desconocida'}
                    transparent={false}
                />

                <p className={styles.subTitle}>INFORMACIÓN DEL PEDIDO</p>
                {pedidoActual?.cliente?.name && (
                    <ItemView
                        title={pedidoActual.cliente.name}
                        description="Cliente"
                        transparent={false}
                    />
                )}
                <div className={styles.content}>
                    <Dato
                        label="Tipo de precio"
                        value={pedidoActual.precio?.name || 'Precio desconocido'}
                        vertical={false}
                    />
                    <Dato
                        label="Fecha y hora"
                        value={`${new Date(pedidoActual.fecha || pedidoActual.created_at).toLocaleString()}`}
                        vertical={false}
                    />
                    <Dato
                        label="Modalidad"
                        value={pedidoActual.agrupado ? 'Agrupado' : 'Unidades'}
                        vertical={false}
                    />
                    {pedidoActual.numero_pedido !== undefined && pedidoActual.numero_pedido !== null && (
                        <Dato
                            label="Número de Pedido"
                            value={`Nº ${pedidoActual.numero_pedido}`}
                            vertical={false}
                            especial="blue"
                        />
                    )}
                    <Dato
                        label="Estado"
                        value={pedidoActual.estado}
                        vertical={false}
                        especial={pedidoActual.estado === 'Pendiente' ? 'red' : pedidoActual.estado === 'Completado' ? 'blue' : pedidoActual.estado === 'Entregado' ? 'orange' : 'gray'}
                    />

                    {(pedidoActual.estado === 'Entregado' || pedidoActual.estado === 'Completado') && (
                        <Dato
                            label="Método de Pago"
                            value={pedidoActual.movimiento_salida?.metodo_pago || 'No especificado'}
                            vertical={false}
                        />
                    )}
                    <Dato
                        label="Total"
                        value={`Bs. ${(pedidoActual.pedido_almacen_detalle || []).reduce((total, detalle) => {
                            const precio = detalle.precio || 0;
                            const cantidad = detalle.cantidad || 0;
                            return total + (precio * cantidad);
                        }, 0).toFixed(2)}`}
                        especial='green'
                        vertical={false}
                    />
                </div>
                {/* Botón para ver productos */}
                {detalles.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label={`Productos (${detalles.length})`}
                        onClick={() => setIsProductosOpen(true)}
                    />
                )}

                {/* Botones para ver movimientos del pedido */}
                {/* Mostrar botón de salida si la sucursal actual es la que hizo la salida (sucursal_destino_id) */}
                {pedidoActual?.movimiento_salida_id && pedidoActual.sucursal_destino_id === sucursalActual?.id && (
                    <Boton
                        className='btn-gray'
                        label='Ver Registro de Salida'
                        onClick={handleVerSalida}
                        loading={loadingSalida}
                    />
                )}
                
                {/* Mostrar botón de entrada si la sucursal actual es la que hizo la entrada (sucursal_id) */}
                {pedidoActual?.movimiento_entrada_id && pedidoActual.sucursal_id === sucursalActual?.id && (
                    <Boton
                        className='btn-gray'
                        label='Ver Registro de Entrada'
                        onClick={handleVerEntrada}
                        loading={loadingSalida}
                    />
                )}
                {pedidoActual.observaciones && (
                    <>
                        <p className={styles.subTitle}>OBSERVACIONES</p>
                        <div className={styles.content}>
                            <Dato
                                label="Observaciones"
                                value={pedidoActual.observaciones || 'Sin observaciones'}
                            />
                        </div>
                    </>
                )}

                <div className={styles.buttons}>
                    {puedeEliminarPedido() && (
                        <Boton
                            className='btn-red'
                            label='Eliminar Pedido'
                            onClick={() => setIsEliminarOpen(true)}
                            disabled={loadingSalida}
                        />
                    )}
                    {puedeEditarPedido() && (
                        <Boton
                            className='btn-default'
                            label='Editar Pedido'
                            onClick={handleEditarPedido}
                            disabled={loadingSalida}
                        />
                    )}
                    {puedeEntregarPedido() && (
                        <Boton
                            className='btn-default'
                            label='Entregar Pedido'
                            onClick={handleEntregarPedido}
                            disabled={loadingSalida}
                        />
                    )}
                    {puedeCancelarEntrega() && (
                        <Boton
                            className='btn-orange'
                            label='Cancelar Entrega'
                            onClick={handleCancelarEntrega}
                            loading={loading}
                            disabled={loadingSalida}
                        />
                    )}
                    {puedeIngresarPedido() && (
                        <Boton
                            className='btn-green'
                            label={sucursalActual?.almacen_sucursal_id ? 'Finalizar Pedido' : 'Ingresar Pedido'}
                            onClick={handleIngresarPedido}
                            loading={loading}
                            disabled={loadingSalida}
                        />
                    )}
                </div>
            </div>

            {/* Modal de productos */}
            {isLargeScreen ? (
                <ModalTable
                    isOpen={isProductosOpen}
                    title="Productos del Pedido"
                    headers={['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']}
                    rows={rowsMemo}
                    onClose={() => setIsProductosOpen(false)}
                />
            ) : (
                <ViewModal isOpen={isProductosOpen} setIsOpen={setIsProductosOpen}>
                    <HeaderModal
                        title="Productos del Pedido"
                        onClose={() => setIsProductosOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        {detalles.length > 0 && (
                            <>
                                <p className={styles.subTitle}>PRODUCTOS INCLUIDOS</p>
                                {detalles
                                    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
                                    .map((producto, index) => {
                                        const detalle = pedidoActual.pedido_almacen_detalle.find(d => d.producto_almacen?.name === producto.nombre);
                                        const productoDetalle = detalle?.producto_almacen || {};
                                        const cantidad = parseFloat(detalle?.cantidad) || 0;
                                        const grup = parseFloat(productoDetalle.grup) || 0;
                                        const esAgrupado = pedidoActual?.agrupado && grup > 0;
                                        const precio = parseFloat(detalle?.precio) || 0;

                                        let cantidadTexto;
                                        let precioTexto;

                                        if (esAgrupado) {
                                            const grupos = Math.floor(cantidad / grup);
                                            const unidades = cantidad % grup;
                                            cantidadTexto = unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                                            // Precio unitario multiplicado por la cantidad de agrupación
                                            precioTexto = `Bs. ${(precio * grup).toFixed(2)}`;
                                        } else {
                                            cantidadTexto = `${cantidad} ud`;
                                            precioTexto = `Bs. ${precio.toFixed(2)}`;
                                        }

                                        return (
                                            <ItemView
                                                key={producto.id || index}
                                                title={producto.nombre}
                                                description={`Precio Unitario: ${precioTexto}`}
                                                flot2={cantidadTexto}
                                                icon='package'
                                                circulo={false}
                                            />
                                        );
                                    })}
                            </>
                        )}
                    </div>
                </ViewModal>
            )}

            {/* Modal de descarga */}
            <DescargaPedidoBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                pedidoId={pedidoActual?.id}
                pedidoData={pedidoActual}
                tipo="almacen"
                nombreArchivoDefault={localStorage.getItem('nombreArchivoPedidos') || `Pedido_Almacen_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}`}
                tituloDocumentoDefault={localStorage.getItem('tituloDocumentoPedidos') || `Pedido de Almacén Nº ${pedidoActual?.numero_pedido || ''}`}
                esPedido={true}
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
                pedidoIdEditando={modoAlmacen === 'pedido' ? pedidoActual?.id : null}
            />

            {/* Modal de VerMovimiento para mostrar el movimiento de salida o movimiento de entrada */}
            {movimientoSalida && (
                <VerMovimiento
                    isOpen={isVerMovimientoOpen}
                    setIsOpen={setIsVerMovimientoOpen}
                    movimiento={movimientoSalida}
                />
            )}
        </View>
    );
}

export default VerPedido;
