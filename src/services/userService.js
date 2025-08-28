const API_BASE_URL = process.env.REACT_APP_API_URL;

class UserService {
  // Función para guardar el token en localStorage y cookies
  static saveToken(token) {
    // Guardar en localStorage
    localStorage.setItem('authToken', token);

    // Guardar en cookies (expira en 24 horas)
    const expires = new Date();
    expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
    document.cookie = `authToken=${token}; expires=${expires.toUTCString()}; path=/`;
  }

  // Función para obtener el token
  static getToken() {
    return localStorage.getItem('authToken') || '';
  }

  // Función para guardar credenciales en localStorage
  static saveCredentials(email, password) {
    localStorage.setItem('credentials', JSON.stringify({ email, password }));
  }
  static saveId(id) {
    if (!id) {
      console.error('ID no válido:', id);
      return;
    }
    console.log('Guardando ID:', id);
    localStorage.setItem('userId', JSON.stringify({ id }));
  }

  // Obtener todos los usuarios
  static async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data,
          count: data.count
        };
      } else {
        return {
          success: false,
          error: data.message
        };
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener usuario por ID
  static async getUserById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`);
      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          error: data.message
        };
      }
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener usuario por email
  static async getUserByEmail(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile/${email}`);
      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          error: data.message
        };
      }
    } catch (error) {
      console.error('Error al obtener usuario por email:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Login de usuario
  static async login(email, password, remember = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Guardar el token si existe
        if (data.data && data.data.token) {
          this.saveToken(data.data.token);
        }
        // Guardar las credenciales SOLO si remember es true
        if (remember) {
          this.saveCredentials(email, password);
        }
        const id = data.data.user
        this.saveId(id.id);
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          error: data.message
        };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
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

}

export default UserService;
