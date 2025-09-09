import styles from './BarraNavegacion.module.css';
import { useState } from 'react';
import { BoxIcon } from 'boxicons-react';
import Menu from '../views/menu/Menu';

function BarraNavegacion({ activeScreen, onScreenChange }) {
    const [isOpenMenu, setIsOpenMenu] = useState(false);
    
    const navigationItems = [
        { id: 'inicio', icon: 'home', title: 'Inicio' },
        { id: 'destacados', icon: 'star', title: 'Destacados' },
        { id: 'buscar', icon: 'search', title: 'Buscar' },
        { id: 'reportes', icon: 'receipt', title: 'Reportes' },
        { id: 'explorar', icon: 'category', title: 'Explorar' }
    ];

    const handleNavigation = (screenId) => {
        if (screenId === 'explorar') {
            setIsOpenMenu(true);
        } else {
            onScreenChange(screenId);
        }
    };

    return (
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
            <Menu isOpen={isOpenMenu} setIsOpen={setIsOpenMenu} />
        </div>
    );
}

export default BarraNavegacion;