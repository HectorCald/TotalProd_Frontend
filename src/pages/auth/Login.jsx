import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import Boton from '../../components/common/botones/Boton';
import Input from '../../components/common/inputs/Input';
import Checkbox from '../../components/common/inputs/Checkbox';
import UserService from '../../services/userService';
import personalService from '../../services/personalService';
import LogoAnimation from '../../components/essentials/LogoAnimation';
import Mensaje from '../../components/common/outputs/Mensaje';
import { validateEmail } from '../../hooks/validateEmail';
import ContraseñaReset from '../../components/views/login/ContraseñaReset';
import ContrasenaEmpleado from '../../components/views/login/modals/ContrasenaEmpleado';

const Login = () => {
    const navigate = useNavigate();
    const [mensajeState, setMensajeState] = useState({ visible: false, type: '', title: '', text: '', duration: 5000 });
    const [isOpenContraseñaReset, setIsOpenContraseñaReset] = useState(false);
    const [isOpenContrasenaEmpleado, setIsOpenContrasenaEmpleado] = useState(false);
    const [empleadoParaContrasena, setEmpleadoParaContrasena] = useState(null);
    const [formDataLogin, setFormDataLogin] = useState({
        email: '',
        password: '',
    });
    const [loginErrors, setLoginErrors] = useState({ email: false, password: false });
    const [loading, setLoading] = useState(false);
    const [remember, setRemember] = useState(false);
    const [circles, setCircles] = useState([]);

    useEffect(() => {
        const rememberSession = UserService.getRememberPreference();
        if (rememberSession) {
            const savedEmail = localStorage.getItem('savedEmail');
            if (savedEmail) {
                setFormDataLogin(prev => ({ ...prev, email: savedEmail }));
                setRemember(true);
            }
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        
        const numCircles = 12;
        const generatedCircles = [];
        
        for (let i = 0; i < numCircles; i++) {
            let size = Math.random() * 300 + 150;
            let x, y;
            let overlapping = true;
            let attempts = 0;

            while (overlapping && attempts < 100) {
                x = Math.random() * (width - size);
                y = Math.random() * (height - size);
                overlapping = false;

                for (let j = 0; j < generatedCircles.length; j++) {
                    const other = generatedCircles[j];
                    const dx = (x + size / 2) - (other.x + other.size / 2);
                    const dy = (y + size / 2) - (other.y + other.size / 2);
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < (size / 2 + other.size / 2) + 10) { // +10px de margen
                        overlapping = true;
                        break;
                    }
                }
                attempts++;
            }

            if (!overlapping) {
                generatedCircles.push({
                    id: i,
                    x,
                    y,
                    size,
                    color: 'var(--primary-color-light)',
                });
            }
        }
        
        setCircles(generatedCircles);
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
            
            // Intentar login. El backend manejará si es usuario propietario o empleado.
            const normalizedEmail = formDataLogin.email.trim().toLowerCase();
            let result = await UserService.login({
                email: normalizedEmail,
                password: formDataLogin.password
            });
            
            if (!result.success && result.message === 'No tiene contraseña establecida') {
                if (result.data?.personal) {
                    setEmpleadoParaContrasena(result.data.personal);
                    setIsOpenContrasenaEmpleado(true);
                    setLoading(false);
                    return; // Terminamos aquí, el flujo sigue en el modal
                }
            }

            if (result.success) {
                navigate('/home', { replace: true });
                if (remember) {
                    UserService.saveRememberPreference(true);
                    localStorage.setItem('savedEmail', formDataLogin.email);
                } else {
                    UserService.saveRememberPreference(false);
                    localStorage.removeItem('savedEmail');
                }
                
                // Guardar empresa_id para que el contexto pueda cargar los datos correctamente
                const empresaId = result.data?.personal?.empresa_id || result.data?.user?.empresa_id;
                if (empresaId) {
                    localStorage.setItem('empresa_id', empresaId);
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
            console.error('❌ Error al loguear:', error);
            const errorText = error.message || 'No se pudo conectar con el servidor. Revisa tu conexión a internet e intenta nuevamente.';
            setMensajeState({ visible: true, type: 'error', title: 'Error', text: errorText, duration: 5000 });
        }
    };

    return (
        <div className={styles.loginContainer}>
            {circles.map(circle => (
                <div
                    key={circle.id}
                    className={styles.staticCircle}
                    style={{
                        left: `${circle.x}px`,
                        top: `${circle.y}px`,
                        width: `${circle.size}px`,
                        height: `${circle.size}px`,
                        backgroundColor: circle.color,
                    }}
                />
            ))}
            
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
                        className='btn-primary'
                        loading={loading}
                        label='Iniciar Sesión'
                    />
                </form>

                <p className={styles.login_footer}>
                    <span className={styles.login_footer_span} onClick={() => setIsOpenContraseñaReset(true)}>
                        ¿Olvidaste tu contraseña?
                    </span>
                </p>

                <ContraseñaReset isOpen={isOpenContraseñaReset} setIsOpen={setIsOpenContraseñaReset} />
                
                <ContrasenaEmpleado 
                    isOpen={isOpenContrasenaEmpleado}
                    onClose={() => setIsOpenContrasenaEmpleado(false)}
                    personalId={empleadoParaContrasena?.id}
                    email={empleadoParaContrasena?.email || empleadoParaContrasena?.codigo || formDataLogin.email}
                    onLoginSuccess={(employeeData) => {
                        navigate('/home', { replace: true });
                        if (remember) {
                            UserService.saveRememberPreference(true);
                            localStorage.setItem('savedEmail', formDataLogin.email);
                        }
                        
                        const empresaId = employeeData?.empresa_id || empleadoParaContrasena?.empresa_id;
                        if (empresaId) {
                            localStorage.setItem('empresa_id', empresaId);
                        }
                        
                        window.dispatchEvent(new Event('local-login'));
                    }}
                />
            </div>
        </div>
    );
};

export default Login;