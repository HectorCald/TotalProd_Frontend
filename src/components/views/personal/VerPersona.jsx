import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import Notification from '../../common/Notification';
import personalService from '../../../services/personalService';
import NoData from '../../common/NoData';
import ItemLine from '../../common/ItemLine';
import MapaModal from '../clientes/MapaModal';
import useHistorialLogger from '../../ui/HistorialLogger';


function VerPersona({ isOpen, setIsOpen, usuario, onProveedorDeleted, onProveedorUpdated, sucursales = [] }) {

    // Estado local para el usuario (se actualiza cuando se edita)
    const [localUsuario, setLocalUsuario] = useState(usuario);
    const { logAccion } = useHistorialLogger({
        modulo: 'Personal',
        campos: [
            'first_name',
            'last_name',
            'codigo',
            'cargo',
            'is_active',
            'sucursal_id',
            'sucursal',
            'permisos',
            'modules',
            'rastrear',
            'ubicacion'
        ]
    });

    // Actualizar el estado local cuando cambie el usuario prop
    useEffect(() => {
        setLocalUsuario(usuario);
    }, [usuario]);

    // Estados para los modales
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

    // Estado para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });

    // Estados para la carga
    const [loading, setLoading] = useState(false);


    // Estados para módulos y permisos
    const [isModulesOpen, setIsModulesOpen] = useState(false);
    const [isPermisosOpen, setIsPermisosOpen] = useState(false);

    // Estados para el mapa
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);


    // Función para eliminar el personal
    const handleEliminar = async (id) => {
        if (!id) {
            mostrarNotificacion('error', 'ID del personal no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.delete(id);

            if (response.success) {
                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: `${localUsuario?.first_name || ''} ${localUsuario?.last_name || ''}`.trim() || 'Personal',
                    registroId: localUsuario?.id || null,
                    datosAntes: localUsuario,
                    comentario: 'Eliminación de personal'
                });

                // Notificar al componente padre que se eliminó un personal
                if (onProveedorDeleted) {
                    onProveedorDeleted(id);
                    setIsDeleteOpen(false);
                    setIsOpen(false);
                    mostrarNotificacion('success', 'Personal eliminado correctamente');
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar el personal');
            }
        } catch (error) {
            console.error('Error al eliminar personal:', error);
            mostrarNotificacion('error', 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    }

    // Función para mostrar notificación
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Función para copiar código al portapapeles
    const handleCopyCode = async () => {
        if (!localUsuario?.codigo) {
            mostrarNotificacion('error', 'No hay código para copiar');
            return;
        }

        try {
            await navigator.clipboard.writeText(localUsuario.codigo);
            mostrarNotificacion('success', 'Código copiado al portapapeles');
        } catch (error) {
            console.error('Error al copiar:', error);
            mostrarNotificacion('error', 'Error al copiar el código');
        }
    };

    // Función para resetear contraseña
    const handleResetPassword = async () => {
        if (!localUsuario?.id) {
            mostrarNotificacion('error', 'ID del personal no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.resetPassword(localUsuario.id);

            if (response.success) {
                setIsResetPasswordOpen(false);
                mostrarNotificacion('success', 'Contraseña reseteada correctamente. El empleado deberá establecer una nueva contraseña.');
            } else {
                mostrarNotificacion('error', response.message || 'Error al resetear la contraseña');
            }
        } catch (error) {
            console.error('Error al resetear contraseña:', error);
            mostrarNotificacion('error', 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    // Función para abrir el mapa de ubicación
    const handleOpenMap = () => {
        setIsMapModalOpen(true);
    };

    // Función para manejar cuando se actualiza el personal (desde EditarAgregar)
    const handlePersonalUpdated = (updatedPersonal) => {
        // Actualizar el estado local con el personal actualizado
        setLocalUsuario(updatedPersonal);
        
        // Notificar al componente padre (Personal.jsx) para actualizar la lista
        // pero sin cerrar este modal
        if (onProveedorUpdated) {
            onProveedorUpdated(updatedPersonal);
        }
        
        // Cerrar solo el modal de editar
        setIsEditOpen(false);
        mostrarNotificacion('success', 'Personal actualizado correctamente');
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {localUsuario?.first_name} {localUsuario?.last_name}
                    <div className={styles.iconButton} >
                    </div>

                </h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato 
                        label="Código" 
                        value={localUsuario?.codigo || 'N/A'} 
                        icon='copy'
                        onClick={handleCopyCode}
                    />
                    <Dato label="Cargo" value={localUsuario?.cargo || 'N/A'} icon='briefcase' />
                    <Dato label="Estado" value={localUsuario?.is_active ? 'Activo' : 'Inactivo'} especial={localUsuario?.is_active ? 'green' : 'red'} />
                    <Dato label="Sucursal" value={localUsuario?.sucursal?.name || 'Sin sucursal asignada'} />
                    <Dato label="Rastreo" value={localUsuario?.rastrear ? 'Activado' : 'Desactivado'} especial={localUsuario?.rastrear ? 'green' : 'gray'} />
                </div>

                {/* Sección de ubicación - solo si tiene rastreo activado Y tiene coordenadas */}
                {localUsuario?.rastrear && localUsuario?.ubicacion && (
                    <>
                        <p className={styles.subTitle}>UBICACIÓN</p>
                        <div className={styles.content}>
                            <ItemLine 
                                icon="map-pin" 
                                title="Última Ubicación" 
                                onClick={handleOpenMap} 
                                arrow={true}
                                subtitle="Ver en mapa"
                            />
                        </div>
                    </>
                )}
                <p className={styles.subTitle}>CONFIGURACIÓN</p>
                {/* Botón para ver módulos - solo si tiene módulos */}
                {localUsuario?.modules && localUsuario.modules.length > 0 && (

                        <Boton
                            className='btn-gray'
                            label='Ver Módulos Asignados'
                            onClick={() => setIsModulesOpen(true)}
                        />

                )}

                {/* Botón para ver permisos - solo si tiene permisos */}
                {localUsuario?.permisos && (
                        <Boton
                            className='btn-gray'
                            label='Ver Detalles de Permisos'
                            onClick={() => setIsPermisosOpen(true)}
                        />

                )}
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Resetear Contraseña'
                        onClick={() => setIsResetPasswordOpen(true)}
                    />
                    <Boton
                        className='btn-gray'
                        label='Editar Persona'
                        onClick={() => setIsEditOpen(true)}
                    />
                    <Boton
                        className='btn-red'
                        label='Eliminar Persona'
                        onClick={() => setIsDeleteOpen(true)}
                    />
                </div>
            </div>

            {/* Modal de Editar*/}
            <EditarAgregar
                isOpen={isEditOpen}
                setIsOpen={setIsEditOpen}
                usuario={localUsuario}
                tipo='editar'
                onPersonalUpdated={handlePersonalUpdated}
                sucursales={sucursales}
            />

            {/* Modal de Eliminar*/}
            <ViewModal isOpen={isDeleteOpen} setIsOpen={setIsDeleteOpen}>
                <HeaderModal
                    title="Eliminar"
                    onClose={() => setIsDeleteOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Eliminar al personal {localUsuario?.first_name} {localUsuario?.last_name}? Esta acción es irreversible y puede afectar registros relacionados.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Si, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => handleEliminar(localUsuario?.id)}
                            loading={loading}
                            segundosDisabled={5}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsDeleteOpen(false)}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de Resetear Contraseña*/}
            <ViewModal isOpen={isResetPasswordOpen} setIsOpen={setIsResetPasswordOpen}>
                <HeaderModal
                    title="Resetear Contraseña"
                    onClose={() => setIsResetPasswordOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Resetear la contraseña del personal {localUsuario?.first_name} {localUsuario?.last_name}? Se borrará la contraseña actual y el empleado podrá establecer una nueva ingresando con su código.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsResetPasswordOpen(false)}
                        />
                        <Boton
                            className='btn-orange'
                            label='Si, restablecer'
                            style={{ marginTop: 'auto' }}
                            onClick={handleResetPassword}
                            loading={loading}
                        />
                        
                    </div>
                </div>
            </ViewModal>

            {/* Modal de Módulos */}
            <ViewModal isOpen={isModulesOpen} setIsOpen={setIsModulesOpen}>
                <HeaderModal
                    title="Módulos Asignados"
                    onClose={() => setIsModulesOpen(false)}
                />
                <div className={styles.modalContent}>
                    {localUsuario?.modules && localUsuario.modules.length > 0 ? (
                        <>
                            <p className={styles.subTitle}>MÓDULOS Y SUBMÓDULOS</p>
                            <div className={styles.content}>
                                {localUsuario.modules.map((module, index) => (
                                    <div key={module.id || index}>
                                        <Dato
                                            label={module.modulos?.name || 'Módulo'}
                                            value={module.name || 'Submódulo'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <NoData 
                            icon="grid-alt"
                            title="Sin módulos"
                            detail="Este usuario no tiene módulos asignados aún"
                            transparent={false}
                            minHeight="150px"
                        />
                    )}
                </div>
            </ViewModal>

            {/* Modal de Permisos */}
            <ViewModal isOpen={isPermisosOpen} setIsOpen={setIsPermisosOpen}>
                <HeaderModal
                    title="Detalles de Permisos"
                    onClose={() => setIsPermisosOpen(false)}
                />
                <div className={styles.modalContent}>
                    {localUsuario?.permisos ? (
                        <>
                            <p className={styles.subTitle}>PERMISOS DETALLADOS</p>
                            <div className={styles.content}>
                                <Dato
                                    label="Crear"
                                    value={localUsuario.permisos.crear ? 'Permitido' : 'No permitido'}
                                />
                                <Dato
                                    label="Editar"
                                    value={localUsuario.permisos.editar ? 'Permitido' : 'No permitido'}
                                />
                                <Dato
                                    label="Eliminar"
                                    value={localUsuario.permisos.eliminar ? 'Permitido' : 'No permitido'}
                                />
                                <Dato
                                    label="Anular"
                                    value={localUsuario.permisos.anular ? 'Permitido' : 'No permitido'}
                                />
                                <Dato
                                    label="Reemplazar"
                                    value={localUsuario.permisos.reemplazar ? 'Permitido' : 'No permitido'}
                                />
                            </div>
                        </>
                    ) : (
                        <NoData 
                            icon="shield"
                            title="Sin permisos"
                            detail="Este usuario no tiene permisos configurados aún"
                            transparent={false}
                            minHeight="150px"
                        />
                    )}
                </div>
            </ViewModal>

            {/* Modal de Mapa*/}
            <MapaModal
                isOpen={isMapModalOpen}
                setIsOpen={setIsMapModalOpen}
                initialLocation={localUsuario?.ubicacion}
                readOnly={true}
            />

            {/* Modal de Notificación*/}
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}
export default VerPersona;