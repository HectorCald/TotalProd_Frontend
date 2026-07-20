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

  // Helper centralizado para peticiones HTTP
  static async _request(endpoint, options = {}, config = {}) {
    const { 
      saveTokenOnSuccess = false, 
      requireAuth = false,
      actionName = 'petición'
    } = config;

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      };

      if (requireAuth) {
        const token = this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (data.success && saveTokenOnSuccess && data.data?.token) {
        this.saveToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error(`❌ Error en ${actionName}:`, error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  // Crear usuario
  static async createUser(user) {
    return this._request('/users/create', {
      method: 'POST',
      body: JSON.stringify(user)
    }, {
      saveTokenOnSuccess: true,
      actionName: 'createUser'
    });
  }

  // Login de usuario
  static async login(credentials) {
    return this._request('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }, {
      saveTokenOnSuccess: true,
      actionName: 'loginUser'
    });
  }

  // Obtener usuario por celular (sin autenticación, para verificar si existe)
  static async getUserByEmail(email) {
    return this._request('/users/getUserByEmail', {
      method: 'POST',
      body: JSON.stringify({ email })
    }, {
      actionName: 'getUserByEmail'
    });
  }

  // Obtener información del usuario logueado
  static async getCurrentUser(id) {
    return this._request(`/users/${id}`, {
      method: 'GET'
    }, {
      requireAuth: true,
      actionName: 'getCurrentUser'
    });
  }
  
  // Verificar contraseña actual
  static async verifyCurrentPassword(userId, currentPassword) {
    return this._request('/users/verifyPassword', {
      method: 'POST',
      body: JSON.stringify({ userId, currentPassword })
    }, {
      actionName: 'verifyCurrentPassword'
    });
  }

  // Cambiar contraseña
  static async changePassword(userId, currentPassword, newPassword) {
    return this._request('/users/changePassword', {
      method: 'POST',
      body: JSON.stringify({ userId, currentPassword, newPassword })
    }, {
      actionName: 'changePassword'
    });
  }
  
  // Solicitar reset de contraseña
  static async requestPasswordReset(email) {
    return this._request('/passwordReset/request', {
      method: 'POST',
      body: JSON.stringify({ email })
    }, {
      actionName: 'requestPasswordReset'
    });
  }

  // Verificar token de reset
  static async verifyResetToken(token) {
    return this._request('/passwordReset/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    }, {
      actionName: 'verifyResetToken'
    });
  }

  // Resetear contraseña
  static async resetPassword(token, newPassword) {
    return this._request('/passwordReset/reset', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    }, {
      actionName: 'resetPassword'
    });
  }

  // Actualizar configuracion
  static async updateConfig(data) {
    return this._request('/users/config', {
      method: 'PUT',
      body: JSON.stringify(data)
    }, {
      requireAuth: true,
      actionName: 'updateConfig'
    });
  }
}

export default UserService;
