import { useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import historialService from '../../services/historialService';

const decodeTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn('HistorialLogger: no se pudo decodificar el token', error);
    return null;
  }
};

const sanitizeValue = (value) => {
  if (value === undefined) return null;
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return String(value);
    }
  }
  return value;
};

const isValueEqual = (a, b) => {
  const sanitizedA = sanitizeValue(a);
  const sanitizedB = sanitizeValue(b);
  return JSON.stringify(sanitizedA) === JSON.stringify(sanitizedB);
};

const resolveEmpresaId = ({
  override,
  user,
  employee,
  userSucursal,
  employeeSucursal,
  tokenPayload
}) => {
  if (override) return override;
  if (user && user.empresa_id) return user.empresa_id;
  if (employee && employee.empresa_id) return employee.empresa_id;
  if (userSucursal && userSucursal.empresa_id) return userSucursal.empresa_id;
  if (userSucursal && userSucursal.empresas && userSucursal.empresas.id) {
    return userSucursal.empresas.id;
  }
  if (employeeSucursal && employeeSucursal.empresa_id) {
    return employeeSucursal.empresa_id;
  }
  if (employeeSucursal && employeeSucursal.empresas && employeeSucursal.empresas.id) {
    return employeeSucursal.empresas.id;
  }
  if (tokenPayload && tokenPayload.empresa_id) return tokenPayload.empresa_id;

  const storedEmpresa = localStorage.getItem('empresa_id');
  if (storedEmpresa) {
    try {
      return JSON.parse(storedEmpresa);
    } catch (error) {
      return storedEmpresa;
    }
  }

  return null;
};

const resolveActorIds = ({
  tokenPayload,
  user,
  employee,
  userOverride,
  personalOverride
}) => {
  if (userOverride || personalOverride) {
    return {
      userId: userOverride || null,
      personalId: personalOverride || null
    };
  }

  if (tokenPayload) {
    if (tokenPayload.type === 'employee') {
      return {
        userId: null,
        personalId: tokenPayload.id || employee?.id || null
      };
    }

    if (tokenPayload.type === 'user') {
      return {
        userId: tokenPayload.id || user?.id || null,
        personalId: null
      };
    }
  }

  if (employee && employee.id) {
    return {
      userId: null,
      personalId: employee.id
    };
  }

  if (user && user.id) {
    return {
      userId: user.id,
      personalId: null
    };
  }

  return {
    userId: null,
    personalId: null
  };
};

const buildDetallesPayload = ({
  accion,
  campos,
  datosAntes,
  datosDespues,
  comentario
}) => {
  const camposDetalle = {};
  const camposObjetivo = campos && campos.length > 0
    ? campos
    : Array.from(new Set([
        ...Object.keys(datosAntes || {}),
        ...Object.keys(datosDespues || {})
      ]));

  camposObjetivo.forEach((campo) => {
    const valorAntes = datosAntes ? sanitizeValue(datosAntes[campo]) : undefined;
    const valorDespues = datosDespues ? sanitizeValue(datosDespues[campo]) : undefined;

    if (accion === 'CREAR') {
      if (valorDespues !== undefined && valorDespues !== null && valorDespues !== '') {
        camposDetalle[campo] = { despues: valorDespues };
      }
      return;
    }

    if (accion === 'ELIMINAR') {
      if (valorAntes !== undefined && valorAntes !== null && valorAntes !== '') {
        camposDetalle[campo] = { antes: valorAntes };
      }
      return;
    }

    // Acciones tipo EDITAR u otras
    if (!isValueEqual(valorAntes, valorDespues)) {
      camposDetalle[campo] = {
        antes: valorAntes ?? null,
        despues: valorDespues ?? null
      };
    }
  });

  return {
    campos: camposDetalle,
    comentario: comentario || ''
  };
};

const useHistorialLogger = (options = {}) => {
  const {
    modulo: moduloPorDefecto = 'General',
    campos: camposConfiguracion = [],
    comentario: comentarioPorDefecto = ''
  } = options;

  const {
    user,
    sucursalSeleccionada: sucursalUsuario
  } = useUser();
  const {
    employee,
    sucursalSeleccionada: sucursalEmpleado
  } = useEmployee();

  const logAccion = useCallback(async ({
    modulo = moduloPorDefecto,
    accion,
    lugarAfectado,
    registroId = null,
    datosAntes = null,
    datosDespues = null,
    comentario = comentarioPorDefecto,
    detallesPersonalizados = null,
    empresaId: empresaOverride = null,
    userId: userOverride = null,
    personalId: personalOverride = null,
    campos: camposPersonalizados = null,
    fecha = null
  }) => {
    try {
      if (!accion || !lugarAfectado) {
        console.warn('HistorialLogger: acción y lugar_afectado son obligatorios');
        return { success: false, message: 'Datos insuficientes para registrar historial' };
      }

      const tokenPayload = decodeTokenPayload();
      const empresaId = resolveEmpresaId({
        override: empresaOverride,
        user,
        employee,
        userSucursal: sucursalUsuario,
        employeeSucursal: sucursalEmpleado,
        tokenPayload
      });

      if (!empresaId) {
        console.warn('HistorialLogger: no se pudo resolver empresa_id');
        return { success: false, message: 'No se pudo resolver empresa_id' };
      }

      const { userId, personalId } = resolveActorIds({
        tokenPayload,
        user,
        employee,
        userOverride,
        personalOverride
      });

      const detalles = detallesPersonalizados || buildDetallesPayload({
        accion: accion.toUpperCase(),
        campos: camposPersonalizados || camposConfiguracion,
        datosAntes,
        datosDespues,
        comentario
      });

      const payload = {
        modulo,
        accion: accion.toUpperCase(),
        lugar_afectado: lugarAfectado,
        registro_id: registroId || null,
        empresa_id: empresaId,
        detalles
      };

      if (fecha) {
        payload.fecha = fecha;
      }

      if (userId) {
        payload.user_id = userId;
      }

      if (personalId) {
        payload.personal_id = personalId;
      }

      const response = await historialService.create(payload);

      if (!response.success) {
        console.warn('HistorialLogger: no se pudo registrar el historial', response);
      }

      return response;
    } catch (error) {
      console.error('HistorialLogger: error inesperado al registrar historial', error);
      return {
        success: false,
        message: 'Error inesperado al registrar historial',
        error
      };
    }
  }, [
    moduloPorDefecto,
    comentarioPorDefecto,
    camposConfiguracion,
    user,
    employee,
    sucursalUsuario,
    sucursalEmpleado
  ]);

  const buildDetalles = useCallback((params) => {
    return buildDetallesPayload({
      ...params,
      campos: params?.campos || camposConfiguracion
    });
  }, [camposConfiguracion]);

  return {
    logAccion,
    buildDetalles
  };
};

export default useHistorialLogger;

