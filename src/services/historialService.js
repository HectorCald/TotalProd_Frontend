import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const getEmpresaId = () => {
  const storedEmpresa = localStorage.getItem('empresa_id');
  if (storedEmpresa) {
    try {
      const parsed = JSON.parse(storedEmpresa);
      if (typeof parsed === 'string') {
        return parsed;
      }
      return parsed;
    } catch (error) {
      return storedEmpresa;
    }
  }

  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    try {
      const parsed = JSON.parse(sucursalSeleccionada);
      if (parsed?.empresas?.id) {
        return parsed.empresas.id;
      }
    } catch (error) {
      console.warn('historialService.getEmpresaId: error parseando sucursalSeleccionada', error);
    }
  }

  return null;
};

class historialService {
  static async create(payload) {
    try {
      const empresaId = payload?.empresa_id ?? getEmpresaId();

      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      const dataToSend = {
        ...payload,
        empresa_id: empresaId
      };

      const response = await fetch(`${API_BASE_URL}/historial`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en historialService.create:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor',
        error
      };
    }
  }

  static async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      const preparedParams = { ...params };

      if (!preparedParams.empresa_id) {
        const empresaId = getEmpresaId();
        if (empresaId) {
          preparedParams.empresa_id = empresaId;
        } else {
          return {
            success: false,
            message: 'No hay empresa seleccionada'
          };
        }
      }

      if (preparedParams.limit === undefined) {
        preparedParams.limit = '30';
      }

      if (preparedParams.page !== undefined) {
        const pageNumber = parseInt(preparedParams.page, 10) || 1;
        const limitNumber = parseInt(preparedParams.limit, 10) || 30;
        preparedParams.limit = String(limitNumber);
        preparedParams.offset = String((pageNumber - 1) * limitNumber);
        delete preparedParams.page;
      }

      Object.entries(preparedParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${API_BASE_URL}/historial?${queryParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en historialService.getAll:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor',
        error
      };
    }
  }
}

export default historialService;

