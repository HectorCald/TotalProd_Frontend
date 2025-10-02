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
import imagenBalance from '../assets/import-export.png';
import imageBalance from '../assets/balance.png';
export const MODULES = {
    // Módulos principales
    Almacen: {
        name: 'Almacén General',
        imagen: imagenAlmacen,
        descripcion: 'Administra tu almacén de productos terminados, realiza entradas y salidas.',
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
    },
    Acopio: {
        name: 'Materia Prima',
        imagen: imagenAcopio,
        descripcion: 'Administra tu materia prima, realiza entradas y salidas.',
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
    },
    Movimientos: {  
        name: 'Movimientos',
        imagen: imagenMovimientos,
        descripcion: 'Administra tus movimientos de productos, realiza entradas y salidas.',

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
    Pedidos: {
        name: 'Pedidos',
        imagen: imagenPedidos,
        descripcion: 'Administra tus pedidos de productos, realiza entradas y salidas.',
        pedidos_almacen: {
            name: 'Almacen',
            description: 'Administra tus pedidos de productos.',
            icon: 'package',
            component: 'Pedidos',
            props: { tipo: 'almacen' }
        },
        pedidos_acopio: {
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
        descripcion: 'Administra tus precios de productos, realiza entradas y salidas.',
        gestionar: {
            name: 'Gestionar',
            description: 'Administra tus precios de productos.',
            icon: 'file',
            component: 'Precios',
            props: { tipo: 'almacen' }
        },
    },
    Clientes: {
        name: 'Clientes',
        imagen: imagenClientes,
        descripcion: 'Administra tus clientes, realiza entradas y salidas.',
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
        descripcion: 'Administra tus proveedores, realiza entradas y salidas.',
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
        descripcion: 'Administra tus gastos, realiza entradas y salidas.',
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
        descripcion: 'Administra las deudas de tus clientes, controla vencimientos y pagos.',
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
        descripcion: 'Genera reportes detallados de ventas, movimientos y análisis de negocio.',
        gestionar: {
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
        descripcion: 'Visualiza el balance de ingresos y egresos de tu negocio.',
        gestionar: {
            name: 'Balance',
            description: 'Controla el balance de tu negocio.',
            icon: 'trending-up',
            component: 'Balance',
            props: { tipo: 'almacen' }
        },
    },
};

// Función para obtener los módulos principales disponibles para un empleado
export const getAvailableMainModules = (employeeModules) => {
    if (!employeeModules || !Array.isArray(employeeModules)) return [];

    const mainModules = new Set();
    
    // Recopilar módulos principales únicos
    employeeModules.forEach(module => {
        if (module.modulos) {
            if (module.modulos.name === 'Almacen') {
                mainModules.add('Almacen');
            } else if (module.modulos.name === 'Materia') {
                mainModules.add('Acopio');
            } else if (module.modulos.name === 'Movimientos') {
                mainModules.add('Movimientos');
            } else if (module.modulos.name === 'Pedidos') {
                mainModules.add('Pedidos');
            } else if (module.modulos.name === 'Precios') {
                mainModules.add('Precios');
            } else if (module.modulos.name === 'Clientes') {
                mainModules.add('Clientes');
            } else if (module.modulos.name === 'Proveedores') {
                mainModules.add('Proveedores');
            } else if (module.modulos.name === 'Gastos') {
                mainModules.add('Gastos');
            } else if (module.modulos.name === 'Deudas') {
                mainModules.add('Deudas');
            } else if (module.modulos.name === 'Reportes') {
                mainModules.add('Reportes');
            } else if (module.modulos.name === 'Balance') {
                mainModules.add('Balance');
            }
        }
    });

    // Convertir a array con datos completos
    return Array.from(mainModules).map(moduleKey => {
        const module = MODULES[moduleKey];
        return {
            key: moduleKey,
            name: module.name,
            description: module.descripcion,
            image: module.imagen,
            submodules: Object.keys(module).filter(key => 
                key !== 'name' && key !== 'imagen' && key !== 'descripcion'
            ).map(key => module[key])
        };
    });
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
        // Si no se encuentra, devolver tal como está
        return {
            ...module,
            icon: 'grid'
        };
    });
};
