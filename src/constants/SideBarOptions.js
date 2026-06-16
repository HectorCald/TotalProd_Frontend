export const SideBarOptions = [
  {
    title: "HOME",
    items: [
      { id: "dashboard", title: "Dashboard", icon: "home", route: "/dashboard" }
    ]
  },
  {
    title: "INVENTARIO",
    items: [
      {
        id: "almacen", title: "Almacén General", icon: "store", route: "/almacen",
        submenu: [
          { id: "almacen-salidas", title: "Salida o Venta", route: "/almacen/salidas" },
          { id: "almacen-entradas", title: "Entrada", route: "/almacen/entradas" },
          { id: "almacen-pedidos", title: "Nuevo Pedido", route: "/almacen/pedidos" },
          { id: "almacen-gestionar", title: "Gestionar", route: "/almacen/gestionar" },
          { id: "almacen-conteo", title: "Conteo", route: "/almacen/conteo" },
          { id: "almacen-cotizar", title: "Cotizar", route: "/almacen/cotizar" }
        ]
      },
      {
        id: "materia-prima", title: "Materia Prima", icon: "leaf", route: "/materia-prima",
        submenu: [
          { id: "acopio-entradas", title: "Entrada", route: "/materia-prima/entradas" },
          { id: "acopio-salidas", title: "Salida", route: "/materia-prima/salidas" },
          { id: "acopio-pedidos", title: "Nuevo Pedido", route: "/materia-prima/pedidos" },
          { id: "acopio-gestionar", title: "Gestionar", route: "/materia-prima/gestionar" },
          { id: "acopio-auxiliar", title: "Pesaje", route: "/materia-prima/pesaje" }
        ]
      }
    ]
  },
  {
    title: "REGISTROS Y PEDIDOS",
    items: [
      {
        id: "movimientos", title: "Movimientos", icon: "transfer", route: "/movimientos",
        submenu: [
          { id: "movimientos-almacen", title: "Almacén", route: "/movimientos/almacen" },
          { id: "movimientos-acopio", title: "Materia Prima", route: "/movimientos/acopio" }
        ]
      },
      {
        id: "pedidos", title: "Pedidos", icon: "cart", route: "/pedidos",
        submenu: [
          { id: "pedidos-almacen", title: "Almacén", route: "/pedidos/almacen" },
          { id: "pedidos-acopio", title: "Materia Prima", route: "/pedidos/acopio" }
        ]
      },
      {
        id: "conteos", title: "Conteos", icon: "calculator", route: "/conteos",
        submenu: [
          { id: "conteos-almacen", title: "Almacén", route: "/conteos/almacen" },
          { id: "conteos-acopio", title: "Materia Prima", route: "/conteos/acopio" }
        ]
      },
      { id: "cotizaciones", title: "Cotizaciones", icon: "file", route: "/cotizaciones" }
    ]
  },
  {
    title: "GESTIÓN",
    items: [
      { id: "clientes", title: "Clientes", icon: "user", route: "/clientes" },
      { id: "proveedores", title: "Proveedores", icon: "user", route: "/proveedores" },
      { id: "personal", title: "Personal", icon: "group", route: "/personal" }
    ]
  },
  {
    title: "FINANZAS",
    items: [
      { id: "pagos", title: "Pagos", icon: "wallet", route: "/pagos" },
      { id: "deudas", title: "Deudas", icon: "receipt", route: "/deudas" },
      { id: "balance", title: "Balance", icon: "bar-chart-alt", route: "/balance" }
    ]
  },
  {
    title: "CONFIGURACIÓN",
    items: [
      { id: "precios", title: "Precios", icon: "dollar", route: "/precios" },
         { id: "sucursales", title: "Sucursales", icon: "building", route: "/sucursales" },
      { id: "cargos", title: "Cargos", icon: "briefcase", route: "/cargos", isNew: true },
      { id: "categorias", title: "Categorías", icon: "category", route: "/categorias", isNew: true },
      { id: "socios", title: "Socios", icon: "group", route: "/socios", isNew: true },
      { id: "exportar", title: "Exportar", icon: "export", route: "/exportar", isNew: true }
    ]
  },
  {
    title: "DAMABRAVA",
    items: [
      { id: "Verificación", title: "Verificación", icon: "check-circle", route: "/damabrava/verificacion" },
      { id: "Mi Producción", title: "Mi Producción", icon: "archive", route: "/damabrava/mi_produccion" },
      { id: "Reglas", title: "Reglas", icon: "book", route: "/damabrava/reglas" },
    ]
  }
];
