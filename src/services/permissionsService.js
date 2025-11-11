import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

class permissionsService {
    static async canViewSensitiveInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/permissions/info`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al verificar permisos');
            }

            return {
                success: true,
                data: data.data || { allowed: false }
            };
        } catch (error) {
            console.error('Error en permissionsService.canViewSensitiveInfo:', error);
            return {
                success: false,
                message: error.message || 'Error al verificar permisos'
            };
        }
    }
}

export default permissionsService;

