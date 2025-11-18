import API_CONFIG from '../config/api';
import { OFFLINE_NETWORK_FLAG } from '../utils/offlineNetworkInterceptor';
import { obtenerLocal, OFFLINE_DB_NAME, PRODUCTOS_STORE } from '../utils/indexedDB';

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
// Función helper para obtener sucu_id
const getSucuId = () => {
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    const parsed = JSON.parse(sucursalSeleccionada);
    // Si la sucursal usa el almacén de otra sucursal, usar ese ID; si no, usar su propio ID
    return parsed.almacen_sucursal_id || parsed.id;
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

const getOfflineProducts = async () => {
  try {
    const cachedProducts = await obtenerLocal(PRODUCTOS_STORE, OFFLINE_DB_NAME);
    if (Array.isArray(cachedProducts) && cachedProducts.length > 0) {
      return {
        success: true,
        data: cachedProducts,
        offline: true
      };
    }
  } catch (error) {
    console.warn('No se pudo obtener productos offline:', error);
  }
  return null;
};

class productsAlmacenService {

  // Obtener todos los productos
  static async getAll() {
    try {
      if (shouldUseOffline()) {
        const offlineData = await getOfflineProducts();
        if (offlineData) {
          return offlineData;
        }
      }

      const empresaId = getEmpresaId();
      const sucuId = getSucuId();
      const empresasAsociadasIds = getEmpresasAsociadasIds();
      
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const params = new URLSearchParams({
        empresa_id: empresaId,
        sucu_id: sucuId
      });

      // Agregar empresas asociadas si existen
      if (empresasAsociadasIds && Array.isArray(empresasAsociadasIds) && empresasAsociadasIds.length > 0) {
        empresasAsociadasIds.forEach(id => {
          params.append('empresas_asociadas', id);
        });
      }

      const response = await fetch(`${API_BASE_URL}/products-almacen?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener productos');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.getAll:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener productos por empresa_id específico (para catálogo de empresas asociadas)
  static async getByEmpresaId(empresaIdParam) {
    try {
      if (!empresaIdParam) {
        return {
          success: false,
          message: 'ID de la empresa es requerido'
        };
      }

      // El backend requiere sucu_id, pero solo lo usa para el stock
      // Usamos el sucu_id actual para cumplir con el requerimiento
      const sucuId = getSucuId();
      
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const params = new URLSearchParams({
        empresa_id: empresaIdParam,
        sucu_id: sucuId
      });

      const response = await fetch(`${API_BASE_URL}/products-almacen?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener productos');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.getByEmpresaId:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener productos ligeros (solo id y name) para formularios de producción
  static async getAllForProduction() {
    try {
      const empresaId = getEmpresaId();
      
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      const params = new URLSearchParams({
        empresa_id: empresaId
      });

      const response = await fetch(`${API_BASE_URL}/products-almacen/for-production?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener productos');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.getAllForProduction:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener un producto por ID
  static async getById(id) {
    try {
      const sucuId = getSucuId();
      
      if (!id) {
        return {
          success: false,
          message: 'ID del producto es requerido'
        };
      }

      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const params = new URLSearchParams({
        sucu_id: sucuId
      });

      const response = await fetch(`${API_BASE_URL}/products-almacen/${id}?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener el producto');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.getById:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Crear un producto
  static async create(productData) {
    try {
      const empresaId = getEmpresaId();
      const sucuId = getSucuId();
      
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const response = await fetch(`${API_BASE_URL}/products-almacen`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...productData,
          empresa_id: empresaId,
          sucu_id: sucuId
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear producto');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.create:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar un producto
  static async update(id, productData) {
    try {
      const sucuId = getSucuId();
      
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const response = await fetch(`${API_BASE_URL}/products-almacen/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...productData,
          sucu_id: sucuId
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar producto');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.update:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Eliminar un producto
  static async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products-almacen/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar producto');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.delete:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar múltiples productos en lote (para importación)
  static async bulkUpdate(productosData) {
    try {
      const empresaId = getEmpresaId();
      const sucuId = getSucuId();
      
      if (!empresaId) {
        return {
          success: false,
          message: 'ID de la empresa no encontrado'
        };
      }

      if (!sucuId) {
        return {
          success: false,
          message: 'ID de la sucursal no encontrado'
        };
      }

      const response = await fetch(`${API_BASE_URL}/products-almacen/bulk-update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productosData,
          empresa_id: empresaId,
          sucu_id: sucuId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al actualizar productos'
        };
      }

      return data;
    } catch (error) {
      console.error('Error en bulkUpdate:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Crear múltiples productos en lote (para plantillas)
  static async bulkCreate(productosData) {
    try {
      const empresaId = getEmpresaId();
      const sucuId = getSucuId();
      
      if (!empresaId) {
        return {
          success: false,
          message: 'ID de la empresa no encontrado'
        };
      }

      if (!sucuId) {
        return {
          success: false,
          message: 'ID de la sucursal no encontrado'
        };
      }

      const response = await fetch(`${API_BASE_URL}/products-almacen/bulk-create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productosData,
          empresa_id: empresaId,
          sucu_id: sucuId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al crear productos'
        };
      }

      return data;
    } catch (error) {
      console.error('Error en bulkCreate:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener productos con recetas por IDs (para reportes)
  static async getByIdsWithRecipes(productIds) {
    try {
      const empresaId = getEmpresaId();
      const sucuId = getSucuId();
      
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return {
          success: false,
          message: 'IDs de productos son requeridos'
        };
      }

      // Enviar IDs como cadena separada por comas para evitar problemas con el parser de Express
      const idsString = productIds.join(',');
      
      const params = new URLSearchParams({
        empresa_id: empresaId,
        sucu_id: sucuId,
        with_recipes: 'true',
        ids: idsString
      });

      const response = await fetch(`${API_BASE_URL}/products-almacen/by-ids?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener productos con recetas');
      }

      return data;
    } catch (error) {
      console.error('Error en getByIdsWithRecipes:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }
}

export default productsAlmacenService;
