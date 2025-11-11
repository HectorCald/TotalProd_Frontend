import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

const getEmpresaId = () => {
    const empresaIdStorage = localStorage.getItem('empresa_id');
    if (empresaIdStorage) {
        return empresaIdStorage;
    }

    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
        try {
            const parsed = JSON.parse(sucursalSeleccionada);
            return parsed.empresas?.id || parsed.empresa_id || null;
        } catch (error) {
            console.error('Error parseando sucursalSeleccionada:', error);
        }
    }

    return null;
};

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
    static async create(payload) {
        try {
            const empresaId = getEmpresaId();

            if (!empresaId) {
                return {
                    success: false,
                    message: 'No hay empresa seleccionada'
                };
            }

            const dataToSend = {
                ...payload,
                empresa_id: empresaId
            };

            const response = await fetch(`${API_BASE_URL}/pagos-damabrava`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar el pago.');
            }

            return {
                success: true,
                data: normalizePago(data.data)
            };
        } catch (error) {
            console.error('Error creando pago Damabrava:', error);
            return {
                success: false,
                message: error.message || 'Error al registrar el pago.'
            };
        }
    }

    static async getAll({ page = 1, limit = 30, estado = 'todos', responsableId = null, search = '' } = {}) {
        try {
            const empresaId = getEmpresaId();

            if (!empresaId) {
                return {
                    success: false,
                    message: 'No hay empresa seleccionada'
                };
            }

            const params = new URLSearchParams({
                empresa_id: empresaId,
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

            const response = await fetch(`${API_BASE_URL}/pagos-damabrava?${params.toString()}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener los pagos.');
            }

            return {
                ...data,
                data: normalizeListaPagos(data.data)
            };
        } catch (error) {
            console.error('Error obteniendo pagos Damabrava:', error);
            return {
                success: false,
                message: error.message || 'Error al obtener los pagos.'
            };
        }
    }

    static async getById(id) {
        try {
            if (!id) {
                return {
                    success: false,
                    message: 'ID del pago es requerido'
                };
            }

            const response = await fetch(`${API_BASE_URL}/pagos-damabrava/${id}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener el pago.');
            }

            return {
                ...data,
                data: normalizePago(data.data)
            };
        } catch (error) {
            console.error('Error obteniendo pago Damabrava:', error);
            return {
                success: false,
                message: error.message || 'Error al obtener el pago.'
            };
        }
    }

    static async getRegistros(id) {
        try {
            if (!id) {
                return {
                    success: false,
                    message: 'ID del pago es requerido'
                };
            }

            const response = await fetch(`${API_BASE_URL}/pagos-damabrava/${id}/registros`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[pagosDamabravaService.getRegistros] Respuesta no OK:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: data
                });
                throw new Error(data.message || 'Error al obtener los registros asociados.');
            }

            console.log('[pagosDamabravaService.getRegistros] Registros obtenidos correctamente:', data);
            return data;
        } catch (error) {
            console.error('Error obteniendo registros asociados del pago Damabrava:', error);
            return {
                success: false,
                message: error.message || 'Error al obtener los registros asociados.'
            };
        }
    }

    static async updateEstado(id, estado) {
        try {
            if (!id) {
                return {
                    success: false,
                    message: 'ID del pago es requerido'
                };
            }

            const response = await fetch(`${API_BASE_URL}/pagos-damabrava/${id}/estado`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ estado })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar el estado.');
            }

            return data;
        } catch (error) {
            console.error('Error actualizando estado de pago Damabrava:', error);
            return {
                success: false,
                message: error.message || 'Error al actualizar el estado del pago.'
            };
        }
    }

    static async delete(id) {
        try {
            if (!id) {
                return {
                    success: false,
                    message: 'ID del pago es requerido'
                };
            }

            const response = await fetch(`${API_BASE_URL}/pagos-damabrava/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar el pago.');
            }

            return data;
        } catch (error) {
            console.error('Error eliminando pago Damabrava:', error);
            return {
                success: false,
                message: error.message || 'Error al eliminar el pago.'
            };
        }
    }
}

export default pagosDamabravaService;

