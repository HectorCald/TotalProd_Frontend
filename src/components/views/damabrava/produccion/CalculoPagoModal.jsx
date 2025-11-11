import React from 'react';
import styles from '../../../../styles/view.module.css';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Dato from '../../../common/Dato';
import NoData from '../../../common/NoData';
import { formatGramajeDisplay } from '../../../../utils/reglasPagoHelper';

function CalculoPagoModal({ isOpen, setIsOpen, resultadoPago, reglaAplicada }) {
    const handleClose = () => {
        if (setIsOpen) {
            setIsOpen(false);
        }
    };

    const getSubtitle = () => {
        if (!reglaAplicada) {
            return null;
        }

        if (reglaAplicada.general === true) {
            return 'Regla general aplicada';
        }

        if (reglaAplicada.general === false) {
            return `Regla especial: ${reglaAplicada.producto_almacen?.name || reglaAplicada.contiene || 'Sin nombre'}`;
        }

        const desde = formatGramajeDisplay(reglaAplicada.desde_gramaje);
        const hasta = formatGramajeDisplay(reglaAplicada.hasta_gramaje);
        const rango = `${desde} - ${hasta}`;

        return `Regla por gramaje (Rango: ${rango})`;
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Pago según procesos"
                onClose={handleClose}
            />
            <div className={styles.modalContent}>
                {reglaAplicada && (
                    <p className={styles.subTitle}>{getSubtitle()}</p>
                )}

                {resultadoPago ? (
                    <div className={styles.content}>
                        <Dato
                            label={resultadoPago.cantidadLabel || 'Cantidad'}
                            value={`${resultadoPago.cantidad}`}
                        />
                        <Dato
                            label="Cernido"
                            value={Number(resultadoPago.cernido || 0).toFixed(2)}
                        />
                        <Dato
                            label="Sellado"
                            value={Number(resultadoPago.sellado || 0).toFixed(2)}
                        />
                        <Dato
                            label="Envasado"
                            value={Number(resultadoPago.envasado || 0).toFixed(2)}
                        />
                        <Dato
                            label="Etiquetado"
                            value={Number(resultadoPago.etiquetado || 0).toFixed(2)}
                        />
                        <Dato
                            label="Total a pagar"
                            value={Number(resultadoPago.total || 0).toFixed(2)}
                            especial='green'
                        />
                    </div>
                ) : (
                    <NoData
                        icon="coin-stack"
                        title="Sin resultados"
                        detail="No se pudo calcular el pago para esta producción."
                        transparent={true}
                        minHeight="150px"
                    />
                )}
            </div>
        </ViewModal>
    );
}

export default CalculoPagoModal;

