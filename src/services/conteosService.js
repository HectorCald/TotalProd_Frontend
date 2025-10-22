import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

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

const getSucuId = () => {
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    const parsed = JSON.parse(sucursalSeleccionada);
    return parsed.almacen_sucursal_id || parsed.id;
  }
  return null;
};

class conteosService {
  static async create({ tipo, observaciones = null, detalles }) {
    try {
      const sucuId = getSucuId();
      const empresaId = getEmpresaId();
      
      if (!sucuId) {
        return { success: false, message: 'No hay sucursal seleccionada' };
      }
      
      if (!empresaId) {
        return { success: false, message: 'No hay empresa seleccionada' };
      }

      const payload = {
        tipo,
        sucursal_id: sucuId,
        empresa_id: empresaId,
        observaciones: observaciones || null,
        detalles
      };

      const resp = await fetch(`${API_BASE_URL}/conteos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || 'Error al registrar el conteo');
      }
      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error creando conteo:', error);
      return { success: false, message: error.message || 'Error al registrar el conteo' };
    }
  }

  static async getAll({ tipo = null } = {}) {
    try {
      const sucuId = getSucuId();
      const empresaId = getEmpresaId();
      
      if (!sucuId) {
        return { success: false, message: 'No hay sucursal seleccionada' };
      }
      
      if (!empresaId) {
        return { success: false, message: 'No hay empresa seleccionada' };
      }
      
      const params = new URLSearchParams({ sucu_id: sucuId, empresa_id: empresaId });
      if (tipo) params.append('tipo', tipo);
      const resp = await fetch(`${API_BASE_URL}/conteos?${params}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await resp.json();
      if (!resp.ok) {
        const error = new Error(data.message || 'Error al obtener conteos');
        error.status = resp.status;
        error.code = data.code;
        error.currentPlan = data.currentPlan;
        error.requiredModule = data.requiredModule;
        throw error;
      }
      return data; // { success, data }
    } catch (error) {
      console.error('Error obteniendo conteos:', error);
      // Si es un error 403, relanzarlo para que llegue al componente
      if (error.status === 403) {
        throw error;
      }
      return { success: false, message: error.message || 'Error al obtener conteos' };
    }
  }

  static async delete(conteoId) {
    try {
      if (!conteoId) {
        return { success: false, message: 'ID del conteo es requerido' };
      }

      const resp = await fetch(`${API_BASE_URL}/conteos/${conteoId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || 'Error al eliminar el conteo');
      }
      
      return { success: true, message: data.message || 'Conteo eliminado exitosamente' };
    } catch (error) {
      console.error('Error eliminando conteo:', error);
      return { success: false, message: error.message || 'Error al eliminar el conteo' };
    }
  }

  static async replace(conteoId) {
    try {
      if (!conteoId) {
        return { success: false, message: 'ID del conteo es requerido' };
      }

      const resp = await fetch(`${API_BASE_URL}/conteos/${conteoId}/replace`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || 'Error al reemplazar el stock');
      }

      return { success: true, message: data.message, data: data.data };
    } catch (error) {
      console.error('Error reemplazando stock por conteo:', error);
      return { success: false, message: error.message || 'Error al reemplazar el stock' };
    }
  }

  static async replaceAcopio(conteoId) {
    try {
      if (!conteoId) {
        return { success: false, message: 'ID del conteo es requerido' };
      }

      const resp = await fetch(`${API_BASE_URL}/conteos/${conteoId}/replace-acopio`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || 'Error al reemplazar el stock de acopio');
      }

      return { success: true, message: data.message, data: data.data };
    } catch (error) {
      console.error('Error reemplazando stock de acopio por conteo:', error);
      return { success: false, message: error.message || 'Error al reemplazar el stock de acopio' };
    }
  }
}

export default conteosService;


