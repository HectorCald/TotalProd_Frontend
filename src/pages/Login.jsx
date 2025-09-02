import React, { useState, useEffect } from 'react';
import styles from './Login.module.css';
import Boton from '../components/common/Boton';
import InputNormal from '../components/common/InputNormal';
import googleIcon from '../assets/google-icon.png';
import { motion, AnimatePresence } from 'framer-motion';
import UserService from '../services/userService';
import LogoAnimation from '../components/common/LogoAnimation';
import MensajeError from '../components/common/MensajeError';
import ContraseñaReset from '../components/views/login/ContraseñaReset';


const Login = () => {
    const [errorMessage, setErrorMessage] = useState('')
    const [isOpenContraseñaReset, setIsOpenContraseñaReset] = useState(false);

    //--------------------------------------------------------------------------------
    // States
    const [isRegister, setIsRegister] = useState(false);
    const [formDataLogin, setFormDataLogin] = useState({
        email: '',
        password: '',
    });
    const [formDataRegister, setFormDataRegister] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
    });


    //--------------------------------------------------------------------------------
    // Min Height y Toggle Mode(isRegister)
    const [delayedMinHeight, setDelayedMinHeight] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDelayedMinHeight(isRegister ? 390 : 220);
        }, 500); // Mismo tiempo que la duración de la animación

        return () => clearTimeout(timer);
    }, [isRegister]);
    const toggleMode = () => {
        setIsRegister(!isRegister);
        setFormDataLogin({
            email: '',
            password: '',
        });
        setFormDataRegister({
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            password: '',
        });
        setDelayedMinHeight(0);
    };
    useEffect(() => {
        const credentials = JSON.parse(localStorage.getItem('credentials'));
        if (credentials) {
            setFormDataLogin(prev => ({
                ...prev,
                email: credentials.email,
                password: credentials.password
            }));
            setRemember(true);
        }
    }, [isRegister]);


    //--------------------------------------------------------------------------------
    // Inputs(formDataLogin y formDataRegister)
    const handleInputChangeLogin = (field, value) => {
        setFormDataLogin(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const handleInputChangeRegister = (field, value) => {
        setFormDataRegister(prev => ({
            ...prev,
            [field]: value
        }));
    };

    //--------------------------------------------------------------------------------
    // Submit(formDataLogin y formDataRegister)
    const [loading, setLoading] = useState(false);
    const [remember, setRemember] = useState(false);
    const handleSubmit = async () => {
        if (!formDataLogin.email || !formDataLogin.password) {

            if (!formDataLogin.email) {
                setErrorMessage('El correo electrónico es requerido')
            }

            if (!formDataLogin.password) {
                setErrorMessage('La contraseña es requerida')
            }

            setTimeout(() => {
                setErrorMessage('')
            }, 3000);

            return;
        }
        try {
            setLoading(true);
            const result = await UserService.login({
                email: formDataLogin.email,
                password: formDataLogin.password
            });
            if (result.success) {
                // Guardar el token y ID del usuario en localStorage
                if (result.data) {
                    // Redirigir a Home y recargar la página
                    window.location.href = '/';
                }
            } else {
                // Manejar el caso cuando result.success es false
                console.log('Error en login:', result.error);
                setErrorMessage('Contraseña o email incorrectos')
                setTimeout(() => {
                    setErrorMessage('')
                }, 3000);
            }
        } catch (error) {
            console.error('Error al loguear el usuario:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleSubmitRegister = async () => {
        if (!formDataRegister.firstName || !formDataRegister.lastName || !formDataRegister.phone || !formDataRegister.email || !formDataRegister.password) {

            setErrorMessage('Todo los campos son requeridos')

            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }
        if (formDataRegister.password.length < 8) {
            setErrorMessage('La contraseña debe tener al menos 8 caracteres')
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }
        if (!formDataRegister.email.includes('@') || !formDataRegister.email.includes('.com')) {
            setErrorMessage('El email no es válido')
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }
        // Verificar si el email ya existe antes de crear el usuario
        setLoading(true);
        try {
            const result = await UserService.getUserByEmail(formDataRegister.email);
            if (result.success && result.data && result.data.exists) {
                setErrorMessage('El email ya está registrado');
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error('Error al verificar el email:', error);
            setErrorMessage('Error al verificar el email');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
            setLoading(false);
            return;
        } finally {
            setLoading(false);
        }
        try {
            setLoading(true);
            const result = await UserService.createUser(formDataRegister);
            if (result.success) {
                // Iniciar sesión automáticamente después del registro
                try {
                    const loginResult = await UserService.login({
                        email: formDataRegister.email,
                        password: formDataRegister.password
                    });
                    if (loginResult.success) {
                        // Guardar el token y ID del usuario en localStorage
                        if (loginResult.data) {
                            if (loginResult.data.token) {
                                localStorage.setItem('authToken', loginResult.data.token);
                            }
                        }
                        window.location.href = '/';
                    }
                } catch (loginError) {
                    console.error('Error al iniciar sesión automáticamente:', loginError);
                }
            } else {
                setErrorMessage(`Error al crear usuario: ${result.error || 'Error desconocido'}`);
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error al crear el usuario:', error);
        } finally {
            setLoading(false);
        }

    };
    const handleSubmitGoogle = async () => {
        setErrorMessage('Error al iniciar sesión con Google');
        setTimeout(() => {
            setErrorMessage('');
        }, 3000);
    }

    //--------------------------------------------------------------------------------
    // Render
    return (
        <div className={styles.loginContainer}>
            <LogoAnimation />
            <p className={styles.login_subtitle} >Bienvenido Inicia Sesión para continuar</p>
            <Boton
                className='btn-default'
                icon={googleIcon}
                label='Continuar con Google'
                onClick={handleSubmitGoogle}
            />

            <MensajeError mensaje={errorMessage} />

            <motion.div
                className={styles.content}
                animate={{
                    height: isRegister ? 390 : 220,
                }}
                transition={{
                    duration: 0.5,
                    ease: "easeInOut"
                }}
                style={{
                    minHeight: delayedMinHeight,
                }}
            >
                <AnimatePresence mode="wait">
                    {!isRegister ? (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className={styles.content_title} >Iniciar Sesión</p>
                            <div className={styles.content_login} >
                                <InputNormal
                                    tipo="text"
                                    label="Correo electrónico"
                                    value={formDataLogin.email}
                                    onChange={(e) => handleInputChangeLogin('email', e.target.value)}
                                    placeholder="Correo electrónico"
                                    icon="envelope"
                                />

                                <InputNormal
                                    tipo="password"
                                    label="Contraseña"
                                    value={formDataLogin.password}
                                    onChange={(e) => handleInputChangeLogin('password', e.target.value)}
                                    placeholder="Contraseña"
                                    icon="lock"
                                />
                                <div className={styles.login_remember_container}>
                                    <input type="checkbox" id="remember" checked={remember} onChange={() => setRemember(!remember)} />
                                    <label htmlFor="remember">Recordarme</label>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="register"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className={styles.content_title} >Registrarse</p>
                            <div className={styles.content_register} >
                                <InputNormal
                                    tipo="text"
                                    label="Nombres"
                                    value={formDataRegister.firstName}
                                    onChange={(e) => handleInputChangeRegister('firstName', e.target.value)}
                                    placeholder="Nombres"
                                    icon="user"
                                />
                                <InputNormal
                                    tipo="text"
                                    label="Apellidos"
                                    value={formDataRegister.lastName}
                                    onChange={(e) => handleInputChangeRegister('lastName', e.target.value)}
                                    placeholder="Apellidos"
                                    icon="user"
                                />
                                <InputNormal
                                    type="text"
                                    label="Correo electrónico"
                                    value={formDataRegister.email}
                                    onChange={(e) => handleInputChangeRegister('email', e.target.value)}
                                    placeholder="Correo electrónico"
                                    icon="envelope"
                                />
                                <InputNormal
                                    tipo="tel"
                                    label="Celular"
                                    value={formDataRegister.phone}
                                    onChange={(e) => handleInputChangeRegister('phone', e.target.value)}
                                    placeholder="Celular"
                                    icon="phone"
                                />
                                <InputNormal
                                    tipo="password"
                                    label="Contraseña"
                                    value={formDataRegister.password}
                                    onChange={(e) => handleInputChangeRegister('password', e.target.value)}
                                    placeholder="Contraseña"
                                    icon="lock"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            <Boton
                className='btn-original'
                onClick={isRegister ? handleSubmitRegister : handleSubmit}
                loading={loading}
                label={isRegister ? 'Registrarse' : 'Iniciar Sesión'}
            />

            {!isRegister && <p className={styles.login_footer} ><span onClick={() => setIsOpenContraseñaReset(true)}>¿Olvidaste tu contraseña?</span></p>}
            <p className={styles.login_footer}>
                {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                <span onClick={toggleMode}>{isRegister ? 'Iniciar sesión' : 'Regístrate'}</span>
            </p>
            <ContraseñaReset isOpen={isOpenContraseñaReset} setIsOpen={setIsOpenContraseñaReset} />
        </div >
    );
};

export default Login;
