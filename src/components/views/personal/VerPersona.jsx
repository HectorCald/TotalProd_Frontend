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


function VerPersona({ isOpen, setIsOpen, usuario, onProveedorDeleted, onProveedorUpdated, sucursales = [] }) {

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
        if (!usuario.codigo) {
            mostrarNotificacion('error', 'No hay código para copiar');
            return;
        }

        try {
            await navigator.clipboard.writeText(usuario.codigo);
            mostrarNotificacion('success', 'Código copiado al portapapeles');
        } catch (error) {
            console.error('Error al copiar:', error);
            mostrarNotificacion('error', 'Error al copiar el código');
        }
    };

    // Función para resetear contraseña
    const handleResetPassword = async () => {
        if (!usuario.id) {
            mostrarNotificacion('error', 'ID del personal no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.resetPassword(usuario.id);

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


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {usuario?.first_name} {usuario?.last_name}
                    <div className={styles.iconButton} >
                    </div>

                </h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato 
                        label="Código" 
                        value={usuario?.codigo || 'N/A'} 
                        icon='copy'
                        onClick={handleCopyCode}
                    />
                    <Dato label="Estado" value={usuario?.is_active ? 'Activo' : 'Inactivo'} especial={usuario?.is_active ? 'green' : 'red'} />
                    <Dato label="Sucursal" value={usuario?.sucursal?.name || 'Sin sucursal asignada'} />
                </div>

                {/* Botón para ver módulos - solo si tiene módulos */}
                {usuario?.modules && usuario.modules.length > 0 && (

                        <Boton
                            className='btn-gray'
                            label='Ver Módulos Asignados'
                            onClick={() => setIsModulesOpen(true)}
                        />

                )}

                {/* Botón para ver permisos - solo si tiene permisos */}
                {usuario?.permisos && (
                        <Boton
                            className='btn-gray'
                            label='Ver Detalles de Permisos'
                            onClick={() => setIsPermisosOpen(true)}
                        />

                )}
                <div className={styles.buttons}>
                    <Boton
                        className='btn-orange'
                        label='Resetear Contraseña'
                        onClick={() => setIsResetPasswordOpen(true)}
                    />
                    <Boton
                        className='btn-red'
                        label='Eliminar Persona'
                        onClick={() => setIsDeleteOpen(true)}
                    />
                    <Boton
                        className='btn-default'
                        label='Editar Persona'
                        onClick={() => setIsEditOpen(true)}
                    />
                </div>
            </div>

            {/* Modal de Editar*/}
            <EditarAgregar
                isOpen={isEditOpen}
                setIsOpen={setIsEditOpen}
                usuario={usuario}
                tipo='editar'
                onPersonalUpdated={onProveedorUpdated}
                sucursales={sucursales}
            />

            {/* Modal de Eliminar*/}
            <ViewModal isOpen={isDeleteOpen} setIsOpen={setIsDeleteOpen}>
                <HeaderModal
                    title="Eliminar"
                    onClose={() => setIsDeleteOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Eliminar al personal {usuario?.first_name} {usuario?.last_name}? Esta acción es irreversible y puede afectar registros relacionados.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Si, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => handleEliminar(usuario?.id)}
                            loading={loading}
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
                    <p className={styles.subTitle}>¿Resetear la contraseña del personal {usuario?.first_name} {usuario?.last_name}? Se borrará la contraseña actual y el empleado podrá establecer una nueva ingresando con su código.</p>
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
                    {usuario?.modules && usuario.modules.length > 0 ? (
                        <>
                            <p className={styles.subTitle}>MÓDULOS Y SUBMÓDULOS</p>
                            <div className={styles.content}>
                                {usuario.modules.map((module, index) => (
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
                        <div className={styles.noData}>
                            <p>No hay módulos asignados</p>
                        </div>
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
                    {usuario?.permisos ? (
                        <>
                            <p className={styles.subTitle}>PERMISOS DETALLADOS</p>
                            <div className={styles.content}>
                                <Dato
                                    label="Crear"
                                    value={usuario.permisos.crear ? 'Permitido' : 'No permitido'}
                                />
                                <Dato
                                    label="Editar"
                                    value={usuario.permisos.editar ? 'Permitido' : 'No permitido'}
                                />
                                <Dato
                                    label="Eliminar"
                                    value={usuario.permisos.eliminar ? 'Permitido' : 'No permitido'}
                                />
                                <Dato
                                    label="Anular"
                                    value={usuario.permisos.anular ? 'Permitido' : 'No permitido'}
                                />
                                <Dato
                                    label="Reemplazar"
                                    value={usuario.permisos.reemplazar ? 'Permitido' : 'No permitido'}
                                />
                            </div>
                        </>
                    ) : (
                        <div className={styles.noData}>
                            <p>No hay permisos configurados</p>
                        </div>
                    )}
                </div>
            </ViewModal>


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