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
import imageHistorial from '../assets/historial.png';
import imageImportExport from '../assets/import-export.png';
import imagenPersonal from '../assets/personal.png';
import imagenSucursales from '../assets/sucursales.png';

// Mapeo de componentes a vistas (para simplificar el uso)
const COMPONENT_TO_VIEW = {
    'AlmacenGeneral': 'almacenMedioGeneral',
    'AlmacenAcopio': 'almacenMedio',
    'AlmacenGeneralAuxiliar': 'almacenMedioGeneralAuxiliar',
    'AlmacenAcopioAuxiliar': 'almacenMedioAuxiliar',
    'PanelMovimientos': 'movimientos',
    'PanelConteos': 'conteos',
    'PanelCotizaciones': 'cotizaciones',
    'PanelPedidos': 'pedidos',
    'Precios': 'precios',
    'Clientes': 'clientes',
    'Proveedores': 'proveedores',
    'Gastos': 'gastos',
    'Deudas': 'deudas',
    'Reportes': 'reportes',
    'Balance': 'balance',
    'FormularioProduccion': 'formulario',
    'VerificarProduccion': 'verificacion',
    'MiProduccion': 'mi_produccion',
    'Reglas': 'reglas',
    'PanelHistorial': 'historial',
    'ImportExport': 'importar_exportar',
    'Personal': 'personal',
    'PanelPagos': 'pagos',
    'Sucursales': 'sucursales',
    'AlmacenGeneralII': 'almacenGeneralAuxiliarII',
};

// Mapeo de nombres de módulos del backend a claves del frontend
const BACKEND_TO_FRONTEND_MODULE = {
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
    'Historial': 'Historial',
    'Cotizaciones': 'Cotizaciones',
    'Personal': 'Personal',
    'Sucursales': 'Sucursales',
    'Importar': 'Importar'
};

// Mapeo de nombres de submódulos del backend a claves del frontend
const getSubmoduleKey = (moduleKey, submoduleName) => {
    const mappings = {
        'Conteos': {
            'Almacen': 'conteos_almacen',
            'Materia Prima': 'conteos_materia_prima'
        },
        'Movimientos': {
            'Almacen': 'movimientos_almacen',
            'Materia Prima': 'movimientos_materia_prima'
        },
        'Pedidos': {
            'Almacen': 'pedidos_almacen',
            'Materia Prima': 'pedidos_materia_prima'
        },
        'Damabrava': {
            'Formulario': 'formulario',
            'Verificación': 'verificar',
            'Mi Producción': 'mi_produccion',
            'Reglas': 'reglas',
            'Pagos': 'pagos'
        },
        'Cotizaciones': {
            'Cotizaciones': 'gestionar'
        },
        'Almacen': {
            'Salida o Venta': 'realizar_salidas',
            'Entrada': 'realizar_entradas',
            'Nuevo Pedido': 'realizar_pedidos',
            'Gestionar': 'gestionar',
            'Conteo': 'realizar_conteo',
            'Cotizar': 'cotizar',
            'Transferir': 'transferir'
        },
        'Acopio': {
            'Entrada': 'realizar_entradas',
            'Salida': 'realizar_salidas',
            'Nuevo Pedido': 'realizar_pedidos',
            'Gestionar': 'gestionar',
            'Pesaje': 'realizar_conteo'
        },
        'Sucursales': {
            'Sucursales': 'gestionar',
            'Gestionar': 'gestionar'
        },
        'Importar': {
            'Importar Exportar': 'importar_exportar',
            'Importar/Exportar': 'importar_exportar',
            'importar_exportar': 'importar_exportar'
        }
    };
    
    return mappings[moduleKey]?.[submoduleName] || submoduleName.toLowerCase().replace(/\s+/g, '_');
};

export const MODULES = {
    // Módulos principales
    Almacen: {
        name: 'Almacén General',
        imagen: imagenAlmacen,
        descripcion: 'Administra tu almacén de productos.',
        icon: 'package',
        section: 'inventario',

        realizar_salidas: {
            name: 'Salida o Venta',
            description: 'Realizar salida de productos en almacén',
            icon: 'up-arrow-alt',
            component: 'AlmacenGeneral',
            props: { tipo: 'salida' }
        },
        realizar_entradas: {
            name: 'Entrada',
            description: 'Realizar entrada de productos en almacén',
            icon: 'down-arrow-alt',
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
        transferir: {
            name: 'Transferir',
            description: 'Realizar transferencias de productos entre sucursales',
            icon: 'transfer',
            component: 'AlmacenGeneralII',
            props: { tipo: 'transferir' }
        },
    },
    Acopio: {
        name: 'Materia Prima',
        imagen: imagenAcopio,
        descripcion: 'Administra tu materia prima.',
        icon: 'leaf',
        section: 'inventario',
        realizar_entradas: {
            name: 'Entrada',
            description: 'Realizar entrada de productos en almacén',
            icon: 'down-arrow-alt',
            component: 'AlmacenAcopio',
            props: { tipo: 'entrada' }
        },
        realizar_salidas: {
            name: 'Salida',
            description: 'Realizar salida de productos en almacén',
            icon: 'up-arrow-alt',
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
        icon: 'transfer',
        section: 'registros',

        movimientos_almacen: {
            name: 'Almacen',
            description: 'Administra tus movimientos de productos.',
            icon: 'file',
            component: 'PanelMovimientos',
            props: { tipoMovimiento: 'almacen' }
        },
        movimientos_materia_prima: {
            name: 'Materia Prima',
            description: 'Administra tus movimientos de productos.',
            icon: 'file',
            component: 'PanelMovimientos',
            props: { tipoMovimiento: 'acopio' }
        },
    },
    Conteos: {
        name: 'Conteos',
        imagen: imageConteos,
        descripcion: 'Revisa los conteos físicos registrados.',
        icon: 'calculator',
        section: 'registros',
        
        conteos_almacen: {
            name: 'Almacen',
            description: 'Conteos de almacén.',
            icon: 'calculator',
            component: 'PanelConteos',
            props: { tipoConteo: 'almacen' }
        },
        conteos_materia_prima: {
            name: 'Materia Prima',
            description: 'Conteos de materia prima.',
            icon: 'calculator',
            component: 'PanelConteos',
            props: { tipoConteo: 'acopio' }
        }
    },
    Pedidos: {
        name: 'Pedidos',
        imagen: imagenPedidos,
        descripcion: 'Administra tus pedidos de productos.',
        icon: 'shopping-bag',
        section: 'registros',

        pedidos_almacen: {
            name: 'Almacen',
            description: 'Administra tus pedidos de productos.',
            icon: 'package',
            component: 'PanelPedidos',
            props: { tipoPedido: 'almacen' }
        },
        pedidos_materia_prima: {
            name: 'Materia Prima',
            description: 'Administra tus pedidos de materia prima.',
            icon: 'leaf',
            component: 'PanelPedidos',
            props: { tipoPedido: 'acopio' }
        },
    },
    Precios: {  
        name: 'Precios',
        imagen: imagenPrecios,
        descripcion: 'Administra tus precios de productos.',
        icon: 'dollar',
        section: 'configuracion',
        gestionar: {
            name: 'Precios',
            description: 'Administra tus precios de productos.',
            icon: 'dollar',
            component: 'Precios',
            props: { tipo: 'almacen' }
        },
    },
    Clientes: {
        name: 'Clientes',
        imagen: imagenClientes,
        descripcion: 'Administra tus clientes.',
        icon: 'user',
        section: 'gestion',
        gestionar: {
            name: 'Clientes',
            description: 'Administra tus clientes.',
            icon: 'user-pin',
            component: 'Clientes',
            props: { tipo: 'almacen' }
        },
    },
    Proveedores: {
        name: 'Proveedores',
        imagen: imagenProveedores,
        descripcion: 'Administra tus proveedores.',
        icon: 'truck',
        section: 'gestion',
        gestionar: {
            name: 'Proveedores',
            description: 'Administra tus proveedores.',
            icon: 'truck',
            component: 'Proveedores',
            props: { tipo: 'almacen' }
        },
    },
    Personal: {
        name: 'Personal',
        imagen: imagenPersonal,
        descripcion: 'Administra el personal de tu empresa.',
        icon: 'user-circle',
        section: 'gestion',
        gestionar: {
            name: 'Personal',
            description: 'Gestiona la información del personal.',
            icon: 'user-circle',
            component: 'Personal',
            props: {},
            view: 'personal'
        },
    },
    Sucursales: {
        name: 'Sucursales',
        imagen: imagenSucursales,
        descripcion: 'Administra tus sucursales.',
        icon: 'building',
        section: 'gestion',
        gestionar: {
            name: 'Sucursales',
            description: 'Administra tus sucursales.',
            icon: 'building',
            component: 'Sucursales',
            props: {},
            view: 'sucursales'
        },
    },
    Gastos: {
        name: 'Gastos',
        imagen: imagenGastos,
        descripcion: 'Administra tus gastos.',
        icon: 'wallet',
        section: 'finanzas',
        gestionar: {
            name: 'Gastos',
            description: 'Administra tus gastos.',
            icon: 'wallet',
            component: 'Gastos',
            props: { tipo: 'almacen' }
        },
    },
    Deudas: {
        name: 'Deudas',
        imagen: imagenDeudas,
        descripcion: 'Administra las deudas de tus clientes.',
        icon: 'receipt',
        section: 'finanzas',
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
        icon: 'bar-chart-alt-2',
        section: 'finanzas',
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
        icon: 'trending-up',
        section: 'finanzas',
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
        icon: 'category',
        section: 'damabrava',
        
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
            props: {},
            view: 'verificacion'
        },
        mi_produccion: {
            name: 'Mi Producción',
            description: 'Visualiza tu producción.',
            icon: 'archive',
            component: 'MiProduccion',
            props: {}
        },
        reglas: {
            name: 'Reglas',
            description: 'Gestiona las reglas de producción.',
            icon: 'book',
            component: 'Reglas',
            props: {}
        },
        pagos: {
            name: 'Pagos',
            description: 'Gestiona los pagos de producción.',
            icon: 'wallet',
            component: 'PanelPagos',
            props: {}
        },
    },
    Cotizaciones: {
        name: 'Cotizaciones',
        imagen: imageCotizaciones,
        descripcion: 'Administra tus cotizaciones de productos.',
        icon: 'file',
        section: 'registros',

        gestionar: {
            name: 'Cotizaciones',
            description: 'Administra tus cotizaciones de productos.',
            icon: 'file',
            component: 'PanelCotizaciones',
            props: {}
        },
    },
    Historial: {
        name: 'Historial',
        imagen: imageHistorial,
        descripcion: 'Consulta el historial de acciones del sistema.',
        icon: 'history',
        section: 'configuracion',
        ver_historial: {
            name: 'Historial',
            description: 'Revisa las acciones registradas en el sistema.',
            icon: 'history',
            component: 'PanelHistorial',
            props: {},
            view: 'historial'
        }
    },
    Importar: {
        name: 'Importar / Exportar',
        imagen: imageImportExport,
        descripcion: 'Importa o exporta datos masivos del almacén.',
        icon: 'import',
        section: 'configuracion',
        importar_exportar: {
            name: 'Importar / Exportar',
            description: 'Gestiona la importación y exportación de datos.',
            icon: 'import',
            component: 'ImportExport',
            props: {},
            view: 'importar_exportar'
        }
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
            const mainModuleKey = BACKEND_TO_FRONTEND_MODULE[module.modulos.name];
            
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
        
        // Obtener el orden de los submódulos tal como están definidos en MODULES
        const submoduleOrder = Object.keys(module)
            .filter(key => typeof module[key] === 'object' && module[key]?.component);

        // Mapear los submódulos asignados a sus definiciones completas y respetar el orden
        const availableSubmodules = assignedSubmodules
            .map(assignedModule => {
                const submoduleKey = getSubmoduleKey(moduleKey, assignedModule.name);
                const submodule = module[submoduleKey];
                
                if (submodule) {
                    return {
                        ...submodule,
                        view: submodule.view || COMPONENT_TO_VIEW[submodule.component] || submodule.component.toLowerCase(),
                        assignedModule: assignedModule,
                        __orderKey: submoduleKey
                    };
                }
                
                // Si no se encuentra el mapeo, crear un submódulo básico
                return {
                    name: assignedModule.name,
                    description: assignedModule.name,
                    icon: 'grid',
                    component: 'Unknown',
                    props: {},
                    view: 'unknown',
                    __orderKey: null
                };
            })
            .sort((a, b) => {
                const indexA = a.__orderKey ? submoduleOrder.indexOf(a.__orderKey) : Number.MAX_SAFE_INTEGER;
                const indexB = b.__orderKey ? submoduleOrder.indexOf(b.__orderKey) : Number.MAX_SAFE_INTEGER;
                return indexA - indexB;
            })
            .map(({ __orderKey, ...rest }) => rest);
        
        return {
            key: moduleKey,
            name: module.name,
            description: module.descripcion,
            image: module.imagen,
            icon: module.icon,
            section: module.section,
            submodules: availableSubmodules
        };
    });

    // Guardar en cache
    moduleCache.set(cacheKey, result);
    
    return result;
};

// Función para obtener el título de la sección
export const getSectionTitle = (sectionKey) => {
    const sectionTitles = {
        'inventario': 'INVENTARIO',
        'registros': 'REGISTROS Y PEDIDOS',
        'gestion': 'GESTIÓN',
        'finanzas': 'FINANZAS',
        'configuracion': 'CONFIGURACIÓN',
        'damabrava': 'DAMABRAVA'
    };
    return sectionTitles[sectionKey] || 'OTROS';
};

// Función simple para obtener los módulos disponibles para un empleado (legacy, usar getAvailableMainModules)
export const getAvailableModules = (employeeModules) => {
    if (!employeeModules || !Array.isArray(employeeModules)) return [];

    return employeeModules.map(module => {
        if (!module.modulos) return { ...module, icon: 'grid' };
        
        const mainModuleKey = BACKEND_TO_FRONTEND_MODULE[module.modulos.name];
        if (!mainModuleKey) return { ...module, icon: 'grid' };
        
        const mainModule = MODULES[mainModuleKey];
        if (!mainModule) return { ...module, icon: 'grid' };
        
        const submoduleKey = getSubmoduleKey(mainModuleKey, module.name);
        const submodule = mainModule[submoduleKey];
        
        if (submodule) {
            return {
                ...module,
                name: submodule.name,
                description: submodule.description,
                component: submodule.component,
                props: submodule.props,
                icon: submodule.icon || 'grid'
            };
        }
        
        return { ...module, icon: 'grid' };
    });
};
