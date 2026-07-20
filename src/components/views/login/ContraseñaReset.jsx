import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ModalCentro from '../../common/modals/ModalCentro';
import Input from '../../common/inputs/Input';
import Boton from '../../common/botones/Boton';
import Mensaje from '../../common/outputs/Mensaje';
import UserService from '../../../services/userService';

function ContraseñaReset({ isOpen, setIsOpen }) {
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
            setErrorEmail('Ingresa tu correo electrónico.');
            return;
        }
        if (!emailRegex.test(email)) {
            setErrorEmail('El correo electrónico no es válido.');
            return;
        }
        setErrorEmail('');
        try {
            setLoading(true);
            const result = await UserService.requestPasswordReset(email);
            if (result.success) {
                if (result.data?.token) {
                    localStorage.setItem('resetToken', result.data.token);
                }
                setIsOpen(false);
                setIsOpenCodigo(true);
            } else {
                setErrorEmail(result.message || 'Error al enviar código.');
            }
        } catch (error) {
            console.error('Error al solicitar reset:', error);
            setErrorEmail('Error al solicitar reset de contraseña.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerificarCodigo = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!codigo.trim()) {
            setErrorCodigo('Ingresa el código de verificación.');
            return;
        }
        if (codigo.length !== 6) {
            setErrorCodigo('El código debe tener 6 dígitos.');
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
                setIsOpenCodigo(false);
                setIsOpenNuevaContraseña(true);
            } else {
                setErrorCodigo(result.message || 'Código inválido.');
            }
        } catch (error) {
            console.error('Error al verificar código:', error);
            setErrorCodigo('Error al verificar código.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestablecerContraseña = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!nuevaContraseña.trim()) {
            setErrorPassword('Ingresa la nueva contraseña.');
            return;
        }
        if (nuevaContraseña.length < 8) {
            setErrorPassword('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        setErrorPassword('');
        const token = localStorage.getItem('resetToken');
        if (!token) {
            setErrorPassword('Sesión de restablecimiento expirada. Solicita un nuevo código.');
            return;
        }
        try {
            setLoading(true);
            const result = await UserService.resetPassword(token, nuevaContraseña);
            if (result.success) {
                setEmail('');
                setCodigo('');
                setNuevaContraseña('');
                localStorage.removeItem('resetToken');
                setIsOpenNuevaContraseña(false);
            } else {
                setErrorPassword(result.message || 'Error al restablecer contraseña.');
            }
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            setErrorPassword('Error al restablecer contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ModalCentro
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="¿Olvidaste tu contraseña?"
                confirmText="Enviar código"
                onConfirm={handleResetPassword}
                loading={loading}
                disableClose={loading}
                contentStyle={{ paddingBlock: 0 }}
            >
                <div style={{ padding: '0' }}>
                    <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                        Ingresa tu correo electrónico y te enviaremos un código de verificación para restablecer tu contraseña.
                    </p>
                    {errorEmail && <Mensaje type="error" message={errorEmail} onClose={() => setErrorEmail('')} />}

                    <Input
                        type="email"
                        label="Correo electrónico"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (errorEmail) setErrorEmail('');
                        }}
                        readOnly={loading}
                        required
                    />

                </div>
            </ModalCentro>

            <ModalCentro
                isOpen={isOpenCodigo}
                onClose={() => setIsOpenCodigo(false)}
                title="Verificación de código"
                confirmText="Verificar"
                onConfirm={handleVerificarCodigo}
                loading={loading}
                disableClose={loading}
                contentStyle={{ paddingBlock: 0 }}
            >
                <div style={{ padding: '0 10px 10px 10px' }}>
                    <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                        Ingresa el código de verificación que te enviamos a tu correo electrónico.
                    </p>
                    {errorCodigo && <Mensaje type="error" message={errorCodigo} onClose={() => setErrorCodigo('')} />}
                    <div style={{ marginBottom: '20px' }}>
                        <Input
                            type="text"
                            label="Código de verificación (6 dígitos)"
                            value={codigo}
                            onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setCodigo(v);
                                if (errorCodigo) setErrorCodigo('');
                            }}
                            placeholder="000000"
                            maxLength={6}
                            inputMode="numeric"
                            readOnly={loading}
                            required
                        />
                    </div>
                </div>
            </ModalCentro>

            <ModalCentro
                isOpen={isOpenNuevaContraseña}
                onClose={() => setIsOpenNuevaContraseña(false)}
                title="Restablecer contraseña"
                confirmText="Restablecer"
                onConfirm={handleRestablecerContraseña}
                loading={loading}
                disableClose={loading}
                contentStyle={{ paddingBlock: 0 }}
            >
                <div style={{ padding: '0 10px 10px 10px' }}>
                    <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                        Ingresa tu nueva contraseña.
                    </p>
                    {errorPassword && <Mensaje type="error" message={errorPassword} onClose={() => setErrorPassword('')} />}
                    <div style={{ marginBottom: '20px' }}>
                        <Input
                            type="password"
                            label="Nueva contraseña"
                            value={nuevaContraseña}
                            onChange={(e) => {
                                setNuevaContraseña(e.target.value);
                                if (errorPassword) setErrorPassword('');
                            }}
                            readOnly={loading}
                            required
                        />
                    </div>
                </div>
            </ModalCentro>
        </>
    );
}

export default ContraseñaReset;