import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import cotizacionesService from '../../../services/cotizacionesService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import { useLayout } from '../../../context/LayoutContext';
import ModalTable from '../../common/ModalTable';
import DescargaCotizacionBuilder from './DescargaCotizacionBuilder';
import AlmacenGeneral from '../almacen-general/AlmacenGeneral';
import AlmacenGeneralAuxiliar from '../almacen-general-auxiliar/AlmacenGeneral-Auxiliar';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';

function VerCotizacion({ isOpen, setIsOpen, cotizacion, onCotizacionAnulada, onCotizacionEliminada, onCotizacionActualizada }) {
    const { isLargeScreen } = useLayout();
    const [loading, setLoading] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAprobarOpen, setIsAprobarOpen] = useState(false);
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);
    const [isAlmacenAuxiliarOpen, setIsAlmacenAuxiliarOpen] = useState(false);
    const [isRevertirAprobacionOpen, setIsRevertirAprobacionOpen] = useState(false);

    // Estado local para la cotización actual
    const [cotizacionActual, setCotizacionActual] = useState(cotizacion);

    // Actualizar el estado local cuando cambie el prop cotizacion
    useEffect(() => {
        setCotizacionActual(cotizacion);
    }, [cotizacion]);

    // Estados para notificaciones
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

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
                precioTexto = `${(precioUnitario * grup).toFixed(2)} BOB`;
            } else {
                cantidadTexto = `${cantidad} ud`;
                precioTexto = `${precioUnitario.toFixed(2)} BOB`;
            }

            return [
                productoCotizacion.producto?.name || 'Sin nombre',
                cantidadTexto,
                precioTexto,
                `${(parseFloat(productoCotizacion.subtotal) || 0).toFixed(2)} BOB`
            ];
        }), [cotizacionActual?.productos, cotizacionActual?.agrupado]);


    // Handle para anular cotización
    const handleAnular = async () => {
        setLoading(true);
        try {
            const response = await cotizacionesService.anular(cotizacionActual.id);

            if (response.success) {
                // Usar la respuesta del servidor que incluye la cotización actualizada
                const cotizacionActualizada = response.data;

                // Actualizar el estado local de la cotización
                setCotizacionActual(cotizacionActualizada);

                // Notificar al componente padre del cambio
                if (onCotizacionActualizada) {
                    onCotizacionActualizada(cotizacionActualizada);
                }

                // También llamar al callback original para mantener compatibilidad
                if (onCotizacionAnulada) {
                    onCotizacionAnulada(cotizacionActual.id);
                }

                setIsAnularOpen(false);
                // NO cerrar VerCotizacion, solo actualizar el estado
                mostrarNotificacion('success', 'Cotización anulada correctamente');
            } else {
                const msg = response.message || 'Error al anular la cotización';
                mostrarNotificacion('error', msg);
            }
        } catch (error) {
            console.error('Error anulando cotización:', error);
            mostrarNotificacion('error', 'Error al anular la cotización');
        } finally {
            setLoading(false);
        }
    };

    // Handle para eliminar cotización
    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await cotizacionesService.eliminar(cotizacionActual.id);

            if (response.success) {
                setIsEliminarOpen(false);
                setIsOpen(false);

                if (onCotizacionEliminada) {
                    onCotizacionEliminada(cotizacionActual.id);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar la cotización');
            }
        } catch (error) {
            console.error('Error eliminando cotización:', error);
            mostrarNotificacion('error', 'Error al eliminar la cotización');
        } finally {
            setLoading(false);
        }
    };

    // Handle para aprobar cotización
    const handleAprobar = async () => {
        setLoading(true);
        try {
            const response = await cotizacionesService.aprobar(cotizacionActual.id);

            if (response.success) {
                // Usar la respuesta del servidor que incluye la cotización actualizada
                const cotizacionActualizada = response.data;

                // Actualizar el estado local de la cotización
                setCotizacionActual(cotizacionActualizada);

                // Notificar al componente padre del cambio
                if (onCotizacionActualizada) {
                    onCotizacionActualizada(cotizacionActualizada);
                }

                setIsAprobarOpen(false);
                mostrarNotificacion('success', 'Cotización aprobada correctamente');
            } else {
                const msg = response.message || 'Error al aprobar la cotización';
                mostrarNotificacion('error', msg);
            }
        } catch (error) {
            console.error('Error aprobando cotización:', error);
            mostrarNotificacion('error', 'Error al aprobar la cotización');
        } finally {
            setLoading(false);
        }
    };

    // Handle para volver a pendiente
    const handleRevertirAprobacion = async () => {
        setLoading(true);
        try {
            const response = await cotizacionesService.marcarPendiente(cotizacionActual.id);

            if (response.success) {
                const cotizacionActualizada = response.data;
                setCotizacionActual(cotizacionActualizada);

                if (onCotizacionActualizada) {
                    onCotizacionActualizada(cotizacionActualizada);
                }

                setIsRevertirAprobacionOpen(false);
                mostrarNotificacion('success', 'Cotización marcada como pendiente nuevamente');
            } else {
                const msg = response.message || 'Error al actualizar la cotización';
                mostrarNotificacion('error', msg);
            }
        } catch (error) {
            console.error('Error marcando cotización como pendiente:', error);
            mostrarNotificacion('error', 'Error al actualizar la cotización');
        } finally {
            setLoading(false);
        }
    };

    const obtenerProductosNormalizados = () => {
        return (cotizacionActual?.productos || [])
            .map((productoCotizacion) => {
                const prodId = productoCotizacion?.producto?.id ?? productoCotizacion?.producto_id;
                if (!prodId) return null;

                let cantidadParaGuardar = Number(productoCotizacion?.cantidad) || 0;

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
    };

    // Handle para realizar venta
    const handleRealizarVenta = () => {
        if (!cotizacionActual?.productos || cotizacionActual.productos.length === 0) {
            mostrarNotificacion('error', 'No hay productos en la cotización para realizar la venta');
            return;
        }

        const productosNormalizados = obtenerProductosNormalizados();
        if (productosNormalizados.length === 0) {
            mostrarNotificacion('error', 'No se pudo preparar la cotización para la venta');
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

        // Guardar datos en las mismas variables que repetir movimiento
        localStorage.setItem('productosMovimientoRepitiendo', JSON.stringify(productosNormalizados));
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
            mostrarNotificacion('error', 'No hay cotización para repetir');
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
        const productosCotizacion = obtenerProductosNormalizados();
        localStorage.setItem('productosCotizacionRepitiendo', JSON.stringify(productosCotizacion));

        // Abrir AlmacenGeneral-Auxiliar en modo cotizar
        setIsAlmacenAuxiliarOpen(true);
    };

    if (!cotizacionActual) return null;

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Detalles de Cotización
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsDescargaOpen(true)}>
                            <BoxIcon
                                name='download'
                                className={styles.iconDownload}
                            />
                        </button>
                    </div>
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL RESPONSABLE</p>
                <ItemView
                    title={
                        cotizacionActual?.user 
                            ? `${cotizacionActual.user.first_name || ''} ${cotizacionActual.user.last_name || ''}`.trim()
                            : cotizacionActual?.personal 
                                ? `${cotizacionActual.personal.first_name || ''} ${cotizacionActual.personal.last_name || ''}`.trim()
                                : 'Usuario desconocido'
                    }
                    description="Responsable de la cotización"
                    transparent={false}
                />
                <p className={styles.subTitle}>INFORMACIÓN DE LA COTIZACIÓN</p>
                {cotizacionActual?.cliente_id && (
                    <ItemView
                        title={cotizacionActual?.cliente?.name || 'Sin cliente'}
                        description="Cliente"
                        flot2={`Cotización #${cotizacionActual?.numero_cotizacion || 'Sin número'}`}
                        transparent={false}
                    />
                )}
                <div className={styles.content}>
                    <Dato
                        label="Número de cotización"
                        value={cotizacionActual?.numero_cotizacion || 'Sin número'}
                        vertical={false}
                    />
                    <Dato
                        label="Fecha"
                        value={formatFechaLiteral(cotizacionActual?.fecha)}
                        vertical={false}
                    />
                    <Dato
                        label="Hora"
                        value={formatHoraSinSegundos(cotizacionActual?.fecha)}
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
                        label="Estado"
                        value={cotizacionActual.estado === 'anulado' ? 'Anulado' : cotizacionActual.estado === 'aprobada' ? 'Aprobada' : 'Pendiente'}
                        vertical={false}
                        especial={cotizacionActual.estado === 'anulado' ? 'red' : cotizacionActual.estado === 'aprobada' ? 'green' : 'orange'}
                    />
                    {cotizacionActual?.metodo_pago && (
                        <Dato
                            label="Método de pago"
                            value={cotizacionActual.metodo_pago}
                            vertical={false}
                        />
                    )}
                    {cotizacionActual?.fecha_vencimiento && (
                        <Dato
                            label="Fecha de vencimiento"
                            value={formatFechaLiteral(cotizacionActual.fecha_vencimiento)}
                            vertical={false}
                        />
                    )}

                    {/* Total calculado para cotizaciones */}
                    {cotizacionActual?.productos && cotizacionActual.productos.length > 0 && (
                        <Dato
                            label="Total de la Cotización"
                            value={`Bs. ${(cotizacionActual.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0)).toFixed(2)}`}
                            vertical={false}
                            especial='green'
                        />
                    )}
                </div>


                {/* Botón para ver productos - solo para cotizaciones con múltiples productos */}
                {cotizacionActual?.productos && cotizacionActual.productos.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label={`Productos (${cotizacionActual.productos.length})`}
                        onClick={() => setIsProductosOpen(true)}
                    />
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
                    {cotizacionActual?.estado === 'anulado' ? (
                        <>
                            <Boton
                                className='btn-gray'
                                label='Repetir Cotización'
                                style={{ marginTop: 'auto' }}
                                onClick={handleRepetirCotizacion}
                            />
                            <Boton
                                className='btn-red'
                                label='Eliminar Cotización'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsEliminarOpen(true)}
                            />
                        </>
                    ) : cotizacionActual?.estado === 'aprobada' ? (
                        <>
                            <Boton
                                className='btn-default'
                                label='Anular aprobación'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsRevertirAprobacionOpen(true)}
                            />
                            <Boton
                                className='btn-gray'
                                label='Repetir Cotización'
                                style={{ marginTop: 'auto' }}
                                onClick={handleRepetirCotizacion}
                            />
                            
                            <Boton
                                className='btn-green'
                                label='Realizar Venta'
                                style={{ marginTop: 'auto' }}
                                onClick={handleRealizarVenta}
                            />
                            {!cotizacionActual?.tiene_pedido_relacionado && (
                                <Boton
                                    className='btn-red'
                                    label='Anular Cotización'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsAnularOpen(true)}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {cotizacionActual?.estado === 'pendiente' && (
                                <Boton
                                    className='btn-default'
                                    label='Aprobar Cotización'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsAprobarOpen(true)}
                                />
                            )}
                            <Boton
                                className='btn-gray'
                                label='Repetir Cotización'
                                style={{ marginTop: 'auto' }}
                                onClick={handleRepetirCotizacion}
                            />
                            {!cotizacionActual?.tiene_pedido_relacionado && (
                                <Boton
                                    className='btn-red'
                                    label='Anular Cotización'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsAnularOpen(true)}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>



            {/* Modal de productos */}
            {isLargeScreen ? (
                <ModalTable
                    isOpen={isProductosOpen}
                    title="Productos de la Cotización"
                    headers={['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']}
                    rows={rowsMemo}
                    onClose={() => setIsProductosOpen(false)}
                />
            ) : (
                <ViewModal isOpen={isProductosOpen} setIsOpen={setIsProductosOpen}>
                    <HeaderModal
                        title="Productos de la Cotización"
                        onClose={() => setIsProductosOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        {cotizacionActual?.productos && cotizacionActual.productos.length > 0 && (
                            <>
                                <p className={styles.subTitle}>PRODUCTOS INCLUIDOS</p>

                                {cotizacionActual.productos
                                    .sort((a, b) => (a.producto?.name || '').localeCompare(b.producto?.name || '', 'es', { sensitivity: 'base' }))
                                    .map((productoCotizacion, index) => {
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
                                            precioTexto = `Bs. ${(precioUnitario * grup).toFixed(2)}`;
                                        } else {
                                            cantidadTexto = `${cantidad} ud`;
                                            precioTexto = `Bs. ${precioUnitario.toFixed(2)}`;
                                        }

                                        return (
                                            <ItemView
                                                key={`${productoCotizacion.producto?.id || 'producto'}-${index}`}
                                                title={productoCotizacion.producto?.name || 'Sin nombre'}
                                                description={`Precio Unitario: ${precioTexto}`}
                                                flot2={cantidadTexto}
                                                circulo={false}
                                            />
                                        );
                                    })}
                            </>
                        )}
                    </div>
                </ViewModal>
            )}

            {/* Modal de anular cotización */}
            <ViewModal isOpen={isAnularOpen} setIsOpen={setIsAnularOpen}>
                <HeaderModal
                    title="Anular Cotización"
                    onClose={() => setIsAnularOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas anular esta cotización? Esta acción no se puede deshacer.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsAnularOpen(false)}
                        />
                        <Boton
                            className='btn-red'
                            label='Sí, anular'
                            style={{ marginTop: 'auto' }}
                            onClick={handleAnular}
                            loading={loading}
                        />

                    </div>
                </div>
            </ViewModal>

            {/* Modal para revertir aprobación */}
            <ViewModal isOpen={isRevertirAprobacionOpen} setIsOpen={setIsRevertirAprobacionOpen}>
                <HeaderModal
                    title="Anular aprobación"
                    onClose={() => setIsRevertirAprobacionOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Quieres volver a poner esta cotización en estado pendiente? Perderá el estado de aprobación actual.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsRevertirAprobacionOpen(false)}
                        />
                        <Boton
                            className='btn-red'
                            label='Sí, volver a pendiente'
                            style={{ marginTop: 'auto' }}
                            onClick={handleRevertirAprobacion}
                            loading={loading}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de eliminar cotización */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Cotización"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar permanentemente esta cotización? Esta acción no se puede deshacer.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(false)}
                        />
                        <Boton
                            className='btn-red'
                            label='Sí, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleEliminar}
                            loading={loading}
                            segundosDisabled={5}
                        />

                    </div>
                </div>
            </ViewModal>

            {/* Modal de aprobar cotización */}
            <ViewModal isOpen={isAprobarOpen} setIsOpen={setIsAprobarOpen}>
                <HeaderModal
                    title="Aprobar Cotización"
                    onClose={() => setIsAprobarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas aprobar esta cotización? Una vez aprobada, podrás realizar la venta de manera directa.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsAprobarOpen(false)}
                        />
                        <Boton
                            className='btn-green'
                            label='Sí, aprobar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleAprobar}
                            loading={loading}
                        />

                    </div>
                </div>
            </ViewModal>

            {/* Modal de descarga */}
            <DescargaCotizacionBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                cotizacionId={cotizacionActual?.id}
                cotizacionData={cotizacionActual}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
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
