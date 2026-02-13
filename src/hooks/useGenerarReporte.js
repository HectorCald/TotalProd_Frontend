/**
 * Hook reutilizable para generar reportes (Reportes, Balance, etc.).
 * Incluye validaciones, helpers y generadores en un solo archivo.
 */
import { useState, useCallback } from 'react';
import { isDamabrava } from '../utils/empresaHelper';
import movimientosAlmacenService from '../services/movimientosAlmacenService';
import movimientosAcopioService from '../services/movimientosAcopioService';
import gastosService from '../services/gastosService';
import deudasService from '../services/deudasService';
import registrosProduccionDamabravaService from '../services/registrosProduccionDamabravaService';
import productsAlmacenService from '../services/productsAlmacenService';

// --- Helpers (mismo comportamiento que Reportes) ---
const getSucuId = () => {
  try {
    const s = localStorage.getItem('sucursalSeleccionada');
    return s ? JSON.parse(s).id : null;
  } catch {
    return null;
  }
};
const getSucursalName = () => {
  try {
    const s = localStorage.getItem('sucursalSeleccionada');
    return s ? JSON.parse(s).name : 'Sucursal no seleccionada';
  } catch {
    return 'Sucursal no seleccionada';
  }
};
const toYmd = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const prepararFechasFromRange = (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) return null;
  const inicio = new Date(fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(fechaFin);
  fin.setHours(23, 59, 59, 999);
  return {
    fechaInicioNormalizada: inicio,
    fechaFinNormalizada: fin,
    filtroFechaISO: { inicio: inicio.toISOString(), fin: fin.toISOString() }
  };
};
const calcularTotalMovimiento = (mov) => {
  if (!mov?.productos?.length) return 0;
  const subtotal = mov.productos.reduce((sum, prod) => {
    const st = Number(prod.subtotal);
    if (!Number.isNaN(st)) return sum + st;
    return sum + (Number(prod.cantidad) || 0) * (Number(prod.precio_unitario) || 0);
  }, 0);
  const total = subtotal - (Number(mov.descuento) || 0) + (Number(mov.aumento) || 0);
  return Number.isNaN(total) ? 0 : Number(total.toFixed(2));
};
const calcularCantidadGrup = (cantidad, grup) => {
  if (!grup || grup <= 0) return `${cantidad} ud`;
  const grupos = Math.floor(cantidad / grup);
  const unidades = cantidad % grup;
  return grupos === 0 ? `${unidades} ud` : unidades > 0 ? `${grupos} g. - ${unidades} u.` : `${grupos} g.`;
};
const obtenerGrupos = (cantidad, grup) => (!grup || grup <= 0 ? '0' : Math.floor(cantidad / grup).toString());
const obtenerUnidades = (cantidad, grup) => (!grup || grup <= 0 ? cantidad.toString() : (cantidad % grup).toString());

// --- Generadores (misma lógica que Reportes) ---
async function generarReporteVentas(movimientos, { fechaInicio, fechaFin }) {
  const salidas = movimientos.filter((m) => m.type === 'salida');
  const productosAgrupados = {};
  salidas.forEach((mov) => {
    mov.productos.forEach((p) => {
      const key = p.producto.id;
      if (!productosAgrupados[key]) {
        productosAgrupados[key] = { nombre: p.producto.name, cantidad: 0, precioUnitario: p.precio_unitario, subtotal: 0, grup: p.producto.grup || null };
      }
      productosAgrupados[key].cantidad += parseFloat(p.cantidad);
      productosAgrupados[key].subtotal += parseFloat(p.subtotal);
    });
  });
  const productosOrdenados = Object.values(productosAgrupados).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  const tablaValores = productosOrdenados.map((p) => [
    p.nombre,
    p.cantidad.toString(),
    calcularCantidadGrup(p.cantidad, p.grup),
    `Bs. ${parseFloat(p.precioUnitario).toFixed(2)}`,
    `Bs. ${parseFloat(p.subtotal).toFixed(2)}`
  ]);
  // Total = suma de los subtotales de la tabla (para que coincida con lo que ve el usuario en los ítems)
  const totalTabla = productosOrdenados.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);
  const mas = productosOrdenados.length ? productosOrdenados.reduce((a, b) => (a.cantidad >= b.cantidad ? a : b)) : null;
  const menos = productosOrdenados.length ? productosOrdenados.reduce((a, b) => (a.cantidad <= b.cantidad ? a : b)) : null;
  const periodo = fechaInicio.getTime() === fechaFin.getTime() ? fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' }) : `${fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })} a ${fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })}`;
  return {
    informacionSuperior: {
      'Tipo de Reporte': 'Ventas',
      Período: periodo,
      Sucursal: getSucursalName(),
      Total: `Bs. ${totalTabla.toFixed(2)}`,
      'Cantidad de Movimientos': salidas.length.toString(),
      ...(mas ? { 'Más vendido': `${mas.nombre} (${mas.cantidad})` } : {}),
      ...(menos ? { 'Menos vendido': `${menos.nombre} (${menos.cantidad})` } : {})
    },
    tablaHeaders: ['Producto', 'Cantidad', 'Cantidad Grup', 'Precio Unitario', 'Subtotal'],
    tablaValores
  };
}

async function generarReporteAlmacen(movimientos, { fechaInicio, fechaFin }) {
  const entradas = movimientos.filter((m) => m.type === 'entrada');
  const salidas = movimientos.filter((m) => m.type === 'salida');
  const productosAgrupados = {};
  entradas.forEach((mov) => {
    mov.productos.forEach((p) => {
      const key = p.producto.id;
      if (!productosAgrupados[key]) {
        productosAgrupados[key] = { nombre: p.producto.name, cantidadEntrada: 0, cantidadSalida: 0, subtotalEntrada: 0, subtotalSalida: 0, grup: p.producto.grup || null };
      }
      productosAgrupados[key].cantidadEntrada += parseFloat(p.cantidad);
      productosAgrupados[key].subtotalEntrada += parseFloat(p.subtotal);
    });
  });
  salidas.forEach((mov) => {
    mov.productos.forEach((p) => {
      const key = p.producto.id;
      if (!productosAgrupados[key]) {
        productosAgrupados[key] = { nombre: p.producto.name, cantidadEntrada: 0, cantidadSalida: 0, subtotalEntrada: 0, subtotalSalida: 0, grup: p.producto.grup || null };
      }
      productosAgrupados[key].cantidadSalida += parseFloat(p.cantidad);
      productosAgrupados[key].subtotalSalida += parseFloat(p.subtotal);
    });
  });
  const productosOrdenados = Object.values(productosAgrupados).filter((p) => p.cantidadEntrada > 0 || p.cantidadSalida > 0).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  const tablaValores = productosOrdenados.map((p) => [
    p.nombre,
    p.cantidadEntrada > 0 ? obtenerGrupos(p.cantidadEntrada, p.grup) : '--',
    p.cantidadEntrada > 0 ? obtenerUnidades(p.cantidadEntrada, p.grup) : '--',
    p.cantidadSalida > 0 ? obtenerGrupos(p.cantidadSalida, p.grup) : '--',
    p.cantidadSalida > 0 ? obtenerUnidades(p.cantidadSalida, p.grup) : '--'
  ]);
  const totalEntradas = productosOrdenados.reduce((s, p) => s + p.subtotalEntrada, 0);
  const totalSalidas = productosOrdenados.reduce((s, p) => s + p.subtotalSalida, 0);
  const periodo = fechaInicio.getTime() === fechaFin.getTime() ? fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' }) : `${fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })} a ${fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })}`;
  return {
    informacionSuperior: {
      'Tipo de Reporte': 'Almacén General',
      Período: periodo,
      Sucursal: getSucursalName(),
      'Total Entradas': `Bs. ${totalEntradas.toFixed(2)}`,
      'Total Salidas': `Bs. ${totalSalidas.toFixed(2)}`,
      'Movimientos Entrada': entradas.length.toString(),
      'Movimientos Salida': salidas.length.toString()
    },
    tablaHeaders: ['Producto', 'Entrada (GRUP)', 'Entrada (UD)', 'Salida (GRUP)', 'Salida (UD)'],
    tablaValores,
    columnWidths: { producto: '40%', entradaGrup: '15%', entradaUd: '15%', salidaGrup: '15%', salidaUd: '15%' }
  };
}

async function generarReporteMateriaPrima(movimientos, { fechaInicio, fechaFin }) {
  const entradas = movimientos.filter((m) => m.type === 'entrada');
  const salidas = movimientos.filter((m) => m.type === 'salida');
  const productosAgrupados = {};
  entradas.forEach((mov) => {
    const key = mov.product.id;
    if (!productosAgrupados[key]) {
      productosAgrupados[key] = { nombre: mov.product.name, tipoMedida: mov.product.type_measure?.name || 'Sin medida', cantidadEntrada: 0, cantidadSalida: 0, subtotalEntrada: 0, subtotalSalida: 0 };
    }
    productosAgrupados[key].cantidadEntrada += parseFloat(mov.quantity);
    productosAgrupados[key].subtotalEntrada += parseFloat(mov.costo || 0);
  });
  salidas.forEach((mov) => {
    const key = mov.product.id;
    if (!productosAgrupados[key]) {
      productosAgrupados[key] = { nombre: mov.product.name, tipoMedida: mov.product.type_measure?.name || 'Sin medida', cantidadEntrada: 0, cantidadSalida: 0, subtotalEntrada: 0, subtotalSalida: 0 };
    }
    productosAgrupados[key].cantidadSalida += parseFloat(mov.quantity);
    productosAgrupados[key].subtotalSalida += parseFloat(mov.costo || 0);
  });
  const productosOrdenados = Object.values(productosAgrupados).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  const tablaValores = productosOrdenados.map((p) => [p.nombre, p.tipoMedida, p.cantidadEntrada.toFixed(2), p.cantidadSalida.toFixed(2)]);
  const totalEntradas = productosOrdenados.reduce((s, p) => s + p.subtotalEntrada, 0);
  const totalSalidas = productosOrdenados.reduce((s, p) => s + p.subtotalSalida, 0);
  const totalCantE = productosOrdenados.reduce((s, p) => s + p.cantidadEntrada, 0);
  const totalCantS = productosOrdenados.reduce((s, p) => s + p.cantidadSalida, 0);
  const periodo = fechaInicio.getTime() === fechaFin.getTime() ? fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' }) : `${fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })} a ${fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })}`;
  return {
    informacionSuperior: {
      'Tipo de Reporte': 'Materia Prima',
      Período: periodo,
      Sucursal: getSucursalName(),
      'Total Entradas': `Bs. ${totalEntradas.toFixed(2)}`,
      'Total Salidas': `Bs. ${totalSalidas.toFixed(2)}`,
      'Cantidad Total Entrada': totalCantE.toFixed(2),
      'Cantidad Total Salida': totalCantS.toFixed(2),
      'Movimientos Entrada': entradas.length.toString(),
      'Movimientos Salida': salidas.length.toString()
    },
    tablaHeaders: ['Producto', 'Tipo Medida', 'Entrada', 'Salida'],
    tablaValores,
    columnWidths: { producto: '40%', tipoMedida: '20%', entrada: '20%', salida: '20%' }
  };
}

async function generarReporteGastos(gastos, { fechaInicio, fechaFin }) {
  const gastosOrdenados = [...gastos].sort((a, b) => new Date(a.fecha_gasto) - new Date(b.fecha_gasto));
  const tablaValores = gastosOrdenados.map((g) => [
    new Date(g.fecha_gasto).toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' }),
    g.concepto || '--',
    g.proveedor?.name || '--',
    g.metodo_pago || '--',
    `Bs. ${(parseFloat(g.valor) || 0).toFixed(2)}`
  ]);
  const total = gastosOrdenados.reduce((s, g) => s + (parseFloat(g.valor) || 0), 0);
  const periodo = fechaInicio.getTime() === fechaFin.getTime() ? fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' }) : `${fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })} a ${fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })}`;
  return {
    informacionSuperior: { 'Tipo de Reporte': 'Gastos', Período: periodo, Sucursal: getSucursalName(), Total: `Bs. ${total.toFixed(2)}`, 'Cantidad de Gastos': gastosOrdenados.length.toString() },
    tablaHeaders: ['Fecha', 'Concepto', 'Proveedor', 'M. Pago', 'Subtotal'],
    tablaValores,
    columnWidths: { fecha: '10%', concepto: '48%', proveedor: '15%', metodoPago: '12%', subtotal: '15%' }
  };
}

async function generarReporteDeudas({ fechaInicio, fechaFin }) {
  const sucuId = getSucuId();
  const fechaInicioStr = toYmd(new Date(fechaInicio));
  const fechaFinStr = toYmd(new Date(fechaFin));
  const deudasResp = await deudasService.getByDateRange(fechaInicioStr, fechaFinStr, sucuId);
  if (!deudasResp?.success || !Array.isArray(deudasResp.data)) throw new Error(deudasResp?.message || 'No se pudieron obtener las deudas');
  const deudas = deudasResp.data;
  const pagosPorDeuda = await Promise.all(
    deudas.map(async (d) => {
      try {
        const resp = await deudasService.getPagosParciales(d.id);
        const pagos = resp?.success && Array.isArray(resp.data) ? resp.data : [];
        return { deudaId: d.id, totalPagos: pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) };
      } catch {
        return { deudaId: d.id, totalPagos: 0 };
      }
    })
  );
  const mapaPagos = new Map(pagosPorDeuda.map((x) => [x.deudaId, x.totalPagos]));
  const agrupado = {};
  deudas.forEach((d) => {
    const nombre = d?.cliente?.name || 'Sin cliente';
    const montoTotal = parseFloat(d?.monto_total) || 0;
    const saldo = parseFloat(d?.saldo_pendiente) || 0;
    const pagos = mapaPagos.get(d.id);
    const pagosTotal = typeof pagos === 'number' ? pagos : Math.max(0, montoTotal - saldo);
    if (!agrupado[nombre]) agrupado[nombre] = { deudaTotal: 0, pagosParciales: 0, saldoTotal: 0 };
    agrupado[nombre].deudaTotal += montoTotal;
    agrupado[nombre].pagosParciales += pagosTotal;
    agrupado[nombre].saldoTotal += saldo;
  });
  const filas = Object.keys(agrupado).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })).map((cliente) => {
    const v = agrupado[cliente];
    return [cliente, `Bs. ${v.deudaTotal.toFixed(2)}`, `Bs. ${v.pagosParciales.toFixed(2)}`, `Bs. ${v.saldoTotal.toFixed(2)}`];
  });
  const totales = Object.values(agrupado).reduce((acc, v) => ({ deuda: acc.deuda + v.deudaTotal, pagos: acc.pagos + v.pagosParciales, saldo: acc.saldo + v.saldoTotal }), { deuda: 0, pagos: 0, saldo: 0 });
  const periodo = fechaInicio.getTime() === fechaFin.getTime() ? fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' }) : `${fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })} a ${fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })}`;
  return {
    informacionSuperior: { 'Tipo de Reporte': 'Deudas', Período: periodo, Sucursal: getSucursalName(), 'Deuda Total': `Bs. ${totales.deuda.toFixed(2)}`, 'Pagos Parciales': `Bs. ${totales.pagos.toFixed(2)}`, 'Total Saldo': `Bs. ${totales.saldo.toFixed(2)}` },
    tablaHeaders: ['Cliente', 'Deuda Total', 'Pagos Parciales', 'Total Saldo'],
    tablaValores: filas
  };
}

async function generarReporteProduccion(registros, { fechaInicio, fechaFin }) {
  const productosAgrupados = {};
  registros.forEach((r) => {
    if (!r.producto_almacen?.id) return;
    const key = r.producto_almacen.id;
    if (!productosAgrupados[key]) {
      productosAgrupados[key] = { id: key, nombre: r.producto_almacen.name, cantidadProducida: 0, cantidadVerificada: 0, cantidadTerminados: 0 };
    }
    const cantidadAUsar = r.estado === 'verificado' || r.estado === 'Ingresado' ? parseFloat(r.cantidad_verificada || 0) : parseFloat(r.terminados || 0);
    productosAgrupados[key].cantidadProducida += cantidadAUsar;
    productosAgrupados[key].cantidadVerificada += parseFloat(r.cantidad_verificada || 0);
    productosAgrupados[key].cantidadTerminados += parseFloat(r.terminados || 0);
  });
  const productIds = Object.keys(productosAgrupados).map((id) => String(id)).filter((id) => id && id !== 'null' && id !== 'undefined' && id.trim() !== '');
  if (productIds.length === 0) {
    return {
      informacionSuperior: { 'Tipo de Reporte': 'Producción (Damabrava)', Período: 'Sin datos', Sucursal: getSucursalName(), 'Total Productos': '0', 'Total Materia Prima': '0' },
      tablaHeaders: ['Producto', 'Verificado', 'Terminados', 'Materia Prima', 'C. Consumida'],
      tablaValores: []
    };
  }
  let productosConRecetas = [];
  try {
    const res = await productsAlmacenService.getByIdsWithRecipes(productIds);
    if (res?.success && res?.data) productosConRecetas = res.data;
  } catch {}
  const mapRecetas = new Map(productosConRecetas.map((p) => [p.id, p]));
  const tablaValores = [];
  const materiaPrimaTotal = {};
  const productosOrdenados = Object.values(productosAgrupados).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  productosOrdenados.forEach((producto) => {
    const pr = mapRecetas.get(producto.id);
    if (pr?.recetas?.[0]?.recetas_detalle?.length) {
      pr.recetas[0].recetas_detalle.forEach((ing) => {
        const cantidadConsumida = ing.cantidad * producto.cantidadProducida;
        const idMp = ing.products_acopio.id;
        if (!materiaPrimaTotal[idMp]) materiaPrimaTotal[idMp] = { nombre: ing.products_acopio.name, cantidadTotal: 0 };
        materiaPrimaTotal[idMp].cantidadTotal += cantidadConsumida;
        tablaValores.push([producto.nombre, producto.cantidadVerificada.toString(), producto.cantidadTerminados.toString(), ing.products_acopio.name, cantidadConsumida.toFixed(2)]);
      });
    } else {
      tablaValores.push([producto.nombre, producto.cantidadVerificada.toString(), producto.cantidadTerminados.toString(), pr?.recetas?.[0] ? 'Sin ingredientes' : 'Sin receta', '--']);
    }
  });
  Object.values(materiaPrimaTotal).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })).forEach((m) => tablaValores.push(['--- RESUMEN ---', '---', '---', m.nombre, m.cantidadTotal.toFixed(2)]));
  const totalVerificado = productosOrdenados.reduce((s, p) => s + p.cantidadVerificada, 0);
  const totalTerminados = productosOrdenados.reduce((s, p) => s + p.cantidadTerminados, 0);
  const totalProducido = productosOrdenados.reduce((s, p) => s + p.cantidadProducida, 0);
  const periodo = fechaInicio.getTime() === fechaFin.getTime() ? fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' }) : `${fechaInicio.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })} a ${fechaFin.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })}`;
  return {
    informacionSuperior: {
      'Tipo de Reporte': 'Producción (Damabrava)',
      Período: periodo,
      Sucursal: getSucursalName(),
      'Total Verificado': `${totalVerificado} unidades`,
      'Total Terminados': `${totalTerminados} unidades`,
      'Total Producido': `${totalProducido} unidades`,
      'Total Materia Prima': `${Object.keys(materiaPrimaTotal).length} tipos`,
      'Cantidad de Registros': registros.length.toString()
    },
    tablaHeaders: ['Producto', 'Verificado', 'Terminados', 'Materia Prima', 'C. Consumida'],
    tablaValores,
    columnWidths: { producto: '25%', verificado: '12%', terminados: '12%', materiaPrima: '35%', cConsumida: '16%' }
  };
}

// --- Hook ---
export function useGenerarReporte(fechaInicio, fechaFin, areaSeleccionada, onNotify) {
  const [isLoading, setIsLoading] = useState(false);
  const [datosReporte, setDatosReporte] = useState({});
  const [isDescargaOpen, setIsDescargaOpen] = useState(false);

  const handleGenerarReporte = useCallback(async () => {
    if (!fechaInicio || !fechaFin || !areaSeleccionada) {
      onNotify?.('error', 'Error', 'Por favor selecciona fechas y área');
      return;
    }
    const sucuId = getSucuId();
    if (!sucuId) {
      onNotify?.('error', 'Error', 'No hay sucursal seleccionada');
      return;
    }
    if (areaSeleccionada === 'materia_Prima' && getSucursalName() !== 'Casa Matriz') {
      onNotify?.('error', 'Error', 'Los reportes de materia prima solo están disponibles para Casa Matriz');
      return;
    }
    const fechasPreparadas = prepararFechasFromRange(fechaInicio, fechaFin);
    if (!fechasPreparadas) {
      onNotify?.('error', 'Error', 'Error al preparar las fechas');
      return;
    }
    const { fechaInicioNormalizada, fechaFinNormalizada, filtroFechaISO } = fechasPreparadas;
    const fechaEstaEnRango = (valor) => {
      if (!valor) return false;
      const f = new Date(valor);
      return f >= fechaInicioNormalizada && f <= fechaFinNormalizada;
    };

    setIsLoading(true);
    try {
      let reporteData = {};
      switch (areaSeleccionada) {
        case 'ventas': {
          const res = await movimientosAlmacenService.getAllSinLimite('salida', 'finalizado', 'fecha_desc', sucuId, filtroFechaISO);
          if (!res?.success || !res?.data) {
            onNotify?.('error', 'Error', 'No se pudieron obtener los movimientos de ventas');
            return;
          }
          const filtrados = res.data.filter((m) => fechaEstaEnRango(m.fecha));
          if (filtrados.length === 0) {
            onNotify?.('warning', 'Aviso', 'No hay ventas en el período seleccionado');
            return;
          }
          reporteData = await generarReporteVentas(filtrados, { fechaInicio: fechaInicioNormalizada, fechaFin: fechaFinNormalizada });
          break;
        }
        case 'almacen_general': {
          const res = await movimientosAlmacenService.getAllSinLimite(null, 'finalizado', 'fecha_desc', sucuId, filtroFechaISO);
          if (!res?.success || !res?.data) {
            onNotify?.('error', 'Error', 'No se pudieron obtener los movimientos de almacén');
            return;
          }
          const filtrados = res.data.filter((m) => fechaEstaEnRango(m.fecha));
          if (filtrados.length === 0) {
            onNotify?.('warning', 'Aviso', 'No hay movimientos de almacén en el período seleccionado');
            return;
          }
          reporteData = await generarReporteAlmacen(filtrados, { fechaInicio: fechaInicioNormalizada, fechaFin: fechaFinNormalizada });
          break;
        }
        case 'materia_Prima': {
          const res = await movimientosAcopioService.getAllSinLimite(null, 'fecha_desc', sucuId, filtroFechaISO);
          if (!res?.success || !res?.data) {
            onNotify?.('error', 'Error', 'No se pudieron obtener los movimientos de materia prima');
            return;
          }
          const filtrados = res.data.filter((m) => fechaEstaEnRango(m.date));
          if (filtrados.length === 0) {
            onNotify?.('warning', 'Aviso', 'No hay movimientos de materia prima en el período seleccionado');
            return;
          }
          reporteData = await generarReporteMateriaPrima(filtrados, { fechaInicio: fechaInicioNormalizada, fechaFin: fechaFinNormalizada });
          break;
        }
        case 'gastos': {
          const res = await gastosService.getByDateRange(toYmd(fechaInicioNormalizada), toYmd(fechaFinNormalizada), sucuId);
          if (!res?.success || !Array.isArray(res.data)) {
            onNotify?.('error', 'Error', 'No se pudieron obtener los gastos');
            return;
          }
          if (res.data.length === 0) {
            onNotify?.('warning', 'Aviso', 'No hay gastos en el período seleccionado');
            return;
          }
          reporteData = await generarReporteGastos(res.data, { fechaInicio: fechaInicioNormalizada, fechaFin: fechaFinNormalizada });
          break;
        }
        case 'deudas': {
          const res = await deudasService.getByDateRange(toYmd(fechaInicioNormalizada), toYmd(fechaFinNormalizada), sucuId);
          if (!res?.success || !Array.isArray(res.data)) {
            onNotify?.('error', 'Error', 'No se pudieron obtener las deudas');
            return;
          }
          if (res.data.length === 0) {
            onNotify?.('warning', 'Aviso', 'No hay deudas en el período seleccionado');
            return;
          }
          reporteData = await generarReporteDeudas({ fechaInicio: fechaInicioNormalizada, fechaFin: fechaFinNormalizada });
          break;
        }
        case 'produccion': {
          if (!isDamabrava()) {
            onNotify?.('error', 'Error', 'Área no válida');
            return;
          }
          const res = await registrosProduccionDamabravaService.getAllSinLimite();
          if (!res?.success || !res?.data) {
            onNotify?.('error', 'Error', 'No se pudieron obtener los registros de producción');
            return;
          }
          const filtrados = res.data.filter((r) => fechaEstaEnRango(r.fecha));
          if (filtrados.length === 0) {
            onNotify?.('warning', 'Aviso', 'No hay registros de producción en el período seleccionado');
            return;
          }
          reporteData = await generarReporteProduccion(filtrados, { fechaInicio: fechaInicioNormalizada, fechaFin: fechaFinNormalizada });
          break;
        }
        default:
          onNotify?.('error', 'Error', 'Área no válida');
          return;
      }
      setDatosReporte(reporteData);
      setIsDescargaOpen(true);
      onNotify?.('success', 'Éxito', 'Reporte generado correctamente');
    } catch (error) {
      console.error('Error generando reporte:', error);
      onNotify?.('error', 'Error', error?.message || 'Error al generar el reporte');
    } finally {
      setIsLoading(false);
    }
  }, [fechaInicio, fechaFin, areaSeleccionada, onNotify]);

  return { handleGenerarReporte, isLoading, datosReporte, isDescargaOpen, setIsDescargaOpen };
}
