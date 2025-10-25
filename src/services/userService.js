import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

class UserService {
  // Métodos auxiliares para manejar token e ID
  static saveToken(token) {
    localStorage.setItem('token', token);
  }

  static getToken() {
    return localStorage.getItem('token');
  }

  // Método para guardar preferencia de "recordar sesión"
  static saveRememberPreference(remember) {
    localStorage.setItem('rememberSession', remember.toString());
  }

  static getRememberPreference() {
    return localStorage.getItem('rememberSession') === 'true';
  }



  // Crear usuario
  static async createUser(user) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });


      const data = await response.json();
      if (data.success && data.data && data.data.token) {
        this.saveToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Error en createUser:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Login de usuario
  static async login(credentials) {
    try {
      
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(credentials),
      });

      
      const data = await response.json();
      
      if (data.success && data.data && data.data.token) {
        this.saveToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('❌ Error en loginUser:', error);
      console.error('❌ URL intentada:', `${API_BASE_URL}/users/login`);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener usuario por celular (sin autenticación, para verificar si existe)
  static async getUserByEmail(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/getUserByEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getUserByEmail:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener información del usuario logueado
  static async getCurrentUser(id) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getCurrentUser:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
  
  // Verificar contraseña actual
  static async verifyCurrentPassword(userId, currentPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/verifyPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, currentPassword }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en verifyCurrentPassword:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Cambiar contraseña
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/changePassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en changePassword:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }


  
  // Solicitar reset de contraseña
  static async requestPasswordReset(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/passwordReset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en requestPasswordReset:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Verificar token de reset
  static async verifyResetToken(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/passwordReset/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en verifyResetToken:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Resetear contraseña
  static async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/passwordReset/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en resetPassword:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
}

export default UserService;
