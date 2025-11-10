import { isDamabrava, isSoloVentas } from '../utils/empresaHelper';

// Opciones base del menú lateral para TotalProd
const MENU_OPTIONS_BASE = [
  {
    id: 'dashboard',
    title: 'DASHBOARD',
    type: 'section',
    items: [
      {
        id: 'inicio',
        title: 'Inicio',
        icon: 'home',
        isActive: true,
        action: 'setScreen',
        screenId: 'inicio',
        route: '/dashboard/default'
      },
    ]
  },
  {
    id: 'inventario',
    title: 'INVENTARIO',
    type: 'section',
    items: [
      {
        id: 'almacen',
        title: 'Almacén General',
        icon: 'store',
        hasSubmenu: true,
        action: 'toggleSubmenu',
        submenu: [
          {
            id: 'almacen-salidas',
            title: 'Salida o Venta',
            icon: 'up-arrow-alt',
            action: 'openView',
            viewName: 'almacenMedioGeneral',
            props: { tipo: 'salida' }
          },
          {
            id: 'almacen-entradas',
            title: 'Entrada',
            icon: 'down-arrow-alt',
            action: 'openView',
            viewName: 'almacenMedioGeneral',
            props: { tipo: 'entrada' }
          },
          {
            id: 'almacen-pedidos',
            title: 'Nuevo Pedido',
            icon: 'cart',
            action: 'openView',
            viewName: 'almacenMedioGeneral',
            props: { tipo: 'pedido' }
          },
          {
            id: 'almacen-gestionar',
            title: 'Gestionar',
            icon: 'store',
            action: 'openView',
            viewName: 'almacenMedioGeneral',
            props: { tipo: 'almacen' }
          },
          {
            id: 'almacen-auxiliar',
            title: 'Conteo',
            icon: 'calculator',
            action: 'openView',
            viewName: 'almacenGeneralAuxiliar',
            props: { tipo: 'conteo' }
          },
          {
            id: 'almacen-cotizar',
            title: 'Cotizar',
            icon: 'file',
            action: 'openView',
            viewName: 'almacenGeneralAuxiliar',
            props: { tipo: 'cotizar' }
          }
        ]
      },
      
      {
        id: 'materia-prima',
        title: 'Materia Prima',
        icon: 'leaf',
        hasSubmenu: true,
        action: 'toggleSubmenu',
        submenu: [
          {
            id: 'acopio-entradas',
            title: 'Entrada',
            icon: 'down-arrow-alt',
            action: 'openView',
            viewName: 'almacenMedio',
            props: { tipo: 'entrada' }
          },
          {
            id: 'acopio-salidas',
            title: 'Salida',
            icon: 'up-arrow-alt',
            action: 'openView',
            viewName: 'almacenMedio',
            props: { tipo: 'salida' }
          },
          {
            id: 'acopio-pedidos',
            title: 'Nuevo Pedido',
            icon: 'cart',
            action: 'openView',
            viewName: 'almacenMedio',
            props: { tipo: 'pedido' }
          },
          {
            id: 'acopio-gestionar',
            title: 'Gestionar',
            icon: 'store',
            action: 'openView',
            viewName: 'almacenMedio',
            props: { tipo: 'almacen' }
          },
          {
            id: 'acopio-auxiliar',
            title: 'Pesaje',
            icon: 'calculator',
            action: 'openView',
            viewName: 'almacenAcopioAuxiliar',
            props: { tipo: 'conteo' }
          }
        ]
      },
    ]
  },
  {
    id: 'registros',
    title: 'REGISTROS Y PEDIDOS',
    type: 'section',
    items: [
      {
        id: 'movimientos',
        title: 'Movimientos',
        icon: 'transfer',
        hasSubmenu: true,
        action: 'toggleSubmenu',
        submenu: [
          {
            id: 'movimientos-almacen',
            title: 'Almacén',
            icon: 'package',
            action: 'openView',
            viewName: 'movimientos',
            props: { tipo: 'almacen' }
          },
          {
            id: 'movimientos-acopio',
            title: 'Materia Prima',
            icon: 'leaf',
            action: 'openView',
            viewName: 'movimientos',
            props: { tipo: 'acopio' }
          }
        ]
      },
      {
        id: 'pedidos',
        title: 'Pedidos',
        icon: 'cart',
        hasSubmenu: true,
        action: 'toggleSubmenu',
        submenu: [
          {
            id: 'pedidos-almacen',
            title: 'Almacén',
            icon: 'package',
            action: 'openView',
            viewName: 'pedidos',
            props: { tipo: 'almacen' }
          },
          {
            id: 'pedidos-acopio',
            title: 'Materia Prima',
            icon: 'leaf',
            action: 'openView',
            viewName: 'pedidos',
            props: { tipo: 'acopio' }
          }
        ]
      },
      {
        id: 'conteos',
        title: 'Conteos',
        icon: 'calculator',
        hasSubmenu: true,
        action: 'toggleSubmenu',
        submenu: [
          {
            id: 'conteos-almacen',
            title: 'Almacén',
            icon: 'package',
            action: 'openView',
            viewName: 'conteos',
            props: { tipo: 'almacen' }
          },
          {
            id: 'conteos-acopio',
            title: 'Materia Prima',
            icon: 'leaf',
            action: 'openView',
            viewName: 'conteos',
            props: { tipo: 'acopio' }
          }
        ]
      },
      {
        id: 'cotizaciones',
        title: 'Cotizaciones',
        icon: 'file',
        action: 'openView',
        viewName: 'cotizaciones'
      },
    ]
  },
  {
    id: 'gestion',
    title: 'GESTIÓN',
    type: 'section',
    items: [
      {
        id: 'clientes',
        title: 'Clientes',
        icon: 'user',
        action: 'openView',
        viewName: 'clientes'
      },
      {
        id: 'proveedores',
        title: 'Proveedores',
        icon: 'truck',
        action: 'openView',
        viewName: 'proveedores'
      },
      {
        id: 'personal',
        title: 'Personal',
        icon: 'group',
        action: 'openView',
        viewName: 'personal'
      },
    ]
  },

  {
    id: 'finanzas',
    title: 'FINANZAS',
    type: 'section',
    items: [
      {
        id: 'gastos',
        title: 'Gastos',
        icon: 'wallet',
        action: 'openView',
        viewName: 'gastos'
      },
      {
        id: 'deudas',
        title: 'Deudas',
        icon: 'receipt',
        action: 'openView',
        viewName: 'deudas'
      },
      {
        id: 'balance',
        title: 'Balance',
        icon: 'bar-chart-alt',
        action: 'openView',
        viewName: 'balance'
      },
      {
        id: 'reportes',
        title: 'Reportes',
        icon: 'file',
        action: 'openView',
        viewName: 'reportes'
      },
    ]
  },
  {
    id: 'configuracion',
    title: 'CONFIGURACIÓN',
    type: 'section',
    items: [
      {
        id: 'precios',
        title: 'Precios',
        icon: 'dollar',
        action: 'openView',
        viewName: 'precios'
      },
      {
        id: 'sucursales',
        title: 'Sucursales',
        icon: 'building',
        action: 'openView',
        viewName: 'sucursales'
      },
      {
        id: 'importar-exportar',
        title: 'Importar/Exportar',
        icon: 'import',
        action: 'openView',
        viewName: 'importar-exportar'
      },
      {
        id: 'historial',
        title: 'Historial',
        icon: 'history',
        action: 'openView',
        viewName: 'historial'
      },
    ]
  },
  // Solo incluir sección Damabrava si la empresa es Damabrava
  ...(isDamabrava() ? [{
    id: 'damabrava',
    title: 'DAMABRAVA',
    type: 'section',
    items: [
      {
        id: 'Formulario',
        title: 'Formulario',
        icon: 'file',
        action: 'openView',
        viewName: 'formulario'
      },
      {
        id: 'Verificación',
        title: 'Verificación',
        icon: 'check-circle',
        action: 'openView',
        viewName: 'verificacion'
      },
      {
        id: 'Mi Producción',
        title: 'Mi Producción',
        icon: 'file',
        action: 'openView',
        viewName: 'mi_produccion'
      },
      {
        id: 'Reglas',
        title: 'Reglas',
        icon: 'file',
        action: 'openView',
        viewName: 'reglas'
      },
    ]
  }] : [])
];

// Exportar también las opciones base para compatibilidad
export const MENU_OPTIONS = MENU_OPTIONS_BASE;

// Función para obtener opciones de menú filtradas según el tipo de empresa
export const getMenuOptions = (user) => {
  const soloVentas = isSoloVentas(user);
  
  // Si no hay user, devolver todas las opciones
  if (!user) {
    return MENU_OPTIONS_BASE;
  }

  // Filtrar opciones de materia prima si es solo ventas
  return MENU_OPTIONS_BASE.map(section => {
    if (section.id === 'inventario') {
      return {
        ...section,
        items: section.items.filter(item => {
          // Si es solo ventas, ocultar el item de "Materia Prima"
          if (soloVentas && item.id === 'materia-prima') {
            return false;
          }
          return true;
        })
      };
    }
    
    if (section.id === 'registros') {
      return {
        ...section,
        items: section.items.map(item => {
          // Si tiene submenu, filtrar opciones de materia prima
          if (item.hasSubmenu && item.submenu) {
            const filteredSubmenu = item.submenu.filter(subItem => {
              // Si es solo ventas, ocultar opciones de materia prima/acopio
              if (soloVentas) {
                const isMateriaPrima = subItem.id?.includes('acopio') || 
                                       subItem.id?.includes('materia') ||
                                       subItem.props?.tipo === 'acopio';
                return !isMateriaPrima;
              }
              return true;
            });

            // Si después del filtrado solo queda una opción, convertir en item directo
            if (filteredSubmenu.length === 1) {
              const singleSubItem = filteredSubmenu[0];
              return {
                id: singleSubItem.id,
                title: item.title, // Mantener el título del padre
                icon: item.icon,
                action: singleSubItem.action || 'openView',
                viewName: singleSubItem.viewName || singleSubItem.view,
                props: singleSubItem.props || {}
              };
            }

            // Si quedan múltiples opciones, mantener el submenu
            return {
              ...item,
              submenu: filteredSubmenu
            };
          }
          return item;
        })
      };
    }

    // También aplicar a otras secciones que puedan tener submenus
    if (section.id === 'inventario') {
      return {
        ...section,
        items: section.items.map(item => {
          // Si tiene submenu, verificar si solo queda una opción después del filtrado
          if (item.hasSubmenu && item.submenu) {
            const filteredSubmenu = item.submenu.filter(subItem => {
              // No filtrar nada aquí, solo verificar cantidad
              return true;
            });

            // Si solo queda una opción, convertir en item directo
            if (filteredSubmenu.length === 1) {
              const singleSubItem = filteredSubmenu[0];
              return {
                id: singleSubItem.id,
                title: item.title, // Mantener el título del padre
                icon: item.icon,
                action: singleSubItem.action || 'openView',
                viewName: singleSubItem.viewName || singleSubItem.view,
                props: singleSubItem.props || {}
              };
            }

            // Si quedan múltiples opciones, mantener el submenu
            return {
              ...item,
              submenu: filteredSubmenu
            };
          }
          return item;
        })
      };
    }
    
    return section;
  });
};

// Función para manejar las acciones del menú
export const handleMenuAction = (menuItem, onViewOpen, onNavigate, onScreenChange) => {
  switch (menuItem.action) {
    case 'openView':
      if (onViewOpen && menuItem.viewName) {
        onViewOpen(menuItem.viewName, menuItem.props);
      }
      break;
    case 'navigate':
      if (onNavigate && menuItem.route) {
        onNavigate(menuItem.route);
      }
      break;
    case 'setScreen':
      if (onScreenChange && menuItem.screenId) {
        onScreenChange(menuItem.screenId);
      }
      break;
    case 'toggleSubmenu':
      // Esta acción se maneja internamente en el componente
      break;
    default:
      console.log('Acción no reconocida:', menuItem.action);
  }
};

// Función para obtener opciones por sección
export const getMenuOptionsBySection = (sectionId) => {
  const section = MENU_OPTIONS.find(s => s.id === sectionId);
  return section ? section.items : [];
};

// Función para buscar una opción específica
export const findMenuOption = (optionId) => {
  for (const section of MENU_OPTIONS) {
    for (const item of section.items) {
      if (item.id === optionId) {
        return item;
      }
      if (item.submenu) {
        for (const subItem of item.submenu) {
          if (subItem.id === optionId) {
            return subItem;
          }
        }
      }
    }
  }
  return null;
};
