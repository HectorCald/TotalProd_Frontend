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

class pedidosAlmacenService {
  // Crear un pedido
  static async create(pedidoData) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-almacen`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(pedidoData),
      });
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en pedidosAlmacenService.create:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener todos los pedidos del usuario
  static async getAll(page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`${API_BASE_URL}/pedidos-almacen?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en pedidosAlmacenService.getAll:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener un pedido por ID
  static async getById(pedidoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-almacen/${pedidoId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en pedidosAlmacenService.getById:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar estado del pedido
  static async updateEstado(pedidoId, nuevoEstado) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-almacen/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en pedidosAlmacenService.updateEstado:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Verificar si un producto tiene pedidos asociados
  static async verificarProductoEnPedidos(productoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-almacen/verificar-producto/${productoId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en pedidosAlmacenService.verificarProductoEnPedidos:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }
}

export default pedidosAlmacenService;
