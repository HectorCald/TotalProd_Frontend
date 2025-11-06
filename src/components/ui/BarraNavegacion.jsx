import React, { useState } from 'react';
import styles from './BarraNavegacion.module.css';
import { BoxIcon } from 'boxicons-react';
import Inicio from '../screens/Inicio';
import InicioEmpleado from '../screens/InicioEmpleado';
import Explorar from '../screens/Explorar';
import UsuarioScreen from '../screens/UsuarioScreen';
import Notification from '../common/Notification';

function BarraNavegacion({ activeScreen, onScreenChange, onViewOpen, isEmployee, employee, onMainModuleClick, hasUserData = true }) {
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'warning',
        text: ''
    });
    const [isUsuarioOpen, setIsUsuarioOpen] = useState(false);

    // Solo mostrar configuración si hay datos de usuario/empleado
    const navigationItems = isEmployee ? [
        { id: 'inicio', icon: 'home', title: '' },
        ...(hasUserData ? [{ id: 'configuracion', icon: 'cog', title: '' }] : []),
    ] : [
        { id: 'inicio', icon: 'home', title: '' },
        { id: 'explorar', icon: 'category', title: '' },
        ...(hasUserData ? [{ id: 'configuracion', icon: 'cog', title: '' }] : []),
    ];

    const activeIndex = Math.max(0, navigationItems.findIndex((item) => item.id === activeScreen));

    const handleNavigation = (screenId) => {
        if (screenId === 'configuracion') {
            onScreenChange('configuracion');
        } else {
            onScreenChange(screenId);
        }
    };

    const renderScreen = () => {
        switch (activeScreen) {
            case 'inicio':
                return isEmployee ? (
                    <InicioEmpleado 
                        employee={employee} 
                        onMainModuleClick={onMainModuleClick} 
                    />
                ) : (
                    <Inicio onViewOpen={onViewOpen} />
                );
            case 'explorar':
                return <Explorar />;
            case 'configuracion':
                return <UsuarioScreen />;
            default:
                return isEmployee ? (
                    <InicioEmpleado 
                        employee={employee} 
                        onMainModuleClick={onMainModuleClick} 
                    />
                ) : (
                    <Inicio onViewOpen={onViewOpen} />
                );
        }
    };

    return (
        <>
            <div
                className={styles.barraNavegacion}
                style={{
                    '--active-index': activeIndex,
                    '--item-size': '50px',
                    '--gap': '10px',
                    '--pad-x': '8px',
                }}
            >
                <span className={styles.highlight} aria-hidden="true" />
                {navigationItems.map((item) => (
                    <div 
                        key={item.id}
                        className={`${styles.opcion} ${activeScreen === item.id ? styles.active : ''}`}
                        onClick={() => handleNavigation(item.id)}
                    >
                        <BoxIcon 
                            name={item.icon} 
                            className={`${styles.icon} ${activeScreen === item.id ? styles.activeIcon : ''}`} 
                        />
                        <p className={`${styles.title} ${activeScreen === item.id ? styles.activeTitle : ''}`}>
                            {item.title}
                        </p>
                    </div>
                ))}
            </div>
            {renderScreen()}
            
            {/* Modal de Usuario removido: ahora es una pantalla */}
            
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </>
    );
}

export default BarraNavegacion;