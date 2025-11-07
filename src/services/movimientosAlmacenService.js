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

class movimientosAlmacenService {

  // Función auxiliar para validar el tamaño de los datos
  static validateDataSize(movimientoData) {
    const productos = movimientoData.productos || [];
    
    if (productos.length > 100) {
      return {
        valid: false,
        message: `Demasiados productos (${productos.length}). El máximo permitido es 100 productos por movimiento.`
      };
    }
    
    if (productos.length > 50) {
      return {
        valid: true,
        warning: `Procesando ${productos.length} productos. Esto puede tardar más tiempo.`
      };
    }
    
    return { valid: true };
  }

  // Crear un nuevo movimiento de almacén
  static async create(movimientoData) {
    try {
      // Validar el tamaño de los datos antes de procesar
      const validation = this.validateDataSize(movimientoData);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

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
        ...movimientoData,
        sucu_id: sucuId,
        personal_id: personalId
      };

      // Mostrar warning si hay muchos productos
      if (validation.warning) {
        console.warn(validation.warning);
      }

      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

      try {
        const response = await fetch(`${API_BASE_URL}/movimientos-almacen`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(dataToSend),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error al crear el movimiento');
        }

        // Normalizar la respuesta para que siempre tenga { success, data: { id } }
        return {
          success: true,
          data: { id: data.id }
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout: La operación tardó demasiado tiempo. Intenta con menos productos o verifica tu conexión.');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('Error creando movimiento de almacén:', error);
      return {
        success: false,
        message: error.message || 'Error al crear el movimiento'
      };
    }
  }

  // Obtener todos los movimientos de la sucursal
  static async getAll(page = 1, limit = 10, tipo = null, estado = null, ordenamiento = 'fecha_desc', clienteId = null, sucuIdParam = null, search = null) {
    try {
      const sucuId = sucuIdParam || getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const params = new URLSearchParams({
        sucu_id: sucuId,
        page: page.toString(),
        limit: limit.toString()
      });

      if (tipo) {
        params.append('tipo', tipo);
      }
      if (estado) {
        params.append('estado', estado);
      }
      if (ordenamiento) {
        params.append('ordenamiento', ordenamiento);
      }
      if (clienteId) {
        params.append('cliente', clienteId);
      }
      if (search && search.trim() !== '') {
        params.append('search', search);
      }

      const response = await fetch(`${API_BASE_URL}/movimientos-almacen?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener los movimientos');
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo movimientos de almacén:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener los movimientos'
      };
    }
  }

  // Obtener movimientos por tipo (entrada/salida)
  static async getByType(tipo, page = 1, limit = 10) {
    try {
      const sucuId = getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const params = new URLSearchParams({
        sucu_id: sucuId,
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/tipo/${tipo}?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener los movimientos');
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo movimientos por tipo:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener los movimientos'
      };
    }
  }

  // Obtener un movimiento específico por ID
  static async getById(id) {
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

      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/${id}?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener el movimiento');
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo movimiento por ID:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener el movimiento'
      };
    }
  }

  // Anular un movimiento
  static async anular(movimientoId, desdePedido = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/${movimientoId}/anular`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ desdePedido }),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en anular:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Eliminar un movimiento
  static async eliminar(movimientoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/${movimientoId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en eliminar:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener todos los movimientos sin límite (para reportes y balance)
  static async getAllSinLimite(tipo = null, estado = null, ordenamiento = 'fecha_desc', sucuIdParam = null) {
    try {
      const sucuId = sucuIdParam || getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const params = new URLSearchParams({
        sucu_id: sucuId,
        page: '1',
        limit: '999999' // Límite muy alto para obtener todos los registros
      });

      if (tipo) {
        params.append('tipo', tipo);
      }
      if (estado) {
        params.append('estado', estado);
      }
      if (ordenamiento) {
        params.append('ordenamiento', ordenamiento);
      }

      const response = await fetch(`${API_BASE_URL}/movimientos-almacen?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener los movimientos');
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo movimientos de almacén sin límite:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener los movimientos'
      };
    }
  }

  // Verificar si un producto tiene movimientos (ULTRA OPTIMIZADO)
  static async hasMovements(productId) {
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

      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/product/${productId}/has-movements?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en hasMovements:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener movimientos por producto
  static async getByProduct(productId) {
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

      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/product/${productId}?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en getByProduct:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener movimientos por cliente
  static async getByCliente(clienteId) {
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

      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/cliente/${clienteId}?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en getByCliente:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener movimientos por producción Damabrava
  static async getByProduccionDamabrava(produccionId) {
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

      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/produccion-damabrava/${produccionId}?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en getByProduccionDamabrava:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar un movimiento
  static async update(movimientoId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/${movimientoId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en update:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Eliminar productos de un movimiento
  static async deleteProductos(movimientoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/${movimientoId}/productos`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en deleteProductos:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Crear productos de un movimiento
  static async createProductos(movimientoId, productosData) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/${movimientoId}/productos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productosData),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en createProductos:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }
}

export default movimientosAlmacenService;
