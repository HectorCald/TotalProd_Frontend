// Opciones oficiales del menú lateral para TotalProd
export const MENU_OPTIONS = [
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
            title: 'Salidas',
            icon: 'minus',
            action: 'openView',
            viewName: 'almacenMedioGeneral',
            props: { tipo: 'salida' }
          },
          {
            id: 'almacen-entradas',
            title: 'Entradas',
            icon: 'plus',
            action: 'openView',
            viewName: 'almacenMedioGeneral',
            props: { tipo: 'entrada' }
          },
          {
            id: 'almacen-pedidos',
            title: 'Realizar Pedido',
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
            title: 'Entradas',
            icon: 'plus',
            action: 'openView',
            viewName: 'almacenMedio',
            props: { tipo: 'entrada' }
          },
          {
            id: 'acopio-salidas',
            title: 'Salidas',
            icon: 'minus',
            action: 'openView',
            viewName: 'almacenMedio',
            props: { tipo: 'salida' }
          },
          {
            id: 'acopio-pedidos',
            title: 'Realizar Pedido',
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
          }
        ]
      },
      {
        id: 'movimientos',
        title: 'Movimientos',
        icon: 'move-horizontal',
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
      }
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
        id: 'gastos',
        title: 'Gastos',
        icon: 'wallet',
        action: 'openView',
        viewName: 'gastos'
      },
    ]
  }
];

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
