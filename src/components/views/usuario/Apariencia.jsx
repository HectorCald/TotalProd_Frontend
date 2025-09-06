import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Checkbox from '../../common/Checkbox';
import { useState, useEffect } from 'react';

function Apariencia({ isOpen, setIsOpen}) {
    const [theme, setTheme] = useState('dark'); // 'dark', 'light', or 'system'
    
    // Cargar tema guardado al iniciar
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        applyTheme(savedTheme);
    }, []);

    // Función para aplicar el tema
    const applyTheme = (selectedTheme) => {
        let finalTheme = selectedTheme;
        
        if (selectedTheme === 'system') {
            // Detectar preferencia del sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            finalTheme = prefersDark ? 'dark' : 'light';
        }
        
        // Aplicar tema al documento
        document.documentElement.setAttribute('data-theme', finalTheme);
        localStorage.setItem('theme', selectedTheme);
    };

    // Función para cambiar tema
    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        applyTheme(newTheme);
    };
    

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Apariencia</h1>
                <div className={styles.content}>
                    <Checkbox
                        icon={'moon'}
                        title="Modo oscuro"
                        subtitle="Siempre en modo oscuro"
                        checked={theme === 'dark'}
                        onChange={(isChecked) => {
                            if (isChecked) handleThemeChange('dark');
                        }}
                    />
                    <Checkbox
                        icon={'sun'}
                        title="Modo claro"
                        subtitle="Siempre en modo claro"
                        checked={theme === 'light'}
                        onChange={(isChecked) => {
                            if (isChecked) handleThemeChange('light');
                        }}
                    />
                    <Checkbox
                        icon={'desktop'}
                        title="Automático"
                        subtitle="Usar la configuración del sistema"
                        checked={theme === 'system'}
                        onChange={(isChecked) => {
                            if (isChecked) handleThemeChange('system');
                        }}
                    />
                </div>
            </div>
        </View>
    );
}
export default Apariencia;