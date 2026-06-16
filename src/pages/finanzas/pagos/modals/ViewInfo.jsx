import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';

const ViewInfo = ({ isOpen, onClose, pago, onEdit }) => {
    const { formatPrice } = useFormatNumber();

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

    return (
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
                        <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'flex-end' }}>
                            <BotonIcon
                                iconName="edit"
                                className="btn-primary"
                                onClick={() => {
                                    onClose();
                                    if (onEdit) onEdit(pago);
                                }}
                            />
                        </div>
                    }
                />
            </div>
        </ModalCentro>
    );
};

export default ViewInfo;
