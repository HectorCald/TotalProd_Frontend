import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/old/HeaderModal';
import Input from '../../common/inputs/Input';
import Boton from '../../common/botones/Boton';
import ItemView from '../../common/old/ItemView';
import personalService from '../../../services/personalService';
import { useToast } from '../../../context/ToastContext';

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
    const { showWarning, showDanger } = useToast();
    const [step, setStep] = useState(1);
    const [codigo, setCodigo] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorCodigo, setErrorCodigo] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [errorConfirmPassword, setErrorConfirmPassword] = useState('');
    const [personalData, setPersonalData] = useState(null);
    const [savedEmployees, setSavedEmployees] = useState([]);
    const [isCodigoEditable, setIsCodigoEditable] = useState(true);

    // Cargar empleados guardados al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const saved = getSavedEmployees();
            setSavedEmployees(saved);
            setIsCodigoEditable(true);
        }
    }, [isOpen]);

    // Función para seleccionar empleado guardado
    const handleSelectSavedEmployee = async (employee) => {
        setCodigo(employee.codigo);
        setIsCodigoEditable(false);
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
                showDanger('Error', response.message || 'Código de empleado no válido. Verifica e intenta nuevamente.', 5000, false);
            }
        } catch (error) {
            console.error('Error al validar código:', error);
            showDanger('Error', 'Error de conexión. Revisa tu conexión e intenta nuevamente.', 5000, false);
        } finally {
            setLoading(false);
        }
    };

    const handleValidateCode = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!codigo.trim()) {
            setErrorCodigo('El código es obligatorio');
            showWarning('Validación', 'Ingresa tu código de empleado.');
            return;
        }
        if (codigo.length < 8) {
            setErrorCodigo('El código debe tener al menos 8 caracteres');
            showWarning('Validación', 'El código debe tener al menos 8 caracteres.');
            return;
        }
        setErrorCodigo('');
        setLoading(true);
        try {
            const response = await personalService.validateEmployeeCode(codigo.trim());
            if (response.success) {
                if (response.data.hasPassword) {
                    setPersonalData(response.data.personal);
                    setStep(2);
                } else {
                    setPersonalData(response.data.personal);
                    setStep(3);
                }
            } else {
                showDanger('Error', response.message || 'Código de empleado no válido. Verifica e intenta nuevamente.', 5000, false);
            }
        } catch (error) {
            console.error('Error al validar código:', error);
            showDanger('Error', 'Error de conexión. Revisa tu conexión e intenta nuevamente.', 5000, false);
        } finally {
            setLoading(false);
        }
    };

    const handleSetPassword = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!password.trim()) {
            setErrorPassword('La contraseña es obligatoria');
            setErrorConfirmPassword('');
            showWarning('Validación', 'Ingresa una contraseña.');
            return;
        }
        if (password.length < 8) {
            setErrorPassword('La contraseña debe tener al menos 8 caracteres');
            setErrorConfirmPassword('');
            showWarning('Validación', 'La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (!confirmPassword.trim()) {
            setErrorPassword('');
            setErrorConfirmPassword('Confirma tu contraseña');
            showWarning('Validación', 'Confirma tu contraseña.');
            return;
        }
        if (password !== confirmPassword) {
            setErrorConfirmPassword('Las contraseñas no coinciden');
            showWarning('Validación', 'Las contraseñas no coinciden.');
            return;
        }
        setErrorPassword('');
        setErrorConfirmPassword('');
        setLoading(true);
        try {
            const response = await personalService.setPassword(personalData.id, password);
            if (response.success) {
                setStep(2);
            } else {
                showDanger('Error', response.message || 'No se pudo establecer la contraseña. Intenta nuevamente.', 5000, false);
            }
        } catch (error) {
            console.error('Error al establecer contraseña:', error);
            showDanger('Error', 'Error de conexión. Revisa tu conexión e intenta nuevamente.', 5000, false);
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeLogin = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!password.trim()) {
            setErrorPassword('La contraseña es obligatoria');
            showWarning('Validación', 'Ingresa tu contraseña.');
            return;
        }
        setErrorPassword('');
        setLoading(true);
        try {
            const response = await personalService.loginEmployee(codigo, password);
            if (response.success) {
                if (response.data.personal) {
                    saveEmployee({ ...response.data.personal, codigo: codigo });
                }
                if (response.data.personal && response.data.personal.rastrear) {
                    try {
                        const locationResponse = await personalService.getCurrentLocation();
                        if (locationResponse.success) {
                            await personalService.updateLocation(
                                response.data.personal.id,
                                locationResponse.data.latitude,
                                locationResponse.data.longitude
                            );
                        }
                    } catch (locationError) {
                        console.error('Error al obtener ubicación:', locationError);
                    }
                }
                onLoginSuccess(response.data);
                setIsOpen(false);
            } else {
                showDanger('Error', response.message || 'La contraseña ingresada no es correcta. Verifica que estés usando la contraseña de tu cuenta e intenta nuevamente.', 5000, false);
            }
        } catch (error) {
            console.error('Error en login de empleado:', error);
            showDanger('Error', 'Error de conexión. Revisa tu conexión e intenta nuevamente.', 5000, false);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setCodigo('');
        setIsCodigoEditable(true);
        setPassword('');
        setConfirmPassword('');
        setErrorCodigo('');
        setErrorPassword('');
        setErrorConfirmPassword('');
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
                {step === 1 && (
                    <form onSubmit={handleValidateCode}>
                        {savedEmployees.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                                <p className={styles.subTitle} style={{ marginBottom: '10px' }}>EMPLEADOS RECIENTES</p>
                                {savedEmployees.map((employee, index) => (
                                    <ItemView
                                        key={`${employee.codigo}-${index}`}
                                        title={employee.nombre}
                                        description={employee.cargo}
                                        icon="user"
                                        colorIcon="gris"
                                        onClick={() => handleSelectSavedEmployee(employee)}
                                        arrow={true}
                                    />
                                ))}
                            </div>
                        )}
                        <p className={styles.subTitle}>INGRESA TU CÓDIGO DE EMPLEADO</p>
                        <Input
                            type="text"
                            label="Código de empleado"
                            value={codigo}
                            onChange={(e) => {
                                if (isCodigoEditable) {
                                    setCodigo(e.target.value);
                                    setErrorCodigo('');
                                }
                            }}
                            readOnly={loading || !isCodigoEditable}
                            required
                            error={errorCodigo || undefined}
                            onClearError={() => setErrorCodigo('')}
                        />
                        <div className={styles.space}></div>
                        <div className={styles.buttons}>
                            <Boton type="submit" className="btn-original" label="Validar Código" loading={loading} />
                        </div>
                    </form>
                )}

                {step === 2 && personalData && (
                    <form onSubmit={handleEmployeeLogin}>
                        <p className={styles.subTitle}>INICIAR SESIÓN</p>
                        <ItemView
                            title={`${personalData.first_name} ${personalData.last_name}`}
                            description={personalData.cargo || 'Sin cargo'}
                        />
                        <Input
                            type="password"
                            label="Contraseña"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrorPassword('');
                            }}
                            readOnly={loading}
                            required
                            error={errorPassword || undefined}
                            onClearError={() => setErrorPassword('')}
                        />
                        <div className={styles.space}></div>
                        <div className={styles.buttons}>
                            <Boton
                                type="button"
                                className="btn-default"
                                label="Cambiar Código"
                                onClick={() => {
                                    setStep(1);
                                    setPassword('');
                                    setPersonalData(null);
                                    setCodigo('');
                                    setIsCodigoEditable(true);
                                }}
                            />
                            <Boton type="submit" className="btn-original" label="Iniciar Sesión" loading={loading} />
                        </div>
                    </form>
                )}

                {step === 3 && personalData && (
                    <form onSubmit={handleSetPassword}>
                        <p className={styles.subTitle}>ESTABLECER CONTRASEÑA</p>
                        <ItemView
                            title={`${personalData.first_name} ${personalData.last_name}`}
                            description={personalData.cargo || 'Sin cargo'}
                            icon="user"
                        />
                        <Input
                            type="password"
                            label="Nueva contraseña"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrorPassword('');
                            }}
                            readOnly={loading}
                            required
                            error={errorPassword || undefined}
                            onClearError={() => setErrorPassword('')}
                        />
                        <Input
                            type="password"
                            label="Confirmar contraseña"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setErrorConfirmPassword('');
                            }}
                            readOnly={loading}
                            required
                            error={errorConfirmPassword || undefined}
                            onClearError={() => setErrorConfirmPassword('')}
                        />
                        <div className={styles.buttons}>
                            <Boton type="submit" className="btn-original" label="Establecer Contraseña" loading={loading} />
                            <Boton
                                type="button"
                                className="btn-default"
                                label="Cambiar Código"
                                onClick={() => {
                                    setStep(1);
                                    setPassword('');
                                    setConfirmPassword('');
                                    setPersonalData(null);
                                    setCodigo('');
                                    setIsCodigoEditable(true);
                                }}
                            />
                        </div>
                    </form>
                )}
            </div>
        </ViewModal>
    );
}

export default LoginEmpleado;
