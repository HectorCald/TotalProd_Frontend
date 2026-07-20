import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import EliminarMovimiento from './EliminarMovimiento';
import AnularMovimiento from './AnularMovimiento';
import ProductosMovimiento from './ProductosMovimiento';
import movimientosAcopioService from '../../../../services/movimientosAcopioService';
import gastosService from '../../../../services/gastosService';
import { useToast } from '../../../../context/ToastContext';
import ViewInfoPago from '../../../finanzas/pagos/modals/ViewInfo';
import ViewInfoPedidoAcopio from '../../pedidos/modals/ViewInfoAcopio';
import pedidosAcopioService from '../../../../services/pedidosAcopioService';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import Mensaje from '../../../../components/common/outputs/Mensaje';

const ViewInfoAcopio = ({ isOpen, onClose, movimiento, onEdit, onEliminar, onAnular }) => {
    const { formatPrice } = useFormatNumber();
    const { showDanger } = useToast();
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    
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
    const fechaStr = rawFechaStr ? rawFechaStr.slice(0, 10) : '';
    const fechaLiteral = useFechaLiteral(fechaStr, false) || (rawFechaStr ? new Date(rawFechaStr).toLocaleDateString() : '');

    if (!movimiento) return null;

    const isAcopio = !!movimiento.product;

    const tags = [].filter(Boolean);

    if (movimiento.codigo) {
        tags.push({
            label: 'Código',
            text: movimiento.codigo,
            icon: 'hash'
        });
    }

    if (movimiento.precio && movimiento.precio.name) {
        tags.push({
            label: 'Precio',
            text: movimiento.precio.name,
            icon: 'dollar'
        });
    }



    let clienteProveedorNombre = '';
    let esProveedor = false;
    if (isAcopio) {
        if (movimiento.type === 'entrada') {
            clienteProveedorNombre = movimiento.proveedor?.name || '';
            esProveedor = true;
        } else {
            clienteProveedorNombre = movimiento.cliente?.name || '';
        }
    } else {
        if (movimiento.type === 'transferencia') {
            clienteProveedorNombre = movimiento.cliente?.name || '';
        } else {
            if (movimiento.type === 'entrada') {
                clienteProveedorNombre = movimiento.proveedor?.name || '';
                esProveedor = true;
            } else {
                clienteProveedorNombre = movimiento.cliente?.name || '';
            }
        }
    }

    if (clienteProveedorNombre) {
        tags.push({
            label: esProveedor ? 'Proveedor' : 'Cliente',
            text: clienteProveedorNombre,
            icon: esProveedor ? 'building' : 'user'
        });
    }

    const responsableNombre = movimiento?.user?.name || movimiento?.personal?.name || '';
    if (responsableNombre) {
        tags.push({
            label: 'Responsable',
            text: responsableNombre,
            icon: 'user'
        });
    }

    if (movimiento.type === 'salida' && movimiento.metodo_pago) {
        const metodo = movimiento.metodo_pago.toLowerCase();
        tags.push({
            label: 'Pago',
            text: metodo.charAt(0).toUpperCase() + metodo.slice(1),
            icon: 'credit-card'
        });
    }


    const stats = [];
    
    stats.push({
        label: 'Tipo',
        value: movimiento.type === 'entrada' ? 'Entrada' : movimiento.type === 'transferencia' ? 'Transferencia' : 'Salida',
        icon: 'transfer'
    });

    if (movimiento.agrupado !== undefined && movimiento.agrupado !== null) {
        stats.push({
            label: 'Modalidad',
            value: movimiento.agrupado ? 'Grps.' : 'Unds.',
            icon: movimiento.agrupado ? 'layer' : 'box'
        });
    }

    if (isAcopio) {
        stats.push({
            label: 'Cantidad',
            value: `${movimiento.quantity || '0'} ${movimiento.product?.type_measure?.code || ''}`,
            icon: ''
        });
    } else {
        stats.push({
            label: 'Productos',
            value: movimiento.productos?.length || 0,
            icon: 'package'
        });
    }

    const observaciones = movimiento.observaciones || movimiento.observations || movimiento.detalle || '';
    if (observaciones) {
        stats.push({
            label: 'Observaciones',
            value: observaciones,
            icon: 'detail'
        });
    }
    
    let title = '';
    if (isAcopio) {
        title = movimiento.product?.name || 'Sin producto';
    } else {
        if (movimiento.type === 'transferencia') {
            if (movimiento.concepto && movimiento.concepto.trim() !== '') {
                title = movimiento.concepto;
            } else {
                const origen = movimiento.sucursal_origen?.name || movimiento.sucursal?.name || 'Origen';
                const destino = movimiento.sucursal_destino?.name || 'Destino';
                title = `${origen} > ${destino}`;
            }
        } else if (movimiento.concepto && movimiento.concepto.trim() !== '') {
            title = movimiento.concepto;
        } else {
            const clienteNombre = movimiento.type === 'entrada' 
                ? (movimiento.proveedor?.name || null)
                : (movimiento.cliente?.name || null);
            if (clienteNombre) {
                title = clienteNombre;
            } else if (movimiento.productos && movimiento.productos.length > 0) {
                title = movimiento.productos.length === 1
                    ? movimiento.productos[0]?.producto?.name || 'Sin producto'
                    : `${movimiento.productos.length} productos`;
            } else {
                title = 'Sin productos';
            }
        }
    }



    return (
        <>
        <ModalCentro
            isOpen={isOpen && !isEliminarOpen && !isAnularOpen && !isPagoViewOpen && !isPedidoViewOpen && !isProductosOpen}
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
                            {tags.length > 0 && (
                                <ColumnInfo items={tags.map(t => ({ text: t.text, icon: t.icon }))} />
                            )}
                            {stats.length > 0 && (
                                <ColumnInfo 
                                    title="Detalles"
                                    items={stats.map(s => ({ clave: s.label, valor: s.value }))}
                                />
                            )}
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
                            {!isAcopio && (
                                <Boton
                                    label="Productos"
                                    iconName="box"
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => setIsProductosOpen(true)}
                                />
                            )}
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

        <ProductosMovimiento
            isOpen={isProductosOpen}
            onClose={() => setIsProductosOpen(false)}
            movimientoActual={movimiento}
            movimiento={movimiento}
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
