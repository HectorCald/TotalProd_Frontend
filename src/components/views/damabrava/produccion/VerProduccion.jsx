import React, { useState, useEffect } from 'react';
import styles from '../../../../styles/view.module.css';
import HeaderView from '../../../common/HeaderView';
import View from '../../../ui/View';
import Dato from '../../../common/Dato';
import Boton from '../../../common/Boton';
import ItemView from '../../../common/ItemView';
import ModalDescarga from '../../../ui/ModalDescarga';
import VerMovimiento from '../../movimientos/VerMovimiento';
import { formatFechaLiteral, formatHoraSinSegundos, formatFechaHoraLiteral } from '../../../../utils/dateUtils';
import { seleccionarReglaParaProducto, calcularPagoProcesos } from '../../../../utils/reglasPagoHelper';
import permissionsService from '../../../../services/permissionsService';
import { useLayout } from '../../../../context/LayoutContext';
import { useToast } from '../../../../context/ToastContext';
import StatusBadge from '../../../common/StatusBadge';
import NoData from '../../../common/NoData';
import ModalVerificar from './modales/ModalVerificar';
import ModalAnularVerificacion from './modales/ModalAnularVerificacion';
import ModalEliminar from './modales/ModalEliminar';
import ModalMovimientos from './modales/ModalMovimientos';
import IngresoProduccion from './modales/IngresoProduccion';
import CalculoPagoModal from './modales/CalculoPagoModal';

function VerProduccion({ isOpen, setIsOpen, registro, onRegistroAnulado, onRegistroEliminado, onRegistroVerificado, reglas = [] }) {
    const { isLargeScreen } = useLayout();
    const { showDanger } = useToast();
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isVerificarOpen, setIsVerificarOpen] = useState(false);
    const [isIngresoOpen, setIsIngresoOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
    const [isVerMovimientoOpen, setIsVerMovimientoOpen] = useState(false);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
    const [isPagoOpen, setIsPagoOpen] = useState(false);
    const [resultadoPago, setResultadoPago] = useState(null);
    const [reglaAplicada, setReglaAplicada] = useState(null);
    const [isCalculandoPago, setIsCalculandoPago] = useState(false);
    const [isCheckingPermiso, setIsCheckingPermiso] = useState(false);

    const [registroActual, setRegistroActual] = useState(registro);

    useEffect(() => {
        setRegistroActual(registro);
        setReglaAplicada(null);
        setResultadoPago(null);
        setIsPagoOpen(false);
        setIsCalculandoPago(false);
        setIsCheckingPermiso(false);
    }, [registro]);


    // Formateo seguro Mes Año (evita desfase por zonas horarias)
    const formatMesAnio = (v) => {
        if (!v) return '';
        const base = String(v).split('T')[0];
        const [y, m] = base.split('-');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const nombreMes = meses[(parseInt(m, 10) || 1) - 1] || '';
        return `${nombreMes} ${y}`;
    };

    const obtenerPermisoInfo = async () => {
        setIsCheckingPermiso(true);
        try {
            const response = await permissionsService.canViewSensitiveInfo();
            if (response.success) {
                const allowed = Boolean(response.data?.allowed);
                return allowed;
            }

            showDanger('Error', response.message || 'No se pudo verificar los permisos.');
            return false;
        } catch (error) {
            console.error('Error verificando permisos de información:', error);
            showDanger('Error', error.message || 'No se pudo verificar los permisos.');
            return false;
        } finally {
            setIsCheckingPermiso(false);
        }
    };

    // Función para preparar datos de descarga
    const prepararDatosDescarga = () => {
        if (!registroActual) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Obtener nombre de la sucursal
        const nombreSucursal = registroActual?.sucursal?.name || 'Sucursal no encontrada';

        // Información superior
        const informacionSuperior = {
            'Responsable': registroActual?.user?.name || registroActual?.personal?.name || 'Usuario desconocido',
            'Producto': registroActual?.producto_almacen?.name || 'Sin producto',
            'Lote': registroActual?.lote || '0',
            'Proceso': registroActual?.proceso === 'cernido' ? 'Cernido' :
                registroActual?.proceso === 'seleccionado' ? 'Seleccionado' :
                    registroActual?.proceso === 'ninguno' ? 'Ninguno' : registroActual?.proceso,
            'Microondas': `${registroActual?.microondas || '0'} min`,
            'Terminados': `${registroActual?.terminados || '0'} ud`,
            'Fecha de Registro': formatFechaHoraLiteral(registroActual?.fecha),
            'Fecha de Vencimiento': formatMesAnio(registroActual?.vencimiento),
            'Estado': registroActual?.estado === 'pendiente' ? 'Pendiente' :
                registroActual?.estado === 'verificado' ? 'Verificado' :
                    registroActual?.estado === 'Ingresado' ? 'Ingresado' :
                        registroActual?.estado === 'anulado' ? 'Anulado' : registroActual?.estado,
            'Sucursal': nombreSucursal
        };

        if (registroActual?.observaciones) {
            informacionSuperior['Observaciones'] = registroActual.observaciones;
        }

        if (registroActual?.fecha_verificado) {
            informacionSuperior['Fecha de Verificación'] = formatFechaLiteral(registroActual.fecha_verificado, !isLargeScreen);
        }

        if (registroActual?.cantidad_verificada) {
            informacionSuperior['Cantidad Verificada'] = `${registroActual.cantidad_verificada} ud`;
        }

        // No hay tabla para registros de producción, solo información
        const tablaHeaders = [];
        const tablaValores = [];

        return { informacionSuperior, tablaHeaders, tablaValores };
    };

    const handleOpenVerificar = () => setIsVerificarOpen(true);

    const handleOpenIngreso = () => {
        if (!registroActual?.producto_almacen) {
            showDanger('Error', 'No se encontró la información del producto.');
            return;
        }
        setIsIngresoOpen(true);
    };

    const handleOpenMovimientos = () => {
        if (!registroActual?.id) {
            showDanger('Error', 'No se encontró el ID del registro de producción');
            return;
        }
        setIsMovimientosOpen(true);
    };

    const handleCalcularPago = async () => {
        if (isCalculandoPago) {
            return;
        }

        const permiso = await obtenerPermisoInfo();
        if (!permiso) return;

        if (!reglas || reglas.length === 0) {
            showDanger('Error', 'No hay reglas configuradas para calcular el pago.');
            return;
        }

        setIsCalculandoPago(true);

        try {
            const detalle = registroActual?.producto_almacen;
            if (!detalle) {
                showDanger('Error', 'No se encontró la información del producto.');
                return;
            }

            const regla = seleccionarReglaParaProducto(reglas, registroActual, detalle);

            if (!regla) {
                showDanger('Error', 'No existe una regla especial o general para realizar el cálculo de este registro.');
                return;
            }

            const usarCantidadVerificada = ['verificado', 'Ingresado'].includes(registroActual?.estado);
            const cantidadBase = usarCantidadVerificada
                ? Number(registroActual?.cantidad_verificada)
                : Number(registroActual?.terminados);

            if (!cantidadBase || cantidadBase <= 0) {
                showDanger('Error', usarCantidadVerificada
                    ? 'La cantidad verificada debe ser mayor a cero.'
                    : 'La cantidad de terminados debe ser mayor a cero.');
                return;
            }

            const resultado = calcularPagoProcesos({
                regla,
                terminados: cantidadBase,
                productoDetalle: detalle,
                proceso: registroActual?.proceso
            });

            setReglaAplicada(regla);
            setResultadoPago({
                cantidad: cantidadBase,
                cantidadLabel: usarCantidadVerificada ? 'Cantidad verificada' : 'Terminados',
                ...resultado
            });
            setIsPagoOpen(true);
        } catch (error) {
            console.error('Error calculando pago:', error);
            showDanger('Error', error.message || 'No se pudo calcular el pago.');
        } finally {
            setIsCalculandoPago(false);
        }
    };

    const handleMovimientoClick = (movimiento) => {
        setMovimientoSeleccionado(movimiento);
        setIsMovimientosOpen(false);
        setIsVerMovimientoOpen(true);
    };

    const nombreResponsable = registroActual?.user?.name || registroActual?.personal?.name || 'Usuario desconocido';
    const procesoLabel = registroActual?.proceso === 'cernido' ? 'Cernido' : registroActual?.proceso === 'seleccionado' ? 'Seleccionado' : registroActual?.proceso === 'ninguno' ? 'Ninguno' : registroActual?.proceso || '--';

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Detalles<StatusBadge estado={registroActual?.estado} variant="produccion" /></h1>
                        <p className={styles.subTitle}>Registrado el {formatFechaLiteral(registroActual?.fecha, !isLargeScreen)} - {formatHoraSinSegundos(registroActual?.fecha)}</p>
                    </div>
                    <div className={styles.iconButton}>
                        <Boton
                            iconName="download"
                            label="Descargar"
                            className="btn-default"
                            onClick={() => setIsDescargaOpen(true)}
                            hideTextOnMobile={true}
                        />
                    </div>
                </div>

                <div className={styles.contentRow}>
                    {/* Primera columna: Responsable + todos los datos de producción */}
                    <div className={styles.contentHalf}>
                        <div className={styles.content} style={{height:'100%'}}>
                            <ItemView
                                title="Información de la Producción"
                                transparent={true}
                                icon="box"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <Dato label="Nombre" value={nombreResponsable} vertical={false} />
                            <Dato label="Producto" value={registroActual?.producto_almacen?.name || 'Sin producto'} vertical={false} />
                            <Dato label="Lote" value={registroActual?.lote || '0'} vertical={false} />
                            <Dato label="Proceso" value={procesoLabel} vertical={false} />
                            <Dato label="Tiempo de Microondas" value={`${registroActual?.microondas || '0'} segundos`} vertical={false} />
                            <Dato label="Cantidad Terminados" value={`${registroActual?.terminados || '0'} unidades`} vertical={false} />
                            <Dato label="Fecha de Vencimiento" value={formatMesAnio(registroActual?.vencimiento)} vertical={false} />
                            {registroActual?.observaciones && (
                                <Dato label="Observaciones" value={registroActual.observaciones} vertical={false} />
                            )}
                        </div>
                    </div>

                    {/* Segunda columna: Datos de verificación (o NoData si no está verificado) */}
                    <div className={styles.contentHalf}>
                        <div className={styles.content} style={{ height: '100%' }}>
                            <ItemView
                                title="Información de Verificación"
                                transparent={true}
                                icon="check-double"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            {registroActual?.estado !== 'pendiente' && registroActual?.fecha_verificado ? (
                                <>
                                    <Dato label="Fecha de Verificación" value={formatFechaLiteral(registroActual.fecha_verificado, !isLargeScreen)} vertical={false} />
                                    <Dato label="Cantidad Verificada" value={`${registroActual.cantidad_verificada} unidades`} vertical={false} especial='green' />
                                    <Dato label="Cantidad Ingresada" value={`${registroActual.cantidad_ingresada} unidades`} vertical={false} especial='blue' />
                                </>
                            ) : (
                                <NoData
                                    icon="check-shield"
                                    title="Falta información de verificación"
                                    detail="Este registro aún no ha sido verificado. Use el botón 'Verificar Producción' cuando corresponda."
                                    transparent={true}
                                    minHeight="140px"
                                />
                            )}
                        </div>
                        <Boton
                            className='btn-gray'
                            label='Calcular Pago'
                            onClick={handleCalcularPago}
                            loading={isCalculandoPago || isCheckingPermiso}
                            disabled={isCalculandoPago || isCheckingPermiso}
                            readOnly={registroActual?.estado !== 'verificado' && registroActual?.estado !== 'Ingresado'}
                            iconName='calculator'
                        />

                        <Boton
                            className='btn-gray'
                            label='Movimientos de Ingreso'
                            onClick={handleOpenMovimientos}
                            readOnly={registroActual?.estado !== 'verificado' && registroActual?.estado !== 'Ingresado'}
                            iconName='transfer-alt'
                        />

                    </div>
                </div>



                <div className={styles.buttons}>
                    {registroActual?.estado === 'pendiente' ? (
                        <>
                            <Boton
                                className='btn-default'
                                label='Verificar Registro'
                                style={{ marginTop: 'auto' }}
                                onClick={handleOpenVerificar}
                                iconName='check-double'
                                hideTextOnMobile={true}
                            />
                            <Boton
                                className='btn-red'
                                label='Eliminar Registro'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsEliminarOpen(true)}
                                iconName='trash'
                                hideTextOnMobile={true}
                            />
                        </>
                    ) : registroActual?.estado === 'verificado' || registroActual?.estado === 'Ingresado' ? (
                        <>
                            {(registroActual?.cantidad_ingresada || 0) < (registroActual?.cantidad_verificada || 0) && (
                                <Boton
                                    className='btn-default'
                                    label='Ingresar Producción'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleOpenIngreso}
                                    iconName='plus'
                                    hideTextOnMobile={true}
                                />
                            )}
                            {(registroActual?.cantidad_ingresada || 0) === 0 && (
                                <Boton
                                    className='btn-orange'
                                    label='Anular Verificación'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsAnularOpen(true)}
                                    iconName='block'
                                    hideTextOnMobile={true}
                                />
                            )}
                        </>
                    ) : null}
                </div>
            </div>

            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Registro de Producción"
                subtitulo="Selecciona el formato que prefieras para descargar este registro."
                nombreArchivo={`Registro_Produccion_${registroActual?.lote || '0'}_${formatFechaLiteral(registroActual?.fecha, false).replace(/\s+/g, '_')}`}
                {...prepararDatosDescarga()}
            />

            <ModalVerificar
                isOpen={isVerificarOpen}
                setIsOpen={setIsVerificarOpen}
                registro={registroActual}
                onVerificado={(data) => {
                    setRegistroActual(data);
                    if (onRegistroVerificado) onRegistroVerificado(data);
                }}
            />

            <ModalAnularVerificacion
                isOpen={isAnularOpen}
                setIsOpen={setIsAnularOpen}
                registro={registroActual}
                onAnulado={(data) => {
                    setRegistroActual(data);
                    if (onRegistroVerificado) onRegistroVerificado(data);
                }}
            />

            <ModalEliminar
                isOpen={isEliminarOpen}
                setIsOpen={setIsEliminarOpen}
                registro={registroActual}
                onEliminado={(id) => {
                    if (onRegistroEliminado) onRegistroEliminado(id);
                    setIsOpen(false);
                }}
            />

            <IngresoProduccion
                isOpen={isIngresoOpen}
                setIsOpen={setIsIngresoOpen}
                producto={registroActual?.producto_almacen}
                cantidadVerificada={registroActual?.cantidad_verificada || 0}
                cantidadIngresada={registroActual?.cantidad_ingresada || 0}
                registroId={registroActual?.id}
                responsable={registroActual?.user?.name || registroActual?.personal?.name || 'Usuario desconocido'}
                onIngresoRealizado={(datos) => {
                    if (onRegistroVerificado) {
                        const registroActualizado = datos.registroActualizado || {
                            ...registroActual,
                            cantidad_ingresada: datos.nuevaCantidadIngresadaTotal,
                            estado: datos.nuevoEstado
                        };
                        onRegistroVerificado(registroActualizado);
                    }
                    setIsOpen(false);
                }}
            />

            <ModalMovimientos
                isOpen={isMovimientosOpen}
                setIsOpen={setIsMovimientosOpen}
                registroId={registroActual?.id}
                onMovimientoClick={handleMovimientoClick}
                formatFechaLiteral={formatFechaLiteral}
                isLargeScreen={isLargeScreen}
            />

            {movimientoSeleccionado && (
                <VerMovimiento
                    isOpen={isVerMovimientoOpen}
                    setIsOpen={setIsVerMovimientoOpen}
                    movimiento={movimientoSeleccionado}
                />
            )}

            <CalculoPagoModal
                isOpen={isPagoOpen}
                setIsOpen={setIsPagoOpen}
                resultadoPago={resultadoPago}
                reglaAplicada={reglaAplicada}
            />
        </View >
    );
}

export default VerProduccion;