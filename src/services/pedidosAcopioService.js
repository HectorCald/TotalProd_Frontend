import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const employeeToken = localStorage.getItem('employeeToken');
  const authToken = token || employeeToken;
  return {
    'Content-Type': 'application/json',
    'Authorization': authToken ? `Bearer ${authToken}` : ''
  };
};

// Función helper para obtener personal_id del employeeToken
const getPersonalId = () => {
  const employeeToken = localStorage.getItem('employeeToken');
  if (employeeToken) {
    try {
      const payload = JSON.parse(atob(employeeToken.split('.')[1]));
      return payload.id;
    } catch (error) {
      console.error('Error parsing employeeToken:', error);
    }
  }
  return null;
};

// Función helper para obtener empresa_id
const getEmpresaId = () => {
  // Primero verificar si es empleado
  const employeeToken = localStorage.getItem('employeeToken');
  if (employeeToken) {
    try {
      const payload = JSON.parse(atob(employeeToken.split('.')[1]));
      if (payload.empresa_id) {
        return payload.empresa_id;
      }
    } catch (error) {
      console.error('Error parsing employeeToken for empresa:', error);
    }
  }
  
  // Si no es empleado, usar localStorage
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

      // Obtener personal_id si es un empleado
      const personalId = getPersonalId();

      const response = await fetch(`${API_BASE_URL}/pedidos-acopio`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...pedidoData,
          empresa_id: empresaId,
          personal_id: personalId
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