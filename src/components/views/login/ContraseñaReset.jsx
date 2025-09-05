import React, { useState, useEffect } from 'react';
import styles from './ContraseñaReset.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import InputNormal from '../../common/InputNormal';
import Boton from '../../common/Boton';
import MensajeError from '../../common/MensajeError';
import UserService from '../../../services/userService';
import InputCodigo from '../../common/InputCodigo';
import Notification from '../../common/Notification';


function ContraseñaReset({ isOpen, setIsOpen }) {
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isOpenCodigo, setIsOpenCodigo] = useState(false);
    const [codigo, setCodigo] = useState('');
    const [isOpenNuevaContraseña, setIsOpenNuevaContraseña] = useState(false);
    const [nuevaContraseña, setNuevaContraseña] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estados para validación de botones
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isCodigoValid, setIsCodigoValid] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    // Estado para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 5000);
    };
    useEffect(() => {
        setEmail('');
        setCodigo('');
        setNuevaContraseña('');
        setIsEmailValid(false);
        setIsCodigoValid(false);
        setIsPasswordValid(false);
    }, [isOpen]);

    // Validación de email en tiempo real
    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsEmailValid(email.trim() !== '' && email.includes('@') && email.includes('.com') && emailRegex.test(email));
    }, [email]);

    // Validación de código en tiempo real
    useEffect(() => {
        setIsCodigoValid(codigo.length === 6);
    }, [codigo]);

    // Validación de contraseña en tiempo real
    useEffect(() => {
        setIsPasswordValid(nuevaContraseña.length >= 1);
    }, [nuevaContraseña]);

    // Reset de contraseña
    const handleResetPassword = async () => {
        if (!email.trim()) {
            setErrorMessage('Ingresa tu correo electrónico');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
            return;
        }
        if (!email.includes('@') || !email.includes('.com')) {
            setErrorMessage('El correo electrónico no es válido');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
            return;
        }

        try {
            setLoading(true);
            const result = await UserService.requestPasswordReset(email);
            if (result.success) {
                // Si el email se envió correctamente, no necesitamos guardar el token
                // El usuario lo recibirá por email
                if (result.data.token) {
                    // Fallback: si el email falló, guardar el token
                    localStorage.setItem('resetToken', result.data.token);
                    mostrarNotificacion('success', 'Código enviado exitosamente. Revisa la consola del backend para ver el código.');
                } else {
                    // Email enviado correctamente
                    mostrarNotificacion('success', 'Código de verificación enviado a tu email. Revisa tu bandeja de entrada.');
                }
                setIsOpenCodigo(true);
            } else {
                setErrorMessage(result.message || 'Error al enviar código');
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error al solicitar reset:', error);
            setErrorMessage('Error al solicitar reset de contraseña');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
        } finally {
            setLoading(false);
        }
    }

    // Verificar código
    const handleVerificarCodigo = async () => {
        if (!codigo.trim()) {
            setErrorMessage('Ingresa el código de verificación');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
            return;
        }

        try {
            setLoading(true);
            const result = await UserService.verifyResetToken(codigo);
            if (result.success) {
                // Guardar el token verificado para usarlo en el cambio de contraseña
                if (result.data && result.data.token) {
                    localStorage.setItem('resetToken', result.data.token);
                } else {
                    console.log('❌ No se recibió token del backend'); // Debug
                }
                setIsOpenNuevaContraseña(true);
                mostrarNotificacion('success', 'Código verificado exitosamente. Ahora puedes cambiar tu contraseña.');
            } else {
                setErrorMessage(result.message || 'Código inválido');
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error al verificar código:', error);
            setErrorMessage('Error al verificar código');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
        } finally {
            setLoading(false);
        }
    }

    // Función para manejar cuando se completa el código
    const handleCodigoCompleto = (codigoCompleto) => {
        setCodigo(codigoCompleto);
        // Verificar automáticamente cuando se complete
        //handleVerificarCodigo();
    };

    const handleRestablecerContraseña = async () => {
        if (!nuevaContraseña.trim()) {
            setErrorMessage('Ingresa la nueva contraseña');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
            return;
        }
        if (nuevaContraseña.length < 8) {
            setErrorMessage('La contraseña debe tener al menos 8 caracteres');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('resetToken');
            if (!token) {
                setErrorMessage('Token no encontrado');
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
                return;
            }

            const result = await UserService.resetPassword(token, nuevaContraseña);
            if (result.success) {
                mostrarNotificacion('success', 'Contraseña restablecida exitosamente')
                // Limpiar formularios
                setEmail('');
                setCodigo('');
                setNuevaContraseña('');
                // Limpiar token y cerrar modal
                localStorage.removeItem('resetToken');
                setTimeout(() => {
                    setIsOpen(false);
                    setIsOpenCodigo(false);
                    setIsOpenNuevaContraseña(false);
                }, 3000);
            } else {
                setErrorMessage(result.message || 'Error al restablecer contraseña');
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            setErrorMessage('Error al restablecer contraseña');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
        } finally {
            setLoading(false);
        }
    }
    return (
        <ViewModal ViewModal isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderModal
                title="Olvidaste tu contraseña?"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <h1 className={styles.subTitle}>Ingresa tu correo electrónico y te enviaremos un código de verificación para restablecer tu contraseña.</h1>
                <div>
                    <MensajeError mensaje={errorMessage} />
                </div>
                <InputNormal
                    tipo="text"
                    icon="envelope"
                    value={email}
                    placeholder="Correo electrónico"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <div></div>
                <Boton
                    className='btn-original'
                    label="Enviar código"
                    onClick={handleResetPassword}
                    loading={loading}
                    disabled={!isEmailValid || loading}
                />
            </div>



            <ViewModal ViewModal isOpen={isOpenCodigo} setIsOpen={setIsOpenCodigo} >
                <HeaderModal
                    title="Verificación de código"
                    onClose={() => setIsOpenCodigo(false)}
                />
                <div className={styles.modalContent}>
                    <h1 className={styles.subTitle}>Ingresa el código de verificación que te enviamos a tu correo electrónico.</h1>
                    <div>
                        <MensajeError mensaje={errorMessage} />
                    </div>
                    <InputCodigo
                        cantidad={6}
                        value={codigo}
                        onChange={setCodigo}
                        onComplete={handleCodigoCompleto}
                        disabled={loading}
                    />
                    <div></div>
                    <Boton
                        className='btn-original'
                        label="Verificar"
                        onClick={handleVerificarCodigo}
                        loading={loading}
                        disabled={!isCodigoValid || loading}
                    />
                </div>
            </ViewModal >
            <ViewModal ViewModal isOpen={isOpenNuevaContraseña} setIsOpen={setIsOpenNuevaContraseña} >
                <HeaderModal
                    title="Restablecer contraseña"
                    onClose={() => setIsOpenNuevaContraseña(false)}
                />
                <div className={styles.modalContent}>
                    <h1 className={styles.subTitle}>Ingresa tu nueva contraseña.</h1>
                    <div>
                        <MensajeError mensaje={errorMessage} />
                    </div>
                    <InputNormal
                        tipo="password"
                        icon="lock"
                        value={nuevaContraseña}
                        placeholder="Nueva contraseña"
                        onChange={(e) => setNuevaContraseña(e.target.value)}
                    />
                    <div></div>
                    <Boton
                        className='btn-original'
                        label="Restablecer contraseña"
                        onClick={handleRestablecerContraseña}
                        loading={loading}
                        disabled={!isPasswordValid || loading}
                    />
                </div>
            </ViewModal >
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </ViewModal >
    );
}
export default ContraseñaReset;