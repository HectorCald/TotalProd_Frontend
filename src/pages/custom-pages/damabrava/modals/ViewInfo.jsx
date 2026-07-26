import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import Boton from '../../../../components/common/botones/Boton';
import InfoCard from '../../../../components/common/information/InfoCard';
import EliminarRegistro from './EliminarRegistro';
import VerificarRegistro from './VerificarRegistro';
import AnularVerificacion from './AnularVerificacion';
import IngresarProduccion from './IngresarProduccion';
import CalculoPago from './CalculoPago';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import NoData from '../../../../components/common/widgets/NoData';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import ViewInfoMovimiento from '../../../registros-pedidos/movimientos/modals/ViewInfo';
import { useToast } from '../../../../context/ToastContext';
import permisosService from '../../../../services/permissionsService';
import reglasProduccionDamabravaService from '../../../../services/reglasProduccionDamabravaService';
import { seleccionarReglaParaProducto, calcularPagoProcesos } from '../../../../utils/reglasPagoHelper';

const IngresoRow = ({ ingreso, onClick }) => {
    const literalDate = useFechaLiteral(ingreso.fecha, true, true);
    
    const cantidad = ingreso.productos?.reduce((sum, p) => sum + Number(p.cantidad || 0), 0) || 0;

    return (
        <div
            onClick={() => onClick(ingreso)}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid var(--quaternary-color)',
                marginBottom: '10px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'; }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', color: 'var(--dark-color)' }}>
                        {`${cantidad} ud. ingresadas`}
                    </span>
                    <span style={{ fontSize: '12.5px', color: 'var(--secondary-color)', fontWeight: '500' }}>
                        • {literalDate || (ingreso.fecha ? ingreso.fecha.split('T')[0] : '')}
                    </span>
                </div>
                {ingreso.observaciones && (
                    <span style={{ fontSize: '12.5px', color: 'var(--tertiary-color)', wordBreak: 'break-word' }}>
                        {ingreso.observaciones}
                    </span>
                )}
            </div>
        </div>
    );
};

const ViewInfo = ({ isOpen, onClose, registro, isMiProduccion = false, onEliminar, onVerificar, onAnular, onIngresar }) => {
    const { showDanger } = useToast();
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isVerificarOpen, setIsVerificarOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isIngresarOpen, setIsIngresarOpen] = useState(false);
    const [isCalculoPagoOpen, setIsCalculoPagoOpen] = useState(false);
    const [ingresos, setIngresos] = useState([]);
    const [ingresosCargados, setIngresosCargados] = useState(false);
    const [loadingIngresos, setLoadingIngresos] = useState(false);
    const [isViewMovimientoOpen, setIsViewMovimientoOpen] = useState(false);
    const [selectedMovimiento, setSelectedMovimiento] = useState(null);

    const [loadingPago, setLoadingPago] = useState(false);
    const [resultadoPago, setResultadoPago] = useState(null);
    const [reglaAplicada, setReglaAplicada] = useState(null);

    const rawFechaStr = registro?.fecha || '';
    const fechaStr = rawFechaStr ? rawFechaStr.slice(0, 10) : '';
    const hookFechaLiteral = useFechaLiteral(fechaStr, false, true);

    const loadIngresos = async () => {
        if (!registro?.id || registro?.estado === 'pendiente') return;
        setLoadingIngresos(true);
        try {
            const response = await movimientosAlmacenService.getByProduccionDamabrava(registro.id);
            if (response.success) {
                const activos = (response.data || []).filter(mov => mov.estado !== 'anulado');
                const sorted = activos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                setIngresos(sorted);
                setIngresosCargados(true);
            } else {
                showDanger('Error', response.message || 'Error al obtener los ingresos');
            }
        } catch (error) {
            console.error('Error al cargar ingresos:', error);
            showDanger('Error', 'Error al cargar los movimientos de ingreso');
        } finally {
            setLoadingIngresos(false);
        }
    };

    React.useEffect(() => {
        if (isOpen && registro && registro.estado !== 'pendiente') {
            loadIngresos();
        } else {
            setIngresos([]);
            setIngresosCargados(false);
        }
    }, [isOpen, registro?.id, registro?.estado]);

    const cantidadReal = ingresosCargados
        ? ingresos.reduce((t, ing) => t + (ing.productos?.reduce((s, p) => s + Number(p.cantidad || 0), 0) || 0), 0)
        : (registro?.cantidad_ingresada || 0);

    let estadoReal = registro?.estado;
    if (ingresosCargados && registro?.estado && registro.estado !== 'pendiente') {
        if (cantidadReal >= (registro.cantidad_verificada || 0) && cantidadReal > 0) {
            estadoReal = 'Ingresado';
        } else {
            estadoReal = 'verificado';
        }
    }

    React.useEffect(() => {
        if (ingresosCargados && !loadingIngresos && registro) {
            if (estadoReal !== registro.estado || cantidadReal !== registro.cantidad_ingresada) {
                if (onIngresar) {
                    onIngresar({
                        ...registro,
                        estado: estadoReal,
                        cantidad_ingresada: cantidadReal
                    });
                }
            }
        }
    }, [estadoReal, cantidadReal, ingresosCargados, loadingIngresos, registro, onIngresar]);

    if (!registro) return null;

    const fechaLiteral = hookFechaLiteral || (rawFechaStr ? new Date(rawFechaStr).toLocaleDateString() : '');

    const rawFechaVencimientoStr = registro?.vencimiento || '';
    const formatMesAnio = (v) => {
        if (!v) return '';
        const base = String(v).split('T')[0];
        const [y, m] = base.split('-');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const nombreMes = meses[(parseInt(m, 10) || 1) - 1] || '';
        return `${nombreMes} ${y}`;
    };
    const fechaVencimiento = formatMesAnio(rawFechaVencimientoStr);

    const tags = [].filter(Boolean);

    if (registro.lote) {
        tags.push({
            text: `Lote ${registro.lote}`,
            icon: 'hash'
        });
    }

    const procesoLabel = registro.proceso === 'cernido' ? 'Cernido' : registro.proceso === 'seleccionado' ? 'Seleccionado' : registro.proceso === 'ninguno' ? 'Ninguno' : (registro.proceso || '--');
    tags.push({
        text: procesoLabel,
        icon: 'cog'
    });

    const responsableNombre = registro.user?.name || registro.personal?.name || '';
    if (responsableNombre) {
        tags.push({
            text: responsableNombre,
            icon: 'user'
        });
    }

    if (registro.microondas) {
        tags.push({
            text: `${registro.microondas} seg. micro.`,
            icon: 'time'
        });
    }

    const stats = [];
    
    if (fechaVencimiento) {
        stats.push({
            clave: 'Vencimiento',
            valor: fechaVencimiento
        });
    }
    
    const isVerificado = estadoReal !== 'pendiente';
    stats.push({
        clave: isVerificado ? 'Verificados' : 'Terminados',
        valor: `${isVerificado ? (registro.cantidad_verificada || 0) : (registro.terminados || 0)} ud`
    });

    if (isVerificado) {
        stats.push({
            clave: 'Ingresados',
            valor: `${cantidadReal} ud`
        });
    }

    let title = registro.producto_almacen?.name || 'Sin producto';

    const handleRegistroEliminado = (id) => {
        setIsEliminarOpen(false);
        onClose();
        if (onEliminar) onEliminar(id);
    };

    const handleRegistroVerificado = (registroActualizado) => {
        setIsVerificarOpen(false);
        if (onVerificar) onVerificar(registroActualizado);
    };

    const handleRegistroAnulado = (registroActualizado) => {
        setIsAnularOpen(false);
        if (onAnular) onAnular(registroActualizado);
    };

    const handleRegistroIngresado = (registroActualizado) => {
        setIsIngresarOpen(false);
        loadIngresos();
        if (onIngresar) onIngresar(registroActualizado);
    };

    const handleViewMovimiento = (movimiento) => {
        setSelectedMovimiento(movimiento);
        setIsViewMovimientoOpen(true);
    };

    const handleCalcularPago = async () => {
        setLoadingPago(true);
        try {
            const permisoResponse = await permisosService.canViewSensitiveInfo();
            if (!permisoResponse.success || !permisoResponse.data?.allowed) {
                showDanger('Error', 'No tienes permisos para ver información financiera');
                return;
            }

            const reglasRes = await reglasProduccionDamabravaService.getAll();
            if (!reglasRes.success) {
                showDanger('Error', 'No se pudieron cargar las reglas de pago');
                return;
            }

            const reglas = reglasRes.data || [];
            if (reglas.length === 0) {
                showDanger('Error', 'No hay reglas configuradas para calcular el pago.');
                return;
            }

            const detalle = registro?.producto_almacen;
            if (!detalle) {
                showDanger('Error', 'No se encontró la información del producto.');
                return;
            }

            const regla = seleccionarReglaParaProducto(reglas, registro, detalle);

            if (!regla) {
                showDanger('Error', 'No existe una regla especial o general para realizar el cálculo de este registro.');
                return;
            }

            const usarCantidadVerificada = ['verificado', 'Ingresado'].includes(registro?.estado);
            const cantidadBase = usarCantidadVerificada
                ? Number(registro?.cantidad_verificada)
                : Number(registro?.terminados);

            if (!cantidadBase || cantidadBase <= 0) {
                showDanger('Error', usarCantidadVerificada
                    ? 'La cantidad verificada debe ser mayor a cero para calcular el pago.'
                    : 'La cantidad de terminados debe ser mayor a cero para calcular el pago.');
                return;
            }

            const resultado = calcularPagoProcesos({
                regla,
                terminados: cantidadBase,
                productoDetalle: detalle,
                proceso: registro?.proceso
            });

            setReglaAplicada(regla);
            setResultadoPago({
                cantidad: cantidadBase,
                cantidadLabel: usarCantidadVerificada ? 'Cantidad verificada' : 'Terminados',
                ...resultado
            });
            setIsCalculoPagoOpen(true);
        } catch (error) {
            console.error('Error calculando pago:', error);
            showDanger('Error', error.message || 'No se pudo calcular el pago.');
        } finally {
            setLoadingPago(false);
        }
    };

    return (
        <>
        <ModalCentro
            isOpen={isOpen && !isEliminarOpen && !isVerificarOpen && !isAnularOpen && !isIngresarOpen && !isViewMovimientoOpen && !isCalculoPagoOpen}
            onClose={onClose}
            title=""
            confirmText="Cerrar"
            onConfirm={onClose}
            hideFooter={true}
            visibleOverflow={true}
        >
            <InfoCard
                title={title}
                subtitle={fechaLiteral}
                description={registro.observaciones || ''}
                statusDot={estadoReal === 'pendiente' ? 'error' : estadoReal === 'verificado' ? 'success' : 'info'}
                icon="box"
                customBlock={
                    <>
                        {tags.length > 0 && (
                            <ColumnInfo items={tags} />
                        )}
                        {stats.length > 0 && (
                            <ColumnInfo 
                                title="Detalles"
                                items={stats}
                            />
                        )}

                        {estadoReal !== 'pendiente' && (
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--secondary-color)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Historial de Ingresos
                                </p>
                                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    {loadingIngresos ? (
                                        <NoData
                                            icon="loader-alt"
                                            title="Cargando ingresos..."
                                            detail="Obteniendo el historial"
                                            transparent={true}
                                            minHeight="100px"
                                        />
                                    ) : ingresos.length > 0 ? (
                                        ingresos.map(ingreso => (
                                            <IngresoRow
                                                key={ingreso.id}
                                                ingreso={ingreso}
                                                onClick={handleViewMovimiento}
                                            />
                                        ))
                                    ) : (
                                        <NoData
                                            icon="history"
                                            title="Sin Ingresos"
                                            detail="No hay movimientos registrados"
                                            transparent={true}
                                            minHeight="100px"
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                }
                actionButton={
                    !isMiProduccion && (
                        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                            {estadoReal === 'pendiente' && (
                                <>
                                    <BotonIcon
                                        iconName="check-square"
                                        className="btn-primary"
                                        tooltip="Verificar Registro"
                                        onClick={() => setIsVerificarOpen(true)}
                                    />
                                    <BotonIcon
                                        iconName="trash"
                                        className="btn-error"
                                        tooltip="Eliminar Registro"
                                        onClick={() => setIsEliminarOpen(true)}
                                    />
                                </>
                            )}
                            
                            {(estadoReal === 'verificado' || estadoReal === 'Ingresado') && (
                                <>
                                    {(estadoReal === 'verificado' || estadoReal === 'Ingresado') && cantidadReal < (registro.cantidad_verificada || 0) && (
                                        <Boton
                                            label="Ingresar Producción"
                                            iconName="plus"
                                            className="btn-primary"
                                            style={{ flex: 1 }}
                                            onClick={() => setIsIngresarOpen(true)}
                                        />
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                                        <BotonIcon 
                                            iconName="calculator" 
                                            className="btn-primary" 
                                            tooltip="Pago" 
                                            loading={loadingPago}
                                            onClick={handleCalcularPago} 
                                        />

                                        {estadoReal === 'verificado' && cantidadReal === 0 && (
                                            <BotonIcon
                                                iconName="block"
                                                className="btn-warning"
                                                tooltip="Anular Verificación"
                                                tooltipAlign='end'
                                                onClick={() => setIsAnularOpen(true)}
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                }
            />
        </ModalCentro>

        <EliminarRegistro
            isOpen={isEliminarOpen}
            onClose={() => setIsEliminarOpen(false)}
            registro={registro}
            onEliminar={handleRegistroEliminado}
        />

        <VerificarRegistro
            isOpen={isVerificarOpen}
            onClose={() => setIsVerificarOpen(false)}
            registro={registro}
            onVerificar={handleRegistroVerificado}
        />

        <AnularVerificacion
            isOpen={isAnularOpen}
            onClose={() => setIsAnularOpen(false)}
            registro={registro}
            onAnular={handleRegistroAnulado}
        />

        <IngresarProduccion
            isOpen={isIngresarOpen}
            onClose={() => setIsIngresarOpen(false)}
            registro={registro}
            onIngresar={handleRegistroIngresado}
        />

        {isViewMovimientoOpen && selectedMovimiento && (
            <ViewInfoMovimiento
                isOpen={isViewMovimientoOpen}
                onClose={() => {
                    setIsViewMovimientoOpen(false);
                    loadIngresos();
                }}
                movimiento={selectedMovimiento}
                onAnular={(updatedMovimiento) => {
                    setSelectedMovimiento({ ...updatedMovimiento, estado: 'anulado' });
                    loadIngresos();
                }}
                onEliminar={(id) => {
                    setIsViewMovimientoOpen(false);
                    loadIngresos();
                }}
            />
        )}

        <CalculoPago
            isOpen={isCalculoPagoOpen}
            onClose={() => setIsCalculoPagoOpen(false)}
            resultadoPago={resultadoPago}
            reglaAplicada={reglaAplicada}
        />
        </>
    );
};

export default ViewInfo;
