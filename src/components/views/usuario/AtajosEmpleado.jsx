import React, { useEffect, useMemo, useState } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import ComponenteFull from '../../common/old/ComponenteFull';
import Notification from '../../common/old/Notification';
import { useEmployee } from '../../../context/EmployeeContext';
import { getAvailableMainModules } from '../../../constants/modules';

const STORAGE_PREFIX = 'employee_shortcuts_';
const EMPLOYEE_SHORTCUT_EVENT = 'employeeShortcutsUpdated';
const MAX_SHORTCUTS = 3;

const buildShortcutId = (moduleKey, submodule) => {
    const baseId = submodule?.assignedModule?.id || submodule?.view || submodule?.name || Math.random().toString(36).slice(2);
    return `${moduleKey}:${baseId}`;
};

const buildShortcutPayload = (moduleInfo, submodule) => ({
    id: buildShortcutId(moduleInfo.key, submodule),
    moduleKey: moduleInfo.key,
    moduleName: moduleInfo.name,
    section: moduleInfo.section,
    name: submodule.name,
    description: submodule.description,
    icon: submodule.icon || 'grid',
    component: submodule.component,
    props: submodule.props || {},
    view: submodule.view,
});

function AtajosEmpleado({ isOpen, setIsOpen }) {
    const { employee } = useEmployee();
    const employeeId = employee?.id;
    const storageKey = employeeId ? `${STORAGE_PREFIX}${employeeId}` : null;

    const [selectedShortcuts, setSelectedShortcuts] = useState([]);
    const [notification, setNotification] = useState({ isVisible: false, type: 'info', text: '' });

    const availableMainModules = useMemo(
        () => getAvailableMainModules(employee?.modules || []),
        [employee?.modules]
    );

    const showNotification = (type, text) => {
        setNotification({ isVisible: true, type, text });
        setTimeout(() => {
            setNotification((prev) => ({ ...prev, isVisible: false }));
        }, 2500);
    };

    const persistShortcuts = (updatedShortcuts, dispatchEvent = true) => {
        if (!storageKey) return;
        try {
            const trimmed = updatedShortcuts.slice(0, MAX_SHORTCUTS);
            localStorage.setItem(storageKey, JSON.stringify(trimmed));
            if (dispatchEvent) {
                window.dispatchEvent(
                    new CustomEvent(EMPLOYEE_SHORTCUT_EVENT, {
                        detail: {
                            employeeId,
                            shortcuts: trimmed,
                        },
                    })
                );
            }
        } catch (error) {
            console.error('Error al guardar atajos:', error);
        }
    };

    const loadShortcuts = () => {
        if (!storageKey) {
            setSelectedShortcuts([]);
            return;
        }

        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    const normalized = parsed.slice(0, MAX_SHORTCUTS);
                    setSelectedShortcuts(normalized);
                    if (normalized.length !== parsed.length) {
                        persistShortcuts(normalized, false);
                    }
                } else {
                    setSelectedShortcuts([]);
                }
            } else {
                setSelectedShortcuts([]);
            }
        } catch (error) {
            console.error('Error al cargar atajos:', error);
            setSelectedShortcuts([]);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadShortcuts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (!storageKey) {
            setSelectedShortcuts([]);
            return;
        }
        loadShortcuts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    const isShortcutSelected = (moduleInfo, submodule) => {
        const id = buildShortcutId(moduleInfo.key, submodule);
        return selectedShortcuts.some((shortcut) => shortcut.id === id);
    };

    const handleToggleShortcut = (moduleInfo, submodule, enabled) => {
        if (!employeeId) {
            showNotification('warning', 'No se encontró el empleado para guardar el atajo');
            return;
        }

        const shortcutPayload = buildShortcutPayload(moduleInfo, submodule);
        const alreadySelected = selectedShortcuts.some((shortcut) => shortcut.id === shortcutPayload.id);

        if (enabled && !alreadySelected && selectedShortcuts.length >= MAX_SHORTCUTS) {
            showNotification('warning', `Solo puedes seleccionar ${MAX_SHORTCUTS} atajos`);
            return;
        }

        const updatedShortcuts = enabled
            ? [...selectedShortcuts.filter((shortcut) => shortcut.id !== shortcutPayload.id), shortcutPayload]
            : selectedShortcuts.filter((shortcut) => shortcut.id !== shortcutPayload.id);

        const trimmedShortcuts = updatedShortcuts.slice(0, MAX_SHORTCUTS);

        setSelectedShortcuts(trimmedShortcuts);
        persistShortcuts(trimmedShortcuts);
        showNotification(enabled ? 'success' : 'info', enabled ? 'Atajo agregado' : 'Atajo desactivado');
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView onBack={() => setIsOpen(false)} title="Atajos de módulos" />
            <div className={styles.container}>
                {availableMainModules.length === 0 ? (
                    <p className={styles.subTitle} style={{ marginTop: '0' }}>
                        No hay módulos disponibles.
                    </p>
                ) : (
                    availableMainModules.map((moduleInfo) => (
                        <div key={moduleInfo.key} style={{ width: '100%' }}>
                            <p className={styles.subTitle} style={{ marginBottom: '10px' }}>
                                {moduleInfo.name.toUpperCase()}
                            </p>
                            <div className={styles.content}>
                                {moduleInfo.submodules.map((submodule) => (
                                    <ComponenteFull
                                        key={buildShortcutId(moduleInfo.key, submodule)}
                                        title={submodule.name}
                                        subtitle={submodule.description}
                                        icon={submodule.icon}
                                        type="checkbox"
                                        checked={isShortcutSelected(moduleInfo, submodule)}
                                        onChange={(checked) => handleToggleShortcut(moduleInfo, submodule, checked)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <Notification isVisible={notification.isVisible} type={notification.type} text={notification.text} />
        </View>
    );
}

export default AtajosEmpleado;

