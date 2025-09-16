import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Función helper para obtener empresa_id del localStorage
const getEmpresaId = () => {
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    const parsed = JSON.parse(sucursalSeleccionada);
    return parsed.empresas?.id;
  }
  return null;
};

class pedidosAcopioService {
  static async create(pedidoData) {
    try {
      const empresaId = getEmpresaId();
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      const response = await fetch(`${API_BASE_URL}/pedidos-acopio`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...pedidoData,
          empresa_id: empresaId
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en pedidosAcopioService.create:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  static async getAll(page = 1, limit = 20, searchQuery = null, ordenamiento = 'fecha_desc') {
    try {
      const empresaId = getEmpresaId();
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ordenamiento: ordenamiento,
        empresa_id: empresaId
      });
      
      if (searchQuery && searchQuery.trim() !== '') {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`${API_BASE_URL}/pedidos-acopio?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en pedidosAcopioService.getAll:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  static async getById(pedidoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-acopio/${pedidoId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en pedidosAcopioService.getById:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  static async updateEstado(pedidoId, nuevoEstado) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-acopio/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en pedidosAcopioService.updateEstado:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  static async verificarProductoEnPedidos(productoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-acopio/verificar-producto/${productoId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en pedidosAcopioService.verificarProductoEnPedidos:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  static async eliminar(pedidoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-acopio/${pedidoId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en pedidosAcopioService.eliminar:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }
}

export default pedidosAcopioService;