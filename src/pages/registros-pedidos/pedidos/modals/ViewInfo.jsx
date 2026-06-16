import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import ProductosPedido from './ProductosPedido';

const ViewInfo = ({ isOpen, setIsOpen, pedido, isAcopio, onEliminar, onAnular }) => {
    const { formatPrice } = useFormatNumber();
    const [isProductosOpen, setIsProductosOpen] = useState(false);

    const rawFechaStr = pedido?.fecha || pedido?.created_at || '';
    const fechaStr = rawFechaStr ? rawFechaStr.slice(0, 10) : '';
    const fechaLiteral = useFechaLiteral(fechaStr, true) || (rawFechaStr ? new Date(rawFechaStr).toLocaleDateString() : '');

    if (!pedido) return null;

    const tags = [
        {
            text: pedido.estado,
            color: pedido.estado === 'Completado' ? 'info' : pedido.estado === 'Entregado' ? 'warning' : 'error',
            hasDot: true
        }
    ].filter(Boolean);

    let solicitanteNombre = pedido.user?.name || pedido.personal?.name || '';
    if (solicitanteNombre) {
        tags.push({
            text: solicitanteNombre,
            icon: 'user'
        });
    }

    if (!isAcopio && pedido.sucursal?.name) {
        tags.push({
            text: pedido.sucursal.name,
            icon: 'building'
        });
    }

    const obtenerTotalFormateado = (ped) => {
        if (isAcopio) {
            return `${ped.cantidad || '0'} ${ped.tipo_medida || ''}`;
        }

        const total = (ped.pedido_almacen_detalle || []).reduce((sum, detalle) => {
            const precio = detalle.precio || 0;
            const cantidad = detalle.cantidad || 0;
            let subtotal = precio * cantidad;
            if (ped.agrupado && detalle.producto_almacen?.grup) {
                subtotal = Math.round(subtotal);
            }
            return sum + subtotal;
        }, 0);
        return formatPrice(total);
    };

    const stats = [
        {
            label: isAcopio ? 'Cantidad' : 'Total',
            value: isAcopio ? obtenerTotalFormateado(pedido) : `Bs. ${obtenerTotalFormateado(pedido)}`,
            icon: ''
        },
        {
            label: 'Fecha',
            value: fechaLiteral,
            icon: 'calendar'
        }
    ];
    
    let title = '';
    if (isAcopio) {
        title = pedido.producto_acopio?.name || 'Producto desconocido';
    } else {
        title = `Pedido Nº ${pedido.numero_pedido || '0'}`;
    }

    return (
        <>
        <ModalCentro
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title=""
            hideFooter={true}
            width="450px"
        >
            <div style={{ margin: '-10px -24px -24px -24px' }}>
                <InfoCard
                    title={title}
                    subtitle={`Información del Pedido`}
                    description={pedido.observaciones || ''}
                    tags={tags}
                    stats={stats}
                    icon={isAcopio ? 'box' : 'file'}
                    actionButton={
                        <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'flex-end' }}>
                            {(!isAcopio || (isAcopio && pedido.producto_acopio)) && (
                                <Boton
                                    label="Productos"
                                    iconName="box"
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => setIsProductosOpen(true)}
                                />
                            )}
                        </div>
                    }
                />
            </div>
        </ModalCentro>

        <ProductosPedido
            isOpen={isProductosOpen}
            onClose={() => setIsProductosOpen(false)}
            pedido={pedido}
            isAcopio={isAcopio}
        />
        </>
    );
};

export default ViewInfo;
