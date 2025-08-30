const API_BASE_URL = process.env.REACT_APP_API_URL;

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
        const id = data.data.user
        this.saveId(id.id);
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
  static async getUserByPhone(phone) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/getUserByPhone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getUserByPhone:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }


}

export default UserService;
