import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';

const ViewInfo = ({ isOpen, onClose, proveedor, onEdit, onDelete }) => {
    const [ubicacion, setUbicacion] = useState(null);

    useEffect(() => {
        if (isOpen && proveedor?.id) {
            setUbicacion(proveedor.location);
        } else {
            setUbicacion(null);
        }
    }, [isOpen, proveedor]);

    if (!proveedor) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                if (onEdit) onEdit(proveedor);
            }}
            hideFooter={true}
        >
                <InfoCard
                    title={proveedor.name || 'Sin nombre'}
                    subtitle={proveedor.total_orders || 0 > 1 ? `${proveedor.total_orders} Pedidos` : proveedor.total_orders === 1 ? '1 Pedido' : 'Sin Pedidos'}
                    customBlock={
                        proveedor.phone ? (
                            <>
                            <ColumnInfo 
                                items={[
                                    { icon: 'phone', text: proveedor.phone }
                                ]}
                            />
                            <ColumnInfo 
                                items={[
                                    { text: proveedor.description }
                                ]}
                                title='Descripción'
                            />
                        </>
                        ) : null
                    }
                    actionButton={
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <Boton
                                label="Ver en Google Maps"
                                iconName="map"
                                className="btn-primary"
                                readOnly={!ubicacion}
                                style={{ flex: 1 }}
                                onClick={() => {
                                    if (ubicacion) {
                                        const coordsLimpia = ubicacion.replace(/[()]/g, '');
                                        window.open(`https://www.google.com/maps?q=${coordsLimpia}`, '_blank');
                                    }
                                }}
                            />
                            <BotonIcon
                                iconName="edit"
                                className="btn-primary"
                                tooltip="Editar Proveedor"
                                onClick={() => {
                                    if (onEdit) onEdit(proveedor);
                                }}
                            />
                            <BotonIcon
                                iconName="trash"
                                className="btn-error"
                                tooltipAlign="end"
                                tooltip="Eliminar Proveedor"
                                onClick={() => {
                                    if (onDelete) onDelete(proveedor);
                                }}
                            />
                        </div>
                    }
                />
        </ModalCentro>
    );
};

export default ViewInfo;
