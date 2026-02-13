import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import ItemView from '../../common/ItemView';
import DescargaPedidoBuilder from './DescargaPedidoBuilder';
import AlmacenGeneral from '../almacen-general/AlmacenGeneral';
import { useUser } from '../../../context/UserContext';
import { useLayout } from '../../../context/LayoutContext';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import VerMovimiento from '../movimientos/VerMovimiento';
import { buildPedidoDetallesParaHistorial } from '../../../utils/logFormatters';
import useHistorialLogger from '../../ui/HistorialLogger';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/numberUtils';
import ResumenFinanciero from '../../ui/ResumenFinanciero';
import { useToast } from '../../../context/ToastContext';
import ModalProductos from './modales/ModalProductos';
import ModalEliminar from './modales/ModalEliminar';
import ModalCancelarEntrega from './modales/ModalCancelarEntrega';
import ModalIngresar from './modales/ModalIngresar';
import StatusBadge from '../../common/StatusBadge';

function VerPedido({ isOpen, setIsOpen, pedido, tipoPedido, onPedidoEliminado, onPedidoActualizado }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const { isLargeScreen } = useLayout();
    const { showSuccess, showDanger } = useToast();
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isCancelarEntregaOpen, setIsCancelarEntregaOpen] = useState(false);
    const [isIngresarPedidoOpen, setIsIngresarPedidoOpen] = useState(false);
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);
    const [modoAlmacen, setModoAlmacen] = useState('pedido'); // 'pedido' o 'entregar'
    const [isVerMovimientoOpen, setIsVerMovimientoOpen] = useState(false);
    const [movimientoSalida, setMovimientoSalida] = useState(null);
    const [loadingSalida, setLoadingSalida] = useState(false);

    // Estado local para el pedido actual
    const [pedidoActual, setPedidoActual] = useState(pedido);

    const { logAccion } = useHistorialLogger({
        modulo: 'Pedidos'
    });

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
    const handlePedidoActualizado = async (pedidoActualizado) => {
        // Actualizar el estado local del pedido
        setPedidoActual(pedidoActualizado);

        if (onPedidoActualizado) {
            onPedidoActualizado(pedidoActualizado);
        }

        // Registrar historial EDITAR (solo info, sin productos) cuando se edita el pedido
        if (modoAlmacen === 'pedido' && pedidoActual) {
            const det = buildPedidoDetallesParaHistorial(pedidoActual, pedidoActualizado, 'EDITAR');
            await logAccion({
                accion: 'EDITAR',
                lugarAfectado: `Pedido #${pedidoActualizado?.numero_pedido ?? pedidoActualizado?.id ?? pedidoActual?.id ?? ''}`,
                registroId: pedidoActualizado?.id || pedidoActual?.id || null,
                detallesPersonalizados: det
            });
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
            showDanger('Error', 'No hay movimiento de salida asociado a este pedido');
            return;
        }

        try {
            setLoadingSalida(true);

            const response = await movimientosAlmacenService.getById(pedidoActual.movimiento_salida_id);

            if (response.success) {
                setMovimientoSalida(response.data);
                setIsVerMovimientoOpen(true);
            } else {
                showDanger('Error', response.message || 'Error al obtener el movimiento de salida');
            }
        } catch (error) {
            console.error('Error obteniendo movimiento de salida:', error);
            showDanger('Error', 'Error al obtener el movimiento de salida');
        } finally {
            setLoadingSalida(false);
        }
    };

    // Función para ver el movimiento de entrada del pedido
    const handleVerEntrada = async () => {
        if (!pedidoActual?.movimiento_entrada_id) {
            showDanger('Error', 'No hay movimiento de entrada asociado a este pedido');
            return;
        }

        try {
            setLoadingSalida(true);

            const response = await movimientosAlmacenService.getById(pedidoActual.movimiento_entrada_id);

            if (response.success) {
                setMovimientoSalida(response.data);
                setIsVerMovimientoOpen(true);
            } else {
                showDanger('Error', response.message || 'Error al obtener el movimiento de entrada');
            }
        } catch (error) {
            console.error('Error obteniendo movimiento de entrada:', error);
            showDanger('Error', 'Error al obtener el movimiento de entrada');
        } finally {
            setLoadingSalida(false);
        }
    };
    // Función para editar pedido
    const handleEditarPedido = () => {
        if (!pedidoActual) {
            showDanger('Error', 'No hay pedido para editar');
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
        const pedidoAntes = pedidoActual ? JSON.parse(JSON.stringify(pedidoActual)) : null;
        // Actualizar el estado local del pedido
        if (pedidoActualizadoData) {
            setPedidoActual(pedidoActualizadoData);
        }

        // Actualizar el pedido en el componente padre
        if (onPedidoActualizado && pedidoActualizadoData) {
            onPedidoActualizado(pedidoActualizadoData);
        }

        if (pedidoActualizadoData) {
            // Fusionar pedidoAntes (con relaciones: cliente, sucursal, etc.) + datos actualizados del API
            const pedidoDespues = pedidoAntes ? { ...pedidoAntes, ...pedidoActualizadoData } : pedidoActualizadoData;
            const det = buildPedidoDetallesParaHistorial(pedidoAntes, pedidoDespues, 'ENTREGAR');
            await logAccion({
                accion: 'ENTREGAR',
                lugarAfectado: `Pedido #${pedidoActualizadoData?.numero_pedido ?? pedidoActualizadoData?.id ?? pedidoAntes?.id ?? ''}`,
                registroId: pedidoActualizadoData?.id || pedidoAntes?.id || null,
                detallesPersonalizados: det
            });
        }

        // NO cerrar AlmacenGeneral automáticamente para permitir que se muestre el modal de descarga
        // El almacén se cerrará cuando el usuario cierre el modal de descarga o cierre VerPedido

        // Mostrar notificación de éxito
        showSuccess('Éxito', 'Pedido entregado correctamente');
    };
    // Función para entregar pedido
    const handleEntregarPedido = () => {
        if (!pedidoActual || tipoPedido === 'acopio') {
            showDanger('Error', 'Solo se pueden entregar pedidos de almacén');
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

            // Calcular subtotal y redondear solo si el pedido es agrupado
            let subtotal = (detalle.precio || 0) * (detalle.cantidad || 0);
            if (pedidoActual.agrupado && producto.grup) {
                subtotal = Math.round(subtotal);
            }

            return {
                id: detalle.id,
                nombre: producto.name || 'Producto no encontrado',
                cantidad: cantidadVisual,
                medida: medidaVisual,
                precio: detalle.precio || 0,
                subtotal: subtotal // El subtotal siempre usa la cantidad real para el cálculo
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
                    // Precio unitario multiplicado por la cantidad de agrupación (redondeado)
                    const precioUnitarioAgrupado = Math.round(precio * grup);
                    precioTexto = formatCurrency(precioUnitarioAgrupado);
                } else {
                    cantidadTexto = `${cantidad} ud`;
                    precioTexto = formatCurrency(precio);
                }

                // Calcular subtotal y redondear solo si el pedido es agrupado
                let subtotal = precio * cantidad;
                if (esAgrupado) {
                    subtotal = Math.round(subtotal);
                }

                return [
                    producto.name || 'Sin nombre',
                    cantidadTexto,
                    precioTexto,
                    formatCurrency(subtotal)
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
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{pedidoActual?.codigo || 'Detalles'}<StatusBadge estado={pedidoActual?.estado} /></h1>
                        <p className={styles.subTitle}> Registrado el {formatFechaLiteral(pedidoActual?.fecha || pedidoActual?.created_at, !isLargeScreen) + ' - ' + formatHoraSinSegundos(pedidoActual?.fecha || pedidoActual?.created_at)}</p>
                    </div>
                    <div className={styles.iconButton}>
                        <Boton
                            iconName='download'
                            label='Descargar'
                            className='btn-default'
                            onClick={() => setIsDescargaOpen(true)}
                            hideTextOnMobile={true}
                        />
                    </div>
                </div>
                <div className={styles.contentRow}>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Detalles del Solicitante"
                                transparent={true}
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                icon="credit-card"
                            />
                            <Dato
                                label="Solicitante"
                                value={pedidoActual.user?.name || pedidoActual.personal?.name || 'Usuario desconocido'}
                                vertical={false}
                            />
                            <Dato
                                label="Sucursal"
                                value={pedidoActual.sucursal?.name || 'Sucursal desconocida'}
                                vertical={false}
                            />
                            <Dato
                                label="Cliente"
                                value={pedidoActual.cliente?.name || 'Sin cliente'}
                                vertical={false}
                            />
                        </div>
                        {/* Botón para ver productos */}
                        {detalles.length > 0 && (
                            <Boton
                                className='btn-gray'
                                label={`Lista de Productos`}
                                onClick={() => setIsProductosOpen(true)}
                            />
                        )}
                    </div>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Detalles de la Transacción"
                                transparent={true}
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                icon="credit-card"
                            />
                            <Dato
                                label="Número de Pedido"
                                value={'#' + pedidoActual.numero_pedido || 'Sin número de pedido'}
                                vertical={false}
                            />
                            <Dato
                                label="Modalidad"
                                value={pedidoActual.agrupado ? 'Agrupado' : 'Unidades'}
                                vertical={false}
                            />
                            <Dato
                                label="Tipo de Precio"
                                value={pedidoActual.precio?.name || 'Precio desconocido'}
                                vertical={false}
                            />
                        </div>
                        {/* Botones para ver movimientos del pedido */}
                        {/* Mostrar botón de salida si la sucursal actual es la que hizo la salida (sucursal_destino_id) */}
                        {pedidoActual?.movimiento_salida_id && pedidoActual.sucursal_destino_id === sucursalActual?.id && (
                            <Boton
                                className='btn-gray'
                                label='Registro de Salida'
                                onClick={handleVerSalida}
                                loading={loadingSalida}
                            />
                        )}

                        {/* Mostrar botón de entrada si la sucursal actual es la que hizo la entrada (sucursal_id) */}
                        {pedidoActual?.movimiento_entrada_id && pedidoActual.sucursal_id === sucursalActual?.id && (
                            <Boton
                                className='btn-gray'
                                label='Registro de Entrada'
                                onClick={handleVerEntrada}
                                loading={loadingSalida}
                            />
                        )}
                        {pedidoActual?.movimiento_entrada_id===null && pedidoActual.movimiento_salida_id===null && (
                        <Boton
                            className='btn-gray'
                            label='Registro'
                            onClick={() => {}}
                            loading={false}
                            disabled={true}
                        />
                        )}
                    </div>
                </div>
                {pedidoActual.observaciones && (
                    <>
                        <div className={styles.content}>
                            <Dato
                                label="Observaciones"
                                value={pedidoActual.observaciones || 'Sin observaciones'}
                            />
                        </div>
                    </>
                )}

                {/* Resumen Financiero */}
                {pedidoActual?.pedido_almacen_detalle && pedidoActual.pedido_almacen_detalle.length > 0 && (() => {
                    const subtotal = (pedidoActual.pedido_almacen_detalle || []).reduce((total, detalle) => {
                        const precio = detalle.precio || 0;
                        const cantidad = detalle.cantidad || 0;
                        let subtotalProducto = precio * cantidad;
                        // Redondear subtotal solo si el pedido es agrupado
                        if (pedidoActual.agrupado && detalle.producto_almacen?.grup) {
                            subtotalProducto = Math.round(subtotalProducto);
                        }
                        return total + subtotalProducto;
                    }, 0);

                    const resumen = {
                        subtotalFormatted: formatCurrency(subtotal),
                        descuento: { tieneDescuento: false },
                        aumento: { tieneAumento: false },
                        totalFormatted: formatCurrency(subtotal)
                    };

                    return <ResumenFinanciero resumen={resumen} />;
                })()}
                <div className={styles.buttons}>
                    {puedeEliminarPedido() && (
                        <Boton
                            className='btn-red'
                            label='Eliminar Pedido'
                            onClick={() => setIsEliminarOpen(true)}
                            disabled={loadingSalida}
                            iconName='trash'
                            hideTextOnMobile={true}
                        />
                    )}
                    {puedeEditarPedido() && (
                        <Boton
                            className='btn-default'
                            label='Editar Pedido'
                            onClick={handleEditarPedido}
                            disabled={loadingSalida}
                            iconName='edit'
                            hideTextOnMobile={true}
                        />
                    )}
                    {puedeEntregarPedido() && (
                        <Boton
                            className='btn-default'
                            label='Entregar Pedido'
                            onClick={handleEntregarPedido}
                            disabled={loadingSalida}
                            iconName='box'
                            hideTextOnMobile={true}
                        />
                    )}
                    {puedeCancelarEntrega() && (
                        <Boton
                            className='btn-orange'
                            label='Cancelar Entrega'
                            onClick={() => setIsCancelarEntregaOpen(true)}
                            disabled={loadingSalida}
                            iconName='block'
                            hideTextOnMobile={true}
                        />
                    )}
                    {puedeIngresarPedido() && (
                        <Boton
                            className='btn-green'
                            label={sucursalActual?.almacen_sucursal_id ? 'Finalizar Pedido' : 'Ingresar Pedido'}
                            onClick={() => setIsIngresarPedidoOpen(true)}
                            disabled={loadingSalida}
                            iconName='check-circle'
                            hideTextOnMobile={true}
                        />
                    )}
                </div>
            </div>

            {/* Modal de productos */}
            <ModalProductos
                isOpen={isProductosOpen}
                setIsOpen={setIsProductosOpen}
                pedidoActual={pedidoActual}
                detalles={detalles}
                rowsMemo={rowsMemo}
                isLargeScreen={isLargeScreen}
            />

            {/* Modal de descarga */}
            <DescargaPedidoBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                pedidoId={pedidoActual?.id}
                pedidoData={pedidoActual}
                tipo="almacen"
                nombreArchivoDefault={localStorage.getItem('nombreArchivoPedidos') || `Pedido_Almacen_${formatFechaLiteral(Date.now()).replace(/\s+/g, '_')}`}
                tituloDocumentoDefault={localStorage.getItem('tituloDocumentoPedidos') || `Pedido de Almacén Nº ${pedidoActual?.numero_pedido || ''}`}
                esPedido={true}
            />

            {/* Modal de eliminar pedido */}
            <ModalEliminar
                isOpen={isEliminarOpen}
                setIsOpen={setIsEliminarOpen}
                pedidoActual={pedidoActual}
                onPedidoEliminado={onPedidoEliminado}
            />

            {/* Modal de cancelar entrega */}
            <ModalCancelarEntrega
                isOpen={isCancelarEntregaOpen}
                setIsOpen={setIsCancelarEntregaOpen}
                pedidoActual={pedidoActual}
                setPedidoActual={setPedidoActual}
                onPedidoActualizado={onPedidoActualizado}
            />

            {/* Modal de ingresar pedido */}
            <ModalIngresar
                isOpen={isIngresarPedidoOpen}
                setIsOpen={setIsIngresarPedidoOpen}
                pedidoActual={pedidoActual}
                setPedidoActual={setPedidoActual}
                onPedidoActualizado={onPedidoActualizado}
                setIsOpenVerPedido={setIsOpen}
                sucursalActual={sucursalActual}
                detalles={detalles}
                setIsProductosOpen={setIsProductosOpen}
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