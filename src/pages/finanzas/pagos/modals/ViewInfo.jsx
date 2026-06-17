import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import Boton from '../../../../components/common/botones/Boton';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import ViewInfoMovimiento from '../../../registros-pedidos/movimientos/modals/ViewInfo';

const ViewInfo = ({ isOpen, onClose, pago, onEdit }) => {
    const { formatPrice } = useFormatNumber();
    const { showDanger } = useToast();

    const [isViewMovimientoOpen, setIsViewMovimientoOpen] = useState(false);
    const [selectedMovimiento, setSelectedMovimiento] = useState(null);
    const [loadingMovimiento, setLoadingMovimiento] = useState(false);

    const fechaPagoStr = pago?.fecha_gasto || '';
    const fechaPagoLiteral = useFechaLiteral(fechaPagoStr, true) || (fechaPagoStr ? new Date(fechaPagoStr).toLocaleDateString() : '');

    if (!pago) return null;

    const tags = [
        {
            text: pago.metodo_pago ? pago.metodo_pago.charAt(0).toUpperCase() + pago.metodo_pago.slice(1) : 'Método de pago',
            icon: 'money'
        },
        pago.proveedor ? {
            text: pago.proveedor.name || 'Proveedor',
            icon: 'building'
        } : null,
    ].filter(Boolean);

    const stats = [
        {
            label: 'Valor Total',
            value: `Bs. ${formatPrice(pago.valor)}`,
            icon: ''
        },
        {
            label: 'Fecha Pago',
            value: fechaPagoLiteral,
            icon: 'calendar'
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
                showDanger('Error', response.message || 'Error al obtener el movimiento');
            }
        } catch (error) {
            showDanger('Error', 'Error de conexión');
        } finally {
            setLoadingMovimiento(false);
        }
    };

    return (
        <>
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                onClose();
                if (onEdit) onEdit(pago);
            }}
            hideFooter={true}
            width="450px"
        >
            <div style={{ margin: '-10px -24px -24px -24px' }}>
                <InfoCard
                    title={pago.concepto || 'Sin concepto'}
                    subtitle="Información del Pago/Gasto"
                    description={pago.observaciones || pago.detalle || ''}
                    tags={tags}
                    stats={stats}
                    icon="wallet"
                    actionButton={
                        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                            <Boton
                                label="Editar"
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
                                />
                            )}
                        </div>
                    }
                />
            </div>
        </ModalCentro>

        {isViewMovimientoOpen && selectedMovimiento && (
            <ViewInfoMovimiento
                isOpen={isViewMovimientoOpen}
                onClose={() => setIsViewMovimientoOpen(false)}
                movimiento={selectedMovimiento}
                isAcopio={false}
            />
        )}
        </>
    );
};

export default ViewInfo;
