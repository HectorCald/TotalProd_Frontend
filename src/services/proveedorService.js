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

class proveedorService {

  // Obtener todos los proveedores de una sucursal
  static async getAll(page = 1, limit = 20, search = '') {
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
        limit: limit.toString(),
        ...(search && { search })
      });

      const response = await fetch(`${API_BASE_URL}/proveedores?${params}`, {
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

  // Crear un proveedor
  static async create(proveedorData) {
    try {
      const sucuId = getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const response = await fetch(`${API_BASE_URL}/proveedores`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...proveedorData,
          sucu_id: sucuId
        }),
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


  // Eliminar un proveedor
  static async delete(id) {
    try {

      const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
        }),
      });
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en delete:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }


  // Actualizar un proveedor
  static async update(id, proveedorData) {
    try {

      const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...proveedorData,
        }),
      });
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en update:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
}

export default proveedorService;
