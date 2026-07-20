import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Input from '../../../../components/common/inputs/Input';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import personalService from '../../../../services/personalService';

const ContrasenaEmpleado = ({ isOpen, onClose, personalId, email, onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({ password: false, confirmPassword: false });

    useEffect(() => {
        if (!isOpen) return;
        setPassword('');
        setConfirmPassword('');
        setError('');
        setFieldErrors({ password: false, confirmPassword: false });
    }, [isOpen]);

    const handleConfirm = async () => {
        const errors = {
            password: !password.trim(),
            confirmPassword: !confirmPassword.trim()
        };

        if (errors.password || errors.confirmPassword) {
            setFieldErrors(errors);
            return;
        }

        if (password.length < 8) {
            setFieldErrors({ ...errors, password: 'La contraseña debe tener al menos 8 caracteres.' });
            return;
        }

        if (password !== confirmPassword) {
            setFieldErrors({ ...errors, confirmPassword: 'Las contraseñas no coinciden.' });
            return;
        }

        setFieldErrors({ password: false, confirmPassword: false });
        setError('');
        setLoading(true);

        try {
            const response = await personalService.setPassword(personalId, password);
            if (response.success) {
                const loginResponse = await personalService.loginEmployee(email, password);
                if (loginResponse.success) {
                    onLoginSuccess(loginResponse.data);
                    onClose();
                } else {
                    setError(loginResponse.message || 'Contraseña establecida, pero hubo un error al iniciar sesión.');
                }
            } else {
                setError(response.message || 'No se pudo establecer la contraseña. Intenta nuevamente.');
            }
        } catch (err) {
            console.error('Error al establecer contraseña:', err);
            setError('Error de conexión. Revisa tu conexión e intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={() => { if (!loading) onClose(); }}
            title="Establecer contraseña"
            confirmText="Establecer y Entrar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        >
            <div style={{ padding: '0 10px 10px 10px' }}>
                <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                    Aún no tienes una contraseña establecida. Por favor, crea una nueva para asegurar tu cuenta.
                </p>
                {error && <Mensaje type="error" message={error} onClose={() => setError('')} />}
                <div style={{ marginBottom: '15px' }}>
                    <Input
                        type="password"
                        label="Nueva contraseña"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setFieldErrors(prev => ({ ...prev, password: false }));
                            if (error) setError('');
                        }}
                        readOnly={loading}
                        required
                        error={fieldErrors.password}
                    />
                </div>
                
                    <Input
                        type="password"
                        label="Confirmar contraseña"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setFieldErrors(prev => ({ ...prev, confirmPassword: false }));
                            if (error) setError('');
                        }}
                        readOnly={loading}
                        required
                        error={fieldErrors.confirmPassword}
                    />
                
            </div>
        </ModalCentro>
    );
};

export default ContrasenaEmpleado;
