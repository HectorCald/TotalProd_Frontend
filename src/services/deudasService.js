import apiClient, { getSucuId } from '../config/apiClient';

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

const normalizeDate = (value, { keepTime = false } = {}) => {
  if (!value) return null;

  if (value instanceof Date) {
    return keepTime ? value.toISOString() : value.toISOString().split('T')[0];
  }

  if (typeof value === 'string') {
    if (!keepTime && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return keepTime ? parsed.toISOString() : parsed.toISOString().split('T')[0];
    }
  }

  return null;
};

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
      if (filtroFecha.inicio) params.append('fecha_inicio', filtroFecha.inicio);
      if (filtroFecha.fin) params.append('fecha_fin', filtroFecha.fin);
    }

    return deudasService._request(`/deudas?${params}`, { method: 'GET' }, {
      requireSucuId: !sucuIdParam,
      throwOnError: true
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

  // Crear una nueva deuda
  static async create(deudaData) {
    const personalId = getPersonalId();
    const dataToSend = {
      ...deudaData,
      personal_id: personalId
    };

    if (dataToSend.fecha_deuda) {
      const fechaNormalizada = normalizeDate(dataToSend.fecha_deuda);
      if (fechaNormalizada) {
        dataToSend.fecha_deuda = fechaNormalizada;
      } else {
        delete dataToSend.fecha_deuda;
      }
    }

    if (dataToSend.fecha_vencimiento) {
      const vencimientoNormalizado = normalizeDate(dataToSend.fecha_vencimiento);
      if (vencimientoNormalizado) {
        dataToSend.fecha_vencimiento = vencimientoNormalizado;
      } else {
        delete dataToSend.fecha_vencimiento;
      }
    }

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
    const payload = { ...updateData };

    if (payload.fecha_deuda) {
      const fechaNormalizada = normalizeDate(payload.fecha_deuda);
      if (fechaNormalizada) {
        payload.fecha_deuda = fechaNormalizada;
      } else {
        delete payload.fecha_deuda;
      }
    }

    if (payload.fecha_vencimiento) {
      const vencimientoNormalizado = normalizeDate(payload.fecha_vencimiento);
      if (vencimientoNormalizado) {
        payload.fecha_vencimiento = vencimientoNormalizado;
      } else {
        delete payload.fecha_vencimiento;
      }
    }

    return deudasService._request(`/deudas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
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

  // Eliminar deudas por movimiento_salida_id
  static async deleteByMovimientoSalidaId(movimientoSalidaId) {
    return deudasService._request(`/deudas/movimiento/${movimientoSalidaId}`, {
      method: 'DELETE'
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Obtener deudas por rango de fechas
  static async getByDateRange(fechaInicio, fechaFin, sucuIdParam = null) {
    const params = new URLSearchParams({
      fechaInicio: fechaInicio,
      fechaFin: fechaFin
    });
    if (sucuIdParam) params.append('sucu_id', sucuIdParam);

    return deudasService._request(`/deudas/por-fechas?${params}`, { method: 'GET' }, {
      requireSucuId: !sucuIdParam,
      throwOnError: true
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

  // Obtener deudas vencidas
  static async getDeudasVencidas(sucuIdParam = null) {
    const params = new URLSearchParams();
    if (sucuIdParam) params.append('sucu_id', sucuIdParam);

    const endpoint = `/deudas/vencidas${params.toString() ? `?${params.toString()}` : ''}`;
    return deudasService._request(endpoint, { method: 'GET' }, {
      requireSucuId: !sucuIdParam,
      returnErrorObject: true
    });
  }

  // Crear pago parcial
  static async createPagoParcial(deudaId, { monto, fecha = null, detalle = null }) {
    const body = { monto };
    if (fecha) {
      const fechaNormalizada = normalizeDate(fecha, { keepTime: true });
      if (fechaNormalizada) {
        body.fecha = fechaNormalizada;
      }
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

  // Listar pagos parciales de una deuda
  static async getPagosParciales(deudaId) {
    return deudasService._request(`/deudas/${deudaId}/pagos-parciales`, { method: 'GET' }, {
      requireSucuId: false,
      throwOnError: true
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
}

export default deudasService;
