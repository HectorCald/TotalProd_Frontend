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
    const fechaLiteral = useFechaLiteral(rawFechaStr, true) || (rawFechaStr ? new Date(rawFechaStr).toLocaleDateString() : '');

    if (!cotizacion) return null;

    const tags = [].filter(Boolean);

    if (cotizacion.codigo) {
        tags.push({
            label: 'Código',
            text: cotizacion.codigo,
            icon: 'hash'
        });
    }

    if (cotizacion.precio && cotizacion.precio.name) {
        tags.push({
            label: 'Precio',
            text: cotizacion.precio.name,
            icon: 'dollar-circle'
        });
    }



    if (cotizacion.cliente?.name) {
        tags.push({
            label: 'Cliente',
            text: cotizacion.cliente.name,
            icon: 'user'
        });
    }

    const responsableNombre = cotizacion?.user?.name || cotizacion?.personal?.name || '';
    if (responsableNombre) {
        tags.push({
            label: 'Responsable',
            text: responsableNombre,
            icon: 'user'
        });
    }
    
    if (cotizacion.metodo_pago) {
        const metodo = cotizacion.metodo_pago.toLowerCase();
        tags.push({
            label: 'Pago',
            text: metodo.charAt(0).toUpperCase() + metodo.slice(1),
            icon: 'credit-card'
        });
    }

    const stats = [];

    if (cotizacion.agrupado !== undefined && cotizacion.agrupado !== null) {
        stats.push({
            label: 'Modalidad',
            value: cotizacion.agrupado ? 'Grupos' : 'Unidades',
            icon: cotizacion.agrupado ? 'layer' : 'box'
        });
    }

    stats.push({
        label: 'Productos',
        value: cotizacion.productos?.length || 0,
        icon: 'package'
    });



    let title = cotizacion.cliente?.name || 'Cotización';
    if (cotizacion.numero_cotizacion) {
        title = `${title} (Nº ${cotizacion.numero_cotizacion})`;
    }

    // Cálculos para el bloque personalizado
    let subtotalNum = (cotizacion.productos || []).reduce((sum, p) => sum + (parseFloat(p.subtotal) || calculateSubtotal(p.cantidad, p.precio_unitario || p.precio, p.producto?.grup, cotizacion?.agrupado, true)), 0);
    subtotalNum = Math.round(subtotalNum * 10) / 10;
    
    let descValNum = parseFloat(cotizacion.descuento) || 0;
    let aumValNum = parseFloat(cotizacion.aumento) || 0;
    let esPorcentaje = cotizacion.porcentaje;
    
    let descCalculadoNum = 0;
    let aumCalculadoNum = 0;

    if (esPorcentaje) {
        descCalculadoNum = subtotalNum * (descValNum / 100);
        aumCalculadoNum = subtotalNum * (aumValNum / 100);
    } else {
        descCalculadoNum = descValNum;
        aumCalculadoNum = aumValNum;
    }
    
    let totalFinalRaw = subtotalNum - descCalculadoNum + aumCalculadoNum;
    let totalFinalNum = Math.round(totalFinalRaw * 10) / 10;

    const financeItems = [];
    financeItems.push({ clave: 'Subtotal', valor: `Bs. ${formatPrice(subtotalNum)}` });
    if (descValNum > 0) {
        financeItems.push({ 
            clave: `Descuento ${esPorcentaje ? `(${formatPrice(descValNum)}%)` : '(Bs.)'}`, 
            valor: `- Bs. ${formatPrice(descCalculadoNum)}`,
            colorValor: 'var(--error-color)'
        });
    }
    if (aumValNum > 0) {
        financeItems.push({ 
            clave: `Aumento ${esPorcentaje ? `(${formatPrice(aumValNum)}%)` : '(Bs.)'}`, 
            valor: `+ Bs. ${formatPrice(aumCalculadoNum)}`,
            colorValor: 'var(--success-color)'
        });
    }

    const informacionSuperiorDescarga = {};
    if (fechaLiteral) informacionSuperiorDescarga['Fecha'] = fechaLiteral;
    if (cotizacion.cliente?.name) informacionSuperiorDescarga['Cliente'] = cotizacion.cliente.name;
    if (responsableNombre) informacionSuperiorDescarga['Responsable'] = responsableNombre;
    if (cotizacion.metodo_pago) informacionSuperiorDescarga['Método de pago'] = cotizacion.metodo_pago.charAt(0).toUpperCase() + cotizacion.metodo_pago.slice(1);
    if (cotizacion.codigo) informacionSuperiorDescarga['Código'] = cotizacion.codigo;
    if (cotizacion.numero_cotizacion) informacionSuperiorDescarga['Nº Cotización'] = cotizacion.numero_cotizacion;
    if (cotizacion.agrupado !== undefined && cotizacion.agrupado !== null) {
        informacionSuperiorDescarga['Modalidad'] = cotizacion.agrupado ? 'Grupos' : 'Unidades';
    }
    if (cotizacion.precio?.name) informacionSuperiorDescarga['Tipo de Precio'] = cotizacion.precio.name;
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
        
        let precioDescarga = prec;
        if (typeof calculateSpecialPrice === 'function') {
           precioDescarga = calculateSpecialPrice(prec, grup, esAgrupado, true);
        } else if (esAgrupado) {
           precioDescarga = prec * grup;
        }

        const subt = parseFloat(p.subtotal) || calculateSubtotal(cant, prec, grup, cotizacion?.agrupado, true);

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
        >
                <InfoCard
                    title={title}
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
                                financeTotal={`Bs. ${formatPrice(totalFinalNum)}`}
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
            clienteInfo={{
                nombre: cotizacion.cliente?.name || '',
                numeroOrden: cotizacion.numero_cotizacion || ''
            }}
        />
        </>
    );
};

export default ViewInfoCotizacion;
