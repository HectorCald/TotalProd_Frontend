import React, { useState, useEffect } from 'react';
import styles from './Comentarios.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';
import Select from '../../common/Select';
import comentariosService from '../../../services/comentariosService';

function Comentarios({ isOpen, setIsOpen }) {

    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Estados para el formulario de nuevo comentario
    const [nuevoComentario, setNuevoComentario] = useState({
        tipo: 'sugerencia',
        mensaje: ''
    });
    const [isEnviando, setIsEnviando] = useState(false);

    // Estado para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });

    // Estado para los comentarios
    const [comentarios, setComentarios] = useState([]);
    const [isLoadingComentarios, setIsLoadingComentarios] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [comentariosHoy, setComentariosHoy] = useState(0);

    // Opciones para el select de tipo
    const opcionesTipo = [
        { value: 'error', label: 'Error', icon: 'error' },
        { value: 'sugerencia', label: 'Sugerencia', icon: 'bulb' },
        { value: 'felicitacion', label: 'Felicitación', icon: 'party' },
        { value: 'ayuda', label: 'Ayuda', icon: 'help-circle' }
    ];

    // Función para mostrar notificaciones
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

    // Función para formatear tiempo relativo
    const formatearTiempo = (fecha) => {
        const ahora = new Date();

        // Convertir el formato de PostgreSQL a formato ISO que JavaScript entiende
        // 2025-09-22 23:12:43.155751 -> 2025-09-22T23:12:43.155751Z
        let fechaComentario;
        if (typeof fecha === 'string' && fecha.includes(' ')) {
            // Reemplazar el espacio con T y agregar Z al final para UTC
            const fechaISO = fecha.replace(' ', 'T') + 'Z';
            fechaComentario = new Date(fechaISO);
        } else {
            fechaComentario = new Date(fecha);
        }

        // Calcular diferencia en milisegundos
        const diffMs = ahora - fechaComentario;

        // Si la diferencia es negativa (fecha en el futuro), ajustar por zona horaria
        let diffMsFinal = diffMs;
        if (diffMs < 0) {
            // Si es negativa, probablemente es un problema de zona horaria
            // Ajustar restando 4 horas (diferencia entre UTC y Bolivia GMT-4)
            diffMsFinal = diffMs + (4 * 60 * 60 * 1000); // +4 horas en milisegundos
        }

        const diffDias = Math.floor(diffMsFinal / (1000 * 60 * 60 * 24));
        const diffHoras = Math.floor(diffMsFinal / (1000 * 60 * 60));
        const diffMinutos = Math.floor(diffMsFinal / (1000 * 60));

        if (diffDias > 0) {
            return `hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
        } else if (diffHoras > 0) {
            return `hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
        } else if (diffMinutos > 0) {
            return `hace ${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''}`;
        } else {
            return 'Ahora';
        }
    };

    // Función para obtener iniciales del nombre
    const obtenerIniciales = (nombre) => {
        return nombre.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    // Función para verificar si el comentario es del usuario actual
    const esMiComentario = (comentario) => {
        if (!currentUser) return false;

        return comentario.user_id === currentUser.user_id || comentario.personal_id === currentUser.personal_id;
    };

    // Función para cargar comentarios
    const cargarComentarios = async () => {
        setIsLoadingComentarios(true);
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        
        try {
            const response = await comentariosService.getAll();
            if (response.success) {
                setComentarios(response.data);
                setCurrentUser(response.currentUser);
                
                // Contar comentarios del usuario actual hoy
                if (response.currentUser) {
                    const misComentariosHoy = response.data.filter(comentario => {
                        return comentario.user_id === response.currentUser.user_id || 
                               comentario.personal_id === response.currentUser.personal_id;
                    }).length;
                    setComentariosHoy(misComentariosHoy);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al cargar comentarios');
            }
        } catch (error) {
            mostrarNotificacion('error', 'Error al cargar comentarios');
        } finally {
            setIsLoadingComentarios(false);
            // Mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    };

    // Función para manejar el envío de un nuevo comentario
    const handleEnviarComentario = async () => {
        if (!nuevoComentario.mensaje.trim()) {
            mostrarNotificacion('error', 'Por favor escribe un mensaje');
            return;
        }

        setIsEnviando(true);
        setShowRefreshIndicator(true);
        setIsRefreshing(true);

        try {
            const comentarioData = {
                tipo: nuevoComentario.tipo,
                mensaje: nuevoComentario.mensaje.trim()
            };

            const response = await comentariosService.create(comentarioData);
            
            if (response.success) {
                // Recargar comentarios para mostrar el nuevo
                await cargarComentarios();
                
                // Limpiar formulario
                setNuevoComentario({
                    tipo: 'sugerencia',
                    mensaje: ''
                });

                mostrarNotificacion('success', 'Comentario enviado correctamente');
            } else {
                mostrarNotificacion('error', response.message || 'Error al enviar el comentario');
                // Ocultar indicador si hay error
                setTimeout(() => {
                    setIsRefreshing(false);
                    setTimeout(() => {
                        setShowRefreshIndicator(false);
                    }, 1000);
                }, 500);
            }
        } catch (error) {
            mostrarNotificacion('error', 'Error al enviar el comentario');
            // Ocultar indicador si hay error
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        } finally {
            setIsEnviando(false);
        }
    };

    // Función para manejar el apoyo a un comentario
    const handleApoyo = async (comentarioId) => {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        
        try {
            const apoyoData = {
                comentario_id: comentarioId
            };

            const response = await comentariosService.createApoyo(apoyoData);
            
            if (response.success) {
                // Recargar comentarios para actualizar el conteo de apoyos
                await cargarComentarios();
                mostrarNotificacion('success', '¡Gracias por tu apoyo!');
            } else {
                mostrarNotificacion('error', response.message || 'Error al agregar apoyo');
                // Ocultar indicador si hay error
                setTimeout(() => {
                    setIsRefreshing(false);
                    setTimeout(() => {
                        setShowRefreshIndicator(false);
                    }, 1000);
                }, 500);
            }
        } catch (error) {
            mostrarNotificacion('error', 'Error al agregar apoyo');
            // Ocultar indicador si hay error
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    };

    // Cargar comentarios cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            cargarComentarios();
        }
    }, [isOpen]);


    return (
        <View
            isOpen={isOpen}
            setIsOpen={setIsOpen}
        >
            <HeaderView onBack={() => setIsOpen(false)} title='Comentarios' />
            <div className={styles.container}>

                <RefreshIndicator
                    isVisible={showRefreshIndicator}
                    isLoading={isRefreshing}
                />

                <div className={styles.content}>
                    {/* Lista de comentarios */}
                    {comentarios.length > 0 ? (
                        comentarios.map((comentario) => {
                            const esMio = esMiComentario(comentario);

                            return (
                                <div key={comentario.id} className={`${styles.comentarioItem} ${esMio ? styles.miComentario : ''}`}>
                                    <div className={styles.userInfo}>
                                        {!esMio && (
                                            <div className={styles.avatar}>
                                                {obtenerIniciales(comentario.user_name)}
                                            </div>
                                        )}
                                        <div className={styles.userName}>
                                            {!esMio && (

                                                <p className={styles.userName}>{comentario.user_name}</p>

                                            )}

                                            {/* Card del comentario */}
                                            <div className={`${styles.comentarioCard} ${styles[comentario.tipo]}`}>
                                                <div className={styles.tipoLabel} >
                                                    <p className={styles[comentario.tipo]}>{opcionesTipo.find(t => t.value === comentario.tipo)?.label}</p>
                                                    <button
                                                        className={`${styles.apoyoButton} ${styles[comentario.tipo]} ${esMio ? styles.apoyoDisabled : ''}`}
                                                        onClick={() => handleApoyo(comentario.id)}
                                                        disabled={esMio}
                                                        title={esMio ? 'No puedes apoyar tu propio comentario' : ''}
                                                    >
                                                        <BoxIcon
                                                            name={comentario.tipo === 'error' ? 'user' : 'user'}
                                                            className={styles.icon}
                                                        />
                                                        {comentario.apoyos}
                                                    </button>
                                                </div>

                                                <div className={styles.mensaje}>
                                                    {comentario.mensaje}
                                                </div>
                                            </div>
                                            <p className={styles.timestamp}>{formatearTiempo(comentario.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className={styles.noData}>
                            <BoxIcon name='message-dots' className={styles.noDataIcon} />
                            <p className={styles.noDataTitle}>No hay comentarios aún</p>
                            <p className={styles.noDataDescription}>Sé el primero en compartir tu opinión</p>
                        </div>
                    )}


                    {/* Formulario de nuevo comentario */}
                    <div className={styles.nuevoComentarioForm}>
                        <div className={styles.comentariosInfo}>
                            <span className={styles.comentariosCounter}>
                                Comentarios hoy: {comentariosHoy}/10
                            </span>
                            {comentariosHoy >= 10 && (
                                <span className={styles.limiteAlcanzado}>
                                    Límite diario alcanzado
                                </span>
                            )}
                        </div>

                        <div className={styles.mensajeInputContainer}>
                            <Select
                                placeholder="Selecciona el tipo de comentario"
                                options={opcionesTipo}
                                value={nuevoComentario.tipo}
                                onChange={(valor) => setNuevoComentario(prev => ({
                                    ...prev,
                                    tipo: valor
                                }))}
                                iconOnly={true}
                                icon='category'
                            />
                            <textarea
                                className={styles.mensajeInput}
                                placeholder={comentariosHoy >= 10 ? "Límite diario alcanzado" : "Escribe tu comentario..."}
                                value={nuevoComentario.mensaje}
                                onChange={(e) => {
                                    setNuevoComentario(prev => ({
                                        ...prev,
                                        mensaje: e.target.value
                                    }));
                                    // Auto-resize textarea
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                }}
                                rows={2}
                                disabled={comentariosHoy >= 10}
                            />

                            <button
                                className={styles.enviarButton}
                                onClick={handleEnviarComentario}
                                disabled={isEnviando || !nuevoComentario.mensaje.trim() || comentariosHoy >= 10}
                            >
                                {isEnviando ? (
                                    <>
                                        <BoxIcon name='loader-alt' />

                                    </>
                                ) : (
                                    <>
                                        <BoxIcon name='send' />

                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default Comentarios;