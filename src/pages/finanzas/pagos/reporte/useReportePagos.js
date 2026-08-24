import { useState, useCallback } from 'react';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';
import { useToast } from '../../../../context/ToastContext';
import gastosService from '../../../../services/gastosService';
import useFormatNumber from '../../../../hooks/useFormatNumber';

/**
 * Hook builder del reporte de Pagos.
 * A diferencia de Clientes, la tabla de Pagos carga de 30 en 30 (remota),
 * así que no alcanza con lo que ya está en pantalla: se vuelve a pedir todo
 * el rango de fechas filtrado (con los mismos filtros activos) a
 * gastosService.getAllSinLimite antes de armar el reporte.
 */
// Formatea 'YYYY-MM-DD' (o con hora, ej. de la BD) a 'DD/MM/YYYY' SIN pasar por
// Date/timeZone: new Date('YYYY-MM-DD') se interpreta como UTC medianoche y al
// mostrarla en America/La_Paz (UTC-4) retrocede un día (31/07 en vez de 01/08).
const formatFechaSimple = (dateStr) => {
  if (!dateStr) return '';
  const soloFecha = dateStr.toString().split('T')[0];
  const [y, m, d] = soloFecha.split('-');
  if (!y || !m || !d) return soloFecha;
  return `${d}/${m}/${y}`;
};

export function useReportePagos() {
  const { sucursalSeleccionada: userSucursal } = useUser();
  const { sucursalSeleccionada: employeeSucursal } = useEmployee();
  const sucursal = userSucursal || employeeSucursal;
  const { showWarning, showDanger } = useToast();
  const { formatPrice } = useFormatNumber();

  const [isLoading, setIsLoading] = useState(false);
  const [isDescargaOpen, setIsDescargaOpen] = useState(false);
  const [datosReporte, setDatosReporte] = useState({});

  const generarReporte = useCallback(async ({ metodoPago = null, proveedorId = null, filtroFecha = null, search = '' } = {}) => {
    if (!filtroFecha?.inicio || !filtroFecha?.fin) {
      showWarning('Falta el rango de fechas', 'Selecciona un rango de fechas para descargar el reporte de pagos');
      return;
    }

    setIsLoading(true);
    try {
      const res = await gastosService.getAllSinLimite(null, metodoPago, filtroFecha, proveedorId, search);
      if (!res?.success || !Array.isArray(res.data)) {
        showDanger('Error', res?.message || 'No se pudieron obtener los pagos');
        return;
      }
      if (res.data.length === 0) {
        showWarning('Aviso', 'No hay pagos en el período seleccionado');
        return;
      }

      const gastosOrdenados = [...res.data].sort((a, b) => new Date(a.fecha_gasto) - new Date(b.fecha_gasto));

      const tablaHeaders = ['Fecha', 'Registrado Por', 'Concepto', 'M. Pago', 'Proveedor', 'Monto'];
      const tablaValores = gastosOrdenados.map((g) => [
        formatFechaSimple(g.fecha_gasto) || '--',
        g.user?.name || g.personal?.name || '--',
        g.concepto || '--',
        g.metodo_pago ? g.metodo_pago.charAt(0).toUpperCase() + g.metodo_pago.slice(1) : '--',
        g.proveedor?.name || '--',
        `Bs. ${formatPrice(g.valor)}`
      ]);

      // Bloque de finanzas al final del reporte (igual que en movimientos):
      // los hooks de descarga excluyen 'Total' del bloque superior y lo
      // agregan como fila de cierre debajo de la tabla, sumando todo.
      const totalGeneral = gastosOrdenados.reduce((sum, g) => sum + (parseFloat(g.valor) || 0), 0);

      const fInicioStr = formatFechaSimple(filtroFecha.inicio);
      const fFinStr = formatFechaSimple(filtroFecha.fin);
      const periodo = fInicioStr === fFinStr ? fFinStr : `${fInicioStr} a ${fFinStr}`;

      const informacionSuperior = {
        'Tipo de Reporte': 'Pagos',
        'Sucursal': sucursal?.name || 'Sucursal no seleccionada',
        'Período': periodo,
        'Fecha de generación': new Date().toLocaleDateString('es-BO'),
        'Total de Registros': gastosOrdenados.length.toString(),
        'Total': `Bs. ${formatPrice(totalGeneral)}`
      };

      // Anchos personalizados por texto de header (Concepto es el que más ancho necesita)
      const columnWidths = {
        'Fecha': '12%',
        'Registrado Por': '16%',
        'Concepto': '30%',
        'M. Pago': '14%',
        'Proveedor': '18%',
        'Monto': '10%'
      };

      setDatosReporte({ informacionSuperior, tablaHeaders, tablaValores, columnWidths });
      setIsDescargaOpen(true);
    } catch (error) {
      console.error('Error generando reporte de pagos:', error);
      showDanger('Error', 'Error al generar el reporte de pagos');
    } finally {
      setIsLoading(false);
    }
  }, [sucursal, showWarning, showDanger]);

  return { generarReporte, isLoading, isDescargaOpen, setIsDescargaOpen, datosReporte };
}

export default useReportePagos;
