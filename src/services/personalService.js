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

};

export default personalService;