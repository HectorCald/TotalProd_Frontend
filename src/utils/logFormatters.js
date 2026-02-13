import { formatFechaHoraLiteral } from './dateUtils';

/** Formatea un valor de fecha a string en zona horaria local para guardar en historial */
const formatFechaParaHistorial = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const str = formatFechaHoraLiteral(value);
  return str === '--' ? null : str;
};

const cleanObject = (obj) => {
  if (!obj || typeof obj !== 'object') return null;
  const entries = Object.entries(obj).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  });
  if (entries.length === 0) {
    return null;
  }
  return Object.fromEntries(entries);
};

const toNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  if (decimals === null) return parsed;
  return Number(parsed.toFixed(decimals));
};

const mapPricesByName = (producto, tipos = []) => {
  if (!producto) return null;
  const pricesArray = [];

  if (Array.isArray(producto.price_product)) {
    producto.price_product.forEach((price) => {
      const nombre =
        price.prices_types?.name ||
        tipos.find((tipo) => String(tipo.id) === String(price.prices_types?.id))?.name ||
        null;
      if (!nombre) return;
      pricesArray.push([nombre, toNumber(price.valor)]);
    });
  } else if (producto.prices && typeof producto.prices === 'object') {
    Object.entries(producto.prices).forEach(([key, valor]) => {
      const nombre =
        tipos.find((tipo) => String(tipo.id) === String(key))?.name ||
        producto.prices_types?.[key]?.name ||
        null;
      if (!nombre) return;
      pricesArray.push([nombre, toNumber(valor)]);
    });
  }

  if (pricesArray.length === 0) return null;
  return Object.fromEntries(pricesArray.filter(([, valor]) => valor !== null));
};

export const extractRecetaFromAlmacen = (producto) => {
  const recetaFuente = Array.isArray(producto?.recetas)
    ? producto.recetas[0]
    : producto?.receta || null;
  if (!recetaFuente) return null;

  const detalles =
    recetaFuente.recetas_detalle ||
    recetaFuente.recetas_acopio_detalle ||
    recetaFuente.productos ||
    [];

  const ingredientes = detalles
    .map((detalle) => {
      const productoNombre =
        detalle.products_acopio?.name ||
        detalle.producto_acopio?.name ||
        detalle.producto?.name ||
        detalle.name ||
        null;
      if (!productoNombre) return null;

      const unidad =
        detalle.products_acopio?.type_measure?.code ||
        detalle.producto_acopio?.type_measure?.code ||
        detalle.producto?.type_measure?.code ||
        null;

      return cleanObject({
        producto: productoNombre,
        cantidad: toNumber(detalle.cantidad),
        unidad,
      });
    })
    .filter(Boolean);

  if (ingredientes.length === 0) return null;

  return cleanObject({
    descripcion:
      recetaFuente.descripcion ||
      recetaFuente.description ||
      producto?.receta?.descripcion ||
      producto?.receta?.description ||
      null,
    ingredientes,
  });
};

export const extractRecetaFromAcopio = (producto) => {
  const recetaFuente = Array.isArray(producto?.recetas_acopio)
    ? producto.recetas_acopio[0]
    : producto?.receta ||
      producto?.recetas ||
      producto?.receta_acopio ||
      null;

  if (!recetaFuente) return null;

  const detalles =
    recetaFuente.recetas_acopio_detalle ||
    recetaFuente.recetas_detalle ||
    recetaFuente.productos ||
    [];

  const ingredientes = detalles
    .map((detalle) => {
      const productoNombre =
        detalle.products_acopio?.name ||
        detalle.producto_acopio?.name ||
        detalle.producto?.name ||
        detalle.name ||
        null;
      if (!productoNombre) return null;
      const unidad =
        detalle.products_acopio?.type_measure?.code ||
        detalle.producto_acopio?.type_measure?.code ||
        detalle.producto?.type_measure?.code ||
        null;
      return cleanObject({
        producto: productoNombre,
        cantidad: toNumber(detalle.cantidad),
        unidad,
      });
    })
    .filter(Boolean);

  if (ingredientes.length === 0) return null;

  return cleanObject({
    descripcion:
      recetaFuente.descripcion ||
      recetaFuente.description ||
      producto?.receta?.descripcion ||
      producto?.receta?.description ||
      null,
    ingredientes,
  });
};

export const formatProductoAlmacenLog = (
  producto,
  { precioTipos = [], categoriaFallback = null } = {}
) => {
  if (!producto) return null;

  const categoriaNombre =
    producto.category_almacen?.name ||
    producto.category?.name ||
    producto.category_name ||
    categoriaFallback ||
    null;

  const result = cleanObject({
    nombre: producto.name,
    descripcion: producto.description,
    stock:
      producto.stock !== undefined
        ? toNumber(producto.stock, null)
        : producto.quantity !== undefined
        ? toNumber(producto.quantity, null)
        : null,
    codigo_barras: producto.codigo_barras,
    categoria: categoriaNombre,
    grupo:
      producto.grup !== undefined
        ? toNumber(producto.grup, null)
        : producto.group !== undefined
        ? toNumber(producto.group, null)
        : null,
    stock_minimo:
      producto.stock_minimo !== undefined
        ? toNumber(producto.stock_minimo, null)
        : null,
    costo_produccion:
      producto.costo_produccion !== undefined
        ? toNumber(producto.costo_produccion)
        : null,
    precios: mapPricesByName(producto, precioTipos),
    receta: extractRecetaFromAlmacen(producto),
  });

  return result;
};

const resolveTypeMeasure = (producto, typeMeasures = []) => {
  if (producto?.type_measure?.name || producto?.type_measure?.code) {
    return cleanObject({
      nombre: producto.type_measure.name || producto.type_measure.code,
      codigo: producto.type_measure.code || producto.type_measure.name || null,
    });
  }
  const typeMeasureId =
    producto?.type_measure_id ||
    producto?.typeMeasureId ||
    producto?.type_measure?.id ||
    null;
  if (typeMeasureId) {
    const encontrado = typeMeasures.find(
      (item) => String(item.id) === String(typeMeasureId)
    );
    if (encontrado) {
      return cleanObject({
        nombre: encontrado.name || encontrado.code,
        codigo: encontrado.code || encontrado.name || null,
      });
    }
  }
  return null;
};

export const formatProductoAcopioLog = (
  producto,
  { typeMeasures = [], categoriaFallback = null } = {}
) => {
  if (!producto) return null;

  const categoriaNombre =
    producto.category?.name ||
    producto.category_name ||
    categoriaFallback ||
    null;

  const typeMeasureInfo = resolveTypeMeasure(producto, typeMeasures);

  const result = cleanObject({
    nombre: producto.name,
    descripcion: producto.description,
    cantidad:
      producto.quantity !== undefined
        ? toNumber(producto.quantity)
        : producto.stock !== undefined
        ? toNumber(producto.stock)
        : null,
    tipo_medida: typeMeasureInfo?.nombre,
    categoria: categoriaNombre,
    stock_minimo:
      producto.stock_minimo !== undefined
        ? toNumber(producto.stock_minimo)
        : null,
    receta: extractRecetaFromAcopio(producto),
  });

  return result;
};

const sumMovimientoTotal = (movimiento) => {
  if (!movimiento || !Array.isArray(movimiento.productos)) return null;
  return movimiento.productos.reduce((acc, detalle) => {
    const subtotal = toNumber(detalle.subtotal);
    return acc + (subtotal || 0);
  }, 0);
};

export const formatMovimientoLog = (movimiento) => {
  if (!movimiento) return null;

  const subtotal =
    movimiento.total !== undefined
      ? toNumber(movimiento.total)
      : sumMovimientoTotal(movimiento);
  const descuento = toNumber(movimiento.descuento);
  const aumento = toNumber(movimiento.aumento);
  const total =
    (subtotal || 0) -
    (descuento ?? 0) +
    (aumento ?? 0);

  const result = cleanObject({
    numero: movimiento.id,
    tipo: movimiento.type === 'entrada' ? 'Entrada' : 'Salida',
    estado: movimiento.estado === 'anulado' ? 'Anulado' : 'Finalizado',
    fecha: formatFechaParaHistorial(movimiento.fecha || movimiento.date || movimiento.created_at),
    responsable: movimiento.user?.name || movimiento.personal?.name || null,
    cliente: movimiento.cliente?.name || null,
    proveedor: movimiento.proveedor?.name || null,
    modalidad: movimiento.agrupado ? 'Agrupado' : 'Unidades',
    metodo_pago: movimiento.metodo_pago || null,
    precio: movimiento.precio?.name || movimiento.precio_name || null,
    concepto: movimiento.concepto || null,
    numero_orden: movimiento.numero_orden ?? null,
    descuento,
    aumento,
    total: toNumber(total),
    observaciones: movimiento.observaciones || null
  });

  return result;
};

/** Detalles del movimiento para historial: toda la info menos productos. Cliente solo nombre. */
const CAMPOS_MOVIMIENTO_ORDEN = [
  'Código/Número',
  'Tipo',
  'Estado',
  'Fecha',
  'Número de orden',
  'Cliente',
  'Método de pago',
  'Vendedor/Responsable',
  'Modalidad',
  'Concepto',
  'Tipo de precio',
  'Descuento',
  'Aumento',
  'Total',
  'Observaciones'
];

const extraerValoresMovimiento = (movimiento) => {
  if (!movimiento) return {};
  const subtotal =
    movimiento.total !== undefined
      ? toNumber(movimiento.total)
      : sumMovimientoTotal(movimiento);
  const descuento = toNumber(movimiento.descuento);
  const aumento = toNumber(movimiento.aumento);
  const total =
    (subtotal || 0) - (descuento ?? 0) + (aumento ?? 0);
  const fechaVal = movimiento.fecha || movimiento.date || movimiento.created_at;
  return {
    'Código/Número': movimiento.codigo || movimiento.id,
    'Tipo': movimiento.type === 'entrada' ? 'Entrada' : movimiento.type === 'transferencia' ? 'Transferencia' : 'Salida',
    'Estado': movimiento.estado === 'anulado' ? 'Anulado' : 'Finalizado',
    'Fecha': formatFechaParaHistorial(fechaVal),
    'Número de orden': movimiento.numero_orden != null ? String(movimiento.numero_orden) : null,
    'Cliente': movimiento.cliente?.name || null,
    'Método de pago': movimiento.metodo_pago ? String(movimiento.metodo_pago).toUpperCase() : null,
    'Vendedor/Responsable': movimiento.user?.name || movimiento.personal?.name || null,
    'Modalidad': movimiento.agrupado ? 'Agrupado' : 'Unidades',
    'Concepto': movimiento.concepto || null,
    'Tipo de precio': movimiento.precio?.name || movimiento.precio_name || null,
    'Descuento': descuento != null ? toNumber(descuento) : null,
    'Aumento': aumento != null ? toNumber(aumento) : null,
    'Total': toNumber(total) ?? null,
    'Observaciones': movimiento.observaciones || null
  };
};

/** Detalles del movimiento acopio para historial. Cliente/proveedor solo nombre. */
const CAMPOS_MOVIMIENTO_ACOPIO_ORDEN = [
  'Código/Número',
  'Producto',
  'Cantidad',
  'Unidad de medida',
  'Tipo',
  'Cliente',
  'Proveedor',
  'Responsable',
  'Sucursal',
  'Costo',
  'Restar ingredientes',
  'Método de pago',
  'Observaciones',
  'Fecha',
  'Estado'
];

const extraerValoresMovimientoAcopio = (movimiento) => {
  if (!movimiento) return {};
  const fechaVal = movimiento.date || movimiento.fecha || movimiento.created_at;
  return {
    'Código/Número': movimiento.codigo || movimiento.id,
    'Producto': movimiento.product?.name || null,
    'Cantidad': movimiento.quantity != null ? String(movimiento.quantity) : null,
    'Unidad de medida': movimiento.product?.type_measure?.code || null,
    'Tipo': movimiento.type === 'entrada' ? 'Entrada' : 'Salida',
    'Cliente': movimiento.cliente?.name || null,
    'Proveedor': movimiento.proveedor?.name || null,
    'Responsable': movimiento.user?.name || movimiento.personal?.name || null,
    'Sucursal': movimiento.sucursal?.name || null,
    'Costo': movimiento.costo != null ? toNumber(movimiento.costo) : null,
    'Restar ingredientes': movimiento.restar_ingredientes ? 'Sí' : 'No',
    'Método de pago': movimiento.metodo_pago ? String(movimiento.metodo_pago).toUpperCase() : null,
    'Observaciones': movimiento.observations || movimiento.observaciones || null,
    'Fecha': formatFechaParaHistorial(fechaVal),
    'Estado': movimiento.estado === 'anulado' ? 'Anulado' : 'Finalizado'
  };
};

/** Construye detallesPersonalizados para historial de movimientos acopio (materia prima). */
export const buildMovimientoAcopioDetallesParaHistorial = (movimientoAntes, movimientoDespues, accion) => {
  const camposOrden = CAMPOS_MOVIMIENTO_ACOPIO_ORDEN;
  const valsAntes = extraerValoresMovimientoAcopio(movimientoAntes);
  const valsDespues = extraerValoresMovimientoAcopio(movimientoDespues);
  const campos = {};
  camposOrden.forEach((key) => {
    const vAntes = valsAntes[key];
    const vDespues = valsDespues[key];
    if (accion === 'ELIMINAR' || accion === 'ANULAR') {
      campos[key] = { antes: vAntes ?? null };
    } else if (accion === 'EDITAR') {
      const igual = JSON.stringify(vAntes) === JSON.stringify(vDespues);
      if (!igual) {
        campos[key] = { antes: vAntes ?? null, despues: vDespues ?? null };
      }
    }
  });
  return {
    campos,
    camposOrden,
    comentario: accion === 'ELIMINAR' ? 'Eliminación de movimiento materia prima' : accion === 'ANULAR' ? 'Anulación de movimiento materia prima' : 'Edición de movimiento materia prima'
  };
};

/** Construye detallesPersonalizados para historial de movimientos (sin productos). */
export const buildMovimientoDetallesParaHistorial = (movimientoAntes, movimientoDespues, accion) => {
  const camposOrden = CAMPOS_MOVIMIENTO_ORDEN;
  const valsAntes = extraerValoresMovimiento(movimientoAntes);
  const valsDespues = extraerValoresMovimiento(movimientoDespues);
  const campos = {};
  camposOrden.forEach((key) => {
    const vAntes = valsAntes[key];
    const vDespues = valsDespues[key];
    if (accion === 'ELIMINAR' || accion === 'ANULAR') {
      campos[key] = { antes: vAntes ?? null };
    } else if (accion === 'EDITAR') {
      const igual = JSON.stringify(vAntes) === JSON.stringify(vDespues);
      if (!igual) {
        campos[key] = { antes: vAntes ?? null, despues: vDespues ?? null };
      }
    }
  });
  return {
    campos,
    camposOrden,
    comentario: accion === 'ELIMINAR' ? 'Eliminación de movimiento' : accion === 'ANULAR' ? 'Anulación de movimiento' : 'Edición de movimiento'
  };
};

/** Detalles del pedido almacén para historial: toda la info MENOS productos. */
const CAMPOS_PEDIDO_ORDEN = [
  'Número de pedido',
  'Fecha',
  'Estado',
  'Cliente',
  'Sucursal origen',
  'Sucursal destino',
  'Solicitante',
  'Modalidad',
  'Tipo de precio',
  'Método de pago',
  'Total',
  'Observaciones'
];

const extraerValoresPedido = (pedido) => {
  if (!pedido) return {};
  const totalCalculado =
    pedido.total !== undefined
      ? toNumber(pedido.total)
      : Array.isArray(pedido.pedido_almacen_detalle)
      ? pedido.pedido_almacen_detalle.reduce((acc, detalle) => {
          const precio = toNumber(detalle.precio);
          const cantidad = toNumber(detalle.cantidad, pedido?.agrupado ? null : 2);
          return acc + (precio || 0) * (cantidad || 0);
        }, 0)
      : null;
  return {
    'Número de pedido': pedido.numero_pedido ?? pedido.id ?? null,
    'Fecha': formatFechaParaHistorial(pedido.fecha || pedido.created_at),
    'Estado': pedido.estado || null,
    'Cliente': pedido.cliente?.name || null,
    'Sucursal origen': pedido.sucursal?.name || null,
    'Sucursal destino': pedido.sucursal_destino?.name || null,
    'Solicitante': pedido.user?.name || pedido.personal?.name || null,
    'Modalidad': pedido.agrupado ? 'Agrupado' : 'Unidades',
    'Tipo de precio': pedido.precio?.name || pedido.precio_name || null,
    'Método de pago': pedido.movimiento_salida?.metodo_pago || null,
    'Total': totalCalculado != null ? toNumber(totalCalculado) : null,
    'Observaciones': pedido.observaciones || null
  };
};

/** Construye detallesPersonalizados para historial de pedidos almacén (sin productos). */
export const buildPedidoDetallesParaHistorial = (pedidoAntes, pedidoDespues, accion) => {
  const camposOrden = CAMPOS_PEDIDO_ORDEN;
  const valsAntes = extraerValoresPedido(pedidoAntes);
  const valsDespues = extraerValoresPedido(pedidoDespues);
  const campos = {};
  camposOrden.forEach((key) => {
    const vAntes = valsAntes[key];
    const vDespues = valsDespues[key];
    if (accion === 'ELIMINAR' || accion === 'ANULAR') {
      campos[key] = { antes: vAntes ?? null };
    } else if (accion === 'EDITAR' || accion === 'ENTREGAR') {
      const igual = JSON.stringify(vAntes) === JSON.stringify(vDespues);
      if (accion === 'ENTREGAR') {
        campos[key] = { despues: vDespues ?? null };
      } else if (!igual) {
        campos[key] = { antes: vAntes ?? null, despues: vDespues ?? null };
      }
    }
  });
  const comentarios = {
    ELIMINAR: 'Eliminación de pedido',
    EDITAR: 'Edición de pedido',
    ENTREGAR: 'Entrega de pedido',
    ANULAR: 'Anulación de entrega de pedido'
  };
  return {
    campos,
    camposOrden,
    comentario: comentarios[accion] || 'Pedido'
  };
};

/** Detalles del pedido acopio para historial: toda la info INCLUYENDO producto. */
const CAMPOS_PEDIDO_ACOPIO_ORDEN = [
  'Número/Código',
  'Producto',
  'Cantidad',
  'Unidad',
  'Fecha',
  'Estado',
  'Cliente',
  'Sucursal',
  'Solicitante',
  'Observaciones'
];

const extraerValoresPedidoAcopio = (pedido) => {
  if (!pedido) return {};
  return {
    'Número/Código': pedido.codigo || pedido.numero_pedido || pedido.id,
    'Producto': pedido.producto_acopio?.name || null,
    'Cantidad': pedido.cantidad != null ? String(pedido.cantidad) : null,
    'Unidad': pedido.tipo_medida || null,
    'Fecha': formatFechaParaHistorial(pedido.fecha || pedido.created_at),
    'Estado': pedido.estado || null,
    'Cliente': pedido.cliente?.name || null,
    'Sucursal': pedido.sucursal?.name || null,
    'Solicitante': pedido.user?.name || pedido.personal?.name || null,
    'Observaciones': pedido.observaciones || null
  };
};

/** Construye detallesPersonalizados para historial de pedidos acopio (con producto). */
export const buildPedidoAcopioDetallesParaHistorial = (pedidoAntes, pedidoDespues, accion) => {
  const camposOrden = CAMPOS_PEDIDO_ACOPIO_ORDEN;
  const valsAntes = extraerValoresPedidoAcopio(pedidoAntes);
  const valsDespues = extraerValoresPedidoAcopio(pedidoDespues);
  const campos = {};
  camposOrden.forEach((key) => {
    const vAntes = valsAntes[key];
    const vDespues = valsDespues[key];
    if (accion === 'ELIMINAR' || accion === 'ANULAR') {
      campos[key] = { antes: vAntes ?? null };
    } else if (accion === 'ENTREGAR') {
      campos[key] = { despues: vDespues ?? null };
    }
  });
  const comentarios = {
    ELIMINAR: 'Eliminación de pedido materia prima',
    ENTREGAR: 'Entrega de pedido materia prima',
    ANULAR: 'Anulación de entrega de pedido materia prima'
  };
  return {
    campos,
    camposOrden,
    comentario: comentarios[accion] || 'Pedido materia prima'
  };
};

/** Detalles del registro de producción para historial (ELIMINAR). */
const CAMPOS_PRODUCCION_ORDEN = [
  'Producto',
  'Lote',
  'Proceso',
  'Microondas',
  'Terminados',
  'Vencimiento',
  'Estado',
  'Responsable',
  'Sucursal',
  'Fecha',
  'Observaciones'
];

const extraerValoresProduccion = (registro) => {
  if (!registro) return {};
  const procesoLabel = registro.proceso === 'cernido' ? 'Cernido' : registro.proceso === 'seleccionado' ? 'Seleccionado' : registro.proceso === 'ninguno' ? 'Ninguno' : registro.proceso || null;
  const estadoLabel = registro.estado === 'pendiente' ? 'Pendiente' : registro.estado === 'verificado' ? 'Verificado' : registro.estado === 'Ingresado' ? 'Ingresado' : registro.estado === 'anulado' ? 'Anulado' : registro.estado || null;
  const [y, m] = (String(registro.vencimiento || '').split('T')[0] || '').split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const vencimientoStr = y && m ? `${meses[(parseInt(m, 10) || 1) - 1] || ''} ${y}` : null;
  return {
    'Producto': registro.producto_almacen?.name || null,
    'Lote': registro.lote != null ? String(registro.lote) : null,
    'Proceso': procesoLabel,
    'Microondas': registro.microondas != null ? `${registro.microondas} seg` : null,
    'Terminados': registro.terminados != null ? `${registro.terminados} ud` : null,
    'Vencimiento': vencimientoStr,
    'Estado': estadoLabel,
    'Responsable': registro.user?.name || registro.personal?.name || null,
    'Sucursal': registro.sucursal?.name || null,
    'Fecha': formatFechaParaHistorial(registro.fecha),
    'Observaciones': registro.observaciones || null
  };
};

export const buildProduccionDetallesParaHistorial = (registro, accion) => {
  const camposOrden = CAMPOS_PRODUCCION_ORDEN;
  const vals = extraerValoresProduccion(registro);
  const campos = {};
  camposOrden.forEach((key) => {
    campos[key] = { antes: vals[key] ?? null };
  });
  return {
    campos,
    camposOrden,
    comentario: 'Eliminación de registro de producción'
  };
};

/** Detalles del pago Damabrava para historial (ELIMINAR). */
const CAMPOS_PAGO_ORDEN = [
  'Beneficiario',
  'Estado',
  'Periodo',
  'Registrado por',
  'Total producción',
  'Extras',
  'Descuento',
  'Aumento',
  'Total con ajustes',
  'Fecha'
];

const extraerValoresPago = (pago) => {
  if (!pago) return {};
  const totalProd = Number(pago.total) || 0;
  const extras = Number(pago.extras) || 0;
  const descuento = Number(pago.descuento) || 0;
  const aumento = Number(pago.aumento) || 0;
  const totalConAjustes = totalProd + extras + aumento - descuento;
  const responsableName = pago.responsable?.name || (pago.responsable?.first_name
    ? `${pago.responsable.first_name || ''} ${pago.responsable.last_name || ''}`.trim()
    : null);
  const periodoInicio = pago.fecha_inicio ? formatFechaParaHistorial(pago.fecha_inicio) : null;
  const periodoFin = pago.fecha_fin ? formatFechaParaHistorial(pago.fecha_fin) : null;
  const periodoStr = periodoInicio && periodoFin ? `${periodoInicio} - ${periodoFin}` : null;
  const registradoPor = pago.registrado_por?.name || pago.personal?.name || pago.user?.name || null;
  return {
    'Beneficiario': responsableName,
    'Estado': pago.estado === 'pagado' ? 'Pagado' : 'Pendiente',
    'Periodo': periodoStr,
    'Registrado por': registradoPor,
    'Total producción': totalProd,
    'Extras': extras,
    'Descuento': descuento,
    'Aumento': aumento,
    'Total con ajustes': totalConAjustes,
    'Fecha': formatFechaParaHistorial(pago.fecha)
  };
};

export const buildPagoDetallesParaHistorial = (pago, accion) => {
  const camposOrden = CAMPOS_PAGO_ORDEN;
  const vals = extraerValoresPago(pago);
  const campos = {};
  camposOrden.forEach((key) => {
    campos[key] = { antes: vals[key] ?? null };
  });
  return {
    campos,
    camposOrden,
    comentario: 'Eliminación de pago'
  };
};

export const formatPedidoLog = (pedido) => {
  if (!pedido) return null;
  const totalCalculado =
    pedido.total !== undefined
      ? toNumber(pedido.total)
      : Array.isArray(pedido.pedido_almacen_detalle)
      ? pedido.pedido_almacen_detalle.reduce((acc, detalle) => {
          const precio = toNumber(detalle.precio);
          const cantidad = toNumber(detalle.cantidad, pedido?.agrupado ? null : 2);
          return acc + (precio || 0) * (cantidad || 0);
        }, 0)
      : null;

  const result = cleanObject({
    numero: pedido.numero_pedido ?? pedido.id ?? null,
    estado: pedido.estado || null,
    fecha: formatFechaParaHistorial(pedido.fecha || pedido.created_at),
    tipo_precio: pedido.precio?.name || pedido.precio_name || null,
    modalidad: pedido.agrupado ? 'Agrupado' : 'Unidades',
    cliente: pedido.cliente?.name || null,
    sucursal_origen: pedido.sucursal?.name || null,
    sucursal_destino: pedido.sucursal_destino?.name || null,
    metodo_pago: pedido.movimiento_salida?.metodo_pago || null,
    total: totalCalculado !== null ? toNumber(totalCalculado) : null,
    observaciones: pedido.observaciones || null
  });

  return result;
};

export const formatConteoLog = (conteo) => {
  if (!conteo) return null;

  const result = cleanObject({
    id: conteo.id,
    tipo: conteo.tipo === 'almacen' ? 'Almacén' : 'Materia Prima',
    fecha: formatFechaParaHistorial(conteo.fecha || conteo.created_at),
    responsable: conteo.user?.name || conteo.personal?.name || null,
    observaciones: conteo.observaciones || null
  });

  return result;
};

/** Detalles del conteo para historial con etiquetas en español. Incluye Fecha del conteo. */
const CAMPOS_CONTEO_ORDEN = ['Código/ID', 'Tipo', 'Fecha del conteo', 'Responsable', 'Observaciones'];

const extraerValoresConteo = (conteo) => {
  if (!conteo) return {};
  return {
    'Código/ID': conteo.codigo || conteo.id,
    'Tipo': conteo.tipo === 'almacen' ? 'Almacén' : 'Materia Prima',
    'Fecha del conteo': formatFechaParaHistorial(conteo.fecha || conteo.created_at),
    'Responsable': conteo.user?.name || conteo.personal?.name || null,
    'Observaciones': conteo.observaciones || null
  };
};

/** Construye detallesPersonalizados para historial de conteos (REMPLAZO o ELIMINAR). */
export const buildConteoDetallesParaHistorial = (conteo, accion) => {
  const camposOrden = CAMPOS_CONTEO_ORDEN;
  const vals = extraerValoresConteo(conteo);
  const campos = {};
  camposOrden.forEach((key) => {
    const v = vals[key];
    if (accion === 'ELIMINAR') {
      campos[key] = { antes: v ?? null };
    } else {
      campos[key] = { despues: v ?? null };
    }
  });
  return {
    campos,
    camposOrden,
    comentario: accion === 'ELIMINAR' ? 'Eliminación de conteo' : 'Reemplazo de stock con conteo'
  };
};

const filterChangedFields = (antes, despues) => {
  const keys = new Set([
    ...Object.keys(antes || {}),
    ...Object.keys(despues || {})
  ]);
  const antesFiltrado = {};
  const despuesFiltrado = {};
  const campos = [];

  keys.forEach((key) => {
    const valorAntes = antes ? antes[key] : undefined;
    const valorDespues = despues ? despues[key] : undefined;

    if (JSON.stringify(valorAntes) === JSON.stringify(valorDespues)) {
      return;
    }

    if (valorAntes !== undefined) {
      antesFiltrado[key] = valorAntes;
    }
    if (valorDespues !== undefined) {
      despuesFiltrado[key] = valorDespues;
    }
    campos.push(key);
  });

  return {
    datosAntes:
      Object.keys(antesFiltrado).length > 0 ? cleanObject(antesFiltrado) : null,
    datosDespues:
      Object.keys(despuesFiltrado).length > 0 ? cleanObject(despuesFiltrado) : null,
    campos
  };
};

export const collectLogCampos = (datosAntes, datosDespues) => {
  const campos = new Set();
  const agregar = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((key) => campos.add(key));
  };
  agregar(datosAntes);
  agregar(datosDespues);
  return Array.from(campos);
};

export const prepareLogPayload = ({ accion, datosAntes, datosDespues }) => {
  const accionUpper = (accion || '').toUpperCase();
  if (accionUpper === 'EDITAR' || accionUpper === 'REMPLAZO') {
    return filterChangedFields(datosAntes || {}, datosDespues || {});
  }

  return {
    datosAntes,
    datosDespues,
    campos: collectLogCampos(datosAntes, datosDespues)
  };
};


