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
import Text from '../../common/Text';
import EntregaPedidoAcopio from './EntregaPedidoAcopio';
import MovimientoAcopio from '../almacen-acopio/MovimientoAcopio';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import gastosService from '../../../services/gastosService';
import productsAcopioService from '../../../services/productsAcopioService';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import { useLayout } from '../../../context/LayoutContext';

function VerPedidoAcopio({ isOpen, setIsOpen, pedido, onPedidoEliminado, onPedidoActualizado }) {
    const { user, sucursalSeleccionada: sucursalActual } = useUser();
    const { employee } = useEmployee();
    const { isLargeScreen } = useLayout();
    // Estados de loading individuales para cada botón
    const [loadingEliminar, setLoadingEliminar] = useState(false);
    const [loadingAnular, setLoadingAnular] = useState(false);
    const [loadingGastoCompra, setLoadingGastoCompra] = useState(false);
    const [loadingGastoOtros, setLoadingGastoOtros] = useState(false);
    const [loadingIngresar, setLoadingIngresar] = useState(false);
    const [loadingVerEntrada, setLoadingVerEntrada] = useState(false);
    
    // Estado global para deshabilitar todos los botones cuando alguno esté cargando
    const isAnyLoading = loadingEliminar || loadingAnular || loadingGastoCompra || loadingGastoOtros || loadingIngresar || loadingVerEntrada;
    
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAnularEntregaOpen, setIsAnularEntregaOpen] = useState(false);
    const [isEntregaAcopioOpen, setIsEntregaAcopioOpen] = useState(false);
    const [isGastoOpen, setIsGastoOpen] = useState(false);
    const [gasto, setGasto] = useState(null);
    const [isGastoOtros, setIsGastoOtros] = useState(false); // Flag para saber si es gasto_otros
    const [isEntregaOpen, setIsEntregaOpen] = useState(false);
    const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
    const [productoCompleto, setProductoCompleto] = useState(null);
    const [isVerEntradaOpen, setIsVerEntradaOpen] = useState(false);
    const [movimientoEntrada, setMovimientoEntrada] = useState(null);

    // Estado local para el pedido actual
    const [pedidoActual, setPedidoActual] = useState(pedido);

    // Actualizar el estado local cuando cambie el prop pedido
    useEffect(() => {
        setPedidoActual(pedido);
    }, [pedido]);


    // Función para eliminar pedido
    const handleEliminarPedido = async () => {
        if (!pedidoActual) return;

        try {
            setLoadingEliminar(true);
            const response = await pedidosAcopioService.eliminar(pedidoActual.id);

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
            setLoadingEliminar(false);
        }
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
        if (!pedidoActual) return [];

        // Para acopio, el pedido es un solo producto
        return [{
            id: pedidoActual.id,
            nombre: pedidoActual.producto_acopio?.name || 'Producto no encontrado',
            cantidad: pedidoActual.cantidad || 0,
            medida: pedidoActual.tipo_medida || 'kg',
            precio: 0, // No hay precio en la nueva estructura
            subtotal: 0
        }];
    };

    const puedeEliminarPedido = () => {
        if (!pedidoActual || !sucursalActual) return false;
        // Para pedidos de acopio en estado "Entregado", no se puede eliminar
        if (pedidoActual.estado === 'Entregado') return false;
        return pedidoActual.sucursal?.id === sucursalActual.id && pedidoActual.estado !== 'Completado';
    };

    const puedeEntregarPedidoAcopio = () => {
        if (!pedidoActual || !sucursalActual) return false;
        return pedidoActual.sucursal?.id === sucursalActual.id && pedidoActual.estado !== 'Completado' && pedidoActual.estado !== 'Entregado';
    };

    const puedeVerGasto = () => {
        if (!pedidoActual) return false;
        return (pedidoActual.estado === 'Entregado' || pedidoActual.estado === 'Completado') && pedidoActual.gasto_id;
    };

    const puedeVerGastoOtros = () => {
        if (!pedidoActual) return false;
        return (pedidoActual.estado === 'Entregado' || pedidoActual.estado === 'Completado') && pedidoActual.gasto_otros_id;
    };

    const puedeVerEntrega = () => {
        if (!pedidoActual) return false;
        return (pedidoActual.estado === 'Entregado' || pedidoActual.estado === 'Completado') && pedidoActual.fecha_entregado;
    };

    const puedeAnularEntregaAcopio = () => {
        if (!pedidoActual || !sucursalActual) return false;
        return pedidoActual.sucursal?.id === sucursalActual.id && pedidoActual.estado === 'Entregado';
    };

    const puedeIngresarPedidoAcopio = () => {
        if (!pedidoActual || !sucursalActual) return false;
        return pedidoActual.sucursal?.id === sucursalActual.id && pedidoActual.estado === 'Entregado';
    };

    const puedeVerEntrada = () => {
        if (!pedidoActual) return false;
        return pedidoActual.estado === 'Completado' && pedidoActual.movimiento_entrada_id;
    };

    // Función para manejar la entrega de pedido de materia prima
    const handleEntregarPedidoAcopio = () => {
        if (!pedidoActual) {
            mostrarNotificacion('error', 'Solo se pueden entregar pedidos de materia prima');
            return;
        }
        setIsEntregaAcopioOpen(true);
    };

    // Función para manejar cuando se realiza una entrega de materia prima
    const handleEntregaRealizada = (pedidoActualizado) => {
        console.log('Entrega realizada:', pedidoActualizado);

        // Cerrar inmediatamente el modal de entrega
        setIsEntregaAcopioOpen(false);

        // Notificar en el almacén (no en el modal)
        mostrarNotificacion('success', 'Entrega de materia prima realizada correctamente');

        // Actualizar solo la parte de entrega del pedido, manteniendo el resto
        const pedidoActualizadoParcial = {
            ...pedidoActual, // Mantener todos los datos originales
            estado: pedidoActualizado.estado, // Solo actualizar estado
            fecha_entregado: pedidoActualizado.fecha_entregado,
            entregado_por: pedidoActualizado.entregado_por,
            cantidad_entregada: pedidoActualizado.cantidad_entregada,
            cantidad_entregada_ud: pedidoActualizado.cantidad_entregada_ud,
            estado_entrega: pedidoActualizado.estado_entrega,
            observaciones_entrega: pedidoActualizado.observaciones_entrega,
            gasto_id: pedidoActualizado.gasto_id,
            gasto_otros_id: pedidoActualizado.gasto_otros_id || null
        };

        // Guardar datos de entrega en localStorage para WhatsApp
        const now = new Date();
        const entregaParaHistorial = {
            id: Date.now(),
            fecha: formatFechaLiteral(now, !isLargeScreen),
            hora: formatHoraSinSegundos(now),
            productos: [{
                nombre: pedidoActualizado.producto_acopio?.name || 'Producto desconocido',
                cantidad_ud: pedidoActualizado.cantidad_entregada_ud || 0,
                unidad_ud: pedidoActualizado.cantidad_entregada_medida || 'bolsa',
                estado_entrega: pedidoActualizado.estado_entrega || 'llego'
            }],
            observaciones: pedidoActualizado.observaciones_entrega || '',
            entregado_por: pedidoActualizado.entregado_por || 'Usuario desconocido',
            proveedor: pedidoActualizado.proveedor?.name || 'Proveedor no especificado',
            costo: pedidoActualizado.gasto?.valor || 0,
            metodo_pago: pedidoActualizado.gasto?.metodo_pago || 'No especificado'
        };

        // Guardar como última entrega
        localStorage.setItem('ultimaEntregaAcopio', JSON.stringify(entregaParaHistorial));

        // Agregar al historial
        const historialExistente = JSON.parse(localStorage.getItem('historialEntregasAcopio') || '[]');
        historialExistente.unshift(entregaParaHistorial); // Agregar al inicio
        localStorage.setItem('historialEntregasAcopio', JSON.stringify(historialExistente));

        // Actualizar el estado local del pedido
        setPedidoActual(pedidoActualizadoParcial);

        if (onPedidoActualizado) {
            onPedidoActualizado(pedidoActualizadoParcial);
        }
    };

    // Función para anular entrega de pedido de acopio
    const handleAnularEntregaAcopio = async () => {
        if (!pedidoActual) {
            mostrarNotificacion('error', 'Solo se pueden anular entregas de pedidos de materia prima');
            return;
        }

        try {
            setLoadingAnular(true);

            const response = await pedidosAcopioService.anularEntrega(pedidoActual.id);

            if (response.success) {
                mostrarNotificacion('success', 'Entrega anulada correctamente');
                setIsAnularEntregaOpen(false);

                // Actualizar el pedido local: solo cambiar estado a Pendiente y limpiar campos de entrega
                const pedidoActualizado = {
                    ...pedidoActual,
                    estado: 'Pendiente',
                    fecha_entregado: null,
                    entregado_por: null,
                    cantidad_entregada: null,
                    cantidad_entregada_ud: null,
                    estado_entrega: null,
                    observaciones_entrega: null,
                    gasto_id: null,
                    gasto_otros_id: null
                };

                // Actualizar el estado local del pedido
                setPedidoActual(pedidoActualizado);

                if (onPedidoActualizado) {
                    onPedidoActualizado(pedidoActualizado);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al anular la entrega');
            }
        } catch (error) {
            console.error('Error al anular entrega:', error);
            mostrarNotificacion('error', 'Error al anular la entrega');
        } finally {
            setLoadingAnular(false);
        }
    };

    // Función para ingresar pedido de acopio
    const handleIngresarPedidoAcopio = async () => {
        if (!pedidoActual || !pedidoActual.producto_acopio) {
            mostrarNotificacion('error', 'No se encontró información del producto');
            return;
        }

        try {
            setLoadingIngresar(true);
            // Obtener la información completa del producto
            const response = await productsAcopioService.getById(pedidoActual.producto_acopio.id);

            if (response.success) {
                setProductoCompleto(response.data);
                setIsMovimientoOpen(true);
            } else {
                mostrarNotificacion('error', response.message || 'Error al obtener información del producto');
            }
        } catch (error) {
            console.error('Error al obtener producto:', error);
            mostrarNotificacion('error', 'Error al obtener información del producto');
        } finally {
            setLoadingIngresar(false);
        }
    };

    // Función para manejar cuando se crea un movimiento de entrada
    const handleMovimientoCreated = async (movimiento, tieneReceta = false) => {
        try {
            // Actualizar el estado del pedido a "Completado" y registrar el movimiento_entrada_id
            const response = await pedidosAcopioService.updateEstado(pedidoActual.id, 'Completado', movimiento.id);

            if (response.success) {
                // Cerrar el modal de movimiento
                setIsMovimientoOpen(false);

                // Actualizar el pedido local
                const pedidoActualizado = {
                    ...pedidoActual,
                    estado: 'Completado',
                    movimiento_entrada_id: movimiento.id
                };

                // Actualizar el estado local del pedido
                setPedidoActual(pedidoActualizado);

                if (onPedidoActualizado) {
                    onPedidoActualizado(pedidoActualizado);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al actualizar el estado del pedido');
            }
        } catch (error) {
            console.error('Error al actualizar estado del pedido:', error);
            mostrarNotificacion('error', 'Error al actualizar el estado del pedido');
        }
    };

    // Función para abrir el modal del gasto
    const handleVerGasto = async () => {
        if (!pedidoActual || !pedidoActual.gasto_id) {
            mostrarNotificacion('error', 'No se encontró información del gasto');
            return;
        }

        try {
            setLoadingGastoCompra(true);
            // Obtener empresa_id de la sucursal seleccionada
            const empresaId = sucursalActual?.empresas?.id || null;
            const response = await gastosService.getById(pedidoActual.gasto_id, empresaId);

            if (response.success) {
                setGasto(response.data);
                setIsGastoOtros(false); // No es gasto_otros
                setIsGastoOpen(true);
            } else {
                mostrarNotificacion('error', response.message || 'Error al obtener información del gasto');
            }
        } catch (error) {
            console.error('Error al obtener gasto:', error);
            // Manejar errores de permisos (403)
            if (error.status === 403) {
                mostrarNotificacion('error', error.message || 'No tienes acceso al módulo de Gastos');
            } else {
                mostrarNotificacion('error', 'Error al obtener información del gasto');
            }
        } finally {
            setLoadingGastoCompra(false);
        }
    };

    // Función para abrir el modal del gasto de transporte/otros
    const handleVerGastoOtros = async () => {
        if (!pedidoActual || !pedidoActual.gasto_otros_id) {
            mostrarNotificacion('error', 'No se encontró información del gasto de transporte/otros');
            return;
        }

        try {
            setLoadingGastoOtros(true);
            // Obtener empresa_id de la sucursal seleccionada
            const empresaId = sucursalActual?.empresas?.id || null;
            const response = await gastosService.getById(pedidoActual.gasto_otros_id, empresaId);

            if (response.success) {
                setGasto(response.data);
                setIsGastoOtros(true); // Es gasto_otros
                setIsGastoOpen(true);
            } else {
                mostrarNotificacion('error', response.message || 'Error al obtener información del gasto');
            }
        } catch (error) {
            console.error('Error al obtener gasto:', error);
            // Manejar errores de permisos (403)
            if (error.status === 403) {
                mostrarNotificacion('error', error.message || 'No tienes acceso al módulo de Gastos');
            } else {
                mostrarNotificacion('error', 'Error al obtener información del gasto');
            }
        } finally {
            setLoadingGastoOtros(false);
        }
    };

    // Función para abrir el modal de entrega
    const handleVerEntrega = () => {
        if (!pedidoActual) {

            mostrarNotificacion('error', 'No se encontró información de la entrega');

            return;
        }
        setIsEntregaOpen(true);
    };

    // Función para ver la entrada del pedido
    const handleVerEntrada = async () => {
        if (!pedidoActual || !pedidoActual.movimiento_entrada_id) {
            mostrarNotificacion('error', 'No se encontró información de la entrada');
            return;
        }

        try {
            setLoadingVerEntrada(true);
            const response = await movimientosAcopioService.getById(pedidoActual.movimiento_entrada_id);

            if (response.success) {
                setMovimientoEntrada(response.data);
                setIsVerEntradaOpen(true);
            } else {
                mostrarNotificacion('error', response.message || 'Error al obtener información del movimiento');
            }
        } catch (error) {
            console.error('Error al obtener movimiento:', error);
            mostrarNotificacion('error', 'Error al obtener información del movimiento');
        } finally {
            setLoadingVerEntrada(false);
        }
    };

    // Función para mostrar historial de entregas
    const handleVerUltimasEntregas = () => {
        mostrarNotificacion('info', 'El producto no tiene historial de entregas');
    };

    // Efecto para limpiar el producto completo cuando se cierre el modal de movimiento
    useEffect(() => {
        if (!isMovimientoOpen) {
            setProductoCompleto(null);
        }
    }, [isMovimientoOpen]);

    // Efecto para limpiar el movimiento de entrada cuando se cierre el modal
    useEffect(() => {
        if (!isVerEntradaOpen) {
            setMovimientoEntrada(null);
        }
    }, [isVerEntradaOpen]);

    // Efecto para limpiar el flag de gasto_otros cuando se cierre el modal
    useEffect(() => {
        if (!isGastoOpen) {
            setIsGastoOtros(false);
            setGasto(null);
        }
    }, [isGastoOpen]);

    if (!pedidoActual) return null;
    const detalles = getDetallesPedido();

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
                <ItemView
                    title={pedidoActual.producto_acopio?.name || 'Producto no encontrado'}
                    description={`Cantidad solicitada: ${pedidoActual.cantidad} ${pedidoActual.tipo_medida}`}
                    icon='package'
                    transparent={false}
                />
                <div className={styles.content}>
                    <Dato
                        label="Fecha"
                        value={formatFechaLiteral(pedidoActual?.fecha || pedidoActual?.created_at, !isLargeScreen)}
                        vertical={false}
                    />
                    <Dato
                        label="Hora"
                        value={formatHoraSinSegundos(pedidoActual?.fecha || pedidoActual?.created_at)}
                        vertical={false}
                    />
                    <Dato
                        label="Estado"
                        value={pedidoActual.estado}
                        vertical={false}
                        especial={pedidoActual.estado === 'Pendiente' ? 'red' : pedidoActual.estado === 'Completado' ? 'blue' : pedidoActual.estado === 'Entregado' ? 'orange' : 'gray'}
                    />
                    <Dato
                        label="Cantidad solicitada"
                        value={`${pedidoActual.cantidad} ${pedidoActual.tipo_medida}`}
                        vertical={false}
                    />
                </div>
                <Boton
                    className='btn-gray'
                    label='Ultimas entregas'
                    onClick={handleVerUltimasEntregas}
                    disabled={isAnyLoading}
                />
                {/* Mostrar detalles de entrega si el pedido está entregado */}
                {(pedidoActual.estado === 'Entregado' || pedidoActual.estado === 'Completado') && (
                    <>
                        {puedeVerEntrega() && (
                            <Boton
                                className='btn-gray'
                                label='Ver Entrega'
                                onClick={handleVerEntrega}
                                disabled={isAnyLoading}
                            />
                        )}
                        {puedeVerGasto() && (
                            <Boton
                                className='btn-gray'
                                label='Ver Gasto Compra'
                                onClick={handleVerGasto}
                                loading={loadingGastoCompra}
                                disabled={isAnyLoading}
                            />
                        )}
                        {puedeVerGastoOtros() && (
                            <Boton
                                className='btn-gray'
                                label='Ver Gasto Transporte/Otros'
                                onClick={handleVerGastoOtros}
                                loading={loadingGastoOtros}
                                disabled={isAnyLoading}
                            />
                        )}
                    </>
                )}
                {pedidoActual.estado === 'Completado' && (
                    <>
                        {puedeVerEntrada() && (
                            <Boton
                                className='btn-gray'
                                label='Ver Entrada'
                                onClick={handleVerEntrada}
                                loading={loadingVerEntrada}
                                disabled={isAnyLoading}
                            />
                        )}
                    </>
                )}
                <div className={styles.buttons}>
                    {puedeEliminarPedido() && (
                        <Boton
                            className='btn-red'
                            label='Eliminar Pedido'
                            onClick={() => setIsEliminarOpen(true)}
                            disabled={isAnyLoading}
                        />
                    )}
                    {puedeEntregarPedidoAcopio() && (
                        <Boton
                            className='btn-default'
                            label='Entregar Pedido'
                            onClick={handleEntregarPedidoAcopio}
                            disabled={isAnyLoading}
                        />
                    )}
                    {puedeAnularEntregaAcopio() && (
                        <Boton
                            className='btn-orange'
                            label='Anular Entrega'
                            onClick={() => setIsAnularEntregaOpen(true)}
                            loading={loadingAnular}
                            disabled={isAnyLoading}
                        />
                    )}
                    {puedeIngresarPedidoAcopio() && (
                        <Boton
                            className='btn-green'
                            label='Ingresar'
                            onClick={handleIngresarPedidoAcopio}
                            loading={loadingIngresar}
                            disabled={isAnyLoading}
                        />
                    )}
                </div>
            </div>

            {/* Modal de descarga */}
            <DescargaPedidoBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                pedidoId={pedidoActual?.id}
                pedidoData={pedidoActual}
                tipo="acopio"
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
                            loading={loadingEliminar}
                            segundosDisabled={5}
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

            {/* Modal de anular entrega */}
            <ViewModal isOpen={isAnularEntregaOpen} setIsOpen={setIsAnularEntregaOpen}>
                <HeaderModal
                    title="Anular Entrega"
                    onClose={() => setIsAnularEntregaOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas anular la entrega de este pedido? Esta acción no se puede deshacer.
                    </p>
                    <div style={{ marginTop: '10px',  width: '100%' }}>
                        <Text type="warning" align="left">
                            Al anular se eliminará el gasto del costo del producto y del transporte si hubiera.
                        </Text>
                    </div>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-orange'
                            label='Sí, Anular'
                            style={{ marginTop: 'auto' }}
                            onClick={handleAnularEntregaAcopio}
                            loading={loadingAnular}
                            segundosDisabled={5}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsAnularEntregaOpen(false)}
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

            {/* Modal de entrega para pedidos de materia prima */}
            <EntregaPedidoAcopio
                isOpen={isEntregaAcopioOpen}
                setIsOpen={setIsEntregaAcopioOpen}
                pedido={pedidoActual}
                onEntregaRealizada={handleEntregaRealizada}
            />

            {/* Modal de movimiento de entrada para ingresar pedido */}
            <MovimientoAcopio
                isOpen={isMovimientoOpen}
                setIsOpen={setIsMovimientoOpen}
                producto={productoCompleto}
                tipo="entrada"
                onMovimientoCreated={handleMovimientoCreated}
            />

            {/* Modal de gasto para pedidos entregados */}
            <ViewModal isOpen={isGastoOpen} setIsOpen={setIsGastoOpen}>
                <HeaderModal
                    title="Detalles del Gasto"
                    onClose={() => setIsGastoOpen(false)}
                />
                <div className={styles.modalContent}>
                    {gasto && (
                        <>
                            <p className={styles.subTitle}>INFORMACIÓN DEL GASTO</p>
                            <Dato
                                label="Concepto"
                                value={gasto.concepto || 'Sin concepto'}
                            />
                            <Dato
                                label="Monto"
                                value={`Bs. ${(gasto.valor || 0).toFixed(2)}`}
                                especial='green'
                            />
                            <Dato
                                label="Método de Pago"
                                value={gasto.metodo_pago || 'No especificado'}
                            />
                            <Dato
                                label="Proveedor"
                                value={gasto.proveedor?.name || 'No especificado'}
                            />
                            <Dato
                                label="Fecha"
                                value={gasto.fecha_gasto ? formatFechaLiteral(gasto.fecha_gasto, !isLargeScreen) : 'No especificada'}
                            />
                            {gasto.observaciones && (
                                <Dato
                                    label="Observaciones"
                                    value={gasto.observaciones}
                                />
                            )}
                        </>
                    )}
                </div>
            </ViewModal>

            {/* Modal de entrega para pedidos entregados */}
            <ViewModal isOpen={isEntregaOpen} setIsOpen={setIsEntregaOpen}>
                <HeaderModal
                    title="Detalles de la Entrega"
                    onClose={() => setIsEntregaOpen(false)}
                />
                <div className={styles.modalContent}>
                    {pedidoActual && (
                        <>
                            <p className={styles.subTitle}>INFORMACIÓN DE LA ENTREGA</p>
                            <Dato
                                label="Producto Entregado"
                                value={pedidoActual.producto_acopio?.name || 'Producto no encontrado'}
                            />
                            <Dato
                                label="Cantidad Entregada"
                                value={`${pedidoActual.cantidad_entregada || 0} kg`}
                            />
                            <Dato
                                label="Cantidad en Unidades"
                                value={`${pedidoActual.cantidad_entregada_ud || 0} ${pedidoActual.cantidad_entregada_medida || 'bolsa'}`}
                            />
                            <Dato
                                label="Estado de Entrega"
                                value={pedidoActual.estado_entrega === 'llego' ? 'Llegó' : 'No llegó'}
                            />
                            <Dato
                                label="Entregado por"
                                value={pedidoActual.entregado_por || 'No especificado'}
                            />
                            <Dato
                                label="Fecha de Entrega"
                                value={pedidoActual.fecha_entregado ? formatFechaLiteral(pedidoActual.fecha_entregado, !isLargeScreen) : 'No especificada'}
                            />
                            {pedidoActual.observaciones_entrega && (
                                <Dato
                                    label="Observaciones de Entrega"
                                    value={pedidoActual.observaciones_entrega}
                                />
                            )}
                        </>
                    )}
                </div>
            </ViewModal>

            {/* Modal de movimiento de entrada */}
            <ViewModal isOpen={isVerEntradaOpen} setIsOpen={setIsVerEntradaOpen}>
                <HeaderModal
                    title="Detalles del Ingreso"
                    onClose={() => setIsVerEntradaOpen(false)}
                />
                <div className={styles.modalContent}>
                    {movimientoEntrada && (
                        <>
                            <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                            <Dato
                                label="Tipo"
                                value={movimientoEntrada.type === 'entrada' ? 'Entrada' : 'Salida'}
                            />
                            <Dato
                                label="Producto"
                                value={movimientoEntrada.product?.name || 'Producto no encontrado'}
                            />
                            <Dato
                                label="Cantidad"
                                value={`${parseFloat(movimientoEntrada.quantity || 0).toFixed(2)} ${movimientoEntrada.product?.type_measure?.code || ''}`}
                            />
                            <Dato
                                label="Fecha y Hora"
                                value={movimientoEntrada.date ? `${formatFechaLiteral(movimientoEntrada.date, !isLargeScreen)} ${formatHoraSinSegundos(movimientoEntrada.date)}` : 'No especificada'}
                            />
                            {movimientoEntrada.observations && (
                                <Dato
                                    label="Observaciones"
                                    value={movimientoEntrada.observations}
                                />
                            )}
                            {movimientoEntrada.proveedor && (
                                <Dato
                                    label="Proveedor"
                                    value={movimientoEntrada.proveedor.name}
                                />
                            )}
                            {movimientoEntrada.costo && (
                                <Dato
                                    label="Costo"
                                    value={`Bs. ${parseFloat(movimientoEntrada.costo).toFixed(2)}`}
                                    especial='green'
                                />
                            )}
                            {movimientoEntrada.metodo_pago && (
                                <Dato
                                    label="Método de Pago"
                                    value={movimientoEntrada.metodo_pago}
                                />
                            )}
                            {movimientoEntrada.gasto && (
                                <Dato
                                    label="Gasto Asociado"
                                    value={`ID: ${movimientoEntrada.gasto.id} - ${movimientoEntrada.gasto.concepto}`}
                                />
                            )}
                            <Dato
                                label="Estado"
                                value={movimientoEntrada.estado === 'anulado' ? 'Anulado' : 'Finalizado'}
                            />
                        </>
                    )}
                </div>
            </ViewModal>
        </View>
    );
}

export default VerPedidoAcopio;
