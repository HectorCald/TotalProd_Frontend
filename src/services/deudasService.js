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

// Función helper para obtener empresa_id
const getEmpresaId = () => {
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    const parsed = JSON.parse(sucursalSeleccionada);
    return parsed.empresas?.id;
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
    // Obtener todas las deudas con paginación y filtros
    static async getAll(page = 1, limit = 10, search = '', estado = null, cliente = null, ordenamiento = 'fecha_desc', sucuIdParam = null, filtroFecha = null) {
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
                ordenamiento: ordenamiento,
                sucu_id: sucuId
            });

            if (search) {
                params.append('search', search);
            }
            if (estado) {
                params.append('estado', estado);
            }
            if (cliente) {
                params.append('cliente_id', cliente);
            }
            if (filtroFecha) {
                if (filtroFecha.inicio) {
                    params.append('fecha_inicio', filtroFecha.inicio);
                }
                if (filtroFecha.fin) {
                    params.append('fecha_fin', filtroFecha.fin);
                }
            }

            const response = await fetch(`${API_BASE_URL}/deudas?${params}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'Error al obtener las deudas');
                error.status = response.status;
                error.code = data.code;
                error.currentPlan = data.currentPlan;
                error.requiredModule = data.requiredModule;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error obteniendo deudas:', error);
            // Si es un error 403, relanzarlo para que llegue al componente
            if (error.status === 403) {
                throw error;
            }
            return {
                success: false,
                message: error.message || 'Error al obtener las deudas'
            };
        }
    }


    // Obtener una deuda por ID
    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/deudas/${id}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener la deuda');
            }

            return data;
        } catch (error) {
            console.error('Error obteniendo deuda por ID:', error);
            // Si es un error 403, relanzarlo para que llegue al componente
            if (error.status === 403) {
                throw error;
            }
            return {
                success: false,
                message: error.message || 'Error al obtener la deuda'
            };
        }
    }

    // Crear una nueva deuda
    static async create(deudaData) {
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
                ...deudaData,
                sucu_id: sucuId,
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

            const response = await fetch(`${API_BASE_URL}/deudas`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(dataToSend),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear la deuda');
            }

            return data;
        } catch (error) {
            console.error('Error creando deuda:', error);
            // Si es un error 403, relanzarlo para que llegue al componente
            if (error.status === 403) {
                throw error;
            }
            return {
                success: false,
                message: error.message || 'Error al crear la deuda'
            };
        }
    }

    // Actualizar una deuda
    static async update(id, updateData) {
        try {
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

      const response = await fetch(`${API_BASE_URL}/deudas/${id}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
        body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar la deuda');
            }

            return data;
        } catch (error) {
            console.error('Error actualizando deuda:', error);
            // Si es un error 403, relanzarlo para que llegue al componente
            if (error.status === 403) {
                throw error;
            }
            return {
                success: false,
                message: error.message || 'Error al actualizar la deuda'
            };
        }
    }

    // Eliminar una deuda
    static async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/deudas/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar la deuda');
            }

            return data;
        } catch (error) {
            console.error('Error eliminando deuda:', error);
            // Si es un error 403, relanzarlo para que llegue al componente
            if (error.status === 403) {
                throw error;
            }
            return {
                success: false,
                message: error.message || 'Error al eliminar la deuda'
            };
        }
    }

    // Eliminar deudas por movimiento_salida_id
    static async deleteByMovimientoSalidaId(movimientoSalidaId) {
        try {
            const response = await fetch(`${API_BASE_URL}/deudas/movimiento/${movimientoSalidaId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar las deudas asociadas al movimiento');
            }

            return data;
        } catch (error) {
            console.error('Error eliminando deudas por movimiento_salida_id:', error);
            // Si es un error 403, relanzarlo para que llegue al componente
            if (error.status === 403) {
                throw error;
            }
            return {
                success: false,
                message: error.message || 'Error al eliminar las deudas asociadas al movimiento'
            };
        }
    }

    // Obtener deudas por rango de fechas
    static async getByDateRange(fechaInicio, fechaFin, sucuIdParam = null) {
        try {
            const sucuId = sucuIdParam || getSucuId();
            if (!sucuId) {
                return {
                    success: false,
                    message: 'No hay sucursal seleccionada'
                };
            }

            const params = new URLSearchParams({
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                sucu_id: sucuId
            });

            const response = await fetch(`${API_BASE_URL}/deudas/por-fechas?${params}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'Error al obtener las deudas');
                error.status = response.status;
                error.code = data.code;
                error.currentPlan = data.currentPlan;
                error.requiredModule = data.requiredModule;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error obteniendo deudas por fechas:', error);
            // Si es un error 403, relanzarlo para que llegue al componente
            if (error.status === 403) {
                throw error;
            }
            return {
                success: false,
                message: error.message || 'Error al obtener las deudas'
            };
        }
    }

    // Actualizar estado de una deuda
    static async updateEstado(id, estado, saldoPendiente = null) {
        try {
            const updateData = { estado };
            if (saldoPendiente !== null) {
                updateData.saldo_pendiente = saldoPendiente;
            }

            const response = await fetch(`${API_BASE_URL}/deudas/${id}/estado`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar el estado de la deuda');
            }

            return data;
        } catch (error) {
            console.error('Error actualizando estado de deuda:', error);
            // Si es un error 403, relanzarlo para que llegue al componente
            if (error.status === 403) {
                throw error;
            }
            return {
                success: false,
                message: error.message || 'Error al actualizar el estado de la deuda'
            };
        }
    }

    // Obtener deudas vencidas
    static async getDeudasVencidas(sucuIdParam = null) {
        try {
            const sucuId = sucuIdParam || getSucuId();
            if (!sucuId) {
                return {
                    success: false,
                    message: 'No hay sucursal seleccionada'
                };
            }

            const params = new URLSearchParams({
                sucu_id: sucuId
            });

            const response = await fetch(`${API_BASE_URL}/deudas/vencidas?${params}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener las deudas vencidas');
            }

            return data;
        } catch (error) {
            console.error('Error obteniendo deudas vencidas:', error);
            // Si es un error 403, relanzarlo para que llegue al componente
            if (error.status === 403) {
                throw error;
            }
            return {
                success: false,
                message: error.message || 'Error al obtener las deudas vencidas'
            };
        }
    }

    // Crear pago parcial
    static async createPagoParcial(deudaId, { monto, fecha = null }) {
        try {
            const body = { monto };
      if (fecha) {
        const fechaNormalizada = normalizeDate(fecha, { keepTime: true });
        if (fechaNormalizada) {
          body.fecha = fechaNormalizada;
        }
      }

            const response = await fetch(`${API_BASE_URL}/deudas/${deudaId}/pagos-parciales`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar el pago parcial');
            }
            return data;
        } catch (error) {
            console.error('Error creando pago parcial:', error);
            if (error.status === 403) throw error;
            return { success: false, message: error.message || 'Error al registrar el pago parcial' };
        }
    }

    // Listar pagos parciales de una deuda
    static async getPagosParciales(deudaId) {
        try {
            const response = await fetch(`${API_BASE_URL}/deudas/${deudaId}/pagos-parciales`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener los pagos parciales');
            }
            return data;
        } catch (error) {
            console.error('Error obteniendo pagos parciales:', error);
            if (error.status === 403) throw error;
            return { success: false, message: error.message || 'Error al obtener los pagos parciales' };
        }
    }

    // Eliminar un pago parcial
    static async deletePagoParcial(deudaId, pagoId) {
        try {
            const response = await fetch(`${API_BASE_URL}/deudas/${deudaId}/pagos-parciales/${pagoId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar el pago parcial');
            }
            return data;
        } catch (error) {
            console.error('Error eliminando pago parcial:', error);
            if (error.status === 403) throw error;
            return { success: false, message: error.message || 'Error al eliminar el pago parcial' };
        }
    }
}

export default deudasService;
