import React, { useState } from 'react';
import ModalCentro from '../../../components/common/modals/ModalCentro';
import BotonIcon from '../../../components/common/botones/BotonIcon';
import InfoCard from '../../../components/common/information/InfoCard';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import AnularEntregaAcopio from './modals/materia-prima/AnularEntrega';
import EliminarPedido from './modals/EliminarPedido';
import EntregarPedidoAcopio from './modals/materia-prima/EntregarPedidoAcopio';
import gastosService from '../../../services/gastosService';
import { useToast } from '../../../context/ToastContext';
import ViewInfoPago from '../../finanzas/pagos/modals/ViewInfo';
import ConfirmacionEntrada from '../../inventario/materia-prima/canasta/confirmations/ConfirmacionEntrada';
import ViewInfoMovimientoAcopio from '../movimientos/modals/ViewInfoAcopio';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import AnularIngreso from './modals/materia-prima/AnularIngreso';
import ColumnInfo from '../../../components/common/outputs/ColumnInfo';

const ViewInfoAcopio = ({ isOpen, setIsOpen, onClose, pedido, onEliminar, onAnular, onEdit }) => {
    const { showDanger, showSuccess } = useToast();
    const [isAnularEntregaOpen, setIsAnularEntregaOpen] = useState(false);
    const [isAnularIngresoOpen, setIsAnularIngresoOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isEntregarOpen, setIsEntregarOpen] = useState(false);

    const [isPagoCompraOpen, setIsPagoCompraOpen] = useState(false);
    const [selectedPagoCompra, setSelectedPagoCompra] = useState(null);
    const [loadingPagoCompra, setLoadingPagoCompra] = useState(false);

    const [isPagoTransporteOpen, setIsPagoTransporteOpen] = useState(false);
    const [selectedPagoTransporte, setSelectedPagoTransporte] = useState(null);
    const [loadingPagoTransporte, setLoadingPagoTransporte] = useState(false);

    const [isConfirmacionEntradaOpen, setIsConfirmacionEntradaOpen] = useState(false);
    
    const [isMovimientoAcopioOpen, setIsMovimientoAcopioOpen] = useState(false);
    const [selectedMovimientoAcopio, setSelectedMovimientoAcopio] = useState(null);
    const [loadingMovimientoAcopio, setLoadingMovimientoAcopio] = useState(false);



    const rawFechaStr = pedido?.fecha || pedido?.created_at || '';
    const fechaStr = rawFechaStr;
    const fechaLiteral = useFechaLiteral(fechaStr, false) || (rawFechaStr ? new Date(rawFechaStr).toLocaleDateString() : '');

    const rawFechaEntregaStr = pedido?.fecha_entregado || '';
    const fechaEntregaStr = rawFechaEntregaStr;
    const fechaEntregaLiteral = useFechaLiteral(fechaEntregaStr, false) || (rawFechaEntregaStr ? new Date(rawFechaEntregaStr).toLocaleDateString() : '');

    if (!pedido) return null;

    const handleVerPagoCompra = async () => {
        const pagoId = pedido.gasto_id;
        if (!pagoId) return;
        setLoadingPagoCompra(true);
        try {
            const res = await gastosService.getById(pagoId);
            if (res.success) {
                setSelectedPagoCompra(res.data);
                setIsPagoCompraOpen(true);
            } else {
                showDanger(null, 'El pago fue eliminado o no existe.');
            }
        } catch (error) {
            showDanger(null, 'Error de conexión');
        } finally {
            setLoadingPagoCompra(false);
        }
    };

    const handleVerPagoTransporte = async () => {
        const pagoId = pedido.gasto_otros_id;
        if (!pagoId) return;
        setLoadingPagoTransporte(true);
        try {
            const res = await gastosService.getById(pagoId);
            if (res.success) {
                setSelectedPagoTransporte(res.data);
                setIsPagoTransporteOpen(true);
            } else {
                showDanger(null, 'El pago de transporte fue eliminado o no existe.');
            }
        } catch (error) {
            showDanger(null, 'Error de conexión');
        } finally {
            setLoadingPagoTransporte(false);
        }
    };

    const handleSuccessIngreso = async (movimientoCreado) => {
        if (!movimientoCreado?.id) return;
        try {
            // Actualizar estado del pedido a Completado y registrar movimiento_entrada_id
            const res = await pedidosAcopioService.updateEstado(pedido.id, 'Completado', movimientoCreado.id);
            if (res.success) {
                showSuccess(null, 'El pedido se ha completado exitosamente.');
                if (onEdit) onEdit({ ...pedido, estado: 'Completado', movimiento_entrada_id: movimientoCreado.id });
            } else {
                showDanger(null, res.message || 'No se pudo completar el pedido.');
            }
        } catch (error) {
            showDanger(null, 'Error de conexión al completar el pedido');
        }
    };

    const handleVerMovimientoAcopio = async () => {
        if (!pedido.movimiento_entrada_id) return;
        setLoadingMovimientoAcopio(true);
        try {
            const response = await movimientosAcopioService.getById(pedido.movimiento_entrada_id);
            if (response.success && response.data) {
                setSelectedMovimientoAcopio(response.data);
                setIsMovimientoAcopioOpen(true);
            } else {
                showDanger(null, response.message || 'Error al obtener el movimiento de acopio');
            }
        } catch (error) {
            showDanger(null, 'Error de conexión');
        } finally {
            setLoadingMovimientoAcopio(false);
        }
    };

    const tags = [].filter(Boolean);

    const obtenerTotalFormateado = (ped) => {
        return `${ped.cantidad || '0'} ${ped.tipo_medida || ''}`;
    };

    const statsSolicitado = [];
    const statsEntregado = [];

    if (pedido.codigo) {
        statsSolicitado.push({
            label: 'Código',
            value: pedido.codigo,
            icon: 'hash'
        });
    }

    let solicitanteNombre = pedido.user?.name || pedido.personal?.name || '';
    if (solicitanteNombre) {
        statsSolicitado.push({
            label: 'Solicitante',
            value: solicitanteNombre,
            icon: 'user'
        });
    }

    statsSolicitado.push({
        label: 'Cantidad',
        value: obtenerTotalFormateado(pedido),
        icon: ''
    });

    if (pedido.estado === 'Entregado' || pedido.estado === 'Completado') {
        if (pedido.cantidad_entregada) {
            statsEntregado.push({
                label: 'Peso',
                value: `${pedido.cantidad_entregada} ${pedido.unidadEntregada || pedido.tipo_medida || ''}`.trim(),
                icon: 'purchase-tag-alt'
            });
        }
        if (pedido.cantidad_entregada_ud) {
            statsEntregado.push({
                label: 'Piezas',
                value: `${pedido.cantidad_entregada_ud} ${pedido.cantidad_entregada_medida || ''}`.trim(),
                icon: 'purchase-tag-alt'
            });
        }
        if (pedido.estado_entrega) {
            statsEntregado.push({
                label: 'Llegada',
                value: pedido.estado_entrega,
                icon: pedido.estado_entrega === 'Llego' ? 'check-circle' : 'x-circle'
            });
        }
        if (pedido.fecha_entregado) {
            statsEntregado.push({
                label: 'F. Entrega',
                value: fechaEntregaLiteral,
                icon: 'calendar'
            });
        }
    }
    
    let title = pedido.producto_acopio?.name || 'Producto desconocido';

    let statusDotColor = 'error';
    if (pedido.estado === 'Completado') statusDotColor = 'info';
    else if (pedido.estado === 'Entregado') statusDotColor = 'warning';

    const tieneTransporte = pedido.gasto_otros_id != null;

    return (
        <>
        <ModalCentro
            isOpen={isOpen && !isAnularEntregaOpen && !isAnularIngresoOpen && !isEliminarOpen && !isPagoCompraOpen && !isPagoTransporteOpen && !isEntregarOpen && !isConfirmacionEntradaOpen && !isMovimientoAcopioOpen}
            onClose={() => {
                if (setIsOpen) setIsOpen(false);
                if (onClose) onClose();
            }}
            title=""
            hideFooter={true}
            width="450px"
        >
                <InfoCard
                    title={`${title}${pedido.numero_pedido ? ` (Nº ${pedido.numero_pedido})` : ''}`}
                    subtitle={fechaLiteral}
                    description={pedido.observaciones}
                    statusDot={statusDotColor}
                    icon={'box'}
                    customBlock={
                        <>
                            {tags.length > 0 && (
                                <ColumnInfo items={tags.map(t => ({ text: t.text, icon: t.icon }))} />
                            )}
                            {statsSolicitado.length > 0 && (
                                <ColumnInfo 
                                    title="Solicitado"
                                    items={statsSolicitado.map(s => ({ clave: s.label, valor: s.value }))}
                                />
                            )}
                            {statsEntregado.length > 0 && (
                                <ColumnInfo 
                                    title="Entregado"
                                    items={statsEntregado.map(s => ({ clave: s.label, valor: s.value }))}
                                />
                            )}
                        </>
                    }
                    actionButton={
                        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                            {/* Botones compartidos para Entregado o Completado */}
                            {(pedido.estado === 'Entregado' || pedido.estado === 'Completado') && (
                                <>
                                    {pedido.gasto_id && (
                                        <BotonIcon
                                            iconName="wallet"
                                            className="btn-primary"
                                            tooltip="Pago Compra"
                                            loading={loadingPagoCompra}
                                            onClick={handleVerPagoCompra}
                                        />
                                    )}

                                    {tieneTransporte && (
                                        <BotonIcon
                                            iconName="car"
                                            className="btn-primary"
                                            tooltip="Pago Transporte"
                                            loading={loadingPagoTransporte}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVerPagoTransporte(); }}
                                        />
                                    )}
                                </>
                            )}

                            {/* Botones cuando está Completado */}
                            {pedido.estado === 'Completado' && (
                                <>
                                    {pedido.movimiento_entrada_id && (
                                        <BotonIcon
                                            key="btn-movimiento-acopio"
                                            iconName="package"
                                            className="btn-primary"
                                            tooltip="Movimiento Acopio"
                                            loading={loadingMovimientoAcopio}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVerMovimientoAcopio(); }}
                                        />
                                    )}
                                    <BotonIcon
                                        key="btn-anular-ingreso"
                                        iconName="undo"
                                        className="btn-warning"
                                        tooltip="Anular Ingreso"
                                        tooltipAlign="end"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAnularIngresoOpen(true); }}
                                    />
                                </>
                            )}

                            {/* Botones al lado izquierdo cuando está entregado */}
                            {pedido.estado === 'Entregado' && (
                                <>
                                    <BotonIcon
                                        key="btn-realizar-ingreso"
                                        iconName="log-in"
                                        className="btn-primary"
                                        tooltip="Realizar Ingreso"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsConfirmacionEntradaOpen(true); }}
                                    />

                                    <BotonIcon
                                        key="btn-anular-entrega"
                                        iconName="block"
                                        className="btn-warning"
                                        tooltip="Anular Entrega"
                                        tooltipAlign="end"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAnularEntregaOpen(true); }}
                                    />
                                </>
                            )}

                            {pedido.estado === 'Pendiente' && (
                                <BotonIcon
                                    key="btn-entregar"
                                    iconName="check"
                                    className="btn-primary"
                                    tooltip="Entregar Pedido"
                                    onClick={() => setIsEntregarOpen(true)}
                                />
                            )}

                            {pedido.estado === 'Pendiente' && (
                                <BotonIcon
                                    iconName="trash"
                                    className="btn-error"
                                    tooltip="Eliminar Pedido"
                                    tooltipAlign="end"
                                    onClick={() => setIsEliminarOpen(true)}
                                />
                            )}
                        </div>
                    }
                />
           
        </ModalCentro>

        <AnularEntregaAcopio
            isOpen={isAnularEntregaOpen}
            setIsOpen={setIsAnularEntregaOpen}
            pedido={pedido}
            onAnulado={(updatedPedido) => {
                if (onEdit) onEdit(updatedPedido);
            }}
        />

        <AnularIngreso
            isOpen={isAnularIngresoOpen}
            setIsOpen={setIsAnularIngresoOpen}
            pedido={pedido}
            onAnulado={(updatedPedido) => {
                if (onEdit) onEdit(updatedPedido);
            }}
        />

        <EliminarPedido
            isOpen={isEliminarOpen}
            setIsOpen={setIsEliminarOpen}
            pedido={pedido}
            isAcopio={true}
            onDeleted={(id) => {
                if (setIsOpen) setIsOpen(false);
                if (onClose) onClose();
                if (onEliminar) onEliminar(id);
            }}
        />

        <EntregarPedidoAcopio
            isOpen={isEntregarOpen}
            onClose={() => setIsEntregarOpen(false)}
            pedido={pedido}
            onEntregado={(updatedPedido) => {
                setIsEntregarOpen(false);
                if (onEdit) onEdit(updatedPedido);
            }}
        />

        <ViewInfoPago
            isOpen={isPagoCompraOpen}
            onClose={() => setIsPagoCompraOpen(false)}
            pago={selectedPagoCompra}
        />

        <ViewInfoPago
            isOpen={isPagoTransporteOpen}
            onClose={() => setIsPagoTransporteOpen(false)}
            pago={selectedPagoTransporte}
        />

        <ConfirmacionEntrada
            isOpen={isConfirmacionEntradaOpen}
            onClose={() => setIsConfirmacionEntradaOpen(false)}
            producto={pedido.producto_acopio}
            pedidoId={pedido.id}
            hideGastosRecetas={true}
            defaultCantidad={pedido.cantidad_entregada || pedido.cantidad}
            onSuccess={handleSuccessIngreso}
        />

        {isMovimientoAcopioOpen && selectedMovimientoAcopio && (
            <ViewInfoMovimientoAcopio
                isOpen={isMovimientoAcopioOpen}
                onClose={() => setIsMovimientoAcopioOpen(false)}
                movimiento={selectedMovimientoAcopio}
                onAnular={(updatedMovimiento) => {
                    setIsMovimientoAcopioOpen(false);
                    onClose();
                    if (onEdit) onEdit({ ...pedido, estado: 'Entregado', movimiento_entrada_id: null });
                }}
            />
        )}
        </>
    );
};

export default ViewInfoAcopio;
