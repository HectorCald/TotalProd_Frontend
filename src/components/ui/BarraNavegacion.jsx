import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './BarraNavegacion.module.css';
import { BoxIcon } from 'boxicons-react';
import Inicio from '../screens/Inicio';
import InicioEmpleado from '../screens/InicioEmpleado';
import Explorar from '../screens/Explorar';
import UsuarioScreen from '../screens/UsuarioScreen';
import BalanceScreen from '../screens/BalanceScreen';
import Notification from '../common/Notification';
import AlmacenGeneral from '../views/almacen-general/AlmacenGeneral';
import AlmacenMedioGeneral from '../views/almacen-general/AlmacenMedioGeneral';
import AlmacenAcopio from '../views/almacen-acopio/AlmacenAcopio';
import AlmacenMedio from '../views/almacen-acopio/AlmacenMedio';
import AlmacenGeneralAuxiliar from '../views/almacen-general-auxiliar/AlmacenGeneral-Auxiliar';
import AlmacenAcopioAuxiliar from '../views/almacen-acopio-auxiliar/AlmacenAcopio-Auxiliar';
import PanelMovimientos from '../views/movimientos/PanelMovimientos';
import MovimientosMedio from '../views/movimientos/MovimientosMedio';
import PanelPedidos from '../views/pedidos/PanelPedidos';
import PedidosMedio from '../views/pedidos/PedidosMedio';
import Clientes from '../views/clientes/Clientes';
import Proveedores from '../views/proveedores/Proveedores';
import Precios from '../views/precios/Precios';
import Gastos from '../views/gastos/PanelGastos';
import Deudas from '../views/deudas/PanelDeudas';
import Reportes from '../views/reportes/Reportes';
import Balance from '../views/balance/Balance';
import FormularioProduccion from '../views/damabrava/produccion/FormularioProduccion';
import VerificarProduccion from '../views/damabrava/produccion/VerificarProduccion';
import MiProduccion from '../views/damabrava/produccion/MiProduccion';
import Reglas from '../views/damabrava/reglas/Reglas';
import PanelConteos from '../views/conteos/PanelConteos';
import ConteosMedio from '../views/conteos/ConteosMedio';
import PanelCotizaciones from '../views/cotizaciones/PanelCotizaciones';
import Personal from '../views/personal/Personal';
import Sucursales from '../views/sucursales/Sucursales';
import ImportExport from '../views/exportar-importar/ImportExport';
import { OFFLINE_NETWORK_FLAG } from '../../utils/offlineNetworkInterceptor';

const EMPLOYEE_STORAGE_PREFIX = 'employee_shortcuts_';
const EMPLOYEE_SHORTCUT_EVENT = 'employeeShortcutsUpdated';
const MAX_EMPLOYEE_SHORTCUTS = 3;

function BarraNavegacion({ activeScreen, onScreenChange, onViewOpen, isEmployee, employee, onMainModuleClick, hasUserData = true, user }) {
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'warning',
        text: ''
    });
    const [shortcuts, setShortcuts] = useState([]);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    const normalizeShortcut = useCallback((shortcut) => {
        if (!shortcut || typeof shortcut !== 'object') {
            return shortcut;
        }

        return {
            ...shortcut,
            props: shortcut.props || {},
        };
    }, []);

    const shortcutConfig = useMemo(() => {
        if (isEmployee) {
            return {
                storageKey: employee?.id ? `${EMPLOYEE_STORAGE_PREFIX}${employee.id}` : null,
                eventName: EMPLOYEE_SHORTCUT_EVENT,
                maxShortcuts: MAX_EMPLOYEE_SHORTCUTS,
            };
        }

        return {
            storageKey: null,
            eventName: null,
            maxShortcuts: 0,
        };
    }, [isEmployee, employee?.id]);

    const { storageKey, eventName, maxShortcuts } = shortcutConfig;

    useEffect(() => {
        const updateOfflineFlag = () => {
            try {
                setIsOfflineMode(localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true');
            } catch {
                setIsOfflineMode(false);
            }
        };

        updateOfflineFlag();
        const handler = () => updateOfflineFlag();
        window.addEventListener('offline-mode-changed', handler);
        window.addEventListener('storage', handler);

        return () => {
            window.removeEventListener('offline-mode-changed', handler);
            window.removeEventListener('storage', handler);
        };
    }, []);

    useEffect(() => {
        if (!storageKey || !eventName) {
            setShortcuts([]);
            return;
        }

        const applyNormalizedShortcuts = (rawShortcuts, persist = true, existingSerialized = null) => {
            if (!Array.isArray(rawShortcuts)) {
                setShortcuts([]);
                return;
            }

            const trimmed = rawShortcuts.slice(0, maxShortcuts);
            const normalized = trimmed.map((shortcut) => normalizeShortcut(shortcut));
            setShortcuts(normalized);

            if (persist && storageKey) {
                try {
                    const normalizedSerialized = JSON.stringify(normalized);
                    if (existingSerialized === null || normalizedSerialized !== existingSerialized) {
                        localStorage.setItem(storageKey, normalizedSerialized);
                    }
                } catch (error) {
                    console.error('Error al guardar atajos normalizados:', error);
                }
            }
        };

        const loadShortcuts = () => {
            try {
                const stored = localStorage.getItem(storageKey);
                if (!stored) {
                    setShortcuts([]);
                    return;
                }
                const parsed = JSON.parse(stored);
                applyNormalizedShortcuts(parsed, true, stored);
            } catch (error) {
                console.error('Error al cargar atajos:', error);
                setShortcuts([]);
            }
        };

        loadShortcuts();

        const handleShortcutEvent = (event) => {
            const { detail } = event;
            if (!detail) {
                loadShortcuts();
                return;
            }

            if (isEmployee) {
                if (detail.employeeId && employee?.id && detail.employeeId !== employee.id) {
                    return;
                }
            } else {
                if (detail.userId && user?.id && detail.userId !== user.id) {
                    return;
                }
            }

            if (Array.isArray(detail.shortcuts)) {
                applyNormalizedShortcuts(detail.shortcuts, true);
            } else {
                loadShortcuts();
            }
        };

        const handleStorage = (event) => {
            if (event.key === storageKey) {
                loadShortcuts();
            }
        };

        window.addEventListener(eventName, handleShortcutEvent);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener(eventName, handleShortcutEvent);
            window.removeEventListener('storage', handleStorage);
        };
    }, [storageKey, eventName, maxShortcuts, isEmployee, employee?.id, user?.id, normalizeShortcut]);

    const shortcutItems = useMemo(() => {
        const filteredShortcuts = shortcuts.filter((shortcut) => {
            if (!isOfflineMode || !isEmployee) {
                return true;
            }
            const isAlmacenSalida =
                shortcut.component === 'AlmacenGeneral' &&
                (shortcut.props?.tipo === 'salida' ||
                 shortcut.props?.modo === 'salida' ||
                 shortcut.name?.toLowerCase().includes('salida') ||
                 shortcut.description?.toLowerCase().includes('salida'));
            return isAlmacenSalida;
        });

        return filteredShortcuts.slice(0, maxShortcuts).map((shortcut) => ({
            id: `shortcut:${shortcut.id}`,
            icon: shortcut.icon || 'grid',
            title: '',
            accessibilityLabel: shortcut.name || shortcut.description || 'Atajo'
        }));
    }, [shortcuts, maxShortcuts, isOfflineMode, isEmployee]);

    // Solo mostrar configuración si hay datos de usuario/empleado
    const navigationItems = useMemo(() => {
        if (isEmployee) {
            return [
                { id: 'inicio', icon: 'home', title: '' },
                ...shortcutItems,
                ...(hasUserData ? [{ id: 'configuracion', icon: 'cog', title: '' }] : []),
            ];
        }

        return [
            { id: 'inicio', icon: 'home', title: '' },
            ...shortcutItems,
            { id: 'ventas', icon: 'cart', title: '' },
            { id: 'balance', icon: 'wallet', title: '' },
            { id: 'explorar', icon: 'category', title: '' },
            ...(hasUserData ? [{ id: 'configuracion', icon: 'cog', title: '' }] : []),
        ];
    }, [isEmployee, shortcutItems, hasUserData]);

    const activeIndex = Math.max(0, navigationItems.findIndex((item) => item.id === activeScreen));

    const handleNavigation = (screenId) => {
        if (screenId === 'configuracion') {
            onScreenChange('configuracion');
        } else if (screenId === 'ventas') {
            // Abrir AlmacenGeneral en modo salida
            onViewOpen('almacenGeneral', { tipo: 'salida' });
        } else {
            onScreenChange(screenId);
        }
    };

    const activeShortcut = useMemo(() => {
        if (!activeScreen?.startsWith('shortcut:')) return null;
        return shortcuts.find((shortcut) => `shortcut:${shortcut.id}` === activeScreen) || null;
    }, [activeScreen, shortcuts]);

    useEffect(() => {
        if (!isEmployee || !isOfflineMode) return;
        if (!activeShortcut) return;

        const isValidShortcut =
            activeShortcut.component === 'AlmacenGeneral' &&
            (activeShortcut.props?.tipo === 'salida' ||
                activeShortcut.props?.modo === 'salida' ||
                activeShortcut.name?.toLowerCase().includes('salida'));

        if (!isValidShortcut) {
            onScreenChange('inicio');
        }
    }, [activeShortcut, isOfflineMode, isEmployee, onScreenChange]);

    const handleShortcutVisibilityChange = (nextValue) => {
        const resolved = typeof nextValue === 'function' ? nextValue(true) : nextValue;
        if (resolved === false || resolved === undefined) {
            onScreenChange('inicio');
        }
    };

    const renderShortcutComponent = (shortcut) => {
        const isAlmacenSalidaShortcut =
            shortcut?.component === 'AlmacenGeneral' &&
            (shortcut?.props?.tipo === 'salida' ||
                shortcut?.props?.modo === 'salida' ||
                shortcut?.name?.toLowerCase().includes('salida'));

        if (isOfflineMode && isEmployee && !isAlmacenSalidaShortcut) {
            return (
                <InicioEmpleado
                    employee={employee}
                    onMainModuleClick={onMainModuleClick}
                />
            );
        }

        if (!shortcut || !shortcut.component) {
            return (
                <InicioEmpleado 
                    employee={employee} 
                    onMainModuleClick={onMainModuleClick} 
                />
            );
        }

        const props = shortcut.props || {};

        switch (shortcut.component) {
            case 'AlmacenGeneral':
                return <AlmacenGeneral isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'AlmacenMedioGeneral':
                return <AlmacenMedioGeneral isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'AlmacenGeneralAuxiliar':
                return <AlmacenGeneralAuxiliar isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'AlmacenAcopio':
                return <AlmacenAcopio isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'AlmacenMedio':
                return <AlmacenMedio isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'AlmacenAcopioAuxiliar':
                return <AlmacenAcopioAuxiliar isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'PanelMovimientos':
                return (
                    <PanelMovimientos
                        isOpen={true}
                        setIsOpen={handleShortcutVisibilityChange}
                        tipoMovimiento={props?.tipoMovimiento || props?.tipo}
                    />
                );
            case 'MovimientosMedio':
                return <MovimientosMedio isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'PanelPedidos':
                return (
                    <PanelPedidos
                        isOpen={true}
                        setIsOpen={handleShortcutVisibilityChange}
                        tipoPedido={props?.tipoPedido || props?.tipo}
                    />
                );
            case 'PedidosMedio':
                return <PedidosMedio isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'Precios':
                return <Precios isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'Clientes':
                return <Clientes isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'Proveedores':
                return <Proveedores isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'Gastos':
                return <Gastos isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'Deudas':
                return <Deudas isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'Reportes':
                return <Reportes isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'Balance':
                return <Balance isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'FormularioProduccion':
                return <FormularioProduccion isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'VerificarProduccion':
                return <VerificarProduccion isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'MiProduccion':
                return <MiProduccion isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'Reglas':
                return <Reglas isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'PanelConteos':
                return (
                    <PanelConteos
                        isOpen={true}
                        setIsOpen={handleShortcutVisibilityChange}
                        tipoConteo={props?.tipoConteo || props?.tipo || 'almacen'}
                    />
                );
            case 'ConteosMedio':
                return <ConteosMedio isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'PanelCotizaciones':
                return <PanelCotizaciones isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'Personal':
                return <Personal isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'Sucursales':
                return <Sucursales isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            case 'ImportExport':
                return <ImportExport isOpen={true} setIsOpen={handleShortcutVisibilityChange} {...props} />;
            default:
                console.warn('Componente de atajo no mapeado:', shortcut.component);
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

    const renderScreen = () => {
        if (activeShortcut) {
            return renderShortcutComponent(activeShortcut);
        }

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
            case 'ventas':
                // Ventas se maneja a través de onViewOpen, no se renderiza aquí
                return isEmployee ? (
                    <InicioEmpleado 
                        employee={employee} 
                        onMainModuleClick={onMainModuleClick} 
                    />
                ) : (
                    <Inicio onViewOpen={onViewOpen} />
                );
            case 'balance':
                return <BalanceScreen />;
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
                {navigationItems.map((item) => {
                    const isShortcut = item.id?.startsWith('shortcut:');
                    const iconClasses = [
                        styles.icon,
                        activeScreen === item.id ? styles.activeIcon : '',
                        isShortcut ? styles.shortcutIcon : ''
                    ].filter(Boolean).join(' ');

                    const optionClasses = [
                        styles.opcion,
                        activeScreen === item.id ? styles.active : '',
                        isShortcut ? styles.shortcut : ''
                    ].filter(Boolean).join(' ');

                    return (
                        <div 
                            key={item.id}
                            className={optionClasses}
                            onClick={() => handleNavigation(item.id)}
                            aria-label={item.accessibilityLabel || item.title || item.id}
                        >
                            <BoxIcon 
                                name={item.icon} 
                                className={iconClasses}
                            />
                            {item.title ? (
                                <p className={`${styles.title} ${activeScreen === item.id ? styles.activeTitle : ''}`}>
                                    {item.title}
                                </p>
                            ) : null}
                        </div>
                    );
                })}
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