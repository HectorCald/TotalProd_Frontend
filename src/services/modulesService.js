const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const modulesService = {
    // Obtener todos los módulos con sus submódulos
    async getAll() {
        try {
            const token = localStorage.getItem('token');
            const employeeToken = localStorage.getItem('employeeToken');
            const authToken = token || employeeToken;
            
            const response = await fetch(`${API_URL}/modules`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken ? `Bearer ${authToken}` : ''
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener los módulos');
            }

            return data;
        } catch (error) {
            console.error('Error en modulesService.getAll:', error);
            throw error;
        }
    },

    // Obtener un módulo específico con sus submódulos
    async getById(id) {
        try {
            const token = localStorage.getItem('token');
            const employeeToken = localStorage.getItem('employeeToken');
            const authToken = token || employeeToken;
            
            const response = await fetch(`${API_URL}/modules/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken ? `Bearer ${authToken}` : ''
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener el módulo');
            }

            return data;
        } catch (error) {
            console.error('Error en modulesService.getById:', error);
            throw error;
        }
    }
};

export default modulesService;
