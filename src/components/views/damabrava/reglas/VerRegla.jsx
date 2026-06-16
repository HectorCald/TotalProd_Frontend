import React, { useMemo, useState } from 'react';
import styles from '../../../../styles/view.module.css';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Dato from '../../../common/old/Dato';
import reglasProduccionDamabravaService from '../../../../services/reglasProduccionDamabravaService';
import { useToast } from '../../../../context/ToastContext';
import Boton from '../../../common/botones/Boton';

const formatNumber = (value) => {
    if (value === undefined || value === null || value === '') return '--';
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) return String(value);
    return parsed.toFixed(3).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
};

function VerRegla({ isOpen, setIsOpen, regla, onReglaEliminada }) {
    const { showSuccess, showDanger } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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

    if (!regla) {
        return null;
    }

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Detalle de la Regla"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>{detalleRegla}</p>

                <div className={styles.content}>
                    <Dato
                        label="Tipo de regla"
                        value={tipoRegla}
                        vertical={false}
                    />
                    <Dato
                        label="Contiene"
                        value={regla.contiene || (regla.general === true ? 'No aplica' : '--')}
                        vertical={false}
                    />
                    <Dato
                        label="Producto"
                        value={
                            regla.general === false
                                ? (regla.producto_almacen?.name || 'No encontrado')
                                : 'No aplica'
                        }
                        vertical={false}
                    />
                    {regla.general === null && (
                        <>
                            <Dato
                                label="Desde gramaje"
                                value={`${formatNumber(regla.desde_gramaje)} gr`}
                                vertical={false}
                            />
                            <Dato
                                label="Hasta gramaje"
                                value={`${formatNumber(regla.hasta_gramaje)} gr`}
                                vertical={false}
                            />
                        </>
                    )}
                </div>

                <p className={styles.subTitle}>Procesos</p>
                <div className={styles.content}>
                    <Dato
                        label="Cernido"
                        value={`${formatNumber(regla.cernido)}`}
                        vertical={false}
                    />
                    <Dato
                        label="Sellado"
                        value={`${formatNumber(regla.sellado)}`}
                        vertical={false}
                    />
                    <Dato
                        label="Envasado"
                        value={`${formatNumber(regla.envasado)}`}
                        vertical={false}
                    />
                    <Dato
                        label="Etiquetado"
                        value={`${formatNumber(regla.etiquetado)}`}
                        vertical={false}
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
                                        showSuccess('Regla eliminada correctamente.');
                                        if (onReglaEliminada) {
                                            onReglaEliminada(regla.id);
                                        }
                                        setTimeout(() => {
                                            setIsDeleting(false);
                                            setIsDeleteConfirmOpen(false);
                                            setIsOpen(false);
                                        }, 300);
                                    } else {
                                        showDanger(response.message || 'No se pudo eliminar la regla.');
                                        setIsDeleting(false);
                                    }
                                } catch (error) {
                                    showDanger(error.message || 'No se pudo eliminar la regla.');
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

