import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import { useState } from 'react';

import ModuloExtra from '../../common/ModuloExtra';
import { EXTRAS } from '../../../constants/extras';
import Precios from '../precios/Precios';
import Sucursales from '../sucursales/Sucursales';
import Notification from '../../common/Notification';


function Menu({ isOpen, setIsOpen, onViewChange }) {
    const [activeView, setActiveView] = useState(null);
    const [isOpenPrecios, setIsOpenPrecios] = useState(false);
    const [isOpenSucursales, setIsOpenSucursales] = useState(false);
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'info',
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
    
    const handleViewOpen = (viewName) => {
        if (viewName === 'precios') {
            setIsOpenPrecios(true);
        } else if (viewName === 'sucursales') {
            setIsOpenSucursales(true);
        } else {
            // Mostrar notificación para módulos no implementados
            mostrarNotificacion('info', `La función "${viewName}" estará disponible próximamente`);
        }
    };

    const handleViewClose = () => {
        setActiveView(null);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Explorar</h1>
                <p className={styles.subTitle}>OTRAS FUNCIONES</p>
                <div className={styles.content} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '10px',justifyContent: 'flex-start'}}>
                    {EXTRAS.map((extra) => (
                        <ModuloExtra
                            key={extra.title}
                            title={extra.title}
                            image={extra.image}
                            onClick={() => handleViewOpen(extra.view)}
                        />
                    ))}
                </div>
            </div>
            <Precios isOpen={isOpenPrecios} setIsOpen={setIsOpenPrecios} />
            <Sucursales isOpen={isOpenSucursales} setIsOpen={setIsOpenSucursales} />
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>

    );
}
export default Menu;