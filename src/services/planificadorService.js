import apiClient from '../config/apiClient';

class planificadorService {

  static async _request(endpoint, options = {}, config = {}) {
    const {
      requireEmpresaId = true,
      returnErrorObject = false,
      throwOnError = false,
      defaultData = undefined
    } = config;

    try {
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
      if (throwOnError) throw error;

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

  // Obtener tareas del mes indicado
  static async getAll(year, month) {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    return planificadorService._request(`/planificador?${params}`, { method: 'GET' }, {
      throwOnError: true
    });
  }

  // Obtener tarea por ID
  static async getById(id) {
    return planificadorService._request(`/planificador/${id}`, { method: 'GET' }, {
      throwOnError: true
    });
  }

  // Obtener tareas por estado (opcionalmente filtradas por responsableId)
  static async getByEstado(estado, responsableId = null) {
    const params = new URLSearchParams();
    if (responsableId) params.append('responsable_id', String(responsableId));
    const query = params.toString() ? `?${params.toString()}` : '';
    return planificadorService._request(`/planificador/estado/${encodeURIComponent(estado)}${query}`, { method: 'GET' }, {
      throwOnError: true
    });
  }

  // Obtener tareas por responsable y estado
  static async getByIdEstado(responsableId, estado = 'Pendiente') {
    return planificadorService.getByEstado(estado, responsableId);
  }

  // Crear tarea
  static async create(tareaData) {
    return planificadorService._request('/planificador', {
      method: 'POST',
      body: JSON.stringify(tareaData)
    }, {
      returnErrorObject: true
    });
  }

  // Actualizar tarea completa
  static async update(id, tareaData) {
    return planificadorService._request(`/planificador/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tareaData)
    }, {
      returnErrorObject: true
    });
  }

  // Actualizar solo el estado
  static async updateEstado(id, estado) {
    return planificadorService._request(`/planificador/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado })
    }, {
      returnErrorObject: true
    });
  }

  // Eliminar tarea
  static async delete(id) {
    return planificadorService._request(`/planificador/${id}`, {
      method: 'DELETE'
    }, {
      returnErrorObject: true
    });
  }
}

export default planificadorService;

