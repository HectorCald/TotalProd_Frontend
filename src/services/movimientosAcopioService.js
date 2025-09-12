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

class movimientosAcopioService {

  // Crear un movimiento
  static async create(movimientoData) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-acopio`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(movimientoData),
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

  // Obtener movimientos por producto
  static async getByProduct(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-acopio/product/${productId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en getByProduct:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener movimientos por cliente
  static async getByCliente(clienteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-acopio/cliente/${clienteId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en getByCliente:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener movimientos por proveedor
  static async getByProveedor(proveedorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-acopio/proveedor/${proveedorId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en getByProveedor:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener todos los movimientos
  static async getAll(page = 1, limit = 20, tipo = null, ordenamiento = 'fecha_desc') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (tipo) {
        params.append('tipo', tipo);
      }
      if (ordenamiento) {
        params.append('ordenamiento', ordenamiento);
      }

      const response = await fetch(`${API_BASE_URL}/movimientos-acopio?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en getAll:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Anular un movimiento
  static async anular(movimientoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-acopio/${movimientoId}/anular`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en anular:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Eliminar un movimiento
  static async eliminar(movimientoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-acopio/${movimientoId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en eliminar:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
}

export default movimientosAcopioService;
