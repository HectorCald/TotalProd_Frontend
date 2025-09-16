const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const sucursalesService = {
    // Obtener sucursales por empresa
    async getByEmpresaId(empresaId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/sucursales/empresa/${empresaId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
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
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/sucursales/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
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
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/sucursales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(sucursalData)
            });

            const data = await response.json();
            
            if (!response.ok) {
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
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/sucursales/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(sucursalData)
            });

            const data = await response.json();
            
            if (!response.ok) {
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
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/sucursales/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
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
