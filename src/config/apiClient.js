import API_CONFIG from './api';

const API_BASE_URL = API_CONFIG.getBaseURL();

// Función helper para obtener el token de autorización
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Función helper para obtener sucu_id
export const getSucuId = () => {
  const sucursalIdSeleccionada = localStorage.getItem('sucursalIdSeleccionada');
  return sucursalIdSeleccionada || null;
};

// Función helper para obtener empresa_id
export const getEmpresaId = () => {
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    try {
      const parsed = JSON.parse(sucursalSeleccionada);
      if (parsed.empresas?.id) {
        return parsed.empresas.id;
      }
    } catch (e) {
      console.error('Error parsing sucursalSeleccionada:', e);
    }
  }
  return localStorage.getItem('empresa_id') || null;
};

// Función helper para obtener personal_id del token
export const getPersonalId = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || null;
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }
  return null;
};

class apiClient {
  /**
   * Realiza una petición fetch añadiendo automáticamente headers y sucu_id o empresa_id si corresponde.
   * @param {string} endpoint - Ejemplo: '/clients'
   * @param {object} options - Opciones de fetch (method, body, etc)
   * @param {boolean} includeSucuId - Si es true, añade sucu_id automáticamente a params o body
   * @param {boolean} includeEmpresaId - Si es true, añade empresa_id automáticamente a params o body
   */
  static async request(endpoint, options = {}, includeSucuId = true, includeEmpresaId = false) {
    let url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {})
    };

    const sucuId = getSucuId();
    const empresaId = getEmpresaId();
    let body = options.body;

    if (includeSucuId && sucuId) {
      if (!options.method || options.method === 'GET' || options.method === 'HEAD') {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}sucu_id=${sucuId}`;
      } else {
        if (body && typeof body === 'string') {
          try {
            const parsedBody = JSON.parse(body);
            if (!parsedBody.sucu_id) {
              parsedBody.sucu_id = sucuId;
              body = JSON.stringify(parsedBody);
            }
          } catch (e) {
            // Si falla el parseo, no modificamos
          }
        } else if (!body) {
          body = JSON.stringify({ sucu_id: sucuId });
        }
      }
    }

    if (includeEmpresaId && empresaId) {
      if (!options.method || options.method === 'GET' || options.method === 'HEAD') {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}empresa_id=${empresaId}`;
      } else {
        if (body && typeof body === 'string') {
          try {
            const parsedBody = JSON.parse(body);
            if (!parsedBody.empresa_id) {
              parsedBody.empresa_id = empresaId;
              body = JSON.stringify(parsedBody);
            }
          } catch (e) {
            // Si falla el parseo, no modificamos
          }
        } else if (!body) {
          body = JSON.stringify({ empresa_id: empresaId });
        }
      }
    }

    const response = await fetch(url, { ...options, headers, body });
    return response;
  }
}

export default apiClient;
