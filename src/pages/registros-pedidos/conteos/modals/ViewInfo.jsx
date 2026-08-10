import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import EliminarConteo from './EliminarConteo';
import ReemplazarConteo from './ReemplazarConteo';
import ProductosConteo from './ProductosConteo';

const ViewInfo = ({ isOpen, onClose, conteo, onEliminar, onReemplazar }) => {
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isReemplazarOpen, setIsReemplazarOpen] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);

    const rawFechaStr = conteo?.fecha || '';
    const fechaLiteral = useFechaLiteral(rawFechaStr, false, true) || rawFechaStr;

    if (!conteo) return null;

    const tags = [];
    if (conteo.codigo) {
        tags.push({ label: 'Código', text: conteo.codigo, icon: 'hash' });
    }
    tags.push({
        label: 'Tipo',
        text: conteo.tipo === 'almacen' ? 'Almacén' : 'Materia Prima',
        icon: conteo.tipo === 'almacen' ? 'box' : 'layer'
    });

    const stats = [];
    const responsable = conteo.user?.name || conteo.personal?.name;
    if (responsable) {
        stats.push({ label: 'Responsable', value: responsable, icon: 'user' });
    }
    if (conteo.detalles_count !== undefined) {
        stats.push({ label: 'Ítems Contados', value: `${conteo.detalles_count} ítems`, icon: 'list' });
    }

    const handleConteoEliminado = (id) => {
        onClose();
        if (onEliminar) onEliminar(id);
    };

    const handleConteoReemplazado = (id) => {
        if (onReemplazar) onReemplazar(id);
    };

    return (
        <>
            <ModalCentro
                isOpen={isOpen && !isEliminarOpen && !isReemplazarOpen && !isProductosOpen}
                onClose={onClose}
                title=""
                hideFooter={true}
            >
                <InfoCard
                    title={conteo.codigo || 'Conteo'}
                    subtitle={fechaLiteral}
                    statusDot={conteo.tipo === 'almacen' ? 'info' : 'success'}
                    icon="file"
                    customBlock={
                        <>
                            {tags.length > 0 && (
                                <ColumnInfo items={tags.map(t => ({ text: t.text, icon: t.icon }))} />
                            )}
                            {stats.length > 0 && (
                                <ColumnInfo 
                                    title="Detalles"
                                    items={stats.map(s => ({ clave: s.label, valor: s.value }))}
                                />
                            )}
                            <ColumnInfo 
                                title="Observaciones"
                                items={[
                                    ...(conteo.observaciones ? [{ text: conteo.observaciones }] : []),
                                    { text: "Nota: Los productos registrados como contados son aquellos que tienen stock mayor a 0 contados o en el sistema." }
                                ]}
                            />
                        </>
                    }
                    actionButton={
                        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                            <Boton
                                label="Productos"
                                iconName="box"
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => setIsProductosOpen(true)}
                            />
                            <BotonIcon
                                iconName="refresh"
                                className="btn-warning"
                                tooltip="Reemplazar Stock"
                                tooltipAlign="end"
                                onClick={() => setIsReemplazarOpen(true)}
                            />
                            <BotonIcon
                                iconName="trash"
                                className="btn-error"
                                tooltip="Eliminar Conteo"
                                tooltipAlign="end"
                                onClick={() => setIsEliminarOpen(true)}
                            />
                        </div>
                    }
                />
            </ModalCentro>

            <EliminarConteo
                isOpen={isEliminarOpen}
                onClose={() => setIsEliminarOpen(false)}
                conteoSeleccionado={conteo}
                onEliminar={handleConteoEliminado}
            />

            <ReemplazarConteo
                isOpen={isReemplazarOpen}
                onClose={() => setIsReemplazarOpen(false)}
                conteoSeleccionado={conteo}
                onReemplazar={handleConteoReemplazado}
            />

            <ProductosConteo
                isOpen={isProductosOpen}
                onClose={() => setIsProductosOpen(false)}
                conteoSeleccionado={conteo}
            />
        </>
    );
};

export default ViewInfo;
