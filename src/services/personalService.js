import apiClient, { getEmpresaId } from '../config/apiClient';

const personalService = {
    async _request(endpoint, options = {}, config = {}) {
        const {
            requireEmpresaId = false,
            returnErrorObject = false,
            throwOnError = false,
            defaultData = undefined
        } = config;

        try {
            if (requireEmpresaId) {
                const empresaId = getEmpresaId();
                if (!empresaId) {
                    return {
                        success: false,
                        message: 'No hay empresa seleccionada',
                        ...(defaultData !== undefined ? { data: defaultData } : {})
                    };
                }
            }

            const response = await apiClient.request(endpoint, options, false, requireEmpresaId);
            const data = await response.json();

            if (!response.ok) {
                if (data.code === 'MODULE_NOT_INCLUDED' || data.code === 'NO_PLAN') {
                    return data;
                }

                const error = new Error(data.message || 'Error en la petición');
                error.status = response.status;
                error.code = data.code;
                error.currentPlan = data.currentPlan;
                error.requiredModule = data.requiredModule;
                throw error;
            }

            return data;
        } catch (error) {
            if (throwOnError) {
                throw error;
            }
            
            if (returnErrorObject) {
                return {
                    success: false,
                    message: error.message || 'Error de conexión con el servidor',
                    ...(defaultData !== undefined ? { data: defaultData } : {})
                };
            }
            
            return {
                success: false,
                message: error.message || 'Error de conexión con el servidor'
            };
        }
    },

    // Obtener todo el personal de una empresa
    async getAll() {
        return this._request('/personal', { method: 'GET' }, {
            requireEmpresaId: true,
            throwOnError: true
        });
    },

    // Obtener personal por ID
    async getById(id) {
        if (!id) {
            return { success: false, message: 'ID del personal es requerido' };
        }
        return this._request(`/personal/${id}`, { method: 'GET' }, {
            requireEmpresaId: true,
            throwOnError: true
        });
    },

    // Crear personal
    async create(personalData) {
        return this._request('/personal', {
            method: 'POST',
            body: JSON.stringify(personalData)
        }, {
            requireEmpresaId: true,
            returnErrorObject: true
        });
    },

    // Actualizar personal
    async update(id, personalData) {
        if (!id) {
            return { success: false, message: 'ID del personal es requerido' };
        }
        return this._request(`/personal/${id}`, {
            method: 'PUT',
            body: JSON.stringify(personalData)
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
    },

    // Eliminar personal
    async delete(id) {
        if (!id) {
            return { success: false, message: 'ID del personal es requerido' };
        }
        return this._request(`/personal/${id}`, {
            method: 'DELETE'
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
    },

    // Validar código de empleado
    async validateEmployeeCode(codigo) {
        if (!codigo) {
            return { success: false, message: 'Código es requerido' };
        }
        const encodedCodigo = encodeURIComponent(codigo);
        return this._request(`/personal/validate-employee/${encodedCodigo}`, {
            method: 'GET'
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
    },

    // Establecer contraseña para empleado
    async setPassword(personalId, password) {
        if (!personalId || !password) {
            return { success: false, message: 'ID del personal y contraseña son requeridos' };
        }
        return this._request(`/personal/${personalId}/set-password`, {
            method: 'POST',
            body: JSON.stringify({ password })
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
    },

    // Login de empleado
    async loginEmployee(codigo, password) {
        if (!codigo || !password) {
            return { success: false, message: 'Código y contraseña son requeridos' };
        }
        const data = await this._request('/personal/login-employee', {
            method: 'POST',
            body: JSON.stringify({ codigo, password })
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
        
        if (data.success && data.data && data.data.token) {
            localStorage.setItem('token', data.data.token);
        }
        return data;
    },

    // Cambiar contraseña de empleado
    async changePassword(personalId, currentPassword, newPassword) {
        if (!personalId || !currentPassword || !newPassword) {
            return { success: false, message: 'ID del personal, contraseña actual y nueva contraseña son requeridos' };
        }
        return this._request(`/personal/${personalId}/change-password`, {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
    },

    // Resetear contraseña de empleado
    async resetPassword(personalId) {
        if (!personalId) {
            return { success: false, message: 'ID del personal es requerido' };
        }
        return this._request(`/personal/${personalId}/reset-password`, {
            method: 'POST'
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
    },

    // Actualizar ubicación del empleado
    async updateLocation(personalId, latitude, longitude) {
        if (!personalId || !latitude || !longitude) {
            return { success: false, message: 'ID del personal, latitud y longitud son requeridos' };
        }
        return this._request(`/personal/${personalId}/update-location`, {
            method: 'POST',
            body: JSON.stringify({ latitude, longitude })
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
    },

    // Obtener ubicación del empleado
    async getLocation(personalId) {
        if (!personalId) {
            return { success: false, message: 'ID del personal es requerido' };
        }
        return this._request(`/personal/${personalId}/location`, {
            method: 'GET'
        }, {
            requireEmpresaId: false,
            returnErrorObject: true
        });
    },

    // Obtener ubicación actual del navegador
    async getCurrentLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({
                    success: false,
                    message: 'Geolocalización no soportada por este navegador'
                });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        success: true,
                        data: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        }
                    });
                },
                (error) => {
                    let message = 'Error al obtener ubicación';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Permiso de ubicación denegado';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Ubicación no disponible';
                            break;
                        case error.TIMEOUT:
                            message = 'Tiempo de espera agotado';
                            break;
                        default:
                            message = 'Error al obtener ubicación';
                            break;
                    }
                    resolve({
                        success: false,
                        message: message
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }
};

export default personalService;
