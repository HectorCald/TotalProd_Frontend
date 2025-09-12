import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

// Función helper para obtener el token de autorización
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

class codigoPromocionalService {

  // Validar código promocional
  static async validarCodigo(codigo) {
    try {
      const response = await fetch(`${API_BASE_URL}/codigo-promocional/validar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ codigo: codigo })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error validando código promocional:', error);
      throw error;
    }
  }

  // Aplicar código promocional
  static async aplicarCodigo(codigoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/codigo-promocional/aplicar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ codigoId: codigoId })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error aplicando código promocional:', error);
      throw error;
    }
  }

  // Obtener todos los códigos (para administradores)
  static async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/codigo-promocional`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo códigos promocionales:', error);
      throw error;
    }
  }

  // Crear código promocional (para administradores)
  static async create(codigo, planId, duration) {
    try {
      const response = await fetch(`${API_BASE_URL}/codigo-promocional`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          codigo: codigo,
          planId: planId,
          duration: duration
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creando código promocional:', error);
      throw error;
    }
  }
}

export default codigoPromocionalService;
