import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import clientService from '../../../../services/clientService';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';

const ViewInfo = ({ isOpen, onClose, cliente, onEdit, onDelete }) => {
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
                if (onEdit) onEdit(cliente);
            }}
            confirmDisabled={loadingUbicacion}
            hideFooter={true}
        >
                <InfoCard
                    title={cliente.name || 'Sin nombre'}
                    subtitle={cliente.total_orders || 0 > 1 ? `${cliente.total_orders} Pedidos` : cliente.total_orders === 1 ? '1 Pedido' : 'Sin Pedidos'}
                    customBlock={
                        cliente.phone ? (
                            <>
                            <ColumnInfo 
                                items={[
                                    { icon: 'phone', text: cliente.phone }
                                ]}
                            />
                            <ColumnInfo 
                                items={[
                                    { text: cliente.description }
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
                                tooltip="Editar Cliente"
                                onClick={() => {
                                    if (onEdit) onEdit(cliente);
                                }}
                            />
                            <BotonIcon
                                iconName="trash"
                                className="btn-error"
                                tooltipAlign="end"
                                tooltip="Eliminar Cliente"
                                onClick={() => {
                                    if (onDelete) onDelete(cliente);
                                }}
                            />
                        </div>
                    }
                />
        </ModalCentro>
    );
};

export default ViewInfo;