import styles from './BarraNavegacion.module.css';
import { BoxIcon } from 'boxicons-react';
import Inicio from '../screens/Inicio';
import InicioEmpleado from '../screens/InicioEmpleado';
import Destacados from '../screens/Destacados';
import Balance from '../screens/Balance';
import Reportes from '../screens/Reportes';
import Explorar from '../screens/Explorar';

function BarraNavegacion({ activeScreen, onScreenChange, onViewOpen, isEmployee, employee, onMainModuleClick }) {
    const allNavigationItems = [
        { id: 'inicio', icon: 'home', title: 'Inicio' },
        { id: 'destacados', icon: 'star', title: 'Destacados' },
        { id: 'balance', icon: 'trending-up', title: 'Balance' },
        { id: 'reportes', icon: 'receipt', title: 'Reportes' },
        { id: 'explorar', icon: 'category', title: 'Explorar' }
    ];

    // Filtrar opciones de navegación para empleados (quitar "Explorar")
    const navigationItems = isEmployee 
        ? allNavigationItems.filter(item => item.id !== 'explorar')
        : allNavigationItems;

    const handleNavigation = (screenId) => {
        onScreenChange(screenId);
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
            case 'destacados':
                return <Destacados />;
            case 'balance':
                return <Balance />;
            case 'reportes':
                return <Reportes />;
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
        </>
    );
}

export default BarraNavegacion;