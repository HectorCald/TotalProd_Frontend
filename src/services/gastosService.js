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

class gastosService {
    // Obtener todos los gastos con paginación y filtros
    static async getAll(page = 1, limit = 10, search = '', metodoPago = null, proveedor = null, ordenamiento = 'fecha_desc', sucuIdParam = null) {
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
            if (metodoPago) {
                params.append('metodo_pago', metodoPago);
            }
            if (proveedor) {
                params.append('proveedor_id', proveedor);
            }

            const response = await fetch(`${API_BASE_URL}/gastos?${params}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener los gastos');
            }

            return data;
        } catch (error) {
            console.error('Error obteniendo gastos:', error);
            return {
                success: false,
                message: error.message || 'Error al obtener los gastos'
            };
        }
    }

    // Obtener todos los gastos sin límite (para reportes)
    static async getAllSinLimite(ordenamiento = 'fecha_gasto_desc', sucuIdParam = null) {
        try {
            const sucuId = sucuIdParam || getSucuId();
            if (!sucuId) {
                return {
                    success: false,
                    message: 'No hay sucursal seleccionada'
                };
            }

            const params = new URLSearchParams({
                ordenamiento: ordenamiento,
                sucu_id: sucuId
            });

            const response = await fetch(`${API_BASE_URL}/gastos/sin-limite?${params}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener los gastos');
            }

            return data;
        } catch (error) {
            console.error('Error obteniendo gastos sin límite:', error);
            return {
                success: false,
                message: error.message || 'Error al obtener los gastos'
            };
        }
    }

    // Obtener un gasto por ID
    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/gastos/${id}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener el gasto');
            }

            return data;
        } catch (error) {
            console.error('Error obteniendo gasto por ID:', error);
            return {
                success: false,
                message: error.message || 'Error al obtener el gasto'
            };
        }
    }

    // Crear un nuevo gasto
    static async create(gastoData) {
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
                ...gastoData,
                sucu_id: sucuId,
                personal_id: personalId
            };

            const response = await fetch(`${API_BASE_URL}/gastos`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(dataToSend),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear el gasto');
            }

            return data;
        } catch (error) {
            console.error('Error creando gasto:', error);
            return {
                success: false,
                message: error.message || 'Error al crear el gasto'
            };
        }
    }

    // Actualizar un gasto
    static async update(id, updateData) {
        try {
            const response = await fetch(`${API_BASE_URL}/gastos/${id}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar el gasto');
            }

            return data;
        } catch (error) {
            console.error('Error actualizando gasto:', error);
            return {
                success: false,
                message: error.message || 'Error al actualizar el gasto'
            };
        }
    }

    // Eliminar un gasto
    static async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/gastos/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar el gasto');
            }

            return data;
        } catch (error) {
            console.error('Error eliminando gasto:', error);
            return {
                success: false,
                message: error.message || 'Error al eliminar el gasto'
            };
        }
    }

    // Obtener gastos por rango de fechas
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

            const response = await fetch(`${API_BASE_URL}/gastos/por-fechas?${params}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener los gastos');
            }

            return data;
        } catch (error) {
            console.error('Error obteniendo gastos por fechas:', error);
            return {
                success: false,
                message: error.message || 'Error al obtener los gastos'
            };
        }
    }
}

export default gastosService;
