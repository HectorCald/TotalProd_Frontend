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

class productsAlmacenService {

  // Obtener todos los productos
  static async getAll() {
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

      const params = new URLSearchParams({
        empresa_id: empresaId,
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
      console.error('Error en productsAlmacenService.getAll:', error);
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
