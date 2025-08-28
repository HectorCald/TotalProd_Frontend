import React, { useState, useEffect } from 'react';
import styles from './Login.module.css';
import Boton from '../components/common/Boton';
import Input from '../components/common/Input';
import googleIcon from '../assets/google-icon.png';
import { motion, AnimatePresence } from 'framer-motion';
import UserService from '../services/userService';
import { BoxIcon } from 'boxicons-react';


const Login = () => {
    const [errorMessage, setErrorMessage] = useState('')
    //--------------------------------------------------------------------------------
    // States
    const [isRegister, setIsRegister] = useState(false);
    const [formDataLogin, setFormDataLogin] = useState({
        email: '',
        password: '',
    });
    const [formDataRegister, setFormDataRegister] = useState({
        name: '',
        telefono: null,
        emailRegister: '',
        passwordRegister: '',
        confirmPasswordRegister: ''
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
            name: '',
            telefono: '',
            emailRegister: '',
            passwordRegister: '',
            confirmPasswordRegister: ''
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
            const result = await UserService.login(formDataLogin.email, formDataLogin.password, remember);
            if (result.success) {

                // Guardar el token y ID del usuario en localStorage
                if (result.data) {
                    if (result.data.token) {
                        localStorage.setItem('authToken', result.data.token);
                    }
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
        if (!formDataRegister.name || !formDataRegister.emailRegister || !formDataRegister.passwordRegister || !formDataRegister.confirmPasswordRegister) {
            if (!formDataRegister.name) {
                setErrorMessage('El nombre es requerido')
            }
            if (!formDataRegister.telefono) {
                setErrorMessage('El numero de celular es requerido')
            }
            if (!formDataRegister.emailRegister) {
                setErrorMessage('El email es requerido')
            }
            if (!formDataRegister.passwordRegister) {
                setErrorMessage('La contraseña es requerida')
            }
            if (!formDataRegister.confirmPasswordRegister) {
                setErrorMessage('La confirmación de contraseña es requerida')
            }
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }
        if (formDataRegister.passwordRegister.length < 8) {
            setErrorMessage('La contraseña debe tener al menos 8 caracteres')
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }
        if (!formDataRegister.emailRegister.includes('@') || !formDataRegister.emailRegister.includes('.com')) {
            setErrorMessage('El correo electronico no es valido')
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }
        if (formDataRegister.passwordRegister !== formDataRegister.confirmPasswordRegister) {
            setErrorMessage('Las contraseñas no coinciden')

            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }
        if (formDataRegister.emailRegister) {
            setLoading(true);
            try {
                const result = await UserService.getUserByEmail(formDataRegister.emailRegister);
                if (result.success && result.data) {
                    setErrorMessage('El correo electronico ya esta registrado')
                    setTimeout(() => {
                        setErrorMessage('')
                    }, 3000);
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error al obtener el usuario:', error);
            } finally {
                setLoading(false);
            }
        }
        try {
            setLoading(true);
            const result = await UserService.createUser(formDataRegister);
            if (result.success) {
                // Iniciar sesión automáticamente después del registro
                try {
                    const loginResult = await UserService.login(formDataRegister.emailRegister, formDataRegister.passwordRegister, remember);
                    if (loginResult.success) {
                        // Guardar el token y ID del usuario en localStorage
                        if (loginResult.data) {
                            if (loginResult.data.token) {
                                localStorage.setItem('authToken', loginResult.data.token);
                            }
                            if (loginResult.data.user && loginResult.data.user.id) {
                                localStorage.setItem('userId', loginResult.data.user.id);
                            } else if (loginResult.data.id) {
                                localStorage.setItem('userId', loginResult.data.id);
                            }
                        }
                        window.location.href = '/';
                    }
                } catch (loginError) {
                    console.error('Error al iniciar sesión automáticamente:', loginError);
                }
            } else {
                alert(`Error al iniciar sesión automáticamente: ${result.error || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error al crear el usuario:', error);
        } finally {
            setLoading(false);
        }

    };

    //--------------------------------------------------------------------------------
    // Render
    return (
        <div className={styles.loginContainer}>
            {loading && <div className={styles.overlay_loading} ></div>}
            <motion.h1 className={styles.login_logo} >
                <motion.span
                    className={styles.login_logo_span}
                    initial={{ width: 0, overflow: "hidden" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    style={{ position: "relative" }}
                >
                    <motion.span
                        initial={{ x: -50, rotate: 0 }}
                        animate={{
                            x: [0, 225],
                            rotate: [-20, 0]
                        }}
                        transition={{
                            duration: 1.8,
                            delay: 0.3,
                            ease: "easeInOut",
                            times: [0, 0.5, 0.5]
                        }}
                        style={{
                            display: "inline-block",
                            position: "absolute",
                            left: 0,
                            color: "var(--primary-color)",
                        }}
                    >
                        <BoxIcon name="cart" className={styles.icon} />
                    </motion.span>
                    <motion.span
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        style={{ display: "inline-block" }}
                    >
                        T
                    </motion.span>
                    <motion.span
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                        style={{ display: "inline-block" }}
                    >
                        o
                    </motion.span>
                    <motion.span
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                        style={{ display: "inline-block" }}
                    >
                        t
                    </motion.span>
                    <motion.span
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 1.0 }}
                        style={{ display: "inline-block"}}
                    >
                        a
                    </motion.span>
                    <motion.span
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 1.2 }}
                        style={{ display: "inline-block" }}
                    >
                        l
                    </motion.span>
                    <motion.span
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 1.3 }}
                        style={{ display: "inline-block", color: "var(--primary-color)" }}
                    >
                        P
                    </motion.span>
                    <motion.span
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 1.4 }}
                        style={{ display: "inline-block", color: "var(--primary-color)" }}
                    >
                        r
                    </motion.span>
                    <motion.span
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 1.5 }}
                        style={{ display: "inline-block", color: "var(--primary-color)" }}
                    >
                        o
                    </motion.span>
                    <motion.span
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 1.6 }}
                        style={{ display: "inline-block", color: "var(--primary-color)" }}
                    >
                        d
                    </motion.span>
                </motion.span>
            </motion.h1>
            <p className={styles.login_subtitle} >Bienvenido Inicia Sesión para continuar</p>
            <Boton className='btn-default' icon={googleIcon} label='Continuar con Google' />
            <motion.div
                className={styles.info}
                animate={{
                    height: errorMessage !== '' ? 40 : 0,
                    opacity: errorMessage !== '' ? 1 : 0
                }}
                transition={{
                    duration: 0.5,
                    ease: "easeInOut"
                }}
            >
                <BoxIcon name='info-circle' className='icon' />
                <p className={styles.text} >{errorMessage}</p>
            </motion.div>
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
                                <Input
                                    type="text"
                                    label="Correo electrónico"
                                    value={formDataLogin.email}
                                    onChange={(e) => handleInputChangeLogin('email', e.target.value)}
                                />

                                <Input
                                    type="password"
                                    label="Contraseña"
                                    value={formDataLogin.password}
                                    onChange={(e) => handleInputChangeLogin('password', e.target.value)}
                                />
                                <div className= {styles.login_remember_container}>
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
                                <Input
                                    type="text"
                                    label="Nombre Completo"
                                    value={formDataRegister.name}
                                    onChange={(e) => handleInputChangeRegister('name', e.target.value)}
                                />
                                <Input
                                    type="tel"
                                    label="Celular"
                                    value={formDataRegister.telefono}
                                    onChange={(e) => handleInputChangeRegister('telefono', e.target.value)}
                                />
                                <Input
                                    type="text"
                                    label="Correo electrónico"
                                    value={formDataRegister.emailRegister}
                                    onChange={(e) => handleInputChangeRegister('emailRegister', e.target.value)}
                                />
                                <Input
                                    type="password"
                                    label="Contraseña"
                                    value={formDataRegister.passwordRegister}
                                    onChange={(e) => handleInputChangeRegister('passwordRegister', e.target.value)}
                                />
                                <Input
                                    type="password"
                                    label="Confirmar contraseña"
                                    value={formDataRegister.confirmPasswordRegister}
                                    onChange={(e) => handleInputChangeRegister('confirmPasswordRegister', e.target.value)}
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

            {!isRegister && <p className={styles.login_footer} >¿Olvidaste tu contraseña?</p>}
            <p className={styles.login_footer}>
                {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                <span onClick={toggleMode}>{isRegister ? 'Iniciar sesión' : 'Regístrate'}</span>
            </p>
        </div >
    );
};

export default Login;
