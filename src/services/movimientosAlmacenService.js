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
    return parsed.id;
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

  // Crear un nuevo movimiento de almacén
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

      const response = await fetch(`${API_BASE_URL}/movimientos-almacen`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el movimiento');
      }

      return data;
    } catch (error) {
      console.error('Error creando movimiento de almacén:', error);
      return {
        success: false,
        message: error.message || 'Error al crear el movimiento'
      };
    }
  }

  // Obtener todos los movimientos de la sucursal
  static async getAll(page = 1, limit = 10, tipo = null, ordenamiento = 'fecha_desc', sucuIdParam = null) {
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
        params.append('type', tipo);
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
  static async anular(movimientoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-almacen/${movimientoId}/anular`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
}

export default movimientosAlmacenService;
