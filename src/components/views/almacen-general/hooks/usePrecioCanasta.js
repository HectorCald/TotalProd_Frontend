import { useCallback, useEffect } from 'react';
import useEntregaMovimientos from './useEntregaMovimientos';

/**
 * Hook genérico para manejar la lógica de precios en cualquier canasta
 * 
 * Maneja:
 * - Resolución de precio inicial según prioridad configurable
 * - Guardado automático del precio en localStorage (solo cuando no es temporal)
 * - Integración con entregas de pedidos (solo para salidas)
 * 
 * @param {Object} config - Configuración del hook
 * @param {string} config.tipoCanasta - Tipo de canasta: 'salida', 'pedido', 'cotizacion', 'entrada', 'transferencia'
 * @param {boolean} config.esEntrega - Si es una entrega de pedido (solo para salidas)
 * @param {boolean} config.isOpen - Si la canasta está abierta
 * @param {string|null} config.precioSeleccionado - Precio seleccionado actual
 * @param {boolean} config.isEditing - Si está editando (para pedidos)
 */
function usePrecioCanasta({
    tipoCanasta = 'salida', // 'salida', 'pedido', 'cotizacion', 'entrada', 'transferencia'
    esEntrega = false,
    isOpen = false,
    precioSeleccionado = null,
    isEditing = false,
} = {}) {
    // Configuración específica por tipo de canasta
    const config = {
        salida: {
            precioRepitiendoKey: 'precioIdRepitiendo',
            precioEditandoKey: 'precioIdEditando',
            precioEntregandoKey: 'precioIdEntregando',
            precioGuardadoKey: 'precioIdMovimientoGuardado',
            modoRepitiendoKey: 'movimientoAgrupadoRepitiendo',
            modoEditandoKey: 'movimientoAgrupadoEditando',
        },
        pedido: {
            precioRepitiendoKey: null,
            precioEditandoKey: 'precioIdEditando',
            precioEntregandoKey: null,
            precioGuardadoKey: null, // Los pedidos no guardan precio permanente
            modoRepitiendoKey: null,
            modoEditandoKey: 'pedidoAgrupadoEditando',
        },
        cotizacion: {
            precioRepitiendoKey: 'precioIdCotizacionRepitiendo',
            precioEditandoKey: null,
            precioEntregandoKey: null,
            precioGuardadoKey: null, // Las cotizaciones no guardan precio permanente
            modoRepitiendoKey: 'cotizacionAgrupadoRepitiendo',
            modoEditandoKey: null,
        },
        entrada: {
            precioRepitiendoKey: 'precioIdRepitiendo',
            precioEditandoKey: 'precioIdEditando',
            precioEntregandoKey: null,
            precioGuardadoKey: null, // Las entradas no guardan precio permanente por ahora
            modoRepitiendoKey: 'movimientoAgrupadoRepitiendo',
            modoEditandoKey: 'movimientoAgrupadoEditando',
        },
        transferencia: {
            precioRepitiendoKey: 'precioIdTransferenciaRepitiendo',
            precioEditandoKey: null,
            precioEntregandoKey: null,
            precioGuardadoKey: null, // Las transferencias no guardan precio permanente
            modoRepitiendoKey: 'transferenciaAgrupadoRepitiendo',
            modoEditandoKey: null,
        },
    };

    const tipoConfig = config[tipoCanasta] || config.salida;

    // Solo usar useEntregaMovimientos para salidas
    const {
        precioIdEntregando,
        modoAgrupacionEntregando,
        applyEntregaPrecioInicial,
    } = useEntregaMovimientos({
        esEntrega: tipoCanasta === 'salida' && esEntrega,
        isOpen: tipoCanasta === 'salida' && isOpen
    });

    /**
     * Resuelve el precio inicial según la prioridad configurada para cada tipo de canasta
     */
    const resolvePrecioInicial = useCallback((tipos) => {
        if (!tipos || tipos.length === 0) return null;

        // Si es entrega de salida, primero intentar usar el precio de entrega
        if (tipoCanasta === 'salida' && esEntrega) {
            const precioEntrega = applyEntregaPrecioInicial(tipos);
            if (precioEntrega) {
                return precioEntrega;
            }
        }

        // 1. Primero buscar precio de repetir/editando (prioridad más alta)
        let precioIdRepitiendo = null;
        if (tipoConfig.precioRepitiendoKey) {
            precioIdRepitiendo = localStorage.getItem(tipoConfig.precioRepitiendoKey);
        }
        if (tipoConfig.precioEditandoKey && isEditing) {
            const precioEditando = localStorage.getItem(tipoConfig.precioEditandoKey);
            if (precioEditando) {
                precioIdRepitiendo = precioEditando;
            }
        }
        if (precioIdRepitiendo && tipos.find(p => p.value === precioIdRepitiendo)) {
            return precioIdRepitiendo;
        }

        // 2. Luego buscar precio de entrega (solo para salidas)
        if (tipoCanasta === 'salida' && tipoConfig.precioEntregandoKey) {
            const precioIdEntregandoStorage = localStorage.getItem(tipoConfig.precioEntregandoKey);
            if (precioIdEntregandoStorage && tipos.find(p => p.value === precioIdEntregandoStorage)) {
                return precioIdEntregandoStorage;
            }
        }

        // 3. Luego buscar precio guardado permanentemente (solo para salidas)
        if (tipoConfig.precioGuardadoKey) {
            const precioIdGuardado = localStorage.getItem(tipoConfig.precioGuardadoKey);
            if (precioIdGuardado && tipos.find(p => p.value === precioIdGuardado)) {
                return precioIdGuardado;
            }
        }

        // 4. Por defecto, el primero disponible
        return tipos[0]?.value ?? null;
    }, [tipoCanasta, esEntrega, isEditing, tipoConfig, applyEntregaPrecioInicial]);

    /**
     * Resuelve el modo de agrupación inicial
     */
    const resolveModoInicial = useCallback(() => {
        // Si es entrega de salida, usar el modo de entrega
        if (tipoCanasta === 'salida' && esEntrega) {
            return modoAgrupacionEntregando || null;
        }

        // Buscar modo de repetir/editando según configuración
        let modoMovimiento = null;
        if (tipoConfig.modoRepitiendoKey) {
            modoMovimiento = localStorage.getItem(tipoConfig.modoRepitiendoKey);
        }
        if (tipoConfig.modoEditandoKey && isEditing) {
            const modoEditando = localStorage.getItem(tipoConfig.modoEditandoKey);
            if (modoEditando) {
                modoMovimiento = modoEditando;
            }
        }

        if (modoMovimiento === 'agrupado' || modoMovimiento === 'no_agrupado') {
            return modoMovimiento;
        }

        return null;
    }, [tipoCanasta, esEntrega, isEditing, tipoConfig, modoAgrupacionEntregando]);

    /**
     * Guarda el precio seleccionado en localStorage como permanente
     * Solo si NO es un precio temporal y solo para tipos que lo soportan (salidas)
     */
    useEffect(() => {
        // Solo guardar para salidas y si hay una clave de guardado configurada
        if (!tipoConfig.precioGuardadoKey) return;
        if (!precioSeleccionado) return;
        if (tipoCanasta === 'salida' && esEntrega) return; // No guardar en entregas

        // Verificar si hay un precio temporal activo
        const preciosTemporales = [];
        if (tipoConfig.precioRepitiendoKey) {
            const precioRepitiendo = localStorage.getItem(tipoConfig.precioRepitiendoKey);
            if (precioRepitiendo) preciosTemporales.push(precioRepitiendo);
        }
        if (tipoConfig.precioEditandoKey) {
            const precioEditando = localStorage.getItem(tipoConfig.precioEditandoKey);
            if (precioEditando) preciosTemporales.push(precioEditando);
        }
        if (tipoConfig.precioEntregandoKey) {
            const precioEntregando = localStorage.getItem(tipoConfig.precioEntregandoKey);
            if (precioEntregando) preciosTemporales.push(precioEntregando);
        }

        // Solo guardar como permanente si NO hay ningún precio temporal activo
        // y el precio seleccionado NO coincide con los temporales
        const hayPrecioTemporal = preciosTemporales.length > 0;
        const esPrecioTemporal = preciosTemporales.includes(precioSeleccionado);

        if (!hayPrecioTemporal && !esPrecioTemporal) {
            localStorage.setItem(tipoConfig.precioGuardadoKey, precioSeleccionado);
        }
    }, [precioSeleccionado, tipoCanasta, esEntrega, tipoConfig]);

    return {
        resolvePrecioInicial,
        resolveModoInicial,
        // Solo retornar estos valores para salidas
        ...(tipoCanasta === 'salida' ? {
            precioIdEntregando,
            modoAgrupacionEntregando,
        } : {}),
    };
}

export default usePrecioCanasta;

