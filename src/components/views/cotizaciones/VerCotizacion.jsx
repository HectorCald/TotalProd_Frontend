import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import ItemView from '../../common/ItemView';
import { useLayout } from '../../../context/LayoutContext';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import { useToast } from '../../../context/ToastContext';
import DescargaCotizacionBuilder from './DescargaCotizacionBuilder';
import AlmacenGeneral from '../almacen-general/AlmacenGeneral';
import AlmacenGeneralAuxiliar from '../almacen-general-auxiliar/AlmacenGeneral-Auxiliar';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/numberUtils';
import { calcularResumenFinanciero } from '../../../utils/movimientoCalculations';
import ResumenFinanciero from '../../ui/ResumenFinanciero';
import ModalProductos from './modales/ModalProductos';
import ModalEliminar from './modales/ModalEliminar';
import ModalAnular from './modales/ModalAnular';
import ModalAprobar from './modales/ModalAprobar';
import ModalFinalizar from './modales/ModalFinalizar';
import ModalRevertirAprobacion from './modales/ModalRevertirAprobacion';
import ModalAnularCompletado from './modales/ModalAnularCompletado';
import StatusBadge from '../../common/StatusBadge';
import clientService from '../../../services/clientService';
import Skeleton from '../../common/Skeleton';



function VerCotizacion({ isOpen, setIsOpen, cotizacion, onCotizacionAnulada, onCotizacionEliminada, onCotizacionActualizada }) {
    const { isLargeScreen } = useLayout();
    const { user } = useUser();
    const { employee } = useEmployee();
    const { showDanger } = useToast();
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAprobarOpen, setIsAprobarOpen] = useState(false);
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);
    const [isAlmacenAuxiliarOpen, setIsAlmacenAuxiliarOpen] = useState(false);
    const [isRevertirAprobacionOpen, setIsRevertirAprobacionOpen] = useState(false);
    const [isFinalizarOpen, setIsFinalizarOpen] = useState(false);
    const [isAnularCompletadoOpen, setIsAnularCompletadoOpen] = useState(false);

    // Estado local para la cotización actual
    const [cotizacionActual, setCotizacionActual] = useState(cotizacion);

    // Estado para la información del cliente
    const [clienteInfo, setClienteInfo] = useState(null);
    const [loadingCliente, setLoadingCliente] = useState(false);

    // Actualizar el estado local cuando cambie el prop cotizacion
    useEffect(() => {
        setCotizacionActual(cotizacion);
    }, [cotizacion]);

    // Cargar información del cliente cuando hay cliente_id
    useEffect(() => {
        const cargarCliente = async () => {
            if (cotizacionActual?.cliente_id) {
                setLoadingCliente(true);
                setClienteInfo(null); // Resetear antes de cargar
                try {
                    const response = await clientService.getById(cotizacionActual.cliente_id);
                    if (response && response.success) {
                        setClienteInfo(response.data);
                    } else {
                        console.warn('No se pudo cargar la información del cliente:', response?.message);
                        setClienteInfo(null);
                    }
                } catch (error) {
                    console.error('Error al cargar información del cliente:', error);
                    setClienteInfo(null);
                    // No mostrar notificación aquí para no molestar al usuario
                } finally {
                    setLoadingCliente(false);
                }
            } else {
                setClienteInfo(null);
                setLoadingCliente(false);
            }
        };

        cargarCliente();
    }, [cotizacionActual?.cliente_id]);


    // Filas preparadas para ModalTable (para PC)
    const rowsMemo = useMemo(() => (cotizacionActual?.productos || [])
        .sort((a, b) => (a?.producto?.name || '').localeCompare(b?.producto?.name || '', 'es', { sensitivity: 'base' }))
        .map((productoCotizacion) => {
            const cantidad = parseFloat(productoCotizacion.cantidad) || 0;
            const grup = parseFloat(productoCotizacion.producto?.grup) || 0;
            const esAgrupado = cotizacionActual?.agrupado && grup > 0;
            const precioUnitario = parseFloat(productoCotizacion.precio_unitario) || 0;

            let cantidadTexto;
            let precioTexto;

            if (esAgrupado) {
                const grupos = Math.floor(cantidad / grup);
                const unidades = cantidad % grup;
                cantidadTexto = unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                // Precio unitario multiplicado por la cantidad de agrupación
                precioTexto = formatCurrency(precioUnitario * grup);
            } else {
                cantidadTexto = `${cantidad} ud`;
                precioTexto = formatCurrency(precioUnitario);
            }

            return [
                productoCotizacion.producto?.name || 'Sin nombre',
                cantidadTexto,
                precioTexto,
                formatCurrency(productoCotizacion.subtotal)
            ];
        }), [cotizacionActual?.productos, cotizacionActual?.agrupado]);



    const obtenerProductosFuente = () => {
        const productosAct = cotizacionActual?.productos || [];
        const productosOriginales = cotizacion?.productos || [];
        const productosActInvalidos =
            cotizacionActual?.estado === 'anulado' &&
            (!productosAct.length || productosAct.some(p => !p?.producto?.id || p.precio_unitario === 0));
        return productosActInvalidos ? productosOriginales : productosAct;
    };

    // Handle para realizar venta
    const handleRealizarVenta = () => {
        if (!cotizacionActual?.productos || cotizacionActual.productos.length === 0) {
            showDanger('Error', 'No hay productos en la cotización para realizar la venta');
            return;
        }

        const productosFuente = obtenerProductosFuente();
        if (!productosFuente || productosFuente.length === 0) {
            showDanger('Error', 'No se pudo preparar la cotización para la venta');
            return;
        }

        // Limpiar datos previos de movimientos
        [
            'canastaSalidas',
            'movimientoIdRepitiendo',
            'movimientoIdEditando',
            'precioIdRepitiendo',
            'precioIdEditando',
            'movimientoAgrupadoRepitiendo',
            'movimientoAgrupadoEditando',
            'clienteIdRepitiendo',
            'clienteNameRepitiendo',
            'metodoPagoRepitiendo',
            'metodoPagoEditando',
            'productosMovimientoRepitiendo',
            'productosMovimientoEditando',
            'descuentoMovimientoRepitiendo',
            'aumentoMovimientoRepitiendo',
            'conceptoMovimientoRepitiendo',
            'descuentoMovimientoEditando',
            'aumentoMovimientoEditando',
            'conceptoMovimientoEditando',
            'fechaMovimientoEditando',
            'productosEdicion',
            'numeroOrdenEditando'
        ].forEach(key => localStorage.removeItem(key));

        // Guardar productos del movimiento para cargar automáticamente
        const productosMovimiento = (productosFuente || [])
            .map((productoCotizacion) => {
                const prodId = productoCotizacion?.producto?.id ?? productoCotizacion?.producto_id;
                if (!prodId) return null;

                let cantidadParaGuardar = Number(productoCotizacion?.cantidad) || 0;

                // Si la cotización es agrupada, convertir la cantidad a grupos
                if (cotizacionActual?.agrupado && productoCotizacion?.producto?.grup) {
                    const grup = Number(productoCotizacion.producto.grup) || 0;
                    if (grup > 0) {
                        cantidadParaGuardar = Math.round(cantidadParaGuardar / grup);
                    }
                }

                return {
                    id: prodId,
                    cantidad: cantidadParaGuardar
                };
            })
            .filter(Boolean);
        localStorage.setItem('productosMovimientoRepitiendo', JSON.stringify(productosMovimiento));
        localStorage.setItem('precioIdRepitiendo', cotizacionActual.precio_id || '');
        localStorage.setItem('movimientoAgrupadoRepitiendo', cotizacionActual.agrupado ? 'agrupado' : 'no_agrupado');
        if (cotizacionActual.metodo_pago) {
            localStorage.setItem('metodoPagoRepitiendo', cotizacionActual.metodo_pago);
        }

        if (cotizacionActual.cliente?.id) {
            localStorage.setItem('clienteIdRepitiendo', cotizacionActual.cliente.id);
            localStorage.setItem('clienteNameRepitiendo', cotizacionActual.cliente.name || '');
        } else {
            localStorage.removeItem('clienteIdRepitiendo');
            localStorage.removeItem('clienteNameRepitiendo');
        }

        localStorage.setItem('isVentaCotizacion', 'true');

        // Abrir AlmacenGeneral en modo salida
        setIsAlmacenOpen(true);
    };

    // Handle para repetir cotización
    const handleRepetirCotizacion = () => {
        if (!cotizacionActual) {
            showDanger('Error', 'No hay cotización para repetir');
            return;
        }

        // Limpiar completamente la canasta de cotizaciones en localStorage
        localStorage.removeItem('canastaCotizaciones');
        localStorage.removeItem('precioIdCotizacionRepitiendo');
        localStorage.removeItem('cotizacionAgrupadoRepitiendo');
        localStorage.removeItem('clienteIdCotizacionRepitiendo');
        localStorage.removeItem('clienteNameCotizacionRepitiendo');
        localStorage.removeItem('metodoPagoCotizacionRepitiendo');
        localStorage.removeItem('fechaVencimientoCotizacionRepitiendo');
        localStorage.removeItem('productosCotizacionRepitiendo');

        // Guardar datos de la cotización para repetir
        localStorage.setItem('precioIdCotizacionRepitiendo', cotizacionActual.precio_id || '');
        localStorage.setItem('cotizacionAgrupadoRepitiendo', cotizacionActual.agrupado ? 'agrupado' : 'no_agrupado');
        localStorage.setItem('metodoPagoCotizacionRepitiendo', cotizacionActual.metodo_pago || '');

        // Guardar información del cliente si existe
        if (cotizacionActual.cliente?.id) {
            localStorage.setItem('clienteIdCotizacionRepitiendo', cotizacionActual.cliente.id);
            localStorage.setItem('clienteNameCotizacionRepitiendo', cotizacionActual.cliente.name || '');
        } else {
            localStorage.removeItem('clienteIdCotizacionRepitiendo');
            localStorage.removeItem('clienteNameCotizacionRepitiendo');
        }

        // Guardar fecha de vencimiento si existe
        if (cotizacionActual.fecha_vencimiento) {
            localStorage.setItem('fechaVencimientoCotizacionRepitiendo', cotizacionActual.fecha_vencimiento);
        } else {
            localStorage.removeItem('fechaVencimientoCotizacionRepitiendo');
        }

        // Guardar productos de la cotización para cargar automáticamente
        const productosFuente = obtenerProductosFuente();
        const productosCotizacion = (productosFuente || [])
            .map((productoCotizacion) => {
                const prodId = productoCotizacion?.producto?.id ?? productoCotizacion?.producto_id;
                if (!prodId) return null;

                let cantidadParaGuardar = Number(productoCotizacion?.cantidad) || 0;

                // Si la cotización es agrupada, convertir la cantidad a grupos
                if (cotizacionActual?.agrupado && productoCotizacion?.producto?.grup) {
                    const grup = Number(productoCotizacion.producto.grup) || 0;
                    if (grup > 0) {
                        cantidadParaGuardar = Math.round(cantidadParaGuardar / grup);
                    }
                }

                return {
                    id: prodId,
                    cantidad: cantidadParaGuardar
                };
            })
            .filter(Boolean);
        localStorage.setItem('productosCotizacionRepitiendo', JSON.stringify(productosCotizacion));

        // Abrir AlmacenGeneral-Auxiliar en modo cotizar
        setIsAlmacenAuxiliarOpen(true);
    };

    const currentUserId = user?.id ? String(user.id) : null;
    const currentPersonalId = employee?.id ? String(employee.id) : null;
    const cotizacionUserId = cotizacionActual?.user?.id
        ? String(cotizacionActual.user.id)
        : cotizacionActual?.user_id
            ? String(cotizacionActual.user_id)
            : null;
    const cotizacionPersonalId = cotizacionActual?.personal?.id
        ? String(cotizacionActual.personal.id)
        : cotizacionActual?.personal_id
            ? String(cotizacionActual.personal_id)
            : null;

    const esSesionEmpleado = Boolean(employee?.id);
    const esResponsableUsuario = currentUserId && cotizacionUserId && currentUserId === cotizacionUserId;
    const esResponsableEmpleado = currentPersonalId && cotizacionPersonalId && currentPersonalId === cotizacionPersonalId;
    const esResponsable = !esSesionEmpleado || Boolean(esResponsableUsuario || esResponsableEmpleado);

    const tienePermisoSalidas = useMemo(() => {
        if (!employee?.modules || !Array.isArray(employee.modules)) return false;

        return employee.modules.some(module => {
            const mainModule = (module?.modulos?.name || '').toString().trim().toLowerCase();
            if (mainModule !== 'almacen') return false;
            const subModule = (module?.name || '').toString().trim().toLowerCase();
            return subModule === 'salida o venta' ||
                subModule === 'salida' ||
                subModule === 'realizar_salidas' ||
                subModule === 'salidaoventa';
        });
    }, [employee]);

    const puedeGestionarSalidas = !esSesionEmpleado || tienePermisoSalidas;

    const estadoCotizacion = cotizacionActual?.estado;
    const puedeAprobar = esResponsable && estadoCotizacion === 'pendiente';
    const puedeAnularAprobacion = esResponsable && estadoCotizacion === 'aprobada';
    const puedeFinalizar = estadoCotizacion === 'aprobada' && puedeGestionarSalidas;
    const puedeAnularCompletado = estadoCotizacion === 'completado' && puedeGestionarSalidas;
    const puedeRealizarVenta = estadoCotizacion === 'aprobada' && puedeGestionarSalidas;
    const puedeAnular = (!esSesionEmpleado || esResponsable) && estadoCotizacion !== 'anulado' && estadoCotizacion !== 'aprobada' && estadoCotizacion !== 'completado' && !cotizacionActual?.tiene_pedido_relacionado;
    const puedeEliminar = (!esSesionEmpleado || esResponsable) && estadoCotizacion === 'anulado';
    const puedeRepetir = Boolean(cotizacionActual) && (
        estadoCotizacion !== 'aprobada' ||
        (estadoCotizacion === 'aprobada' && esSesionEmpleado && !esResponsable)
    );
    const estadoLabel = estadoCotizacion === 'anulado'
        ? 'Anulado'
        : estadoCotizacion === 'aprobada'
            ? 'Aprobada'
            : estadoCotizacion === 'completado'
                ? 'Completado'
                : 'Pendiente';
    const estadoColor = estadoCotizacion === 'anulado'
        ? 'red'
        : estadoCotizacion === 'aprobada'
            ? 'green'
            : estadoCotizacion === 'completado'
                ? 'blue'
                : 'orange';

    if (!cotizacionActual) return null;

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{cotizacionActual?.codigo || 'Detalles'}<StatusBadge estado={cotizacionActual?.estado} pendienteColor="orange" /></h1>
                        <p className={styles.subTitle}> Registrado el {formatFechaLiteral(cotizacionActual?.fecha, !isLargeScreen) + ' - ' + formatHoraSinSegundos(cotizacionActual?.fecha)}</p>
                    </div>
                    <div className={styles.iconButton}>
                        <Boton
                            iconName='download'
                            label='Descargar'
                            className='btn-default'
                            onClick={() => setIsDescargaOpen(true)}
                            hideTextOnMobile={true}
                        />
                    </div>
                </div>
                <div className={styles.contentRow}>
                    {/* Primera columna: Información del cliente (solo para cotizaciones con cliente) */}
                    {cotizacionActual?.cliente_id && (
                        <div className={styles.contentHalf}>
                            <div className={styles.content}>
                                <ItemView
                                    title="Información del Cliente"
                                    transparent={true}
                                    icon="user"
                                    iconShape="square"
                                    style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                />
                                {loadingCliente ? (
                                    <>
                                        <Skeleton width="100%" height="25px" />
                                        <Skeleton width="100%" height="25px" />
                                        <Skeleton width="100%" height="25px" />
                                        <Skeleton width="100%" height="25px" />
                                        <Skeleton width="100%" height="25px" />
                                    </>
                                ) : clienteInfo ? (
                                    <>
                                        <Dato label="Nombre" value={clienteInfo?.name || 'N/A'} vertical={false} />
                                        <Dato label="Celular" value={clienteInfo?.phone || 'N/A'} vertical={false} />
                                        <Dato label="Descripción" value={clienteInfo?.description || 'Sin descripción'} vertical={false} />
                                        <Dato label="Pedidos realizados" value={clienteInfo?.total_orders + ' Pedidos' || '0 Pedidos'} vertical={false} />
                                        <Dato label="Ubicación" value={clienteInfo?.location || 'Sin ubicación'} vertical={false} />
                                    </>
                                ) : (
                                    <Dato label="Cliente" value="No se pudo cargar la información" vertical={false} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Segunda columna: Detalles de la cotización */}
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Detalles de la Cotización"
                                transparent={true}
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                icon="file"
                            />
                            {cotizacionActual?.metodo_pago && (
                                <Dato
                                    label="Método de pago"
                                    value={cotizacionActual.metodo_pago.toUpperCase()}
                                    vertical={false}
                                />
                            )}
                            <Dato
                                label="Responsable"
                                value={cotizacionActual?.user?.first_name + ' ' + cotizacionActual?.user?.last_name || cotizacionActual?.personal?.first_name + ' ' + cotizacionActual?.personal?.last_name || 'Usuario desconocido'}
                                vertical={false}
                            />
                            <Dato
                                label="Tipo de precio"
                                value={cotizacionActual?.precio?.name || 'Precio desconocido'}
                                vertical={false}
                            />
                            <Dato
                                label="Modalidad"
                                value={cotizacionActual?.agrupado ? 'Agrupado' : 'Unidades'}
                                vertical={false}
                            />
                            <Dato
                                label="Vencimiento"
                                value={formatFechaLiteral(cotizacionActual?.fecha_vencimiento, !isLargeScreen)}
                                vertical={false}
                            />
                        </div>
                    </div>
                </div>
                {/* Botón para ver productos - solo para cotizaciones con múltiples productos */}
                {cotizacionActual?.productos && cotizacionActual.productos.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label={`Lista de Productos`}
                        onClick={() => setIsProductosOpen(true)}
                    />
                )}

                {/* Resumen Financiero - Fuera del content de transacción */}
                {cotizacionActual?.productos && cotizacionActual.productos.length > 0 && (
                    <ResumenFinanciero resumen={calcularResumenFinanciero(cotizacionActual)} />
                )}




                {/* Observaciones de la cotización */}
                {cotizacionActual?.observaciones && (
                    <>
                        <p className={styles.subTitle}>OBSERVACIONES</p>
                        <div className={styles.content}>
                            <Dato
                                label="Observaciones"
                                value={cotizacionActual.observaciones}
                                vertical={true}
                            />
                        </div>
                    </>
                )}

                <div className={styles.buttons}>
                    {puedeAnularCompletado ? (
                        <>
                            {puedeRepetir && (
                                <Boton
                                    className='btn-default'
                                    label='Repetir Cotización'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleRepetirCotizacion}
                                    hideTextOnMobile={true}
                                    iconName='repeat'
                                />
                            )}
                            <Boton
                                className='btn-red'
                                label='Anular Completado'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsAnularCompletadoOpen(true)}
                                hideTextOnMobile={true}
                                iconName='trash'
                            />
                        </>
                    ) : (
                        <>
                            {puedeRepetir && (
                                <Boton
                                    className='btn-default'
                                    label='Repetir Cotización'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleRepetirCotizacion}
                                    hideTextOnMobile={true}
                                    iconName='repeat'
                                />
                            )}
                            {puedeAprobar && (
                                <Boton
                                    className='btn-gray'
                                    label='Aprobar Cotización'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsAprobarOpen(true)}
                                    hideTextOnMobile={true}
                                    iconName='check-circle'
                                />
                            )}
                            {puedeAnularAprobacion && (
                                <Boton
                                    className='btn-red'
                                    label='Anular aprobación'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsRevertirAprobacionOpen(true)}
                                    hideTextOnMobile={true}
                                    iconName='trash'
                                />
                            )}
                            {puedeFinalizar && (
                                <Boton
                                    className='btn-gray'
                                    label='Finalizar Cotización'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsFinalizarOpen(true)}
                                    hideTextOnMobile={true}
                                    iconName='check'
                                />
                            )}
                            {puedeRealizarVenta && (
                                <Boton
                                    className='btn-green'
                                    label='Realizar Venta'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleRealizarVenta}
                                    hideTextOnMobile={true}
                                    iconName='check-circle'
                                />
                            )}
                            {puedeAnular && (
                                <Boton
                                    className='btn-red'
                                    label='Anular Cotización'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsAnularOpen(true)}
                                    hideTextOnMobile={true}
                                    iconName='trash'
                                />
                            )}
                            {puedeEliminar && (
                                <Boton
                                    className='btn-red'
                                    label='Eliminar Cotización'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsEliminarOpen(true)}
                                    hideTextOnMobile={true}
                                    iconName='trash'
                                />
                            )}
                        </>
                    )}
                </div>
            </div>



            {/* Modal de productos */}
            <ModalProductos
                isOpen={isProductosOpen}
                setIsOpen={setIsProductosOpen}
                cotizacionActual={cotizacionActual}
                rowsMemo={rowsMemo}
            />

            {/* Modal de anular cotización */}
            <ModalAnular
                isOpen={isAnularOpen}
                setIsOpen={setIsAnularOpen}
                cotizacionActual={cotizacionActual}
                setCotizacionActual={setCotizacionActual}
                onCotizacionAnulada={onCotizacionAnulada}
                onCotizacionActualizada={onCotizacionActualizada}
            />

            {/* Modal para revertir aprobación */}
            <ModalRevertirAprobacion
                isOpen={isRevertirAprobacionOpen}
                setIsOpen={setIsRevertirAprobacionOpen}
                cotizacionActual={cotizacionActual}
                setCotizacionActual={setCotizacionActual}
                onCotizacionActualizada={onCotizacionActualizada}
            />

            {/* Modal para finalizar cotización */}
            <ModalFinalizar
                isOpen={isFinalizarOpen}
                setIsOpen={setIsFinalizarOpen}
                cotizacionActual={cotizacionActual}
                setCotizacionActual={setCotizacionActual}
                onCotizacionActualizada={onCotizacionActualizada}
            />

            {/* Modal para anular completado */}
            <ModalAnularCompletado
                isOpen={isAnularCompletadoOpen}
                setIsOpen={setIsAnularCompletadoOpen}
                cotizacionActual={cotizacionActual}
                setCotizacionActual={setCotizacionActual}
                onCotizacionActualizada={onCotizacionActualizada}
            />

            {/* Modal de eliminar cotización */}
            <ModalEliminar
                isOpen={isEliminarOpen}
                setIsOpen={setIsEliminarOpen}
                cotizacionActual={cotizacionActual}
                onCotizacionEliminada={onCotizacionEliminada}
                onClose={() => setIsOpen(false)}
            />

            {/* Modal de aprobar cotización */}
            <ModalAprobar
                isOpen={isAprobarOpen}
                setIsOpen={setIsAprobarOpen}
                cotizacionActual={cotizacionActual}
                setCotizacionActual={setCotizacionActual}
                onCotizacionActualizada={onCotizacionActualizada}
            />

            {/* Modal de descarga */}
            <DescargaCotizacionBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                cotizacionId={cotizacionActual?.id}
                cotizacionData={cotizacionActual}
            />


            {/* Modal de AlmacenGeneral para realizar venta */}
            <AlmacenGeneral
                isOpen={isAlmacenOpen}
                setIsOpen={setIsAlmacenOpen}
                tipo="salida"
                isVentaCotizacionProp={true}
                onCerrarCanasta={() => {
                    // Limpiar localStorage cuando se cierre
                    localStorage.removeItem('productosMovimientoRepitiendo');
                    localStorage.removeItem('precioIdRepitiendo');
                    localStorage.removeItem('movimientoAgrupadoRepitiendo');
                    localStorage.removeItem('clienteIdRepitiendo');
                    localStorage.removeItem('clienteNameRepitiendo');
                    localStorage.removeItem('metodoPagoRepitiendo');
                    localStorage.removeItem('isVentaCotizacion');
                }}
            />

            {/* Modal de AlmacenGeneral-Auxiliar para repetir cotización */}
            <AlmacenGeneralAuxiliar
                isOpen={isAlmacenAuxiliarOpen}
                setIsOpen={setIsAlmacenAuxiliarOpen}
                tipo="cotizar"
                isRepitiendoCotizacion={true}
            />
        </View>
    );
}
export default VerCotizacion;