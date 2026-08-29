import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';

const ViewInfo = ({ isOpen, onClose, cliente, onEdit, onDelete }) => {
    if (!cliente) return null;

    const ubicacion = cliente.location;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                if (onEdit) onEdit(cliente);
            }}
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
                                readOnly={!ubicacion}
                                style={{ flex: 1 }}
                                onClick={() => {
                                    if (ubicacion) {
                                        const coords = typeof ubicacion === 'object' && ubicacion !== null
                                            ? `${ubicacion.x},${ubicacion.y}`
                                            : String(ubicacion).replace(/[()]/g, '');
                                        window.open(`https://www.google.com/maps?q=${coords}`, '_blank');
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