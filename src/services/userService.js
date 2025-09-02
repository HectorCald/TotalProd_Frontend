//
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class UserService {
  // Métodos auxiliares para manejar token e ID
  static saveToken(token) {
    localStorage.setItem('token', token);
  }

  static getToken() {
    return localStorage.getItem('token');
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
        // Guardar credenciales en localStorage
        localStorage.setItem('credentials', JSON.stringify(credentials));
      }

      return data;
    } catch (error) {
      console.error('Error en loginUser:', error);
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
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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

  // Guardar información del usuario en localStorage
  static saveUserInfo(user) {
    localStorage.setItem('userInfo', JSON.stringify(user));
  }

  // Obtener información del usuario del localStorage
  static getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
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
}

export default UserService;
