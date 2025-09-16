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

// Función helper para obtener personal_id del localStorage (para empleados)
const getPersonalId = () => {
  const employeeToken = localStorage.getItem('employeeToken');
  if (employeeToken) {
    try {
      // El employeeToken es un JWT, necesitamos decodificarlo
      const payload = JSON.parse(atob(employeeToken.split('.')[1]));
      return payload.id; // En el JWT del empleado, el id es el personal_id
    } catch (error) {
      console.error('Error parsing employeeToken:', error);
    }
  }
  return null;
};

class pedidosAlmacenService {
  // Crear un pedido
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

      const response = await fetch(`${API_BASE_URL}/pedidos-almacen`, {
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
      console.error('Error en pedidosAlmacenService.create:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener todos los pedidos de la empresa
  static async getAll(page = 1, limit = 20) {
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
        empresa_id: empresaId
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

  // Eliminar pedido
  static async eliminar(pedidoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-almacen/${pedidoId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en pedidosAlmacenService.eliminar:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }
}

export default pedidosAlmacenService;
