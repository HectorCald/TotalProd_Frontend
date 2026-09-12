import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import { useToast } from '../../../../context/ToastContext';
import deudasService from '../../../../services/deudasService';
import RegisterBlock from '../../../../components/common/widgets/RegisterBlock';
import AgregarPagoParcial from './AgregarPagoParcial';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import ViewInfoMovimiento from '../../../registros-pedidos/movimientos/modals/ViewInfo';
import EliminarDeuda from './EliminarDeuda';


const ViewInfo = ({ isOpen, onClose, deuda, onEdit, onDeudaActualizada, onEliminar }) => {
    const { formatPrice } = useFormatNumber();
    const { showSuccess, showDanger } = useToast();
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);
    const [pagos, setPagos] = useState([]);
    const [loadingPagos, setLoadingPagos] = useState(false);
    const [deletingPagoId, setDeletingPagoId] = useState(null);
    const [isViewMovimientoOpen, setIsViewMovimientoOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [selectedMovimiento, setSelectedMovimiento] = useState(null);
    const [loadingMovimiento, setLoadingMovimiento] = useState(false);

    const handleVerMovimiento = async () => {
        if (!deuda.movimiento_salida_id) return;
        setLoadingMovimiento(true);
        try {
            const response = await movimientosAlmacenService.getById(deuda.movimiento_salida_id);
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

    const loadPagos = async () => {
        if (!deuda?.id) return;
        setLoadingPagos(true);
        try {
            const response = await deudasService.getPagosParciales(deuda.id);
            if (response.success) {
                const sorted = (response.data || []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                setPagos(sorted);
            } else {
                showDanger(null, response.message || 'Error al obtener pagos parciales');
            }
        } catch (error) {
            console.error('Error al cargar pagos:', error);
            showDanger(null, 'Error al cargar pagos parciales');
        } finally {
            setLoadingPagos(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadPagos();
        } else {
            setPagos([]);
        }
    }, [isOpen, deuda?.id]);

    const handleEliminarPago = async (pagoId) => {
        setDeletingPagoId(pagoId);
        try {
            const response = await deudasService.deletePagoParcial(deuda.id, pagoId);
            if (response.success) {
                setPagos(prev => prev.filter(p => p.id !== pagoId));
                if (onDeudaActualizada && response.data) {
                    onDeudaActualizada(response.data);
                }
                showSuccess(null, 'Pago parcial eliminado exitosamente');
            } else {
                showDanger(null, response.message || 'Error al eliminar el pago');
            }
        } catch (error) {
            console.error('Error al eliminar pago parcial:', error);
            showDanger(null, 'Error al eliminar el pago parcial');
        } finally {
            setDeletingPagoId(null);
        }
    };

    const handlePagoRegistrado = (data) => {
        if (onDeudaActualizada && data?.deuda) {
            onDeudaActualizada(data.deuda);
        }
        if (data?.pago) {
            setPagos(prev => {
                const updated = [...prev, data.pago];
                return updated.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            });
        }
    };

    // Pre-recortar a YYYY-MM-DD ya que son fechas conceptuales (no timestamps de evento)
    const fechaDeudaStr = typeof deuda?.fecha_deuda === 'string' && deuda.fecha_deuda.length > 10 ? deuda.fecha_deuda.substring(0, 10) : (deuda?.fecha_deuda || '');
    const fechaVencimientoStr = typeof deuda?.fecha_vencimiento === 'string' && deuda.fecha_vencimiento.length > 10 ? deuda.fecha_vencimiento.substring(0, 10) : (deuda?.fecha_vencimiento || '');
    const fechaDeudaLiteral = useFechaLiteral(fechaDeudaStr, false) || fechaDeudaStr;
    const fechaVencimientoLiteral = useFechaLiteral(fechaVencimientoStr, false) || fechaVencimientoStr;

    if (!deuda) return null;

    const totalPagado = Math.max(0, (parseFloat(deuda.monto_total) || 0) - (parseFloat(deuda.saldo_pendiente) || 0));

    return (
        <>
            <ModalCentro
                isOpen={isOpen && !isViewMovimientoOpen && !isEliminarOpen}
                onClose={onClose}
                title=""
                confirmText="Editar"
                onConfirm={() => {
                    if (onEdit) onEdit(deuda);
                }}
                hideFooter={true}
            >
                    <InfoCard
                        title={deuda.concepto || 'Sin concepto'}
                        subtitle={fechaDeudaLiteral}
                        description={deuda.observaciones || ''}
                        statusDot={(deuda.estado || '').toLowerCase().startsWith('pagad') ? 'success' : (deuda.estado || '').toLowerCase().startsWith('vencid') ? 'error' : 'warning'}
                        icon="credit-card"
                        customBlock={
                            <>
                                <ColumnInfo 
                                    items={[
                                        deuda.cliente && { 
                                            icon: 'user', 
                                            text: deuda.cliente.name || 'Cliente' 
                                        }
                                    ].filter(Boolean)} 
                                />
                                {fechaVencimientoLiteral && (
                                    <ColumnInfo 
                                        title="Detalles"
                                        items={[
                                            { clave: 'Vencimiento', valor: fechaVencimientoLiteral }
                                        ]}
                                    />
                                )}
                                <ColumnInfo 
                                    title="Finanzas"
                                    items={[
                                        { clave: 'Monto Total', valor: `Bs. ${formatPrice(deuda.monto_total)}` },
                                        { clave: 'Total Pagado', valor: `Bs. ${formatPrice(totalPagado)}` }
                                    ]}
                                    finance={true}
                                    financeLabel="Saldo Pendiente:"
                                    financeTotal={`Bs. ${formatPrice(deuda.saldo_pendiente)}`}
                                />
                                <RegisterBlock
                                    title="Historial de Pagos"
                                    items={pagos}
                                    loading={loadingPagos}
                                    onDelete={handleEliminarPago}
                                    deletingId={deletingPagoId}
                                />
                            </>
                        }
                        actionButton={
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <Boton
                                    label="Nuevo pago"
                                    iconName="plus"
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => setIsAgregarOpen(true)}
                                    disabled={parseFloat(deuda.saldo_pendiente) <= 0}
                                />
                                {deuda.movimiento_salida_id && (
                                    <BotonIcon
                                        iconName="file"
                                        className="btn-primary"
                                        onClick={handleVerMovimiento}
                                        loading={loadingMovimiento}
                                        disabled={loadingMovimiento}
                                        tooltip="Movimiento de Salida"
                                    />
                                )}
                                <BotonIcon
                                    iconName="edit"
                                    className="btn-primary"
                                    tooltip="Editar Deuda"
                                    onClick={() => {
                                        if (onEdit) onEdit(deuda);
                                    }}
                                />
                                <BotonIcon
                                    iconName="trash"
                                    className="btn-error"
                                    tooltipAlign="end"
                                    tooltip="Eliminar Deuda"
                                    onClick={() => setIsEliminarOpen(true)}
                                />
                            </div>
                        }
                    />
            </ModalCentro>

            {isAgregarOpen && (
                <AgregarPagoParcial
                    isOpen={isAgregarOpen}
                    onClose={() => setIsAgregarOpen(false)}
                    deuda={deuda}
                    onPagoRegistrado={handlePagoRegistrado}
                />
            )}

            {isViewMovimientoOpen && selectedMovimiento && (
                <ViewInfoMovimiento
                    isOpen={isViewMovimientoOpen}
                    onClose={() => setIsViewMovimientoOpen(false)}
                    movimiento={selectedMovimiento}
                    onAnular={() => {
                        setIsViewMovimientoOpen(false);
                        onClose();
                        if (onEliminar) onEliminar(deuda.id);
                    }}
                />
            )}

            <EliminarDeuda
                isOpen={isEliminarOpen}
                onClose={(wasDeleted) => {
                    setIsEliminarOpen(false);
                    if (wasDeleted) {
                        onClose();
                    }
                }}
                deudaSeleccionada={deuda}
                onEliminar={(id) => {
                    if (onEliminar) onEliminar(id);
                }}
            />
        </>
    );
};

export default ViewInfo;