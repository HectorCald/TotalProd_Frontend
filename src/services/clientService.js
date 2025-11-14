import API_CONFIG from '../config/api';
import { OFFLINE_NETWORK_FLAG } from '../utils/offlineNetworkInterceptor';
import { obtenerLocal, OFFLINE_DB_NAME, CLIENTES_STORE } from '../utils/indexedDB';

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
    return parsed.id;
  }
  return null;
};

class clientService {

  static shouldUseOffline() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    try {
      return localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true';
    } catch {
      return false;
    }
  }

  static async getOfflineClients() {
    try {
      const cached = await obtenerLocal(CLIENTES_STORE, OFFLINE_DB_NAME);
      if (Array.isArray(cached) && cached.length > 0) {
        return {
          success: true,
          data: cached,
          offline: true
        };
      }
    } catch (error) {
      console.warn('No se pudo obtener clientes offline:', error);
    }
    return null;
  }

  // Obtener todos los clientes de una sucursal
  static async getAll() {
    try {
      if (clientService.shouldUseOffline()) {
        const offlineData = await clientService.getOfflineClients();
        if (offlineData) {
          return offlineData;
        }
      }

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

      const response = await fetch(`${API_BASE_URL}/clients?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      // Si la respuesta no es exitosa, crear un error con toda la información
      if (!response.ok) {
        const error = new Error(data.message || 'Error en la petición');
        error.status = response.status;
        error.code = data.code;
        error.currentPlan = data.currentPlan;
        error.requiredModule = data.requiredModule;
        throw error;
      }
      
      return data;

    } catch (error) {
      console.error('Error en getAll:', error);
      // Re-lanzar el error para que SWR lo capture correctamente
      throw error;
    }
  }

  // Crear un cliente
  static async create(clientData) {
    try {
      const sucuId = getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...clientData,
          sucu_id: sucuId
        }),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en create:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }


  // Eliminar un cliente
  static async delete(id) {
    try {

      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
        }),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en delete:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }


  // Actualizar un cliente
  static async update(id, clientData) {
    try {


      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...clientData,
        }),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en update:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
}

export default clientService;
