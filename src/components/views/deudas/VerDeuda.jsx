import React, { useState } from 'react';
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
import EditarAgregarDeuda from './EditarAgregarDeuda';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import VerMovimiento from '../movimientos/VerMovimiento';

function VerDeuda({ isOpen, setIsOpen, deuda, onDeudaEliminada, onDeudaActualizada }) {
    const [loading, setLoading] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [movimientoDetalle, setMovimientoDetalle] = useState(null);
    const [isMovimientoDetalleOpen, setIsMovimientoDetalleOpen] = useState(false);

    // Función para preparar datos de descarga
    const prepararDatosDescarga = () => {
        if (!deuda) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Información superior
        const informacionSuperior = {
            'Responsable': deuda?.user?.name || deuda?.personal?.name || 'Usuario desconocido',
            'Fecha Deuda': new Date(deuda?.fecha_deuda).toLocaleString(),
            'Fecha Vencimiento': new Date(deuda?.fecha_vencimiento).toLocaleString(),
            'Concepto': deuda?.concepto || 'Sin concepto',
            'Monto Total': `Bs. ${(parseFloat(deuda?.monto_total) || 0).toFixed(2)}`,
            'Saldo Pendiente': `Bs. ${(parseFloat(deuda?.saldo_pendiente) || 0).toFixed(2)}`,
            'Estado': deuda?.estado || 'Sin estado',
            'Sucursal': deuda?.sucursal?.name || 'Sucursal no encontrada'
        };

        if (deuda?.cliente?.name) {
            informacionSuperior['Cliente'] = deuda.cliente.name;
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
        if (!deuda?.movimiento_salida_id) {
            mostrarNotificacion('error', 'No hay movimiento asociado a esta deuda');
            return;
        }

        try {
            setLoading(true);
            const response = await movimientosAlmacenService.getById(deuda.movimiento_salida_id);

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
        if (onDeudaActualizada) {
            onDeudaActualizada(deudaActualizada);
        }
        setIsEditarOpen(false);
        setIsOpen(false);
    };


    // Función para marcar como pagada
    const handleMarcarComoPagada = async () => {
        setLoading(true);
        try {
            const response = await deudasService.updateEstado(deuda.id, 'pagada', 0);

            if (response.success) {
                if (onDeudaActualizada) {
                    onDeudaActualizada({ ...deuda, estado: 'pagada', saldo_pendiente: 0 });
                }
                mostrarNotificacion('success', 'Deuda marcada como pagada');
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

    // Verificar si la deuda está vencida
    const isVencida = new Date(deuda?.fecha_vencimiento) < new Date() && deuda?.estado === 'pendiente';

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

                <p className={styles.subTitle}>INFORMACIÓN DE LA DEUDA</p>
                <ItemView
                    title={deuda?.user?.name || deuda?.personal?.name || 'Usuario desconocido'}
                    description="Responsable de la deuda"
                    transparent={false}
                />
                <ItemView
                    title={deuda?.concepto || 'Sin concepto'}
                    description={`Fecha: ${new Date(deuda?.fecha_deuda).toLocaleDateString()}`}
                    description2={`Vencimiento: ${new Date(deuda?.fecha_vencimiento).toLocaleDateString()}`}
                    transparent={false}
                    circulo={false}
                    flot3={deuda?.estado === 'pendiente' ? deuda?.estado : ''}
                    flot4={deuda?.estado === 'pagada' ? deuda?.estado : ''}


                    style={isVencida ? { borderLeft: '4px solid #e74c3c' } : {}}
                />

                {/* Mostrar cliente o sucursal destino según corresponda */}
                {deuda?.destino_sucursal_id ? (
                    <ItemView
                        title={deuda.sucursal_destino?.name || 'Sucursal no encontrada'}
                        description="Sucursal Destino"
                        transparent={false}
                    />
                ) : (
                    deuda?.cliente?.name && (
                        <ItemView
                            title={deuda.cliente.name}
                            description="Cliente"
                            transparent={false}
                        />
                    )
                )}

                {/* Botón Ver Detalle del Movimiento */}
                 {deuda?.movimiento_salida_id && (
                    <Boton
                        className='btn-gray'
                        label='Ver Detalle'
                        onClick={handleVerDetalleMovimiento}
                        loading={loading}
                    />

                )}
                <Dato
                        label="Sucursal deuda"
                        value={deuda?.sucursal?.name || 'No especificada'}
                        vertical={false}
                    />
                <Dato
                    label="Monto Total"
                    value={`Bs. ${(parseFloat(deuda?.monto_total) || 0).toFixed(2)}`}
                    vertical={false}
                    especial='blue'
                />

                <Dato
                    label="Saldo Pendiente"
                    value={`Bs. ${(parseFloat(deuda?.saldo_pendiente) || 0).toFixed(2)}`}
                    vertical={false}
                    especial={deuda?.saldo_pendiente > 0 ? 'red' : 'green'}
                />

                {/* Botones de acciones rápidas */}
                {deuda?.estado === 'pendiente' && (

                    <>
                        <Boton
                            className='btn-original'
                            label='Marcar como Pagada'
                            onClick={handleMarcarComoPagada}
                            loading={loading}
                        />
                        {isVencida && (
                            <Boton
                                className='btn-red'
                                label='Marcar como Vencida'
                                onClick={handleMarcarComoVencida}
                                loading={loading}
                            />
                        )}
                    </>
                )}

                <div className={styles.buttons}>
                    {/* Solo mostrar botones de eliminar y editar si NO tiene movimiento_salida_id */}
                    {!deuda?.movimiento_salida_id && (
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
                </div>
            </div>

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Deuda"
                subtitulo="Selecciona el formato que prefieras para descargar esta deuda."
                nombreArchivo={`Deuda_${new Date(deuda?.fecha_deuda).toLocaleDateString().replace(/\//g, '-')}_${deuda?.concepto?.replace(/[^a-zA-Z0-9]/g, '_') || 'deuda'}`}
                {...prepararDatosDescarga()}
            />

            {/* Modal de editar deuda */}
            <EditarAgregarDeuda
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                deuda={deuda}
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
                <div className={styles.modalContent}>
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
                                    const response = await deudasService.delete(deuda.id);

                                    if (response.success) {
                                        setIsEliminarOpen(false);
                                        setIsOpen(false);

                                        if (onDeudaEliminada) {
                                            onDeudaEliminada(deuda.id);
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
        </View>
    );
}

export default VerDeuda;
