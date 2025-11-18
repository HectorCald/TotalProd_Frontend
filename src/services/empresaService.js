import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

class EmpresaService {
  // Actualizar tipo de empresa
  static async updateTipo(empresaId, tipo) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/empresas/tipo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ empresaId, tipo }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en updateTipo:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener empresa por ID
  static async getById(empresaId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/empresas/${empresaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getById:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Buscar empresa por código
  static async searchByCodigo(codigo) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/empresas/search/codigo?codigo=${encodeURIComponent(codigo)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en searchByCodigo:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
}

export default EmpresaService;

