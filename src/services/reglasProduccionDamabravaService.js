import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
    };
};

const getEmpresaId = () => {
    const empresaId = localStorage.getItem('empresa_id');
    if (empresaId) {
        return empresaId;
    }

    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
        try {
            const parsed = JSON.parse(sucursalSeleccionada);
            return parsed.empresas?.id || null;
        } catch (error) {
            console.error('Error al parsear sucursalSeleccionada:', error);
        }
    }

    return null;
};

class reglasProduccionDamabravaService {
    static async create(reglaData) {
        try {
            const empresaId = getEmpresaId();
            if (!empresaId) {
                return {
                    success: false,
                    message: 'No hay empresa seleccionada'
                };
            }

            const response = await fetch(`${API_BASE_URL}/reglas-produccion-damabrava`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...reglaData,
                    empresa_id: empresaId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar la regla de producción');
            }

            return data;
        } catch (error) {
            console.error('Error en reglasProduccionDamabravaService.create:', error);
            return {
                success: false,
                message: error.message || 'Error de conexión con el servidor'
            };
        }
    }

    static async getAll(_forceReload = null) {
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

            const response = await fetch(`${API_BASE_URL}/reglas-produccion-damabrava?${params.toString()}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener las reglas de producción');
            }

            return data;
        } catch (error) {
            console.error('Error en reglasProduccionDamabravaService.getAll:', error);
            return {
                success: false,
                message: error.message || 'Error de conexión con el servidor'
            };
        }
    }

    static async delete(reglaId) {
        try {
            if (!reglaId) {
                return {
                    success: false,
                    message: 'El identificador de la regla es obligatorio'
                };
            }

            const response = await fetch(`${API_BASE_URL}/reglas-produccion-damabrava/${reglaId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar la regla de producción');
            }

            return data;
        } catch (error) {
            console.error('Error en reglasProduccionDamabravaService.delete:', error);
            return {
                success: false,
                message: error.message || 'Error de conexión con el servidor'
            };
        }
    }
}

export default reglasProduccionDamabravaService;

