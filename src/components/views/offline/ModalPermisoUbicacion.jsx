import React, { useState, useEffect, useMemo } from 'react';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import Text from '../../common/Text';
import ListaProfesional from '../../common/ListaProfesional';
import styles from '../../../styles/view.module.css';

const ModalPermisoUbicacion = ({ isOpen, setIsOpen }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [permisoDenegado, setPermisoDenegado] = useState(false);

    // Verificar cambios en el permiso de ubicación
    useEffect(() => {
        if (!isOpen) return;

        const verificarPermiso = async () => {
            try {
                if ('permissions' in navigator) {
                    try {
                        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                        
                        const checkPermission = () => {
                            if (permissionStatus.state === 'granted') {
                                setIsOpen(false);
                                setPermisoDenegado(false);
                            } else if (permissionStatus.state === 'denied') {
                                setPermisoDenegado(true);
                            } else {
                                setPermisoDenegado(false);
                            }
                        };

                        // Verificar estado inicial
                        checkPermission();

                        // Escuchar cambios
                        permissionStatus.onchange = checkPermission;
                    } catch (error) {
                        // Si falla la API de permissions, verificar directamente
                        verificarPermisoDirecto();
                    }
                } else {
                    verificarPermisoDirecto();
                }
            } catch (error) {
                console.error('Error al verificar permiso:', error);
            }
        };

        const verificarPermisoDirecto = () => {
            if (!navigator.geolocation) return;

            navigator.geolocation.getCurrentPosition(
                () => {
                    // Permiso concedido
                    setIsOpen(false);
                    setPermisoDenegado(false);
                },
                (error) => {
                    // Verificar si fue denegado
                    if (error.code === error.PERMISSION_DENIED) {
                        setPermisoDenegado(true);
                    } else {
                        setPermisoDenegado(false);
                    }
                },
                {
                    enableHighAccuracy: false,
                    timeout: 2000,
                    maximumAge: 0
                }
            );
        };

        // Verificar periódicamente (cada 2 segundos)
        const intervalId = setInterval(() => {
            verificarPermiso();
        }, 2000);

        // Verificar inmediatamente
        verificarPermiso();

        return () => {
            clearInterval(intervalId);
        };
    }, [isOpen, setIsOpen]);

    const handleSolicitarPermiso = async () => {
        setIsLoading(true);
        try {
            // Intentar revocar el permiso primero si está disponible (para resetear el estado)
            // Nota: Esto no funciona en todos los navegadores por seguridad
            if ('permissions' in navigator && navigator.permissions.revoke) {
                try {
                    await navigator.permissions.revoke({ name: 'geolocation' });
                } catch (revokeError) {
                    // Ignorar error de revoke, no es crítico
                    console.log('No se pudo revocar permiso (normal en algunos navegadores):', revokeError);
                }
            }

            // Intentar obtener la ubicación para solicitar el permiso
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        // Permiso concedido, cerrar el modal
                        setIsLoading(false);
                        setIsOpen(false);
                        setPermisoDenegado(false);
                    },
                    (error) => {
                        // Error al obtener ubicación
                        setIsLoading(false);
                        if (error.code === error.PERMISSION_DENIED) {
                            setPermisoDenegado(true);
                        }
                        console.error('Error al obtener ubicación:', error);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            } else {
                setIsLoading(false);
                console.error('Geolocalización no está disponible en este navegador');
            }
        } catch (error) {
            setIsLoading(false);
            console.error('Error al solicitar permiso:', error);
        }
    };

    const razonesPermiso = useMemo(() => [
        {
            label: 'Soporte técnico',
            children: [
                'Permite detectar zonas con mala conectividad donde la app puede fallar.',
                'Ayuda a mejorar el rendimiento y evitar pérdidas de información.'
            ]
        },
        {
            label: 'Optimización de rutas y zonas de venta',
            children: [
                'Permite analizar qué zonas funcionan mejor.',
                'Ayuda a asignar mejores áreas de trabajo y horarios.'
            ]
        },
        {
            label: 'Seguridad del vendedor',
            children: [
                'En caso de incidentes, la empresa puede saber desde dónde se realizó una venta.',
                'Esto es muy usado en equipos comerciales y de reparto.'
            ]
        }
    ], []);

    return (
        <ViewModal isOpen={isOpen} setIsOpen={() => {}} closed={true}>
            <HeaderModal
                title="Permiso de ubicación requerido"
                onClose={() => {}}
                closed={true}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    Esta aplicación necesita acceso a tu ubicación para funcionar correctamente.
                </p>

                <ListaProfesional title="¿Por qué es obligatorio?" items={razonesPermiso} />

                {permisoDenegado ? (
                    <div style={{ 
                        backgroundColor: 'var(--warning-bg, rgba(255, 152, 0, 0.1))', 
                        border: '1px solid var(--warning-color, #ff9800)', 
                        borderRadius: '8px', 
                        padding: '15px', 
                        marginTop: '20px',
                        marginBottom: '20px' 
                    }}>
                        <p style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            marginBottom: '10px',
                            color: 'var(--warning-color, #ff9800)'
                        }}>
                            Permiso denegado previamente
                        </p>
                        <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                            Para activar el permiso de ubicación, ve a:
                        </p>
                        <p style={{ 
                            fontSize: '13px', 
                            fontWeight: 600, 
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: 'var(--tertiary-color)',
                            borderRadius: '4px',
                            fontFamily: 'monospace'
                        }}>
                            Configuraciones → Aplicaciones → TotalProd → Permisos → Ubicación
                        </p>
                    </div>
                ) : (
                    <p className={styles.subTitle} style={{ marginTop: '15px', fontSize: '14px', opacity: 0.8 }}>
                        Por favor, permite el acceso a tu ubicación cuando se te solicite.
                    </p>
                )}

                <Text type="warning" align="left" style={{ marginTop: '20px', marginBottom: '20px' }}>
                    Debe conceder el permiso de ubicación para continuar
                </Text>

                <div className={styles.buttons}>
                    <Boton
                        className='btn-blue'
                        label={permisoDenegado ? 'Intentar nuevamente' : 'Conceder permiso'}
                        onClick={handleSolicitarPermiso}
                        loading={isLoading}
                        disabled={isLoading}
                    />
                </div>
            </div>
        </ViewModal>
    );
};

export default ModalPermisoUbicacion;

