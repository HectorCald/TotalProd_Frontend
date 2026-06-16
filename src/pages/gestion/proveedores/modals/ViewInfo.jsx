import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';

const ViewInfo = ({ isOpen, onClose, proveedor, onEdit }) => {
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
                onClose();
                if (onEdit) onEdit(proveedor);
            }}
            hideFooter={true}
            width="450px"
        >
            <div style={{ margin: '-10px -24px -24px -24px' }}>
                <InfoCard
                    title={proveedor.name || 'Sin nombre'}
                    subtitle="Información del Proveedor"
                    description={proveedor.description}
                    tags={[
                        {
                            text: 'Proveedor',
                            icon: 'user'
                        },
                        proveedor.phone ? {
                            text: proveedor.phone,
                            icon: 'phone'
                        } : null
                    ].filter(Boolean)}
                    stats={[
                        {
                            label: 'Pedidos',
                            value: proveedor.total_orders || 0,
                            icon: 'cart'
                        }
                    ]}
                    actionButton={
                        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
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
                                onClick={() => {
                                    onClose();
                                    if (onEdit) onEdit(proveedor);
                                }}
                            />
                        </div>
                    }
                />
            </div>
        </ModalCentro>
    );
};

export default ViewInfo;
