import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';

const ViewInfo = ({ isOpen, onClose, proveedor, onEdit, onDelete }) => {
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
                                label="Editar Proveedor"
                                iconName="edit"
                                className="btn-primary"
                                style={{ flex: 1 }}
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
