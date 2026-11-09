import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';

const parseDescriptionLocation = (desc) => {
    if (!desc || !String(desc).trim()) return null;
    const parts = String(desc)
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

    if (parts.length >= 3) {
        return {
            pais: parts[parts.length - 1],
            ciudad: parts[parts.length - 2],
            direccion: parts.slice(0, -2).join(', '),
        };
    }

    if (parts.length === 2) {
        return {
            pais: parts[1],
            ciudad: parts[0],
            direccion: '--',
        };
    }

    return {
        pais: 'Bolivia',
        ciudad: '--',
        direccion: parts[0],
    };
};

const ViewInfo = ({ isOpen, onClose, cliente, onEdit, onDelete }) => {
    if (!cliente) return null;

    const ubicacionSeparada = parseDescriptionLocation(cliente.description_location);
    const hasCustomInfo = Boolean(cliente.phone || cliente.description || ubicacionSeparada);

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
                subtitle={(cliente.total_orders || 0) > 1 ? `${cliente.total_orders} Pedidos` : cliente.total_orders === 1 ? '1 Pedido' : 'Sin Pedidos'}
                customBlock={
                    hasCustomInfo ? (
                        <>
                            {cliente.phone && (
                                <ColumnInfo
                                    items={[
                                        { icon: 'phone', text: cliente.phone }
                                    ]}
                                />
                            )}
                            {cliente.description && (
                                <ColumnInfo
                                    items={[
                                        { text: cliente.description }
                                    ]}
                                    title="Descripción"
                                />
                            )}
                            {ubicacionSeparada && (
                                <ColumnInfo
                                    title="Ubicación"
                                    items={[
                                        { clave: 'País', valor: ubicacionSeparada.pais },
                                        { clave: 'Ciudad', valor: ubicacionSeparada.ciudad },
                                        { clave: 'Dirección', valor: ubicacionSeparada.direccion },
                                    ]}
                                />
                            )}
                        </>
                    ) : null
                }
                actionButton={
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <Boton
                            label="Editar Cliente"
                            iconName="edit"
                            className="btn-primary"
                            style={{ flex: 1 }}
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