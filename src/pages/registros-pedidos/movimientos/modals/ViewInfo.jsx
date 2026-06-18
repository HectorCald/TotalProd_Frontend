import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import EliminarMovimiento from './EliminarMovimiento';
import AnularMovimiento from './AnularMovimiento';
import ProductosMovimiento from './ProductosMovimiento';

const ViewInfo = ({ isOpen, onClose, movimiento, onEdit, onEliminar, onAnular }) => {
    const { formatPrice } = useFormatNumber();
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);

    const handleMovimientoEliminado = (id) => {
        onClose();
        if (onEliminar) onEliminar(id);
    };

    const handleMovimientoAnulado = (updatedMovimiento) => {
        if (onAnular) onAnular(updatedMovimiento);
    };

    const rawFechaStr = movimiento?.fecha || movimiento?.date || '';
    const fechaStr = rawFechaStr ? rawFechaStr.slice(0, 10) : '';
    const fechaLiteral = useFechaLiteral(fechaStr, true) || (rawFechaStr ? new Date(rawFechaStr).toLocaleDateString() : '');

    if (!movimiento) return null;

    const isAcopio = !!movimiento.product;

    const tags = [].filter(Boolean);

    if (movimiento.codigo) {
        tags.push({
            label: 'Código',
            text: movimiento.codigo,
            icon: 'hash'
        });
    }

    if (movimiento.precio && movimiento.precio.name) {
        tags.push({
            label: 'Precio',
            text: movimiento.precio.name,
            icon: 'dollar'
        });
    }



    let clienteProveedorNombre = '';
    let esProveedor = false;
    if (isAcopio) {
        if (movimiento.type === 'entrada') {
            clienteProveedorNombre = movimiento.proveedor?.name || '';
            esProveedor = true;
        } else {
            clienteProveedorNombre = movimiento.cliente?.name || '';
        }
    } else {
        if (movimiento.type === 'transferencia') {
            clienteProveedorNombre = movimiento.cliente?.name || '';
        } else {
            if (movimiento.type === 'entrada') {
                clienteProveedorNombre = movimiento.proveedor?.name || '';
                esProveedor = true;
            } else {
                clienteProveedorNombre = movimiento.cliente?.name || '';
            }
        }
    }

    if (clienteProveedorNombre) {
        tags.push({
            label: esProveedor ? 'Proveedor' : 'Cliente',
            text: clienteProveedorNombre,
            icon: esProveedor ? 'building' : 'user'
        });
    }

    const responsableNombre = movimiento?.user?.name || movimiento?.personal?.name || '';
    if (responsableNombre) {
        tags.push({
            label: 'Responsable',
            text: responsableNombre,
            icon: 'user'
        });
    }

    if (movimiento.type === 'salida' && movimiento.metodo_pago) {
        const metodo = movimiento.metodo_pago.toLowerCase();
        tags.push({
            label: 'Pago',
            text: metodo.charAt(0).toUpperCase() + metodo.slice(1),
            icon: 'credit-card'
        });
    }

    const obtenerTotalFormateado = (mov) => {
        if (isAcopio) {
            const candidatosTotales = [mov.total, mov.total_general, mov.total_calculado];
            const totalAcopio = candidatosTotales
                .map((valor) => {
                    const numero = parseFloat(valor);
                    return Number.isNaN(numero) ? null : numero;
                })
                .find((numero) => numero !== null);
            if (typeof totalAcopio === 'number') return formatPrice(totalAcopio);
            const quantity = parseFloat(mov.quantity) || 0;
            const price = parseFloat(mov.product?.precio) || parseFloat(mov.product?.price) || 0;
            return formatPrice(quantity * price);
        }

        let subtotal = (mov.productos || []).reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0);
        subtotal = Math.round(subtotal * 10) / 10;
        const descuento = parseFloat(mov.descuento) || 0;
        const aumento = parseFloat(mov.aumento) || 0;
        const esPorcentaje = mov.porcentaje;
        
        let totalFinal = subtotal;
        if (esPorcentaje) {
            totalFinal = totalFinal - (totalFinal * (descuento / 100)) + (totalFinal * (aumento / 100));
        } else {
            totalFinal = totalFinal - descuento + aumento;
        }
        
        totalFinal = Math.round(totalFinal * 10) / 10;
        
        return formatPrice(totalFinal);
    };

    const stats = [];
    
    stats.push({
        label: 'Tipo',
        value: movimiento.type === 'entrada' ? 'Entrada' : movimiento.type === 'transferencia' ? 'Transferencia' : 'Salida',
        icon: 'transfer'
    });

    if (movimiento.agrupado !== undefined && movimiento.agrupado !== null) {
        stats.push({
            label: 'Modalidad',
            value: movimiento.agrupado ? 'Grps.' : 'Unds.',
            icon: movimiento.agrupado ? 'layer' : 'box'
        });
    }

    if (isAcopio) {
        stats.push({
            label: 'Cantidad',
            value: `${movimiento.quantity || '0'} ${movimiento.product?.type_measure?.code || ''}`,
            icon: ''
        });
        stats.push({
            label: 'Total',
            value: `Bs. ${obtenerTotalFormateado(movimiento)}`,
            icon: ''
        });
    } else {
        stats.push({
            label: 'Productos',
            value: movimiento.productos?.length || 0,
            icon: 'package'
        });
    }

    stats.push({
        label: 'Fecha',
        value: fechaLiteral,
        icon: 'calendar'
    });
    
    let title = '';
    if (isAcopio) {
        title = movimiento.product?.name || 'Sin producto';
    } else {
        if (movimiento.type === 'transferencia') {
            if (movimiento.concepto && movimiento.concepto.trim() !== '') {
                title = movimiento.concepto;
            } else {
                const origen = movimiento.sucursal_origen?.name || movimiento.sucursal?.name || 'Origen';
                const destino = movimiento.sucursal_destino?.name || 'Destino';
                title = `${origen} > ${destino}`;
            }
        } else if (movimiento.concepto && movimiento.concepto.trim() !== '') {
            title = movimiento.concepto;
        } else {
            const clienteNombre = movimiento.type === 'entrada' 
                ? (movimiento.proveedor?.name || null)
                : (movimiento.cliente?.name || null);
            if (clienteNombre) {
                title = clienteNombre;
            } else if (movimiento.productos && movimiento.productos.length > 0) {
                title = movimiento.productos.length === 1
                    ? movimiento.productos[0]?.producto?.name || 'Sin producto'
                    : `${movimiento.productos.length} productos`;
            } else {
                title = 'Sin productos';
            }
        }
    }

    // Cálculos para el bloque personalizado
    let subtotalNum = 0;
    let descValNum = 0;
    let aumValNum = 0;
    let esPorcentaje = false;
    let totalFinalNum = 0;
    let descCalculadoNum = 0;
    let aumCalculadoNum = 0;

    if (!isAcopio) {
        subtotalNum = (movimiento.productos || []).reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0);
        subtotalNum = Math.round(subtotalNum * 10) / 10;
        descValNum = parseFloat(movimiento.descuento) || 0;
        aumValNum = parseFloat(movimiento.aumento) || 0;
        esPorcentaje = movimiento.porcentaje;
        
        if (esPorcentaje) {
            descCalculadoNum = subtotalNum * (descValNum / 100);
            aumCalculadoNum = subtotalNum * (aumValNum / 100);
        } else {
            descCalculadoNum = descValNum;
            aumCalculadoNum = aumValNum;
        }
        let totalFinalRaw = subtotalNum - descCalculadoNum + aumCalculadoNum;
        totalFinalNum = Math.round(totalFinalRaw * 10) / 10;
    }

    return (
        <>
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                onClose();
                if (onEdit) onEdit(movimiento);
            }}
            hideFooter={true}
            width="450px"
        >
            <div style={{ margin: '-10px -24px -24px -24px' }}>
                <InfoCard
                    title={`${title}${movimiento.numero_orden ? ` (Nº ${movimiento.numero_orden})` : ''}`}
                    subtitle="Información del Movimiento"
                    description={movimiento.observaciones || movimiento.detalle || ''}
                    statusDot={movimiento.estado === 'anulado' ? 'error' : 'info'}
                    tags={tags}
                    stats={stats}
                    icon="transfer"
                    customBlock={
                        !isAcopio && (
                            <div style={{
                                backgroundColor: 'var(--main-bg)',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                marginBottom: '16px'
                            }}>
                                {(descValNum > 0 || aumValNum > 0) && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--secondary-color)', fontSize: '14px' }}>
                                        <span>Subtotal:</span>
                                        <span>Bs. {formatPrice(subtotalNum)}</span>
                                    </div>
                                )}
                                
                                {descValNum > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--error-color)', fontSize: '14px' }}>
                                        <span>Descuento {esPorcentaje ? `(${formatPrice(descValNum)}%)` : '(Bs.)'}:</span>
                                        <span>- Bs. {formatPrice(descCalculadoNum)}</span>
                                    </div>
                                )}

                                {aumValNum > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)', fontSize: '14px' }}>
                                        <span>Aumento {esPorcentaje ? `(${formatPrice(aumValNum)}%)` : '(Bs.)'}:</span>
                                        <span>+ Bs. {formatPrice(aumCalculadoNum)}</span>
                                    </div>
                                )}

                                <div style={{ 
                                    paddingTop: '10px', 
                                    marginTop: '4px',
                                    borderTop: '1px dashed var(--quaternary-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: '500' }}>Total:</span>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--secondary-color)' }}>
                                        Bs. {formatPrice(totalFinalNum)}
                                    </span>
                                </div>
                            </div>
                        )
                    }
                    actionButton={
                        <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'flex-end' }}>
                            {!isAcopio && (
                                <Boton
                                    label="Productos"
                                    iconName="box"
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => setIsProductosOpen(true)}
                                />
                            )}
                            {movimiento.estado !== 'anulado' && (
                                <BotonIcon
                                    iconName="edit"
                                    className="btn-primary"
                                    tooltip="Editar Movimiento"
                                    tooltipAlign="end"
                                    onClick={() => {
                                        onClose();
                                        if (onEdit) onEdit(movimiento);
                                    }}
                                />
                            )}
                        </div>
                    }
                />
            </div>
        </ModalCentro>

        <EliminarMovimiento
            isOpen={isEliminarOpen}
            onClose={() => setIsEliminarOpen(false)}
            movimientoSeleccionado={movimiento}
            onEliminar={handleMovimientoEliminado}
        />

        <AnularMovimiento
            isOpen={isAnularOpen}
            onClose={() => setIsAnularOpen(false)}
            movimientoSeleccionado={movimiento}
            onAnular={handleMovimientoAnulado}
        />

        <ProductosMovimiento
            isOpen={isProductosOpen}
            onClose={() => setIsProductosOpen(false)}
            movimientoActual={movimiento}
            movimiento={movimiento}
        />
        </>
    );
};

export default ViewInfo;
