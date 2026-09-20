import apiClient, { getEmpresaId } from '../config/apiClient';

class cargosService {
  static getEmpresaId() {
    return getEmpresaId();
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

      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener todos los cargos
  static async getAll(empresaIdParam = null) {
    let endpoint = '/cargos';
    if (empresaIdParam) {
      endpoint += `?empresa_id=${empresaIdParam}`;
      return cargosService._request(endpoint, { method: 'GET' }, {
        requireEmpresaId: false
      });
    }

    return cargosService._request(endpoint, { method: 'GET' }, {
      requireEmpresaId: true
    });
  }

  // Crear un cargo
  static async create(cargoData) {
    const empresaId = cargoData.empresa_id || getEmpresaId();
    const bodyData = { ...cargoData, empresa_id: empresaId };

    return cargosService._request('/cargos', {
      method: 'POST',
      body: JSON.stringify(bodyData)
    }, {
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Actualizar un cargo
  static async update(id, cargoData) {
    return cargosService._request(`/cargos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cargoData)
    }, {
      returnErrorObject: true
    });
  }

  // Eliminar un cargo
  static async delete(id) {
    return cargosService._request(`/cargos/${id}`, {
      method: 'DELETE'
    }, {
      returnErrorObject: true
    });
  }
}

export default cargosService;