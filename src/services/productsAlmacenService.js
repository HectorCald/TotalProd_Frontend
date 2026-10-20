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
  static async getAll(page = 1, limit = 30, search = null, categoryId = null, sortOrder = null, ocultarStockCero = false, includeSocios = true) {
    const params = new URLSearchParams({
      page: page,
      limit: limit,
      ocultar_stock_cero: ocultarStockCero ? 'true' : 'false'
    });

    if (search) params.append('search', search);
    if (categoryId) params.append('category_id', categoryId);
    if (sortOrder) params.append('sort_order', sortOrder);

    if (includeSocios) {
      // Obtener socios de localStorage y enviarlas
      try {
        const SOCIOS_KEY = 'socios';
        const stored = localStorage.getItem(SOCIOS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const sociosIds = Array.isArray(parsed) ? parsed : [];
          
          if (sociosIds.length > 0) {
            sociosIds.forEach(id => {
              if (id) params.append('empresas_asociadas', id);
            });
          }
        }
      } catch (e) {
        console.warn("No se pudieron cargar socios", e);
      }
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

  // Importación masiva: actualiza (solo campos enviados) los que tienen ID y crea los nuevos
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
      const res = await productsAlmacenService.bulkUpdate(toUpdate);
      if (res && res.success) {
        actualizados = res.data?.actualizados ?? toUpdate.length;
        if (Array.isArray(res.data?.errores)) errores.push(...res.data.errores);
      } else {
        errores.push(res?.message || 'Error al actualizar productos');
      }
    }

    if (toCreate.length > 0) {
      const res = await productsAlmacenService._request('/products-almacen/bulk-create', {
        method: 'POST',
        body: JSON.stringify({ productosData: toCreate })
      }, {
        requireSucuId: true,
        requireEmpresaId: true,
        returnErrorObject: true
      });
      if (res && res.success) {
        creados = res.data?.creados ?? toCreate.length;
        if (Array.isArray(res.data?.errores)) errores.push(...res.data.errores);
      } else {
        errores.push(res?.message || 'Error al crear productos');
      }
    }

    const partes = [];
    if (actualizados > 0) partes.push(`${actualizados} actualizados`);
    if (creados > 0) partes.push(`${creados} creados`);
    const resumen = partes.length > 0 ? `${partes.join(' y ')}.` : '';

    if (errores.length > 0) {
      const uniqueErrors = [...new Set(errores)];
      return {
        success: false,
        message: `${resumen} ${uniqueErrors.join(' | ')}`.trim(),
        errores: uniqueErrors,
        data: { actualizados, creados }
      };
    }

    return {
      success: true,
      message: `Productos procesados correctamente: ${resumen}`,
      data: { actualizados, creados }
    };
  }

  // Obtener productos ligeros por IDs (para reportes y canasta)
  static async getByIdsFast(productIds) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return { success: false, message: 'IDs de productos son requeridos' };
    }

    const idsString = productIds.join(',');
    
    const params = new URLSearchParams({
      ids: idsString
    });

    return productsAlmacenService._request(`/products-almacen/by-ids-fast?${params}`, { method: 'GET' }, {
      requireSucuId: true,
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Obtener productos para conteo
  static async productsConteo(includeSocios = false) {
    const params = new URLSearchParams();

    if (includeSocios) {
      try {
        const SOCIOS_KEY = 'socios';
        const stored = localStorage.getItem(SOCIOS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const sociosIds = Array.isArray(parsed) ? parsed : [];
          
          if (sociosIds.length > 0) {
            sociosIds.forEach(id => {
              if (id) params.append('empresas_asociadas', id);
            });
          }
        }
      } catch (e) {
        console.warn("No se pudieron cargar socios", e);
      }
    }

    const queryString = params.toString();
    const url = queryString ? `/products-almacen/conteo-data?${queryString}` : '/products-almacen/conteo-data';

    return productsAlmacenService._request(url, { method: 'GET' }, {
      requireSucuId: true,
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }
}

export default productsAlmacenService;