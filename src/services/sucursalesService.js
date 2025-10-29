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


// Función helper para obtener el id de la sucursal "Casa Matriz" de la empresa
const getCasaMatrizId = async (empresaId) => {
    try {
        if (!empresaId) return null;
        const response = await fetch(`${API_BASE_URL}/sucursales/empresa/${empresaId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!response.ok) {
            return null;
        }
        const lista = data?.data || [];
        const casaMatriz = lista.find(s => (s.name || '').trim() === 'Casa Matriz');
        return casaMatriz ? casaMatriz.id : null;
    } catch (e) {
        console.error('Error obteniendo Casa Matriz:', e);
        return null;
    }
};

const sucursalesService = {
    // Obtener sucursales por empresa
    async getByEmpresaId(empresaIdParam = null) {
        try {
            // Si se pasa empresaId como parámetro, usarlo; si no, intentar obtenerlo del localStorage
            const empresaId = empresaIdParam || getEmpresaId();

            if (!empresaId) {
                console.log('❌ sucursalesService - No hay empresa seleccionada');
                return {
                    success: false,
                    message: 'No hay empresa seleccionada'
                };
            }

            
            const response = await fetch(`${API_BASE_URL}/sucursales/empresa/${empresaId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                // Si es un error de módulo, devolver la respuesta completa para que el frontend la maneje
                if (data.code === 'MODULE_NOT_INCLUDED' || data.code === 'NO_PLAN') {
                    return data;
                }
                throw new Error(data.message || 'Error al obtener las sucursales');
            }

            return data;
        } catch (error) {
            console.error('Error en sucursalesService.getByEmpresaId:', error);
            throw error;
        }
    },

    // Obtener sucursal por ID
    async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/sucursales/${id}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener la sucursal');
            }

            return data;
        } catch (error) {
            console.error('Error en sucursalesService.getById:', error);
            throw error;
        }
    },

    // Crear nueva sucursal
    async create(sucursalData) {
        try {
            const empresaId = getEmpresaId();
            if (!empresaId) {
                return {
                    success: false,
                    message: 'No hay empresa seleccionada'
                };
            }
            // Si el switch de almacén separado está inactivo en el frontend (Comparte),
            // se debe enviar almacen_sucursal_id con el id de "Casa Matriz" de la misma empresa
            const shouldUseAlmacenSucursal = (sucursalData && typeof sucursalData.almacenSeparado === 'boolean') ? !sucursalData.almacenSeparado : false;
            const casaMatrizId = shouldUseAlmacenSucursal ? await getCasaMatrizId(empresaId) : null;
            const { almacenSeparado, precios, ...payload } = sucursalData;
            const response = await fetch(`${API_BASE_URL}/sucursales`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...payload,
                    empresa_id: empresaId,
                    ...(casaMatrizId ? { almacen_sucursal_id: casaMatrizId } : {}),
                    ...(precios && Array.isArray(precios) ? { precios } : {})
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Si es un error de módulo, devolver la respuesta completa para que el frontend la maneje
                if (data.code === 'MODULE_NOT_INCLUDED' || data.code === 'NO_PLAN') {
                    return data;
                }
                throw new Error(data.message || 'Error al crear la sucursal');
            }

            return data;
        } catch (error) {
            console.error('Error en sucursalesService.create:', error);
            throw error;
        }
    },

    // Actualizar sucursal
    async update(id, sucursalData) {
        try {
            // Para update, también respetar el switch si viene
            const hasFlag = sucursalData && typeof sucursalData.almacenSeparado === 'boolean';
            const shouldUseAlmacenSucursal = hasFlag ? !sucursalData.almacenSeparado : false;
            const empresaId = getEmpresaId();
            const casaMatrizId = shouldUseAlmacenSucursal ? await getCasaMatrizId(empresaId) : null;
            const { almacenSeparado, precios, ...payload } = sucursalData;
            
            // Siempre enviar precios como array (incluso si está vacío) para sincronización correcta
            const preciosArray = Array.isArray(precios) ? precios : [];
            
            const response = await fetch(`${API_BASE_URL}/sucursales/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...payload,
                    // Si vino el flag, siempre enviar el campo (incluso null para indicar propio)
                    ...(hasFlag ? { almacen_sucursal_id: casaMatrizId } : {}),
                    precios: preciosArray
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Si es un error de módulo, devolver la respuesta completa para que el frontend la maneje
                if (data.code === 'MODULE_NOT_INCLUDED' || data.code === 'NO_PLAN') {
                    return data;
                }
                throw new Error(data.message || 'Error al actualizar la sucursal');
            }

            return data;
        } catch (error) {
            console.error('Error en sucursalesService.update:', error);
            throw error;
        }
    },

    // Eliminar sucursal
    async delete(id) {
        try {
            if (!id) {
                throw new Error('ID de sucursal es requerido');
            }

            const response = await fetch(`${API_BASE_URL}/sucursales/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                // Si es un error de módulo, devolver la respuesta completa para que el frontend la maneje
                if (data.code === 'MODULE_NOT_INCLUDED' || data.code === 'NO_PLAN') {
                    return data;
                }
                
                // Manejar diferentes tipos de errores con mensajes específicos
                let errorMessage = 'Error al eliminar la sucursal';
                
                if (response.status === 404) {
                    errorMessage = 'La sucursal no existe o ya fue eliminada';
                } else if (response.status === 409) {
                    errorMessage = data.message || 'No se puede eliminar la sucursal porque tiene registros asociados';
                } else if (response.status === 400) {
                    errorMessage = data.message || 'No se puede eliminar esta sucursal';
                } else if (response.status === 500) {
                    errorMessage = data.message || 'Error interno del servidor al eliminar la sucursal';
                } else if (data.message) {
                    errorMessage = data.message;
                }
                
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error('Error en sucursalesService.delete:', error);
            // Re-lanzar el error con el mensaje específico
            throw new Error(error.message || 'Error inesperado al eliminar la sucursal');
        }
    },

    // Obtener precios por sucursal
    async getPreciosBySucursalId(sucursalId) {
        try {
            if (!sucursalId) {
                throw new Error('ID de sucursal es requerido');
            }

            const response = await fetch(`${API_BASE_URL}/sucursales/${sucursalId}/precios`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                // Si es un error de módulo, devolver la respuesta completa para que el frontend la maneje
                if (data.code === 'MODULE_NOT_INCLUDED' || data.code === 'NO_PLAN') {
                    return data;
                }
                throw new Error(data.message || 'Error al obtener los precios de la sucursal');
            }

            return data;
        } catch (error) {
            console.error('Error en sucursalesService.getPreciosBySucursalId:', error);
            throw error;
        }
    }
};

export default sucursalesService;
