import React, { useState, useEffect } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Dato from '../../../common/Dato';
import NoData from '../../../common/NoData';
import { useToast } from '../../../../context/ToastContext';
import { useLayout } from '../../../../context/LayoutContext';
import deudasService from '../../../../services/deudasService';
import { formatCurrency } from '../../../../utils/numberUtils';
import { formatFechaLiteral } from '../../../../utils/dateUtils';
import styles from '../../../../styles/view.module.css';

function ModalVerPagos({ 
    isOpen, 
    setIsOpen, 
    deuda,
    onDeudaActualizada
}) {
    const { isLargeScreen } = useLayout();
    const { showSuccess, showDanger } = useToast();
    const [pagos, setPagos] = useState([]);
    const [loadingPagos, setLoadingPagos] = useState(false);
    const [deletingPagoId, setDeletingPagoId] = useState(null);

    // Cargar pagos parciales cuando se abre el modal
    useEffect(() => {
        const cargarPagos = async () => {
            if (!deuda?.id) return;
            setLoadingPagos(true);
            try {
                const response = await deudasService.getPagosParciales(deuda.id);
                if (response.success) {
                    setPagos(response.data);
                } else {
                    showDanger('Error', response.message || 'Error al obtener pagos parciales');
                }
            } catch (e) {
                console.error('Error obteniendo pagos parciales:', e);
                showDanger('Error', 'Error al obtener pagos parciales');
            } finally {
                setLoadingPagos(false);
            }
        };
        if (isOpen) {
            cargarPagos();
        } else {
            setPagos([]);
        }
    }, [isOpen, deuda?.id]);

    const handleEliminarPago = async (pagoId) => {
        setDeletingPagoId(pagoId);
        try {
            const response = await deudasService.deletePagoParcial(deuda.id, pagoId);
            if (response.success) {
                // Refrescar lista
                const listResp = await deudasService.getPagosParciales(deuda.id);
                if (listResp.success) setPagos(listResp.data);
                // Notificar y actualizar deuda en padre
                if (onDeudaActualizada) {
                    onDeudaActualizada(response.data);
                }
                showSuccess('Éxito', 'Pago parcial eliminado');
            } else {
                showDanger('Error', response.message || 'Error al eliminar el pago');
            }
        } catch (e) {
            console.error('Error eliminando pago parcial:', e);
            showDanger('Error', 'Error al eliminar el pago parcial');
        } finally {
            setDeletingPagoId(null);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title='Pagos Parciales'
                onClose={() => setIsOpen(false)}
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
                                label={`• ${formatFechaLiteral(p.fecha, !isLargeScreen)}`}
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
    );
}

export default ModalVerPagos;
