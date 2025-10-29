import React, { useState } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import InputNormal from '../../common/InputNormal';
import Boton from '../../common/Boton';
import MensajeError from '../../common/MensajeError';
import ItemView from '../../common/ItemView';
import personalService from '../../../services/personalService';

function LoginEmpleado({ isOpen, setIsOpen, onLoginSuccess }) {
    const [step, setStep] = useState(1); // 1: código, 2: contraseña
    const [codigo, setCodigo] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [personalData, setPersonalData] = useState(null);

    // Función para validar código de empleado
    const handleValidateCode = async () => {
        if (!codigo.trim()) {
            setErrorMessage('El código es obligatorio');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (codigo.length < 8) {
            setErrorMessage('El código debe tener al menos 8 caracteres');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.validateEmployeeCode(codigo);
            
            if (response.success) {
                if (response.data.hasPassword) {
                    // Ya tiene contraseña, proceder al login
                    setPersonalData(response.data.personal);
                    setStep(2);
                } else {
                    // No tiene contraseña, establecer contraseña
                    setPersonalData(response.data.personal);
                    setStep(3);
                }
            } else {
                setErrorMessage(response.message || 'Código de empleado no válido');
                setTimeout(() => setErrorMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error al validar código:', error);
            setErrorMessage('Error de conexión con el servidor');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Función para establecer contraseña
    const handleSetPassword = async () => {
        if (!password.trim()) {
            setErrorMessage('La contraseña es obligatoria');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (password.length < 8) {
            setErrorMessage('La contraseña debe tener al menos 8 caracteres');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Las contraseñas no coinciden');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.setPassword(personalData.id, password);
            
            if (response.success) {
                setErrorMessage('');
                setStep(2); // Ir al login
            } else {
                setErrorMessage(response.message || 'Error al establecer contraseña');
                setTimeout(() => setErrorMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error al establecer contraseña:', error);
            setErrorMessage('Error de conexión con el servidor');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Función para login de empleado
    const handleEmployeeLogin = async () => {
        if (!password.trim()) {
            setErrorMessage('La contraseña es obligatoria');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.loginEmployee(codigo, password);
            
            if (response.success) {
                // El token ya se guardó en personalService.loginEmployee
                
                // Si el empleado tiene rastreo activado, obtener y actualizar ubicación
                if (response.data.personal && response.data.personal.rastrear) {
                    try {
                        const locationResponse = await personalService.getCurrentLocation();
                        if (locationResponse.success) {
                            await personalService.updateLocation(
                                response.data.personal.id,
                                locationResponse.data.latitude,
                                locationResponse.data.longitude
                            );
                            console.log('Ubicación actualizada al iniciar sesión');
                        }
                    } catch (locationError) {
                        console.error('Error al obtener ubicación:', locationError);
                        // No mostrar error al usuario, solo log
                    }
                }
                
                onLoginSuccess(response.data);
                setIsOpen(false);
            } else {
                setErrorMessage(response.message || 'Credenciales incorrectas');
                setTimeout(() => setErrorMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error en login de empleado:', error);
            setErrorMessage('Error de conexión con el servidor');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Función para resetear el modal
    const handleClose = () => {
        setStep(1);
        setCodigo('');
        setPassword('');
        setConfirmPassword('');
        setErrorMessage('');
        setPersonalData(null);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={handleClose}>
            <HeaderModal 
                title="Acceso de Empleado" 
                onClose={handleClose} 
            />
            <div className={styles.modalContent}>
                <MensajeError mensaje={errorMessage} />
                
                {step === 1 && (
                    <>
                        <p className={styles.subTitle}>INGRESE SU CÓDIGO DE EMPLEADO</p>
                        <InputNormal
                            tipo="text"
                            icon="hash"
                            value={codigo}
                            placeholder="Código de empleado"
                            onChange={(e) => setCodigo(e.target.value)}
                        />
                        <Boton
                            className="btn-original"
                            label="Validar Código"
                            onClick={handleValidateCode}
                            loading={loading}
                            disabled={!codigo.trim() || codigo.length < 8}
                        />
                    </>
                )}

                {step === 2 && personalData && (
                    <>
                        <p className={styles.subTitle}>INICIAR SESIÓN</p>
                        <ItemView
                            title={`${personalData.first_name} ${personalData.last_name}`}
                            description={`Código: ${personalData.codigo}`}
                        />
                        <InputNormal
                            tipo="password"
                            icon="lock"
                            value={password}
                            placeholder="Contraseña"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Boton
                            className="btn-original"
                            label="Iniciar Sesión"
                            onClick={handleEmployeeLogin}
                            loading={loading}
                            disabled={!password.trim()}
                        />
                        <Boton
                            className="btn-default"
                            label="Cambiar Código"
                            onClick={() => {
                                setStep(1);
                                setPassword('');
                                setPersonalData(null);
                            }}
                        />
                    </>
                )}

                {step === 3 && personalData && (
                    <>
                        <p className={styles.subTitle}>ESTABLECER CONTRASEÑA</p>
                        <ItemView
                            title={`${personalData.first_name} ${personalData.last_name}`}
                            description={`Código: ${personalData.codigo}`}
                            icon="user"
                        />
                        <InputNormal
                            tipo="password"
                            icon="lock"
                            value={password}
                            placeholder="Nueva contraseña"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <InputNormal
                            tipo="password"
                            icon="lock"
                            value={confirmPassword}
                            placeholder="Confirmar contraseña"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Boton
                            className="btn-original"
                            label="Establecer Contraseña"
                            onClick={handleSetPassword}
                            loading={loading}
                            disabled={!password.trim() || !confirmPassword.trim() || password !== confirmPassword}
                        />
                        <Boton
                            className="btn-default"
                            label="Cambiar Código"
                            onClick={() => {
                                setStep(1);
                                setPassword('');
                                setConfirmPassword('');
                                setPersonalData(null);
                            }}
                        />
                    </>
                )}
            </div>
        </ViewModal>
    );
}

export default LoginEmpleado;
