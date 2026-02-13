import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Input from '../../common/inputs/Input';
import Boton from '../../common/Boton';
import UserService from '../../../services/userService';
import { useToast } from '../../../context/ToastContext';

function ContraseñaReset({ isOpen, setIsOpen }) {
    const { showSuccess, showDanger } = useToast();
    const [email, setEmail] = useState('');
    const [errorEmail, setErrorEmail] = useState('');
    const [isOpenCodigo, setIsOpenCodigo] = useState(false);
    const [codigo, setCodigo] = useState('');
    const [errorCodigo, setErrorCodigo] = useState('');
    const [isOpenNuevaContraseña, setIsOpenNuevaContraseña] = useState(false);
    const [nuevaContraseña, setNuevaContraseña] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setEmail('');
        setCodigo('');
        setNuevaContraseña('');
        setErrorEmail('');
        setErrorCodigo('');
        setErrorPassword('');
    }, [isOpen]);

    const handleResetPassword = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            setErrorEmail('Ingresa tu correo electrónico');
            showDanger('Error', 'Ingresa tu correo electrónico.', 5000, false);
            return;
        }
        if (!emailRegex.test(email)) {
            setErrorEmail('El correo electrónico no es válido');
            showDanger('Error', 'El correo electrónico no es válido.', 5000, false);
            return;
        }
        setErrorEmail('');
        try {
            setLoading(true);
            const result = await UserService.requestPasswordReset(email);
            if (result.success) {
                if (result.data?.token) {
                    localStorage.setItem('resetToken', result.data.token);
                    showSuccess('Éxito', 'Código enviado. Revisa la consola del backend si no recibes el email.');
                } else {
                    showSuccess('Éxito', 'Código de verificación enviado a tu email. Revisa tu bandeja de entrada.');
                }
                setIsOpenCodigo(true);
            } else {
                const msg = result.message || 'Error al enviar código';
                setErrorEmail(msg);
                showDanger('Error', msg, 5000, false);
            }
        } catch (error) {
            console.error('Error al solicitar reset:', error);
            showDanger('Error', 'Error al solicitar reset de contraseña.', 5000, false);
        } finally {
            setLoading(false);
        }
    };

    const handleVerificarCodigo = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!codigo.trim()) {
            setErrorCodigo('Ingresa el código de verificación');
            showDanger('Error', 'Ingresa el código de verificación.', 5000, false);
            return;
        }
        if (codigo.length !== 6) {
            setErrorCodigo('El código debe tener 6 dígitos');
            showDanger('Error', 'El código debe tener 6 dígitos.', 5000, false);
            return;
        }
        setErrorCodigo('');
        try {
            setLoading(true);
            const result = await UserService.verifyResetToken(codigo);
            if (result.success) {
                if (result.data?.token) {
                    localStorage.setItem('resetToken', result.data.token);
                }
                showSuccess('Éxito', 'Código verificado. Ahora puedes cambiar tu contraseña.');
                setIsOpenNuevaContraseña(true);
            } else {
                const msg = result.message || 'Código inválido';
                setErrorCodigo(msg);
                showDanger('Error', msg, 5000, false);
            }
        } catch (error) {
            console.error('Error al verificar código:', error);
            showDanger('Error', 'Error al verificar código.', 5000, false);
        } finally {
            setLoading(false);
        }
    };

    const handleRestablecerContraseña = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!nuevaContraseña.trim()) {
            setErrorPassword('Ingresa la nueva contraseña');
            showDanger('Error', 'Ingresa la nueva contraseña.', 5000, false);
            return;
        }
        if (nuevaContraseña.length < 8) {
            setErrorPassword('La contraseña debe tener al menos 8 caracteres');
            showDanger('Error', 'La contraseña debe tener al menos 8 caracteres.', 5000, false);
            return;
        }
        setErrorPassword('');
        const token = localStorage.getItem('resetToken');
        if (!token) {
            showDanger('Error', 'Sesión de restablecimiento expirada. Solicita un nuevo código.', 5000, false);
            return;
        }
        try {
            setLoading(true);
            const result = await UserService.resetPassword(token, nuevaContraseña);
            if (result.success) {
                showSuccess('Éxito', 'Contraseña restablecida exitosamente.');
                setEmail('');
                setCodigo('');
                setNuevaContraseña('');
                localStorage.removeItem('resetToken');
                setTimeout(() => {
                    setIsOpen(false);
                    setIsOpenCodigo(false);
                    setIsOpenNuevaContraseña(false);
                }, 2000);
            } else {
                const msg = result.message || 'Error al restablecer contraseña';
                setErrorPassword(msg);
                showDanger('Error', msg, 5000, false);
            }
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            showDanger('Error', 'Error al restablecer contraseña.', 5000, false);
        } finally {
            setLoading(false);
        }
    };
    return (
        <ViewModal ViewModal isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderModal
                title="Olvidaste tu contraseña?"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <h1 className={styles.subTitle}>Ingresa tu correo electrónico y te enviaremos un código de verificación para restablecer tu contraseña.</h1>
                <form onSubmit={handleResetPassword}>
                    <Input
                        type="email"
                        label="Correo electrónico"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setErrorEmail('');
                        }}
                        readOnly={loading}
                        required
                        error={errorEmail || undefined}
                        onClearError={() => setErrorEmail('')}
                    />
                    <div className={styles.space}></div>
                    <div className={styles.buttons}>
                    <Boton type="submit" className="btn-original" label="Enviar código" loading={loading} />
                    </div>
                </form>
            </div>



            <ViewModal ViewModal isOpen={isOpenCodigo} setIsOpen={setIsOpenCodigo} >
                <HeaderModal
                    title="Verificación de código"
                    onClose={() => setIsOpenCodigo(false)}
                />
                <div className={styles.modalContent}>
                    <h1 className={styles.subTitle}>Ingresa el código de verificación que te enviamos a tu correo electrónico.</h1>
                    <form onSubmit={handleVerificarCodigo}>
                        <Input
                            type="text"
                            label="Código de verificación (6 dígitos)"
                            value={codigo}
                            onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setCodigo(v);
                                setErrorCodigo('');
                            }}
                            placeholder="000000"
                            maxLength={6}
                            inputMode="numeric"
                            readOnly={loading}
                            required
                            error={errorCodigo || undefined}
                            onClearError={() => setErrorCodigo('')}
                        />
                        <div className={styles.space}></div>
                        <div className={styles.buttons}>
                        <Boton type="submit" className="btn-original" label="Verificar" loading={loading} />
                        </div>
                    </form>
                </div>
            </ViewModal >
            <ViewModal ViewModal isOpen={isOpenNuevaContraseña} setIsOpen={setIsOpenNuevaContraseña} >
                <HeaderModal
                    title="Restablecer contraseña"
                    onClose={() => setIsOpenNuevaContraseña(false)}
                />
                <div className={styles.modalContent}>
                    <h1 className={styles.subTitle}>Ingresa tu nueva contraseña.</h1>
                    <form onSubmit={handleRestablecerContraseña}>
                        <Input
                            type="password"
                            label="Nueva contraseña"
                            value={nuevaContraseña}
                            onChange={(e) => {
                                setNuevaContraseña(e.target.value);
                                setErrorPassword('');
                            }}
                            readOnly={loading}
                            required
                            error={errorPassword || undefined}
                            onClearError={() => setErrorPassword('')}
                        />
                        <div className={styles.space}></div>
                        <div className={styles.buttons}>
                        <Boton type="submit" className="btn-original" label="Restablecer contraseña" loading={loading} />
                        </div>
                    </form>
                </div>
            </ViewModal>
        </ViewModal>
    );
}
export default ContraseñaReset;