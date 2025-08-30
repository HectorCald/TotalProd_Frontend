import React, { useState, useEffect } from 'react';
import styles from './Login.module.css';
import Boton from '../components/common/Boton';
import Input from '../components/common/Input';
import googleIcon from '../assets/google-icon.png';
import { motion, AnimatePresence } from 'framer-motion';
import UserService from '../services/userService';
import { BoxIcon } from 'boxicons-react';
import Select from '../components/common/Select';
import LogoAnimation from '../components/common/LogoAnimation';
import CompanyTypeService from '../services/companyTypeService';
import LoadingSpinner from '../components/common/LoadingSpinner';


const Login = () => {
    const [compañias, setCompañias] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('')
    useEffect(() => {
        setIsLoading(true);
        CompanyTypeService.getAll().then(response => {
            if (response.success && response.data) {
                // Formatear las opciones para el Select
                const formattedOptions = response.data.map(item => ({
                    value: item.id,
                    label: item.nombre || item.name,
                    icon: 'building'
                }));
                setCompañias(formattedOptions);
                setIsLoading(false);
            }
        });
    }, []);

    //--------------------------------------------------------------------------------
    // States
    const [isRegister, setIsRegister] = useState(false);
    const [formDataLogin, setFormDataLogin] = useState({
        phone: '',
        password: '',
    });
    const [formDataRegister, setFormDataRegister] = useState({
        name: '',
        phoneRegister: null,
        passwordRegister: '',
        compañia: '',
    });


    //--------------------------------------------------------------------------------
    // Min Height y Toggle Mode(isRegister)
    const [delayedMinHeight, setDelayedMinHeight] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDelayedMinHeight(isRegister ? 365 : 250);
        }, 500); // Mismo tiempo que la duración de la animación

        return () => clearTimeout(timer);
    }, [isRegister]);
    const toggleMode = () => {
        setIsRegister(!isRegister);
        setFormDataLogin({
            phone: '',
            password: '',
        });
        setFormDataRegister({
            name: '',
            phoneRegister: '',
            passwordRegister: '',
            compañia: '',
        });
        setDelayedMinHeight(0);
    };
    useEffect(() => {
        const credentials = JSON.parse(localStorage.getItem('credentials'));
        if (credentials) {
            setFormDataLogin(prev => ({
                ...prev,
                phone: credentials.phone,
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
        if (!formDataLogin.phone || !formDataLogin.password) {

            if (!formDataLogin.phone) {
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
                phone: formDataLogin.phone,
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
                setErrorMessage('Contraseña o celular incorrectos')
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
        if (!formDataRegister.name || !formDataRegister.phoneRegister || !formDataRegister.passwordRegister) {

            setErrorMessage('Todo los campos son requeridos')

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
        if (formDataRegister.phoneRegister) {
            setLoading(true);
            try {
                const result = await UserService.getUserByPhone(formDataRegister.phoneRegister);
                if (result.success && result.data) {
                    setErrorMessage('El numero de celular ya esta registrado')
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
                    const loginResult = await UserService.login({
                        phone: formDataRegister.phoneRegister,
                        password: formDataRegister.passwordRegister
                    });
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
            {isLoading && <LoadingSpinner />}
            <LogoAnimation />
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
                    height: isRegister ? 365 : 250,
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
                                    label="Celular"
                                    value={formDataLogin.phone}
                                    onChange={(e) => handleInputChangeLogin('phone', e.target.value)}
                                    placeholder="Ingrese su numero de celular"
                                />

                                <Input
                                    type="password"
                                    label="Contraseña"
                                    value={formDataLogin.password}
                                    onChange={(e) => handleInputChangeLogin('password', e.target.value)}
                                    placeholder="Ingrese su contraseña"
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
                                <Input
                                    type="text"
                                    label="Nombre Completo"
                                    value={formDataRegister.name}
                                    onChange={(e) => handleInputChangeRegister('name', e.target.value)}
                                    placeholder="Ingrese su nombre completo"
                                />
                                <Input
                                    type="tel"
                                    label="Celular"
                                    value={formDataRegister.phoneRegister}
                                    onChange={(e) => handleInputChangeRegister('phoneRegister', e.target.value)}
                                    placeholder="Ingrese su numero de celular"
                                />
                                <Input
                                    type="password"
                                    label="Contraseña"
                                    value={formDataRegister.passwordRegister}
                                    onChange={(e) => handleInputChangeRegister('passwordRegister', e.target.value)}
                                    placeholder="Ingrese su contraseña"
                                />
                                <div className={styles.content_company}>
                                    <Select
                                        label="Compañia"
                                        value={formDataRegister.compañia}
                                        onChange={(value) => handleInputChangeRegister('compañia', value)}
                                        options={compañias}
                                        placeholder="Tipo de Negocio"
                                    />
                                </div>

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
