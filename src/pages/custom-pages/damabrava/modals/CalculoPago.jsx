import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import InfoCard from '../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import { formatGramajeDisplay } from '../../../../utils/reglasPagoHelper';

const CalculoPago = ({ isOpen, onClose, resultadoPago, reglaAplicada }) => {
    const { formatPrice } = useFormatNumber();

    if (!isOpen) return null;

    const getSubtitle = () => {
        if (!reglaAplicada) return 'Sin regla aplicada';
        if (reglaAplicada.general === true) return 'Regla general aplicada';
        if (reglaAplicada.general === false) return `Regla especial: ${reglaAplicada.producto_almacen?.name || reglaAplicada.contiene || 'Sin nombre'}`;

        const desde = formatGramajeDisplay(reglaAplicada.desde_gramaje);
        const hasta = formatGramajeDisplay(reglaAplicada.hasta_gramaje);
        return `Regla por gramaje (${desde} - ${hasta})`;
    };

    const financeItems = [];
    if (resultadoPago) {
        if (Number(resultadoPago.cernido) > 0) {
            financeItems.push({ clave: 'Cernido', valor: `Bs. ${formatPrice(Number(resultadoPago.cernido))}` });
        }
        if (Number(resultadoPago.sellado) > 0) {
            financeItems.push({ clave: 'Sellado', valor: `Bs. ${formatPrice(Number(resultadoPago.sellado))}` });
        }
        if (Number(resultadoPago.envasado) > 0) {
            financeItems.push({ clave: 'Envasado', valor: `Bs. ${formatPrice(Number(resultadoPago.envasado))}` });
        }
        if (Number(resultadoPago.etiquetado) > 0) {
            financeItems.push({ clave: 'Etiquetado', valor: `Bs. ${formatPrice(Number(resultadoPago.etiquetado))}` });
        }
    }

    const totalFinalNum = resultadoPago ? Number(resultadoPago.total || 0) : 0;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Cerrar"
            onConfirm={onClose}
            hideFooter={true}
            width="450px"
            receipt={true}
        >
            <InfoCard
                title="Cálculo de Pago"
                subtitle={getSubtitle()}
                description={`Base: ${resultadoPago?.cantidad || 0} ${resultadoPago?.cantidadLabel === 'Cantidad verificada' ? 'ud verificadas' : 'ud terminadas'}`}
                statusDot={totalFinalNum > 0 ? "success" : "warning"}
                icon="calculator"
                customBlock={
                    resultadoPago && (
                        <>
                            {financeItems.length > 0 ? (
                                <ColumnInfo 
                                    title="Desglose"
                                    items={financeItems}
                                    finance={true}
                                    financeTotal={`Bs. ${formatPrice(totalFinalNum)}`}
                                />
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--secondary-color)' }}>
                                    El pago calculado es 0 Bs.
                                </div>
                            )}
                        </>
                    )
                }
            />
        </ModalCentro>
    );
};

export default CalculoPago;
