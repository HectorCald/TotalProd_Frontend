import API_CONFIG from '../config/api';
import { OFFLINE_NETWORK_FLAG } from '../utils/offlineNetworkInterceptor';
import { obtenerLocal, OFFLINE_DB_NAME, PRECIOS_STORE } from '../utils/indexedDB';

const API_BASE_URL = API_CONFIG.getBaseURL();

// Función helper para obtener el token de autorización
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Función helper para obtener empresa_id
const getEmpresaId = () => {
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    const parsed = JSON.parse(sucursalSeleccionada);
    return parsed.empresas?.id;
  }
  return null;
};

// Función helper para obtener IDs de empresas favoritas
const getEmpresasAsociadasIds = () => {
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
};

// Función helper para obtener sucursal_id
const getSucursalId = () => {
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    const parsed = JSON.parse(sucursalSeleccionada);
    return parsed.id;
  }
  return null;
};

const shouldUseOffline = () => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  try {
    return localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true';
  } catch {
    return false;
  }
};

const getOfflinePrices = async () => {
  try {
    const cached = await obtenerLocal(PRECIOS_STORE, OFFLINE_DB_NAME);
    if (Array.isArray(cached) && cached.length > 0) {
      return {
        success: true,
        data: cached,
        offline: true
      };
    }
  } catch (error) {
    console.warn('No se pudo obtener tipos de precios offline:', error);
  }
  return null;
};

class pricesTypesService {

  // Obtener todos los tipos de precios
  static async getAll() {
    try {
      if (shouldUseOffline()) {
        const offlineData = await getOfflinePrices();
        if (offlineData) {
          return offlineData;
        }
      }

      const empresaId = getEmpresaId();
      const empresasAsociadasIds = getEmpresasAsociadasIds();
      
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      const sucursalId = getSucursalId();
      const params = new URLSearchParams({
        empresa_id: empresaId
      });

      if (sucursalId) {
        params.append('sucursal_id', sucursalId);
      }

      // Agregar empresas asociadas si existen
      if (empresasAsociadasIds && Array.isArray(empresasAsociadasIds) && empresasAsociadasIds.length > 0) {
        empresasAsociadasIds.forEach(id => {
          params.append('empresas_asociadas', id);
        });
      }

      const response = await fetch(`${API_BASE_URL}/prices-types?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        // Si es un error de módulo, devolver la respuesta completa para que el frontend la maneje
        if (data.code === 'MODULE_NOT_INCLUDED' || data.code === 'NO_PLAN') {
          return data;
        }
        throw new Error(data.message || 'Error al obtener tipos de precios');
      }

      return data;
    } catch (error) {
      console.error('Error en pricesTypesService.getAll:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Crear un tipo de precio
  static async create(priceTypeData) {
    try {
      const empresaId = getEmpresaId();
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      const response = await fetch(`${API_BASE_URL}/prices-types`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...priceTypeData,
          empresa_id: empresaId
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear tipo de precio');
      }

      return data;
    } catch (error) {
      console.error('Error en pricesTypesService.create:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar un tipo de precio
  static async update(id, priceTypeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/prices-types/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(priceTypeData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar tipo de precio');
      }

      return data;
    } catch (error) {
      console.error('Error en pricesTypesService.update:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Eliminar un tipo de precio
  static async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/prices-types/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar tipo de precio');
      }

      return data;
    } catch (error) {
      console.error('Error en pricesTypesService.delete:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }
}

export default pricesTypesService;
