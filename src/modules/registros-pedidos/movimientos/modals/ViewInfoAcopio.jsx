import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import EliminarMovimiento from './EliminarMovimiento';
import AnularMovimiento from './AnularMovimiento';
import gastosService from '../../../../services/gastosService';
import { useToast } from '../../../../context/ToastContext';
import ViewInfoPago from '../../../finanzas/pagos/modals/ViewInfo';
import ViewInfoPedidoAcopio from '../../pedidos/modals/ViewInfoAcopio';
import pedidosAcopioService from '../../../../services/pedidosAcopioService';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import Mensaje from '../../../../components/common/outputs/Mensaje';

const ViewInfoAcopio = ({ isOpen, onClose, movimiento, onEdit, onEliminar, onAnular }) => {
    const { showDanger } = useToast();
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isPagoViewOpen, setIsPagoViewOpen] = useState(false);
    const [selectedPago, setSelectedPago] = useState(null);
    const [loadingPago, setLoadingPago] = useState(false);

    const [hideGastos, setHideGastos] = useState(false);

    const [isPedidoViewOpen, setIsPedidoViewOpen] = useState(false);
    const [selectedPedido, setSelectedPedido] = useState(null);
    const [loadingPedido, setLoadingPedido] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setHideGastos(false);
        }
    }, [isOpen, movimiento]);



    const handleVerPago = async () => {
        const pagoId = (movimiento.gastos && (Array.isArray(movimiento.gastos) ? movimiento.gastos[0]?.id : movimiento.gastos?.id));
        if (!pagoId) return;
        setLoadingPago(true);
        try {
            const res = await gastosService.getById(pagoId);
            if (res.success) {
                setSelectedPago(res.data);
                setIsPagoViewOpen(true);
            } else {
                showDanger(null, 'No se pudo obtener el pago: ' + (res.message || ''));
            }
        } catch (error) {
            showDanger(null, 'Error de conexión al obtener el pago');
        } finally {
            setLoadingPago(false);
        }
    };

    const handleVerPedido = async () => {
        const pedidoId = (movimiento.pedidos_entrada && (Array.isArray(movimiento.pedidos_entrada) ? movimiento.pedidos_entrada[0]?.id : movimiento.pedidos_entrada?.id));
        if (!pedidoId) return;
        setLoadingPedido(true);
        try {
            const res = await pedidosAcopioService.getById(pedidoId);
            if (res.success) {
                setSelectedPedido(res.data);
                setIsPedidoViewOpen(true);
            } else {
                showDanger(null, 'No se pudo obtener el pedido: ' + (res.message || ''));
            }
        } catch (error) {
            showDanger(null, 'Error de conexión al obtener el pedido');
        } finally {
            setLoadingPedido(false);
        }
    };

    const handleMovimientoEliminado = (id) => {
        onClose();
        if (onEliminar) onEliminar(id);
    };

    const handleMovimientoAnulado = (updatedMovimiento) => {
        if (onAnular) onAnular(updatedMovimiento);
    };

    const rawFechaStr = movimiento?.fecha || movimiento?.date || '';
    const fechaLiteral = useFechaLiteral(rawFechaStr, false, true) || (rawFechaStr ? new Date(rawFechaStr).toLocaleDateString() : '');

    if (!movimiento) return null;

    let clienteProveedorNombre = '';
    let esProveedor = false;
    if (movimiento.type === 'entrada') {
        clienteProveedorNombre = movimiento.proveedor?.name || '';
        esProveedor = true;
    } else {
        clienteProveedorNombre = movimiento.cliente?.name || '';
    }

    const observaciones = movimiento.observaciones || movimiento.observations || movimiento.detalle || '';
    const title = movimiento.product?.name || 'Sin producto';



    return (
        <>
        <ModalCentro
            isOpen={isOpen && !isEliminarOpen && !isAnularOpen && !isPagoViewOpen && !isPedidoViewOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                onClose();
                if (onEdit) onEdit(movimiento);
            }}
            hideFooter={true}
            width="450px"
            receipt={true}
        >
                <InfoCard
                    title={`${title}${movimiento.numero_orden ? ` (Nº ${movimiento.numero_orden})` : ''}`}
                    subtitle={fechaLiteral}
                    statusDot={movimiento.estado === 'anulado' ? 'error' : 'info'}
                    icon="transfer"
                    customBlock={
                        <>
                            <ColumnInfo 
                                items={[
                                    movimiento.codigo && { 
                                        icon: 'hash', 
                                        text: movimiento.codigo 
                                    },
                                    (movimiento.type === 'salida' && movimiento.metodo_pago) && { 
                                        icon: 'credit-card', 
                                        text: movimiento.metodo_pago.charAt(0).toUpperCase() + movimiento.metodo_pago.slice(1).toLowerCase() 
                                    },
                                    { 
                                        icon: 'transfer', 
                                        text: movimiento.type === 'entrada' ? 'Entrada' : movimiento.type === 'transferencia' ? 'Transferencia' : 'Salida' 
                                    },
                                    (movimiento.agrupado !== undefined && movimiento.agrupado !== null) && { 
                                        icon: movimiento.agrupado ? 'layer' : 'box', 
                                        text: movimiento.agrupado ? 'Grupos' : 'Unidades' 
                                    }
                                ].filter(Boolean)} 
                            />
                            <ColumnInfo 
                                title="Detalles"
                                items={[
                                    clienteProveedorNombre && { 
                                        clave: esProveedor ? 'Proveedor' : 'Cliente', 
                                        valor: clienteProveedorNombre 
                                    },
                                    movimiento.precio?.name && { 
                                        clave: 'Precio', 
                                        valor: movimiento.precio.name 
                                    },
                                    { 
                                        clave: 'Cantidad', 
                                        valor: `${movimiento.quantity || '0'} ${movimiento.product?.type_measure?.code || ''}` 
                                    },
                                    observaciones && { 
                                        clave: 'Observaciones', 
                                        valor: observaciones 
                                    }
                                ].filter(Boolean)} 
                            />
                        </>
                    }
                    actionButton={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                            {movimiento.movimiento_entrada_id && (
                                <Mensaje 
                                    type="info"
                                    message="Este movimiento está asociado al consumo de receta de una entrada de productos."
                                />
                            )}
                            <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                            {movimiento.gastos && (Array.isArray(movimiento.gastos) ? movimiento.gastos.length > 0 : Object.keys(movimiento.gastos).length > 0) && !hideGastos && (
                                <BotonIcon
                                    iconName="wallet"
                                    className="btn-primary"
                                    tooltip="Pago Registrado"
                                    loading={loadingPago}
                                    onClick={handleVerPago}
                                />
                            )}
                            {((movimiento.pedidos_entrada && (Array.isArray(movimiento.pedidos_entrada) ? movimiento.pedidos_entrada.length > 0 : Object.keys(movimiento.pedidos_entrada).length > 0)) || (movimiento.pedidos_salida && (Array.isArray(movimiento.pedidos_salida) ? movimiento.pedidos_salida.length > 0 : Object.keys(movimiento.pedidos_salida).length > 0))) && (
                                <BotonIcon
                                    iconName="package"
                                    className="btn-primary"
                                    tooltip="Pedido Asociado"
                                    loading={loadingPedido}
                                    onClick={handleVerPedido}
                                />
                            )}


                            {movimiento.estado !== 'anulado' && !movimiento.movimiento_entrada_id && (
                                <BotonIcon
                                    iconName="edit"
                                    className="btn-primary"
                                    tooltip="Editar Movimiento"
                                    onClick={() => {
                                        onClose();
                                        if (onEdit) onEdit(movimiento);
                                    }}
                                />
                            )}
                            {movimiento.estado !== 'anulado' && !movimiento.movimiento_entrada_id && (
                                <BotonIcon
                                    iconName="block"
                                    className="btn-warning"
                                    tooltip="Anular Movimiento"
                                    tooltipAlign="end"
                                    onClick={() => setIsAnularOpen(true)}
                                />
                            )}
                            {movimiento.estado === 'anulado' && !movimiento.movimiento_entrada_id && (
                                <BotonIcon
                                    iconName="trash"
                                    className="btn-error"
                                    tooltip="Eliminar Movimiento"
                                    tooltipAlign="end"
                                    onClick={() => setIsEliminarOpen(true)}
                                />
                            )}
                            </div>
                        </div>
                    }
                />
        </ModalCentro>

        <EliminarMovimiento
            isOpen={isEliminarOpen}
            onClose={() => setIsEliminarOpen(false)}
            movimientoSeleccionado={movimiento}
            onEliminar={handleMovimientoEliminado}
        />

        <AnularMovimiento
            isOpen={isAnularOpen}
            onClose={() => setIsAnularOpen(false)}
            movimientoSeleccionado={movimiento}
            onAnular={handleMovimientoAnulado}
        />

        <ViewInfoPago
            isOpen={isPagoViewOpen}
            onClose={() => setIsPagoViewOpen(false)}
            pago={selectedPago}
            onEliminar={(id) => {
                setHideGastos(true);
            }}
        />

        <ViewInfoPedidoAcopio
            isOpen={isPedidoViewOpen}
            setIsOpen={setIsPedidoViewOpen}
            onClose={() => setIsPedidoViewOpen(false)}
            pedido={selectedPedido}
        />
        </>
    );
};

export default ViewInfoAcopio;
