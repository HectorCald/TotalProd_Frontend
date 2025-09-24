import React, { useState } from 'react';
import Screen from '../ui/Screen';
import Select from '../common/Select';
import RefreshIndicator from '../common/RefreshIndicator';
import sucursalesService from '../../services/sucursalesService';
import ModalDescarga from '../ui/ModalDescarga';
import movimientosAlmacenService from '../../services/movimientosAlmacenService';
import movimientosAcopioService from '../../services/movimientosAcopioService';
import pedidosAlmacenService from '../../services/pedidosAlmacenService';
import Notification from '../common/Notification';
import styles from './Reportes.module.css';
import Boton from '../common/Boton';

const Reportes = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
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
    console.log('cargando sucursales');
    setLoadingSucursales(true);
    setShowRefreshIndicator(true);
    setIsRefreshing(true);
    setError(null);
    
    try {
      const response = await sucursalesService.getByEmpresaId();
      if (response.success) {
        setSucursales(response.data);
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
    }
  };

  // Cargar sucursales solo la primera vez
  React.useEffect(() => {
    if (!sucursalesCargadas) {
      cargarSucursales();
    }
  }, [sucursalesCargadas]);

  // Función para mostrar notificaciones
  const mostrarNotificacion = (tipo, texto) => {
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

  // Función para calcular fechas según el período
  const getFechasPeriodo = (periodo) => {
    const hoy = new Date();
    const fechaInicio = new Date();
    
    switch (periodo) {
      case 'hoy':
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case '1_semana':
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      case '1_mes':
        fechaInicio.setMonth(hoy.getMonth() - 1);
        break;
      case '3_meses':
        fechaInicio.setMonth(hoy.getMonth() - 3);
        break;
      case '6_meses':
        fechaInicio.setMonth(hoy.getMonth() - 6);
        break;
      case '1_año':
        fechaInicio.setFullYear(hoy.getFullYear() - 1);
        break;
      default:
        fechaInicio.setHours(0, 0, 0, 0);
    }
    
    return {
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: hoy.toISOString(),
      fechaInicioFormateada: fechaInicio.toLocaleDateString('es-ES'),
      fechaFinFormateada: hoy.toLocaleDateString('es-ES')
    };
  };

  const opcionesPeriodo = [
    { value: 'hoy', label: 'Hoy', icon: 'calendar' },
    { value: '1_semana', label: '1 Semana', icon: 'calendar' },
    { value: '1_mes', label: '1 Mes', icon: 'calendar' },
    { value: '3_meses', label: '3 Meses', icon: 'calendar' },
    { value: '6_meses', label: '6 Meses', icon: 'calendar' },
    { value: '1_año', label: '1 Año', icon: 'calendar' }
  ];

  const opcionesArea = [
    { value: 'ventas', label: 'Ventas', icon: 'money' },
    { value: 'almacen_general', label: 'Almacen General', icon: 'money' },
    { value: 'materia_Prima', label: 'Materia Prima', icon: 'money' },
    { value: 'pedidos', label: 'Pedidos', icon: 'money' },
  ];

  // Convertir sucursales a formato para el Select
  const opcionesSucursales = sucursales.map(sucursal => ({
    value: sucursal.id,
    label: sucursal.name,
    icon: 'map'
  }));

  const handleAreaChange = (valor) => {
    setAreaSeleccionada(valor);
    console.log('Área seleccionada:', valor);
  };

  const handleSucursalChange = (valor) => {
    setSucursalSeleccionada(valor);
    console.log('Sucursal seleccionada:', valor);
  };

  const handlePeriodoChange = (valor) => {
    setPeriodoSeleccionado(valor);
    console.log('Período seleccionado:', valor);
    // Aquí puedes agregar la lógica para cargar reportes según el período
  };

  const handleRefresh = async () => {
    await cargarSucursales();
  };

  // Función para generar reporte de ventas (solo salidas de almacén)
  const generarReporteVentas = async (movimientos, fechasPeriodo) => {
    const salidas = movimientos.filter(m => m.type === 'salida');
    
    // Agrupar productos
    const productosAgrupados = {};
    salidas.forEach(movimiento => {
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
    });

    const tablaHeaders = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const tablaValores = Object.values(productosAgrupados).map(producto => [
      producto.nombre,
      producto.cantidad.toString(),
      `Bs. ${parseFloat(producto.precioUnitario).toFixed(2)}`,
      `Bs. ${parseFloat(producto.subtotal).toFixed(2)}`
    ]);

    const total = Object.values(productosAgrupados).reduce((sum, p) => sum + parseFloat(p.subtotal), 0);

    // Formatear período con fechas específicas
    let periodoConFechas = opcionesPeriodo.find(p => p.value === periodoSeleccionado)?.label || '';
    if (periodoSeleccionado === 'hoy') {
      periodoConFechas = `Hoy (${fechasPeriodo.fechaFinFormateada})`;
    } else {
      periodoConFechas = `${periodoConFechas} (${fechasPeriodo.fechaInicioFormateada} a ${fechasPeriodo.fechaFinFormateada})`;
    }

    return {
      informacionSuperior: {
        'Tipo de Reporte': 'Ventas',
        'Período': periodoConFechas,
        'Sucursal': sucursales.find(s => s.id === sucursalSeleccionada)?.name || '',
        'Total Ventas': `Bs. ${total.toFixed(2)}`,
        'Cantidad de Movimientos': salidas.length.toString()
      },
      tablaHeaders,
      tablaValores
    };
  };

  // Función para generar reporte de almacén general (entradas y salidas por separado)
  const generarReporteAlmacen = async (movimientos, fechasPeriodo) => {
    const entradas = movimientos.filter(m => m.type === 'entrada');
    const salidas = movimientos.filter(m => m.type === 'salida');

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
    let periodoConFechas = opcionesPeriodo.find(p => p.value === periodoSeleccionado)?.label || '';
    if (periodoSeleccionado === 'hoy') {
      periodoConFechas = `Hoy (${fechasPeriodo.fechaFinFormateada})`;
    } else {
      periodoConFechas = `${periodoConFechas} (${fechasPeriodo.fechaInicioFormateada} a ${fechasPeriodo.fechaFinFormateada})`;
    }

    return {
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
  };

  // Función para generar reporte de materia prima (entradas con costo)
  const generarReporteMateriaPrima = async (movimientos, fechasPeriodo) => {
    console.log('🌾 Movimientos de materia prima recibidos:', movimientos);
    const entradas = movimientos.filter(m => m.type === 'entrada');
    console.log('🌾 Entradas filtradas:', entradas);

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

    console.log('🌾 Productos agrupados:', productosAgrupados);

    const tablaHeaders = ['Producto', 'Cantidad', 'Costo', 'Subtotal'];
    const tablaValores = Object.values(productosAgrupados).map(producto => [
      producto.nombre,
      producto.cantidad.toString(),
      `Bs. ${parseFloat(producto.costo).toFixed(2)}`,
      `Bs. ${parseFloat(producto.subtotal).toFixed(2)}`
    ]);

    console.log('🌾 Tabla headers:', tablaHeaders);
    console.log('🌾 Tabla valores:', tablaValores);

    const total = Object.values(productosAgrupados).reduce((sum, p) => sum + parseFloat(p.subtotal), 0);

    // Formatear período con fechas específicas
    let periodoConFechas = opcionesPeriodo.find(p => p.value === periodoSeleccionado)?.label || '';
    if (periodoSeleccionado === 'hoy') {
      periodoConFechas = `Hoy (${fechasPeriodo.fechaFinFormateada})`;
    } else {
      periodoConFechas = `${periodoConFechas} (${fechasPeriodo.fechaInicioFormateada} a ${fechasPeriodo.fechaFinFormateada})`;
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

    console.log('🌾 Reporte data final:', reporteData);
    return reporteData;
  };

  // Función para generar reporte de pedidos
  const generarReportePedidos = async (pedidos, fechasPeriodo) => {
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

    // Formatear período con fechas específicas
    let periodoConFechas = opcionesPeriodo.find(p => p.value === periodoSeleccionado)?.label || '';
    if (periodoSeleccionado === 'hoy') {
      periodoConFechas = `Hoy (${fechasPeriodo.fechaFinFormateada})`;
    } else {
      periodoConFechas = `${periodoConFechas} (${fechasPeriodo.fechaInicioFormateada} a ${fechasPeriodo.fechaFinFormateada})`;
    }

    return {
      informacionSuperior: {
        'Tipo de Reporte': 'Pedidos',
        'Período': periodoConFechas,
        'Sucursal': sucursales.find(s => s.id === sucursalSeleccionada)?.name || '',
        'Total Pedidos': `Bs. ${total.toFixed(2)}`,
        'Cantidad de Pedidos': pedidos.length.toString()
      },
      tablaHeaders,
      tablaValores
    };
  };

  // Función principal para generar el reporte
  const handleGenerarReporte = async () => {
    if (!periodoSeleccionado || !areaSeleccionada || !sucursalSeleccionada) {
      mostrarNotificacion('error', 'Por favor selecciona período, área y sucursal');
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

    setIsLoading(true);
    try {
      const fechasPeriodo = getFechasPeriodo(periodoSeleccionado);
      const { fechaInicio, fechaFin } = fechasPeriodo;
      let reporteData = {};

      switch (areaSeleccionada) {
        case 'ventas':
          // Para ventas, obtener todos los movimientos y filtrar por fecha en el frontend
          const movimientosVentas = await movimientosAlmacenService.getAllSinLimite('salida', 'fecha_desc', sucursalSeleccionada);
          
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
              
              return fechaMovimientoNormalizada >= fechaInicioNormalizada && fechaMovimientoNormalizada <= fechaFinNormalizada;
            });
            
            if (movimientosFiltradosVentas.length === 0) {
              mostrarNotificacion('warning', 'No hay ventas en el período seleccionado');
              return;
            }
            
            reporteData = await generarReporteVentas(movimientosFiltradosVentas, fechasPeriodo);
          } else {
            mostrarNotificacion('error', 'No se pudieron obtener los movimientos de ventas');
            return;
          }
          break;

        case 'almacen_general':
          // Para almacén general, obtener todos los movimientos y filtrar por fecha en el frontend
          const movimientosAlmacen = await movimientosAlmacenService.getAllSinLimite(null, 'fecha_desc', sucursalSeleccionada);
          
          if (movimientosAlmacen.success && movimientosAlmacen.data) {
            // Filtrar por fecha en el frontend
            const movimientosFiltradosAlmacen = movimientosAlmacen.data.filter(movimiento => {
              const fechaMovimiento = new Date(movimiento.fecha);
              const fechaInicioObj = new Date(fechaInicio);
              const fechaFinObj = new Date(fechaFin);
              return fechaMovimiento >= fechaInicioObj && fechaMovimiento <= fechaFinObj;
            });
            
            if (movimientosFiltradosAlmacen.length === 0) {
              mostrarNotificacion('warning', 'No hay movimientos de almacén en el período seleccionado');
              return;
            }
            
            reporteData = await generarReporteAlmacen(movimientosFiltradosAlmacen, fechasPeriodo);
          } else {
            mostrarNotificacion('error', 'No se pudieron obtener los movimientos de almacén');
            return;
          }
          break;

        case 'materia_Prima':
          // Para materia prima, obtener todos los movimientos y filtrar por fecha en el frontend
          console.log('🌾 Obteniendo movimientos de acopio...');
          const movimientosAcopio = await movimientosAcopioService.getAllSinLimite('entrada', 'fecha_desc', sucursalSeleccionada);
          console.log('🌾 Respuesta del servicio:', movimientosAcopio);
          
          if (movimientosAcopio.success && movimientosAcopio.data) {
            console.log('🌾 Movimientos obtenidos:', movimientosAcopio.data.length);
            console.log('🌾 Fecha inicio:', fechaInicio);
            console.log('🌾 Fecha fin:', fechaFin);
            
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
              console.log(`🌾 Movimiento ${movimiento.id}: ${fechaMovimiento} (${fechaMovimientoNormalizada}) en rango: ${enRango} (${fechaInicioNormalizada} - ${fechaFinNormalizada})`);
              return enRango;
            });
            
            console.log('🌾 Movimientos filtrados:', movimientosFiltrados.length);
            
            if (movimientosFiltrados.length === 0) {
              mostrarNotificacion('warning', 'No hay movimientos de materia prima en el período seleccionado');
              return;
            }
            
            reporteData = await generarReporteMateriaPrima(movimientosFiltrados, fechasPeriodo);
          } else {
            console.log('🌾 Error obteniendo movimientos:', movimientosAcopio);
            mostrarNotificacion('error', 'No se pudieron obtener los movimientos de materia prima');
            return;
          }
          break;

        case 'pedidos':
          // Para pedidos, obtener todos los pedidos y filtrar por fecha en el frontend
          const pedidos = await pedidosAlmacenService.getAllSinLimite(sucursalSeleccionada);
          
          if (pedidos.success && pedidos.data) {
            // Filtrar por fecha en el frontend
            const pedidosFiltrados = pedidos.data.filter(pedido => {
              const fechaPedido = new Date(pedido.fecha || pedido.created_at);
              const fechaInicioObj = new Date(fechaInicio);
              const fechaFinObj = new Date(fechaFin);
              return fechaPedido >= fechaInicioObj && fechaPedido <= fechaFinObj;
            });
            
            if (pedidosFiltrados.length === 0) {
              mostrarNotificacion('warning', 'No hay pedidos en el período seleccionado');
              return;
            }
            
            reporteData = await generarReportePedidos(pedidosFiltrados, fechasPeriodo);
          } else {
            mostrarNotificacion('error', 'No se pudieron obtener los pedidos');
            return;
          }
          break;

        default:
          throw new Error('Área no válida');
      }

      console.log('📊 Datos del reporte generado:', reporteData);
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
    <Screen title="Reportes">
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <p className={styles.subTitle}>SELECCIONAR</p>
          <RefreshIndicator
            isVisible={showRefreshIndicator || isLoading}
            isLoading={isRefreshing || isLoading}
          />
        </div>

        <div className={styles.content}>
          <Select
            placeholder="Período de tiempo"
            options={opcionesPeriodo}
            value={periodoSeleccionado}
            onChange={handlePeriodoChange}
            icon="calendar"
          />
        </div>

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
        nombreArchivo={`Reporte_${areaSeleccionada}_${opcionesPeriodo.find(p => p.value === periodoSeleccionado)?.label || ''}_${new Date().toLocaleDateString().replace(/\//g, '-')}`}
        {...datosReporte}
      />

      {/* Notificación */}
      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />
    </Screen>
  );
};

export default Reportes;
