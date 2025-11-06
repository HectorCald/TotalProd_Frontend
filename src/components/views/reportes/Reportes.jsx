import React, { useState } from 'react';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Select from '../../common/Select';
import RefreshIndicator from '../../common/RefreshIndicator';
import ModalDescarga from '../../ui/ModalDescarga';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import gastosService from '../../../services/gastosService';
import registrosProduccionDamabravaService from '../../../services/registrosProduccionDamabravaService';
import productsAlmacenService from '../../../services/productsAlmacenService';
import deudasService from '../../../services/deudasService';
import Notification from '../../common/Notification';
import styles from '../../../styles/view.module.css';
import Boton from '../../common/Boton';
import DateRangePicker from '../../common/DateRangePicker';
import { isDamabrava, isSoloVentas } from '../../../utils/empresaHelper';
import { useUser } from '../../../context/UserContext';

const Reportes = ({ isOpen, setIsOpen }) => {
  const DEBUG_REPORTES = false;
  const { user } = useUser();
  const soloVentas = isSoloVentas(user);
  // Estados para el rango de fechas
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [areaSeleccionada, setAreaSeleccionada] = useState('');
  const [isDescargaOpen, setIsDescargaOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [datosReporte, setDatosReporte] = useState({});

  // Estados para la notificación
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'success',
    text: ''
  });

  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Función para obtener sucursal del localStorage (igual que clientService.js)
  const getSucuId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.id;
    }
    return null;
  };

  const getSucursalName = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.name;
    }
    return 'Sucursal no seleccionada';
  };

  // Función helper para calcular cantidad grup
  const calcularCantidadGrup = (cantidad, grup) => {
    if (!grup || grup <= 0) {
      return `${cantidad} ud`;
    }
    const grupos = Math.floor(cantidad / grup);
    const unidades = cantidad % grup;
    if (grupos === 0) {
      return `${unidades} ud`;
    }
    return unidades > 0 ? `${grupos} g. - ${unidades} u.` : `${grupos} g.`;
  };

  // Función helper para obtener solo los grupos
  const obtenerGrupos = (cantidad, grup) => {
    if (!grup || grup <= 0) {
      return '0';
    }
    const grupos = Math.floor(cantidad / grup);
    return grupos.toString();
  };

  // Función helper para obtener solo las unidades restantes
  const obtenerUnidades = (cantidad, grup) => {
    if (!grup || grup <= 0) {
      return cantidad.toString();
    }
    const unidades = cantidad % grup;
    return unidades.toString();
  };


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
    ...(soloVentas ? [] : [{ value: 'materia_Prima', label: 'Materia Prima', icon: 'leaf' }]),
    { value: 'deudas', label: 'Deudas', icon: 'credit-card' },
    { value: 'pedidos', label: 'Pedidos', icon: 'cart' },
    { value: 'gastos', label: 'Gastos', icon: 'receipt' },
    { value: 'balance', label: 'Balance', icon: 'transfer' },
    ...(isDamabrava() ? [{ value: 'produccion', label: 'Producción (Damabrava)', icon: 'factory' }] : []),
  ];

  const handleAreaChange = (valor) => {
    setAreaSeleccionada(valor);
    if (DEBUG_REPORTES) console.log('Área seleccionada:', valor);
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
            subtotal: 0,
            grup: producto.producto.grup || null
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

    const tablaHeaders = ['Producto', 'Cantidad', 'Cantidad Grup', 'Precio Unitario', 'Subtotal'];
    const productosArray = Object.values(productosAgrupados);
    // Ordenar productos alfabéticamente por nombre
    const productosOrdenados = productosArray.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    const tablaValores = productosOrdenados.map(producto => [
      producto.nombre,
      producto.cantidad.toString(),
      calcularCantidadGrup(producto.cantidad, producto.grup),
      `Bs. ${parseFloat(producto.precioUnitario).toFixed(2)}`,
      `Bs. ${parseFloat(producto.subtotal).toFixed(2)}`
    ]);

    const total = productosOrdenados.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);

    // No agregar fila TOTAL en la tabla

    // Calcular producto más y menos vendido por cantidad
    let productoMasVendido = null;
    let productoMenosVendido = null;
    if (productosOrdenados.length > 0) {
      productoMasVendido = productosOrdenados.reduce((a, b) => (a.cantidad >= b.cantidad ? a : b));
      productoMenosVendido = productosOrdenados.reduce((a, b) => (a.cantidad <= b.cantidad ? a : b));
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
        'Sucursal': getSucursalName(),
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

  // Función para generar reporte de almacén general (entradas y salidas agrupadas por producto)
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

    // Agrupar productos (sumando entradas y salidas por separado)
    const productosAgrupados = {};
    
    // Procesar entradas
    entradas.forEach(movimiento => {
      movimiento.productos.forEach(producto => {
        const key = producto.producto.id;
        if (!productosAgrupados[key]) {
          productosAgrupados[key] = {
            nombre: producto.producto.name,
            cantidadEntrada: 0,
            cantidadSalida: 0,
            precioUnitarioEntrada: producto.precio_unitario,
            precioUnitarioSalida: producto.precio_unitario,
            subtotalEntrada: 0,
            subtotalSalida: 0,
            grup: producto.producto.grup || null
          };
        }
        productosAgrupados[key].cantidadEntrada += parseFloat(producto.cantidad);
        productosAgrupados[key].subtotalEntrada += parseFloat(producto.subtotal);
      });
    });

    // Procesar salidas
    salidas.forEach(movimiento => {
      movimiento.productos.forEach(producto => {
        const key = producto.producto.id;
        if (!productosAgrupados[key]) {
          productosAgrupados[key] = {
            nombre: producto.producto.name,
            cantidadEntrada: 0,
            cantidadSalida: 0,
            precioUnitarioEntrada: producto.precio_unitario,
            precioUnitarioSalida: producto.precio_unitario,
            subtotalEntrada: 0,
            subtotalSalida: 0,
            grup: producto.producto.grup || null
          };
        }
        productosAgrupados[key].cantidadSalida += parseFloat(producto.cantidad);
        productosAgrupados[key].subtotalSalida += parseFloat(producto.subtotal);
      });
    });

    const tablaHeaders = ['Producto', 'Entrada (GRUP)', 'Entrada (UD)', 'Salida (GRUP)', 'Salida (UD)'];
    // Filtrar solo productos que tuvieron movimientos (entradas o salidas)
    const productosConMovimientos = Object.values(productosAgrupados).filter(producto => 
      producto.cantidadEntrada > 0 || producto.cantidadSalida > 0
    );
    
    // Ordenar productos alfabéticamente por nombre
    const productosOrdenados = productosConMovimientos.sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );
    
    const tablaValores = productosOrdenados.map(producto => [
      producto.nombre,
      producto.cantidadEntrada > 0 ? obtenerGrupos(producto.cantidadEntrada, producto.grup) : '--',
      producto.cantidadEntrada > 0 ? obtenerUnidades(producto.cantidadEntrada, producto.grup) : '--',
      producto.cantidadSalida > 0 ? obtenerGrupos(producto.cantidadSalida, producto.grup) : '--',
      producto.cantidadSalida > 0 ? obtenerUnidades(producto.cantidadSalida, producto.grup) : '--'
    ]);

    const totalEntradas = productosOrdenados.reduce((sum, p) => sum + p.subtotalEntrada, 0);
    const totalSalidas = productosOrdenados.reduce((sum, p) => sum + p.subtotalSalida, 0);

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
        'Sucursal': getSucursalName(),
        'Total Entradas': `Bs. ${totalEntradas.toFixed(2)}`,
        'Total Salidas': `Bs. ${totalSalidas.toFixed(2)}`,
        'Movimientos Entrada': entradas.length.toString(),
        'Movimientos Salida': salidas.length.toString()
      },
      tablaHeaders,
      tablaValores,
      columnWidths: {
        producto: 'auto',
        entradaGrup: '150px !important',
        entradaUd: '60px !important',
        salidaGrup: '90px !important',
        salidaUd: '50px !important'
      }
    };
    if (DEBUG_REPORTES) {
      console.log('Resultado Almacén:', resultado.informacionSuperior);
      console.groupEnd();
    }
    return resultado;
  };

  // Función para generar reporte de materia prima (entradas y salidas)
  const generarReporteMateriaPrima = async (movimientos, { fechaInicio, fechaFin }) => {
    // Separar entradas y salidas
    const entradas = movimientos.filter(m => m.type === 'entrada');
    const salidas = movimientos.filter(m => m.type === 'salida');

    // Agrupar productos (sumando entradas y salidas por separado)
    const productosAgrupados = {};
    
    // Procesar entradas
    entradas.forEach(movimiento => {
      const key = movimiento.product.id;
      if (!productosAgrupados[key]) {
        productosAgrupados[key] = {
          nombre: movimiento.product.name,
          tipoMedida: movimiento.product.type_measure?.name || 'Sin medida',
          cantidadEntrada: 0,
          cantidadSalida: 0,
          costoEntrada: 0,
          costoSalida: 0,
          subtotalEntrada: 0,
          subtotalSalida: 0
        };
      }
      productosAgrupados[key].cantidadEntrada += parseFloat(movimiento.quantity);
      productosAgrupados[key].costoEntrada += parseFloat(movimiento.costo || 0);
      productosAgrupados[key].subtotalEntrada += parseFloat(movimiento.costo || 0);
    });

    // Procesar salidas
    salidas.forEach(movimiento => {
      const key = movimiento.product.id;
      if (!productosAgrupados[key]) {
        productosAgrupados[key] = {
          nombre: movimiento.product.name,
          tipoMedida: movimiento.product.type_measure?.name || 'Sin medida',
          cantidadEntrada: 0,
          cantidadSalida: 0,
          costoEntrada: 0,
          costoSalida: 0,
          subtotalEntrada: 0,
          subtotalSalida: 0
        };
      }
      productosAgrupados[key].cantidadSalida += parseFloat(movimiento.quantity);
      productosAgrupados[key].costoSalida += parseFloat(movimiento.costo || 0);
      productosAgrupados[key].subtotalSalida += parseFloat(movimiento.costo || 0);
    });

    if (DEBUG_REPORTES) console.log('🌾 Productos agrupados:', productosAgrupados);

    const tablaHeaders = ['Producto', 'Tipo Medida', 'Entrada', 'Salida'];
    // Ordenar productos alfabéticamente por nombre
    const productosOrdenados = Object.values(productosAgrupados).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );
    
    const tablaValores = productosOrdenados.map(producto => [
      producto.nombre,
      producto.tipoMedida,
      `${producto.cantidadEntrada.toFixed(2)}`,
      `${producto.cantidadSalida.toFixed(2)}`
    ]);

    // Calcular totales separados
    const totalEntradas = productosOrdenados.reduce((sum, p) => sum + p.subtotalEntrada, 0);
    const totalSalidas = productosOrdenados.reduce((sum, p) => sum + p.subtotalSalida, 0);
    const totalCantidadEntrada = productosOrdenados.reduce((sum, p) => sum + p.cantidadEntrada, 0);
    const totalCantidadSalida = productosOrdenados.reduce((sum, p) => sum + p.cantidadSalida, 0);

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
        'Sucursal': getSucursalName(),
        'Total Entradas': `Bs. ${totalEntradas.toFixed(2)}`,
        'Total Salidas': `Bs. ${totalSalidas.toFixed(2)}`,
        'Cantidad Total Entrada': `${totalCantidadEntrada.toFixed(2)}`,
        'Cantidad Total Salida': `${totalCantidadSalida.toFixed(2)}`,
        'Movimientos Entrada': entradas.length.toString(),
        'Movimientos Salida': salidas.length.toString()
      },
      tablaHeaders,
      tablaValores,
      columnWidths: {
        producto: 'auto',
        tipoMedida: 'auto',
        entrada: 'auto',
        salida: 'auto'
      }
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
            subtotal: 0,
            grup: detalle.producto_almacen.grup || null
          };
        }
        productosAgrupados[key].cantidad += parseFloat(detalle.cantidad);
        productosAgrupados[key].subtotal += parseFloat(detalle.precio * detalle.cantidad);
      });
    });

    const tablaHeaders = ['Producto', 'Cantidad', 'Cantidad Grup', 'Precio Unitario', 'Subtotal'];
    // Ordenar productos alfabéticamente por nombre
    const productosOrdenados = Object.values(productosAgrupados).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );
    const tablaValores = productosOrdenados.map(producto => [
      producto.nombre,
      producto.cantidad.toString(),
      calcularCantidadGrup(producto.cantidad, producto.grup),
      `Bs. ${parseFloat(producto.precioUnitario).toFixed(2)}`,
      `Bs. ${parseFloat(producto.subtotal).toFixed(2)}`
    ]);

    const total = productosOrdenados.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);

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
        'Sucursal': getSucursalName(),
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

  // Función para generar reporte de producción (Damabrava)
  const generarReporteProduccion = async (registros, { fechaInicio, fechaFin }) => {
    if (DEBUG_REPORTES) {
      console.group('Generar Reporte: Producción');
      console.log('Registros recibidos:', registros?.length);
      console.log('Fechas periodo:', {
        fechaInicio,
        fechaFin,
        inicio_locale_LaPaz: fechaInicio.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
        fin_locale_LaPaz: fechaFin.toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
      });
    }

    // Agrupar productos por producción
    const productosAgrupados = {};
    registros.forEach(registro => {
      // Validar que el registro tenga producto_almacen e id válido
      if (!registro.producto_almacen || !registro.producto_almacen.id) {
        if (DEBUG_REPORTES) console.warn('Registro sin producto_almacen válido:', registro);
        return;
      }
      
      const key = registro.producto_almacen.id;
      if (!productosAgrupados[key]) {
        productosAgrupados[key] = {
          id: registro.producto_almacen.id,
          nombre: registro.producto_almacen.name,
          cantidadProducida: 0,
          cantidadVerificada: 0,
          cantidadTerminados: 0,
          materiaPrimaConsumida: {} // { materia_prima_id: { nombre, cantidad_total } }
        };
      }
      
      // Usar cantidad verificada si está verificado, sino cantidad terminados
      const cantidadAUsar = registro.estado === 'verificado' || registro.estado === 'Ingresado' 
        ? parseFloat(registro.cantidad_verificada || 0)
        : parseFloat(registro.terminados || 0);
      
      productosAgrupados[key].cantidadProducida += cantidadAUsar;
      productosAgrupados[key].cantidadVerificada += parseFloat(registro.cantidad_verificada || 0);
      productosAgrupados[key].cantidadTerminados += parseFloat(registro.terminados || 0);
    });


    // Obtener recetas de todos los productos únicos
    // Filtrar IDs válidos (no null, undefined, o vacíos)
    const productIds = Object.keys(productosAgrupados)
      .map(id => String(id))
      .filter(id => id && id !== 'null' && id !== 'undefined' && id.trim() !== '');
    
    if (productIds.length === 0) {
      if (DEBUG_REPORTES) console.log('No hay productos válidos para obtener recetas');
      return {
        informacionSuperior: {
          'Tipo de Reporte': 'Producción (Damabrava)',
          'Período': 'Sin datos',
          'Sucursal': getSucursalName(),
          'Total Productos': '0',
          'Total Materia Prima': '0'
        },
        tablaHeaders: ['Producto', 'Verificado', 'Terminados', 'Materia Prima', 'C. Consumida'],
        tablaValores: []
      };
    }

    // Obtener productos con recetas del backend
    let productosConRecetas = [];
    try {
      if (DEBUG_REPORTES) console.log('Obteniendo recetas para productos:', productIds);
      const productosResponse = await productsAlmacenService.getByIdsWithRecipes(productIds);
      if (productosResponse && productosResponse.success && productosResponse.data) {
        productosConRecetas = productosResponse.data;
        if (DEBUG_REPORTES) console.log('Productos con recetas obtenidos:', productosConRecetas.length);
      } else {
        // Si el servicio retorna success: false, loguear pero continuar
        const errorMessage = productosResponse?.message || 'No se pudieron obtener las recetas';
        if (DEBUG_REPORTES) {
          console.warn('Respuesta del servicio sin éxito:', {
            success: productosResponse?.success,
            message: errorMessage,
            productIds: productIds
          });
        }
        console.warn('No se pudieron obtener recetas para productos:', errorMessage);
      }
    } catch (error) {
      console.error('Error obteniendo recetas:', error);
      if (DEBUG_REPORTES) console.error('Detalles del error:', error);
      // Continuar sin recetas en lugar de fallar completamente
    }

    // Crear mapa de productos con recetas para acceso rápido
    const productosConRecetasMap = new Map();
    productosConRecetas.forEach(producto => {
      productosConRecetasMap.set(producto.id, producto);
    });

    // Calcular materia prima consumida para cada producto
    const tablaHeaders = ['Producto', 'Verificado', 'Terminados', 'Materia Prima', 'C. Consumida'];
    const tablaValores = [];
    const materiaPrimaTotal = {}; // Para agregar al final

    // Ordenar productos alfabéticamente
    const productosOrdenados = Object.values(productosAgrupados).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );

    // Para cada producto, crear filas con su materia prima
    productosOrdenados.forEach(producto => {
      // Buscar el producto por ID en el mapa
      const productoConReceta = productosConRecetasMap.get(producto.id);
      
      if (productoConReceta && productoConReceta.recetas && productoConReceta.recetas.length > 0) {
        const receta = productoConReceta.recetas[0];
        
        if (receta && receta.recetas_detalle && receta.recetas_detalle.length > 0) {
          // Crear una fila por cada ingrediente de la receta
          receta.recetas_detalle.forEach(ingrediente => {
            const cantidadConsumida = ingrediente.cantidad * producto.cantidadProducida;
            
            // Agregar al total de materia prima
            const materiaPrimaId = ingrediente.products_acopio.id;
            if (!materiaPrimaTotal[materiaPrimaId]) {
              materiaPrimaTotal[materiaPrimaId] = {
                nombre: ingrediente.products_acopio.name,
                cantidadTotal: 0
              };
            }
            materiaPrimaTotal[materiaPrimaId].cantidadTotal += cantidadConsumida;
            
            tablaValores.push([
              producto.nombre,
              producto.cantidadVerificada.toString(),
              producto.cantidadTerminados.toString(),
              ingrediente.products_acopio.name,
              cantidadConsumida.toFixed(2)
            ]);
          });
        } else {
          // Producto sin ingredientes en la receta
          tablaValores.push([
            producto.nombre,
            producto.cantidadVerificada.toString(),
            producto.cantidadTerminados.toString(),
            'Sin ingredientes',
            '--'
          ]);
        }
      } else {
        // Producto sin receta
        tablaValores.push([
          producto.nombre,
          producto.cantidadVerificada.toString(),
          producto.cantidadTerminados.toString(),
          'Sin receta',
          '--'
        ]);
      }
    });

    // Agregar filas de resumen de materia prima total al final
    const materiaPrimaOrdenada = Object.values(materiaPrimaTotal).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );

    materiaPrimaOrdenada.forEach(materia => {
      tablaValores.push([
        '--- RESUMEN ---',
        '---',
        '---',
        materia.nombre,
        materia.cantidadTotal.toFixed(2)
      ]);
    });

    const totalProducido = productosOrdenados.reduce((sum, p) => sum + p.cantidadProducida, 0);
    const totalMateriaPrima = Object.keys(materiaPrimaTotal).length;

    // Formatear período con fechas específicas
    const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
    const fechaFinFormateada = fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });

    let periodoConFechas;
    if (fechaInicio.getTime() === fechaFin.getTime()) {
      periodoConFechas = fechaFinFormateada;
    } else {
      periodoConFechas = `${fechaInicioFormateada} a ${fechaFinFormateada}`;
    }

    const totalVerificado = productosOrdenados.reduce((sum, p) => sum + p.cantidadVerificada, 0);
    const totalTerminados = productosOrdenados.reduce((sum, p) => sum + p.cantidadTerminados, 0);

    const resultado = {
      informacionSuperior: {
        'Tipo de Reporte': 'Producción (Damabrava)',
        'Período': periodoConFechas,
        'Sucursal': getSucursalName(),
        'Total Verificado': `${totalVerificado} unidades`,
        'Total Terminados': `${totalTerminados} unidades`,
        'Total Producido': `${totalProducido} unidades`,
        'Total Materia Prima': `${totalMateriaPrima} tipos`,
        'Cantidad de Registros': registros.length.toString()
      },
      tablaHeaders,
      tablaValores,
      columnWidths: {
        producto: '25%',
        verificado: '12%',
        terminados: '12%',
        materiaPrima: '35%',
        cConsumida: '16%'
      }
    };
    return resultado;
  };

  // Función para generar reporte de balance (ingresos vs gastos)
  const generarReporteBalance = async ({ fechaInicio, fechaFin }) => {
    const sucuId = getSucuId();
    // 1) Obtener movimientos de almacén (solo salidas = ingresos/ventas)
    const movimientosResponse = await movimientosAlmacenService.getAllSinLimite('salida', null, 'fecha_desc', sucuId);
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
    const headersIngresos = ['Fecha', 'Cliente/Detalle', 'Productos', 'Subtotal'];
    const valoresIngresos = [];
    let totalIngresos = 0;
    movimientosFiltrados.forEach(mov => {
      const subtotal = (mov.productos || []).reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0);
      totalIngresos += subtotal;

      // Crear descripción de productos con cantidad grup
      const productosDesc = (mov.productos || []).map(p => {
        const cantidad = parseFloat(p.cantidad) || 0;
        const grup = parseFloat(p.producto?.grup) || null;
        const cantidadGrup = calcularCantidadGrup(cantidad, grup);
        return `${p.producto?.name || 'Producto'} (${cantidad} - ${cantidadGrup})`;
      }).join(', ');

      valoresIngresos.push([
        new Date(mov.fecha).toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' }),
        mov?.cliente?.name || mov?.observaciones || '-',
        productosDesc || '-',
        `Bs. ${subtotal.toFixed(2)}`
      ]);
    });

    // Ordenar ingresos alfabéticamente por cliente/detalle
    valoresIngresos.sort((a, b) => a[1].localeCompare(b[1], 'es', { sensitivity: 'base' }));

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

    // Ordenar gastos alfabéticamente por concepto
    valoresGastos.sort((a, b) => a[1].localeCompare(b[1], 'es', { sensitivity: 'base' }));

    const neto = totalIngresos - totalGastos;

    // Para ModalDescarga: dos tablas separadas
    const tablas = [
      {
        titulo: 'INGRESOS',
        headers: headersIngresos,
        valores: [...valoresIngresos, ['Total Ingresos', '', '', `Bs. ${totalIngresos.toFixed(2)}`]]
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
        'Sucursal': getSucursalName(),
        'Total Ingresos': `Bs. ${totalIngresos.toFixed(2)}`,
        'Total Gastos': `Bs. ${totalGastos.toFixed(2)}`,
        'Total': `Bs. ${neto.toFixed(2)}`
      },
      tablas
    };
  };

  // Función para generar reporte de gastos
  const generarReporteGastos = async (gastos, { fechaInicio, fechaFin }) => {
    if (DEBUG_REPORTES) {
      console.group('Generar Reporte: Gastos');
      console.log('Gastos recibidos:', gastos?.length);
      console.log('Fechas periodo:', {
        fechaInicio,
        fechaFin,
        inicio_locale_LaPaz: fechaInicio.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
        fin_locale_LaPaz: fechaFin.toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
      });
    }

    const tablaHeaders = ['Fecha', 'Concepto', 'Proveedor', 'M. Pago', 'Subtotal'];
    
    // Ordenar gastos por fecha (de más antiguo a más reciente)
    const gastosOrdenados = [...gastos].sort((a, b) => {
      const fechaA = new Date(a.fecha_gasto);
      const fechaB = new Date(b.fecha_gasto);
      return fechaA - fechaB;
    });

    const tablaValores = gastosOrdenados.map(gasto => {
      const fechaFormateada = new Date(gasto.fecha_gasto).toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
      const proveedor = gasto.proveedor?.name || '--';
      const metodoPago = gasto.metodo_pago || '--';
      const subtotal = parseFloat(gasto.valor) || 0;

      return [
        fechaFormateada,
        gasto.concepto || '--',
        proveedor,
        metodoPago,
        `Bs. ${subtotal.toFixed(2)}`
      ];
    });

    // Calcular total
    const total = gastosOrdenados.reduce((sum, g) => sum + (parseFloat(g.valor) || 0), 0);

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
        'Tipo de Reporte': 'Gastos',
        'Período': periodoConFechas,
        'Sucursal': getSucursalName(),
        'Total': `Bs. ${total.toFixed(2)}`,
        'Cantidad de Gastos': gastosOrdenados.length.toString()
      },
      tablaHeaders,
      tablaValores,
      columnWidths: {
        fecha: '10%',
        concepto: '48%',
        proveedor: '15%',
        metodoPago: '12%',
        subtotal: '15%'
      }
    };

    if (DEBUG_REPORTES) {
      console.log('Resultado Gastos:', resultado.informacionSuperior);
      console.groupEnd();
    }

    return resultado;
  };

  // Función para generar reporte de deudas (agrupado por cliente)
  const generarReporteDeudas = async ({ fechaInicio, fechaFin }) => {
    const sucuId = getSucuId();
    // Fechas como YYYY-MM-DD
    const toYmd = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const fechaInicioStr = toYmd(new Date(fechaInicio));
    const fechaFinStr = toYmd(new Date(fechaFin));

    const deudasResp = await deudasService.getByDateRange(fechaInicioStr, fechaFinStr, sucuId);
    if (!deudasResp?.success || !Array.isArray(deudasResp.data)) {
      throw new Error(deudasResp?.message || 'No se pudieron obtener las deudas');
    }

    const deudas = deudasResp.data;

    // Obtener pagos parciales por deuda en paralelo
    const pagosPorDeuda = await Promise.all(
      deudas.map(async (d) => {
        try {
          const resp = await deudasService.getPagosParciales(d.id);
          const pagos = (resp?.success && Array.isArray(resp.data)) ? resp.data : [];
          const totalPagos = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);
          return { deudaId: d.id, totalPagos };
        } catch {
          return { deudaId: d.id, totalPagos: 0 };
        }
      })
    );
    const mapaPagos = new Map(pagosPorDeuda.map((x) => [x.deudaId, x.totalPagos]));

    // Agrupar por cliente
    const agrupado = {};
    deudas.forEach((d) => {
      const clienteNombre = d?.cliente?.name || 'Sin cliente';
      const montoTotal = parseFloat(d?.monto_total) || 0;
      const saldo = parseFloat(d?.saldo_pendiente) || 0;
      const pagos = mapaPagos.get(d.id);
      const pagosTotal = typeof pagos === 'number' ? pagos : Math.max(0, montoTotal - saldo);

      if (!agrupado[clienteNombre]) {
        agrupado[clienteNombre] = { deudaTotal: 0, pagosParciales: 0, saldoTotal: 0 };
      }
      agrupado[clienteNombre].deudaTotal += montoTotal;
      agrupado[clienteNombre].pagosParciales += pagosTotal;
      agrupado[clienteNombre].saldoTotal += saldo;
    });

    // Construir tabla
    const tablaHeaders = ['Cliente', 'Deuda Total', 'Pagos Parciales', 'Total Saldo'];
    const filas = Object.keys(agrupado)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      .map((cliente) => {
        const vals = agrupado[cliente];
        return [
          cliente,
          `Bs. ${vals.deudaTotal.toFixed(2)}`,
          `Bs. ${vals.pagosParciales.toFixed(2)}`,
          `Bs. ${vals.saldoTotal.toFixed(2)}`
        ];
      });

    // Totales generales
    const totales = Object.values(agrupado).reduce(
      (acc, v) => {
        acc.deuda += v.deudaTotal;
        acc.pagos += v.pagosParciales;
        acc.saldo += v.saldoTotal;
        return acc;
      },
      { deuda: 0, pagos: 0, saldo: 0 }
    );

    const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
    const fechaFinFormateada = fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
    const periodoConFechas = fechaInicio.getTime() === fechaFin.getTime() ? fechaFinFormateada : `${fechaInicioFormateada} a ${fechaFinFormateada}`;

    return {
      informacionSuperior: {
        'Tipo de Reporte': 'Deudas',
        'Período': periodoConFechas,
        'Sucursal': getSucursalName(),
        'Deuda Total': `Bs. ${totales.deuda.toFixed(2)}`,
        'Pagos Parciales': `Bs. ${totales.pagos.toFixed(2)}`,
        'Total Saldo': `Bs. ${totales.saldo.toFixed(2)}`
      },
      tablaHeaders,
      tablaValores: filas
    };
  };

  // Función principal para generar el reporte
  const handleGenerarReporte = async () => {
    if (!fechaInicio || !fechaFin || !areaSeleccionada) {
      mostrarNotificacion('error', 'Por favor selecciona fechas y área');
      return;
    }

    const sucuId = getSucuId();
    if (!sucuId) {
      mostrarNotificacion('error', 'No hay sucursal seleccionada');
      return;
    }

    // Validar que para materia prima solo se pueda generar reporte de Casa Matriz
    if (areaSeleccionada === 'materia_Prima') {
      const sucursalName = getSucursalName();
      if (sucursalName !== 'Casa Matriz') {
        mostrarNotificacion('error', 'Los reportes de materia prima solo están disponibles para Casa Matriz');
        return;
      }
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
          const movimientosVentas = await movimientosAlmacenService.getAllSinLimite('salida', null, 'fecha_desc', sucuId);
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
          const movimientosAlmacen = await movimientosAlmacenService.getAllSinLimite(null, null, 'fecha_desc', sucuId);
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
          const movimientosAcopio = await movimientosAcopioService.getAllSinLimite(null, 'fecha_desc', sucuId);
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
          const pedidos = await pedidosAlmacenService.getAllSinLimite(sucuId);
          if (DEBUG_REPORTES) console.log('API pedidos ->', pedidos?.data?.length ?? 0);

          if (pedidos.success && pedidos.data) {
            // Filtrar por fecha en el frontend
            const pedidosFiltrados = pedidos.data.filter(pedido => {
              const fechaPedido = new Date(pedido.fecha || pedido.created_at);
              const fechaInicioObj = new Date(fechaInicio);
              const fechaFinObj = new Date(fechaFin);

              // Normalizar fechas a medianoche para comparación de días
              const fechaPedidoNormalizada = new Date(fechaPedido.getFullYear(), fechaPedido.getMonth(), fechaPedido.getDate());
              const fechaInicioNormalizada = new Date(fechaInicioObj.getFullYear(), fechaInicioObj.getMonth(), fechaInicioObj.getDate());
              const fechaFinNormalizada = new Date(fechaFinObj.getFullYear(), fechaFinObj.getMonth(), fechaFinObj.getDate());

              const enRango = fechaPedidoNormalizada >= fechaInicioNormalizada && fechaPedidoNormalizada <= fechaFinNormalizada;
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

        case 'gastos':
          // Para gastos, obtener gastos por rango de fechas
          const toYmdGastos = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          };
          const fechaInicioStrGastos = toYmdGastos(new Date(fechaInicio));
          const fechaFinStrGastos = toYmdGastos(new Date(fechaFin));
          
          const gastosResp = await gastosService.getByDateRange(fechaInicioStrGastos, fechaFinStrGastos, sucuId);
          if (DEBUG_REPORTES) console.log('API gastos ->', gastosResp?.data?.length ?? 0);
          
          if (!gastosResp?.success || !Array.isArray(gastosResp.data)) {
            mostrarNotificacion('error', 'No se pudieron obtener los gastos');
            return;
          }
          
          if (gastosResp.data.length === 0) {
            mostrarNotificacion('warning', 'No hay gastos en el período seleccionado');
            if (DEBUG_REPORTES) console.warn('Sin gastos en rango');
            return;
          }
          
          reporteData = await generarReporteGastos(gastosResp.data, { fechaInicio, fechaFin });
          break;

        case 'balance':
          // Para balance, obtener ingresos y gastos y validar si hay datos
          const movimientosBalance = await movimientosAlmacenService.getAllSinLimite('salida', null, 'fecha_desc', sucuId);
          const gastosBalance = await gastosService.getAllSinLimite();
          if (DEBUG_REPORTES) console.log('API balance -> movimientos:', movimientosBalance?.data?.length ?? 0, 'gastos:', gastosBalance?.data?.length ?? 0);
          
          if (!movimientosBalance?.success && !gastosBalance?.success) {
            mostrarNotificacion('error', 'No se pudieron obtener los datos para el balance');
            return;
          }
          
          // Filtrar movimientos por fecha
          const fechaInicioObjBalance = new Date(fechaInicio);
          const fechaFinObjBalance = new Date(fechaFin);
          const fechaInicioStrBalance = new Date(fechaInicioObjBalance).toISOString().split('T')[0];
          const fechaFinStrBalance = new Date(fechaFinObjBalance).toISOString().split('T')[0];
          
          const movimientosFiltradosBalance = (movimientosBalance?.data || []).filter(mov => {
            const fechaMovimiento = new Date(mov.fecha);
            const fMov = new Date(fechaMovimiento.getFullYear(), fechaMovimiento.getMonth(), fechaMovimiento.getDate());
            const fIni = new Date(fechaInicioObjBalance.getFullYear(), fechaInicioObjBalance.getMonth(), fechaInicioObjBalance.getDate());
            const fFin = new Date(fechaFinObjBalance.getFullYear(), fechaFinObjBalance.getMonth(), fechaFinObjBalance.getDate());
            return fMov >= fIni && fMov <= fFin;
          });
          
          const gastosFiltradosBalance = (gastosBalance?.data || []).filter(g => {
            const fechaG = g.fecha_gasto;
            return fechaG >= fechaInicioStrBalance && fechaG <= fechaFinStrBalance;
          });
          
          if (movimientosFiltradosBalance.length === 0 && gastosFiltradosBalance.length === 0) {
            mostrarNotificacion('warning', 'No hay ingresos ni gastos en el período seleccionado');
            if (DEBUG_REPORTES) console.warn('Sin datos en rango para balance');
            return;
          }
          
          reporteData = await generarReporteBalance({ fechaInicio, fechaFin });
          break;

        case 'deudas':
          // Para deudas, obtener deudas por rango de fechas y validar si hay datos
          const toYmd = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          };
          const fechaInicioStrDeudas = toYmd(new Date(fechaInicio));
          const fechaFinStrDeudas = toYmd(new Date(fechaFin));
          
          const deudasResp = await deudasService.getByDateRange(fechaInicioStrDeudas, fechaFinStrDeudas, sucuId);
          if (DEBUG_REPORTES) console.log('API deudas ->', deudasResp?.data?.length ?? 0);
          
          if (!deudasResp?.success || !Array.isArray(deudasResp.data)) {
            mostrarNotificacion('error', 'No se pudieron obtener las deudas');
            return;
          }
          
          if (deudasResp.data.length === 0) {
            mostrarNotificacion('warning', 'No hay deudas en el período seleccionado');
            if (DEBUG_REPORTES) console.warn('Sin deudas en rango');
            return;
          }
          
          reporteData = await generarReporteDeudas({ fechaInicio, fechaFin });
          break;

        case 'produccion':
          // Para producción, obtener todos los registros y filtrar por fecha en el frontend
          const registrosProduccion = await registrosProduccionDamabravaService.getAllSinLimite();
          if (DEBUG_REPORTES) console.log('API producción ->', registrosProduccion?.data?.length ?? 0);

          if (registrosProduccion.success && registrosProduccion.data) {
            // Filtrar por fecha en el frontend
            const registrosFiltrados = registrosProduccion.data.filter(registro => {
              const fechaRegistro = new Date(registro.fecha);
              const fechaInicioObj = new Date(fechaInicio);
              const fechaFinObj = new Date(fechaFin);

              // Normalizar fechas a medianoche para comparación de días
              const fechaRegistroNormalizada = new Date(fechaRegistro.getFullYear(), fechaRegistro.getMonth(), fechaRegistro.getDate());
              const fechaInicioNormalizada = new Date(fechaInicioObj.getFullYear(), fechaInicioObj.getMonth(), fechaInicioObj.getDate());
              const fechaFinNormalizada = new Date(fechaFinObj.getFullYear(), fechaFinObj.getMonth(), fechaFinObj.getDate());

              const enRango = fechaRegistroNormalizada >= fechaInicioNormalizada && fechaRegistroNormalizada <= fechaFinNormalizada;
              return enRango;
            });

            if (registrosFiltrados.length === 0) {
              mostrarNotificacion('warning', 'No hay registros de producción en el período seleccionado');
              if (DEBUG_REPORTES) console.warn('Sin registros de producción en rango. Total API:', registrosProduccion.data.length);
              return;
            }

            reporteData = await generarReporteProduccion(registrosFiltrados, { fechaInicio, fechaFin });
          } else {
            mostrarNotificacion('error', 'No se pudieron obtener los registros de producción');
            return;
          }
          break;

        default:
          throw new Error('Área no válida');
      }

      setDatosReporte(reporteData);
      setIsDescargaOpen(true);
      mostrarNotificacion('success', 'Reporte generado correctamente');
    } catch (error) {
      console.error('Error generando reporte:', error);
      mostrarNotificacion('error', 'Error al generar el reporte');
    } finally {
      setIsLoading(false);
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
        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <DateRangePicker
            startDate={fechaInicio}
            endDate={fechaFin}
            onChange={handleFechaChange}
            placeholder="Seleccionar rango de fechas"
          />
            <Select
              placeholder="Área"
              options={opcionesArea}
              value={areaSeleccionada}
              onChange={handleAreaChange}
              icon="category"
            />
    
        </div>

        <div className={styles.buttons}>
          <Boton
            className='btn-blue'
            label='Generar Reporte'
            onClick={handleGenerarReporte}
            loading={isLoading}
          />
        </div>

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
