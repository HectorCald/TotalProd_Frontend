import apiClient, { getSucuId, getPersonalId } from '../config/apiClient';

class deudasService {

  static async _request(endpoint, options = {}, config = {}) {
    const {
      requireSucuId = false,
      requireEmpresaId = true,
      returnErrorObject = false,
      throwOnError = false,
      defaultData = undefined
    } = config;

    try {
      if (requireSucuId) {
        const sucuId = getSucuId();
        if (!sucuId) {
          return {
            success: false,
            message: 'No hay sucursal seleccionada',
            ...(defaultData !== undefined ? { data: defaultData } : {})
          };
        }
      }

      const response = await apiClient.request(endpoint, options, requireSucuId, requireEmpresaId);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Error en la petición');
        error.status = response.status;
        error.code = data.code;
        error.currentPlan = data.currentPlan;
        error.requiredModule = data.requiredModule;
        throw error;
      }

      return data;
    } catch (error) {
      if (throwOnError || error.status === 403) {
        throw error;
      }
      
      if (returnErrorObject) {
        return {
          success: false,
          message: error.message || 'Error de conexión con el servidor',
          ...(defaultData !== undefined ? { data: defaultData } : {})
        };
      }
      
      return null;
    }
  }

  // Obtener deudas sin límite
  static async getAllSinLimite(sucuIdParam = null, filtroFecha = null) {
    const params = new URLSearchParams();
    if (sucuIdParam) params.append('sucu_id', sucuIdParam);
    if (filtroFecha) {
      const inicio = filtroFecha.fechaStrInicio || filtroFecha.inicio;
      const fin = filtroFecha.fechaStrFin || filtroFecha.fin;
      if (inicio) params.append('fecha_inicio', String(inicio).split('T')[0]);
      if (fin) params.append('fecha_fin', String(fin).split('T')[0]);
    }

    return deudasService._request(`/deudas/sin-limite?${params}`, { method: 'GET' }, {
      requireSucuId: !sucuIdParam,
      throwOnError: true
    });
  }

  // Obtener todas las deudas con paginación y filtros
  static async getAll(page = 1, limit = 10, search = '', estado = null, cliente = null, ordenamiento = 'fecha_desc', sucuIdParam = null, filtroFecha = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ordenamiento: ordenamiento
    });
    if (sucuIdParam) params.append('sucu_id', sucuIdParam);

    if (search) params.append('search', search);
    if (estado) params.append('estado', estado);
    if (cliente) params.append('cliente_id', cliente);
    if (filtroFecha) {
      const inicio = filtroFecha.fechaStrInicio || filtroFecha.inicio;
      const fin = filtroFecha.fechaStrFin || filtroFecha.fin;
      if (inicio) params.append('fecha_inicio', String(inicio).split('T')[0]);
      if (fin) params.append('fecha_fin', String(fin).split('T')[0]);
    }

    return deudasService._request(`/deudas?${params}`, { method: 'GET' }, {
      requireSucuId: !sucuIdParam,
      throwOnError: true
    });
  }

  // Crear una nueva deuda
  static async create(deudaData) {
    const personalId = getPersonalId();
    const dataToSend = {
      ...deudaData,
      personal_id: personalId
    };

    return deudasService._request('/deudas', {
      method: 'POST',
      body: JSON.stringify(dataToSend)
    }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Actualizar una deuda
  static async update(id, updateData) {
    return deudasService._request(`/deudas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Eliminar una deuda
  static async delete(id) {
    return deudasService._request(`/deudas/${id}`, {
      method: 'DELETE'
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Obtener una deuda por ID
  static async getById(id, sucuIdParam = null) {
    const params = new URLSearchParams();
    if (sucuIdParam) params.append('sucu_id', sucuIdParam);

    const endpoint = `/deudas/${id}${params.toString() ? `?${params.toString()}` : ''}`;
    return deudasService._request(endpoint, { method: 'GET' }, {
      requireSucuId: !sucuIdParam,
      throwOnError: true
    });
  }

  // Listar pagos parciales de una deuda
  static async getPagosParciales(deudaId) {
    return deudasService._request(`/deudas/${deudaId}/pagos-parciales`, { method: 'GET' }, {
      requireSucuId: false,
      throwOnError: true
    });
  }

  // Crear pago parcial
  static async createPagoParcial(deudaId, { monto, fecha = null, detalle = null }) {
    const body = { monto };
    if (fecha) {
      body.fecha = fecha;
    }
    if (detalle) {
      body.detalle = detalle;
    }

    return deudasService._request(`/deudas/${deudaId}/pagos-parciales`, {
      method: 'POST',
      body: JSON.stringify(body)
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Eliminar un pago parcial
  static async deletePagoParcial(deudaId, pagoId) {
    return deudasService._request(`/deudas/${deudaId}/pagos-parciales/${pagoId}`, {
      method: 'DELETE'
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

    // Actualizar estado de una deuda
  static async updateEstado(id, estado, saldoPendiente = null) {
    const updateData = { estado };
    if (saldoPendiente !== null) {
      updateData.saldo_pendiente = saldoPendiente;
    }

    return deudasService._request(`/deudas/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }
}

export default deudasService;