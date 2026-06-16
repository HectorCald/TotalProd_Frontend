import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import clientService from '../../../../services/clientService';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';

const ViewInfo = ({ isOpen, onClose, cliente, onEdit }) => {
    const [ubicacion, setUbicacion] = useState(null);
    const [loadingUbicacion, setLoadingUbicacion] = useState(false);

    useEffect(() => {
        if (isOpen && cliente?.id) {
            // Cargar la ubicación usando el service
            const fetchLocation = async () => {
                setLoadingUbicacion(true);
                try {
                    const response = await clientService.getLocation(cliente.id);
                    if (response.success && response.data) {
                        setUbicacion(response.data.location || cliente.location);
                    } else {
                        setUbicacion(cliente.location);
                    }
                } catch (error) {
                    setUbicacion(cliente.location);
                } finally {
                    setLoadingUbicacion(false);
                }
            };
            fetchLocation();
        } else {
            setUbicacion(null);
        }
    }, [isOpen, cliente]);

    if (!cliente) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                onClose();
                if (onEdit) onEdit(cliente);
            }}
            confirmDisabled={loadingUbicacion}
            hideFooter={true}
            width="450px"
        >
            <div style={{ margin: '-10px -24px -24px -24px' }}>
                <InfoCard
                    title={cliente.name || 'Sin nombre'}
                    subtitle="Información del Cliente"
                    description={cliente.description}
                    tags={[
                        {
                            text: 'Cliente',
                            icon: 'user'
                        },
                        cliente.phone ? {
                            text: cliente.phone,
                            icon: 'phone'
                        } : null
                    ].filter(Boolean)}
                    stats={[
                        {
                            label: 'Pedidos',
                            value: cliente.total_orders || 0,
                            icon: 'cart'
                        }
                    ]}
                    actionButton={
                        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                            <Boton
                                label="Ver en Google Maps"
                                iconName="map"
                                className="btn-primary"
                                loading={loadingUbicacion}
                                readOnly={!ubicacion && !loadingUbicacion}
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
                                    if (onEdit) onEdit(cliente);
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