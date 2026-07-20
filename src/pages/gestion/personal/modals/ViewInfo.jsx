import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';

const ViewInfo = ({ isOpen, onClose, personal, onEdit, onResetPassword, onDelete }) => {
    if (!personal) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                if (onEdit) onEdit(personal);
            }}
            hideFooter={true}
        >
                <InfoCard
                    title={`${personal.first_name || ''} ${personal.last_name || ''}`.trim() || 'Sin nombre'}
                    subtitle={personal.codigo || 'Sin correo'}
                    statusDot={personal.is_active ? 'success' : 'error'}
                    customBlock={
                        <>
                            <ColumnInfo 
                                items={[
                                    ...(personal.cargo ? [{ icon: 'card', text: personal.cargo }] : []),
                                    { icon: 'building', text: personal.sucursal?.name || 'Sin sucursal' }
                                ]}
                            />
                            <ColumnInfo 
                                title="Permisos Generales"
                                items={[
                                    { clave: 'Crear', valor: personal.permisos?.crear ? 'Sí' : 'No' },
                                    { clave: 'Editar', valor: personal.permisos?.editar ? 'Sí' : 'No' },
                                    { clave: 'Eliminar', valor: personal.permisos?.eliminar ? 'Sí' : 'No' },
                                    { clave: 'Anular', valor: personal.permisos?.anular ? 'Sí' : 'No' },
                                ]}
                            />
                            <ColumnInfo 
                                title="Permisos Extras"
                                items={[
                                    { clave: 'Reemplazar', valor: personal.permisos?.reemplazar ? 'Sí' : 'No' },
                                    { clave: 'Información', valor: personal.permisos?.info ? 'Sí' : 'No' },
                                    { clave: 'Sucursales', valor: personal.permisos?.sucursales ? 'Sí' : 'No' }
                                ]}
                            />
                        </>
                    }
                    actionButton={
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <Boton
                                label="Resetear Contraseña"
                                iconName="key"
                                className="btn-primary"
                                onClick={() => {
                                    if (onResetPassword) onResetPassword(personal);
                                }}
                            />
                            <BotonIcon
                                iconName="edit"
                                className="btn-primary"
                                tooltip="Editar Personal"
                                onClick={() => {
                                    if (onEdit) onEdit(personal);
                                }}
                            />
                            <BotonIcon
                                iconName="trash"
                                className="btn-error"
                                tooltipAlign="end"
                                tooltip="Eliminar Personal"
                                onClick={() => {
                                    if (onDelete) onDelete(personal);
                                }}
                            />
                        </div>
                    }
                />
        </ModalCentro>
    );
};

export default ViewInfo;