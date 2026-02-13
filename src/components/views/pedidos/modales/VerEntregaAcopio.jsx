import React, { useEffect } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Dato from '../../../common/Dato';
import { formatFechaLiteral } from '../../../../utils/dateUtils';
import { useLayout } from '../../../../context/LayoutContext';
import { useToast } from '../../../../context/ToastContext';
import styles from '../../../../styles/view.module.css';

function VerEntregaAcopio({ 
    isOpen, 
    setIsOpen, 
    pedidoActual
}) {
    const { isLargeScreen } = useLayout();
    const { showDanger } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (!pedidoActual || !pedidoActual.fecha_entregado) {
                showDanger('Error', 'No se encontró información de la entrega');
                setIsOpen(false);
            }
        }
    }, [isOpen, pedidoActual, showDanger, setIsOpen]);

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Detalles de la Entrega"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                {pedidoActual && (
                    <>
                        <p className={styles.subTitle}>INFORMACIÓN DE LA ENTREGA</p>
                        <Dato
                            label="Producto Entregado"
                            value={pedidoActual.producto_acopio?.name || 'Producto no encontrado'}
                        />
                        <Dato
                            label="Cantidad Entregada"
                            value={`${pedidoActual.cantidad_entregada || 0} kg`}
                        />
                        <Dato
                            label="Cantidad en Unidades"
                            value={`${pedidoActual.cantidad_entregada_ud || 0} ${pedidoActual.cantidad_entregada_medida || 'bolsa'}`}
                        />
                        <Dato
                            label="Estado de Entrega"
                            value={pedidoActual.estado_entrega === 'llego' ? 'Llegó' : 'No llegó'}
                        />
                        <Dato
                            label="Entregado por"
                            value={pedidoActual.entregado_por || 'No especificado'}
                        />
                        <Dato
                            label="Fecha de Entrega"
                            value={pedidoActual.fecha_entregado ? formatFechaLiteral(pedidoActual.fecha_entregado, !isLargeScreen) : 'No especificada'}
                        />
                        {pedidoActual.observaciones_entrega && (
                            <Dato
                                label="Observaciones de Entrega"
                                value={pedidoActual.observaciones_entrega}
                            />
                        )}
                    </>
                )}
            </div>
        </ViewModal>
    );
}

export default VerEntregaAcopio;
