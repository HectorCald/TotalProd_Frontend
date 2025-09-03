// Utilidad para manejar errores de acceso a módulos
export const handleModuleError = (error, showNotification) => {
    if (error.code === 'NO_PLAN') {
        showNotification({
            type: 'error',
            title: 'Plan Requerido',
            message: 'Necesitas un plan activo para acceder a esta función. Actualiza tu plan desde el perfil.',
            action: {
                label: 'Ver Planes',
                onClick: () => {
                    // Aquí puedes abrir el modal de planes
                    console.log('Abrir modal de planes');
                }
            }
        });
    } else if (error.code === 'MODULE_NOT_INCLUDED') {
        showNotification({
            type: 'warning',
            title: 'Módulo No Incluido',
            message: `Tu plan actual (${error.currentPlan}) no incluye acceso al módulo "${error.requiredModule}". Actualiza tu plan para acceder a esta función.`,
            action: {
                label: 'Actualizar Plan',
                onClick: () => {
                    // Aquí puedes abrir el modal de planes
                    console.log('Abrir modal de planes para actualizar');
                }
            }
        });
    } else {
        showNotification({
            type: 'error',
            title: 'Error de Acceso',
            message: error.message || 'No tienes permisos para acceder a esta función.',
        });
    }
};

// Hook para verificar si el usuario tiene acceso a un módulo
export const useModuleAccess = (user, moduleName) => {
    if (!user?.plan) {
        return {
            hasAccess: false,
            reason: 'NO_PLAN',
            message: 'No tienes un plan activo'
        };
    }

    const hasModule = user.modules?.some(module => 
        module.name.toLowerCase() === moduleName.toLowerCase()
    );

    if (!hasModule) {
        return {
            hasAccess: false,
            reason: 'MODULE_NOT_INCLUDED',
            message: `Tu plan actual (${user.plan.name}) no incluye acceso al módulo "${moduleName}"`
        };
    }

    return {
        hasAccess: true,
        reason: null,
        message: null
    };
};
