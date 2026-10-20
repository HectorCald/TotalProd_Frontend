import apiClient, { getSucuId, getEmpresaId } from '../config/apiClient';

class productsAcopioService {

  static async _request(endpoint, options = {}, config = {}) {
    const {
      requireSucuId = false,
      requireEmpresaId = false,
      returnErrorObject = false,
      throwOnError = false,
      defaultData = undefined
    } = config;

    try {
      if (requireSucuId) {
        const sucuId = getSucuId();
        if (!sucuId) {
          return {
            success: false,
            message: 'No hay sucursal seleccionada',
            ...(defaultData !== undefined ? { data: defaultData } : {})
          };
        }
      }

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

  // Obtener todos los productos
  static async getAll(page = 1, limit = 30, search = null, categoryId = null, sortOrder = null) {
    const params = new URLSearchParams({
      page: page,
      limit: limit
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

    const queryString = params.toString();
    const endpoint = queryString ? `/products-acopio?${queryString}` : '/products-acopio';

    return productsAcopioService._request(endpoint, {
      method: 'GET'
    }, {
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Obtener todos los productos sin paginación para selector de receta
  static async getAllForReceta() {
    return productsAcopioService._request('/products-acopio/for-receta', {
      method: 'GET'
    }, {
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Crear un producto
  static async create(productData) {
    return productsAcopioService._request('/products-acopio', {
      method: 'POST',
      body: JSON.stringify(productData)
    }, {
      requireEmpresaId: true
    });
  }

  // Actualizar múltiples productos en lote (solo los campos enviados)
  static async bulkUpdate(productosData) {
    return productsAcopioService._request('/products-acopio/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ productosData })
    }, {
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Importar o actualizar múltiples productos en lote
  static async bulkCreate(productosData) {
    if (!productosData || !Array.isArray(productosData)) {
      return { success: false, message: 'Datos inválidos para importación' };
    }

    const toUpdate = productosData.filter(p => p.id);
    const toCreate = productosData.filter(p => !p.id);
    const errores = [];
    let actualizados = 0;
    let creados = 0;

    if (toUpdate.length > 0) {
      const res = await productsAcopioService.bulkUpdate(toUpdate);
      if (res && res.success) {
        actualizados = res.data?.actualizados ?? toUpdate.length;
        if (Array.isArray(res.data?.errores)) errores.push(...res.data.errores);
      } else {
        errores.push(res?.message || 'Error al actualizar materia prima');
      }
    }

    if (toCreate.length > 0) {
      for (let i = 0; i < toCreate.length; i++) {
        const prod = toCreate[i];
        const res = await productsAcopioService.create(prod);
        if (res && res.success) {
          creados++;
        } else {
          errores.push(`Fila ${i + 1}: ${res?.message || 'Error al crear'}`);
        }
      }
    }

    const partes = [];
    if (actualizados > 0) partes.push(`${actualizados} actualizados`);
    if (creados > 0) partes.push(`${creados} creados`);

    if (errores.length > 0 && partes.length === 0) {
      return {
        success: false,
        message: errores.join(' | '),
        errores
      };
    }

    return {
      success: true,
      message: `${partes.join(', ')} correctamente.${errores.length > 0 ? ` (Con advertencias: ${errores.length})` : ''}`,
      data: { actualizados, creados, errores }
    };
  }

  // Eliminar un producto
  static async delete(id) {
    return productsAcopioService._request(`/products-acopio/${id}`, {
      method: 'DELETE'
    });
  }

  // Actualizar un producto
  static async update(id, productData) {
    return productsAcopioService._request(`/products-acopio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  // Obtener un producto por ID
  static async getById(id) {
    return productsAcopioService._request(`/products-acopio/${id}`, {
      method: 'GET'
    });
  }

  // Obtener productos por categoría
  static async getByCategory(categoryId) {
    return productsAcopioService._request(`/products-acopio/category/${categoryId}`, {
      method: 'GET'
    });
  }

  // Verificar si un producto tiene movimientos
  static async hasMovements(id) {
    return productsAcopioService._request(`/products-acopio/${id}/has-movements`, {
      method: 'GET'
    });
  }

  // Obtener productos para conteo
  static async productsConteo() {
    return productsAcopioService._request('/products-acopio/conteo-data', { method: 'GET' }, {
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }
}

export default productsAcopioService;
