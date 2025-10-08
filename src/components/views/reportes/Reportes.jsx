import React, { useState } from 'react';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Select from '../../common/Select';
import RefreshIndicator from '../../common/RefreshIndicator';
import sucursalesService from '../../../services/sucursalesService';
import ModalDescarga from '../../ui/ModalDescarga';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import gastosService from '../../../services/gastosService';
import Notification from '../../common/Notification';
import styles from '../../../styles/view.module.css';
import Boton from '../../common/Boton';
import DateRangePicker from '../../common/DateRangePicker';

const Reportes = ({ isOpen, setIsOpen }) => {
  const DEBUG_REPORTES = false;
  // Estados para el rango de fechas
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [areaSeleccionada, setAreaSeleccionada] = useState('');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [isDescargaOpen, setIsDescargaOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [datosReporte, setDatosReporte] = useState({});

  // Estados para la notificación
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'success',
    text: ''
  });

  // Estados para sucursales
  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [error, setError] = useState(null);
  const [sucursalesCargadas, setSucursalesCargadas] = useState(false);
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Función para cargar sucursales
  const cargarSucursales = async () => {
    if (DEBUG_REPORTES) console.group('Sucursal: carga');
    if (DEBUG_REPORTES) console.log('Iniciando carga de sucursales...');
    setLoadingSucursales(true);
    setShowRefreshIndicator(true);
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await sucursalesService.getByEmpresaId();
      if (DEBUG_REPORTES) console.log('Respuesta sucursales:', response);
      if (response.success) {
        setSucursales(response.data);
        if (DEBUG_REPORTES) console.table(response.data);
        setSucursalesCargadas(true);
      } else {
        setError(response);
      }
    } catch (error) {
      setError(error);
    } finally {
      setLoadingSucursales(false);
      setTimeout(() => {
        setIsRefreshing(false);
        setTimeout(() => {
          setShowRefreshIndicator(false);
        }, 1000);
      }, 500);
      if (DEBUG_REPORTES) console.groupEnd();
    }
  };

  // Cargar sucursales solo la primera vez
  React.useEffect(() => {
    if (!sucursalesCargadas && isOpen) {
      if (DEBUG_REPORTES) console.log('Vista abierta: iniciando carga inicial de sucursales');
      cargarSucursales();
    }
  }, [sucursalesCargadas, isOpen]);

  // Función para mostrar notificaciones
  const mostrarNotificacion = (tipo, texto) => {
    if (DEBUG_REPORTES) console.log('Notificación ->', { tipo, texto });
    setNotification({
      isVisible: true,
      type: tipo,
      text: texto
    });

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // Función para manejar el cambio de fechas del DateRangePicker
  const handleFechaChange = (start, end) => {
    if (start) {
      // Establecer inicio del día
      const fechaInicioNormalizada = new Date(start);
      fechaInicioNormalizada.setHours(0, 0, 0, 0);
      setFechaInicio(fechaInicioNormalizada);
    }

    if (end) {
      // Establecer fin del día
      const fechaFinNormalizada = new Date(end);
      fechaFinNormalizada.setHours(23, 59, 59, 999);
      setFechaFin(fechaFinNormalizada);
    } else if (start) {
      // Si solo hay fecha de inicio, usar la misma como fin
      const fechaFinNormalizada = new Date(start);
      fechaFinNormalizada.setHours(23, 59, 59, 999);
      setFechaFin(fechaFinNormalizada);
    }

    if (DEBUG_REPORTES) {
      console.log('Fechas actualizadas:', {
        fechaInicio: start,
        fechaFin: end,
        fechaInicioNormalizada: start ? new Date(start).setHours(0, 0, 0, 0) : null,
        fechaFinNormalizada: end ? new Date(end).setHours(23, 59, 59, 999) : null
      });
    }
  };

  const opcionesArea = [
    { value: 'ventas', label: 'Ventas', icon: 'money' },
    { value: 'almacen_general', label: 'Almacen General', icon: 'store' },
    { value: 'materia_Prima', label: 'Materia Prima', icon: 'leaf' },
    { value: 'pedidos', label: 'Pedidos', icon: 'cart' },
    { value: 'balance', label: 'Balance', icon: 'transfer' },
  ];

  // Convertir sucursales a formato para el Select
  const opcionesSucursales = sucursales.map(sucursal => ({
    value: sucursal.id,
    label: sucursal.name,
    icon: 'map'
  }));

  const handleAreaChange = (valor) => {
    setAreaSeleccionada(valor);
    if (DEBUG_REPORTES) console.log('Área seleccionada:', valor);
  };

  const handleSucursalChange = (valor) => {
    setSucursalSeleccionada(valor);
    if (DEBUG_REPORTES) console.log('Sucursal seleccionada:', valor);
  };


  const handleRefresh = async () => {
    if (DEBUG_REPORTES) console.log('Refrescando sucursales manualmente...');
    await cargarSucursales();
  };

  // Función para generar reporte de ventas (solo salidas de almacén)
  const generarReporteVentas = async (movimientos, { fechaInicio, fechaFin }) => {
    if (DEBUG_REPORTES) {
      console.group('Generar Reporte: Ventas');
      console.log('Fechas periodo:', {
        fechaInicio,
        fechaFin,
        inicio_locale_LaPaz: fechaInicio.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
        fin_locale_LaPaz: fechaFin.toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
      });
      console.log('Movimientos recibidos:', movimientos?.length);
    }
    const salidas = movimientos.filter(m => m.type === 'salida');
    if (DEBUG_REPORTES) console.log('Salidas filtradas:', salidas.length);

    // Agrupar productos
    const productosAgrupados = {};
    salidas.forEach((movimiento, idx) => {
      movimiento.productos.forEach(producto => {
        const key = producto.producto.id;
        if (!productosAgrupados[key]) {
          productosAgrupados[key] = {
            nombre: producto.producto.name,
            cantidad: 0,
            precioUnitario: producto.precio_unitario,
            subtotal: 0
          };
        }
        productosAgrupados[key].cantidad += parseFloat(producto.cantidad);
        productosAgrupados[key].subtotal += parseFloat(producto.subtotal);
      });
      if (DEBUG_REPORTES && idx < 5) {
        // Muestra algunas filas para no saturar la consola
        const fechaMovimiento = new Date(movimiento.fecha);
        const infoFila = {
          id: movimiento.id,
          fecha_raw: movimiento.fecha,
          fecha_toString: fechaMovimiento.toString(),
          fecha_locale_LaPaz: fechaMovimiento.toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
        };
        console.log('Salida ejemplo:', infoFila);
      }
    });

    const tablaHeaders = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const productosArray = Object.values(productosAgrupados);
    const tablaValores = productosArray.map(producto => [
      producto.nombre,
      producto.cantidad.toString(),
      `Bs. ${parseFloat(producto.precioUnitario).toFixed(2)}`,
      `Bs. ${parseFloat(producto.subtotal).toFixed(2)}`
    ]);

    const total = productosArray.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);

    // No agregar fila TOTAL en la tabla

    // Calcular producto más y menos vendido por cantidad
    let productoMasVendido = null;
    let productoMenosVendido = null;
    if (productosArray.length > 0) {
      productoMasVendido = productosArray.reduce((a, b) => (a.cantidad >= b.cantidad ? a : b));
      productoMenosVendido = productosArray.reduce((a, b) => (a.cantidad <= b.cantidad ? a : b));
    }

    // Formatear período con fechas específicas
    const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
    const fechaFinFormateada = fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });

    let periodoConFechas;
    if (fechaInicio.getTime() === fechaFin.getTime()) {
      periodoConFechas = fechaFinFormateada;
    } else {
      periodoConFechas = `${fechaInicioFormateada} a ${fechaFinFormateada}`;
    }

    const resultado = {
      informacionSuperior: {
        'Tipo de Reporte': 'Ventas',
        'Período': periodoConFechas,
        'Sucursal': sucursales.find(s => s.id === sucursalSeleccionada)?.name || '',
        'Total': `Bs. ${total.toFixed(2)}`,
        'Cantidad de Movimientos': salidas.length.toString(),
        ...(productoMasVendido ? { 'Más vendido': `${productoMasVendido.nombre} (${productoMasVendido.cantidad})` } : {}),
        ...(productoMenosVendido ? { 'Menos vendido': `${productoMenosVendido.nombre} (${productoMenosVendido.cantidad})` } : {})
      },
      tablaHeaders,
      tablaValores
    };
    if (DEBUG_REPORTES) {
      console.log('Resultado Ventas:', resultado.informacionSuperior);
      console.groupEnd();
    }
    return resultado;
  };

  // Función para generar reporte de almacén general (entradas y salidas por separado)
  const generarReporteAlmacen = async (movimientos, { fechaInicio, fechaFin }) => {
    if (DEBUG_REPORTES) {
      console.group('Generar Reporte: Almacén General');
      console.log('Fechas periodo:', {
        fechaInicio,
        fechaFin,
        inicio_locale_LaPaz: fechaInicio.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
        fin_locale_LaPaz: fechaFin.toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
      });
      console.log('Movimientos recibidos:', movimientos?.length);
    }
    const entradas = movimientos.filter(m => m.type === 'entrada');
    const salidas = movimientos.filter(m => m.type === 'salida');
    if (DEBUG_REPORTES) console.log('Entradas:', entradas.length, 'Salidas:', salidas.length);

    // Agrupar productos de entradas
    const productosEntradas = {};
    entradas.forEach(movimiento => {
      movimiento.productos.forEach(producto => {
        const key = producto.producto.id;
        if (!productosEntradas[key]) {
          productosEntradas[key] = {
            nombre: producto.producto.name,
            cantidad: 0,
            precioUnitario: producto.precio_unitario,
            subtotal: 0
          };
        }
        productosEntradas[key].cantidad += parseFloat(producto.cantidad);
        productosEntradas[key].subtotal += parseFloat(producto.subtotal);
      });
    });

    // Agrupar productos de salidas
    const productosSalidas = {};
    salidas.forEach(movimiento => {
      movimiento.productos.forEach(producto => {
        const key = producto.producto.id;
        if (!productosSalidas[key]) {
          productosSalidas[key] = {
            nombre: producto.producto.name,
            cantidad: 0,
            precioUnitario: producto.precio_unitario,
            subtotal: 0
          };
        }
        productosSalidas[key].cantidad += parseFloat(producto.cantidad);
        productosSalidas[key].subtotal += parseFloat(producto.subtotal);
      });
    });

    const tablaHeaders = ['Tipo', 'Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const tablaValores = [];

    // Agregar entradas
    Object.values(productosEntradas).forEach(producto => {
      tablaValores.push([
        'Entrada',
        producto.nombre,
        producto.cantidad.toString(),
        `Bs. ${parseFloat(producto.precioUnitario).toFixed(2)}`,
        `Bs. ${parseFloat(producto.subtotal).toFixed(2)}`
      ]);
    });

    // Agregar salidas
    Object.values(productosSalidas).forEach(producto => {
      tablaValores.push([
        'Salida',
        producto.nombre,
        producto.cantidad.toString(),
        `Bs. ${parseFloat(producto.precioUnitario).toFixed(2)}`,
        `Bs. ${parseFloat(producto.subtotal).toFixed(2)}`
      ]);
    });

    const totalEntradas = Object.values(productosEntradas).reduce((sum, p) => sum + parseFloat(p.subtotal), 0);
    const totalSalidas = Object.values(productosSalidas).reduce((sum, p) => sum + parseFloat(p.subtotal), 0);

    // Formatear período con fechas específicas
    const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
    const fechaFinFormateada = fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });

    let periodoConFechas;
    if (fechaInicio.getTime() === fechaFin.getTime()) {
      periodoConFechas = fechaFinFormateada;
    } else {
      periodoConFechas = `${fechaInicioFormateada} a ${fechaFinFormateada}`;
    }

    const resultado = {
      informacionSuperior: {
        'Tipo de Reporte': 'Almacén General',
        'Período': periodoConFechas,
        'Sucursal': sucursales.find(s => s.id === sucursalSeleccionada)?.name || '',
        'Total Entradas': `Bs. ${totalEntradas.toFixed(2)}`,
        'Total Salidas': `Bs. ${totalSalidas.toFixed(2)}`,
        'Movimientos Entrada': entradas.length.toString(),
        'Movimientos Salida': salidas.length.toString()
      },
      tablaHeaders,
      tablaValores
    };
    if (DEBUG_REPORTES) {
      console.log('Resultado Almacén:', resultado.informacionSuperior);
      console.groupEnd();
    }
    return resultado;
  };

  // Función para generar reporte de materia prima (entradas con costo)
  const generarReporteMateriaPrima = async (movimientos, { fechaInicio, fechaFin }) => {
    if (DEBUG_REPORTES) console.log('🌾 Movimientos de materia prima recibidos:', movimientos);
    const entradas = movimientos.filter(m => m.type === 'entrada');
    if (DEBUG_REPORTES) console.log('🌾 Entradas filtradas:', entradas);

    // Agrupar productos
    const productosAgrupados = {};
    entradas.forEach(movimiento => {
      const key = movimiento.product.id;
      if (!productosAgrupados[key]) {
        productosAgrupados[key] = {
          nombre: movimiento.product.name,
          cantidad: 0,
          costo: movimiento.costo || 0,
          subtotal: 0
        };
      }
      productosAgrupados[key].cantidad += parseFloat(movimiento.quantity);
      productosAgrupados[key].subtotal += parseFloat(movimiento.costo || 0);
    });

    if (DEBUG_REPORTES) console.log('🌾 Productos agrupados:', productosAgrupados);

    const tablaHeaders = ['Producto', 'Cantidad', 'Costo', 'Subtotal'];
    const tablaValores = Object.values(productosAgrupados).map(producto => [
      producto.nombre,
      producto.cantidad.toString(),
      `Bs. ${parseFloat(producto.costo).toFixed(2)}`,
      `Bs. ${parseFloat(producto.subtotal).toFixed(2)}`
    ]);

    if (DEBUG_REPORTES) console.log('🌾 Tabla headers:', tablaHeaders);
    if (DEBUG_REPORTES) console.log('🌾 Tabla valores:', tablaValores);

    const total = Object.values(productosAgrupados).reduce((sum, p) => sum + parseFloat(p.subtotal), 0);

    // Formatear período con fechas específicas
    const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
    const fechaFinFormateada = fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });

    let periodoConFechas;
    if (fechaInicio.getTime() === fechaFin.getTime()) {
      periodoConFechas = fechaFinFormateada;
    } else {
      periodoConFechas = `${fechaInicioFormateada} a ${fechaFinFormateada}`;
    }

    const reporteData = {
      informacionSuperior: {
        'Tipo de Reporte': 'Materia Prima',
        'Período': periodoConFechas,
        'Sucursal': sucursales.find(s => s.id === sucursalSeleccionada)?.name || '',
        'Total Costo': `Bs. ${total.toFixed(2)}`,
        'Cantidad de Movimientos': entradas.length.toString()
      },
      tablaHeaders,
      tablaValores
    };

    if (DEBUG_REPORTES) console.log('🌾 Reporte data final:', reporteData);
    return reporteData;
  };

  // Función para generar reporte de pedidos
  const generarReportePedidos = async (pedidos, { fechaInicio, fechaFin }) => {
    if (DEBUG_REPORTES) {
      console.group('Generar Reporte: Pedidos');
      console.log('Pedidos recibidos:', pedidos?.length);
      console.log('Fechas periodo:', {
        fechaInicio,
        fechaFin,
        inicio_locale_LaPaz: fechaInicio.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
        fin_locale_LaPaz: fechaFin.toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
      });
    }
    // Agrupar productos de pedidos
    const productosAgrupados = {};
    pedidos.forEach(pedido => {
      pedido.pedido_almacen_detalle.forEach(detalle => {
        const key = detalle.producto_almacen.id;
        if (!productosAgrupados[key]) {
          productosAgrupados[key] = {
            nombre: detalle.producto_almacen.name,
            cantidad: 0,
            precioUnitario: detalle.precio,
            subtotal: 0
          };
        }
        productosAgrupados[key].cantidad += parseFloat(detalle.cantidad);
        productosAgrupados[key].subtotal += parseFloat(detalle.precio * detalle.cantidad);
      });
    });

    const tablaHeaders = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const tablaValores = Object.values(productosAgrupados).map(producto => [
      producto.nombre,
      producto.cantidad.toString(),
      `Bs. ${parseFloat(producto.precioUnitario).toFixed(2)}`,
      `Bs. ${parseFloat(producto.subtotal).toFixed(2)}`
    ]);

    const total = Object.values(productosAgrupados).reduce((sum, p) => sum + parseFloat(p.subtotal), 0);

    // No agregar fila TOTAL en la tabla

    // Formatear período con fechas específicas
    const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
    const fechaFinFormateada = fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });

    let periodoConFechas;
    if (fechaInicio.getTime() === fechaFin.getTime()) {
      periodoConFechas = fechaFinFormateada;
    } else {
      periodoConFechas = `${fechaInicioFormateada} a ${fechaFinFormateada}`;
    }

    const resultado = {
      informacionSuperior: {
        'Tipo de Reporte': 'Pedidos',
        'Período': periodoConFechas,
        'Sucursal': sucursales.find(s => s.id === sucursalSeleccionada)?.name || '',
        'Total': `Bs. ${total.toFixed(2)}`,
        'Cantidad de Pedidos': pedidos.length.toString()
      },
      tablaHeaders,
      tablaValores
    };
    if (DEBUG_REPORTES) {
      console.log('Resultado Pedidos:', resultado.informacionSuperior);
      console.groupEnd();
    }
    return resultado;
  };

  // Función para generar reporte de balance (ingresos vs gastos)
  const generarReporteBalance = async ({ fechaInicio, fechaFin }) => {
    // 1) Obtener movimientos de almacén (solo salidas = ingresos/ventas)
    const movimientosResponse = await movimientosAlmacenService.getAllSinLimite('salida', null, 'fecha_desc', sucursalSeleccionada);
    // 2) Obtener gastos (todos) y filtrar por fecha
    const gastosResponse = await gastosService.getAllSinLimite();

    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);
    const fechaInicioStr = new Date(fechaInicioObj).toISOString().split('T')[0];
    const fechaFinStr = new Date(fechaFinObj).toISOString().split('T')[0];

    // Normalizar movimientos por día
    const movimientosFiltrados = (movimientosResponse?.data || []).filter(mov => {
      const fechaMovimiento = new Date(mov.fecha);
      const fMov = new Date(fechaMovimiento.getFullYear(), fechaMovimiento.getMonth(), fechaMovimiento.getDate());
      const fIni = new Date(fechaInicioObj.getFullYear(), fechaInicioObj.getMonth(), fechaInicioObj.getDate());
      const fFin = new Date(fechaFinObj.getFullYear(), fechaFinObj.getMonth(), fechaFinObj.getDate());
      return fMov >= fIni && fMov <= fFin;
    });

    // Tabla de ingresos
    const headersIngresos = ['Fecha', 'Cliente/Detalle', 'Subtotal'];
    const valoresIngresos = [];
    let totalIngresos = 0;
    movimientosFiltrados.forEach(mov => {
      const subtotal = (mov.productos || []).reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0);
      totalIngresos += subtotal;
      valoresIngresos.push([
        new Date(mov.fecha).toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' }),
        mov?.cliente?.name || mov?.observaciones || '-',
        `Bs. ${subtotal.toFixed(2)}`
      ]);
    });

    // Tabla de gastos
    const headersGastos = ['Fecha', 'Concepto', 'Valor'];
    const valoresGastos = [];
    let totalGastos = 0;
    (gastosResponse?.data || []).forEach(g => {
      const fechaG = g.fecha_gasto; // YYYY-MM-DD
      if (fechaG >= fechaInicioStr && fechaG <= fechaFinStr) {
        const valor = parseFloat(g.valor || 0);
        totalGastos += valor;
        valoresGastos.push([
          fechaG,
          g.concepto || '-',
          `Bs. ${valor.toFixed(2)}`
        ]);
      }
    });

    const neto = totalIngresos - totalGastos;

    // Para ModalDescarga: dos tablas separadas
    const tablas = [
      {
        titulo: 'INGRESOS',
        headers: headersIngresos,
        valores: [...valoresIngresos, ['Total Ingresos', '', `Bs. ${totalIngresos.toFixed(2)}`]]
      },
      {
        titulo: 'GASTOS',
        headers: headersGastos,
        valores: [...valoresGastos, ['Total Gastos', '', `Bs. ${totalGastos.toFixed(2)}`]]
      }
    ];

    // Periodo para header
    const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
    const fechaFinFormateada = fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
    const periodoConFechas = fechaInicio.getTime() === fechaFin.getTime() ? fechaFinFormateada : `${fechaInicioFormateada} a ${fechaFinFormateada}`;

    return {
      informacionSuperior: {
        'Tipo de Reporte': 'Balance',
        'Período': periodoConFechas,
        'Sucursal': sucursales.find(s => s.id === sucursalSeleccionada)?.name || '',
        'Total Ingresos': `Bs. ${totalIngresos.toFixed(2)}`,
        'Total Gastos': `Bs. ${totalGastos.toFixed(2)}`,
        'Total': `Bs. ${neto.toFixed(2)}`
      },
      tablas
    };
  };

  // Función principal para generar el reporte
  const handleGenerarReporte = async () => {
    if (!fechaInicio || !fechaFin || !areaSeleccionada || !sucursalSeleccionada) {
      mostrarNotificacion('error', 'Por favor selecciona fechas, área y sucursal');
      return;
    }

    // Validar que para materia prima solo se pueda generar reporte de Casa Matriz
    if (areaSeleccionada === 'materia_Prima') {
      const sucursalSeleccionadaObj = sucursales.find(s => s.id === sucursalSeleccionada);
      if (sucursalSeleccionadaObj && sucursalSeleccionadaObj.name !== 'Casa Matriz') {
        mostrarNotificacion('error', 'Los reportes de materia prima solo están disponibles para Casa Matriz');
        return;
      }
    }

    if (DEBUG_REPORTES) {
      console.group('Generar Reporte: Inicio');
      console.log('Inputs ->', { fechaInicio, fechaFin, areaSeleccionada, sucursalSeleccionada });
    }
    setIsLoading(true);
    try {
      if (DEBUG_REPORTES) console.log('Rango de fechas ->', {
        fechaInicio,
        fechaFin,
        inicio_locale_LaPaz: fechaInicio.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
        fin_locale_LaPaz: fechaFin.toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
      });
      let reporteData = {};

      switch (areaSeleccionada) {
        case 'ventas':
          // Para ventas, obtener todos los movimientos y filtrar por fecha en el frontend
          const movimientosVentas = await movimientosAlmacenService.getAllSinLimite('salida', null, 'fecha_desc', sucursalSeleccionada);
          if (DEBUG_REPORTES) console.log('API ventas ->', movimientosVentas?.data?.length ?? 0);
          if (movimientosVentas.success && movimientosVentas.data) {
            // Filtrar por fecha en el frontend
            const movimientosFiltradosVentas = movimientosVentas.data.filter(movimiento => {
              const fechaMovimiento = new Date(movimiento.fecha);
              const fechaInicioObj = new Date(fechaInicio);
              const fechaFinObj = new Date(fechaFin);

              // Normalizar fechas a medianoche para comparación de días
              const fechaMovimientoNormalizada = new Date(fechaMovimiento.getFullYear(), fechaMovimiento.getMonth(), fechaMovimiento.getDate());
              const fechaInicioNormalizada = new Date(fechaInicioObj.getFullYear(), fechaInicioObj.getMonth(), fechaInicioObj.getDate());
              const fechaFinNormalizada = new Date(fechaFinObj.getFullYear(), fechaFinObj.getMonth(), fechaFinObj.getDate());

              const enRango = fechaMovimientoNormalizada >= fechaInicioNormalizada && fechaMovimientoNormalizada <= fechaFinNormalizada;
              if (DEBUG_REPORTES) {
                console.log('Comparación Ventas:', {
                  fechaMovimiento_raw: movimiento.fecha,
                  fechaMovimiento_toString: fechaMovimiento.toString(),
                  fechaMovimiento_locale_LaPaz: fechaMovimiento.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
                  fechaMovimientoNormalizada: fechaMovimientoNormalizada.toString(),
                  fechaInicioNormalizada: fechaInicioNormalizada.toString(),
                  fechaFinNormalizada: fechaFinNormalizada.toString(),
                  enRango
                });
              }
              return enRango;
            });

            if (movimientosFiltradosVentas.length === 0) {
              mostrarNotificacion('warning', 'No hay ventas en el período seleccionado');
              if (DEBUG_REPORTES) console.warn('Sin ventas en rango. Total API:', movimientosVentas.data.length);
              return;
            }

            reporteData = await generarReporteVentas(movimientosFiltradosVentas, { fechaInicio, fechaFin });
          } else {
            mostrarNotificacion('error', 'No se pudieron obtener los movimientos de ventas');
            return;
          }
          break;

        case 'almacen_general':
          // Para almacén general, obtener todos los movimientos y filtrar por fecha en el frontend
          const movimientosAlmacen = await movimientosAlmacenService.getAllSinLimite(null, null, 'fecha_desc', sucursalSeleccionada);
          if (DEBUG_REPORTES) console.log('API almacén ->', movimientosAlmacen?.data?.length ?? 0);

          if (movimientosAlmacen.success && movimientosAlmacen.data) {
            // Filtrar por fecha en el frontend
            const movimientosFiltradosAlmacen = movimientosAlmacen.data.filter(movimiento => {
              const fechaMovimiento = new Date(movimiento.fecha);
              const fechaInicioObj = new Date(fechaInicio);
              const fechaFinObj = new Date(fechaFin);

              // Normalizar fechas a medianoche para comparación de días
              const fechaMovimientoNormalizada = new Date(fechaMovimiento.getFullYear(), fechaMovimiento.getMonth(), fechaMovimiento.getDate());
              const fechaInicioNormalizada = new Date(fechaInicioObj.getFullYear(), fechaInicioObj.getMonth(), fechaInicioObj.getDate());
              const fechaFinNormalizada = new Date(fechaFinObj.getFullYear(), fechaFinObj.getMonth(), fechaFinObj.getDate());

              const enRango = fechaMovimientoNormalizada >= fechaInicioNormalizada && fechaMovimientoNormalizada <= fechaFinNormalizada;
              if (DEBUG_REPORTES) {
                console.log('Comparación Almacén:', {
                  fechaMovimiento_raw: movimiento.fecha,
                  fechaMovimiento_toString: fechaMovimiento.toString(),
                  fechaMovimiento_locale_LaPaz: fechaMovimiento.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
                  fechaMovimientoNormalizada: fechaMovimientoNormalizada.toString(),
                  fechaInicioNormalizada: fechaInicioNormalizada.toString(),
                  fechaFinNormalizada: fechaFinNormalizada.toString(),
                  enRango
                });
              }
              return enRango;
            });

            if (movimientosFiltradosAlmacen.length === 0) {
              mostrarNotificacion('warning', 'No hay movimientos de almacén en el período seleccionado');
              if (DEBUG_REPORTES) console.warn('Sin movimientos de almacén en rango. Total API:', movimientosAlmacen.data.length);
              return;
            }

            reporteData = await generarReporteAlmacen(movimientosFiltradosAlmacen, { fechaInicio, fechaFin });
          } else {
            mostrarNotificacion('error', 'No se pudieron obtener los movimientos de almacén');
            return;
          }
          break;

        case 'materia_Prima':
          // Para materia prima, obtener todos los movimientos y filtrar por fecha en el frontend
          const movimientosAcopio = await movimientosAcopioService.getAllSinLimite('entrada', 'fecha_desc', sucursalSeleccionada);
          if (DEBUG_REPORTES) console.log('API acopio ->', movimientosAcopio?.data?.length ?? 0);

          if (movimientosAcopio.success && movimientosAcopio.data) {

            // Filtrar por fecha en el frontend
            const movimientosFiltrados = movimientosAcopio.data.filter(movimiento => {
              const fechaMovimiento = new Date(movimiento.date);
              const fechaInicioObj = new Date(fechaInicio);
              const fechaFinObj = new Date(fechaFin);

              // Normalizar fechas a medianoche para comparación de días
              const fechaMovimientoNormalizada = new Date(fechaMovimiento.getFullYear(), fechaMovimiento.getMonth(), fechaMovimiento.getDate());
              const fechaInicioNormalizada = new Date(fechaInicioObj.getFullYear(), fechaInicioObj.getMonth(), fechaInicioObj.getDate());
              const fechaFinNormalizada = new Date(fechaFinObj.getFullYear(), fechaFinObj.getMonth(), fechaFinObj.getDate());

              const enRango = fechaMovimientoNormalizada >= fechaInicioNormalizada && fechaMovimientoNormalizada <= fechaFinNormalizada;
              if (DEBUG_REPORTES) {
                console.log('Comparación Materia Prima:', {
                  fechaMovimiento_raw: movimiento.date,
                  fechaMovimiento_toString: fechaMovimiento.toString(),
                  fechaMovimiento_locale_LaPaz: fechaMovimiento.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
                  fechaMovimientoNormalizada: fechaMovimientoNormalizada.toString(),
                  fechaInicioNormalizada: fechaInicioNormalizada.toString(),
                  fechaFinNormalizada: fechaFinNormalizada.toString(),
                  enRango
                });
              }
              return enRango;
            });


            if (movimientosFiltrados.length === 0) {
              mostrarNotificacion('warning', 'No hay movimientos de materia prima en el período seleccionado');
              if (DEBUG_REPORTES) console.warn('Sin materia prima en rango. Total API:', movimientosAcopio.data.length);
              return;
            }

            reporteData = await generarReporteMateriaPrima(movimientosFiltrados, { fechaInicio, fechaFin });
          } else {
            mostrarNotificacion('error', 'No se pudieron obtener los movimientos de materia prima');
            return;
          }
          break;

        case 'pedidos':
          // Para pedidos, obtener todos los pedidos y filtrar por fecha en el frontend
          const pedidos = await pedidosAlmacenService.getAllSinLimite(sucursalSeleccionada);
          if (DEBUG_REPORTES) console.log('API pedidos ->', pedidos?.data?.length ?? 0);

          if (pedidos.success && pedidos.data) {
            // Filtrar por fecha en el frontend
            const pedidosFiltrados = pedidos.data.filter(pedido => {
              const fechaPedido = new Date(pedido.fecha || pedido.created_at);
              const fechaInicioObj = new Date(fechaInicio);
              const fechaFinObj = new Date(fechaFin);
              const enRango = fechaPedido >= fechaInicioObj && fechaPedido <= fechaFinObj;
              if (DEBUG_REPORTES) {
                console.log('Comparación Pedidos:', {
                  fechaPedido_raw: pedido.fecha || pedido.created_at,
                  fechaPedido_toString: fechaPedido.toString(),
                  fechaPedido_locale_LaPaz: fechaPedido.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
                  fechaInicio: fechaInicioObj.toString(),
                  fechaFin: fechaFinObj.toString(),
                  enRango
                });
              }
              return enRango;
            });

            if (pedidosFiltrados.length === 0) {
              mostrarNotificacion('warning', 'No hay pedidos en el período seleccionado');
              if (DEBUG_REPORTES) console.warn('Sin pedidos en rango. Total API:', pedidos.data.length);
              return;
            }

            reporteData = await generarReportePedidos(pedidosFiltrados, { fechaInicio, fechaFin });
          } else {
            mostrarNotificacion('error', 'No se pudieron obtener los pedidos');
            return;
          }
          break;

        case 'balance':
          // Generar reporte de balance (ingresos y gastos)
          reporteData = await generarReporteBalance({ fechaInicio, fechaFin });
          break;

        default:
          throw new Error('Área no válida');
      }

      setDatosReporte(reporteData);
      setIsDescargaOpen(true);
      mostrarNotificacion('success', 'Reporte generado correctamente');
      if (DEBUG_REPORTES) console.log('Reporte listo, abriendo modal de descarga');
    } catch (error) {
      console.error('Error generando reporte:', error);
      mostrarNotificacion('error', 'Error al generar el reporte');
    } finally {
      setIsLoading(false);
      if (DEBUG_REPORTES) console.groupEnd();
    }
  };

  return (
    <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
      <HeaderView onBack={() => setIsOpen(false)} title='Reportes' />
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <RefreshIndicator
            isVisible={showRefreshIndicator || isLoading}
            isLoading={isRefreshing || isLoading}
          />
        </div>
        <div className={styles.headerContainer}>
          <p className={styles.subTitle}>SELECCIONAR</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row',gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <DateRangePicker
            startDate={fechaInicio}
            endDate={fechaFin}
            onChange={handleFechaChange}
            placeholder="Seleccionar rango de fechas"
          />

          <div className={styles.content}>
            <Select
              placeholder="Área"
              options={opcionesArea}
              value={areaSeleccionada}
              onChange={handleAreaChange}
              icon="category"
            />
          </div>

          <div className={styles.content}>
            <Select
              placeholder="Sucursal"
              options={opcionesSucursales}
              value={sucursalSeleccionada}
              onChange={handleSucursalChange}
              icon="map"
            />
          </div>
        </div>

        <div className={styles.buttons}>
          <Boton
            className='btn-blue'
            label='Generar Reporte'
            onClick={handleGenerarReporte}
            loading={isLoading}
          />
        </div>

        {/* Mostrar estado de carga o error si es necesario */}
        {error && (
          <div className={styles.errorContainer}>
            <p>Error al cargar sucursales: {error.message}</p>
          </div>
        )}
      </div>

      {/* Modal de descarga */}
      <ModalDescarga
        isOpen={isDescargaOpen}
        setIsOpen={setIsDescargaOpen}
        titulo="Descargar Reporte"
        subtitulo="Selecciona el formato que prefieras para descargar este reporte."
        nombreArchivo={`Reporte_${areaSeleccionada}_${fechaInicio.toLocaleDateString('es-BO').replace(/\//g, '-')}_${fechaFin.toLocaleDateString('es-BO').replace(/\//g, '-')}`}
        {...datosReporte}
      />

      {/* Notificación */}
      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />
    </View>
  );
};

export default Reportes;
