import React, { useState } from 'react';
import styles from './BarraNavegacion.module.css';
import { BoxIcon } from 'boxicons-react';
import Inicio from '../screens/Inicio';
import InicioEmpleado from '../screens/InicioEmpleado';
import Explorar from '../screens/Explorar';
import Usuario from '../views/usuario/Usuario';
import Notification from '../common/Notification';

function BarraNavegacion({ activeScreen, onScreenChange, onViewOpen, isEmployee, employee, onMainModuleClick }) {
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'warning',
        text: ''
    });
    const [isUsuarioOpen, setIsUsuarioOpen] = useState(false);

    const navigationItems = isEmployee ? [
        { id: 'inicio', icon: 'home', title: '' },
        { id: 'configuracion', icon: 'cog', title: '' },
    ] : [
        { id: 'inicio', icon: 'home', title: '' },
        { id: 'explorar', icon: 'category', title: '' },
        { id: 'configuracion', icon: 'cog', title: '' },
    ];

    const handleNavigation = (screenId) => {
        if (screenId === 'configuracion') {
            setIsUsuarioOpen(true);
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
            <div className={styles.barraNavegacion}>
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
            
            {/* Modal de Usuario */}
            <Usuario
                isOpen={isUsuarioOpen}
                setIsOpen={setIsUsuarioOpen}
            />
            
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </>
    );
}

export default BarraNavegacion;