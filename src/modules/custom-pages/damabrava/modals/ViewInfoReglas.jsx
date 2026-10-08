import React, { useMemo, useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import InfoCard from '../../../../components/common/information/InfoCard';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import EliminarRegla from './EliminarRegla';

const formatNumber = (value) => {
    if (value === undefined || value === null || value === '') return '--';
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) return String(value);
    return parsed.toFixed(3).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
};

const ViewInfoReglas = ({ isOpen, onClose, regla, onReglaEliminada }) => {
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
        return `Rango: ${formatNumber(regla.desde_gramaje)} gr - ${formatNumber(regla.hasta_gramaje)} gr`;
    }, [regla]);

    if (!regla) return null;


    const handleDeleteClick = () => {
        setIsDeleteConfirmOpen(true);
    };

    const handleReglaEliminada = (reglaId) => {
        setIsDeleteConfirmOpen(false);
        if (onReglaEliminada) {
            onReglaEliminada(reglaId);
        }
    };

    return (
        <>
            <ModalCentro
                isOpen={isOpen && !isDeleteConfirmOpen}
                onClose={onClose}
                title=""
                confirmText="Cerrar"
                onConfirm={onClose}
                hideFooter={true}
                width="450px"
            >
                <InfoCard
                    title={tituloRegla}
                    subtitle={detalleRegla}
                    icon="book"
                    customBlock={
                        <>
                            <ColumnInfo 
                                items={[
                                    { icon: 'category', text: `Tipo: ${tipoRegla}` },
                                    regla.general === true && { icon: 'info-circle', text: 'Contiene: No aplica' },
                                    regla.general === true && { icon: 'package', text: 'Producto: No aplica' },
                                    regla.general === false && { icon: 'filter', text: `Contiene: ${regla.contiene || '--'}` },
                                    regla.general === false && { icon: 'package', text: `Producto: ${regla.producto_almacen?.name || 'No encontrado'}` },
                                    (regla.general !== true && regla.general !== false) && { icon: 'sort-down', text: `Desde gramaje: ${formatNumber(regla.desde_gramaje)} gr` },
                                    (regla.general !== true && regla.general !== false) && { icon: 'sort-up', text: `Hasta gramaje: ${formatNumber(regla.hasta_gramaje)} gr` }
                                ].filter(Boolean)} 
                            />
                            <ColumnInfo 
                                title="Procesos (Bs.)"
                                items={[
                                    { clave: 'Cernido', valor: formatNumber(regla.cernido) },
                                    { clave: 'Sellado', valor: formatNumber(regla.sellado) },
                                    { clave: 'Envasado', valor: formatNumber(regla.envasado) },
                                    { clave: 'Etiquetado', valor: formatNumber(regla.etiquetado) }
                                ]}
                            />
                        </>
                    }
                    actionButton={
                        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                            <BotonIcon
                                iconName="trash"
                                className="btn-error"
                                tooltip="Eliminar Regla"
                                onClick={handleDeleteClick}
                            />
                        </div>
                    }
                />
            </ModalCentro>

            <EliminarRegla
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                regla={regla}
                onReglaEliminada={handleReglaEliminada}
            />
        </>
    );
};

export default ViewInfoReglas;
