import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

// Función helper para obtener el token de autorización
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Función helper para obtener sucu_id
const getSucuId = () => {
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    const parsed = JSON.parse(sucursalSeleccionada);
    // Usar el almacén compartido si existe; si no, la sucursal actual
    return parsed.almacen_sucursal_id || parsed.id;
  }
  return null;
};

// Función helper para obtener personal_id del token
const getPersonalId = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }
  return null;
};

class cotizacionesService {

  // Obtener una cotización por ID
  static async getById(cotizacionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/cotizaciones/${cotizacionId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener la cotización');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error obteniendo cotización:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener la cotización'
      };
    }
  }

  // Obtener todas las cotizaciones de una sucursal
  static async getAll(filters = {}) {
    try {
      const sucuId = getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const params = new URLSearchParams({
        sucu_id: sucuId
      });

      const { fechaInicio = null, fechaFin = null } = filters || {};
      if (fechaInicio) {
        params.append('fecha_inicio', fechaInicio);
      }
      if (fechaFin) {
        params.append('fecha_fin', fechaFin);
      }

      const response = await fetch(`${API_BASE_URL}/cotizaciones?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Error al obtener las cotizaciones');
        error.status = response.status;
        error.code = data.code;
        error.currentPlan = data.currentPlan;
        error.requiredModule = data.requiredModule;
        throw error;
      }

      return {
        success: true,
        data: data.data || []
      };
    } catch (error) {
      console.error('Error obteniendo cotizaciones:', error);
      // Re-lanzar el error para que el componente lo capture correctamente
      throw error;
    }
  }

  // Crear una nueva cotización
  static async create(cotizacionData) {
    try {
      const sucuId = getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      // Obtener personal_id si es un empleado
      const personalId = getPersonalId();

      const dataToSend = {
        ...cotizacionData,
        sucu_id: sucuId,
        personal_id: personalId
      };

      const response = await fetch(`${API_BASE_URL}/cotizaciones`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la cotización');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error creando cotización:', error);
      return {
        success: false,
        message: error.message || 'Error al crear la cotización'
      };
    }
  }

  // Actualizar estado de una cotización
  static async actualizarEstado(cotizacionId, estado) {
    try {
      const response = await fetch(`${API_BASE_URL}/cotizaciones/${cotizacionId}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la cotización');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error actualizando estado de cotización:', error);
      return {
        success: false,
        message: error.message || 'Error al actualizar la cotización'
      };
    }
  }

  // Eliminar una cotización
  static async eliminar(cotizacionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/cotizaciones/${cotizacionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar la cotización');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error eliminando cotización:', error);
      return {
        success: false,
        message: error.message || 'Error al eliminar la cotización'
      };
    }
  }
}

export default cotizacionesService;
