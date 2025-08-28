import styles from './Apariencia.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Checkbox from '../../common/Checkbox';
import { useState } from 'react';

function Apariencia({ isOpen, setIsOpen}) {
    const [theme, setTheme] = useState('system'); // 'dark', 'light', or 'system'
    
    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={handleClose} />
            <div className={styles.container}>
                <h1 className={styles.title}>Apariencia</h1>
                <p className={styles.subTitle}></p>
                <div className={styles.content}>
                    <Checkbox
                        icon={'moon'}
                        title="Modo oscuro"
                        subtitle="Siempre en modo oscuro"
                        checked={theme === 'dark'}
                        onChange={(checked) => {
                            if (checked) setTheme('dark');
                        }}
                    />
                    <Checkbox
                        icon={'sun'}
                        title="Modo claro"
                        subtitle="Siempre en modo claro"
                        checked={theme === 'light'}
                        onChange={(checked) => {
                            if (checked) setTheme('light');
                        }}
                    />
                    <Checkbox
                        icon={'desktop'}
                        title="Automático"
                        subtitle="Usar la configuración del sistema"
                        checked={theme === 'system'}
                        onChange={(checked) => {
                            if (checked) setTheme('system');
                        }}
                    />
                </div>
            </div>
        </View>
    );
}
export default Apariencia;