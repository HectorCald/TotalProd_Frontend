import apiClient, { getEmpresaId } from '../config/apiClient';

// Función helper para obtener el id de la sucursal "Casa Matriz" de la empresa
const getCasaMatrizId = async (empresaId) => {
    try {
        if (!empresaId) return null;
        const response = await sucursalesService.getAll(empresaId);
        if (response.success && response.data) {
            const lista = response.data || [];
            const casaMatriz = lista.find(s => (s.name || '').trim() === 'Casa Matriz');
            return casaMatriz ? casaMatriz.id : null;
        }
        return null;
    } catch (e) {
        console.error('Error obteniendo Casa Matriz:', e);
        return null;
    }
};

class sucursalesService {

    static getEmpresaId() {
        return getEmpresaId();
    }

    static getEmpresasAsociadasIds() {
        try {
            const FAVORITES_KEY = 'empresas_favoritas';
            const stored = localStorage.getItem(FAVORITES_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                const favorites = Array.isArray(parsed) ? parsed : [];
                return favorites.map(empresa => empresa.id).filter(id => id);
            }
            return [];
        } catch (error) {
            console.error('Error al obtener empresas favoritas:', error);
            return [];
        }
    }

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
                if (data.code === 'MODULE_NOT_INCLUDED' || data.code === 'NO_PLAN') {
                    return data;
                }

                const error = new Error(data.message || 'Error en la petición');
                error.status = response.status;
                error.code = data.code;
                error.currentPlan = data.currentPlan;
                error.requiredModule = data.requiredModule;
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
            
            return {
                success: false,
                message: error.message || 'Error de conexión con el servidor'
            };
        }
    }

    // Mantener nombre getByEmpresaId por compatibilidad
    static async getByEmpresaId(empresaIdParam = null) {
        return this.getAll(empresaIdParam);
    }

    static async getAll(empresaIdParam = null) {
        let endpoint = '/sucursales';
        const empresasAsociadasIds = this.getEmpresasAsociadasIds();

        const params = new URLSearchParams();
        if (empresasAsociadasIds && Array.isArray(empresasAsociadasIds) && empresasAsociadasIds.length > 0) {
            empresasAsociadasIds.forEach(id => {
                params.append('empresas_asociadas', id);
            });
        }

        if (empresaIdParam) {
            params.append('empresa_id', empresaIdParam);
            if (params.toString()) {
                endpoint += `?${params.toString()}`;
            }
            return sucursalesService._request(endpoint, { method: 'GET' }, {
                requireEmpresaId: false
            });
        }

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        return sucursalesService._request(endpoint, { method: 'GET' }, {
            requireEmpresaId: true
        });
    }

    static async getById(id) {
        return sucursalesService._request(`/sucursales/${id}`, { method: 'GET' }, {
            requireEmpresaId: false
        });
    }

    static async create(sucursalData) {
        const empresaId = sucursalData.empresa_id || getEmpresaId();
        const shouldUseAlmacenSucursal = (sucursalData && typeof sucursalData.almacenSeparado === 'boolean') ? !sucursalData.almacenSeparado : false;
        const casaMatrizId = shouldUseAlmacenSucursal ? await getCasaMatrizId(empresaId) : null;
        const { almacenSeparado, precios, ...payload } = sucursalData;

        const bodyData = {
            ...payload,
            empresa_id: empresaId,
            ...(casaMatrizId ? { almacen_sucursal_id: casaMatrizId } : {}),
            ...(precios && Array.isArray(precios) ? { precios } : {})
        };
        
        return sucursalesService._request('/sucursales', {
            method: 'POST',
            body: JSON.stringify(bodyData)
        }, {
            requireEmpresaId: true,
            returnErrorObject: true
        });
    }

    static async update(id, sucursalData) {
        const hasFlag = sucursalData && typeof sucursalData.almacenSeparado === 'boolean';
        const shouldUseAlmacenSucursal = hasFlag ? !sucursalData.almacenSeparado : false;
        const empresaId = getEmpresaId();
        const casaMatrizId = shouldUseAlmacenSucursal ? await getCasaMatrizId(empresaId) : null;
        const { almacenSeparado, precios, ...payload } = sucursalData;
        
        const preciosArray = Array.isArray(precios) ? precios : [];
        
        const bodyData = {
            ...payload,
            ...(hasFlag ? { almacen_sucursal_id: casaMatrizId } : {}),
            precios: preciosArray
        };

        return sucursalesService._request(`/sucursales/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bodyData)
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
    }

    static async delete(id) {
        return sucursalesService._request(`/sucursales/${id}`, {
            method: 'DELETE'
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
    }

    static async getPreciosBySucursalId(sucursalId) {
        return sucursalesService._request(`/sucursales/${sucursalId}/precios`, { method: 'GET' }, {
            requireEmpresaId: false
        });
    }
}

export default sucursalesService;
