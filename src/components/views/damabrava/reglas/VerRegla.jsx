import React, { useMemo, useState } from 'react';
import styles from '../../../../styles/view.module.css';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Dato from '../../../common/Dato';
import Notification from '../../../common/Notification';
import reglasProduccionDamabravaService from '../../../../services/reglasProduccionDamabravaService';
import Boton from '../../../common/Boton';

const formatNumber = (value) => {
    if (value === undefined || value === null || value === '') return '--';
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) return String(value);
    return parsed.toFixed(3).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
};

function VerRegla({ isOpen, setIsOpen, regla, onReglaEliminada }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });

    const tipoRegla = useMemo(() => {
        if (!regla) return 'Desconocido';
        if (regla.general === true) return 'General';
        if (regla.general === false) return 'Especial';
        return 'Por gramaje';
    }, [regla]);

    const tituloRegla = useMemo(() => {
        if (!regla) return 'Regla';
        if (regla.general === true) return 'Regla general';
        if (regla.general === false) {
            return regla.producto_almacen?.name || 'Regla especial';
        }
        return 'Regla por gramaje';
    }, [regla]);

    const detalleRegla = useMemo(() => {
        if (!regla) return '--';
        if (regla.general === true) {
            return 'Aplica a todos los productos';
        }
        if (regla.general === false) {
            return regla.contiene || 'Aplicación específica';
        }
        return `Rango: ${formatNumber(regla.desde_gramaje)} - ${formatNumber(regla.hasta_gramaje)}`;
    }, [regla]);

    const mostrarNotificacion = (type, text) => {
        setNotification({
            isVisible: true,
            type,
            text
        });

        setTimeout(() => {
            setNotification((prev) => ({
                ...prev,
                isVisible: false
            }));
        }, 3000);
    };

    if (!regla) {
        return null;
    }

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Detalle de la regla"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>{detalleRegla}</p>

                <div className={styles.content}>
                    <Dato
                        label="Tipo de regla"
                        value={tipoRegla}
                    />
                    <Dato
                        label="Contiene"
                        value={regla.contiene || (regla.general === true ? 'No aplica' : '--')}
                    />
                    <Dato
                        label="Producto asociado"
                        value={
                            regla.general === false
                                ? (regla.producto_almacen?.name || 'No encontrado')
                                : 'No aplica'
                        }
                    />
                    {regla.general === null && (
                        <>
                            <Dato
                                label="Desde gramaje"
                                value={`${formatNumber(regla.desde_gramaje)} gr`}
                            />
                            <Dato
                                label="Hasta gramaje"
                                value={`${formatNumber(regla.hasta_gramaje)} gr`}
                            />
                        </>
                    )}
                </div>

                <p className={styles.subTitle}>Procesos</p>
                <div className={styles.content}>
                    <Dato
                        label="Cernido"
                        value={`${formatNumber(regla.cernido)}`}
                    />
                    <Dato
                        label="Sellado"
                        value={`${formatNumber(regla.sellado)}`}
                    />
                    <Dato
                        label="Envasado"
                        value={`${formatNumber(regla.envasado)}`}
                    />
                    <Dato
                        label="Etiquetado"
                        value={`${formatNumber(regla.etiquetado)}`}
                    />
                </div>

                <div className={styles.buttons}>
                    <Boton
                        className="btn-red"
                        label="Eliminar"
                        onClick={() => setIsDeleteConfirmOpen(true)}
                    />
                </div>
            </div>
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
            <ViewModal isOpen={isDeleteConfirmOpen} setIsOpen={setIsDeleteConfirmOpen}>
                <HeaderModal
                    title="Eliminar Regla"
                    onClose={() => setIsDeleteConfirmOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar esta regla? Esta acción es irreversible.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className="btn-default"
                            label="Cancelar"
                            onClick={() => setIsDeleteConfirmOpen(false)}
                            disabled={isDeleting}
                        />
                        <Boton
                            className="btn-red"
                            label="Sí, eliminar"
                            onClick={async () => {
                                if (!regla || !regla.id || isDeleting) {
                                    return;
                                }

                                setIsDeleting(true);
                                try {
                                    const response = await reglasProduccionDamabravaService.delete(regla.id);
                                    if (response.success) {
                                        mostrarNotificacion('success', 'Regla eliminada correctamente.');
                                        if (onReglaEliminada) {
                                            onReglaEliminada(regla.id);
                                        }
                                        setTimeout(() => {
                                            setIsDeleting(false);
                                            setIsDeleteConfirmOpen(false);
                                            setIsOpen(false);
                                        }, 300);
                                    } else {
                                        mostrarNotificacion('error', response.message || 'No se pudo eliminar la regla.');
                                        setIsDeleting(false);
                                    }
                                } catch (error) {
                                    mostrarNotificacion('error', error.message || 'No se pudo eliminar la regla.');
                                    setIsDeleting(false);
                                }
                            }}
                            loading={isDeleting}
                            disabled={isDeleting}
                        />
                    </div>
                </div>
            </ViewModal>
        </ViewModal>
    );
}

export default VerRegla;

