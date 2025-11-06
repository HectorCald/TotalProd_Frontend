import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import InputNormal from '../../common/InputNormal';
import Boton from '../../common/Boton';
import MensajeError from '../../common/MensajeError';
import ItemView from '../../common/ItemView';
import personalService from '../../../services/personalService';

// Clave para localStorage
const SAVED_EMPLOYEES_KEY = 'savedEmployees';

// Función para obtener empleados guardados
const getSavedEmployees = () => {
    try {
        const saved = localStorage.getItem(SAVED_EMPLOYEES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error al leer empleados guardados:', error);
        return [];
    }
};

// Función para guardar empleado
const saveEmployee = (employeeData) => {
    try {
        const saved = getSavedEmployees();
        const employeeInfo = {
            codigo: employeeData.codigo,
            nombre: `${employeeData.first_name} ${employeeData.last_name}`,
            cargo: employeeData.cargo || 'Sin cargo',
            id: employeeData.id
        };

        // Verificar si ya existe (por código)
        const existingIndex = saved.findIndex(emp => emp.codigo === employeeInfo.codigo);

        if (existingIndex >= 0) {
            // Actualizar el existente
            saved[existingIndex] = employeeInfo;
        } else {
            // Agregar nuevo
            saved.push(employeeInfo);
        }

        // Limitar a los últimos 10 empleados
        const limited = saved.slice(-10);
        localStorage.setItem(SAVED_EMPLOYEES_KEY, JSON.stringify(limited));
    } catch (error) {
        console.error('Error al guardar empleado:', error);
    }
};

function LoginEmpleado({ isOpen, setIsOpen, onLoginSuccess }) {
    const [step, setStep] = useState(1); // 1: código, 2: contraseña
    const [codigo, setCodigo] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [personalData, setPersonalData] = useState(null);
    const [savedEmployees, setSavedEmployees] = useState([]);

    // Cargar empleados guardados al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const saved = getSavedEmployees();
            setSavedEmployees(saved);
        }
    }, [isOpen]);

    // Función para seleccionar empleado guardado
    const handleSelectSavedEmployee = async (employee) => {
        setCodigo(employee.codigo);
        setLoading(true);
        try {
            const response = await personalService.validateEmployeeCode(employee.codigo);

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

                // Guardar empleado en localStorage para acceso rápido
                if (response.data.personal) {
                    saveEmployee({
                        ...response.data.personal,
                        codigo: codigo
                    });
                }

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
                        {savedEmployees.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                                <p className={styles.subTitle} style={{ marginBottom: '10px' }}>EMPLEADOS RECIENTES</p>
                                {savedEmployees.map((employee, index) => (
                                    <ItemView
                                        key={`${employee.codigo}-${index}`}
                                        title={employee.nombre}
                                        description={employee.cargo}
                                        onClick={() => handleSelectSavedEmployee(employee)}
                                        arrow={true}
                                    />
                                ))}
                            </div>
                        )}

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
                            description={personalData.cargo || 'Sin cargo'}
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
                            description={personalData.cargo || 'Sin cargo'}
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
