// Constantes de módulos disponibles en el sistema
import imagenAlmacen from '../assets/almacen.png';
import imagenAcopio from '../assets/acopio.png';
import imagenMovimientos from '../assets/movimientos.png';
import imagenPedidos from '../assets/pedidos.png';
import imagenPrecios from '../assets/precios.png';
import imagenClientes from '../assets/clientes.png';
import imagenProveedores from '../assets/proveedores.png';
import imagenGastos from '../assets/gastos.png';
import imagenDeudas from '../assets/deudas.png';
import imagenReportes from '../assets/reporte-ia.png';
import imageBalance from '../assets/balance.png';
import imageDamabrava from '../assets/damabrava/damabrava.png';
import imageConteos from '../assets/conteos.png';
import imageCotizaciones from '../assets/cotizaciones.png';

export const MODULES = {
    // Módulos principales
    Almacen: {
        name: 'Almacén General',
        imagen: imagenAlmacen,
        descripcion: 'Administra tu almacén de productos.',

        realizar_salidas: {
            name: 'Salida o Venta',
            description: 'Realizar salida de productos en almacén',
            icon: 'minus',
            component: 'AlmacenGeneral',
            props: { tipo: 'salida' }
        },
        realizar_entradas: {
            name: 'Entrada',
            description: 'Realizar entrada de productos en almacén',
            icon: 'plus',
            component: 'AlmacenGeneral',
            props: { tipo: 'entrada' }
        },
        realizar_pedidos: {
            name: 'Nuevo Pedido',
            description: 'Realizar pedidos de productos en almacén',
            icon: 'cart',
            component: 'AlmacenGeneral',
            props: { tipo: 'pedido' }
        },
        gestionar: {
            name: 'Gestionar',
            description: 'Gestionar almacen de productos',
            icon: 'store',
            component: 'AlmacenGeneral',
            props: { tipo: 'almacen' }
        },
        realizar_conteo: {
            name: 'Conteo',
            description: 'Realizar conteo físico de productos',
            icon: 'calculator',
            component: 'AlmacenGeneralAuxiliar',
            props: { tipo: 'conteo' }
        },
        cotizar: {
            name: 'Cotizar',
            description: 'Realizar cotización de productos',
            icon: 'file',
            component: 'AlmacenGeneralAuxiliar',
            props: { tipo: 'cotizar' }
        },
    },
    Acopio: {
        name: 'Materia Prima',
        imagen: imagenAcopio,
        descripcion: 'Administra tu materia prima.',
        realizar_entradas: {
            name: 'Entrada',
            description: 'Realizar entrada de productos en almacén',
            icon: 'plus',
            component: 'AlmacenAcopio',
            props: { tipo: 'entrada' }
        },
        realizar_salidas: {
            name: 'Salida',
            description: 'Realizar salida de productos en almacén',
            icon: 'minus',
            component: 'AlmacenAcopio',
            props: { tipo: 'salida' }
        },
        realizar_pedidos: {
            name: 'Nuevo Pedido',
            description: 'Realizar pedidos de materia prima',
            icon: 'cart',
            component: 'AlmacenAcopio',
            props: { tipo: 'pedido' }
        },
        
        gestionar: {
            name: 'Gestionar',
            description: 'Gestionar almacen de productos',
            icon: 'store',
            component: 'AlmacenAcopio',
            props: { tipo: 'almacen' }
        },
        realizar_conteo: {
            name: 'Pesaje',
            description: 'Realizar pesaje de materia prima',
            icon: 'calculator',
            component: 'AlmacenAcopioAuxiliar',
            props: { tipo: 'conteo' }
        },
    },
    Movimientos: {  
        name: 'Movimientos',
        imagen: imagenMovimientos,
        descripcion: 'Administra tus movimientos de productos.',

        movimientos_almacen: {
            name: 'Almacen',
            description: 'Administra tus movimientos de productos.',
            icon: 'file',
            component: 'Movimientos',
            props: { tipo: 'almacen' }
        },
        movimientos_materia_prima: {
            name: 'Materia Prima',
            description: 'Administra tus movimientos de productos.',
            icon: 'file',
            component: 'Movimientos',
            props: { tipo:'acopio' }
        },
    },
    Conteos: {
        name: 'Conteos',
        imagen: imageConteos,
        descripcion: 'Revisa los conteos físicos registrados.',
        
        conteos_almacen: {
            name: 'Almacen',
            description: 'Conteos de almacén.',
            icon: 'calculator',
            component: 'PanelConteos',
            props: { tipo: 'almacen' }
        },
        conteos_materia_prima: {
            name: 'Materia Prima',
            description: 'Conteos de materia prima.',
            icon: 'calculator',
            component: 'PanelConteos',
            props: { tipo: 'acopio' }
        }
    },
    Pedidos: {
        name: 'Pedidos',
        imagen: imagenPedidos,
        descripcion: 'Administra tus pedidos de productos.',

        pedidos_almacen: {
            name: 'Almacen',
            description: 'Administra tus pedidos de productos.',
            icon: 'package',
            component: 'Pedidos',
            props: { tipo: 'almacen' }
        },
        pedidos_materia_prima: {
            name: 'Materia Prima',
            description: 'Administra tus pedidos de materia prima.',
            icon: 'leaf',
            component: 'Pedidos',
            props: { tipo: 'acopio' }
        },
    },
    Precios: {  
        name: 'Precios',
        imagen: imagenPrecios,
        descripcion: 'Administra tus precios de productos.',
        gestionar: {
            name: 'Precios',
            description: 'Administra tus precios de productos.',
            icon: 'file',
            component: 'Precios',
            props: { tipo: 'almacen' }
        },
    },
    Clientes: {
        name: 'Clientes',
        imagen: imagenClientes,
        descripcion: 'Administra tus clientes.',
        gestionar: {
            name: 'Clientes',
            description: 'Administra tus clientes.',
            icon: 'file',
            component: 'Clientes',
            props: { tipo: 'almacen' }
        },
    },
    Proveedores: {
        name: 'Proveedores',
        imagen: imagenProveedores,
        descripcion: 'Administra tus proveedores.',
        gestionar: {
            name: 'Proveedores',
            description: 'Administra tus proveedores.',
            icon: 'file',
            component: 'Proveedores',
            props: { tipo: 'almacen' }
        },
    },
    Gastos: {
        name: 'Gastos',
        imagen: imagenGastos,
        descripcion: 'Administra tus gastos.',
        gestionar: {
            name: 'Gastos',
            description: 'Administra tus gastos.',
            icon: 'file',
            component: 'Gastos',
            props: { tipo: 'almacen' }
        },
    },
    Deudas: {
        name: 'Deudas',
        imagen: imagenDeudas,
        descripcion: 'Administra las deudas de tus clientes.',
        gestionar: {
            name: 'Deudas',
            description: 'Administra las deudas de tus clientes.',
            icon: 'receipt',
            component: 'Deudas',
            props: { tipo: 'almacen' }
        },
    },
    Reportes: {
        name: 'Reportes',
        imagen: imagenReportes,
        descripcion: 'Genera reportes detallados de ventas, movimientos.',
        generar_reportes: {
            name: 'Reportes',
            description: 'Genera reportes de tu negocio.',
            icon: 'bar-chart-alt-2',
            component: 'Reportes',
            props: { tipo: 'almacen' }
        },
    },
    Balance: {
        name: 'Balance',
        imagen: imageBalance,
        descripcion: 'Visualiza el balance de ingresos y egresos.',
        ver_balance: {
            name: 'Balance',
            description: 'Controla el balance de tu negocio.',
            icon: 'trending-up',
            component: 'Balance',
            props: { tipo: 'almacen' }
        },
    },
    Damabrava: {
        name: 'Damabrava',
        imagen: imageDamabrava,
        descripcion: 'Funcionalidades de Damabrava.',
        
        formulario: {
            name: 'Formulario',
            description: 'Registra una nueva producción.',
            icon: 'detail',
            component: 'FormularioProduccion',
            props: { tipo: 'almacen' }
        },
        verificar: {
            name: 'Verificación',
            description: 'Verifica la producción.',
            icon: 'list-check',
            component: 'VerificarProduccion',
            props: {}
        },
        mi_produccion: {
            name: 'Mi Producción',
            description: 'Visualiza tu producción.',
            icon: 'archive',
            component: 'MiProduccion',
            props: {}
        },
    },
    Cotizaciones: {
        name: 'Cotizaciones',
        imagen: imageCotizaciones,
        descripcion: 'Administra tus cotizaciones de productos.',

        gestionar: {
            name: 'Cotizaciones',
            description: 'Administra tus cotizaciones de productos.',
            icon: 'file',
            component: 'PanelCotizaciones',
            props: {}
        },
    },
};

// Cache para evitar recálculos innecesarios
const moduleCache = new Map();

// Función para obtener los módulos principales disponibles para un empleado
export const getAvailableMainModules = (employeeModules) => {
    if (!employeeModules || !Array.isArray(employeeModules)) return [];

    // Crear una clave única para el cache basada en los módulos del empleado
    const cacheKey = JSON.stringify(employeeModules.map(m => ({ 
        name: m.name, 
        modulos: m.modulos?.name 
    })));
    
    // Verificar si ya tenemos el resultado en cache
    if (moduleCache.has(cacheKey)) {
        return moduleCache.get(cacheKey);
    }

    // Agrupar submódulos por módulo principal
    const modulesByMainModule = {};
    
    employeeModules.forEach(module => {
        if (module.modulos) {
            let mainModuleKey = null;
            
            // Mapear nombres de módulos a claves
            const moduleMapping = {
                'Almacen': 'Almacen',
                'Materia': 'Acopio',
                'Movimientos': 'Movimientos',
                'Conteos': 'Conteos',
                'Pedidos': 'Pedidos',
                'Precios': 'Precios',
                'Clientes': 'Clientes',
                'Proveedores': 'Proveedores',
                'Gastos': 'Gastos',
                'Deudas': 'Deudas',
                'Reportes': 'Reportes',
                'Balance': 'Balance',
                'Damabrava': 'Damabrava',
                'Cotizaciones': 'Cotizaciones'
            };
            
            mainModuleKey = moduleMapping[module.modulos.name];
            
            if (mainModuleKey) {
                if (!modulesByMainModule[mainModuleKey]) {
                    modulesByMainModule[mainModuleKey] = [];
                }
                modulesByMainModule[mainModuleKey].push(module);
            }
        }
    });

    // Convertir a array con datos completos, incluyendo solo los submódulos asignados
    const result = Object.keys(modulesByMainModule).map(moduleKey => {
        const module = MODULES[moduleKey];
        const assignedSubmodules = modulesByMainModule[moduleKey];
        
        // Mapear los submódulos asignados a sus definiciones completas
        const availableSubmodules = assignedSubmodules.map(assignedModule => {
            // Buscar el submódulo correspondiente en la definición del módulo
            const submoduleKey = Object.keys(module).find(key => {
                if (key === 'name' || key === 'imagen' || key === 'descripcion') return false;
                
                // Mapear nombres de submódulos basado en el contexto del módulo
                let nameMapping = {};
                
                if (moduleKey === 'Conteos') {
                    nameMapping = {
                        'Almacen': 'conteos_almacen',
                        'Materia Prima': 'conteos_materia_prima'
                    };
                } else if (moduleKey === 'Movimientos') {
                    nameMapping = {
                        'Almacen': 'movimientos_almacen',
                        'Materia Prima': 'movimientos_materia_prima'
                    };
                } else if (moduleKey === 'Pedidos') {
                    nameMapping = {
                        'Almacen': 'pedidos_almacen',
                        'Materia Prima': 'pedidos_materia_prima'
                    };
                } else if (moduleKey === 'Damabrava') {
                    nameMapping = {
                        'Formulario': 'formulario',
                        'Verificación': 'verificacion', 
                        'Mi Producción': 'mi_produccion'
                    };
                } else if (moduleKey === 'Cotizaciones') {
                    nameMapping = {
                        'Cotizaciones': 'gestionar'
                    };
                } else {
                    nameMapping = {
                        'Salida o Venta': 'realizar_salidas',
                        'Entrada': 'realizar_entradas',
                        'Nuevo Pedido': 'realizar_pedidos',
                        'Gestionar': 'gestionar',
                        'Conteo': 'realizar_conteo',
                        'Pesaje': 'realizar_conteo'
                    };
                }
                
                const mappedKey = nameMapping[assignedModule.name] || assignedModule.name.toLowerCase().replace(/\s+/g, '_');
                return key === mappedKey;
            });
            
            if (submoduleKey && module[submoduleKey]) {
                return {
                    ...module[submoduleKey],
                    // Mantener información del módulo asignado
                    assignedModule: assignedModule
                };
            }
            
            // Si no se encuentra el mapeo, crear un submódulo básico
            return {
                name: assignedModule.name,
                description: assignedModule.name,
                icon: 'grid',
                component: 'Unknown',
                props: {}
            };
        });
        
        return {
            key: moduleKey,
            name: module.name,
            description: module.descripcion,
            image: module.imagen,
            submodules: availableSubmodules
        };
    });

    // Guardar en cache
    moduleCache.set(cacheKey, result);
    
    return result;
};

// Función simple para obtener los módulos disponibles para un empleado
export const getAvailableModules = (employeeModules) => {
    if (!employeeModules || !Array.isArray(employeeModules)) return [];

    return employeeModules.map(module => {
        // Buscar en Almacén
        if (module.modulos && module.modulos.name === 'Almacen') {
            const submodule = MODULES.Almacen[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.imagen
                };
            }
        }

        // Buscar en Acopio
        if (module.modulos && module.modulos.name === 'Materia') {
            const submodule = MODULES.Acopio[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.icon
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Movimientos') {
            const submodule = MODULES.Movimientos[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.imagen
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Pedidos') {
            const submodule = MODULES.Pedidos[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.icon
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Precios') {
            const submodule = MODULES.Precios[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.imagen
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Clientes') {
            const submodule = MODULES.Clientes[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.imagen
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Proveedores') {
            const submodule = MODULES.Proveedores[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.imagen
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Gastos') {
            const submodule = MODULES.Gastos[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.imagen
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Deudas') {
            const submodule = MODULES.Deudas[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.imagen
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Reportes') {
            const submodule = MODULES.Reportes[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.imagen
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Balance') {
            const submodule = MODULES.Balance[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.imagen
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Conteos') {
            // Mapear nombres de submódulos a claves del objeto MODULES
            const nameMapping = {
                'Almacen': 'conteos_almacen',
                'Materia Prima': 'conteos_materia_prima'
            };
            
            const moduleKey = nameMapping[module.name] || module.name.toLowerCase().replace(/\s+/g, '_');
            const submodule = MODULES.Conteos[moduleKey];
            
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.icon
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Damabrava') {
            // Mapear nombres de submódulos a claves del objeto MODULES
            const nameMapping = {
                'Formulario': 'formulario',
                'Verificación': 'verificacion',
                'Mi Producción': 'mi_produccion'
            };
            
            const moduleKey = nameMapping[module.name] || module.name.toLowerCase().replace(/\s+/g, '_');
            const submodule = MODULES.Damabrava[moduleKey];
            
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.icon
                };
            }
        }
        if (module.modulos && module.modulos.name === 'Cotizaciones') {
            const submodule = MODULES.Cotizaciones[module.name];
            if (submodule) {
                return {
                    ...module,
                    name: submodule.name,
                    description: submodule.description,
                    component: submodule.component,
                    props: submodule.props,
                    icon: submodule.icon
                };
            }
        }
        // Si no se encuentra, devolver tal como está
        return {
            ...module,
            icon: 'grid'
        };
    });
};
