import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import Boton from '../../../../components/common/botones/Boton';
import InfoCard from '../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import movimientosAcopioService from '../../../../services/movimientosAcopioService';
import ViewInfoMovimiento from '../../../registros-pedidos/movimientos/modals/ViewInfo';
import ViewInfoPedidoAcopio from '../../../registros-pedidos/pedidos/modals/ViewInfoAcopio';
import pedidosAcopioService from '../../../../services/pedidosAcopioService';
import EliminarPago from './EliminarPago';

const ViewInfo = ({ isOpen, onClose, pago, onEdit, onEliminar }) => {
    const { formatPrice } = useFormatNumber();
    const { showDanger } = useToast();

    const [isViewMovimientoOpen, setIsViewMovimientoOpen] = useState(false);
    const [selectedMovimiento, setSelectedMovimiento] = useState(null);
    const [loadingMovimiento, setLoadingMovimiento] = useState(false);

    const [isViewMovimientoAcopioOpen, setIsViewMovimientoAcopioOpen] = useState(false);
    const [selectedMovimientoAcopio, setSelectedMovimientoAcopio] = useState(null);
    const [loadingMovimientoAcopio, setLoadingMovimientoAcopio] = useState(false);

    const [isViewPedidoAcopioOpen, setIsViewPedidoAcopioOpen] = useState(false);
    const [selectedPedidoAcopio, setSelectedPedidoAcopio] = useState(null);
    const [loadingPedidoAcopio, setLoadingPedidoAcopio] = useState(false);
    
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);

    const handleVerPedidoAcopio = async () => {
        if (!pago.pedido_acopio_id) return;
        setLoadingPedidoAcopio(true);
        try {
            const response = await pedidosAcopioService.getById(pago.pedido_acopio_id);
            if (response.success && response.data) {
                setSelectedPedidoAcopio(response.data);
                setIsViewPedidoAcopioOpen(true);
            } else {
                showDanger(null, response.message || 'Error al obtener el pedido de acopio');
            }
        } catch (error) {
            showDanger(null, 'Revisa tu conexión a internet');
        } finally {
            setLoadingPedidoAcopio(false);
        }
    };

    const fechaPagoStr = pago?.fecha_gasto ? (typeof pago.fecha_gasto === 'string' ? pago.fecha_gasto.substring(0, 10) : pago.fecha_gasto) : '';
    const fechaPagoLiteral = useFechaLiteral(fechaPagoStr, false) || fechaPagoStr;

    if (!pago) return null;

    const tags = [
        {
            text: pago.metodo_pago ? pago.metodo_pago.charAt(0).toUpperCase() + pago.metodo_pago.slice(1) : 'Método de pago',
            icon: 'money',
            label: 'Método de pago'
        },
        pago.proveedor ? {
            text: pago.proveedor.name || 'Proveedor',
            icon: 'building',
            label: 'Proveedor'
        } : null,
    ].filter(Boolean);

    const stats = [
        {
            label: 'Valor Total',
            value: `Bs. ${formatPrice(pago.valor)}`,
            icon: ''
        }
    ];

    const handleVerMovimiento = async () => {
        if (!pago.movimiento_entrada_id) return;
        setLoadingMovimiento(true);
        try {
            const response = await movimientosAlmacenService.getById(pago.movimiento_entrada_id);
            if (response.success && response.data) {
                setSelectedMovimiento(response.data);
                setIsViewMovimientoOpen(true);
            } else {
                showDanger(null, response.message || 'Error al obtener el movimiento');
            }
        } catch (error) {
            showDanger(null, 'Revisa tu conexión a internet');
        } finally {
            setLoadingMovimiento(false);
        }
    };

    const handleVerMovimientoAcopio = async () => {
        if (!pago.movimiento_acopio_entrada_id) return;
        setLoadingMovimientoAcopio(true);
        try {
            const response = await movimientosAcopioService.getById(pago.movimiento_acopio_entrada_id);
            if (response.success && response.data) {
                setSelectedMovimientoAcopio(response.data);
                setIsViewMovimientoAcopioOpen(true);
            } else {
                showDanger(null, response.message || 'Error al obtener el movimiento de acopio');
            }
        } catch (error) {
            showDanger(null, 'Revisa tu conexión a internet');
        } finally {
            setLoadingMovimientoAcopio(false);
        }
    };

    return (
        <>
        <ModalCentro
            isOpen={isOpen && !isViewMovimientoOpen && !isViewMovimientoAcopioOpen && !isEliminarOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                onClose();
                if (onEdit) onEdit(pago);
            }}
            hideFooter={true}
        >
                <InfoCard
                    title={pago.concepto || 'Sin concepto'}
                    subtitle={fechaPagoLiteral}
                    description={pago.observaciones || pago.detalle || ''}
                    icon="wallet"
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
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <Boton
                                label="Editar Pago"
                                iconName="edit"
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    onClose();
                                    if (onEdit) onEdit(pago);
                                }}
                            />
                            {pago.movimiento_entrada_id && (
                                <BotonIcon
                                    iconName="file"
                                    className="btn-primary"
                                    onClick={handleVerMovimiento}
                                    loading={loadingMovimiento}
                                    disabled={loadingMovimiento}
                                    tooltip="Movimiento Almacén"
                                />
                            )}
                            {pago.movimiento_acopio_entrada_id && (
                                <BotonIcon
                                    iconName="file"
                                    className="btn-primary"
                                    onClick={handleVerMovimientoAcopio}
                                    loading={loadingMovimientoAcopio}
                                    disabled={loadingMovimientoAcopio}
                                    tooltip="Movimiento Acopio"
                                />
                            )}
                            {pago.pedido_acopio_id && (
                                <BotonIcon
                                    iconName="package"
                                    className="btn-primary"
                                    onClick={handleVerPedidoAcopio}
                                    loading={loadingPedidoAcopio}
                                    disabled={loadingPedidoAcopio}
                                    tooltip="Pedido Acopio"
                                />
                            )}
                            <BotonIcon
                                iconName="trash"
                                className="btn-error"
                                tooltip="Eliminar Pago"
                                tooltipAlign="end"
                                onClick={() => setIsEliminarOpen(true)}
                            />
                        </div>
                    }
                />
        </ModalCentro>

        {isViewMovimientoOpen && selectedMovimiento && (
            <ViewInfoMovimiento
                isOpen={isViewMovimientoOpen}
                onClose={() => setIsViewMovimientoOpen(false)}
                movimiento={selectedMovimiento}
                isAcopio={false}
                onAnular={() => {
                    setIsViewMovimientoOpen(false);
                    onClose();
                    if (onEliminar) onEliminar(pago.id);
                }}
            />
        )}

        {isViewMovimientoAcopioOpen && selectedMovimientoAcopio && (
            <ViewInfoMovimiento
                isOpen={isViewMovimientoAcopioOpen}
                onClose={() => setIsViewMovimientoAcopioOpen(false)}
                movimiento={selectedMovimientoAcopio}
                onAnular={() => {
                    setIsViewMovimientoAcopioOpen(false);
                    onClose();
                    if (onEliminar) onEliminar(pago.id);
                }}
            />
        )}

        {isViewPedidoAcopioOpen && selectedPedidoAcopio && (
            <ViewInfoPedidoAcopio
                isOpen={isViewPedidoAcopioOpen}
                onClose={() => setIsViewPedidoAcopioOpen(false)}
                pedido={selectedPedidoAcopio}
                onAnular={() => {
                    setIsViewPedidoAcopioOpen(false);
                    onClose();
                    
                    const deletedIds = [];
                    if (selectedPedidoAcopio.gasto_id) deletedIds.push(selectedPedidoAcopio.gasto_id);
                    if (selectedPedidoAcopio.gasto_otros_id) deletedIds.push(selectedPedidoAcopio.gasto_otros_id);
                    // Asegurar que el pago actual se elimine aunque no estuviera referenciado igual (por precaución)
                    if (!deletedIds.includes(pago.id)) deletedIds.push(pago.id);

                    if (onEliminar) onEliminar(deletedIds);
                }}
            />
        )}

        <EliminarPago
            isOpen={isEliminarOpen}
            onClose={(wasDeleted) => {
                setIsEliminarOpen(false);
                if (wasDeleted) {
                    onClose();
                }
            }}
            pagoSeleccionado={pago}
            onEliminar={(id) => {
                if (onEliminar) onEliminar(id);
            }}
        />
        </>
    );
};

export default ViewInfo;
