import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

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

      const sucuId = getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
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
          personal_id: personalId,
          sucu_id: sucuId
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en pedidosAcopioService.create:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  static async getAll(page = 1, limit = 10, searchQuery = null, estado = null, ordenamiento = 'fecha_desc') {
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

      if (estado && estado.trim() !== '') {
        params.append('estado', estado);
      }
      
      const finalUrl = `${API_BASE_URL}/pedidos-acopio?${params}`;
      console.log('[pedidosAcopioService.getAll] URL =>', finalUrl);
      const response = await fetch(finalUrl, {
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

  static async updateEstado(pedidoId, nuevoEstado, movimientoEntradaId = null) {
    try {
      const body = { estado: nuevoEstado };
      if (movimientoEntradaId) {
        body.movimiento_entrada_id = movimientoEntradaId;
      }
      
      const response = await fetch(`${API_BASE_URL}/pedidos-acopio/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
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

  static async entregar(pedidoId, entregaData) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-acopio/${pedidoId}/entregar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(entregaData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en pedidosAcopioService.entregar:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  static async anularEntrega(pedidoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-acopio/${pedidoId}/anular-entrega`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en pedidosAcopioService.anularEntrega:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }
}

export default pedidosAcopioService;