import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import InfoCard from '../../../../components/common/information/InfoCard';
import { formatCurrency } from '../../../../utils/numberUtils';

const redondearADecima = (valor) => {
    if (!Number.isFinite(valor)) return 0;
    const multiplicado = valor * 10;
    const decimal = multiplicado % 1;
    const redondeado = decimal >= 0.5 ? Math.ceil(multiplicado) : Math.floor(multiplicado);
    return redondeado / 10;
};

const ViewInfoCotizacion = ({ isOpen, onClose, cotizacion, onEdit }) => {
    if (!cotizacion) return null;

    const tags = [
        cotizacion.numero_cotizacion ? {
            text: `#${cotizacion.numero_cotizacion}`,
            icon: 'hash'
        } : null,
        cotizacion.estado ? {
            text: cotizacion.estado.charAt(0).toUpperCase() + cotizacion.estado.slice(1),
            icon: 'info'
        } : null,
        cotizacion.metodo_pago ? {
            text: cotizacion.metodo_pago,
            icon: 'credit-card'
        } : null
    ].filter(Boolean);

    const totalCalculado = (cotizacion.productos || []).reduce((sum, producto) => {
        const subtotal = parseFloat(producto.subtotal) || 0;
        const grup = parseFloat(producto.producto?.grup) || 0;
        const tieneGrup = grup > 0;
        const subtotalRedondeado = tieneGrup ? redondearADecima(subtotal) : subtotal;
        return sum + subtotalRedondeado;
    }, 0);
    const totalRedondeado = redondearADecima(totalCalculado);

    const stats = [
        {
            label: 'Total',
            value: formatCurrency(totalRedondeado),
            icon: 'dollar-sign'
        },
        {
            label: 'Fecha',
            value: new Date(cotizacion.fecha).toLocaleDateString(),
            icon: 'calendar'
        },
        {
            label: 'Productos',
            value: cotizacion.productos?.length || 0,
            icon: 'package'
        }
    ];

    let title = 'Cotización';
    if (cotizacion.cliente?.name) {
        title = cotizacion.cliente.name;
    }

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                onClose();
                if (onEdit) onEdit(cotizacion);
            }}
            hideFooter={true}
            width="450px"
        >
            <div style={{ margin: '-10px -24px -24px -24px' }}>
                <InfoCard
                    title={title}
                    subtitle="Detalles de la Cotización"
                    description={cotizacion.observaciones || 'Sin observaciones'}
                    tags={tags}
                    stats={stats}
                    icon="file"
                    actionButton={
                        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                            <Boton
                                label="Editar Cotización"
                                iconName="edit"
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    onClose();
                                    if (onEdit) onEdit(cotizacion);
                                }}
                            />
                        </div>
                    }
                />
            </div>
        </ModalCentro>
    );
};

export default ViewInfoCotizacion;
