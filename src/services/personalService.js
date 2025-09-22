import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

// Función helper para obtener empresa_id
const getEmpresaId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
        const parsed = JSON.parse(sucursalSeleccionada);
        return parsed.empresas?.id;
    }
    return null;
};
// Función helper para obtener headers de autenticación
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

const personalService = {
    // Obtener todo el personal de una empresa
    async getAll() {
        try {
            const empresaId = getEmpresaId();

            if (!empresaId) {
                return {
                    success: false,
                    message: 'No hay empresa seleccionada'
                };
            }

            const params = new URLSearchParams({
                empresa_id: empresaId
            });

            const response = await fetch(`${API_BASE_URL}/personal?${params}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.getAll:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Obtener personal por ID
    async getById(id) {
        try {
            if (!id) {
                return {
                    success: false,
                    message: 'ID del personal es requerido'
                };
            }

            const response = await fetch(`${API_BASE_URL}/personal/${id}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.getById:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Crear personal
    async create(personalData) {
        try {
            const empresaId = getEmpresaId();

            if (!empresaId) {
                return {
                    success: false,
                    message: 'No hay empresa seleccionada'
                };
            }

            const dataToSend = {
                ...personalData,
                empresa_id: empresaId
            };

            const response = await fetch(`${API_BASE_URL}/personal`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.create:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Actualizar personal
    async update(id, personalData) {
        try {
            if (!id) {
                return {
                    success: false,
                    message: 'ID del personal es requerido'
                };
            }

            const response = await fetch(`${API_BASE_URL}/personal/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(personalData)
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.update:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Eliminar personal
    async delete(id) {
        try {
            if (!id) {
                return {
                    success: false,
                    message: 'ID del personal es requerido'
                };
            }

            const response = await fetch(`${API_BASE_URL}/personal/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.delete:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Verificar si un código existe
    async checkCodigo(codigo, excludeId = null) {
        try {
            const empresaId = getEmpresaId();

            if (!empresaId) {
                return {
                    success: false,
                    message: 'No hay empresa seleccionada'
                };
            }

            if (!codigo) {
                return {
                    success: false,
                    message: 'Código es requerido'
                };
            }

            const params = new URLSearchParams({
                codigo: codigo,
                empresa_id: empresaId
            });

            if (excludeId) {
                params.append('exclude_id', excludeId);
            }

            const response = await fetch(`${API_BASE_URL}/personal/check/codigo?${params}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.checkCodigo:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Validar código de empleado
    async validateEmployeeCode(codigo) {
        try {
            if (!codigo) {
                return {
                    success: false,
                    message: 'Código es requerido'
                };
            }

            const encodedCodigo = encodeURIComponent(codigo);

            const response = await fetch(`${API_BASE_URL}/personal/validate-employee/${encodedCodigo}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.validateEmployeeCode:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Establecer contraseña para empleado
    async setPassword(personalId, password) {
        try {
            if (!personalId || !password) {
                return {
                    success: false,
                    message: 'ID del personal y contraseña son requeridos'
                };
            }

            const response = await fetch(`${API_BASE_URL}/personal/${personalId}/set-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.setPassword:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Login de empleado
    async loginEmployee(codigo, password) {
        try {
            if (!codigo || !password) {
                return {
                    success: false,
                    message: 'Código y contraseña son requeridos'
                };
            }

            const response = await fetch(`${API_BASE_URL}/personal/login-employee`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ codigo, password })
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            // Guardar token si el login fue exitoso
            if (data.success && data.data && data.data.token) {
                localStorage.setItem('token', data.data.token);
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.loginEmployee:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Cambiar contraseña de empleado
    async changePassword(personalId, currentPassword, newPassword) {
        try {
            if (!personalId || !currentPassword || !newPassword) {
                return {
                    success: false,
                    message: 'ID del personal, contraseña actual y nueva contraseña son requeridos'
                };
            }

            const response = await fetch(`${API_BASE_URL}/personal/${personalId}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.changePassword:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    }
};

export default personalService;
