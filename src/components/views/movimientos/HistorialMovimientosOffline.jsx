import React, { useState, useEffect, useCallback, useRef } from 'react';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import styles from '../../../styles/view.module.css';
import Notification from '../../common/Notification';
import VerMovimientoOffline from './VerMovimientoOffline';
import NoData from '../../common/NoData';
import Text from '../../common/Text';
import { obtenerLocal, OFFLINE_DB_NAME, CLIENTES_STORE } from '../../../utils/indexedDB';

const formatFecha = (fechaIso) => {
    if (!fechaIso) return '--';
    try {
        const fecha = new Date(fechaIso);
        return fecha.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return fechaIso;
    }
};

const formatTotal = (resumen) => {
    if (!resumen) return '--';
    const subtotal = Number(resumen.subtotal || 0);
    const descuento = subtotal * (Number(resumen.descuentoPorcentaje || 0) / 100);
    const aumento = subtotal * (Number(resumen.aumentoPorcentaje || 0) / 100);
    const total = subtotal - descuento + aumento;
    return `Bs. ${total.toFixed(2)}`;
};

function HistorialMovimientosOffline({
    isOpen,
    setIsOpen,
    movimientos = [],
    titulo = 'Movimientos offline',
    descripcion = 'Listado de movimientos pendientes por sincronizar',
    onClose,
    disableClose = false,
    onMovementsUpdate,
    showOnlineWarning = false
}) {
    const [clientesMap, setClientesMap] = useState({});
    const [movimientosLocal, setMovimientosLocal] = useState([]);
    const [selectedMovimiento, setSelectedMovimiento] = useState(null);
    const [isVerMovimientoOpen, setIsVerMovimientoOpen] = useState(false);
    const [notification, setNotification] = useState({ isVisible: false, type: 'success', text: '' });

    const mostrarNotificacion = (tipo, texto) => {
        setNotification({ isVisible: true, type: tipo, text: texto });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    const loadClientes = useCallback(async () => {
        try {
            const clientes = await obtenerLocal(CLIENTES_STORE, OFFLINE_DB_NAME);
            if (Array.isArray(clientes)) {
                const map = {};
                clientes.forEach(cliente => {
                    if (cliente?.id) {
                        map[cliente.id] = cliente;
                    }
                });
                setClientesMap(map);
            }
        } catch (error) {
            console.warn('No se pudieron cargar clientes offline:', error);
        }
    }, []);

    const isSyncingFromPropsRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            loadClientes();
        }
    }, [isOpen, loadClientes]);

    useEffect(() => {
        if (!isOpen) return;
        isSyncingFromPropsRef.current = true;
        setMovimientosLocal(Array.isArray(movimientos) ? [...movimientos] : []);
    }, [movimientos, isOpen]);

    const handleMovimientoClick = (movimiento) => {
        setSelectedMovimiento(movimiento);
        setIsVerMovimientoOpen(true);
    };

    const handleMovimientoEliminado = (movimientoId, remaining) => {
        setIsVerMovimientoOpen(false);
        setSelectedMovimiento(null);
        setMovimientosLocal(prev => prev.filter(mov => mov.id !== movimientoId));
        if (remaining && remaining.length === 0) {
            mostrarNotificacion('info', 'No quedan movimientos offline guardados.');
        } else {
            mostrarNotificacion('success', 'Movimiento offline eliminado.');
        }
    };

    const handleClose = useCallback(() => {
        setIsOpen(false);
        if (typeof onClose === 'function') {
            onClose();
        }
    }, [onClose, setIsOpen]);

    const handleModalToggle = useCallback((value) => {
        if (!value) {
            handleClose();
        } else {
            setIsOpen(true);
        }
    }, [handleClose, setIsOpen]);

    useEffect(() => {
        if (!isOpen) return;
        if (isSyncingFromPropsRef.current) {
            isSyncingFromPropsRef.current = false;
            return;
        }
        if (typeof onMovementsUpdate === 'function') {
            onMovementsUpdate(movimientosLocal);
        }
    }, [movimientosLocal, onMovementsUpdate, isOpen]);

    const modalVisible = isOpen && !isVerMovimientoOpen;

    return (
        <>
            <ViewModal isOpen={modalVisible} setIsOpen={handleModalToggle} closed={disableClose}>
                <HeaderModal
                    title={titulo}
                    onClose={() => handleModalToggle(false)}
                    closed={disableClose}
                />
                <div className={styles.modalContent}>
                    {movimientosLocal.length > 0 && (
                        <>
                            <p className={styles.subTitle}>{descripcion}</p>
                            {showOnlineWarning && (
                                <div style={{ marginBottom: '10px' }}>
                                    <Text type="error" align="left">
                                        Debes registrar o eliminar estos movimientos offline para evitar conflictos con el stock del almacén y poder continuar usando la aplicación.
                                    </Text>
                                </div>
                            )}

                        </>
                    )}
                    {movimientosLocal.length > 0 ? (
                        [...movimientosLocal]
                            .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
                            .map((movimiento) => {
                                const resumen = movimiento?.resumen || {};
                                const descripcion1 = `${formatFecha(movimiento?.createdAt)} • ${resumen.metodoPago || 'Método no especificado'}`;
                                const descripcion2 = `Total estimado: ${formatTotal(resumen)}`;
                                const flot2 = resumen.numeroOrden ? `Orden ${resumen.numeroOrden}` : '';
                                const flot3 = movimiento?.status === 'pending' ? 'Pendiente' : movimiento?.status;
                                const clienteId = movimiento?.datos?.movimientoData?.cliente_id || movimiento?.datos?.clienteInfo?.id;
                                const clienteNombre = clienteId ? (clientesMap[clienteId]?.name || movimiento?.datos?.clienteInfo?.name || '') : '';
                                const productosMovimiento = movimiento?.datos?.productos || [];
                                const fallbackTitulo = (() => {
                                    if (productosMovimiento.length === 1) {
                                        return productosMovimiento[0]?.name || 'Sin producto';
                                    }
                                    if (productosMovimiento.length > 1) {
                                        return `${productosMovimiento.length} productos`;
                                    }
                                    return 'Sin productos';
                                })();
                                const baseTitle =
                                    movimiento?.datos?.movimientoData?.concepto?.trim() ||
                                    resumen.observaciones?.trim() ||
                                    fallbackTitulo;
                                const title = clienteNombre ? `${clienteNombre} - ${baseTitle}` : baseTitle;

                                return (
                                    <ItemView
                                        key={movimiento.id}
                                        title={title}
                                        description={descripcion1}
                                        description2={descripcion2}
                                        icon="transfer"
                                        flot2={flot2}
                                        flot3={flot3}
                                        transparent={false}
                                        circulo
                                        onClick={() => handleMovimientoClick(movimiento)}
                                    />
                                );
                            })
                    ) : (
                        <NoData
                            icon="time-five"
                            title="Sin movimientos offline"
                            detail="No tienes registros pendientes guardados en este dispositivo."
                            transparent={true}
                            minHeight="160px"
                        />
                    )}
                </div>

                <Notification
                    isVisible={notification.isVisible}
                    type={notification.type}
                    text={notification.text}
                />
            </ViewModal>
            {selectedMovimiento && (
                <VerMovimientoOffline
                    isOpen={isVerMovimientoOpen}
                    setIsOpen={setIsVerMovimientoOpen}
                    movimiento={selectedMovimiento}
                    onMovimientoEliminado={handleMovimientoEliminado}
                />
            )}
        </>
    );
}

export default HistorialMovimientosOffline;



