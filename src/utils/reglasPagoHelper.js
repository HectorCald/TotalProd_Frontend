const normalizeText = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^\p{ASCII}]/gu, '')
        .trim();
};

const normalizeToGrams = (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (Number.isNaN(num)) return null;

    return Math.abs(num) < 10 ? num * 1000 : num;
};

const obtenerCantidadEnGramos = (detalle) => {
    if (!detalle) return 0;
    const cantidad = Number(detalle.cantidad) || 0;
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return 0;
    }
    const typeMeasure =
        detalle?.products_acopio?.type_measure ||
        detalle?.products_acopio?.typeMeasure ||
        {};
    const codigo =
        typeMeasure.code ||
        typeMeasure.codigo ||
        typeMeasure.name ||
        '';
    const codigoLower = typeof codigo === 'string' ? codigo.toLowerCase() : '';

    return codigoLower.includes('kg') ? cantidad * 1000 : cantidad;
};

const normalizeBoundary = (boundary) => normalizeToGrams(boundary);

const isValueInRange = (value, desde, hasta) => {
    if (value === null || value === undefined) return false;
    const numValue = Number(value);
    if (Number.isNaN(numValue)) return false;
    const numDesde = normalizeBoundary(desde);
    const numHasta = normalizeBoundary(hasta);

    if (numDesde !== null && numHasta !== null) {
        return numValue >= numDesde && numValue <= numHasta;
    }
    if (numDesde !== null) {
        return numValue >= numDesde;
    }
    if (numHasta !== null) {
        return numValue <= numHasta;
    }
    return true;
};

export const seleccionarReglaParaProducto = (reglas = [], registro = null, productoDetalle = null) => {
    if (!reglas || reglas.length === 0 || !registro) return null;

    const getProductoAlmacenId = (regla) => regla?.producto_almacen?.id || regla?.producto_almacen_id || null;

    const productoId = registro?.producto_almacen?.id || productoDetalle?.id || null;
    const productoNombreNormalizado = normalizeText(
        registro?.producto_almacen?.name ||
        productoDetalle?.name ||
        ''
    );

    // 1. Regla especial por producto asociado
    const reglaEspecialPorProducto = reglas.find((regla) => {
        if (regla.general !== false) return false;
        const reglaProductoId = getProductoAlmacenId(regla);
        return reglaProductoId && productoId && reglaProductoId === productoId;
    });
    if (reglaEspecialPorProducto) return reglaEspecialPorProducto;

    // 2. Regla por gramaje
    const ingredienteKg = obtenerIngredienteKg(productoDetalle);
    const gramajeProducto =
        productoDetalle?.gramaje ??
        registro?.producto_almacen?.gramaje ??
        (ingredienteKg ? obtenerCantidadEnGramos(ingredienteKg) : null);

    if (gramajeProducto !== null && gramajeProducto !== undefined) {
        const reglaPorGramaje = reglas.find((regla) => {
            if (regla.general !== null) return false;
            return isValueInRange(gramajeProducto, regla.desde_gramaje, regla.hasta_gramaje);
        });
        if (reglaPorGramaje) return reglaPorGramaje;
    }

    // 3. Regla general con contenido (texto "contiene")
    const reglaGeneralConContenido = reglas.find((regla) => {
        if (regla.general !== false) return false;
        if (getProductoAlmacenId(regla)) return false;
        if (!regla.contiene) return false;
        const contieneNormalizado = normalizeText(regla.contiene);
        return contieneNormalizado && productoNombreNormalizado.includes(contieneNormalizado);
    });
    if (reglaGeneralConContenido) return reglaGeneralConContenido;

    // 4. Regla general global (general true sin contenido)
    const reglaGeneral = reglas.find((regla) => regla.general === true);
    if (reglaGeneral) return reglaGeneral;

    return null;
};

const redondear = (valor, decimales = 2) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return 0;
    const factor = 10 ** decimales;
    return Math.round(numero * factor) / factor;
};

const obtenerIngredienteKg = (productoDetalle) => {
    if (!productoDetalle) return null;
    const recetas = productoDetalle.recetas || productoDetalle.recetas_acopio || [];
    if (!Array.isArray(recetas) || recetas.length === 0) return null;

    const detalles =
        recetas[0]?.recetas_detalle ||
        recetas[0]?.recetas_acopio_detalle ||
        [];

    if (!Array.isArray(detalles)) return null;

    return detalles.find((detalle) => {
        const typeMeasure =
            detalle?.products_acopio?.type_measure ||
            detalle?.products_acopio?.typeMeasure ||
            {};
        const codigo =
            typeMeasure.code ||
            typeMeasure.codigo ||
            typeMeasure.name ||
            '';
        return (
            codigo &&
            typeof codigo === 'string' &&
            codigo.toLowerCase().includes('kg')
        );
    }) || null;
};

export const calcularPagoProcesos = ({
    regla,
    terminados,
    productoDetalle,
    proceso = 'ninguno'
}) => {
    const cantidadTerminados = Number(terminados) || 0;
    if (!regla || cantidadTerminados <= 0) {
        return {
            cernido: 0,
            sellado: 0,
            envasado: 0,
            etiquetado: 0,
            total: 0
        };
    }

    const procesoNormalizado = normalizeText(proceso) || 'ninguno';

    const sellado = redondear(cantidadTerminados * (Number(regla.sellado) || 0));
    const envasado = redondear(cantidadTerminados * (Number(regla.envasado) || 0));
    const etiquetado = redondear(cantidadTerminados * (Number(regla.etiquetado) || 0));

    let cernido = 0;
    if (procesoNormalizado === 'cernido') {
        const ingredienteKg = obtenerIngredienteKg(productoDetalle);
        if (ingredienteKg) {
            const cantidadGramos = obtenerCantidadEnGramos(ingredienteKg);

            let valorCernido = Number(regla.cernido) || 0;
            if (valorCernido > 0 && Math.abs(valorCernido) < 10) {
                valorCernido *= 1000;
            }

            const pesoFinal = cantidadGramos * cantidadTerminados;
            cernido = redondear((pesoFinal * valorCernido * 5) / 1_000_000);
        }
    }

    const total = redondear(cernido + sellado + envasado + etiquetado);

    return {
        cernido,
        sellado,
        envasado,
        etiquetado,
        total
    };
};

const formatNumber = (value, maxDecimals = 2) => {
    if (!Number.isFinite(value)) return '';
    const fixed = value.toFixed(maxDecimals);
    if (!fixed.includes('.')) {
        return fixed;
    }
    const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');
    return trimmed === '' ? '0' : trimmed;
};

export const formatGramajeDisplay = (value) => {
    const grams = normalizeToGrams(value);
    if (grams === null) return '--';

    if (Math.abs(grams) >= 1000) {
        const kg = grams / 1000;
        return `${formatNumber(kg, 3)} kg`;
    }

    return `${formatNumber(grams, 2)} g`;
};

