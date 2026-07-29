import React, { useMemo } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Tabla from '../../../../components/common/information/Tabla';
import { formatCurrency } from '../../../../utils/numberUtils';
import useFormatNumberPrice from '../../../../hooks/useFormatNumberPrice';

/**
 * Componente universal de productos para movimientos, pedidos y cotizaciones.
 *
 * Props:
 *  - isOpen / onClose
 *  - title (string, opcional)
 *
 * Modo movimiento:
 *  - movimientoActual  (objeto principal, con .agrupado, .productos[].producto, .cantidad, .precio_unitario)
 *  - movimiento        (fallback para anulados)
 *
 * Modo pedido:
 *  - pedido            (objeto con .agrupado, .pedido_almacen_detalle[].producto_almacen, .cantidad, .precio)
 *  - isAcopio          (boolean)
 *
 * Modo cotización:
 *  - cotizacion        (objeto con .agrupado, .productos[].producto, .cantidad, .precio_unitario)
 *  - cotizacionActual  (alias, también se acepta)
 */
const ProductosMovimiento = ({
    isOpen,
    onClose,
    title,
    // movimiento
    movimientoActual,
    movimiento,
    // pedido
    pedido,
    isAcopio,
    // cotizacion
    cotizacion,
    cotizacionActual,
}) => {
    const { calculateSubtotal, calculateSpecialPrice } = useFormatNumberPrice();

    // ── Detectar modo y normalizar datos ──────────────────────────────────────
    const { rows, agrupado, modalTitle } = useMemo(() => {
        // MODO COTIZACIÓN
        const cot = cotizacionActual || cotizacion;
        if (cot) {
            const productos = cot.productos || [];
            const normalized = productos.map(p => ({
                nombre: p.producto?.name || 'Sin nombre',
                cantidad: parseFloat(p.cantidad) || 0,
                precioUnitario: parseFloat(p.precio_unitario) || 0,
                grup: parseFloat(p.producto?.grup) || 0,
                esVenta: true,
                subtotal: calculateSubtotal(p.cantidad, p.precio_unitario, p.producto?.grup, !!cot.agrupado, true),
            }));
            return {
                rows: normalized,
                agrupado: !!cot.agrupado,
                modalTitle: title || `Productos de la Cotización #${cot.numero_cotizacion || ''}`,
            };
        }

        // MODO PEDIDO
        if (pedido) {
            if (isAcopio) {
                const rows = pedido.producto_acopio
                    ? [{
                        nombre: pedido.producto_acopio.name || 'Sin nombre',
                        cantidad: parseFloat(pedido.cantidad) || 0,
                        precioUnitario: parseFloat(pedido.precio) || 0,
                        grup: 0,
                        subtotal: calculateSubtotal(pedido.cantidad, pedido.precio, 0, false, true),
                        tipoMedida: pedido.tipo_medida,
                    }]
                    : [];
                return { rows, agrupado: false, modalTitle: title || 'Productos del Pedido' };
            }

            const detalles = pedido.pedido_almacen_detalle || [];
            const normalized = detalles.map(p => ({
                nombre: p.producto_almacen?.name || p.producto?.name || 'Sin nombre',
                cantidad: parseFloat(p.cantidad) || 0,
                precioUnitario: parseFloat(p.precio) || 0,
                grup: parseFloat(p.producto_almacen?.grup) || 0,
                esVenta: true,
                subtotal: calculateSubtotal(p.cantidad, p.precio, p.producto_almacen?.grup, !!pedido.agrupado, true),
            }));
            return {
                rows: normalized,
                agrupado: !!pedido.agrupado,
                modalTitle: title || 'Productos del Pedido',
            };
        }

        // MODO MOVIMIENTO (default)
        const mov = movimientoActual;
        const productosParaMostrar =
            mov?.estado === 'anulado' &&
            (!mov?.productos || mov.productos.length === 0 ||
                mov.productos.some(p => !p.producto?.name || p.precio_unitario === 0))
                ? movimiento?.productos || []
                : mov?.productos || [];

        const normalized = productosParaMostrar.map(p => {
            const esVenta = mov?.type === 'salida' || mov?.tipo === 'salida';
            return {
                nombre: p.producto?.name || 'Sin nombre',
                cantidad: parseFloat(p.cantidad) || 0,
                precioUnitario: parseFloat(p.precio_unitario) || 0,
                grup: parseFloat(p.producto?.grup) || 0,
                costoProduccion: parseFloat(p.producto?.costo_produccion) || 0,
                esVenta: esVenta,
                subtotal: calculateSubtotal(p.cantidad, p.precio_unitario, p.producto?.grup, !!mov?.agrupado, esVenta)
            };
        });
        return {
            rows: normalized,
            agrupado: !!mov?.agrupado,
            modalTitle: title || 'Productos del Movimiento',
        };
    }, [movimientoActual, movimiento, pedido, isAcopio, cotizacion, cotizacionActual, title, calculateSubtotal]);

    // ── Columnas ──────────────────────────────────────────────────────────────
    const columns = useMemo(() => {
        const base = [
            {
                header: 'Producto',
                render: (row) => row.nombre,
                width: '40%',
            },
            {
                header: 'Cantidad',
                render: (row) => {
                    // Si es acopio, mostrar con tipo de medida
                    if (row.tipoMedida) return `${row.cantidad} ${row.tipoMedida}`;

                    const esAgrupado = agrupado && row.grup > 0;
                    if (esAgrupado) {
                        const grupos = Math.floor(row.cantidad / row.grup);
                        const resto = row.cantidad % row.grup;
                        return resto > 0 ? `${grupos} grup ${resto} ud` : `${grupos} grup`;
                    }
                    return `${row.cantidad} ud`;
                },
                width: '15%',
            },
            {
                header: 'Precio Unit.',
                render: (row) => {
                    const esAgrupado = agrupado && row.grup > 0;
                    const precioMostrado = calculateSpecialPrice(row.precioUnitario, row.grup, esAgrupado, row.esVenta);
                    return formatCurrency(precioMostrado);
                },
                width: '15%',
            },
            {
                header: 'Subtotal',
                render: (row) => formatCurrency(row.subtotal),
                width: '15%',
            },
        ];

        const mov = movimientoActual || movimiento;
        if (mov && mov.type === 'salida') {
            base.push({
                header: 'Ganancia',
                render: (row) => {
                    const esAgrupado = agrupado && row.grup > 0;
                    const precioUnit = calculateSpecialPrice(row.precioUnitario, row.grup, esAgrupado, row.esVenta);
                    const costoUnit = esAgrupado ? row.costoProduccion * row.grup : row.costoProduccion;
                    const gananciaTotal = (precioUnit - costoUnit) * (esAgrupado ? row.cantidad / row.grup : row.cantidad);
                    const gananciaRedondeada = Math.round((gananciaTotal + Number.EPSILON) * 10) / 10;
                    return formatCurrency(gananciaRedondeada);
                },
                width: '15%',
            });
        }
        return base;
    }, [agrupado, movimientoActual, movimiento, calculateSpecialPrice]);

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            width="800px"
            hideFooter={true}
            contentStyle={{ paddingBlock: 0 }}
        >
            <div style={{ padding: '10px 0' }}>
                {rows.length > 0 ? (
                    <Tabla
                        data={rows}
                        columns={columns}
                        searchKeys={['nombre']}
                        searchPlaceholder="Buscar por producto..."
                        containerStyle={{ minHeight: 'auto', padding: 0 }}
                    />
                ) : (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        No hay productos para mostrar.
                    </p>
                )}
            </div>
        </ModalCentro>
    );
};

export default ProductosMovimiento;
