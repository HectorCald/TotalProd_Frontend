import apiClient, { getSucuId, getEmpresaId } from '../config/apiClient';

class reglasProduccionDamabravaService {

    static async _request(endpoint, options = {}, config = {}) {
        const {
            requireSucuId = false,
            requireEmpresaId = false,
            returnErrorObject = false,
            throwOnError = false,
            defaultData = undefined
        } = config;

        try {
            if (requireSucuId) {
                const sucuId = getSucuId();
                if (!sucuId) {
                    return {
                        success: false,
                        message: 'No hay sucursal seleccionada',
                        ...(defaultData !== undefined ? { data: defaultData } : {})
                    };
                }
            }

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

            const response = await apiClient.request(endpoint, options, requireSucuId, requireEmpresaId);
            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.message || 'Error en la petición';
                const error = new Error(errorMessage);
                error.status = response.status;
                error.code = data.code;
                error.currentPlan = data.currentPlan;
                error.requiredModule = data.requiredModule;
                throw error;
            }

            return data;
        } catch (error) {
            if (throwOnError || error.status === 403) {
                throw error;
            }
            
            if (returnErrorObject) {
                return {
                    success: false,
                    message: error.message || 'Error de conexión con el servidor',
                    ...(defaultData !== undefined ? { data: defaultData } : {})
                };
            }
            
            return { success: false, message: error.message || 'Error de conexión con el servidor' };
        }
    }

    static async create(reglaData) {
        return reglasProduccionDamabravaService._request('/reglas-produccion-damabrava', {
            method: 'POST',
            body: JSON.stringify(reglaData)
        }, {
            requireEmpresaId: true
        });
    }

    static async getAll(_forceReload = null) {
        return reglasProduccionDamabravaService._request('/reglas-produccion-damabrava', {
            method: 'GET'
        }, {
            requireEmpresaId: true
        });
    }

    static async delete(reglaId) {
        if (!reglaId) {
            return {
                success: false,
                message: 'El identificador de la regla es obligatorio'
            };
        }

        return reglasProduccionDamabravaService._request(`/reglas-produccion-damabrava/${reglaId}`, {
            method: 'DELETE'
        });
    }
}

export default reglasProduccionDamabravaService;

