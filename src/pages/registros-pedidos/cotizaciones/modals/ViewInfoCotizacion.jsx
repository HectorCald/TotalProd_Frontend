import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFormatNumberPrice from '../../../../hooks/useFormatNumberPrice';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import ProductosMovimiento from '../../../registros-pedidos/movimientos/modals/ProductosMovimiento';
import AprobarCotizacion from './AprobarCotizacion';
import AnularAprobacion from './AnularAprobacion';
import CompletarCotizacion from './CompletarCotizacion';
import AnularCompletado from './AnularCompletado';
import EliminarCotizacion from './EliminarCotizacion';
import DescargarDatos from '../../../../components/ui/DescargarDatos';
import Link from '../../../../components/common/outputs/Link';

const ViewInfoCotizacion = ({ isOpen, onClose, cotizacion, onEdit, onUpdate, onEliminar }) => {
    const navigate = useNavigate();
    const { formatPrice } = useFormatNumber();
    const { calculateSubtotal, calculateSpecialPrice } = useFormatNumberPrice();
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    
    // Estados para modales de workflow
    const [isAprobarOpen, setIsAprobarOpen] = useState(false);
    const [isAnularAprobacionOpen, setIsAnularAprobacionOpen] = useState(false);
    const [isCompletarOpen, setIsCompletarOpen] = useState(false);
    const [isAnularCompletadoOpen, setIsAnularCompletadoOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);

    const rawFechaStr = cotizacion?.fecha || cotizacion?.date || cotizacion?.created_at || '';
    const fechaLiteral = useFechaLiteral(rawFechaStr, false, true) || rawFechaStr;

    const rawFechaVencimiento = cotizacion?.fecha_vencimiento || '';
    const fechaVencimientoLiteral = useFechaLiteral(rawFechaVencimiento, false, true) || rawFechaVencimiento;

    if (!cotizacion) return null;

    const clienteNombre = cotizacion.cliente?.name || '';
    const responsableNombre = cotizacion?.user?.name || cotizacion?.personal?.name || '';

    let title = '';
    if (clienteNombre) {
        title = clienteNombre;
    } else if (cotizacion.productos && cotizacion.productos.length === 1) {
        title = cotizacion.productos[0]?.producto?.name || 'Cotización';
    } else {
        title = 'Cotización';
    }

    // Cálculos para el bloque de finanzas
    let subtotalNum = (cotizacion.productos || []).reduce((sum, p) => sum + calculateSubtotal(p.cantidad, p.precio_unitario || p.precio, p.producto?.grup, cotizacion?.agrupado, true), 0);
    subtotalNum = Math.round(subtotalNum * 10) / 10;
    
    let descValNum = parseFloat(cotizacion.descuento) || 0;
    let aumValNum = parseFloat(cotizacion.aumento) || 0;
    let esPorcentaje = cotizacion.porcentaje;
    
    let descCalculadoNum = esPorcentaje ? subtotalNum * (descValNum / 100) : descValNum;
    let aumCalculadoNum = esPorcentaje ? subtotalNum * (aumValNum / 100) : aumValNum;
    
    let totalFinalNum = Math.round((subtotalNum - descCalculadoNum + aumCalculadoNum) * 10) / 10;

    const descPerc = esPorcentaje 
        ? descValNum 
        : (subtotalNum > 0 ? (descValNum / subtotalNum) * 100 : 0);
    const aumPerc = esPorcentaje 
        ? aumValNum 
        : (subtotalNum > 0 ? (aumValNum / subtotalNum) * 100 : 0);

    const informacionSuperiorDescarga = {
        'Fecha': fechaLiteral,
        'Cliente': clienteNombre || 'Cliente ocasional',
        'Método de pago': cotizacion?.metodo_pago ? (cotizacion.metodo_pago.charAt(0).toUpperCase() + cotizacion.metodo_pago.slice(1)) : ''
    };
    if (cotizacion?.codigo) informacionSuperiorDescarga['Código'] = cotizacion.codigo;
    if (cotizacion?.numero_cotizacion) informacionSuperiorDescarga['Nº Cotización'] = cotizacion.numero_cotizacion;
    if (cotizacion?.agrupado !== undefined && cotizacion?.agrupado !== null) {
        informacionSuperiorDescarga['Modalidad'] = cotizacion.agrupado ? 'Grupos' : 'Unidades';
    }
    if (cotizacion?.precio?.name) {
        informacionSuperiorDescarga['Tipo de Precio'] = cotizacion.precio.name;
    }
    if (responsableNombre) informacionSuperiorDescarga['Responsable'] = responsableNombre;
    if (rawFechaVencimiento) informacionSuperiorDescarga['Vencimiento'] = fechaVencimientoLiteral;
    if (cotizacion.observaciones) informacionSuperiorDescarga['Observaciones'] = cotizacion.observaciones;
    if (descValNum > 0) informacionSuperiorDescarga['Descuento'] = `Bs. ${formatPrice(descCalculadoNum)}`;
    if (aumValNum > 0) informacionSuperiorDescarga['Aumento'] = `Bs. ${formatPrice(aumCalculadoNum)}`;
    informacionSuperiorDescarga['Total'] = `Bs. ${formatPrice(totalFinalNum)}`;

    const tablaHeadersDescarga = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const tablaValoresDescarga = (cotizacion?.productos || []).map(p => {
        const cant = Number(p.cantidad ?? 0);
        const prec = Number(p.precio_unitario ?? p.precio ?? 0);
        const name = p.name || p.producto?.name || 'Desconocido';
        const code = p.type_measure?.code || p.producto?.type_measure?.code || '';
        
        const grup = Number(p.producto?.grup ?? 0);
        const esAgrupado = cotizacion?.agrupado && grup > 0;
        
        let cantidadStr = `${cant}`;
        let precioDescarga = calculateSpecialPrice(prec, grup, esAgrupado, true);
        const subt = calculateSubtotal(cant, prec, grup, cotizacion?.agrupado, true);

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

    const getStatusColor = (estado) => {
        switch (estado) {
            case 'pendiente': return 'warning';
            case 'aprobada': return 'success';
            case 'anulado': return 'error';
            case 'completado': return 'info';
            default: return 'gray';
        }
    };

    const handleRealizarVenta = () => {
        const ventaData = {
            prices_types_id: cotizacion.prices_types_id || cotizacion.precio?.id,
            modalidad: cotizacion.agrupado ? 'grupos' : 'unidades',
            productos_lista: (cotizacion.productos || []).map(p => {
                const grup = parseFloat(p.producto?.grup) || 0;
                const cantidadUD = parseFloat(p.cantidad) || 1;
                const esPorGrupo = cotizacion.agrupado && grup > 0;
                return {
                    id: p.producto?.id || p.producto_almacen_id || p.products_id || p.id,
                    cantidad: esPorGrupo ? Math.floor(cantidadUD / grup) : cantidadUD
                };
            }),
            cliente_id: cotizacion.clients_id || cotizacion.cliente?.id,
            descuento: parseFloat(cotizacion.descuento) || 0,
            aumento: parseFloat(cotizacion.aumento) || 0,
            porcentaje: !!cotizacion.porcentaje,
            metodo_pago: cotizacion.metodo_pago
        };
        localStorage.removeItem('ventaEnProgreso');
        sessionStorage.setItem('cotizacionParaVenta', JSON.stringify(ventaData));
        onClose();
        navigate('/almacen/salidas/cotizacion');
    };

    const handleCopiarCotizacion = () => {
        const ventaData = {
            prices_types_id: cotizacion.prices_types_id || cotizacion.precio?.id,
            modalidad: cotizacion.agrupado ? 'grupos' : 'unidades',
            productos_lista: (cotizacion.productos || []).map(p => {
                const grup = parseFloat(p.producto?.grup) || 0;
                const cantidadUD = parseFloat(p.cantidad) || 1;
                const esPorGrupo = cotizacion.agrupado && grup > 0;
                return {
                    id: p.producto?.id || p.producto_almacen_id || p.products_id || p.id,
                    cantidad: esPorGrupo ? Math.floor(cantidadUD / grup) : cantidadUD
                };
            }),
            cliente_id: cotizacion.clients_id || cotizacion.cliente?.id,
            descuento: parseFloat(cotizacion.descuento) || 0,
            aumento: parseFloat(cotizacion.aumento) || 0,
            porcentaje: !!cotizacion.porcentaje,
            metodo_pago: cotizacion.metodo_pago,
            fecha: cotizacion.fecha || cotizacion.created_at || new Date().toISOString()
        };
        localStorage.removeItem('cotizacionEnProgreso');
        sessionStorage.setItem('cotizacionParaCopiar', JSON.stringify(ventaData));
        onClose();
        navigate('/almacen/cotizar/copia');
    };

    return (
        <>
        <ModalCentro
            isOpen={isOpen && !isProductosOpen && !isAprobarOpen && !isAnularAprobacionOpen && !isCompletarOpen && !isAnularCompletadoOpen && !isEliminarOpen && !isDescargaOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                onClose();
                if (onEdit) onEdit(cotizacion);
            }}
            hideFooter={true}
            width="450px"
            receipt={true}
        >
                <InfoCard
                    title={`${title}${cotizacion.numero_cotizacion ? ` (Nº ${cotizacion.numero_cotizacion})` : ''}`}
                    subtitle={fechaLiteral}
                    description={cotizacion.observaciones || ''}
                    statusDot={getStatusColor(cotizacion.estado)}
                    icon="file"
                    customBlock={
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <Link 
                                    text="Descargar Cotización" 
                                    iconEnd="right-arrow-alt" 
                                    onClick={handleDescargar} 
                                />
                            </div>
                            <ColumnInfo 
                                items={[
                                    cotizacion.codigo && {
                                        icon: 'hash',
                                        text: cotizacion.codigo
                                    },
                                    cotizacion.metodo_pago && {
                                        icon: 'credit-card',
                                        text: cotizacion.metodo_pago.charAt(0).toUpperCase() + cotizacion.metodo_pago.slice(1)
                                    },
                                    (cotizacion.agrupado !== undefined && cotizacion.agrupado !== null) && {
                                        icon: cotizacion.agrupado ? 'layer' : 'box',
                                        text: cotizacion.agrupado ? 'Grupos' : 'Unidades'
                                    }
                                ].filter(Boolean)} 
                            />
                            <ColumnInfo 
                                title="Detalles"
                                items={[
                                    clienteNombre && {
                                        clave: 'Cliente',
                                        valor: clienteNombre,
                                        icon: 'id-card'
                                    },
                                    cotizacion.precio?.name && {
                                        clave: 'Precio',
                                        valor: cotizacion.precio.name,
                                        icon: 'dollar'
                                    },
                                    responsableNombre && {
                                        clave: 'Responsable',
                                        valor: responsableNombre,
                                        icon: 'user'
                                    },
                                    rawFechaVencimiento && {
                                        clave: 'Vencimiento',
                                        valor: fechaVencimientoLiteral,
                                        icon: 'calendar'
                                    }
                                ].filter(Boolean)}
                            />
                            <ColumnInfo 
                                title="Finanzas"
                                items={[
                                    { clave: 'Subtotal', valor: `Bs. ${formatPrice(subtotalNum)}` },
                                    descValNum > 0 && {
                                        clave: `Descuento ${esPorcentaje ? `(${formatPrice(descPerc)}%)` : '(Bs.)'}`,
                                        valor: `- Bs. ${formatPrice(descCalculadoNum)}`,
                                        colorValor: 'var(--error-color)'
                                    },
                                    aumValNum > 0 && {
                                        clave: `Aumento ${esPorcentaje ? `(${formatPrice(aumPerc)}%)` : '(Bs.)'}`,
                                        valor: `+ Bs. ${formatPrice(aumCalculadoNum)}`,
                                        colorValor: 'var(--success-color)'
                                    }
                                ].filter(Boolean)}
                                finance={true}
                                financeTotal={`Bs. ${formatPrice(totalFinalNum)}`}
                            />
                        </>
                    }
                    actionButton={
                        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                            <Boton
                                label="Productos"
                                iconName={cotizacion.estado === 'aprobada' ? "" : "box"}
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => setIsProductosOpen(true)}
                            />

                            {/* Workflow Buttons */}
                            {cotizacion.estado === 'pendiente' && (
                                <BotonIcon
                                    iconName="like"
                                    className="btn-primary"
                                    tooltip="Aprobar Cotización"
                                    onClick={() => setIsAprobarOpen(true)}
                                />
                            )}
                            
                            {cotizacion.estado === 'aprobada' && (
                                <>
                                    <BotonIcon
                                        iconName="undo"
                                        className="btn-warning"
                                        tooltip="Anular Aprobación"
                                        onClick={() => setIsAnularAprobacionOpen(true)}
                                    />
                                    <BotonIcon
                                        iconName="check"
                                        className="btn-primary"
                                        tooltip="Completar Cotización"
                                        onClick={() => setIsCompletarOpen(true)}
                                    />
                                    <BotonIcon
                                        iconName="cart"
                                        className="btn-primary"
                                        tooltip="Realizar venta"
                                        tooltipAlign='end'
                                        onClick={handleRealizarVenta}
                                    />
                                </>
                            )}
                            
                            {cotizacion.estado === 'completado' && (
                                <BotonIcon
                                    iconName="undo"
                                    className="btn-warning"
                                    tooltip="Anular Completado"
                                    tooltipAlign="end"
                                    onClick={() => setIsAnularCompletadoOpen(true)}
                                />
                            )}

                            <BotonIcon
                                iconName="copy"
                                className="btn-primary"
                                tooltip="Copiar Cotización"
                                tooltipAlign="end"
                                onClick={handleCopiarCotizacion}
                            />

                            {cotizacion.estado === 'pendiente' && (
                                <BotonIcon
                                    iconName="trash"
                                    className="btn-error"
                                    tooltip="Eliminar Cotización"
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
            cotizacionActual={cotizacion}
            cotizacion={cotizacion}
        />

        {/* Workflow Modals */}
        <AprobarCotizacion
            isOpen={isAprobarOpen}
            onClose={() => setIsAprobarOpen(false)}
            cotizacionSeleccionada={cotizacion}
            onAprobar={(id, nuevoEstado) => {
                if (onUpdate) onUpdate(id, nuevoEstado);
            }}
        />

        <AnularAprobacion
            isOpen={isAnularAprobacionOpen}
            onClose={() => setIsAnularAprobacionOpen(false)}
            cotizacionSeleccionada={cotizacion}
            onAnular={(id, nuevoEstado) => {
                if (onUpdate) onUpdate(id, nuevoEstado);
            }}
        />

        <CompletarCotizacion
            isOpen={isCompletarOpen}
            onClose={() => setIsCompletarOpen(false)}
            cotizacionSeleccionada={cotizacion}
            onCompletar={(id, nuevoEstado) => {
                if (onUpdate) onUpdate(id, nuevoEstado);
            }}
        />

        <AnularCompletado
            isOpen={isAnularCompletadoOpen}
            onClose={() => setIsAnularCompletadoOpen(false)}
            cotizacionSeleccionada={cotizacion}
            onAnular={(id, nuevoEstado) => {
                if (onUpdate) onUpdate(id, nuevoEstado);
            }}
        />

        <EliminarCotizacion
            isOpen={isEliminarOpen}
            onClose={() => setIsEliminarOpen(false)}
            cotizacionSeleccionada={cotizacion}
            onEliminar={(id) => {
                if (onEliminar) onEliminar(id);
                onClose();
            }}
        />

        <DescargarDatos
            isOpen={isDescargaOpen}
            setIsOpen={setIsDescargaOpen}
            titulo="Descargar Cotización"
            subtitulo="SELECCIONA EL FORMATO QUE PREFIERAS PARA DESCARGAR."
            informacionSuperior={informacionSuperiorDescarga}
            tablaHeaders={tablaHeadersDescarga}
            tablaValores={tablaValoresDescarga}
            nombreArchivo={`COTIZACION_${cotizacion.codigo || cotizacion.id || ''}`}
            tituloDocumento="COTIZACIÓN"
            esMovimiento={true}
            fechaMovimiento={rawFechaStr}
            clienteInfo={{
                nombre: clienteNombre || '',
                numeroOrden: cotizacion.numero_cotizacion || ''
            }}
        />
        </>
    );
};

export default ViewInfoCotizacion;