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
            // Primero intentar obtener empresa_id del localStorage (para empleados)
            let empresaId = localStorage.getItem('empresa_id');
            
            // Si no hay empresa_id en localStorage, usar la función getEmpresaId (para usuarios normales)
            if (!empresaId) {
                empresaId = getEmpresaId();
            }

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
                // Si es un error 403, crear un error con toda la información para el modal
                if (response.status === 403) {
                    const error = new Error(data.message || 'Error en la petición');
                    error.status = response.status;
                    error.code = data.code;
                    error.currentPlan = data.currentPlan;
                    error.requiredModule = data.requiredModule;
                    throw error;
                }
                
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            // Log simple cuando la respuesta sea exitosa
            if (data.success || response.ok) {
                console.log('Información cargada del empleado');
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.getAll:', error);
            // Re-lanzar el error para que FetchData lo capture correctamente
            throw error;
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

            // Obtener empresa_id del localStorage
            const empresaId = localStorage.getItem('empresa_id');
            const params = new URLSearchParams();
            if (empresaId) {
                params.append('empresa_id', empresaId);
            }

            const response = await fetch(`${API_BASE_URL}/personal/${id}?${params}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            // Si hay error de conexión, el fetch puede lanzar excepción o la respuesta puede estar vacía
            if (!response) {
                return {
                    success: false,
                    message: 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.'
                };
            }

            const data = await response.json();

            if (!response.ok) {
                // Verificar si es un error de conexión basado en el status code
                // Los errores 0, 408, 504, etc. pueden indicar problemas de conexión
                if (response.status === 0 || response.status === 408 || response.status >= 500) {
                    return {
                        success: false,
                        message: 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.'
                    };
                }
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            // Log simple cuando la respuesta sea exitosa
            if (data.success || response.ok) {
                console.log('Información cargada del empleado');
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.getById:', error);
            
            // Detectar si es un error de conexión
            const errorMsg = error.message || error.toString() || '';
            const errorName = error.name || '';
            
            if (
                errorMsg.includes('Failed to fetch') ||
                errorMsg.includes('NetworkError') ||
                errorMsg.includes('Network request failed') ||
                errorMsg.includes('ERR_INTERNET_DISCONNECTED') ||
                errorMsg.includes('ERR_NETWORK_CHANGED') ||
                errorMsg.includes('ERR_CONNECTION_REFUSED') ||
                errorMsg.includes('ERR_CONNECTION_RESET') ||
                errorMsg.includes('ERR_CONNECTION_TIMED_OUT') ||
                errorName === 'TypeError' ||
                errorName === 'NetworkError'
            ) {
                return {
                    success: false,
                    message: 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.'
                };
            }
            
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
                // Si es un error 403, crear un error con toda la información para el modal
                if (response.status === 403) {
                    const error = new Error(data.message || 'Error en la petición');
                    error.status = response.status;
                    error.code = data.code;
                    error.currentPlan = data.currentPlan;
                    error.requiredModule = data.requiredModule;
                    throw error;
                }
                
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.create:', error);
            // Re-lanzar el error para que el componente lo capture correctamente
            throw error;
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

    // Generar token de empleado desde sesión de admin (sin contraseña)
    async generateEmployeeTokenFromAdmin(employeeId) {
        try {
            if (!employeeId) {
                return {
                    success: false,
                    message: 'ID del empleado es requerido'
                };
            }

            const response = await fetch(`${API_BASE_URL}/personal/generate-employee-token`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ employeeId })
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error del servidor'
                };
            }

            // Guardar token si fue exitoso
            if (data.success && data.data && data.data.token) {
                localStorage.setItem('token', data.data.token);
            }

            return data;
        } catch (error) {
            console.error('Error en personalService.generateEmployeeTokenFromAdmin:', error);
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
    },

    // Resetear contraseña de empleado
    async resetPassword(personalId) {
        try {
            if (!personalId) {
                return {
                    success: false,
                    message: 'ID del personal es requerido'
                };
            }

            const response = await fetch(`${API_BASE_URL}/personal/${personalId}/reset-password`, {
                method: 'POST',
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
            console.error('Error en personalService.resetPassword:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Actualizar ubicación del empleado
    async updateLocation(personalId, latitude, longitude) {
        try {
            if (!personalId || !latitude || !longitude) {
                return {
                    success: false,
                    message: 'ID del personal, latitud y longitud son requeridos'
                };
            }

            const response = await fetch(`${API_BASE_URL}/personal/${personalId}/update-location`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ latitude, longitude })
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
            console.error('Error en personalService.updateLocation:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    // Obtener ubicación del empleado
    async getLocation(personalId) {
        try {
            if (!personalId) {
                return {
                    success: false,
                    message: 'ID del personal es requerido'
                };
            }

            const response = await fetch(`${API_BASE_URL}/personal/${personalId}/location`, {
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
            console.error('Error en personalService.getLocation:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
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
