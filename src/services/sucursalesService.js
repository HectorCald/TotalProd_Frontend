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

const sucursalesService = {
    // Obtener sucursales por empresa
    async getByEmpresaId(empresaIdParam = null) {
        try {
            // Si se pasa empresaId como parámetro, usarlo; si no, intentar obtenerlo del localStorage
            const empresaId = empresaIdParam || getEmpresaId();
            console.log('🔍 sucursalesService - empresaId obtenido:', empresaId);

            if (!empresaId) {
                console.log('❌ sucursalesService - No hay empresa seleccionada');
                return {
                    success: false,
                    message: 'No hay empresa seleccionada'
                };
            }

            console.log('🔍 sucursalesService - URL:', `${API_BASE_URL}/sucursales/empresa/${empresaId}`);
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

            const response = await fetch(`${API_BASE_URL}/sucursales`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...sucursalData,
                    empresa_id: empresaId
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
            const response = await fetch(`${API_BASE_URL}/sucursales/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(sucursalData)
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
                throw new Error(data.message || 'Error al eliminar la sucursal');
            }

            return data;
        } catch (error) {
            console.error('Error en sucursalesService.delete:', error);
            throw error;
        }
    }
};

export default sucursalesService;
