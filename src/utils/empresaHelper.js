// Helper para obtener información de la empresa desde localStorage
export const getEmpresaInfo = () => {
  try {
    const sucursalGuardada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalGuardada) {
      const sucursal = JSON.parse(sucursalGuardada);
      return sucursal.empresas || null;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener información de la empresa:', error);
    return null;
  }
};

// Función para verificar si la empresa es Damabrava
export const isDamabrava = () => {
  const empresa = getEmpresaInfo();
  return empresa && empresa.name === 'Damabrava';
};

// Función para obtener el nombre de la empresa
export const getEmpresaName = () => {
  const empresa = getEmpresaInfo();
  return empresa ? empresa.name : null;
};

// Función para verificar si la empresa es solo de ventas (no producción)
// Esta función debe recibir el user del contexto, no usar localStorage
export const isSoloVentas = (user) => {
  if (!user || !user.empresa) return false;
  return user.empresa.tipo === 'ventas';
};

// Función para verificar si la empresa tiene producción
export const tieneProduccion = (user) => {
  if (!user || !user.empresa) return false;
  return user.empresa.tipo === 'ventas_produccion';
};