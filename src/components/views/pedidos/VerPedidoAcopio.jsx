import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/old/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/botones/Boton';
import ItemView from '../../common/old/ItemView';
import DescargaPedidoBuilder from './DescargaPedidoBuilder';
import EntregaPedidoAcopio from './EntregaPedidoAcopio';
import MovimientoAcopio from '../almacen-acopio/MovimientoAcopio';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import productsAcopioService from '../../../services/productsAcopioService';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import { useLayout } from '../../../context/LayoutContext';
import { useToast } from '../../../context/ToastContext';
import useHistorialLogger from '../../ui/HistorialLogger';
import { buildPedidoAcopioDetallesParaHistorial } from '../../../utils/logFormatters';
import EliminarPedidoAcopio from './modales/EliminarPedidoAcopio';
import AnularEntregaAcopio from './modales/AnularEntregaAcopio';
import VerGastoAcopio from './modales/VerGastoAcopio';
import VerEntregaAcopio from './modales/VerEntregaAcopio';
import VerEntradaAcopio from './modales/VerEntradaAcopio';
import StatusBadge from '../../common/old/StatusBadge';

function VerPedidoAcopio({ isOpen, setIsOpen, pedido, onPedidoEliminado, onPedidoActualizado }) {
    const { user, sucursalSeleccionada: sucursalActual } = useUser();
    const { employee } = useEmployee();
    const { isLargeScreen } = useLayout();
    const { showSuccess, showDanger, showInfo } = useToast();
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAnularEntregaOpen, setIsAnularEntregaOpen] = useState(false);
    const [isEntregaAcopioOpen, setIsEntregaAcopioOpen] = useState(false);
    const [isGastoOpen, setIsGastoOpen] = useState(false);
    const [gastoId, setGastoId] = useState(null);
    const [isEntregaOpen, setIsEntregaOpen] = useState(false);
    const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
    const [productoCompleto, setProductoCompleto] = useState(null);
    const [isVerEntradaOpen, setIsVerEntradaOpen] = useState(false);

    // Estado local para el pedido actual
    const [pedidoActual, setPedidoActual] = useState(pedido);
    const { logAccion } = useHistorialLogger({ modulo: 'Pedidos Acopio' });

    // Actualizar el estado local cuando cambie el prop pedido
    useEffect(() => {
        setPedidoActual(pedido);
    }, [pedido]);




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

    const puedeAnularEntregaAcopio = () => {
        if (!pedidoActual || !sucursalActual) return false;
        return pedidoActual.sucursal?.id === sucursalActual.id && pedidoActual.estado === 'Entregado';
    };

    const puedeIngresarPedidoAcopio = () => {
        if (!pedidoActual || !sucursalActual) return false;
        return pedidoActual.sucursal?.id === sucursalActual.id && pedidoActual.estado === 'Entregado';
    };

    // Función para manejar cuando se realiza una entrega de materia prima
    const handleEntregaRealizada = async (pedidoActualizado) => {
        // Cerrar inmediatamente el modal de entrega
        setIsEntregaAcopioOpen(false);

        // Registrar historial ENTREGAR (con producto)
        const pedidoDespues = { ...pedidoActual, ...pedidoActualizado };
        const det = buildPedidoAcopioDetallesParaHistorial(pedidoActual, pedidoDespues, 'ENTREGAR');
        await logAccion({
            accion: 'ENTREGAR',
            lugarAfectado: `Pedido #${pedidoDespues?.codigo ?? pedidoDespues?.numero_pedido ?? pedidoDespues?.id ?? pedidoActual?.id ?? ''}`,
            registroId: pedidoDespues?.id || pedidoActual?.id || null,
            detallesPersonalizados: det
        });

        // Notificar en el almacén (no en el modal)
        showSuccess('Éxito', 'Entrega de materia prima realizada correctamente');

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
                showDanger('Error', response.message || 'Error al actualizar el estado del pedido');
            }
        } catch (error) {
            console.error('Error al actualizar estado del pedido:', error);
            showDanger('Error', 'Error al actualizar el estado del pedido');
        }
    };


    // Efecto para limpiar el producto completo cuando se cierre el modal de movimiento
    useEffect(() => {
        if (!isMovimientoOpen) {
            setProductoCompleto(null);
        }
    }, [isMovimientoOpen]);

    // Efecto para limpiar el gastoId cuando se cierre el modal
    useEffect(() => {
        if (!isGastoOpen) {
            setGastoId(null);
        }
    }, [isGastoOpen]);

    if (!pedidoActual) return null;
    const detalles = getDetallesPedido();

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
                                title="Información del Producto"
                                transparent={true}
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                icon="package"
                            />
                            <Dato
                                label="Producto"
                                value={pedidoActual.producto_acopio?.name || 'Producto no encontrado'}
                                vertical={false}
                            />
                            <Dato
                                label="Cantidad solicitada"
                                value={`${pedidoActual.cantidad} ${pedidoActual.tipo_medida}`}
                                vertical={false}
                            />
                            <Dato
                                label="Tipo de medida"
                                value={pedidoActual.tipo_medida || 'No especificado'}
                                vertical={false}
                            />
                        </div>
                    </div>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Información del Pedido"
                                transparent={true}
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                icon="list-check"
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
                    </div>
                </div>
                <Boton
                    className='btn-gray'
                    label='Historial de Entregas'
                    onClick={() => showInfo('Info', 'El producto no tiene historial de entregas')}
                />
                {/* Mostrar detalles de entrega si el pedido está entregado */}
                {(pedidoActual.estado === 'Entregado' || pedidoActual.estado === 'Completado') && (
                    <div className={styles.contentRow}>
                        <div className={styles.contentHalf}>
                            <Boton
                                className='btn-gray'
                                label='Registro de Entrega'
                                onClick={() => setIsEntregaOpen(true)}
                                disabled={pedidoActual.estado !== 'Entregado' && pedidoActual.estado !== 'Completado'}
                            />
                            <Boton
                                className='btn-gray'
                                label='Registro de Gasto'
                                onClick={() => {
                                    setGastoId(pedidoActual.gasto_id);
                                    setIsGastoOpen(true);
                                }}
                                disabled={pedidoActual.estado !== 'Entregado' && pedidoActual.estado !== 'Completado'}
                            />
                        </div>
                        <div className={styles.contentHalf}>
                            <Boton
                                className='btn-gray'
                                label='Registro de Gasto Transporte/Otros'
                                onClick={() => {
                                    setGastoId(pedidoActual.gasto_otros_id);
                                    setIsGastoOpen(true);
                                }}
                                disabled={pedidoActual.estado !== 'Entregado' && pedidoActual.estado !== 'Completado'}
                            />
                            <Boton
                                className='btn-gray'
                                label='Registro de Entrada'
                                onClick={() => setIsVerEntradaOpen(true)}
                                disabled={pedidoActual.estado !== 'Completado'}
                            />
                        </div>
                    </div>
                )}

                <div className={styles.buttons}>
                    {puedeEliminarPedido() && (
                        <Boton
                            className='btn-red'
                            label='Eliminar Pedido'
                            onClick={() => setIsEliminarOpen(true)}
                            iconName='trash'
                            hideTextOnMobile={true}
                        />
                    )}
                    {puedeEntregarPedidoAcopio() && (
                        <Boton
                            className='btn-default'
                            label='Entregar Pedido'
                            onClick={() => setIsEntregaAcopioOpen(true)}
                            iconName='box'
                            hideTextOnMobile={true}
                        />
                    )}
                    {puedeAnularEntregaAcopio() && (
                        <Boton
                            className='btn-orange'
                            label='Anular Entrega'
                            onClick={() => setIsAnularEntregaOpen(true)}
                            iconName='block'
                            hideTextOnMobile={true}
                        />
                    )}
                    {puedeIngresarPedidoAcopio() && (
                        <Boton
                            className='btn-green'
                            label='Ingresar'
                            onClick={async () => {
                                if (!pedidoActual?.producto_acopio?.id) {
                                    showDanger('Error', 'No se encontró información del producto');
                                    return;
                                }
                                try {
                                    const response = await productsAcopioService.getById(pedidoActual.producto_acopio.id);
                                    if (response.success) {
                                        setProductoCompleto(response.data);
                                        setIsMovimientoOpen(true);
                                    } else {
                                        showDanger('Error', response.message || 'Error al obtener información del producto');
                                    }
                                } catch (error) {
                                    console.error('Error al obtener producto:', error);
                                    showDanger('Error', 'Error al obtener información del producto');
                                }
                            }}
                            iconName='check-circle'
                            hideTextOnMobile={true}
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
            <EliminarPedidoAcopio
                isOpen={isEliminarOpen}
                setIsOpen={setIsEliminarOpen}
                pedidoActual={pedidoActual}
                onPedidoEliminado={onPedidoEliminado}
            />

            {/* Modal de anular entrega */}
            <AnularEntregaAcopio
                isOpen={isAnularEntregaOpen}
                setIsOpen={setIsAnularEntregaOpen}
                pedidoActual={pedidoActual}
                setPedidoActual={setPedidoActual}
                onPedidoActualizado={onPedidoActualizado}
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
            <VerGastoAcopio
                isOpen={isGastoOpen}
                setIsOpen={setIsGastoOpen}
                gastoId={gastoId}
            />

            {/* Modal de entrega para pedidos entregados */}
            <VerEntregaAcopio
                isOpen={isEntregaOpen}
                setIsOpen={setIsEntregaOpen}
                pedidoActual={pedidoActual}
            />

            {/* Modal de movimiento de entrada */}
            <VerEntradaAcopio
                isOpen={isVerEntradaOpen}
                setIsOpen={setIsVerEntradaOpen}
                movimientoEntradaId={pedidoActual?.movimiento_entrada_id}
            />
        </View>
    );
}

export default VerPedidoAcopio;