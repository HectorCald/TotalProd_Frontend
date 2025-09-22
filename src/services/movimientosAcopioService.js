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

// Función helper para obtener sucu_id
const getSucuId = () => {
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    const parsed = JSON.parse(sucursalSeleccionada);
    return parsed.id;
  }
  return null;
};

class movimientosAcopioService {

  // Crear un movimiento
  static async create(movimientoData) {
    try {
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

      const response = await fetch(`${API_BASE_URL}/movimientos-acopio`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend),
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

      const response = await fetch(`${API_BASE_URL}/movimientos-acopio/product/${productId}?${params}`, {
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

      const response = await fetch(`${API_BASE_URL}/movimientos-acopio/cliente/${clienteId}?${params}`, {
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

      const response = await fetch(`${API_BASE_URL}/movimientos-acopio/proveedor/${proveedorId}?${params}`, {
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
  static async getAll(page = 1, limit = 10, tipo = null, ordenamiento = 'fecha_desc') {
    try {
      const sucuId = getSucuId();
      console.log('🔍 movimientosAcopioService - sucuId obtenido:', sucuId);
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

  // Obtener un movimiento por ID
  static async getById(movimientoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-acopio/${movimientoId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en getById:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
}

export default movimientosAcopioService;
