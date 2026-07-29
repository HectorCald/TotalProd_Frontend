import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFormatNumberPrice from '../../../../hooks/useFormatNumberPrice';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import ProductosMovimiento from '../../../registros-pedidos/movimientos/modals/ProductosMovimiento';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import ViewInfoMovimiento from '../../../registros-pedidos/movimientos/modals/ViewInfo';
import IngresarPedido from './IngresarPedido';
import AnularIngreso from './AnularIngreso';
import AnularEntrega from './AnularEntrega';
import EliminarPedido from './EliminarPedido';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import DescargarDatos from '../../../../components/ui/DescargarDatos';
import Link from '../../../../components/common/outputs/Link';

const ViewInfo = ({ isOpen, setIsOpen, onClose, pedido, onEdit, onEliminar, onAnular, onIngresar }) => {
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isViewMovimientoOpen, setIsViewMovimientoOpen] = useState(false);
    const [selectedMovimiento, setSelectedMovimiento] = useState(null);
    const [loadingMovimiento, setLoadingMovimiento] = useState(false);
    const [loadingMovimientoEntrada, setLoadingMovimientoEntrada] = useState(false);
    const [isIngresarOpen, setIsIngresarOpen] = useState(false);
    const [loadingIngreso, setLoadingIngreso] = useState(false);
    const [dataParaIngreso, setDataParaIngreso] = useState(null);
    const [isAnularIngresoOpen, setIsAnularIngresoOpen] = useState(false);
    const [isAnularEntregaOpen, setIsAnularEntregaOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const { formatPrice } = useFormatNumber();
    const { calculateSubtotal, calculateSpecialPrice } = useFormatNumberPrice();
    const { showDanger } = useToast();
    const navigate = useNavigate();

    const handleVerMovimiento = async (movimientoId, tipo = 'salida') => {
        if (!movimientoId) return;
        
        if (tipo === 'entrada') setLoadingMovimientoEntrada(true);
        else setLoadingMovimiento(true);

        try {
            const response = await movimientosAlmacenService.getById(movimientoId);
            if (response.success && response.data) {
                setSelectedMovimiento(response.data);
                setIsViewMovimientoOpen(true);
            } else {
                showDanger(null, response.message || 'Error al obtener el movimiento');
            }
        } catch (error) {
            showDanger(null, 'Error de conexión');
        } finally {
            if (tipo === 'entrada') setLoadingMovimientoEntrada(false);
            else setLoadingMovimiento(false);
        }
    };

    const handlePrepararIngreso = async () => {
        if (!pedido.movimiento_salida_id) {
            showDanger(null, 'El pedido no tiene un movimiento de salida asociado.');
            return;
        }
        setLoadingIngreso(true);
        try {
            const response = await movimientosAlmacenService.getById(pedido.movimiento_salida_id);
            if (response.success && response.data) {
                setDataParaIngreso(response.data);
                setIsIngresarOpen(true);
            } else {
                showDanger(null, response.message || 'Error al obtener los detalles del movimiento de salida');
            }
        } catch (error) {
            showDanger(null, 'Error de conexión al obtener detalles');
        } finally {
            setLoadingIngreso(false);
        }
    };

    const rawFechaStr = pedido?.fecha || pedido?.created_at || '';
    const fechaLiteral = useFechaLiteral(rawFechaStr, false, true) || (rawFechaStr ? new Date(rawFechaStr).toLocaleDateString() : '');

    if (!pedido) return null;

    const tags = [].filter(Boolean);

    if (pedido.codigo) {
        tags.push({
            label: 'Código',
            text: pedido.codigo,
            icon: 'hash'
        });
    }

    if (pedido.precio && pedido.precio.name) {
        tags.push({
            label: 'Precio',
            text: pedido.precio.name,
            icon: 'dollar'
        });
    }

    let solicitanteNombre = pedido.user?.name || pedido.personal?.name || '';
    if (solicitanteNombre) {
        tags.push({
            label: 'Solicitante',
            text: solicitanteNombre,
            icon: 'user'
        });
    }

    const obtenerTotalFormateado = (ped) => {
        let total = (ped.pedido_almacen_detalle || []).reduce((sum, detalle) => {
            const precio = parseFloat(detalle.precio) || 0;
            const cantidad = parseFloat(detalle.cantidad) || 0;
            const subtotal = calculateSubtotal(cantidad, precio, detalle.producto_almacen?.grup, ped.agrupado, true);
            return sum + subtotal;
        }, 0);
        
        total = Math.round(total * 10) / 10;
        return total;
    };

    const totalNum = obtenerTotalFormateado(pedido);

    const financeItems = [
        { clave: 'Subtotal', valor: `Bs. ${formatPrice(totalNum)}` }
    ];

    const stats = [];

    if (pedido.sucursales?.name || pedido.sucursal?.name) {
        stats.push({
            label: 'S. Solicitante',
            value: pedido.sucursales?.name || pedido.sucursal?.name,
            icon: 'store'
        });
    }

    if (pedido.sucursal_destino?.name) {
        stats.push({
            label: 'S. Destino',
            value: pedido.sucursal_destino.name,
            icon: 'building'
        });
    }

    if (pedido.agrupado !== undefined && pedido.agrupado !== null) {
        stats.push({
            label: 'Modalidad',
            value: pedido.agrupado ? 'Grupos' : 'Unidades',
            icon: pedido.agrupado ? 'layer' : 'box'
        });
    }

    stats.push({
        label: 'Productos',
        value: pedido.pedido_almacen_detalle?.length || 0,
        icon: 'package'
    });
    
    let title = 'Pedido';

    let statusDotColor = 'error';
    if (pedido.estado === 'Completado') statusDotColor = 'info';
    else if (pedido.estado === 'Entregado') statusDotColor = 'warning';

    const informacionSuperiorDescarga = {};
    if (fechaLiteral) informacionSuperiorDescarga['Fecha'] = fechaLiteral;
    if (pedido.codigo) informacionSuperiorDescarga['Código'] = pedido.codigo;
    if (pedido.numero_pedido) informacionSuperiorDescarga['Nº Pedido'] = pedido.numero_pedido;
    if (solicitanteNombre) informacionSuperiorDescarga['Solicitante'] = solicitanteNombre;
    if (pedido.sucursales?.name || pedido.sucursal?.name) informacionSuperiorDescarga['S. Solicitante'] = pedido.sucursales?.name || pedido.sucursal?.name;
    if (pedido.sucursal_destino?.name) informacionSuperiorDescarga['S. Destino'] = pedido.sucursal_destino.name;
    if (pedido.agrupado !== undefined && pedido.agrupado !== null) {
        informacionSuperiorDescarga['Modalidad'] = pedido.agrupado ? 'Grupos' : 'Unidades';
    }
    if (pedido.precio?.name) informacionSuperiorDescarga['Tipo de Precio'] = pedido.precio.name;
    if (pedido.observaciones) informacionSuperiorDescarga['Observaciones'] = pedido.observaciones;
    
    informacionSuperiorDescarga['Total'] = `Bs. ${formatPrice(totalNum)}`;

    const tablaHeadersDescarga = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const tablaValoresDescarga = (pedido.pedido_almacen_detalle || []).map(p => {
        const cant = Number(p.cantidad ?? 0);
        const prec = Number(p.precio ?? 0);
        const name = p.producto_almacen?.name || 'Desconocido';
        const code = p.producto_almacen?.type_measure?.code || '';
        
        const grup = Number(p.producto_almacen?.grup ?? 0);
        const esAgrupado = pedido?.agrupado && grup > 0;
        
        let cantidadStr = `${cant}`;
        
        let precioDescarga = calculateSpecialPrice(prec, grup, esAgrupado, true);

        const subt = calculateSubtotal(cant, prec, grup, pedido?.agrupado, true);

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

    const handleDescargar = () => setIsDescargaOpen(true);

    return (
        <>
        <ModalCentro
            isOpen={isOpen && !isProductosOpen && !isViewMovimientoOpen && !isIngresarOpen && !isAnularIngresoOpen && !isAnularEntregaOpen && !isEliminarOpen && !isDescargaOpen}
            onClose={() => {
                if (setIsOpen) setIsOpen(false);
                if (onClose) onClose();
            }}
            title=""
            hideFooter={true}
            width="450px"
        >
                <InfoCard
                    title={`${title}${pedido.numero_pedido ? ` (Nº ${pedido.numero_pedido})` : ''}`}
                    subtitle={fechaLiteral}
                    description={pedido.observaciones}
                    statusDot={statusDotColor}
                    icon={'file'}
                    customBlock={
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <Link 
                                    text="Descargar Pedido" 
                                    iconEnd="right-arrow-alt" 
                                    onClick={handleDescargar} 
                                />
                            </div>
                            {tags.length > 0 && (
                                <ColumnInfo items={tags.map(t => ({ text: t.text, icon: t.icon }))} />
                            )}
                            {stats.length > 0 && (
                                <ColumnInfo 
                                    title="Detalles"
                                    items={stats.map(s => ({ clave: s.label, valor: s.value }))}
                                />
                            )}
                            <ColumnInfo 
                                title="Finanzas"
                                items={financeItems}
                                finance={true}
                                financeTotal={`Bs. ${formatPrice(totalNum)}`}
                            />
                        </>
                    }
                    actionButton={
                        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                            <Boton
                                label="Productos"
                                iconName="box"
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => setIsProductosOpen(true)}
                            />
                            
                            {pedido.destino && pedido.estado === 'Pendiente' && (
                                <BotonIcon
                                    iconName="check"
                                    className="btn-primary"
                                    tooltip="Entregar Pedido"
                                    tooltipAlign='end'
                                    onClick={() => {
                                        const entregaData = {
                                            prices_types_id: pedido.precio_id || pedido.precio?.id,
                                            modalidad: pedido.agrupado ? 'grupos' : 'unidades',
                                            productos_lista: (pedido.pedido_almacen_detalle || []).map(p => {
                                                const grup = parseFloat(p.producto_almacen?.grup) || 0;
                                                const cantidadUD = parseFloat(p.cantidad) || 1;
                                                const esPorGrupo = pedido.agrupado && grup > 0;
                                                return {
                                                    id: p.producto_almacen_id || p.producto_almacen?.id || p.id,
                                                    cantidad: esPorGrupo ? Math.floor(cantidadUD / grup) : cantidadUD
                                                };
                                            }),
                                            pedido_id: pedido.id
                                        };
                                        localStorage.removeItem('ventaEnProgreso');
                                        sessionStorage.setItem('pedidoParaEntregar', JSON.stringify(entregaData));
                                        if (setIsOpen) setIsOpen(false);
                                        if (onClose) onClose();
                                        navigate('/almacen/salidas/pedido');
                                    }}
                                />
                            )}

                            {pedido.movimiento_salida_id && (
                                <BotonIcon
                                    iconName="file"
                                    className="btn-primary"
                                    tooltip="Movimiento Salida"
                                    onClick={() => handleVerMovimiento(pedido.movimiento_salida_id, 'salida')}
                                    loading={loadingMovimiento}
                                    disabled={loadingMovimiento || loadingMovimientoEntrada}
                                />
                            )}

                            {pedido.movimiento_entrada_id && (
                                <BotonIcon
                                    iconName="file"
                                    className="btn-primary"
                                    tooltip="Movimiento Entrada"
                                    onClick={() => handleVerMovimiento(pedido.movimiento_entrada_id, 'entrada')}
                                    loading={loadingMovimientoEntrada}
                                    disabled={loadingMovimiento || loadingMovimientoEntrada}
                                />
                            )}

                            {pedido.destino && pedido.estado === 'Entregado' && (
                                <BotonIcon
                                    iconName="block"
                                    className="btn-warning"
                                    tooltip="Anular Entrega"
                                    tooltipAlign="end"
                                    onClick={() => {
                                        setIsAnularEntregaOpen(true);
                                    }}
                                />
                            )}

                            {!pedido.destino && pedido.estado === 'Entregado' && (
                                <BotonIcon
                                    iconName="download"
                                    className="btn-primary"
                                    tooltip="Ingresar Pedido"
                                    tooltipAlign="end"
                                    onClick={handlePrepararIngreso}
                                    loading={loadingIngreso}
                                    disabled={loadingIngreso}
                                />
                            )}

                            {!pedido.destino && pedido.estado === 'Completado' && (
                                <BotonIcon
                                    iconName="block"
                                    className="btn-warning"
                                    tooltip="Anular Ingreso"
                                    tooltipAlign="end"
                                    onClick={() => setIsAnularIngresoOpen(true)}
                                />
                            )}


                            {!pedido.destino && pedido.estado === 'Pendiente' && (
                                <BotonIcon
                                    iconName="edit"
                                    className="btn-primary"
                                    tooltip="Editar Pedido"
                                    onClick={() => {
                                        const editarData = {
                                            id: pedido.id,
                                            prices_types_id: pedido.precio_id || pedido.precio?.id,
                                            modalidad: pedido.agrupado ? 'grupos' : 'unidades',
                                            observaciones: pedido.observaciones === '--' ? '' : (pedido.observaciones || ''),
                                            fecha: pedido.fecha || pedido.date || pedido.created_at || new Date().toISOString(),
                                            sucursal_destino_id: pedido.sucursal_destino_id || pedido.sucursal_destino?.id,
                                            productos_lista: (pedido.pedido_almacen_detalle || []).map(p => {
                                                const grup = parseFloat(p.producto_almacen?.grup) || 0;
                                                const cantidadUD = parseFloat(p.cantidad) || 1;
                                                const esPorGrupo = pedido.agrupado && grup > 0;
                                                return {
                                                    id: p.producto_almacen_id || p.producto_almacen?.id || p.id,
                                                    cantidad: esPorGrupo ? Math.floor(cantidadUD / grup) : cantidadUD
                                                };
                                            })
                                        };
                                        sessionStorage.setItem('pedidoParaEditar', JSON.stringify(editarData));
                                        if (setIsOpen) setIsOpen(false);
                                        if (onClose) onClose();
                                        navigate('/almacen/pedidos/editar');
                                    }}
                                />
                            )}
                            
                            {!pedido.destino && pedido.estado === 'Pendiente' && (
                                <BotonIcon
                                    iconName="trash"
                                    className="btn-error"
                                    tooltip="Eliminar Pedido"
                                    tooltipAlign="end"
                                    onClick={() => setIsEliminarOpen(true)}
                                />
                            )}
                        </div>
                    }
                />
           
        </ModalCentro>

        <ProductosMovimiento
            isOpen={isProductosOpen}
            onClose={() => setIsProductosOpen(false)}
            pedido={pedido}
        />

        {isViewMovimientoOpen && selectedMovimiento && (
            <ViewInfoMovimiento
                isOpen={isViewMovimientoOpen}
                onClose={() => setIsViewMovimientoOpen(false)}
                movimiento={selectedMovimiento}
            />
        )}

        <IngresarPedido
            isOpen={isIngresarOpen}
            setIsOpen={setIsIngresarOpen}
            pedido={pedido}
            movimientoSalida={dataParaIngreso}
            onIngresado={(updatedPedido) => {
                setIsIngresarOpen(false);
                if (onIngresar) onIngresar(updatedPedido);
            }}
        />

        <AnularIngreso
            isOpen={isAnularIngresoOpen}
            setIsOpen={setIsAnularIngresoOpen}
            pedido={pedido}
            onAnulado={(updatedPedido) => {
                if (onIngresar) onIngresar(updatedPedido);
                else if (onEdit) onEdit(updatedPedido);
            }}
        />

        <AnularEntrega
            isOpen={isAnularEntregaOpen}
            setIsOpen={setIsAnularEntregaOpen}
            pedido={pedido}
            isAcopio={false}
            onAnulado={(updatedPedido) => {
                if (onIngresar) onIngresar(updatedPedido);
                else if (onEdit) onEdit(updatedPedido);
            }}
        />

        <EliminarPedido
            isOpen={isEliminarOpen}
            setIsOpen={setIsEliminarOpen}
            pedido={pedido}
            isAcopio={false}
            onDeleted={(id) => {
                if (setIsOpen) setIsOpen(false);
                if (onClose) onClose();
                if (onEliminar) onEliminar(id);
            }}
        />

        <DescargarDatos
            isOpen={isDescargaOpen}
            setIsOpen={setIsDescargaOpen}
            titulo="Descargar Pedido"
            subtitulo="SELECCIONA EL FORMATO QUE PREFIERAS PARA DESCARGAR."
            informacionSuperior={informacionSuperiorDescarga}
            tablaHeaders={tablaHeadersDescarga}
            tablaValores={tablaValoresDescarga}
            nombreArchivo={`PEDIDO_${pedido.codigo || pedido.id || ''}`}
            tituloDocumento="PEDIDO"
            clienteInfo={{
                nombre: solicitanteNombre || '',
                numeroOrden: pedido.numero_pedido || ''
            }}
        />
        </>
    );
};

export default ViewInfo;
