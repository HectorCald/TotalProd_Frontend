import React, { useMemo } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Tabla from '../../../../components/common/information/Tabla';
import { formatCurrency } from '../../../../utils/numberUtils';

const ProductosPedido = ({ isOpen, onClose, pedido, isAcopio }) => {

    // Extraer los productos para mostrar
    const productosParaMostrar = useMemo(() => {
        if (!pedido) return [];
        
        if (isAcopio) {
            // Acopio tiene un solo producto principal
            if (pedido.producto_acopio) {
                return [{
                    id: pedido.producto_acopio.id,
                    producto: pedido.producto_acopio,
                    cantidad: pedido.cantidad,
                    precio: pedido.precio || 0,
                    tipo_medida: pedido.tipo_medida
                }];
            }
            return [];
        } else {
            // Almacén tiene una lista de detalles
            return pedido.pedido_almacen_detalle || [];
        }
    }, [pedido, isAcopio]);

    const columns = useMemo(() => [
        {
            header: 'Producto',
            render: (row) => row.producto?.name || row.producto_almacen?.name || 'Sin nombre',
            width: '40%'
        },
        {
            header: 'Cantidad',
            render: (row) => {
                const cantidad = parseFloat(row.cantidad) || 0;
                
                if (isAcopio) {
                    return `${cantidad} ${row.tipo_medida || 'u'}`;
                }

                const grup = parseFloat(row.producto_almacen?.grup) || 0;
                const esAgrupado = pedido?.agrupado && grup > 0;
                
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
                if (isAcopio) {
                    return formatCurrency(row.precio || 0);
                }

                const grup = parseFloat(row.producto_almacen?.grup) || 0;
                const esAgrupado = pedido?.agrupado && grup > 0;
                const precioUnitario = parseFloat(row.precio) || 0;
                
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
                const precioUnitario = parseFloat(row.precio) || 0;
                let subtotal = cantidad * precioUnitario;
                
                // Redondear subtotal si el pedido es agrupado (como en la vista antigua)
                if (!isAcopio && pedido?.agrupado && (parseFloat(row.producto_almacen?.grup) || 0) > 0) {
                    subtotal = Math.round(subtotal);
                }
                
                return formatCurrency(subtotal);
            },
            width: '20%'
        }
    ], [pedido, isAcopio]);

    const productosFlattened = productosParaMostrar.map(p => ({
        ...p,
        productoNombre: p.producto?.name || p.producto_almacen?.name || 'Sin nombre'
    }));

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title="Productos del Pedido"
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
                    />
                ) : (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        No hay productos para mostrar en este pedido.
                    </p>
                )}
            </div>
        </ModalCentro>
    );
};

export default ProductosPedido;
