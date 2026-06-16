import apiClient from '../config/apiClient';

class typeMeasureService {

  static async _request(endpoint, options = {}, config = {}) {
    const {
      requireSucuId = false,
      requireEmpresaId = false,
      returnErrorObject = false,
      throwOnError = false,
      defaultData = undefined
    } = config;

    try {
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

  // Obtener todos los tipos de medida
  static async getAll() {
    return typeMeasureService._request('/type-measures', {
      method: 'GET'
    });
  }
}

export default typeMeasureService;
