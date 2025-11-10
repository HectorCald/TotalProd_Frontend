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

const extractRecetaFromAlmacen = (producto) => {
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

const extractRecetaFromAcopio = (producto) => {
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
    fecha: movimiento.fecha || movimiento.date || movimiento.created_at || null,
    responsable: movimiento.user?.name || movimiento.personal?.name || null,
    cliente: movimiento.cliente?.name || null,
    proveedor: movimiento.proveedor?.name || null,
    modalidad: movimiento.agrupado ? 'Agrupado' : 'Unidades',
    metodo_pago: movimiento.metodo_pago || null,
    precio: movimiento.precio?.name || movimiento.precio_name || null,
    descuento,
    aumento,
    total: toNumber(total),
    observaciones: movimiento.observaciones || null
  });

  return result;
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
    fecha: pedido.fecha || pedido.created_at || null,
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
    fecha: conteo.fecha || conteo.created_at || null,
    responsable: conteo.user?.name || conteo.personal?.name || null,
    observaciones: conteo.observaciones || null
  });

  return result;
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
  if (accionUpper === 'EDITAR') {
    return filterChangedFields(datosAntes || {}, datosDespues || {});
  }

  return {
    datosAntes,
    datosDespues,
    campos: collectLogCampos(datosAntes, datosDespues)
  };
};


