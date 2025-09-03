import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

class PlanService {
    // Obtener todos los planes
    static async getAllPlans() {
        try {
            const response = await fetch(`${API_BASE_URL}/plans`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en getAllPlans:', error);
            return {
                success: false,
                error: 'Error de conexión con el servidor'
            };
        }
    }

    // Obtener un plan por ID
    static async getPlanById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/plans/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en getPlanById:', error);
            return {
                success: false,
                error: 'Error de conexión con el servidor'
            };
        }
    }
}

export default PlanService;
