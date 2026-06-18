import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import ProductosCotizacion from './ProductosCotizacion';
import AprobarCotizacion from './AprobarCotizacion';
import AnularAprobacion from './AnularAprobacion';
import CompletarCotizacion from './CompletarCotizacion';
import AnularCompletado from './AnularCompletado';

const ViewInfoCotizacion = ({ isOpen, onClose, cotizacion, onEdit, onUpdate }) => {
    const navigate = useNavigate();
    const { formatPrice } = useFormatNumber();
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    
    // Estados para modales de workflow
    const [isAprobarOpen, setIsAprobarOpen] = useState(false);
    const [isAnularAprobacionOpen, setIsAnularAprobacionOpen] = useState(false);
    const [isCompletarOpen, setIsCompletarOpen] = useState(false);
    const [isAnularCompletadoOpen, setIsAnularCompletadoOpen] = useState(false);

    const rawFechaStr = cotizacion?.fecha || cotizacion?.date || '';
    const fechaStr = rawFechaStr ? rawFechaStr.slice(0, 10) : '';
    const fechaLiteral = useFechaLiteral(fechaStr, true) || (rawFechaStr ? new Date(rawFechaStr).toLocaleDateString() : '');

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
            value: cotizacion.agrupado ? 'Grps.' : 'Unds.',
            icon: cotizacion.agrupado ? 'layer' : 'box'
        });
    }

    stats.push({
        label: 'Productos',
        value: cotizacion.productos?.length || 0,
        icon: 'package'
    });

    stats.push({
        label: 'Fecha',
        value: fechaLiteral,
        icon: 'calendar'
    });

    let title = cotizacion.cliente?.name || 'Cotización';
    if (cotizacion.numero_cotizacion) {
        title = `${title} (Nº ${cotizacion.numero_cotizacion})`;
    }

    // Cálculos para el bloque personalizado
    let subtotalNum = (cotizacion.productos || []).reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0);
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
            productos_lista: (cotizacion.productos || []).map(p => ({
                id: p.producto?.id || p.producto_almacen_id || p.products_id || p.id,
                cantidad: parseFloat(p.cantidad) || 1
            })),
            cliente_id: cotizacion.clients_id || cotizacion.cliente?.id,
            descuento: parseFloat(cotizacion.descuento) || 0,
            aumento: parseFloat(cotizacion.aumento) || 0,
            porcentaje: !!cotizacion.porcentaje,
            metodo_pago: cotizacion.metodo_pago
        };
        sessionStorage.setItem('cotizacionParaVenta', JSON.stringify(ventaData));
        onClose();
        navigate('/almacen/salidas/cotizacion');
    };

    return (
        <>
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
                    subtitle="Información de la Cotización"
                    description={cotizacion.observaciones || ''}
                    statusDot={getStatusColor(cotizacion.estado)}
                    tags={tags}
                    stats={stats}
                    icon="file"
                    customBlock={
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
                                        className="btn-primary"
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
                                        onClick={handleRealizarVenta}
                                    />
                                </>
                            )}
                            
                            {cotizacion.estado === 'completado' && (
                                <BotonIcon
                                    iconName="undo"
                                    className="btn-primary"
                                    tooltip="Anular Completado"
                                    tooltipAlign="end"
                                    onClick={() => setIsAnularCompletadoOpen(true)}
                                />
                            )}

                            {cotizacion.estado !== 'anulado' && cotizacion.estado !== 'completado' && (
                                <BotonIcon
                                    iconName="edit"
                                    className="btn-primary"
                                    tooltip="Editar Cotización"
                                    tooltipAlign="end"
                                    onClick={() => {
                                        onClose();
                                        if (onEdit) onEdit(cotizacion);
                                    }}
                                />
                            )}
                        </div>
                    }
                />
            </div>
        </ModalCentro>

        <ProductosCotizacion
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
        </>
    );
};

export default ViewInfoCotizacion;
