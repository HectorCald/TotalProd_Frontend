import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/old/Dato';
import Boton from '../../common/botones/Boton';
import ItemView from '../../common/old/ItemView';
import { useToast } from '../../../context/ToastContext';
import DescargaMovimientoBuilder from './DescargaMovimientoBuilder';
import { useLayout } from '../../../context/LayoutContext';
import AlmacenGeneral from '../almacen-general/AlmacenGeneral';
import ModalProductos from './modales/ModalProductos';
import ModalAnular from './modales/ModalAnular';
import ModalEliminar from './modales/ModalEliminar';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import permissionsService from '../../../services/permissionsService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import useHistorialLogger from '../../ui/HistorialLogger';
import { buildMovimientoDetallesParaHistorial } from '../../../utils/logFormatters';
import { formatCurrency } from '../../../utils/numberUtils';
import { calcularResumenFinanciero } from '../../../utils/movimientoCalculations';
import ResumenFinanciero from '../../ui/ResumenFinanciero';
import clientService from '../../../services/clientService';
import Skeleton from '../../common/widgets/Skeleton';
import StatusBadge from '../../common/old/StatusBadge';

function VerMovimiento({ isOpen, setIsOpen, movimiento, onMovimientoAnulado, onMovimientoEliminado, onMovimientoActualizado, onMovimientoEditado }) {
    const { isLargeScreen } = useLayout();
    const { showSuccess, showDanger, showWarning } = useToast();
    const { logAccion } = useHistorialLogger({ modulo: 'Movimientos' });
    const [loadingEditar, setLoadingEditar] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);
    const [modoAlmacen, setModoAlmacen] = useState('repetir'); // 'repetir' para repetir movimiento

    // Estado local para el movimiento actual
    const [movimientoActual, setMovimientoActual] = useState(movimiento);

    // Estado para la información del cliente
    const [clienteInfo, setClienteInfo] = useState(null);
    const [loadingCliente, setLoadingCliente] = useState(false);

    // Actualizar el estado local cuando cambie el prop movimiento
    useEffect(() => {
        setMovimientoActual(movimiento);
    }, [movimiento]);

    // Cargar información del cliente cuando hay cliente_id
    useEffect(() => {
        const cargarCliente = async () => {
            if (movimientoActual?.cliente_id && movimientoActual?.type === 'salida') {
                setLoadingCliente(true);
                setClienteInfo(null); // Resetear antes de cargar
                try {
                    const response = await clientService.getById(movimientoActual.cliente_id);
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
    }, [movimientoActual?.cliente_id, movimientoActual?.type]);


    // Filas preparadas para ModalTable (para PC)
    const rowsMemo = useMemo(() => {
        // Usar productos originales si el movimiento está anulado y los productos actuales están vacíos
        const productosParaMostrar = movimientoActual?.estado === 'anulado' &&
            (!movimientoActual?.productos || movimientoActual.productos.length === 0 ||
                movimientoActual.productos.some(p => !p.producto?.name || p.precio_unitario === 0))
            ? movimiento?.productos || []
            : movimientoActual?.productos || [];

        return productosParaMostrar
            .sort((a, b) => (a?.producto?.name || '').localeCompare(b?.producto?.name || '', 'es', { sensitivity: 'base' }))
            .map((productoMovimiento) => {
                const cantidad = parseFloat(productoMovimiento.cantidad) || 0;
                const grup = parseFloat(productoMovimiento.producto?.grup) || 0;
                const esAgrupado = movimientoActual?.agrupado && grup > 0;
                const precioUnitario = parseFloat(productoMovimiento.precio_unitario) || 0;

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
                    productoMovimiento.producto?.name || 'Sin nombre',
                    cantidadTexto,
                    precioTexto,
                    formatCurrency(productoMovimiento.subtotal)
                ];
            });
    }, [movimientoActual?.productos, movimientoActual?.agrupado, movimientoActual?.estado, movimiento?.productos]);

    const obtenerProductosFuente = () => {
        const productosAct = movimientoActual?.productos || [];
        const productosOriginales = movimiento?.productos || [];
        const productosActInvalidos =
            movimientoActual?.estado === 'anulado' &&
            (!productosAct.length || productosAct.some(p => !p?.producto?.id || p.precio_unitario === 0));
        return productosActInvalidos ? productosOriginales : productosAct;
    };



    // Handle para repetir movimiento
    const handleRepetirMovimiento = () => {
        if (!movimientoActual) {
            showDanger('Error', 'No hay movimiento para repetir');
            return;
        }

        // Limpiar completamente la canasta de salidas en localStorage
        localStorage.removeItem('canastaSalidas');
        localStorage.removeItem('movimientoIdRepitiendo');
        localStorage.removeItem('movimientoIdEditando');
        localStorage.removeItem('precioIdRepitiendo');
        localStorage.removeItem('precioIdEditando');
        localStorage.removeItem('movimientoAgrupadoRepitiendo');
        localStorage.removeItem('movimientoAgrupadoEditando');
        localStorage.removeItem('clienteIdRepitiendo');
        localStorage.removeItem('clienteNameRepitiendo');
        localStorage.removeItem('metodoPagoRepitiendo');
        localStorage.removeItem('productosMovimientoRepitiendo');
        localStorage.removeItem('productosMovimientoEditando');
        localStorage.removeItem('descuentoMovimientoRepitiendo');
        localStorage.removeItem('aumentoMovimientoRepitiendo');
        localStorage.removeItem('descuentoAumentoPorcentajeRepitiendo');
        localStorage.removeItem('conceptoMovimientoRepitiendo');
        localStorage.removeItem('descuentoMovimientoEditando');
        localStorage.removeItem('aumentoMovimientoEditando');
        localStorage.removeItem('descuentoAumentoPorcentajeEditando');
        localStorage.removeItem('fechaMovimientoEditando');
        localStorage.removeItem('movimientoIdEditando');
        localStorage.removeItem('productosEdicion');
        localStorage.removeItem('numeroOrdenEditando');

        // Guardar datos del movimiento para repetir (como nueva salida)
        localStorage.setItem('precioIdRepitiendo', movimientoActual.precio_id || '');
        localStorage.setItem('movimientoAgrupadoRepitiendo', movimientoActual.agrupado ? 'agrupado' : 'no_agrupado');
        localStorage.setItem('metodoPagoRepitiendo', movimientoActual.metodo_pago || '');

        // Calcular el subtotal para convertir montos a porcentajes
        const productosFuente = obtenerProductosFuente();
        const subtotalMovimiento = productosFuente.reduce((sum, producto) => {
            return sum + (parseFloat(producto.subtotal) || 0);
        }, 0);

        // Convertir montos de descuento y aumento según el modo original
        const descuentoMonto = parseFloat(movimientoActual?.descuento ?? movimiento?.descuento ?? 0);
        const aumentoMonto = parseFloat(movimientoActual?.aumento ?? movimiento?.aumento ?? 0);
        const esPorcentaje = movimientoActual?.porcentaje === true;

        // Guardar el modo de descuento/aumento (porcentaje o monto)
        if (descuentoMonto > 0 || aumentoMonto > 0) {
            localStorage.setItem('descuentoAumentoPorcentajeRepitiendo', esPorcentaje ? 'true' : 'false');
        } else {
            localStorage.removeItem('descuentoAumentoPorcentajeRepitiendo');
        }

        if (!isNaN(descuentoMonto) && descuentoMonto > 0) {
            if (esPorcentaje && subtotalMovimiento > 0) {
                // Si era porcentaje, calcular el porcentaje desde el monto y el subtotal
                const descuentoPorcentaje = (descuentoMonto / subtotalMovimiento) * 100;
                localStorage.setItem('descuentoMovimientoRepitiendo', descuentoPorcentaje.toFixed(2));
            } else {
                // Si era monto directo, guardar el monto
                localStorage.setItem('descuentoMovimientoRepitiendo', descuentoMonto.toFixed(2));
            }
        } else {
            localStorage.removeItem('descuentoMovimientoRepitiendo');
        }

        if (!isNaN(aumentoMonto) && aumentoMonto > 0) {
            if (esPorcentaje && subtotalMovimiento > 0) {
                // Si era porcentaje, calcular el porcentaje desde el monto y el subtotal
                const aumentoPorcentaje = (aumentoMonto / subtotalMovimiento) * 100;
                localStorage.setItem('aumentoMovimientoRepitiendo', aumentoPorcentaje.toFixed(2));
            } else {
                // Si era monto directo, guardar el monto
                localStorage.setItem('aumentoMovimientoRepitiendo', aumentoMonto.toFixed(2));
            }
        } else {
            localStorage.removeItem('aumentoMovimientoRepitiendo');
        }

        // Guardar concepto si existe
        const conceptoMovimiento = movimientoActual?.concepto ?? movimiento?.concepto ?? '';
        if (conceptoMovimiento && conceptoMovimiento.trim() !== '') {
            localStorage.setItem('conceptoMovimientoRepitiendo', conceptoMovimiento.trim());
        } else {
            localStorage.removeItem('conceptoMovimientoRepitiendo');
        }

        // Guardar información del cliente si existe
        if (movimientoActual.cliente?.id) {
            localStorage.setItem('clienteIdRepitiendo', movimientoActual.cliente.id);
            localStorage.setItem('clienteNameRepitiendo', movimientoActual.cliente.name || '');
        } else {
            localStorage.removeItem('clienteIdRepitiendo');
            localStorage.removeItem('clienteNameRepitiendo');
        }

        // Guardar productos del movimiento para cargar automáticamente (robusto post-anulación)
        const productosMovimiento = (productosFuente || [])
            .map((productoMovimiento) => {
                const prodId = productoMovimiento?.producto?.id ?? productoMovimiento?.producto_id;
                if (!prodId) return null;

                let cantidadParaGuardar = Number(productoMovimiento?.cantidad) || 0;

                // Si el movimiento es agrupado, convertir la cantidad a grupos
                if (movimientoActual?.agrupado && productoMovimiento?.producto?.grup) {
                    const grup = Number(productoMovimiento.producto.grup) || 0;
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

        // Abrir AlmacenGeneral en modo salida normal
        setModoAlmacen('salida');
        setIsAlmacenOpen(true);
    };

    const handleEditarMovimiento = async () => {
        setLoadingEditar(true);
        try {
            // Validar permisos de edición primero
            const permisoResponse = await permissionsService.canUpdate();

            if (!permisoResponse.success || !permisoResponse.data?.allowed) {
                showDanger('Error', 'No tienes permisos para editar movimientos');
                setLoadingEditar(false);
                return;
            }

            // Si tiene permisos, continuar con la edición normal (usar las mismas claves de repetir)
            handleRepetirMovimiento();

            // Solo guardar fecha y número de orden para edición (lo demás usa las claves de repetir)
            if (movimientoActual?.fecha) {
                try {
                    const fechaMovimiento = new Date(movimientoActual.fecha);
                    if (!isNaN(fechaMovimiento.getTime())) {
                        localStorage.setItem('fechaMovimientoEditando', fechaMovimiento.toISOString());
                    } else {
                        localStorage.removeItem('fechaMovimientoEditando');
                    }
                } catch (error) {
                    localStorage.removeItem('fechaMovimientoEditando');
                }
            } else {
                localStorage.removeItem('fechaMovimientoEditando');
            }
            if (movimientoActual?.id) {
                localStorage.setItem('movimientoIdEditando', movimientoActual.id);
            } else {
                localStorage.removeItem('movimientoIdEditando');
            }
            if (movimientoActual?.numero_orden !== undefined && movimientoActual?.numero_orden !== null) {
                localStorage.setItem('numeroOrdenEditando', String(movimientoActual.numero_orden));
            } else {
                localStorage.removeItem('numeroOrdenEditando');
            }

            const productosFuente = obtenerProductosFuente();
            if (productosFuente && productosFuente.length > 0) {
                const productosEdicion = productosFuente
                    .map((productoMovimiento) => {
                        const productoBase = productoMovimiento?.producto;
                        if (!productoBase?.id) return null;
                        const cantidadOriginal = Number(productoMovimiento?.cantidad) || 0;
                        return {
                            ...productoBase,
                            cantidad: cantidadOriginal
                        };
                    })
                    .filter(Boolean);

                if (productosEdicion.length > 0) {
                    localStorage.setItem('productosEdicion', JSON.stringify(productosEdicion));
                } else {
                    localStorage.removeItem('productosEdicion');
                }
            } else {
                localStorage.removeItem('productosEdicion');
            }
        } catch (error) {
            console.error('Error validando permisos de edición:', error);
            showDanger('Error', 'Error al verificar permisos de edición');
        } finally {
            setLoadingEditar(false);
        }
    };

    const handleMovimientoEditadoFinalizado = async (nuevoMovimientoId, movimientoAnteriorId) => {
        try {
            const movimientoAntes = movimientoActual;
            if (movimientoAntes && nuevoMovimientoId) {
                const respNuevo = await movimientosAlmacenService.getById(nuevoMovimientoId);
                const movimientoDespues = respNuevo?.success ? respNuevo.data : null;
                const detallesPersonalizados = buildMovimientoDetallesParaHistorial(
                    movimientoAntes,
                    movimientoDespues,
                    'EDITAR'
                );
                const codigoMov = movimientoAntes?.codigo ?? movimientoAntes?.id ?? nuevoMovimientoId;
                await logAccion({
                    accion: 'EDITAR',
                    lugarAfectado: `Movimiento ${codigoMov ? '#' + codigoMov : ''}`.trim() || 'Movimiento',
                    registroId: nuevoMovimientoId,
                    comentario: 'Edición de movimiento',
                    detallesPersonalizados
                });
            }
        } catch (err) {
            console.warn('Error registrando historial de edición de movimiento:', err);
        } finally {
            setIsAlmacenOpen(false);
            setIsOpen(false);
            if (onMovimientoEditado) {
                onMovimientoEditado(nuevoMovimientoId, movimientoAnteriorId);
            }
        }
    };

    if (!movimientoActual) return null;

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{movimientoActual?.codigo || 'DETALLES'}<StatusBadge estado={movimientoActual?.estado} /></h1>
                        <p className={styles.subTitle}> Registrado el {formatFechaLiteral(movimientoActual?.fecha, !isLargeScreen) + ' - ' + formatHoraSinSegundos(movimientoActual?.fecha)}</p>
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
                {/* Layout de dos columnas en PC */}
                <div className={styles.contentRow}>
                    {/* Primera columna: Información del cliente (solo para salidas con cliente) */}
                    {movimientoActual?.type === 'salida' && movimientoActual?.cliente_id && (
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

                    {/* Segunda columna: Detalles de la venta */}
                    <div className={styles.contentHalf}>

                        <div className={styles.content}>
                            <ItemView
                                title="Detalles de la Transacción"
                                transparent={true}
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                icon="credit-card"
                            />
                            {movimientoActual?.metodo_pago && (
                                <Dato label="Método de pago" value={movimientoActual.metodo_pago.toUpperCase()} vertical={false} />
                            )}
                            <Dato
                                label="Vendedor"
                                value={movimientoActual?.user?.name || movimientoActual?.personal?.name || 'Usuario desconocido'}
                                vertical={false}
                            />
                            <Dato
                                label="Modalidad"
                                value={movimientoActual?.agrupado ? 'Agrupado' : 'Unidades'}
                                vertical={false}
                            />
                            <Dato
                                label="Concepto"
                                value={movimientoActual?.concepto || 'Sin concepto'}
                                vertical={false}
                            />
                            <Dato
                                label="Tipo de precio"
                                value={movimientoActual?.precio?.name || 'Sin tipo de precio'}
                                vertical={false}
                            />
                        </div>
                    </div>
                </div>
                {/* Botón para ver productos - solo para movimientos con múltiples productos */}
                {movimientoActual?.productos && movimientoActual.productos.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label={`Lista de Productos`}
                        onClick={() => setIsProductosOpen(true)}
                    />
                )}

                {/* Resumen Financiero - Fuera del content de transacción */}
                {movimientoActual?.productos && movimientoActual.productos.length > 0 && (
                    <ResumenFinanciero resumen={calcularResumenFinanciero(movimientoActual)} />
                )}

                <div className={styles.buttons}>
                    {movimientoActual?.estado === 'anulado' ? (
                        <>
                            {movimientoActual?.type === 'salida' && (
                                <Boton
                                    className='btn-default'
                                    label='Repetir Movimiento'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleRepetirMovimiento}
                                    hideTextOnMobile={true}
                                    iconName='repeat'
                                />
                            )}
                            <Boton
                                className='btn-red'
                                label='Eliminar Movimiento'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsEliminarOpen(true)}
                                hideTextOnMobile={true}
                                iconName='trash'
                            />
                        </>
                    ) : (
                        <>
                            {movimientoActual?.type === 'salida' && (
                                <Boton
                                    className='btn-default'
                                    label='Repetir Movimiento'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleRepetirMovimiento}
                                    hideTextOnMobile={true}
                                    iconName='repeat'
                                />
                            )}
                            {movimientoActual?.type === 'salida' && (
                                <Boton
                                    className='btn-gray'
                                    label='Editar Movimiento'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleEditarMovimiento}
                                    loading={loadingEditar}
                                    disabled={loadingEditar}
                                    hideTextOnMobile={true}
                                    iconName='edit'
                                />
                            )}
                            {(movimientoActual?.type === 'entrada' || !movimientoActual?.tiene_pedido_relacionado) && (
                                <Boton
                                    className='btn-red'
                                    label='Anular Movimiento'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsAnularOpen(true)}
                                    hideTextOnMobile={true}
                                    iconName='block'
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
                productos={movimientoActual?.productos}
                movimientoActual={movimientoActual}
                movimiento={movimiento}
                rowsMemo={rowsMemo}
            />

            {/* Modal de descarga */}
            <DescargaMovimientoBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                movimientoId={movimientoActual?.id}
                movimientoData={movimientoActual}
                tipo="almacen"
            />

            {/* Modal de anular movimiento */}
            <ModalAnular
                isOpen={isAnularOpen}
                setIsOpen={setIsAnularOpen}
                movimientoActual={movimientoActual}
                setMovimientoActual={setMovimientoActual}
                movimiento={movimiento}
                onMovimientoActualizado={onMovimientoActualizado}
                onMovimientoAnulado={onMovimientoAnulado}
            />

            {/* Modal de eliminar movimiento */}
            <ModalEliminar
                isOpen={isEliminarOpen}
                setIsOpen={setIsEliminarOpen}
                movimientoActual={movimientoActual}
                setIsOpenVerMovimiento={setIsOpen}
                onMovimientoEliminado={onMovimientoEliminado}
            />

            {/* Modal de AlmacenGeneral para editar movimiento */}
            <AlmacenGeneral
                isOpen={isAlmacenOpen}
                setIsOpen={(isOpen) => {
                    setIsAlmacenOpen(isOpen);
                    // Limpiar productos del movimiento cuando se cierra AlmacenGeneral
                    if (!isOpen) {
                        localStorage.removeItem('productosMovimientoRepitiendo');
                        localStorage.removeItem('descuentoMovimientoRepitiendo');
                        localStorage.removeItem('aumentoMovimientoRepitiendo');
                        localStorage.removeItem('conceptoMovimientoRepitiendo');
                        localStorage.removeItem('descuentoAumentoPorcentajeRepitiendo');
                        localStorage.removeItem('fechaMovimientoEditando');
                        localStorage.removeItem('movimientoIdEditando');
                        localStorage.removeItem('productosEdicion');
                        localStorage.removeItem('numeroOrdenEditando');
                    }
                }}
                tipo="salida"
                isRepitiendoMovimiento={modoAlmacen === 'salida'}
                onMovimientoEditado={handleMovimientoEditadoFinalizado}
            />
        </View>
    );
}
export default VerMovimiento;