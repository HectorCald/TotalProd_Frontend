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

    const tags = [];
    tags.push({ label: 'Tipo', text: tipoRegla, icon: 'category' });
    
    if (regla.general === true) {
        tags.push({ label: 'Contiene', text: 'No aplica', icon: 'info-circle' });
        tags.push({ label: 'Producto', text: 'No aplica', icon: 'package' });
    } else if (regla.general === false) {
        tags.push({ label: 'Contiene', text: regla.contiene || '--', icon: 'filter' });
        tags.push({ label: 'Producto', text: regla.producto_almacen?.name || 'No encontrado', icon: 'package' });
    } else {
        tags.push({ label: 'Desde gramaje', text: `${formatNumber(regla.desde_gramaje)} gr`, icon: 'sort-down' });
        tags.push({ label: 'Hasta gramaje', text: `${formatNumber(regla.hasta_gramaje)} gr`, icon: 'sort-up' });
    }

    const stats = [];
    stats.push({ label: 'Cernido', value: formatNumber(regla.cernido), icon: 'filter' });
    stats.push({ label: 'Sellado', value: formatNumber(regla.sellado), icon: 'check-shield' });
    stats.push({ label: 'Envasado', value: formatNumber(regla.envasado), icon: 'box' });
    stats.push({ label: 'Etiquetado', value: formatNumber(regla.etiquetado), icon: 'tag' });

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
                            {tags.length > 0 && (
                                <ColumnInfo items={tags.map(t => ({ text: `${t.label}: ${t.text}`, icon: t.icon }))} />
                            )}
                            {stats.length > 0 && (
                                <ColumnInfo 
                                    title="Procesos (Bs.)"
                                    items={stats.map(s => ({ clave: s.label, valor: s.value }))}
                                />
                            )}
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
