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

      const sucuId = getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      // Obtener personal_id
      const personalId = getPersonalId();

      const response = await fetch(`${API_BASE_URL}/pedidos-almacen`, {
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
      console.error('Error en pedidosAlmacenService.create:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener todos los pedidos de la sucursal
  static async getAll(page = 1, limit = 10, searchQuery = null, estado = null, ordenamiento = 'fecha_desc', sucuIdParam = null) {
    try {
      const sucuId = sucuIdParam || getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sucu_id: sucuId,
        ordenamiento: ordenamiento
      });

      if (searchQuery && searchQuery.trim() !== '') {
        params.append('search', searchQuery);
      }

      if (estado && estado.trim() !== '') {
        params.append('estado', estado);
      }

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

  // Actualizar pedido completo
  static async update(pedidoId, pedidoData) {
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

      // Obtener personal_id
      const personalId = getPersonalId();

      const response = await fetch(`${API_BASE_URL}/pedidos-almacen/${pedidoId}`, {
        method: 'PUT',
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
      console.error('Error en pedidosAlmacenService.update:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar entrega de pedido (solo precio, productos y cantidades)
  static async updateEntrega(pedidoId, pedidoData) {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-almacen/${pedidoId}/entrega`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(pedidoData),
      });
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en pedidosAlmacenService.updateEntrega:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar estado del pedido
  static async updateEstado(pedidoId, nuevoEstado, movimientoEntradaId = null) {
    try {
      const body = { estado: nuevoEstado };
      if (movimientoEntradaId) {
        body.movimiento_entrada_id = movimientoEntradaId;
      }
      
      const response = await fetch(`${API_BASE_URL}/pedidos-almacen/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
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

  // Obtener todos los pedidos sin límite (para reportes)
  static async getAllSinLimite(sucuIdParam = null) {
    try {
      const sucuId = sucuIdParam || getSucuId();
      if (!sucuId) {
        return {
          success: false,
          message: 'No hay sucursal seleccionada'
        };
      }

      const params = new URLSearchParams({
        page: '1',
        limit: '999999', // Límite muy alto para obtener todos los registros
        sucu_id: sucuId
      });

      const response = await fetch(`${API_BASE_URL}/pedidos-almacen?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en pedidosAlmacenService.getAllSinLimite:', error);
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
