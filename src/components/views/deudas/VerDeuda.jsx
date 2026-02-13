import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import deudasService from '../../../services/deudasService';
import ItemView from '../../common/ItemView';
import DescargaDeudaBuilder from './DescargaDeudaBuilder';
import EditarAgregarDeuda from './EditarAgregarDeuda';
import ModalEliminar from './modales/ModalEliminar';
import ModalRegistrarPago from './modales/ModalRegistrarPago';
import ModalVerPagos from './modales/ModalVerPagos';
import ModalEditarVencimiento from './modales/ModalEditarVencimiento';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import VerMovimiento from '../movimientos/VerMovimiento';
import { useLayout } from '../../../context/LayoutContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../utils/numberUtils';
import { formatFechaLiteral } from '../../../utils/dateUtils';
import StatusBadge from '../../common/StatusBadge';
import ResumenFinanciero from '../../ui/ResumenFinanciero';

function VerDeuda({ isOpen, setIsOpen, deuda, onDeudaEliminada, onDeudaActualizada }) {
    const { isLargeScreen } = useLayout();
    const { showSuccess, showDanger, showInfo } = useToast();
    const [loading, setLoading] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [movimientoDetalle, setMovimientoDetalle] = useState(null);
    const [isMovimientoDetalleOpen, setIsMovimientoDetalleOpen] = useState(false);
    const [isRegistrarPagoOpen, setIsRegistrarPagoOpen] = useState(false);
    const [isVerPagosOpen, setIsVerPagosOpen] = useState(false);
    const [isEditarVencOpen, setIsEditarVencOpen] = useState(false);

    // Estado local para la deuda actual
    const [deudaActual, setDeudaActual] = useState(deuda);
    useEffect(() => {
        setDeudaActual(deuda);
    }, [deuda]);


    // Función para ver detalle del movimiento
    const handleVerDetalleMovimiento = async () => {
        if (!deudaActual?.movimiento_salida_id) {
            showInfo('Información', 'No hay movimiento asociado a esta deuda');
            return;
        }

        try {
            setLoading(true);
            const response = await movimientosAlmacenService.getById(deudaActual.movimiento_salida_id);

            if (response.success) {
                setMovimientoDetalle(response.data);
                setIsMovimientoDetalleOpen(true);
            } else {
                showDanger('Error', response.message || 'Error al obtener el detalle del movimiento');
            }
        } catch (error) {
            console.error('Error al obtener movimiento:', error);
            showDanger('Error', 'Error al obtener el detalle del movimiento');
        } finally {
            setLoading(false);
        }
    };

    // Función para manejar cuando se actualiza una deuda
    const handleDeudaUpdated = (deudaActualizada) => {
        const deudaNormalizada = deudaActualizada ? {
            ...deudaActualizada,
            saldo_pendiente: deudaActualizada?.saldo_pendiente ?? deudaActualizada?.monto_total
        } : deudaActualizada;

        setDeudaActual(deudaNormalizada);
        if (onDeudaActualizada) onDeudaActualizada(deudaNormalizada);
        setIsEditarOpen(false);
    };

    // Función para manejar cuando se actualiza la deuda desde los modales
    const handleDeudaActualizadaDesdeModal = (deudaActualizada) => {
        const deudaNormalizada = deudaActualizada ? {
            ...deudaActualizada,
            saldo_pendiente: deudaActualizada?.saldo_pendiente ?? deudaActualizada?.monto_total
        } : deudaActualizada;

        setDeudaActual(deudaNormalizada);
        if (onDeudaActualizada) onDeudaActualizada(deudaNormalizada);
    };

    // Función para calcular resumen financiero de la deuda
    const calcularResumenDeuda = () => {
        if (!deudaActual) {
            return {
                subtotalFormatted: formatCurrency(0),
                totalFormatted: formatCurrency(0),
                descuento: { tieneDescuento: false },
                aumento: { tieneAumento: false }
            };
        }

        const montoTotal = parseFloat(deudaActual?.monto_total) || 0;
        const saldoPendiente = parseFloat(deudaActual?.saldo_pendiente) || 0;
        const pagosRealizados = montoTotal - saldoPendiente;

        // Si hay pagos realizados, mostrarlos como "descuento" (pagos aplicados)
        const tienePagos = pagosRealizados > 0;
        const descuentoLabel = tienePagos ? 'Pagos realizados:' : '';
        const descuentoValue = tienePagos ? `-${formatCurrency(pagosRealizados)}` : '';

        return {
            subtotalFormatted: formatCurrency(montoTotal),
            totalFormatted: formatCurrency(saldoPendiente),
            descuento: {
                tieneDescuento: tienePagos,
                label: descuentoLabel,
                value: descuentoValue
            },
            aumento: { tieneAumento: false }
        };
    };

    // Función para marcar como vencida
    const handleMarcarComoVencida = async () => {
        setLoading(true);
        try {
            const response = await deudasService.updateEstado(deuda.id, 'vencida');

            if (response.success) {
                if (onDeudaActualizada) {
                    onDeudaActualizada({ ...deuda, estado: 'vencida' });
                }
                showSuccess('Éxito', 'Deuda marcada como vencida');
                setIsOpen(false);
            } else {
                showDanger('Error', response.message || 'Error al actualizar el estado');
            }
        } catch (error) {
            console.error('Error actualizando estado:', error);
            showDanger('Error', 'Error al actualizar el estado');
        } finally {
            setLoading(false);
        }
    };

    // Verificar si la deuda está vencida y estados de pago
    const isVencida = new Date(deudaActual?.fecha_vencimiento) < new Date() && deudaActual?.estado === 'pendiente';
    const montoTotalNum = parseFloat(deudaActual?.monto_total) || 0;
    const saldoPendienteNum = parseFloat(deudaActual?.saldo_pendiente) || 0;
    const hasPagosParciales = saldoPendienteNum > 0 && saldoPendienteNum < montoTotalNum;
    const isPagada = saldoPendienteNum === 0 || deudaActual?.estado === 'pagada';


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Detalles de la Deuda<StatusBadge estado={deudaActual?.estado} /></h1>
                        <p className={styles.subTitle}>Registrada el {formatFechaLiteral(deudaActual?.fecha_deuda, !isLargeScreen)}</p>
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
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Información del Deudor"
                                transparent={true}
                                icon="user"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <Dato
                                label="Cliente"
                                value={deudaActual?.cliente?.name || 'Sin cliente'}
                                vertical={false}
                            />
                            <Dato
                                label="Sucursal"
                                value={deudaActual?.sucursal?.name || 'Sin sucursal'}
                                vertical={false}
                            />
                            <Dato
                                label="Sucursal Destino"
                                value={deudaActual?.sucursal_destino?.name || 'Sin sucursal destino'}
                                vertical={false}
                            />
                            <Dato
                                label="Empresa"
                                value={deudaActual?.sucursal_destino?.empresas?.name || 'Sin empresa'}
                                vertical={false}
                            />
                        </div>
                        <Boton
                            className='btn-gray'
                            label='Pagos Parciales'
                            onClick={() => setIsVerPagosOpen(true)}
                        />
                    </div>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Información de la Deuda"
                                transparent={true}
                                icon="money"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <Dato
                                label="Responsable"
                                value={deudaActual?.user?.name || deudaActual?.personal?.name || 'Usuario desconocido'}
                                vertical={false}
                            />
                            <Dato
                                label="Fecha de vencimiento"
                                value={formatFechaLiteral(deudaActual?.fecha_vencimiento, !isLargeScreen)}
                                vertical={false}
                            />
                            <Dato
                                label="Monto Total"
                                value={formatCurrency(deudaActual?.monto_total)}
                                vertical={false}
                                especial='blue'
                            />
                            <Dato
                                label="Concepto"
                                value={deudaActual?.concepto || 'Sin concepto'}
                                vertical={true}
                            />
                        </div>
                        {/* Botón Ver Detalle del Movimiento */}
                            <Boton
                                className='btn-gray'
                                label='Registro de Venta'
                                onClick={handleVerDetalleMovimiento}
                                loading={loading}
                                readOnly={!deudaActual?.movimiento_salida_id}
                            />

                    
                    </div>
                </div>

                {/* Resumen Financiero */}
                <ResumenFinanciero resumen={calcularResumenDeuda()} />





                <div className={styles.buttons}>
                    {/* Si NO tiene movimiento: permitir eliminar/editar solo si no hay pagos parciales y no está pagada */}
                    {!deudaActual?.movimiento_salida_id && !hasPagosParciales && !isPagada && (
                        <>
                            <Boton
                                className='btn-red'
                                label='Eliminar Deuda'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsEliminarOpen(true)}
                                iconName='trash'
                                hideTextOnMobile={true}
                                />
                            <Boton
                                className='btn-default'
                                label='Editar Deuda'
                                onClick={() => setIsEditarOpen(true)}
                                iconName='edit'
                                hideTextOnMobile={true}
                                />
                        </>
                    )}
                    {/* Si TIENE movimiento: permitir editar (para cambiar solo vencimiento y concepto) si no está pagada */}
                    {deudaActual?.movimiento_salida_id && !isPagada && (
                        <Boton
                            className='btn-default'
                            label='Editar Deuda'
                            onClick={() => setIsEditarOpen(true)}
                            iconName='edit'
                            hideTextOnMobile={true}
                        />
                    )}
                    {/* Botón Registrar pago: visible si no está pagada */}
                    {!isPagada && (
                        <Boton
                            className='btn-original'
                            label='Registrar pago'
                            onClick={() => setIsRegistrarPagoOpen(true)}
                            loading={loading}
                            iconName='credit-card'
                            hideTextOnMobile={true}
                        />
                    )}
                    {/* Mantener marcar como vencida si aplica */}
                    {deudaActual?.estado === 'pendiente' && isVencida && (
                        <Boton
                            className='btn-red'
                            label='Marcar como Vencida'
                            onClick={handleMarcarComoVencida}
                            loading={loading}
                            iconName='time'
                            hideTextOnMobile={true}
                        />
                    )}
                </div>
            </div>

            {/* Modal de descarga de deuda con movimiento y pagos parciales */}
            <DescargaDeudaBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                deuda={deudaActual}
            />

            {/* Modal de editar deuda */}
            <EditarAgregarDeuda
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                deuda={deudaActual}
                tipo='editar'
                onDeudaUpdated={handleDeudaUpdated}
            />

            {/* Modal de detalle del movimiento usando VerMovimiento */}
            <VerMovimiento
                isOpen={isMovimientoDetalleOpen}
                setIsOpen={setIsMovimientoDetalleOpen}
                movimiento={movimientoDetalle}
            />

            {/* Modal de eliminar deuda */}
            <ModalEliminar
                isOpen={isEliminarOpen}
                setIsOpen={setIsEliminarOpen}
                deudaActual={deudaActual}
                setIsOpenVerDeuda={setIsOpen}
                onDeudaEliminada={onDeudaEliminada}
            />

            {/* Modal Registrar Pago Parcial */}
            <ModalRegistrarPago
                isOpen={isRegistrarPagoOpen}
                setIsOpen={setIsRegistrarPagoOpen}
                deudaActual={deudaActual}
                onDeudaActualizada={handleDeudaActualizadaDesdeModal}
            />

            {/* Modal Ver Pagos Parciales */}
            <ModalVerPagos
                isOpen={isVerPagosOpen}
                setIsOpen={setIsVerPagosOpen}
                deuda={deudaActual}
                onDeudaActualizada={handleDeudaActualizadaDesdeModal}
            />

            {/* Modal Editar Fecha de Vencimiento (para deudas con movimiento) */}
            <ModalEditarVencimiento
                isOpen={isEditarVencOpen}
                setIsOpen={setIsEditarVencOpen}
                deudaActual={deudaActual}
                onDeudaActualizada={handleDeudaActualizadaDesdeModal}
            />
        </View>
    );
}

export default VerDeuda;