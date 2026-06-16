import apiClient from '../config/apiClient';

class productsAlmacenService {

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
        const error = new Error(data.message || 'Error en la petición');
        error.status = response.status;
        error.code = data.code;
        error.currentPlan = data.currentPlan;
        error.requiredModule = data.requiredModule;
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
      
      return null;
    }
  }

  // Obtener todos los productos
  static async getAll(page = 1, limit = 30, search = null, categoryId = null, sortOrder = null, ocultarStockCero = false) {
    const params = new URLSearchParams({
      page: page,
      limit: limit,
      ocultar_stock_cero: ocultarStockCero ? 'true' : 'false'
    });

    if (search) params.append('search', search);
    if (categoryId) params.append('category_id', categoryId);
    if (sortOrder) params.append('sort_order', sortOrder);

    // Obtener empresas favoritas de localStorage y enviarlas
    try {
      const FAVORITES_KEY = 'empresas_favoritas';
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const favorites = Array.isArray(parsed) ? parsed : [];
        const empresasAsociadasIds = favorites.map(empresa => empresa.id).filter(id => id);
        
        if (empresasAsociadasIds.length > 0) {
          empresasAsociadasIds.forEach(id => {
            params.append('empresas_asociadas', id);
          });
        }
      }
    } catch (e) {
      console.warn("No se pudieron cargar empresas favoritas", e);
    }

    return productsAlmacenService._request(`/products-almacen?${params}`, { method: 'GET' }, {
      requireSucuId: true,
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Obtener productos por empresa_id específico (para catálogo de empresas asociadas)
  static async getByEmpresaId(empresaIdParam) {
    if (!empresaIdParam) {
      return { success: false, message: 'ID de la empresa es requerido' };
    }
    
    const params = new URLSearchParams({
      empresa_id: empresaIdParam
    });

    // Pasa requireEmpresaId=false porque ya lo pasamos en los params si es de otra empresa,
    // pero igual requireSucuId=true para el stock de la sucursal actual
    return productsAlmacenService._request(`/products-almacen?${params}`, { method: 'GET' }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Obtener productos ligeros (solo id y name) para formularios de producción
  static async getAllForProduction() {
    return productsAlmacenService._request('/products-almacen/for-production', { method: 'GET' }, {
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Obtener un producto por ID
  static async getById(id) {
    if (!id) {
      return { success: false, message: 'ID del producto es requerido' };
    }

    return productsAlmacenService._request(`/products-almacen/${id}`, { method: 'GET' }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Crear un producto
  static async create(productData) {
    return productsAlmacenService._request('/products-almacen', {
      method: 'POST',
      body: JSON.stringify(productData)
    }, {
      requireSucuId: true,
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Actualizar un producto
  static async update(id, productData) {
    if (!id) {
      return { success: false, message: 'ID del producto es requerido' };
    }

    return productsAlmacenService._request(`/products-almacen/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Eliminar un producto
  static async delete(id) {
    if (!id) {
      return { success: false, message: 'ID del producto es requerido' };
    }

    return productsAlmacenService._request(`/products-almacen/${id}`, {
      method: 'DELETE'
    }, {
      returnErrorObject: true
    });
  }

  // Actualizar múltiples productos en lote (para importación)
  static async bulkUpdate(productosData) {
    return productsAlmacenService._request('/products-almacen/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ productosData })
    }, {
      requireSucuId: true,
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Crear múltiples productos en lote (para plantillas)
  static async bulkCreate(productosData) {
    if (!productosData || !Array.isArray(productosData)) {
      return { success: false, message: 'Datos inválidos para importación' };
    }

    const results = [];
    const errors = [];

    // Iteramos secuencialmente y usamos el método create/update para que maneje precios y categorías
    for (let i = 0; i < productosData.length; i++) {
      const prod = productosData[i];
      let res;
      if (prod.id) {
        res = await this.update(prod.id, prod);
      } else {
        res = await this.create(prod);
      }
      
      if (res && res.success) {
        results.push(res.data);
      } else {
        errors.push({ fila: i + 1, message: res?.message || 'Error desconocido' });
      }
    }

    if (errors.length > 0) {
      const uniqueErrors = [...new Set(errors.map(e => e.message))];
      const errorDesc = uniqueErrors.join(' | ');

      return { 
        success: false, 
        message: errorDesc,
        errores: errors,
        data: results
      };
    }

    return { 
      success: true, 
      message: `${results.length} productos importados correctamente.`, 
      data: results 
    };
  }

  // Obtener productos con recetas por IDs (para reportes)
  static async getByIdsWithRecipes(productIds) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return { success: false, message: 'IDs de productos son requeridos' };
    }

    const idsString = productIds.join(',');
    
    const params = new URLSearchParams({
      with_recipes: 'true',
      ids: idsString
    });

    return productsAlmacenService._request(`/products-almacen/by-ids?${params}`, { method: 'GET' }, {
      requireSucuId: true,
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }
}

export default productsAlmacenService;