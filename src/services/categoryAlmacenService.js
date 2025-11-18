import API_CONFIG from '../config/api';
import { OFFLINE_NETWORK_FLAG } from '../utils/offlineNetworkInterceptor';
import { obtenerLocal, OFFLINE_DB_NAME, CATEGORIAS_STORE } from '../utils/indexedDB';

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


const shouldUseOffline = () => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  try {
    return localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true';
  } catch {
    return false;
  }
};

const getOfflineCategories = async () => {
  try {
    const cached = await obtenerLocal(CATEGORIAS_STORE, OFFLINE_DB_NAME);
    if (Array.isArray(cached) && cached.length > 0) {
      return {
        success: true,
        data: cached,
        offline: true
      };
    }
  } catch (error) {
    console.warn('No se pudo obtener categorías offline:', error);
  }
  return null;
};

class categoryAlmacenService {

  // Obtener todas las categorías
  static async getAll() {
    try {
      if (shouldUseOffline()) {
        const offlineData = await getOfflineCategories();
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

      const params = new URLSearchParams({
        empresa_id: empresaId
      });

      // Agregar empresas asociadas si existen
      if (empresasAsociadasIds && Array.isArray(empresasAsociadasIds) && empresasAsociadasIds.length > 0) {
        empresasAsociadasIds.forEach(id => {
          params.append('empresas_asociadas', id);
        });
      }

      const response = await fetch(`${API_BASE_URL}/category-almacen?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener categorías');
      }

      return data;
    } catch (error) {
      console.error('Error en categoryAlmacenService.getAll:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Crear una categoría
  static async create(categoryData) {
    try {
      const empresaId = getEmpresaId();
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      const response = await fetch(`${API_BASE_URL}/category-almacen`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...categoryData,
          empresa_id: empresaId
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear categoría');
      }

      return data;
    } catch (error) {
      console.error('Error en categoryAlmacenService.create:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar una categoría
  static async update(id, categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/category-almacen/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar categoría');
      }

      return data;
    } catch (error) {
      console.error('Error en categoryAlmacenService.update:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Eliminar una categoría
  static async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/category-almacen/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar categoría');
      }

      return data;
    } catch (error) {
      console.error('Error en categoryAlmacenService.delete:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }
}

export default categoryAlmacenService;
