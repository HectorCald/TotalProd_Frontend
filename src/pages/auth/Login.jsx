import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import Boton from '../../components/common/botones/Boton';
import Input from '../../components/common/inputs/Input';
import Checkbox from '../../components/common/inputs/Checkbox';
import UserService from '../../services/userService';
import LogoAnimation from '../../components/essentials/LogoAnimation';
import Mensaje from '../../components/common/outputs/Mensaje';
import { validateEmail } from '../../hooks/validateEmail';
import ContraseñaReset from '../../components/views/login/ContraseñaReset';
import LoginEmpleado from '../../components/views/login/LoginEmpleado';

const Login = () => {
    const navigate = useNavigate();
    const [mensajeState, setMensajeState] = useState({ visible: false, type: '', title: '', text: '', duration: 5000 });
    const [isOpenContraseñaReset, setIsOpenContraseñaReset] = useState(false);
    const [isOpenLoginEmpleado, setIsOpenLoginEmpleado] = useState(false);



    const [formDataLogin, setFormDataLogin] = useState({
        email: '',
        password: '',
    });
    const [loginErrors, setLoginErrors] = useState({ email: false, password: false });
    const [loading, setLoading] = useState(false);
    const [remember, setRemember] = useState(false);

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
    }, []);

    const handleInputChangeLogin = (field, value) => {
        setFormDataLogin(prev => ({ ...prev, [field]: value }));
        setLoginErrors(prev => ({ ...prev, [field]: false }));
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (loading) return;

        if (!formDataLogin.email?.trim()) {
            setLoginErrors(prev => ({ ...prev, email: true, password: false }));
            setMensajeState({ visible: true, type: 'warning', title: 'Validación', text: 'El correo electrónico es requerido', duration: 5000 });
            return;
        }
        if (!formDataLogin.password) {
            setLoginErrors(prev => ({ ...prev, email: false, password: true }));
            setMensajeState({ visible: true, type: 'warning', title: 'Validación', text: 'La contraseña es requerida', duration: 5000 });
            return;
        }
        if (!validateEmail(formDataLogin.email)) {
            setLoginErrors(prev => ({ ...prev, email: false, password: false }));
            setMensajeState({ visible: true, type: 'warning', title: 'Validación', text: 'El correo electrónico no es válido. Debe contener @ y un dominio (ej: .com, .es).', duration: 5000 });
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
                navigate('/dashboard', { replace: true });
                if (remember) {
                    UserService.saveRememberPreference(true);
                    localStorage.setItem('savedEmail', formDataLogin.email);
                } else {
                    UserService.saveRememberPreference(false);
                    localStorage.removeItem('savedEmail');
                }
                if (result.data) {
                    window.dispatchEvent(new Event('local-login'));
                }
            } else {
                setLoading(false);
                const errorText = result.message || 'Contraseña o correo electrónico incorrecto. Verifica los datos e intenta nuevamente.';
                setMensajeState({ visible: true, type: 'error', title: 'Error', text: errorText, duration: 5000 });
            }
        } catch (error) {
            setLoading(false);
            console.error('❌ Error al loguear el usuario:', error);
            const errorText = error.message || 'No se pudo conectar con el servidor. Revisa tu conexión a internet e intenta nuevamente.';
            setMensajeState({ visible: true, type: 'error', title: 'Error', text: errorText, duration: 5000 });
        }
    };

    const handleEmployeeLoginSuccess = (employeeData) => {
        window.dispatchEvent(new Event('local-login'));
    }

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginContainer_content}>
                <LogoAnimation hideIcon={true} />
                <p className={styles.login_subtitle}>Inicia sesión para continuar</p>

                {mensajeState.visible && (
                    <Mensaje
                        type={mensajeState.type}
                        title={mensajeState.title}
                        message={mensajeState.text}
                        duration={mensajeState.duration}
                        onClose={() => setMensajeState(prev => ({ ...prev, visible: false }))}
                    />
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.content}>
                        <div className={styles.content_login}>
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
                                <Checkbox
                                    label="Recordarme Correo Electronico"
                                    id="remember"
                                    checked={remember}
                                    onChange={setRemember}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>
                    <Boton
                        type="submit"
                        className='btn-original'
                        loading={loading}
                        label='Iniciar Sesión'
                    />
                </form>

                <Boton
                    className='btn-default'
                    onClick={() => setIsOpenLoginEmpleado(true)}
                    label='Soy empleado'
                />

                <p className={styles.login_footer}>
                    <span className={styles.login_footer_span} onClick={() => setIsOpenContraseñaReset(true)}>
                        ¿Olvidaste tu contraseña?
                    </span>
                </p>

                <ContraseñaReset isOpen={isOpenContraseñaReset} setIsOpen={setIsOpenContraseñaReset} />
                <LoginEmpleado
                    isOpen={isOpenLoginEmpleado}
                    setIsOpen={setIsOpenLoginEmpleado}
                    onLoginSuccess={handleEmployeeLoginSuccess}
                />
            </div>
        </div>
    );
};

export default Login;