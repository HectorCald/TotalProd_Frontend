import React, { useState, useEffect } from 'react';
import styles from './Login.module.css';
import Boton from '../components/common/Boton';
import Input from '../components/common/inputs/Input';
import googleIcon from '../assets/google-icon.png';
import { motion, AnimatePresence } from 'framer-motion';
import UserService from '../services/userService';
import LogoAnimation from '../components/common/LogoAnimation';
import { useToast } from '../context/ToastContext';
import ContraseñaReset from '../components/views/login/ContraseñaReset';
import LoginEmpleado from '../components/views/login/LoginEmpleado';

const Login = () => {
    const { showDanger, showWarning } = useToast();
    const [isOpenContraseñaReset, setIsOpenContraseñaReset] = useState(false);
    const [isOpenLoginEmpleado, setIsOpenLoginEmpleado] = useState(false);

    const normalizeText = (text) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '');
    };

    const isValidEmail = (email) => {
        if (!email || typeof email !== 'string') return false;
        const trimmed = email.trim();
        if (!trimmed.includes('@')) return false;
        const parts = trimmed.split('@');
        if (parts.length !== 2 || !parts[1]) return false;
        return /\.([a-zA-Z]{2,})$/.test(parts[1]);
    };

    const getErrorMessageFromResult = (result) => {
        if (!result) return null;
        const msg = result.error || result.message || result.data?.message || result.data?.error || null;
        if (!msg || typeof msg !== 'string') return msg;
        const normalized = msg.trim().toLowerCase();
        if (normalized === 'credenciales inválidas' || normalized === 'credenciales invalidas') {
            return 'Contraseña o correo electrónico incorrecto. Verifica los datos e intenta nuevamente.';
        }
        return msg;
    };

    const getErrorMessageFromError = (err) => {
        if (!err) return null;
        return err.message || err.error || (err.response && (err.response.data?.message || err.response.data?.error)) || null;
    };

    // Función para verificar si el nombre contiene "damabrava"
    const containsDamabrava = (name) => {
        const normalizedName = normalizeText(name);
        const normalizedForbidden = normalizeText('damabrava');
        return normalizedName.includes(normalizedForbidden);
    };

    // estado para el modo de registro y login
    const [isRegister, setIsRegister] = useState(false);
    const [formDataLogin, setFormDataLogin] = useState({
        email: '',
        password: '',
    });
    const [formDataRegister, setFormDataRegister] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        nameStore: '',
    });
    const [loginErrors, setLoginErrors] = useState({ email: false, password: false });
    const [registerErrors, setRegisterErrors] = useState({
        firstName: false,
        lastName: false,
        email: false,
        password: false,
        nameStore: false,
    });


    // Min Height y Toggle Mode(isRegister)
    const [delayedMinHeight, setDelayedMinHeight] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDelayedMinHeight(isRegister ? 430 : 230);
        }, 500); // Mismo tiempo que la duración de la animación

        return () => clearTimeout(timer);
    }, [isRegister]);
    const toggleMode = () => {
        setIsRegister(!isRegister);
        setFormDataLogin({ email: '', password: '' });
        setFormDataRegister({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            nameStore: '',
        });
        setLoginErrors({ email: false, password: false });
        setRegisterErrors({
            firstName: false,
            lastName: false,
            email: false,
            password: false,
            nameStore: false,
        });
        setDelayedMinHeight(0);
    };
    useEffect(() => {
        // Solo cargar email si el usuario marcó "recordar sesión"
        const rememberSession = UserService.getRememberPreference();
        if (rememberSession) {
            const savedEmail = localStorage.getItem('savedEmail');
            if (savedEmail) {
                setFormDataLogin(prev => ({
                    ...prev,
                    email: savedEmail
                }));
                setRemember(true);
            }
        }
    }, [isRegister]);


    const handleInputChangeLogin = (field, value) => {
        setFormDataLogin(prev => ({ ...prev, [field]: value }));
        setLoginErrors(prev => ({ ...prev, [field]: false }));
    };
    const handleInputChangeRegister = (field, value) => {
        setFormDataRegister(prev => ({ ...prev, [field]: value }));
        setRegisterErrors(prev => ({ ...prev, [field]: false }));
    };


    // Submit(formDataLogin y formDataRegister)
    const [loading, setLoading] = useState(false);
    const [remember, setRemember] = useState(false);
    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!formDataLogin.email?.trim()) {
            setLoginErrors(prev => ({ ...prev, email: true, password: false }));
            showWarning('Validación', 'El correo electrónico es requerido');
            return;
        }
        if (!formDataLogin.password) {
            setLoginErrors(prev => ({ ...prev, email: false, password: true }));
            showWarning('Validación', 'La contraseña es requerida');
            return;
        }
        if (!isValidEmail(formDataLogin.email.trim())) {
            setLoginErrors(prev => ({ ...prev, email: true, password: false }));
            showWarning('Validación', 'El correo electrónico no es válido. Debe contener @ y un dominio (ej: .com, .es).');
            return;
        }
        setLoginErrors({ email: false, password: false });
        try {
            setLoading(true);
            const result = await UserService.login({
                email: formDataLogin.email,
                password: formDataLogin.password
            });
            
            if (result.success) {
                if (remember) {
                    UserService.saveRememberPreference(true);
                    localStorage.setItem('savedEmail', formDataLogin.email);
                } else {
                    UserService.saveRememberPreference(false);
                    localStorage.removeItem('savedEmail');
                }
                if (result.data) {
                    setTimeout(() => { window.location.href = '/'; }, 1000);
                }
            } else {
                setLoading(false);
                const errorText = getErrorMessageFromResult(result) || 'Contraseña o correo electrónico incorrecto. Verifica los datos e intenta nuevamente.';
                showDanger('Error', errorText, 5000, false);
            }
        } catch (error) {
            setLoading(false);
            console.error('❌ Error al loguear el usuario:', error);
            const errorText = getErrorMessageFromError(error) || 'No se pudo conectar con el servidor. Revisa tu conexión a internet e intenta nuevamente.';
            showDanger('Error', errorText, 5000, false);
        }
    };
    const handleSubmitRegister = async () => {
        // Aplicar .trim() a todos los campos del registro
        const trimmedData = {
            firstName: formDataRegister.firstName.trim(),
            lastName: formDataRegister.lastName.trim(),
            email: formDataRegister.email.trim(),
            password: formDataRegister.password.trim(),
            nameStore: formDataRegister.nameStore.trim(),
        };

        setFormDataRegister(trimmedData);

        if (!trimmedData.firstName) {
            setRegisterErrors(prev => ({ ...prev, firstName: true }));
            showWarning('Validación', 'Los nombres son requeridos');
            return;
        }
        if (!trimmedData.lastName) {
            setRegisterErrors(prev => ({ ...prev, lastName: true }));
            showWarning('Validación', 'Los apellidos son requeridos');
            return;
        }
        if (!trimmedData.email) {
            setRegisterErrors(prev => ({ ...prev, email: true }));
            showWarning('Validación', 'El correo electrónico es requerido');
            return;
        }
        if (!trimmedData.password) {
            setRegisterErrors(prev => ({ ...prev, password: true }));
            showWarning('Validación', 'La contraseña es requerida');
            return;
        }
        if (!trimmedData.nameStore) {
            setRegisterErrors(prev => ({ ...prev, nameStore: true }));
            showWarning('Validación', 'El nombre de la empresa es requerido');
            return;
        }
        setRegisterErrors({ firstName: false, lastName: false, email: false, password: false, nameStore: false });
        if (containsDamabrava(trimmedData.nameStore)) {
            showWarning('Validación', 'El nombre de la empresa no está permitido');
            return;
        }
        if (trimmedData.password.length < 8) {
            showWarning('Validación', 'La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (!isValidEmail(trimmedData.email)) {
            setRegisterErrors(prev => ({ ...prev, email: true }));
            showWarning('Validación', 'El correo electrónico no es válido. Debe contener @ y un dominio (ej: .com, .es).');
            return;
        }
        // Verificar si el email ya existe antes de crear el usuario
        setLoading(true);
        try {
            const result = await UserService.getUserByEmail(trimmedData.email);
            if (result.success && result.data && result.data.exists) {
                showWarning('Validación', 'El email ya está registrado');
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error('Error al verificar el email:', error);
            const errorText = getErrorMessageFromError(error) || 'No se pudo verificar si el correo ya está registrado. Revisa tu conexión e intenta nuevamente.';
            showDanger('Error', errorText, 5000, false);
            setLoading(false);
            return;
        } finally {
            setLoading(false);
        }
        try {
            setLoading(true);
            const result = await UserService.createUser(trimmedData);
            if (result.success) {
                try {
                    const loginResult = await UserService.login({
                        email: trimmedData.email,
                        password: trimmedData.password
                    });
                    if (loginResult.success) {
                        if (remember) {
                            UserService.saveRememberPreference(true);
                            localStorage.setItem('savedEmail', trimmedData.email);
                        } else {
                            UserService.saveRememberPreference(false);
                            localStorage.removeItem('savedEmail');
                        }
                        window.location.href = '/';
                    }
                } catch (loginError) {
                    console.error('Error al iniciar sesión automáticamente:', loginError);
                }
            } else {
                setLoading(false);
                const errorText = getErrorMessageFromResult(result) || 'No se pudo crear la cuenta. Revisa los datos e intenta nuevamente.';
                showDanger('Error', errorText, 5000, false);
            }
        } catch (error) {
            setLoading(false);
            console.error('Error al crear el usuario:', error);
            const errorText = getErrorMessageFromError(error) || 'Error de conexión al crear la cuenta. Revisa tu conexión a internet e intenta nuevamente.';
            showDanger('Error', errorText, 5000, false);
        }
    };
    const handleSubmitGoogle = async () => {
        showDanger('Error', 'No se pudo iniciar sesión con Google. Intenta de nuevo más tarde o usa correo y contraseña.', 5000, false);
    }

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (loading) return;
        if (isRegister) {
            handleSubmitRegister(e);
        } else {
            handleSubmit(e);
        }
    };

    const handleEmployeeLoginSuccess = (employeeData) => {
        // Guardar datos del empleado en localStorage para que el contexto los pueda cargar
        localStorage.setItem('employeeData', JSON.stringify(employeeData));
        
        // Guardar empresa_id por separado para que esté disponible inmediatamente
        if (employeeData.personal && employeeData.personal.empresa_id) {
            localStorage.setItem('empresa_id', employeeData.personal.empresa_id);
        }
        
        // Redirigir a Home y recargar la página
        window.location.href = '/';
    }

    // Render
    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginContainer_content}>
            <LogoAnimation />
            <p className={styles.login_subtitle} >Bienvenido Inicia Sesión para continuar</p>
            <Boton
                className='btn-default'
                icon={googleIcon}
                label='Continuar con Google'
                onClick={handleSubmitGoogle}
            />

            <form onSubmit={handleFormSubmit} className={styles.form}>
                <motion.div
                    className={styles.content}
                    animate={{
                        height: isRegister ? 430 : 230,
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
                                        readOnly={loading}
                                        required
                                        error={loginErrors.email}
                                        onClearError={() => setLoginErrors(prev => ({ ...prev, email: false }))}
                                    />
                                    <Input
                                        type="password"
                                        label="Contraseña"
                                        value={formDataLogin.password}
                                        onChange={(e) => handleInputChangeLogin('password', e.target.value)}
                                        readOnly={loading}
                                        required
                                        error={loginErrors.password}
                                        onClearError={() => setLoginErrors(prev => ({ ...prev, password: false }))}
                                    />
                                    <div className={styles.login_remember_container}>
                                        <input
                                            type="checkbox"
                                            id="remember"
                                            checked={remember}
                                            onChange={() => setRemember(!remember)}
                                            disabled={loading}
                                        />
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
                                        label="Nombres"
                                        value={formDataRegister.firstName}
                                        onChange={(e) => handleInputChangeRegister('firstName', e.target.value)}
                                        readOnly={loading}
                                        required
                                        error={registerErrors.firstName}
                                        onClearError={() => setRegisterErrors(prev => ({ ...prev, firstName: false }))}
                                    />
                                    <Input
                                        type="text"
                                        label="Apellidos"
                                        value={formDataRegister.lastName}
                                        onChange={(e) => handleInputChangeRegister('lastName', e.target.value)}
                                        readOnly={loading}
                                        required
                                        error={registerErrors.lastName}
                                        onClearError={() => setRegisterErrors(prev => ({ ...prev, lastName: false }))}
                                    />
                                    <Input
                                        type="text"
                                        label="Correo electrónico"
                                        value={formDataRegister.email}
                                        onChange={(e) => handleInputChangeRegister('email', e.target.value)}
                                        readOnly={loading}
                                        required
                                        error={registerErrors.email}
                                        onClearError={() => setRegisterErrors(prev => ({ ...prev, email: false }))}
                                    />
                                    <Input
                                        type="password"
                                        label="Contraseña"
                                        value={formDataRegister.password}
                                        onChange={(e) => handleInputChangeRegister('password', e.target.value)}
                                        readOnly={loading}
                                        required
                                        error={registerErrors.password}
                                        onClearError={() => setRegisterErrors(prev => ({ ...prev, password: false }))}
                                    />
                                    <Input
                                        type="text"
                                        label="Nombre de la Empresa"
                                        value={formDataRegister.nameStore}
                                        onChange={(e) => handleInputChangeRegister('nameStore', e.target.value)}
                                        readOnly={loading}
                                        required
                                        error={registerErrors.nameStore}
                                        onClearError={() => setRegisterErrors(prev => ({ ...prev, nameStore: false }))}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                <Boton
                    type="submit"
                    className='btn-original'
                    loading={loading}
                    label={isRegister ? 'Registrarse' : 'Iniciar Sesión'}
                />
            </form>

            {!isRegister && (
                <Boton
                    className='btn-default'
                    onClick={() => setIsOpenLoginEmpleado(true)}
                    label='Soy empleado'
                />
            )}
            <div className={styles.space}></div>
            {!isRegister && <p className={styles.login_footer} ><span className={styles.login_footer_span} onClick={() => setIsOpenContraseñaReset(true)}>¿Olvidaste tu contraseña?</span></p>}
            <p className={styles.login_footer}>
                {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                <span onClick={toggleMode} className={styles.login_footer_span}>{isRegister ? 'Iniciar sesión' : 'Regístrate'}</span>
            </p>
            <ContraseñaReset isOpen={isOpenContraseñaReset} setIsOpen={setIsOpenContraseñaReset} />
            <LoginEmpleado 
                isOpen={isOpenLoginEmpleado} 
                setIsOpen={setIsOpenLoginEmpleado} 
                onLoginSuccess={handleEmployeeLoginSuccess}
            />
            </div>
        </div >
    );
};

export default Login;
