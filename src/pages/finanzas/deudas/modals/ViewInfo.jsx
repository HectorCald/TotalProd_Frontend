import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import { useToast } from '../../../../context/ToastContext';
import deudasService from '../../../../services/deudasService';
import { BoxIcon } from 'boxicons-react';
import NoData from '../../../../components/common/widgets/NoData';
import AgregarPagoParcial from './AgregarPagoParcial';

const PagoRow = ({ pago, onDelete, isDeleting }) => {
    const { formatPrice } = useFormatNumber();
    const literalDate = useFechaLiteral(pago.fecha?.split('T')[0], true);
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid var(--quaternary-color)',
                marginBottom: '10px'
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', color: 'var(--dark-color)' }}>
                        {`Bs. ${formatPrice(pago.monto)}`}
                    </span>
                    <span style={{ fontSize: '12.5px', color: 'var(--secondary-color)', fontWeight: '500' }}>
                        • {literalDate || pago.fecha}
                    </span>
                </div>
                {pago.detalle && (
                    <span style={{ fontSize: '12.5px', color: 'var(--tertiary-color)', wordBreak: 'break-word' }}>
                        {pago.detalle}
                    </span>
                )}
            </div>
            <button
                type="button"
                onClick={() => onDelete(pago.id)}
                disabled={isDeleting}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    color: '#e53935',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.15s',
                    opacity: isDeleting ? 0.5 : 1,
                    flexShrink: 0
                }}
                onMouseEnter={(e) => { if (!isDeleting) e.currentTarget.style.backgroundColor = 'rgba(229, 57, 53, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                title="Eliminar pago"
            >
                <BoxIcon name={isDeleting ? "loader-alt" : "trash"} className={isDeleting ? "bx-spin" : ""} size="sm" />
            </button>
        </div>
    );
};

const ViewInfo = ({ isOpen, onClose, deuda, onEdit, onDeudaActualizada }) => {
    const { formatPrice } = useFormatNumber();
    const { showSuccess, showDanger } = useToast();
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);
    const [pagos, setPagos] = useState([]);
    const [loadingPagos, setLoadingPagos] = useState(false);
    const [deletingPagoId, setDeletingPagoId] = useState(null);

    const loadPagos = async () => {
        if (!deuda?.id) return;
        setLoadingPagos(true);
        try {
            const response = await deudasService.getPagosParciales(deuda.id);
            if (response.success) {
                const sorted = (response.data || []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                setPagos(sorted);
            } else {
                showDanger('Error', response.message || 'Error al obtener pagos parciales');
            }
        } catch (error) {
            console.error('Error al cargar pagos:', error);
            showDanger('Error', 'Error al cargar pagos parciales');
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
                showSuccess('Éxito', 'Pago parcial eliminado exitosamente');
                setPagos(prev => prev.filter(p => p.id !== pagoId));
                if (onDeudaActualizada && response.data) {
                    onDeudaActualizada(response.data);
                }
            } else {
                showDanger('Error', response.message || 'Error al eliminar el pago');
            }
        } catch (error) {
            console.error('Error al eliminar pago parcial:', error);
            showDanger('Error', 'Error al eliminar el pago parcial');
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

    const fechaDeudaStr = deuda?.fecha_deuda || '';
    const fechaVencimientoStr = deuda?.fecha_vencimiento || '';
    const fechaDeudaLiteral = useFechaLiteral(fechaDeudaStr, true) || (fechaDeudaStr ? new Date(fechaDeudaStr).toLocaleDateString() : '');
    const fechaVencimientoLiteral = useFechaLiteral(fechaVencimientoStr, true) || (fechaVencimientoStr ? new Date(fechaVencimientoStr).toLocaleDateString() : '');

    if (!deuda) return null;

    const getEstadoTag = (estado) => {
        if (!estado) return null;
        const e = estado.toLowerCase();
        if (e === 'pagado' || e === 'pagada') {
            return { text: 'Pagada', color: 'success', hasDot: true };
        } else if (e === 'vencido' || e === 'vencida') {
            return { text: 'Vencida', color: 'error', hasDot: true };
        } else {
            return { text: 'Pendiente', color: 'warning', hasDot: true };
        }
    };

    const tags = [
        getEstadoTag(deuda.estado),
        deuda.cliente ? {
            text: deuda.cliente.name || 'Cliente',
            icon: 'user'
        } : null,
    ].filter(Boolean);

    const stats = [
        {
            label: 'Monto Total',
            value: `Bs. ${formatPrice(deuda.monto_total)}`,
            icon: ''
        },
        {
            label: 'Saldo Pendiente',
            value: `Bs. ${formatPrice(deuda.saldo_pendiente)}`,
            icon: ''
        },
        {
            label: 'Fecha Deuda',
            value: fechaDeudaLiteral,
            icon: 'calendar'
        },
        {
            label: 'Vencimiento',
            value: fechaVencimientoLiteral,
            icon: 'time'
        }
    ];

    return (
        <>
            <ModalCentro
                isOpen={isOpen}
                onClose={onClose}
                title=""
                confirmText="Editar"
                onConfirm={() => {
                    onClose();
                    if (onEdit) onEdit(deuda);
                }}
                hideFooter={true}
                width="450px"
            >
                <div style={{ margin: '-10px -24px -24px -24px' }}>
                    <InfoCard
                        title={deuda.concepto || 'Sin concepto'}
                        subtitle="Información de la Deuda"
                        description={deuda.observaciones || ''}
                        icon="credit-card"
                        customBlock={
                            <div style={{ marginBottom: '15px' }}>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--secondary-color)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Historial de Pagos
                                </p>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {loadingPagos ? (
                                        <NoData
                                            icon="loader-alt"
                                            title="Cargando pagos..."
                                            detail="Obteniendo el historial de pagos"
                                            transparent={true}
                                            minHeight="100px"
                                        />
                                    ) : pagos.length > 0 ? (
                                        pagos.map(pago => (
                                            <PagoRow
                                                key={pago.id}
                                                pago={pago}
                                                onDelete={handleEliminarPago}
                                                isDeleting={deletingPagoId === pago.id}
                                            />
                                        ))
                                    ) : (
                                        <NoData
                                            icon="history"
                                            title="No hay pagos"
                                            detail="Esta deuda no tiene pagos registrados aún"
                                            transparent={true}
                                            minHeight="100px"
                                        />
                                    )}
                                </div>
                            </div>
                        }
                        tags={tags}
                        stats={stats}
                        actionButton={
                            <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                                <Boton
                                    label="Registrar nuevo pago"
                                    iconName="plus"
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => setIsAgregarOpen(true)}
                                    disabled={parseFloat(deuda.saldo_pendiente) <= 0}
                                />
                                <BotonIcon
                                    iconName="edit"
                                    className="btn-primary"
                                    onClick={() => {
                                        onClose();
                                        if (onEdit) onEdit(deuda);
                                    }}
                                />
                            </div>
                        }
                    />
                </div>
            </ModalCentro>

            {isAgregarOpen && (
                <AgregarPagoParcial
                    isOpen={isAgregarOpen}
                    onClose={() => setIsAgregarOpen(false)}
                    deuda={deuda}
                    onPagoRegistrado={handlePagoRegistrado}
                />
            )}
        </>
    );
};

export default ViewInfo;