import React, { useState } from 'react';
import styles from '../../../styles/paso.module.css';
import LogoAnimation from '../../common/LogoAnimation';
import ComponenteFull from '../../common/ComponenteFull';
import Boton from '../../common/Boton';
import { useUser } from '../../../context/UserContext';
import EmpresaService from '../../../services/empresaService';

const PasoTipo = ({ onComplete }) => {
    const { user, loadUserData, setUserFromService } = useUser();
    const [selectedTipo, setSelectedTipo] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleTipoChange = (tipo) => {
        // Si se hace clic en el mismo tipo que ya está seleccionado, deseleccionarlo
        // Si se hace clic en un tipo diferente, seleccionar el nuevo (el anterior se deselecciona automáticamente)
        if (selectedTipo === tipo) {
            setSelectedTipo(null);
        } else {
            setSelectedTipo(tipo);
        }
    };

    const handleContinue = async () => {
        if (!selectedTipo || !user?.empresa_id) {
            return;
        }

        setLoading(true);
        try {
            const response = await EmpresaService.updateTipo(user.empresa_id, selectedTipo);
            
            if (response.success) {
                // Recargar datos del usuario para obtener el tipo actualizado
                const updatedUser = await loadUserData(user.id);
                if (updatedUser.success) {
                    // Llamar callback si existe
                    if (onComplete) {
                        onComplete();
                    }
                }
            } else {
                console.error('Error al actualizar tipo:', response.message);
                alert('Error al guardar el tipo. Por favor, intenta nuevamente.');
            }
        } catch (error) {
            console.error('Error al guardar tipo:', error);
            alert('Error al guardar el tipo. Por favor, intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const nombreUsuario = user ? `${user.firstName} ${user.lastName}` : 'Usuario';
    const nombreEmpresa = user?.empresa?.name || 'Tu empresa';

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <div className={styles.logoContainer}>
                    <LogoAnimation />
                </div>
                
                <div className={styles.content}>
                    <h1 className={styles.welcomeTitle}>
                        ¡Bienvenid@, {nombreUsuario}!
                    </h1>
                    
                    <p className={styles.companyName}>
                        {nombreEmpresa}
                    </p>

                    <h2 className={styles.subtitle}>
                        Selecciona el tipo de Aplicación
                    </h2>

                    <div className={styles.optionsContainer}>
                        <ComponenteFull
                            title="Ventas"
                            type="checkbox"
                            checked={selectedTipo === 'ventas'}
                            onChange={(isChecked) => {
                                if (isChecked) {
                                    handleTipoChange('ventas');
                                } else {
                                    handleTipoChange(null);
                                }
                            }}
                            icon="cart"
                            subtitle="Gestiona ventas y distribucion."
                        />
                        <ComponenteFull
                            title="Ventas y Producción"
                            type="checkbox"
                            checked={selectedTipo === 'ventas_produccion'}
                            onChange={(isChecked) => {
                                if (isChecked) {
                                    handleTipoChange('ventas_produccion');
                                } else {
                                    handleTipoChange(null);
                                }
                            }}
                            icon="factory"
                            subtitle="Gestiona ventas y producción."
                        />
                    </div>

                    <div className={styles.buttonContainer}>
                        <Boton
                            label="Continuar"
                            onClick={handleContinue}
                            className="btn-original"
                            loading={loading}
                            disabled={!selectedTipo || loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasoTipo;

