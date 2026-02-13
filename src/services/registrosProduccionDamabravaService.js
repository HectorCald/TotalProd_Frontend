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

class registrosProduccionDamabravaService {

  // Crear un nuevo registro de producción
  static async create(registroData) {
    try {
      const sucuId = getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const response = await fetch(`${API_BASE_URL}/registros-produccion-damabrava`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...registroData,
          sucursal_id: sucuId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear registro de producción');
      }

      return data;
    } catch (error) {
      console.error('Error en registrosProduccionDamabravaService.create:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener registros de producción del usuario actual
  static async getByUser(page = 1, limit = 10, estado = null, ordenamiento = 'fecha_desc', search = '', rangoFechas = null) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (estado) {
        params.append('estado', estado);
      }
      if (ordenamiento) {
        params.append('ordenamiento', ordenamiento);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      if (rangoFechas) {
        const { inicio, fin } = rangoFechas;
        if (inicio) {
          params.append('fecha_inicio', new Date(inicio).toISOString());
        }
        if (fin) {
          params.append('fecha_fin', new Date(fin).toISOString());
        }
      }

      const response = await fetch(`${API_BASE_URL}/registros-produccion-damabrava/my-production?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener mis registros de producción');
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo mis registros de producción:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener mis registros de producción'
      };
    }
  }

  // Obtener todos los registros de producción (sin filtrar por sucursal)
  static async getAll(
    page = 1,
    limit = 10,
    estado = null,
    ordenamiento = 'fecha_desc',
    search = '',
    responsable = null,
    rangoFechas = null
  ) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (estado) {
        params.append('estado', estado);
      }
      if (ordenamiento) {
        params.append('ordenamiento', ordenamiento);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      if (responsable && responsable.id && responsable.tipo) {
        params.append('responsable_id', responsable.id);
        params.append('responsable_tipo', responsable.tipo);
      }
      if (rangoFechas) {
        const { inicio, fin } = rangoFechas;
        if (inicio) {
          params.append('fecha_inicio', new Date(inicio).toISOString());
        }
        if (fin) {
          params.append('fecha_fin', new Date(fin).toISOString());
        }
      }

      const response = await fetch(`${API_BASE_URL}/registros-produccion-damabrava?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener los registros de producción');
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo registros de producción:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener los registros de producción'
      };
    }
  }

  // Obtener un registro de producción por ID
  static async getById(id) {
    try {
      if (!id) {
        return { success: false, message: 'ID es requerido' };
      }

      const response = await fetch(`${API_BASE_URL}/registros-produccion-damabrava/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Error al obtener el registro' };
      }

      return data;
    } catch (error) {
      console.error('Error en registrosProduccionDamabravaService.getById:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor',
      };
    }
  }

  // Eliminar un registro de producción
  static async delete(registroId) {
    try {
      const response = await fetch(`${API_BASE_URL}/registros-produccion-damabrava/${registroId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en delete:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Verificar un registro de producción
  static async verify(registroId, verificacionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/registros-produccion-damabrava/${registroId}/verify`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(verificacionData)
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en verify:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Anular verificación de un registro de producción
  static async unverify(registroId) {
    try {
      const response = await fetch(`${API_BASE_URL}/registros-produccion-damabrava/${registroId}/unverify`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en unverify:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar cantidad ingresada de un registro de producción
  static async updateCantidadIngresada(registroId, cantidadIngresada) {
    try {
      const response = await fetch(`${API_BASE_URL}/registros-produccion-damabrava/${registroId}/ingresar`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          cantidad_ingresada: cantidadIngresada
        })
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en updateCantidadIngresada:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Restar cantidad ingresada cuando se anula un movimiento de producción
  static async restarCantidadIngresada(registroId, cantidadARestar) {
    try {
      const response = await fetch(`${API_BASE_URL}/registros-produccion-damabrava/${registroId}/restar-ingresada`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          cantidad_a_restar: cantidadARestar
        })
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en restarCantidadIngresada:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener todos los registros de producción sin límite (para reportes)
  static async getAllSinLimite(estado = null, ordenamiento = 'fecha_desc', search = '', responsable = null) {
    try {
      const params = new URLSearchParams();

      if (estado) {
        params.append('estado', estado);
      }
      if (ordenamiento) {
        params.append('ordenamiento', ordenamiento);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      if (responsable && responsable.id && responsable.tipo) {
        params.append('responsable_id', responsable.id);
        params.append('responsable_tipo', responsable.tipo);
      }

      // Usar un límite alto para obtener todos los registros
      params.append('limit', '1000');

      const response = await fetch(`${API_BASE_URL}/registros-produccion-damabrava?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener los registros de producción');
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo registros de producción sin límite:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener los registros de producción'
      };
    }
  }
}

export default registrosProduccionDamabravaService;
