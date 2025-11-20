import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import deudasService from '../../../services/deudasService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import ModalDescarga from '../../ui/ModalDescarga';
import DescargaDeudaBuilder from './DescargaDeudaBuilder';
import EditarAgregarDeuda from './EditarAgregarDeuda';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import VerMovimiento from '../movimientos/VerMovimiento';
import InputDate from '../../common/InputDate';
import InputNormal from '../../common/InputNormal';
import NoData from '../../common/NoData';
import { useLayout } from '../../../context/LayoutContext';
import { formatCurrency } from '../../../utils/numberUtils';

function VerDeuda({ isOpen, setIsOpen, deuda, onDeudaEliminada, onDeudaActualizada }) {
    const { isLargeScreen } = useLayout();
    const [loading, setLoading] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [movimientoDetalle, setMovimientoDetalle] = useState(null);
    const [isMovimientoDetalleOpen, setIsMovimientoDetalleOpen] = useState(false);
    const [isRegistrarPagoOpen, setIsRegistrarPagoOpen] = useState(false);
    const [isVerPagosOpen, setIsVerPagosOpen] = useState(false);
    const [pagos, setPagos] = useState([]);
    const [loadingPagos, setLoadingPagos] = useState(false);
    const [pagoForm, setPagoForm] = useState({ fecha: '', monto: '', detalle: '' });
    const [deletingPagoId, setDeletingPagoId] = useState(null);
    const [isEditarVencOpen, setIsEditarVencOpen] = useState(false);
    const [fechaVencEdit, setFechaVencEdit] = useState('');

    // Estado local para la deuda actual
    const [deudaActual, setDeudaActual] = useState(deuda);
    useEffect(() => {
        setDeudaActual(deuda);
    }, [deuda]);

    // Inicializar fecha de vencimiento para edición
    useEffect(() => {
        if (isEditarVencOpen && deudaActual?.fecha_vencimiento) {
            const d = new Date(deudaActual.fecha_vencimiento);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            setFechaVencEdit(`${yyyy}-${mm}-${dd}`);
        }
    }, [isEditarVencOpen, deudaActual?.fecha_vencimiento]);

    // Función para preparar datos de descarga
    const prepararDatosDescarga = () => {
        if (!deudaActual) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Información superior
        const informacionSuperior = {
            'Responsable': deudaActual?.user?.name || deudaActual?.personal?.name || 'Usuario desconocido',
            'Fecha Deuda': new Date(deudaActual?.fecha_deuda).toLocaleString(),
            'Fecha Vencimiento': new Date(deudaActual?.fecha_vencimiento).toLocaleString(),
            'Concepto': deudaActual?.concepto || 'Sin concepto',
            'Monto Total': formatCurrency(deudaActual?.monto_total),
            'Saldo Pendiente': formatCurrency(deudaActual?.saldo_pendiente),
            'Estado': deudaActual?.estado || 'Sin estado',
            'Sucursal': deudaActual?.sucursal?.name || 'Sucursal no encontrada'
        };

        if (deudaActual?.cliente?.name) {
            informacionSuperior['Cliente'] = deudaActual.cliente.name;
        }

        // No hay tabla para deudas, solo información
        return { informacionSuperior, tablaHeaders: [], tablaValores: [] };
    };


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

    // Función para ver detalle del movimiento
    const handleVerDetalleMovimiento = async () => {
        if (!deudaActual?.movimiento_salida_id) {
            mostrarNotificacion('error', 'No hay movimiento asociado a esta deuda');
            return;
        }

        try {
            setLoading(true);
            const response = await movimientosAlmacenService.getById(deudaActual.movimiento_salida_id);

            if (response.success) {
                setMovimientoDetalle(response.data);
                setIsMovimientoDetalleOpen(true);
            } else {
                mostrarNotificacion('error', response.message || 'Error al obtener el detalle del movimiento');
            }
        } catch (error) {
            console.error('Error al obtener movimiento:', error);
            mostrarNotificacion('error', 'Error al obtener el detalle del movimiento');
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


    // Cargar pagos parciales cuando se abre el modal de pagos
    useEffect(() => {
        const cargarPagos = async () => {
            if (!deuda?.id) return;
            setLoadingPagos(true);
            try {
                const response = await deudasService.getPagosParciales(deuda.id);
                if (response.success) {
                    setPagos(response.data);
                } else {
                    mostrarNotificacion('error', response.message || 'Error al obtener pagos parciales');
                }
            } catch (e) {
                console.error('Error obteniendo pagos parciales:', e);
                mostrarNotificacion('error', 'Error al obtener pagos parciales');
            } finally {
                setLoadingPagos(false);
            }
        };
        if (isVerPagosOpen) {
            cargarPagos();
        } else {
            setPagos([]);
        }
    }, [isVerPagosOpen, deuda?.id]);

    // Inicializar formulario de pago cuando se abre el modal
    useEffect(() => {
        if (isRegistrarPagoOpen) {
            const hoy = new Date();
            const fechaHoy = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
            setPagoForm({ fecha: fechaHoy, monto: '', detalle: '' });
        }
    }, [isRegistrarPagoOpen]);

    const handleSubmitPago = async () => {
        if (!pagoForm.monto || parseFloat(pagoForm.monto) <= 0) {
            mostrarNotificacion('error', 'El monto es obligatorio y debe ser mayor a 0');
            return;
        }
        if (!pagoForm.fecha) {
            mostrarNotificacion('error', 'La fecha es obligatoria');
            return;
        }
        setLoading(true);
        try {
            const response = await deudasService.createPagoParcial(deudaActual.id, {
                monto: parseFloat(pagoForm.monto),
                fecha: pagoForm.fecha,
                detalle: pagoForm.detalle || null
            });
            if (response.success) {
                const deudaActualizada = response.data?.deuda || { ...deudaActual };
                setDeudaActual(deudaActualizada);
                if (onDeudaActualizada) onDeudaActualizada(deudaActualizada);
                mostrarNotificacion('success', 'Pago parcial registrado');
                setIsRegistrarPagoOpen(false);
            } else {
                mostrarNotificacion('error', response.message || 'Error al registrar el pago');
            }
        } catch (e) {
            console.error('Error registrando pago parcial:', e);
            mostrarNotificacion('error', 'Error al registrar el pago parcial');
        } finally {
            setLoading(false);
        }
    };

    const handleEliminarPago = async (pagoId) => {
        setDeletingPagoId(pagoId);
        try {
            const response = await deudasService.deletePagoParcial(deudaActual.id, pagoId);
            if (response.success) {
                // refrescar lista
                const listResp = await deudasService.getPagosParciales(deudaActual.id);
                if (listResp.success) setPagos(listResp.data);
                // notificar y actualizar deuda en padre
                setDeudaActual(response.data);
                if (onDeudaActualizada) onDeudaActualizada(response.data);
                mostrarNotificacion('success', 'Pago parcial eliminado');
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar el pago');
            }
        } catch (e) {
            console.error('Error eliminando pago parcial:', e);
            mostrarNotificacion('error', 'Error al eliminar el pago parcial');
        } finally {
            setDeletingPagoId(null);
        }
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
                mostrarNotificacion('success', 'Deuda marcada como vencida');
                setIsOpen(false);
            } else {
                mostrarNotificacion('error', response.message || 'Error al actualizar el estado');
            }
        } catch (error) {
            console.error('Error actualizando estado:', error);
            mostrarNotificacion('error', 'Error al actualizar el estado');
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

    // Formateador seguro de fechas YYYY-MM-DD sin cambiar de día por zona horaria
    const formatDate = (val) => {
        if (!val) return '';
        // Manejar fechas con hora: "2025-11-07 00:00:00" o "2025-11-07T00:00:00"
        if (typeof val === 'string') {
            // Extraer solo la parte de la fecha (YYYY-MM-DD) si tiene hora
            const fechaMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (fechaMatch) {
                const [, y, m, d] = fechaMatch;
                return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
            }
            // Si es solo fecha sin hora
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                const [y, m, d] = val.split('-');
                return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
            }
        }
        try {
            return new Date(val).toLocaleDateString();
        } catch {
            return String(val);
        }
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Detalles de la Deuda
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsDescargaOpen(true)}>
                            <BoxIcon
                                name='download'
                                className={styles.iconDownload}
                            />
                        </button>
                    </div>
                </h1>

                <p className={styles.subTitle}>RESPONSABLE DE LA DEUDA</p>
                <ItemView
                    title={deudaActual?.user?.name || deudaActual?.personal?.name || 'Usuario desconocido'}
                    description="Registro de la deuda"
                    transparent={false}
                />
                <p className={styles.subTitle}>INFORMACIÓN DE LA DEUDA</p>
                {/* Mostrar cliente o sucursal destino según corresponda */}
                {deudaActual?.destino_sucursal_id ? (
                    <ItemView
                        title={deudaActual.sucursal_destino?.name || 'Sucursal no encontrada'}
                        description="Sucursal Destino"
                        transparent={false}
                        icon='store'
                    />
                ) : (
                    deudaActual?.cliente?.name && (
                        <ItemView
                            title={deudaActual.cliente.name}
                            description="Cliente"
                            transparent={false}
                        />
                    )
                )}
                <div className={styles.content}>
                    <Dato
                        label="Concepto"
                        value={deudaActual?.concepto || 'Sin concepto'}
                    />
                    <Dato
                        label="Fecha de deuda"
                        value={formatDate(deudaActual?.fecha_deuda)}
                        vertical={false}
                    />
                    <Dato
                        label="Fecha de vencimiento"
                        value={formatDate(deudaActual?.fecha_vencimiento)}
                        vertical={false}
                    />
                    <Dato
                        label="Estado"
                        value={deudaActual?.estado}
                        vertical={false}
                        especial={deudaActual?.estado === 'pendiente' ? 'red' : deudaActual?.estado === 'pagada' ? 'blue' : 'gray'}
                    />
                    <Dato
                        label="Sucursal deuda"
                        value={deudaActual?.sucursal?.name || 'No especificada'}
                        vertical={false}
                    />
                    <Dato
                        label="Monto Total"
                        value={formatCurrency(deudaActual?.monto_total)}
                        vertical={false}
                        especial='blue'
                    />

                    <Dato
                        label="Saldo Pendiente"
                        value={formatCurrency(deudaActual?.saldo_pendiente)}
                        vertical={false}
                        especial={deudaActual?.saldo_pendiente > 0 ? 'red' : 'green'}
                    />
                </div>
                {/* Botón Ver Detalle del Movimiento */}
                {deudaActual?.movimiento_salida_id && (
                    <Boton
                        className='btn-gray'
                        label='Ver Detalle'
                        onClick={handleVerDetalleMovimiento}
                        loading={loading}
                    />

                )}

                <Boton
                    className='btn-gray'
                    label='Ver Pagos'
                    onClick={() => setIsVerPagosOpen(true)}
                />


                <div className={styles.buttons}>
                    {/* Si NO tiene movimiento: permitir eliminar/editar solo si no hay pagos parciales y no está pagada */}
                    {!deudaActual?.movimiento_salida_id && !hasPagosParciales && !isPagada && (
                        <>
                            <Boton
                                className='btn-red'
                                label='Eliminar Deuda'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsEliminarOpen(true)}
                            />
                            <Boton
                                className='btn-default'
                                label='Editar Deuda'
                                onClick={() => setIsEditarOpen(true)}
                            />
                        </>
                    )}
                    {/* Si TIENE movimiento: permitir editar (para cambiar solo vencimiento y concepto) si no está pagada */}
                    {deudaActual?.movimiento_salida_id && !isPagada && (
                        <Boton
                            className='btn-default'
                            label='Editar Deuda'
                            onClick={() => setIsEditarOpen(true)}
                        />
                    )}
                    {/* Botón Registrar pago: visible si no está pagada */}
                    {!isPagada && (
                        <Boton
                            className='btn-original'
                            label='Registrar pago'
                            onClick={() => setIsRegistrarPagoOpen(true)}
                            loading={loading}
                        />
                    )}
                    {/* Mantener marcar como vencida si aplica */}
                    {deudaActual?.estado === 'pendiente' && isVencida && (
                        <Boton
                            className='btn-red'
                            label='Marcar como Vencida'
                            onClick={handleMarcarComoVencida}
                            loading={loading}
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
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Deuda"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent} >
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar permanentemente esta deuda? Esta acción no se puede deshacer.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Sí, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const response = await deudasService.delete(deudaActual.id);

                                    if (response.success) {
                                        setIsEliminarOpen(false);
                                        setIsOpen(false);

                                        if (onDeudaEliminada) {
                                            onDeudaEliminada(deudaActual.id);
                                        }
                                    } else {
                                        mostrarNotificacion('error', response.message || 'Error al eliminar la deuda');
                                    }
                                } catch (error) {
                                    console.error('Error eliminando deuda:', error);
                                    mostrarNotificacion('error', 'Error al eliminar la deuda');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            loading={loading}
                            segundosDisabled={5}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(false)}
                        />
                    </div>
                </div>
            </ViewModal>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Modal Registrar Pago Parcial */}
            <ViewModal isOpen={isRegistrarPagoOpen} setIsOpen={setIsRegistrarPagoOpen}>
                <HeaderModal
                    title='Registrar Pago Parcial'
                    onClose={() => setIsRegistrarPagoOpen(false)}
                />
                <div className={styles.modalContent} style={!isLargeScreen ? { minHeight: '50vh' } : undefined}>
                    <p className={styles.subTitle}>INFORMACIÓN DEL PAGO</p>
                    <InputDate
                        mode='date'
                        value={pagoForm.fecha}
                        onChange={(val) => setPagoForm(prev => ({ ...prev, fecha: val }))}
                        placeholder='Fecha del pago'
                        icon='calendar'
                    />
                    <InputNormal
                        tipo='number'
                        value={pagoForm.monto}
                        placeholder='Monto del pago (Bs.)'
                        onChange={(e) => setPagoForm(prev => ({ ...prev, monto: e.target.value }))}
                        icon='money'
                        step='0.01'
                        min='0'
                    />
                    <InputNormal
                        tipo='text'
                        value={pagoForm.detalle}
                        placeholder='Detalle del pago (opcional)'
                        onChange={(e) => setPagoForm(prev => ({ ...prev, detalle: e.target.value }))}
                        icon='note'
                    />
                    <Boton
                        className='btn-original'
                        label='Registrar Pago'
                        style={{ marginTop: 'auto' }}
                        onClick={handleSubmitPago}
                        loading={loading}
                        disabled={!pagoForm.fecha || !pagoForm.monto}
                    />
                </div>
            </ViewModal>

            {/* Modal Ver Pagos Parciales */}
            <ViewModal isOpen={isVerPagosOpen} setIsOpen={setIsVerPagosOpen}>
                <HeaderModal
                    title='Pagos Parciales'
                    onClose={() => setIsVerPagosOpen(false)}
                />
                <div className={styles.modalContent} style={!isLargeScreen ? { minHeight: '50vh' } : undefined}>
                    <p className={styles.subTitle}>HISTORIAL DE PAGOS</p>
                    {loadingPagos ? (
                        <NoData
                            icon="loader-alt"
                            title="Cargando pagos..."
                            detail="Obteniendo el historial de pagos"
                            transparent={true}
                            minHeight="150px"
                        />
                    ) : pagos.length > 0 ? (
                        pagos.map((p) => (
                            <React.Fragment key={p.id}>
                                <Dato
                                    label={`• ${formatDate(p.fecha)}`}
                                    value={formatCurrency(p.monto)}
                                    icon={deletingPagoId === p.id ? 'loader-alt' : 'trash'}
                                    iconLoading={deletingPagoId === p.id}
                                    onClick={() => (deletingPagoId ? null : handleEliminarPago(p.id))}
                                    vertical={false}
                                />
                                <div style={{ marginLeft: '20px' }}>
                                    <Dato
                                        label="Detalle:"
                                        value={p.detalle || 'Sin detalle'}
                                        vertical={false}
                                    />
                                </div>
                            </React.Fragment>
                        ))
                    ) : (
                        <NoData
                            icon="history"
                            title="No hay pagos"
                            detail="Esta deuda no tiene pagos registrados aún"
                            transparent={true}
                            minHeight="150px"
                        />
                    )}
                </div>
            </ViewModal>

            {/* Modal Editar Fecha de Vencimiento (para deudas con movimiento) */}
            <ViewModal isOpen={isEditarVencOpen} setIsOpen={setIsEditarVencOpen}>
                <HeaderModal
                    title="Editar Fecha de Vencimiento"
                    onClose={() => setIsEditarVencOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>NUEVA FECHA DE VENCIMIENTO</p>
                    <InputDate
                        mode='date'
                        value={fechaVencEdit}
                        onChange={(val) => setFechaVencEdit(val)}
                        placeholder='Fecha de vencimiento'
                        icon='time'
                    />
                    <Boton
                        className='btn-original'
                        label='Guardar'
                        style={{ marginTop: 'auto' }}
                        onClick={async () => {
                            if (!fechaVencEdit) {
                                mostrarNotificacion('error', 'La fecha de vencimiento es obligatoria');
                                return;
                            }
                            setLoading(true);
                            try {
                                const resp = await deudasService.update(deudaActual.id, { fecha_vencimiento: fechaVencEdit });
                                if (resp.success) {
                                    setDeudaActual(resp.data);
                                    if (onDeudaActualizada) onDeudaActualizada(resp.data);
                                    mostrarNotificacion('success', 'Fecha de vencimiento actualizada');
                                    setIsEditarVencOpen(false);
                                } else {
                                    mostrarNotificacion('error', resp.message || 'Error al actualizar la fecha');
                                }
                            } catch (e) {
                                console.error('Error actualizando vencimiento:', e);
                                mostrarNotificacion('error', 'Error al actualizar la fecha');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        loading={loading}
                        disabled={!fechaVencEdit}
                    />
                </div>
            </ViewModal>
        </View>
    );
}

export default VerDeuda;
