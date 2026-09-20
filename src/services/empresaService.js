import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

class EmpresaService {
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

  // Obtener empresas disponibles
  static async getDisponibles(currentEmpresaId) {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/empresas/disponibles`;
      if (currentEmpresaId) {
        url += `?currentEmpresaId=${currentEmpresaId}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getDisponibles:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Verificar código de vinculación
  static async verificarCodigo(empresaId, codigo) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/empresas/${empresaId}/verificar-codigo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ codigo }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en verificarCodigo:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar organigrama de empresa
  static async updateOrganigrama(empresaId, organigrama) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/empresas/${empresaId}/organigrama`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ organigrama }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en updateOrganigrama:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener imagen / logo de empresa
  static async getImage(empresaId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/empresas/${empresaId}/imagen`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error en getImage:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
}

export default EmpresaService;