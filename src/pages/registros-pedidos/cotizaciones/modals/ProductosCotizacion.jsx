import React, { useMemo } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Tabla from '../../../../components/common/information/Tabla';
import { formatCurrency } from '../../../../utils/numberUtils';

const ProductosCotizacion = ({ isOpen, onClose, cotizacion }) => {

    const productosParaMostrar = cotizacion?.productos || [];

    const columns = useMemo(() => [
        {
            header: 'Producto',
            render: (row) => row.producto?.name || 'Sin nombre',
            width: '40%'
        },
        {
            header: 'Cantidad',
            render: (row) => {
                const cantidad = parseFloat(row.cantidad) || 0;
                const grup = parseFloat(row.producto?.grup) || 0;
                const esAgrupado = cotizacion?.agrupado && grup > 0;
                
                if (esAgrupado) {
                    const grupos = Math.floor(cantidad / grup);
                    const unidades = cantidad % grup;
                    return unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                } else {
                    return `${cantidad} ud`;
                }
            },
            width: '20%'
        },
        {
            header: 'Precio Unitario',
            render: (row) => {
                const grup = parseFloat(row.producto?.grup) || 0;
                const esAgrupado = cotizacion?.agrupado && grup > 0;
                const precioUnitario = parseFloat(row.precio_unitario) || 0;
                
                if (esAgrupado) {
                    return formatCurrency(precioUnitario * grup);
                } else {
                    return formatCurrency(precioUnitario);
                }
            },
            width: '20%'
        },
        {
            header: 'Subtotal',
            render: (row) => {
                const cantidad = parseFloat(row.cantidad) || 0;
                const precioUnitario = parseFloat(row.precio_unitario) || 0;
                return formatCurrency(cantidad * precioUnitario);
            },
            width: '20%'
        }
    ], [cotizacion]);

    const productosFlattened = (productosParaMostrar || []).map(p => ({
        ...p,
        productoNombre: p.producto?.name || 'Sin nombre'
    }));

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title={`Productos de la Cotización #${cotizacion?.numero_cotizacion || ''}`}
            width="800px"
            hideFooter={true}
        >
            <div style={{ padding: '10px 0' }}>
                {productosFlattened.length > 0 ? (
                    <Tabla
                        data={productosFlattened}
                        columns={columns}
                        searchKeys={['productoNombre']}
                        searchPlaceholder="Buscar por producto..."
                        containerStyle={{ minHeight: 'auto', padding: 0 }}
                    />
                ) : (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        No hay productos en esta cotización.
                    </p>
                )}
            </div>
        </ModalCentro>
    );
};

export default ProductosCotizacion;
