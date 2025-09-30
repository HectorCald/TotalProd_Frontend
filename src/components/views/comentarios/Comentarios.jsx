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

    // Función para formatear tiempo relativo - VERSIÓN FINAL QUE FUNCIONA
    const formatearTiempo = (fecha) => {
        // Fecha actual
        const ahora = new Date();
        
        // Procesar fecha del backend
        let fechaComentario;
        if (typeof fecha === 'string' && fecha.includes(' ')) {
            // Formato: "2025-09-23 12:44:37.669365"
            // Quitar microsegundos y convertir a formato ISO
            const fechaLimpia = fecha.split('.')[0]; // "2025-09-23 12:44:37"
            const fechaISO = fechaLimpia.replace(' ', 'T'); // "2025-09-23T12:44:37"
            fechaComentario = new Date(fechaISO);
        } else {
            fechaComentario = new Date(fecha);
        }
        
        // Calcular diferencia en milisegundos
        const diferencia = ahora.getTime() - fechaComentario.getTime();
        const segundos = Math.floor(diferencia / 1000);
        
        // Mostrar el tiempo correcto
        if (segundos < 60) {
            return segundos <= 0 ? 'Ahora' : `hace ${segundos} seg`;
        } else if (segundos < 3600) {
            const minutos = Math.floor(segundos / 60);
            return `hace ${minutos} min`;
        } else if (segundos < 86400) {
            const horas = Math.floor(segundos / 3600);
            return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
        } else {
            const dias = Math.floor(segundos / 86400);
            return `hace ${dias} día${dias > 1 ? 's' : ''}`;
        }
    };

    // Función para obtener iniciales del nombre
    const obtenerIniciales = (nombre) => {
        if (!nombre) return '';
        
        const words = nombre.trim().split(' ').filter(word => word.length > 0);
        
        if (words.length === 1) {
            // Una palabra: primera letra
            return words[0].charAt(0).toUpperCase();
        } else if (words.length >= 2) {
            // Dos o más palabras: primera letra de las dos primeras palabras
            return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
        }
        
        return '';
    };

    // Función para generar color basado en la letra (para el fondo)
    const generateColor = (letter) => {
        const colors = {
            'A': '#E74C3C', 'B': '#3498DB', 'C': '#9B59B6', 'D': '#2ECC71',
            'E': '#F39C12', 'F': '#E67E22', 'G': '#1ABC9C', 'H': '#F1C40F',
            'I': '#8E44AD', 'J': '#2980B9', 'K': '#D35400', 'L': '#27AE60',
            'M': '#C0392B', 'N': '#34495E', 'O': '#E67E22', 'P': '#8E44AD',
            'Q': '#16A085', 'R': '#E74C3C', 'S': '#9B59B6', 'T': '#2ECC71',
            'U': '#F39C12', 'V': '#8E44AD', 'W': '#3498DB', 'X': '#E67E22',
            'Y': '#9B59B6', 'Z': '#16A085'
        };
        
        const upperLetter = letter.toUpperCase();
        return colors[upperLetter] || '#7F8C8D'; // Color por defecto más oscuro
    };

    // Función para generar color de las iniciales (mismo color que fondo pero más chillón)
    const generateInitialsColor = (letter) => {
        const baseColor = generateColor(letter);
        
        // Convertir hex a RGB
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Hacer el color más chillón (aumentar brillo y saturación)
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        // Aumentar el brillo (hacer más claro)
        const brightness = max / 255;
        const newBrightness = Math.min(1, brightness * 1.3); // 30% más brillante
        
        // Aumentar la saturación
        const delta = max - min;
        const saturation = delta === 0 ? 0 : delta / max;
        const newSaturation = Math.min(1, saturation * 1.5); // 50% más saturado
        
        // Aplicar brillo y saturación
        const newMax = Math.round(255 * newBrightness);
        const newR = Math.round(newMax - (newMax - r) * newSaturation);
        const newG = Math.round(newMax - (newMax - g) * newSaturation);
        const newB = Math.round(newMax - (newMax - b) * newSaturation);
        
        // Convertir de vuelta a hex
        const toHex = (n) => {
            const hex = Math.min(255, Math.max(0, n)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    };

    // Función para generar color más claro
    const generateLighterColor = (color) => {
        // Convertir hex a RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Retornar el mismo color pero con transparencia (0.3 = 30% opacidad)
        return `rgba(${r}, ${g}, ${b}, 0.3)`;
    };

    // Función para determinar el tipo de usuario
    const obtenerTipoUsuario = (comentario) => {
        return comentario.user_id ? 'Propietario' : 'Empleado';
    };

    // Función para verificar si el comentario es del usuario actual
    const esMiComentario = (comentario) => {
        if (!currentUser) return false;

        return comentario.user_id === currentUser.user_id || comentario.personal_id === currentUser.personal_id;
    };

    // Función para cargar comentarios (con parámetro para mostrar indicador)
    const cargarComentarios = async (mostrarIndicador = true) => {
        setIsLoadingComentarios(true);
        
        if (mostrarIndicador) {
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
        }
        
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
            
            if (mostrarIndicador) {
                // Mostrar "Actualizado" por 1 segundo solo si se muestra el indicador
                setTimeout(() => {
                    setIsRefreshing(false);
                    setTimeout(() => {
                        setShowRefreshIndicator(false);
                    }, 1000);
                }, 500);
            }
        }
    };

    // Función para manejar el envío de un nuevo comentario
    const handleEnviarComentario = async () => {
        if (!nuevoComentario.mensaje.trim()) {
            mostrarNotificacion('error', 'Por favor escribe un mensaje');
            return;
        }

        setIsEnviando(true);

        try {
            const comentarioData = {
                tipo: nuevoComentario.tipo,
                mensaje: nuevoComentario.mensaje.trim()
            };

            const response = await comentariosService.create(comentarioData);
            
            if (response.success) {
                // Limpiar formulario primero
                setNuevoComentario({
                    tipo: 'sugerencia',
                    mensaje: ''
                });

                // Luego recargar comentarios SIN mostrar indicador de refresh
                await cargarComentarios(false);

                mostrarNotificacion('success', 'Comentario enviado correctamente');
            } else {
                mostrarNotificacion('error', response.message || 'Error al enviar el comentario');
            }
        } catch (error) {
            mostrarNotificacion('error', 'Error al enviar el comentario');
        } finally {
            setIsEnviando(false);
        }
    };

    // Función para manejar el apoyo a un comentario
    const handleApoyo = async (comentarioId) => {
        try {
            const apoyoData = {
                comentario_id: comentarioId
            };

            const response = await comentariosService.createApoyo(apoyoData);
            
            if (response.success) {
                // Recargar comentarios para actualizar el conteo de apoyos SIN mostrar indicador
                await cargarComentarios(false);
                mostrarNotificacion('success', '¡Gracias por tu apoyo!');
            } else {
                mostrarNotificacion('error', response.message || 'Error al agregar apoyo');
            }
        } catch (error) {
            mostrarNotificacion('error', 'Error al agregar apoyo');
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
            isMainView={true}
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
                                            <div 
                                                className={styles.avatar}
                                                style={{ 
                                                    backgroundColor: generateLighterColor(generateColor(obtenerIniciales(comentario.user_name).charAt(0))),
                                                    color: generateInitialsColor(obtenerIniciales(comentario.user_name).charAt(0))
                                                }}
                                            >
                                                {obtenerIniciales(comentario.user_name)}
                                            </div>
                                        )}
                                        <div className={styles.userName}>
                                            {!esMio && (
                                                <div className={styles.userNameContainer}>
                                                    <p className={styles.userName}>{comentario.user_name}</p>
                                                    <span className={styles.userType}>({obtenerTipoUsuario(comentario)})</span>
                                                </div>
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