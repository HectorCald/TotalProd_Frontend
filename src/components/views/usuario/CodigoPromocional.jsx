import React, { useEffect, useState } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputNormal from '../../common/InputNormal';
import Boton from '../../common/Boton';
import Notification from '../../common/Notification';
import Dato from '../../common/Dato';
import codigoPromocionalService from '../../../services/codigoPromocionalService';
import Checkbox from '../../common/Checkbox';

function CodigoPromocional({ isOpen, setIsOpen }) {
    // Estado para habilitar/deshabilitar el botón
    const [disabled, setDisabled] = useState(true);
    const [loading, setLoading] = useState(false);

    // Estado para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Estado para almacenar el formulario de codigo promocional
    const [formCodigoPromocional, setFormCodigoPromocional] = useState({
        codigoPromocional: '',
    });

    // Estado para el código validado
    const [codigoValidado, setCodigoValidado] = useState(null);

    // Estado para confirmar aplicación del código
    const [confirmarAplicacion, setConfirmarAplicacion] = useState(false);

    useEffect(() => {
        setFormCodigoPromocional({
            codigoPromocional: '',
        });
        setCodigoValidado(null);
        setConfirmarAplicacion(false);
    }, [isOpen])


    // Verificar si todos los campos están llenos para habilitar el botón
    useEffect(() => {
        if (codigoValidado) {
            // Si hay código validado, el botón se habilita solo si está confirmado
            setDisabled(!confirmarAplicacion || loading);
        } else {
            // Si no hay código validado, se habilita si hay texto
            const allFieldsFilled = formCodigoPromocional.codigoPromocional.trim() !== '';
            setDisabled(!allFieldsFilled || loading);
        }
    }, [formCodigoPromocional, loading, codigoValidado, confirmarAplicacion]);

    // Función para manejar el cambio de los campos del formulario
    const handleInputChange = (field, value) => {
        // Remover espacios del código
        const cleanValue = field === 'codigoPromocional' ? value.replace(/\s/g, '') : value;
        setFormCodigoPromocional(prev => ({
            ...prev,
            [field]: cleanValue,
        }));
        // Limpiar código validado y confirmación cuando cambia el input
        setCodigoValidado(null);
        setConfirmarAplicacion(false);
    };

    // Función para validar código
    const handleValidarCodigo = async () => {
        if (!formCodigoPromocional.codigoPromocional.trim()) {
            mostrarNotificacion('error', 'Ingresa un código promocional');
            return;
        }

        setLoading(true);
        try {
            const response = await codigoPromocionalService.validarCodigo(formCodigoPromocional.codigoPromocional);

            if (response.success) {
                setCodigoValidado(response.data);
                mostrarNotificacion('success', `Código válido! Plan: ${response.data.plan.name} por ${response.data.duration} meses`);
            } else {
                mostrarNotificacion('error', response.message);
            }
        } catch (error) {
            console.error('Error validando código:', error);
            mostrarNotificacion('error', 'Error al validar el código promocional');
        } finally {
            setLoading(false);
        }
    };

    const handleGuardar = async () => {
        if (!codigoValidado) {
            mostrarNotificacion('error', 'Primero valida el código promocional');
            return;
        }

        setLoading(true);
        try {
            const response = await codigoPromocionalService.aplicarCodigo(codigoValidado.codigoId);

            if (response.success) {
                mostrarNotificacion('success', '¡Código promocional aplicado correctamente!');
                setFormCodigoPromocional({
                    codigoPromocional: '',
                });
                setCodigoValidado(null);
                setConfirmarAplicacion(false);
            } else {
                mostrarNotificacion('error', response.message);
            }
        } catch (error) {
            console.error('Error aplicando código:', error);
            mostrarNotificacion('error', 'Error al aplicar el código promocional');
        } finally {
            setLoading(false);
        }
    }
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}isMainView={true}>
            <HeaderView onBack={() => setIsOpen(false)} title='Codigo Promocional' />
            <div className={styles.container}>
                <p className={styles.subTitle}>Ingresa el codigo promocional para reclamar tu recompensa</p>
                <InputNormal
                    id='codigoPromocional'
                    icon='purchase-tag-alt'
                    tipo='text'
                    value={formCodigoPromocional.codigoPromocional}
                    placeholder='Codigo Promocional'
                    onChange={(e) => handleInputChange('codigoPromocional', e.target.value)}
                />
                {codigoValidado && (
                    <div className={styles.content} style={{ padding: '10px  15px' }}>
                        <Checkbox
                            title={`Plan: ${codigoValidado.plan.name}`}
                            subtitle={`Duración: ${codigoValidado.duration} meses.`}
                            checked={confirmarAplicacion}
                            onChange={setConfirmarAplicacion}
                            icon="star"
                        />
                    </div>
                )}

                <Boton
                    className='btn-original'
                    label={codigoValidado ? 'Aplicar Código' : 'Validar Código'}
                    style={{ marginTop: 'auto' }}
                    onClick={codigoValidado ? () => handleGuardar() : () => handleValidarCodigo()}
                    disabled={disabled}
                    loading={loading}
                />
            </div>
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}
export default CodigoPromocional;