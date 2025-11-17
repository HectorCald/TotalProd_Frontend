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
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    const parsed = JSON.parse(sucursalSeleccionada);
    return parsed.empresas?.id;
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

class transferenciasAlmacenService {

  // Crear una nueva transferencia de almacén
  static async create(transferenciaData) {
    try {
      // Primero intentar obtener empresa_id del localStorage (para empleados)
      let empresaId = localStorage.getItem('empresa_id');
      
      // Si no hay empresa_id en localStorage, usar la función getEmpresaId (para usuarios normales)
      if (!empresaId) {
        empresaId = getEmpresaId();
      }

      // Debug: verificar empresa_id
      console.log('[TRANSFERENCIA] empresa_id obtenido:', empresaId);

      if (!empresaId) {
        console.error('[TRANSFERENCIA] Error: No se pudo obtener empresa_id');
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      const sucuOrigenId = getSucuId();
      if (!sucuOrigenId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      // Obtener personal_id si es un empleado
      const personalId = getPersonalId();

      const dataToSend = {
        ...transferenciaData,
        sucu_origen_id: sucuOrigenId,
        empresa_id: empresaId,
        personal_id: personalId
      };

      // Debug: verificar datos enviados
      console.log('[TRANSFERENCIA] Datos a enviar:', {
        ...dataToSend,
        productos: dataToSend.productos?.length || 0
      });

      const response = await fetch(`${API_BASE_URL}/transferencias-almacen`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la transferencia');
      }

      return {
        success: true,
        data: { id: data.id }
      };
    } catch (error) {
      console.error('Error creando transferencia de almacén:', error);
      return {
        success: false,
        message: error.message || 'Error al crear la transferencia'
      };
    }
  }

  // Obtener todas las transferencias de la sucursal
  static async getAll(page = 1, limit = 30, estado = null, ordenamiento = 'fecha_desc', search = null, filtroFecha = null, clienteId = null) {
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

      if (estado) {
        params.append('estado', estado);
      }
      if (ordenamiento) {
        params.append('ordenamiento', ordenamiento);
      }
      if (search && search.trim() !== '') {
        params.append('search', search);
      }
      if (filtroFecha) {
        if (filtroFecha.inicio) {
          params.append('fecha_inicio', filtroFecha.inicio);
        }
        if (filtroFecha.fin) {
          params.append('fecha_fin', filtroFecha.fin);
        }
      }
      if (clienteId) {
        params.append('cliente_id', clienteId);
      }

      const response = await fetch(`${API_BASE_URL}/transferencias-almacen?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener las transferencias');
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo transferencias de almacén:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener las transferencias'
      };
    }
  }

  // Actualizar estado de una transferencia
  static async actualizarEstado(transferenciaId, nuevoEstado) {
    try {
      const response = await fetch(`${API_BASE_URL}/transferencias-almacen/${transferenciaId}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el estado de la transferencia');
      }

      return data;
    } catch (error) {
      console.error('Error actualizando estado de transferencia:', error);
      return {
        success: false,
        message: error.message || 'Error al actualizar el estado de la transferencia'
      };
    }
  }

  // Eliminar una transferencia
  static async eliminar(transferenciaId) {
    try {
      const response = await fetch(`${API_BASE_URL}/transferencias-almacen/${transferenciaId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar la transferencia');
      }

      return data;
    } catch (error) {
      console.error('Error eliminando transferencia:', error);
      return {
        success: false,
        message: error.message || 'Error al eliminar la transferencia'
      };
    }
  }

  // Obtener una transferencia específica por ID
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

      const response = await fetch(`${API_BASE_URL}/transferencias-almacen/${id}?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener la transferencia');
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo transferencia por ID:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener la transferencia'
      };
    }
  }
}

export default transferenciasAlmacenService;

