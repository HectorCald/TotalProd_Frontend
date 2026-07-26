import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFormatNumberPrice from '../../../../hooks/useFormatNumberPrice';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import EliminarMovimiento from './EliminarMovimiento';
import AnularMovimiento from './AnularMovimiento';
import ProductosMovimiento from './ProductosMovimiento';
import movimientosAcopioService from '../../../../services/movimientosAcopioService';
import gastosService from '../../../../services/gastosService';
import { useToast } from '../../../../context/ToastContext';
import deudasService from '../../../../services/deudasService';
import ViewInfoPago from '../../../finanzas/pagos/modals/ViewInfo';
import ViewInfoPedido from '../../pedidos/modals/ViewInfo';
import ViewInfoDeuda from '../../../finanzas/deudas/modals/ViewInfo';
import pedidosAlmacenService from '../../../../services/pedidosAlmacenService';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import Link from '../../../../components/common/outputs/Link';
import Skeleton from '../../../../components/common/widgets/Skeleton';
import DescargarDatos from '../../../../components/ui/DescargarDatos';
import { LEGACY_PERCENTAGE_CUTOFF_DATE } from '../../../../constants/movimientosConstants';

const ViewInfo = ({ isOpen, onClose, movimiento: propsMovimiento, onEdit, onEliminar, onAnular }) => {
    const { formatPrice } = useFormatNumber();
    const { calculateSubtotal, calculateSpecialPrice } = useFormatNumberPrice();
    const { showDanger } = useToast();
    const navigate = useNavigate();
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    
    const [isParentLoading, setIsParentLoading] = useState(false);
    const [parentMovimiento, setParentMovimiento] = useState(null);
    const [isParentViewOpen, setIsParentViewOpen] = useState(false);

    const [isPagoViewOpen, setIsPagoViewOpen] = useState(false);
    const [selectedPago, setSelectedPago] = useState(null);
    const [loadingPago, setLoadingPago] = useState(false);

    const [isDeudaViewOpen, setIsDeudaViewOpen] = useState(false);
    const [selectedDeuda, setSelectedDeuda] = useState(null);
    const [loadingDeuda, setLoadingDeuda] = useState(false);

    const [isPedidoViewOpen, setIsPedidoViewOpen] = useState(false);
    const [selectedPedido, setSelectedPedido] = useState(null);
    const [loadingPedido, setLoadingPedido] = useState(false);

    const [hideGastos, setHideGastos] = useState(false);
    const [hideDeudas, setHideDeudas] = useState(false);

    const [fullMovimiento, setFullMovimiento] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);

    React.useEffect(() => {
        if (isOpen && propsMovimiento && !propsMovimiento.product) {
            if (fullMovimiento && fullMovimiento.id === propsMovimiento.id) {
                return;
            }
            
            setFullMovimiento(null);
            setIsLoadingDetails(true);
            
            movimientosAlmacenService.getRelations(propsMovimiento.id, propsMovimiento.sucu_id)
                .then(res => {
                    if (res && res.success) {
                        setFullMovimiento({ id: propsMovimiento.id, ...res.data });
                    } else {
                        showDanger(null, 'No se pudieron cargar los detalles del movimiento');
                    }
                })
                .catch(() => {
                    showDanger(null, 'Error de red al cargar detalles');
                })
                .finally(() => {
                    setIsLoadingDetails(false);
                });
        }
    }, [isOpen, propsMovimiento, fullMovimiento, showDanger]);

    const movimiento = propsMovimiento?.product ? propsMovimiento : (fullMovimiento ? { ...propsMovimiento, ...fullMovimiento } : propsMovimiento);

    React.useEffect(() => {
        if (isOpen) {
            setHideGastos(false);
            setHideDeudas(false);
        }
    }, [isOpen, propsMovimiento]);

    const handleVerEntrada = async () => {
        setIsParentLoading(true);
        try {
            const res = await movimientosAcopioService.getById(movimiento.movimiento_entrada_id);
            if (res.success) {
                setParentMovimiento(res.data);
                setIsParentViewOpen(true);
            } else {
                showDanger(null, 'No se pudo obtener el movimiento principal');
            }
        } catch (error) {
            showDanger(null, 'Error de conexión');
        } finally {
            setIsParentLoading(false);
        }
    };

    const handleVerPago = async () => {
        const pagoId = Array.isArray(movimiento.gastos) ? movimiento.gastos[0]?.id : movimiento.gastos?.id;
        if (!pagoId) return;

        setLoadingPago(true);
        try {
            const res = await gastosService.getById(pagoId);
            if (res.success) {
                setSelectedPago(res.data);
                setIsPagoViewOpen(true);
            } else {
                setHideGastos(true);
                showDanger(null, 'El pago fue eliminado o no existe. Actualizando vista...');
            }
        } catch (error) {
            setHideGastos(true);
            showDanger(null, 'El pago fue eliminado o no existe. Actualizando vista...');
        } finally {
            setLoadingPago(false);
        }
    };

    const handleVerDeuda = async () => {
        const deudaId = Array.isArray(movimiento.deudas) ? movimiento.deudas[0]?.id : movimiento.deudas?.id;
        if (!deudaId) return;

        setLoadingDeuda(true);
        try {
            const res = await deudasService.getById(deudaId);
            if (res.success) {
                setSelectedDeuda(res.data);
                setIsDeudaViewOpen(true);
            } else {
                setHideDeudas(true);
                showDanger(null, 'La deuda fue eliminada o no existe. Actualizando vista...');
            }
        } catch (error) {
            setHideDeudas(true);
            showDanger(null, 'La deuda fue eliminada o no existe. Actualizando vista...');
        } finally {
            setLoadingDeuda(false);
        }
    };

    const handleVerPedido = async () => {
        let pedidoId = null;
        if (movimiento.pedidos_entrada && Array.isArray(movimiento.pedidos_entrada) && movimiento.pedidos_entrada.length > 0) {
            pedidoId = movimiento.pedidos_entrada[0].id;
        } else if (movimiento.pedidos_salida && Array.isArray(movimiento.pedidos_salida) && movimiento.pedidos_salida.length > 0) {
            pedidoId = movimiento.pedidos_salida[0].id;
        } else if (movimiento.pedidos_entrada?.id) {
            pedidoId = movimiento.pedidos_entrada.id;
        } else if (movimiento.pedidos_salida?.id) {
            pedidoId = movimiento.pedidos_salida.id;
        }

        if (!pedidoId) return;

        setLoadingPedido(true);
        try {
            const res = await pedidosAlmacenService.getById(pedidoId);
            if (res.success) {
                setSelectedPedido(res.data);
                setIsPedidoViewOpen(true);
            } else {
                showDanger(null, 'No se pudo obtener el pedido: ' + (res.message || ''));
            }
        } catch (error) {
            showDanger(null, 'Error de conexión al obtener el pedido');
        } finally {
            setLoadingPedido(false);
        }
    };

    const handleMovimientoEliminado = (id) => {
        onClose();
        if (onEliminar) onEliminar(id);
    };

    const handleMovimientoAnulado = (updatedMovimiento) => {
        if (onAnular) onAnular(updatedMovimiento);
    };

    const handleCopiarMovimiento = () => {
        const ventaData = {
            prices_types_id: movimiento.prices_types_id || movimiento.precio?.id,
            modalidad: movimiento.agrupado ? 'grupos' : 'unidades',
            productos_lista: (movimiento.productos || []).map(p => {
                const grup = parseFloat(p.producto?.grup || p.grup) || 0;
                const cantidadUD = parseFloat(p.cantidad || p.pivot?.cantidad) || 1;
                const esPorGrupo = movimiento.agrupado && grup > 0;
                return {
                    id: p.producto?.id || p.producto_almacen_id || p.products_id || p.id,
                    cantidad: esPorGrupo ? Math.floor(cantidadUD / grup) : cantidadUD
                };
            }),
            cliente_id: movimiento.clients_id || movimiento.cliente?.id || movimiento.suppliers_id || movimiento.proveedor?.id,
            descuento: parseFloat(movimiento.descuento) || 0,
            aumento: parseFloat(movimiento.aumento) || 0,
            porcentaje: !!movimiento.porcentaje,
            metodo_pago: movimiento.metodo_pago,
            fecha: movimiento.fecha || movimiento.date || movimiento.created_at || new Date().toISOString()
        };
        localStorage.removeItem('ventaEnProgreso');
        localStorage.removeItem('entradaEnProgreso');
        sessionStorage.setItem('movimientoParaCopiar', JSON.stringify(ventaData));
        onClose();
        navigate('/almacen/salidas/copia');
    };

    const rawFechaStr = movimiento?.fecha || movimiento?.date || movimiento?.created_at || '';
    const fechaLiteral = useFechaLiteral(rawFechaStr, false) || (rawFechaStr ? new Date(rawFechaStr).toLocaleDateString() : '');

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

    // Cliente / Proveedor logic to be pushed to stats below

    // Responsable logic moved to stats

    if (movimiento.type === 'salida' && movimiento.metodo_pago) {
        const metodo = movimiento.metodo_pago.toLowerCase();
        tags.push({
            label: 'Pago',
            text: metodo.charAt(0).toUpperCase() + metodo.slice(1),
            icon: 'credit-card'
        });
    }

    tags.push({
        label: 'Tipo',
        text: movimiento.type === 'entrada' ? 'Entrada' : movimiento.type === 'transferencia' ? 'Transferencia' : 'Salida',
        icon: 'transfer'
    });

    if (movimiento.agrupado !== undefined && movimiento.agrupado !== null) {
        tags.push({
            label: 'Modalidad',
            text: movimiento.agrupado ? 'Grupos' : 'Unidades',
            icon: movimiento.agrupado ? 'layer' : 'box'
        });
    }

    const stats = [];
    
    /*
    const responsableNombre = movimiento?.user?.name || movimiento?.personal?.name || '';
    if (responsableNombre) {
        stats.push({
            label: 'Responsable',
            value: responsableNombre,
            icon: 'user'
        });
    }
    */

    if (clienteProveedorNombre) {
        stats.push({
            label: esProveedor ? 'Proveedor' : 'Cliente',
            value: clienteProveedorNombre,
            icon: esProveedor ? 'building' : 'id-card'
        });
    }

    if (movimiento.precio && movimiento.precio.name) {
        stats.push({
            label: 'Precio',
            value: movimiento.precio.name,
            icon: 'dollar'
        });
    }

    if (isAcopio) {
        stats.push({
            label: 'Cantidad',
            value: `${movimiento.quantity || '0'} ${movimiento.product?.type_measure?.code || ''}`,
            icon: ''
        });
    }

    const observaciones = movimiento.observaciones || movimiento.observations || movimiento.detalle || '';
    if (observaciones) {
        stats.push({
            label: 'Observaciones',
            value: observaciones,
            icon: 'detail'
        });
    }
    
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
            } else if (movimiento.productos && movimiento.productos.length === 1) {
                title = movimiento.productos[0]?.producto?.name || (movimiento.type === 'entrada' ? 'Entrada rapida' : 'Venta rapida');
            } else {
                title = movimiento.type === 'entrada' ? 'Entrada rapida' : 'Venta rapida';
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
    let isLegacyPercentage = false;

    if (!isAcopio) {
        subtotalNum = movimiento.subtotal !== undefined 
            ? parseFloat(movimiento.subtotal) 
            : (movimiento.productos || []).reduce((sum, p) => sum + (parseFloat(p.subtotal) || calculateSubtotal(p.cantidad || p.pivot?.cantidad, p.precio_unitario || p.pivot?.precio_unitario || p.precio || p.pivot?.precio, p.producto?.grup, movimiento?.agrupado, movimiento?.type === 'salida' || movimiento?.tipo === 'salida')), 0);
        descValNum = parseFloat(movimiento.descuento) || 0;
        aumValNum = parseFloat(movimiento.aumento) || 0;
        esPorcentaje = movimiento.porcentaje;
        
        const dateStr = movimiento.fecha ? (movimiento.fecha.split('T')[0] || movimiento.fecha.substring(0, 10)) : '';
        isLegacyPercentage = esPorcentaje && dateStr && dateStr <= LEGACY_PERCENTAGE_CUTOFF_DATE;

        descCalculadoNum = esPorcentaje 
            ? (isLegacyPercentage ? descValNum : (subtotalNum * descValNum / 100)) 
            : descValNum;
        aumCalculadoNum = esPorcentaje 
            ? (isLegacyPercentage ? aumValNum : (subtotalNum * aumValNum / 100)) 
            : aumValNum;
            
        let totalFinalRaw = subtotalNum - descCalculadoNum + aumCalculadoNum;
        totalFinalNum = totalFinalRaw;
    }

    const financeItems = [];
    if (!isAcopio) {
        financeItems.push({ clave: 'Subtotal', valor: `Bs. ${formatPrice(subtotalNum)}` });
        if (descValNum > 0) {
            const descPerc = esPorcentaje 
                ? (isLegacyPercentage && subtotalNum > 0 ? (descValNum / subtotalNum) * 100 : descValNum) 
                : (subtotalNum > 0 ? (descValNum / subtotalNum) * 100 : 0);
            financeItems.push({ 
                clave: `Descuento ${esPorcentaje ? `(${formatPrice(descPerc)}%)` : '(Bs.)'}`, 
                valor: `- Bs. ${formatPrice(descCalculadoNum)}`,
                colorValor: 'var(--error-color)'
            });
        }
        if (aumValNum > 0) {
            const aumPerc = esPorcentaje 
                ? (isLegacyPercentage && subtotalNum > 0 ? (aumValNum / subtotalNum) * 100 : aumValNum) 
                : (subtotalNum > 0 ? (aumValNum / subtotalNum) * 100 : 0);
            financeItems.push({ 
                clave: `Aumento ${esPorcentaje ? `(${formatPrice(aumPerc)}%)` : '(Bs.)'}`, 
                valor: `+ Bs. ${formatPrice(aumCalculadoNum)}`,
                colorValor: 'var(--success-color)'
            });
        }

        if (movimiento.type === 'salida') {
            let costoTotal = 0;
            (movimiento.productos || []).forEach(p => {
                const cant = parseFloat(p.pivot?.cantidad ?? p.cantidad ?? 0);
                const costoUnit = parseFloat(p.producto?.costo_produccion ?? 0);
                costoTotal += costoUnit * cant;
            });
            let gananciaNeta = totalFinalNum - costoTotal;
            financeItems.push({ 
                clave: 'Ganancia Neta', 
                valor: `Bs. ${formatPrice(gananciaNeta)}`,
                colorValor: gananciaNeta >= 0 ? 'var(--success-color)' : 'var(--error-color)'
            });
        }
    }

    const informacionSuperiorDescarga = {
        'Fecha': fechaLiteral,
        'Cliente': clienteProveedorNombre || 'Cliente ocasional',
        'Método de pago': movimiento?.metodo_pago || ''
    };
    
    if (movimiento?.codigo) informacionSuperiorDescarga['Código'] = movimiento.codigo;
    if (movimiento?.agrupado !== undefined && movimiento?.agrupado !== null) {
        informacionSuperiorDescarga['Modalidad'] = movimiento.agrupado ? 'Grupos' : 'Unidades';
    }
    if (movimiento?.precio?.name) {
        informacionSuperiorDescarga['Tipo de Precio'] = movimiento.precio.name;
    }
    if (movimiento?.concepto) informacionSuperiorDescarga['Concepto'] = movimiento.concepto;
    if (observaciones) informacionSuperiorDescarga['Observaciones'] = observaciones;

    if (descValNum > 0) informacionSuperiorDescarga['Descuento'] = `Bs. ${formatPrice(descCalculadoNum)}`;
    if (aumValNum > 0) informacionSuperiorDescarga['Aumento'] = `Bs. ${formatPrice(aumCalculadoNum)}`;
    informacionSuperiorDescarga['Total'] = `Bs. ${formatPrice(totalFinalNum)}`;


    const tablaHeadersDescarga = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const tablaValoresDescarga = (movimiento?.productos || []).map(p => {
        const cant = Number(p.pivot?.cantidad ?? p.cantidad ?? 0);
        const prec = p.pivot?.precio_unitario ?? p.precio_unitario ?? p.pivot?.precio ?? p.precio ?? 0;
        const name = p.name || p.producto?.name || 'Desconocido';
        const code = p.type_measure?.code || p.producto?.type_measure?.code || '';
        
        const grup = Number(p.producto?.grup ?? p.grup ?? 0);
        const esAgrupado = movimiento?.agrupado && grup > 0;
        const esVenta = movimiento?.type === 'salida' || movimiento?.tipo === 'salida';
        
        let cantidadStr = `${cant}`;
        let precioDescarga = calculateSpecialPrice(prec, grup, esAgrupado, esVenta);
        const subt = calculateSubtotal(cant, prec, grup, movimiento?.agrupado, esVenta);

        if (esAgrupado) {
            const cantEnGrupos = cant / grup;
            cantidadStr = Number.isInteger(cantEnGrupos) ? cantEnGrupos.toString() : cantEnGrupos.toFixed(2);
        } else {
            cantidadStr = `${cant} ${code}`.trim();
        }
        
        return [
            name,
            cantidadStr,
            `Bs. ${formatPrice(precioDescarga)}`,
            `Bs. ${formatPrice(subt)}`
        ];
    });

    const handleDescargarVenta = () => {
        setIsDescargaOpen(true);
    };

    return (
        <>
        <ModalCentro
            isOpen={isOpen && !isParentViewOpen && !isPagoViewOpen && !isDeudaViewOpen && !isPedidoViewOpen && !isProductosOpen && !isAnularOpen && !isEliminarOpen && !isDescargaOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                onClose();
                if (onEdit) onEdit(movimiento);
            }}
            hideFooter={true}
            width="450px"
            receipt={true}
        >
                <InfoCard
                    title={`${title}${movimiento.numero_orden ? ` (Nº ${movimiento.numero_orden})` : ''}`}
                    subtitle={fechaLiteral}
                    statusDot={movimiento.estado === 'anulado' ? 'error' : 'info'}
                    icon="transfer"
                    customBlock={
                        <>
                            {movimiento.type === 'salida' && (
                                <div style={{ marginBottom: '15px' }}>
                                    <Link 
                                        text="Descargar Venta" 
                                        iconEnd="right-arrow-alt" 
                                        onClick={handleDescargarVenta} 
                                        readOnly={isLoadingDetails}
                                    />
                                </div>
                            )}
                            {tags.length > 0 && (
                                <ColumnInfo items={tags.map(t => ({ text: t.text, icon: t.icon }))} />
                            )}
                            {stats.length > 0 && (
                                <ColumnInfo 
                                    title="Detalles"
                                    items={stats.map(s => ({ clave: s.label, valor: s.value }))}
                                />
                            )}
                            {!isAcopio && (
                                <ColumnInfo 
                                    title="Finanzas"
                                    items={financeItems}
                                    finance={true}
                                    financeTotal={`Bs. ${formatPrice(totalFinalNum)}`}
                                />
                            )}
                        </>
                    }
                    actionButton={
                        <>
                            {!isAcopio && isLoadingDetails ? (
                                <Skeleton width="100%" height="44px" style={{ borderRadius: '8px' }} />
                            ) : (
                                <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                                    {!isAcopio && (
                                        <Boton
                                            label="Productos"
                                            iconName="box"
                                            className="btn-primary"
                                            style={{ flex: 1 }}
                                            onClick={() => setIsProductosOpen(true)}
                                        />
                                    )}
                                    {isAcopio && movimiento.movimiento_entrada_id && (
                                        <BotonIcon
                                            iconName="file"
                                            className="btn-primary"
                                            tooltip="Movimiento principal"
                                            loading={isParentLoading}
                                            onClick={handleVerEntrada}
                                        />
                                    )}
                                    
                                    {movimiento.gastos && (Array.isArray(movimiento.gastos) ? movimiento.gastos.length > 0 : Object.keys(movimiento.gastos).length > 0) && !hideGastos && (
                                        <BotonIcon
                                            iconName="wallet"
                                            className="btn-primary"
                                            tooltip="Pago Registrado"
                                            loading={loadingPago}
                                            onClick={handleVerPago}
                                        />
                                    )}
                                    {movimiento.deudas && (Array.isArray(movimiento.deudas) ? movimiento.deudas.length > 0 : Object.keys(movimiento.deudas).length > 0) && !hideDeudas && (
                                        <BotonIcon
                                            iconName="credit-card"
                                            className="btn-primary"
                                            tooltip="Deuda Asociada"
                                            loading={loadingDeuda}
                                            onClick={handleVerDeuda}
                                        />
                                    )}
                                    {!isAcopio && ((movimiento.pedidos_entrada && (Array.isArray(movimiento.pedidos_entrada) ? movimiento.pedidos_entrada.length > 0 : Object.keys(movimiento.pedidos_entrada).length > 0)) || (movimiento.pedidos_salida && (Array.isArray(movimiento.pedidos_salida) ? movimiento.pedidos_salida.length > 0 : Object.keys(movimiento.pedidos_salida).length > 0))) && (
                                        <BotonIcon
                                            iconName="package"
                                            className="btn-primary"
                                            tooltip="Pedido Asociado"
                                            loading={loadingPedido}
                                            onClick={handleVerPedido}
                                        />
                                    )}
                                    {/* {movimiento.estado !== 'anulado' && !(isAcopio && movimiento.movimiento_entrada_id) && (
                                        <BotonIcon
                                            iconName="edit"
                                            className="btn-primary"
                                            tooltip="Editar Movimiento"
                                            onClick={() => {
                                                if (onEdit) onEdit(movimiento);
                                            }}
                                        />
                                    )} */}

                                    {movimiento.type !== 'entrada' && (
                                        <BotonIcon
                                            iconName="copy"
                                            className="btn-primary"
                                            tooltip="Copiar Movimiento"
                                            tooltipAlign="end"
                                            onClick={handleCopiarMovimiento}
                                        />
                                    )}
                                    {movimiento.estado !== 'anulado' && (
                                        <BotonIcon
                                            iconName="block"
                                            className="btn-warning"
                                            tooltip="Anular Movimiento"
                                            tooltipAlign="end"
                                            onClick={() => setIsAnularOpen(true)}
                                        />
                                    )}
                                    {movimiento.estado === 'anulado' && !(isAcopio && movimiento.movimiento_entrada_id) && (
                                        <BotonIcon
                                            iconName="trash"
                                            className="btn-error"
                                            tooltip="Eliminar Movimiento"
                                            tooltipAlign="end"
                                            onClick={() => setIsEliminarOpen(true)}
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    }
                />
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

        <ViewInfo
            isOpen={isParentViewOpen}
            onClose={() => setIsParentViewOpen(false)}
            movimiento={parentMovimiento}
        />

        <ViewInfoPago
            isOpen={isPagoViewOpen}
            onClose={() => setIsPagoViewOpen(false)}
            pago={selectedPago}
            onEliminar={(id) => {
                setHideGastos(true);
            }}
        />

        <ViewInfoDeuda
            isOpen={isDeudaViewOpen}
            onClose={() => setIsDeudaViewOpen(false)}
            deuda={selectedDeuda}
            onEliminar={(id) => {
                setHideDeudas(true);
            }}
        />

        <ViewInfoPedido
            isOpen={isPedidoViewOpen}
            setIsOpen={setIsPedidoViewOpen}
            onClose={() => setIsPedidoViewOpen(false)}
            pedido={selectedPedido}
            onIngresar={(updatedPedido) => {
                setIsPedidoViewOpen(false);
                if (updatedPedido && updatedPedido.estado === 'Pendiente') {
                    onClose();
                    if (onEliminar) onEliminar(movimiento.id);
                }
            }}
        />

        <DescargarDatos
            isOpen={isDescargaOpen}
            setIsOpen={setIsDescargaOpen}
            titulo="Descargar Venta"
            subtitulo="SELECCIONA EL FORMATO QUE PREFIERAS PARA DESCARGAR."
            informacionSuperior={informacionSuperiorDescarga}
            tablaHeaders={tablaHeadersDescarga}
            tablaValores={tablaValoresDescarga}
            nombreArchivo="NT"
            tituloDocumento="NOTA DE ENTREGA"
            esMovimiento={true}
            fechaMovimiento={rawFechaStr}
            clienteInfo={{
                nombre: clienteProveedorNombre || '',
                numeroOrden: movimiento?.numero_orden || ''
            }}
        />
        </>
    );
};

export default ViewInfo;
