import { useState, useCallback } from 'react';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';

/**
 * Hook builder del reporte de Clientes.
 * Recibe la lista de clientes ya filtrada (tal cual se ve en la vista)
 * y arma la estructura { informacionSuperior, tablaHeaders, tablaValores }
 * que espera DescargarDatos para exportar en excel, pdf o imagen.
 */
export function useReporteClientes() {
  // La sucursal ya no vive en localStorage (se limpia al seleccionarla, ver
  // UserContext/EmployeeContext), solo queda el id en 'sucursalIdSeleccionada'.
  // El objeto completo (con .name) se obtiene del contexto, igual que hace
  // clientService a través de apiClient con el id.
  const { sucursalSeleccionada: userSucursal } = useUser();
  const { sucursalSeleccionada: employeeSucursal } = useEmployee();
  const sucursal = userSucursal || employeeSucursal;

  const [isDescargaOpen, setIsDescargaOpen] = useState(false);
  const [datosReporte, setDatosReporte] = useState({});

  const generarReporte = useCallback((clientes = []) => {
    const tablaHeaders = ['Nombre', 'Descripción', 'Teléfono', 'Total Pedidos'];
    const tablaValores = clientes.map((c) => [
      c.name || '--',
      c.description || '--',
      c.phone || '--',
      String(c.total_orders ?? 0)
    ]);

    const informacionSuperior = {
      'Tipo de Reporte': 'Clientes',
      'Sucursal': sucursal?.name || 'Sucursal no seleccionada',
      'Fecha de generación': new Date().toLocaleDateString('es-BO'),
      'Total de Clientes': clientes.length.toString()
    };

    setDatosReporte({ informacionSuperior, tablaHeaders, tablaValores });
    setIsDescargaOpen(true);
  }, [sucursal]);

  return { generarReporte, isDescargaOpen, setIsDescargaOpen, datosReporte };
}

export default useReporteClientes;
