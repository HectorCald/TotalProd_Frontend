import apiClient, { getEmpresaId } from '../config/apiClient';

const parseMonto = (value) => {
    const numero = Number(value);
    return Number.isNaN(numero) ? 0 : numero;
};

const normalizePago = (pago) => {
    if (!pago || typeof pago !== 'object') {
        return pago;
    }

    const extras = parseMonto(pago.extras);
    const descuento = parseMonto(pago.descuento);
    const aumento = parseMonto(pago.aumento);
    const totalProduccion = parseMonto(pago.total);
    const totalConAjustes = totalProduccion + extras + aumento - descuento;

    return {
        ...pago,
        extras,
        descuento,
        aumento,
        total: totalProduccion,
        total_produccion: totalProduccion,
        total_con_ajustes: totalConAjustes
    };
};

const normalizeListaPagos = (pagos) => Array.isArray(pagos) ? pagos.map(normalizePago) : [];

class pagosDamabravaService {
    static async _request(endpoint, options = {}, config = {}) {
        const {
            requireEmpresaId = false,
            returnErrorObject = false,
            throwOnError = false,
            defaultData = undefined
        } = config;

        try {
            if (requireEmpresaId) {
                const empresaId = getEmpresaId();
                if (!empresaId) {
                    return {
                        success: false,
                        message: 'No hay empresa seleccionada',
                        ...(defaultData !== undefined ? { data: defaultData } : {})
                    };
                }
            }

            const response = await apiClient.request(endpoint, options, false, requireEmpresaId);
            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'Error en la petición');
                error.status = response.status;
                error.code = data.code;
                throw error;
            }

            return data;
        } catch (error) {
            if (throwOnError) {
                throw error;
            }
            if (returnErrorObject) {
                return {
                    success: false,
                    message: error.message || 'Error de conexión con el servidor',
                    ...(defaultData !== undefined ? { data: defaultData } : {})
                };
            }
            return null;
        }
    }

    static async create(payload) {
        const result = await pagosDamabravaService._request('/pagos-damabrava', {
            method: 'POST',
            body: JSON.stringify(payload)
        }, {
            requireEmpresaId: true,
            returnErrorObject: true
        });

        if (result && result.success) {
            return {
                success: true,
                data: normalizePago(result.data)
            };
        }
        return result || { success: false, message: 'Error al registrar el pago.' };
    }

    static async getAll({ page = 1, limit = 30, estado = 'todos', responsableId = null, search = '' } = {}) {
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit)
        });

        if (estado && estado !== 'todos') {
            params.append('estado', estado);
        }

        if (responsableId) {
            params.append('responsable_id', responsableId);
        }

        if (search && search.trim() !== '') {
            params.append('search', search.trim());
        }

        const result = await pagosDamabravaService._request(`/pagos-damabrava?${params.toString()}`, {
            method: 'GET'
        }, {
            requireEmpresaId: true,
            returnErrorObject: true
        });

        if (result && result.success) {
            return {
                ...result,
                data: normalizeListaPagos(result.data)
            };
        }
        return result || { success: false, message: 'Error al obtener los pagos.' };
    }

    static async getById(id) {
        if (!id) {
            return {
                success: false,
                message: 'ID del pago es requerido'
            };
        }

        const result = await pagosDamabravaService._request(`/pagos-damabrava/${id}`, {
            method: 'GET'
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });

        if (result && result.success) {
            return {
                ...result,
                data: normalizePago(result.data)
            };
        }
        return result || { success: false, message: 'Error al obtener el pago.' };
    }

    static async getRegistros(id) {
        if (!id) {
            return {
                success: false,
                message: 'ID del pago es requerido'
            };
        }

        const result = await pagosDamabravaService._request(`/pagos-damabrava/${id}/registros`, {
            method: 'GET'
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });

        return result || { success: false, message: 'Error al obtener los registros asociados.' };
    }

    static async updateEstado(id, estado) {
        if (!id) {
            return {
                success: false,
                message: 'ID del pago es requerido'
            };
        }

        const result = await pagosDamabravaService._request(`/pagos-damabrava/${id}/estado`, {
            method: 'PUT',
            body: JSON.stringify({ estado })
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });

        return result || { success: false, message: 'Error al actualizar el estado del pago.' };
    }

    static async delete(id) {
        if (!id) {
            return {
                success: false,
                message: 'ID del pago es requerido'
            };
        }

        const result = await pagosDamabravaService._request(`/pagos-damabrava/${id}`, {
            method: 'DELETE'
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });

        return result || { success: false, message: 'Error al eliminar el pago.' };
    }
}

export default pagosDamabravaService;

