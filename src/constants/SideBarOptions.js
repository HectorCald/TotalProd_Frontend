export const SideBarOptions = [
  {
    title: "PRINCIPAL",
    isCollapsible: false,
    items: [
      { id: "home", title: "Inicio", icon: "home", route: "/home", MenuSide: true },
      { id: "balance", title: "Balance", icon: "bar-chart-alt", route: "/balance", key: "balance", key_submenu: "ver_balance", MenuSide: true }
    ]
  },
  {
    title: "INVENTARIO",
    isCollapsible: false,
    items: [
      {
        id: "almacen", title: "Almacén General", icon: "store", route: "/almacen", key: "almacen_general",
        submenu: [
          { id: "almacen-salidas", title: "Venta", icon: "cart", route: "/almacen/salidas", key: "realizar_salidas" },
          { id: "almacen-entradas", title: "Nuevo Ingreso", icon: "box", route: "/almacen/entradas", key: "realizar_entradas" },
          { id: "almacen-pedidos", title: "Nuevo Pedido", icon: "shopping-bag", route: "/almacen/pedidos", key: "realizar_pedidos" },
          { id: "almacen-cotizar", title: "Nueva Cotización", icon: "file", route: "/almacen/cotizar", key: "cotizar" },
          { id: "almacen-gestionar", title: "Inventario", icon: "package", route: "/almacen/gestionar", key: "gestionar", MenuSide: true }
        ]
      },
      {
        id: "materia-prima", title: "Materia Prima", icon: "leaf", route: "/materia-prima", key: "materia_prima",
        submenu: [
          { id: "acopio-entradas", title: "Nuevo Ingreso", icon: "box", route: "/materia-prima/entradas", key: "realizar_entradas" },
          { id: "acopio-salidas", title: "Nueva Salida", icon: "cart", route: "/materia-prima/salidas", key: "realizar_salidas" },
          { id: "acopio-pedidos", title: "Nuevo Pedido", icon: "shopping-bag", route: "/materia-prima/pedidos", key: "realizar_pedidos" },
          { id: "acopio-gestionar", title: "Inventario", icon: "package", route: "/materia-prima/gestionar", key: "gestionar" }
        ]
      }
    ]
  },
  {
    title: "REGISTROS Y PEDIDOS",
    isCollapsible: false,
    items: [
      {
        id: "movimientos", title: "Movimientos", icon: "transfer", route: "/movimientos", key: "movimientos",
        submenu: [
          { id: "movimientos-almacen", title: "Almacén", route: "/movimientos/almacen", key: "movimientos_almacen" },
          { id: "movimientos-acopio", title: "Materia Prima", route: "/movimientos/acopio", key: "movimientos_materia_prima" }
        ]
      },
      {
        id: "pedidos", title: "Pedidos", icon: "cart", route: "/pedidos", key: "pedidos",
        submenu: [
          { id: "pedidos-almacen", title: "Almacén", route: "/pedidos/almacen", key: "pedidos_almacen" },
          { id: "pedidos-acopio", title: "Materia Prima", route: "/pedidos/acopio", key: "pedidos_materia_prima" }
        ]
      },
      { id: "conteos", title: "Conteos", icon: "calculator", route: "/conteos", key: "conteos", key_submenu: "gestionar" },
      { id: "cotizaciones", title: "Cotizaciones", icon: "file", route: "/cotizaciones", key: "cotizaciones", key_submenu: "gestionar" }
    ]
  },
  {
    title: "GESTIÓN",
    isCollapsible: true,
    defaultOpen: false,
    items: [
      { id: "clientes", title: "Clientes", icon: "user", route: "/clientes", key: "clientes", key_submenu: "gestionar" },
      { id: "proveedores", title: "Proveedores", icon: "user", route: "/proveedores", key: "proveedores", key_submenu: "gestionar" },
      { id: "personal", title: "Personal", icon: "group", route: "/personal", key: "personal", key_submenu: "gestionar" }
    ]
  },
  {
    title: "FINANZAS",
    isCollapsible: true,
    defaultOpen: false,
    items: [
      { id: "pagos", title: "Pagos", icon: "wallet", route: "/pagos", key: "pagos", key_submenu: "gestionar" },
      { id: "deudas", title: "Deudas", icon: "receipt", route: "/deudas", key: "deudas", key_submenu: "gestionar", MenuSide: true }
    ]
  },
  {
    title: "DAMABRAVA",
    isCollapsible: true,
    defaultOpen: false,
    empresaCodigo: "damabrava",
    items: [
      { id: "Verificación", title: "Verificación", icon: "check-circle", route: "/damabrava/verificacion", key: "damabrava", key_submenu: "verificar" },
      { id: "Mi Producción", title: "Mi Producción", icon: "archive", route: "/damabrava/mi_produccion", key: "damabrava", key_submenu: "mi_produccion" },
      { id: "Reglas", title: "Reglas", icon: "book", route: "/damabrava/reglas", key: "damabrava", key_submenu: "reglas" },
      { id: "Pagos", title: "Pagos", icon: "wallet", route: "/damabrava/pagos", key: "damabrava", key_submenu: "pagos_damabrava" },
    ]
  }
];

export { SideConfigOptions, SideConfigOptions as ConfigOptions } from './SideConfigOptions';
