import React, { useState, useEffect, useMemo, useRef } from 'react';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import RefreshIndicator from '../../common/RefreshIndicator';
import Boton from '../../common/Boton';
import FiltroFecha, { formatDateRangeForDisplay } from '../../mixed/FiltroFecha';
import EditarAgregarGasto from '../gastos/EditarAgregarGasto';
import Dato from '../../common/Dato';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import styles from '../../../styles/view.module.css';
import balanceStyles from './Balance.module.css';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import gastosService from '../../../services/gastosService';
import deudasService from '../../../services/deudasService';

const obtenerFechaSinHora = (valor) => {
  if (!valor) return null;

  if (typeof valor === 'string') {
    const normalizado = valor.trim();

    if (normalizado.includes('T')) {
      return normalizado.split('T')[0];
    }

    if (normalizado.includes(' ')) {
      return normalizado.split(' ')[0];
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizado)) {
      return normalizado;
    }
  }

  const date = new Date(valor);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calcularTotalMovimiento = (mov) => {
  if (!mov?.productos || mov.productos.length === 0) return 0;

  const subtotal = mov.productos.reduce((sum, prod) => {
    const subtotalDeclarado = Number(prod.subtotal);
    if (!Number.isNaN(subtotalDeclarado)) {
      return sum + subtotalDeclarado;
    }

    const cantidad = Number(prod.cantidad) || 0;
    const precio = Number(prod.precio_unitario) || 0;
    return sum + (cantidad * precio);
  }, 0);

  const descuento = Number(mov.descuento) || 0;
  const aumento = Number(mov.aumento) || 0;

  const total = subtotal - descuento + aumento;
  return Number.isNaN(total) ? 0 : Number(total.toFixed(2));
};

const Balance = ({ isOpen, setIsOpen }) => {
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [datosBalance, setDatosBalance] = useState({
    ingresos: { total: 0 },
    salidas: { total: 0 }
  });
  const [gastosData, setGastosData] = useState([]);
  const [movimientosAlmacenData, setMovimientosAlmacenData] = useState([]);
  const [deudasData, setDeudasData] = useState([]);

  // Estados para EditarAgregarGasto
  const [isEditarAgregarGastoOpen, setIsEditarAgregarGastoOpen] = useState(false);

  // Estado para FiltroFecha
  const [isFechaModalOpen, setIsFechaModalOpen] = useState(false);

  // Ref para rastrear si el componente estaba abierto anteriormente
  const prevIsOpenRef = useRef(false);

  // Función para mostrar notificaciones
  const mostrarNotificacion = (tipo, texto) => {
    console.log(`${tipo.toUpperCase()}: ${texto}`);
  };

  const handleFechaChange = (startDate, endDate) => {
    setFechaInicio(startDate);
    setFechaFin(endDate);
    cargarDatosBalance(startDate, endDate);
  };

  const cargarDatosBalance = async (startDate = fechaInicio, endDate = fechaFin) => {
    setIsLoading(true);
    setShowRefreshIndicator(true);
    setIsRefreshing(true);

    try {
      // Configurar fechas correctamente para el filtrado
      const fechaInicioAjustada = new Date(startDate);
      fechaInicioAjustada.setHours(0, 0, 0, 0); // Inicio del día

      const fechaFinAjustada = new Date(endDate);
      fechaFinAjustada.setHours(23, 59, 59, 999); // Final del día

      // Formatear fechas para la consulta
      const fechaInicioFormateada = fechaInicioAjustada.toISOString();
      const fechaFinFormateada = fechaFinAjustada.toISOString();
      const fechaInicioStr = obtenerFechaSinHora(fechaInicioAjustada);
      const fechaFinStr = obtenerFechaSinHora(fechaFinAjustada);

      if (!fechaInicioStr || !fechaFinStr) {
        throw new Error('No se pudieron preparar las fechas para el filtrado');
      }

      // Hacer las 3 peticiones en paralelo para mejorar el rendimiento
      // Usar filtros de fecha en el servidor para optimizar rendimiento
      const filtroFechaISO = {
        inicio: fechaInicioFormateada,
        fin: fechaFinFormateada
      };

      // Usar getAll con límite alto (999999) para obtener todos los registros filtrados por fecha y tipo
      // Solo movimientos de tipo 'salida' y estado 'finalizado', ya filtrados por fecha en el servidor
      const [movimientosAlmacenResponse, gastosResponse, deudasResponse] = await Promise.all([
        movimientosAlmacenService.getAll(1, 999999, 'salida', 'finalizado', 'fecha_desc', null, null, null, filtroFechaISO),
        gastosService.getAll(1, 999999, '', null, null, 'fecha_desc', null, filtroFechaISO),
        deudasService.getAll(1, 999999, '', null, null, 'fecha_desc', null, filtroFechaISO)
      ]);

      // Los movimientos ya vienen filtrados por tipo 'salida', estado 'finalizado' y fecha del servidor
      // Solo necesitamos excluir los anulados
      const salidasAlmacen = movimientosAlmacenResponse.data?.filter(mov => {
        return mov.estado !== 'anulado';
      }) || [];

      // Los gastos ya vienen filtrados por fecha del servidor
      const gastosPeriodo = gastosResponse.data || [];

      // Filtrar deudas pendientes del período (ya vienen filtradas por fecha del servidor)
      const deudasPendientes = deudasResponse.data?.filter(deuda => {
        return deuda.estado === 'pendiente';
      }) || [];

      // Guardar datos para actualización directa y para VerBalance
      setGastosData(gastosResponse.data || []);
      setMovimientosAlmacenData(movimientosAlmacenResponse.data || []);
      setDeudasData(deudasResponse.data || []);

      // Calcular totales
      const totalIngresos = salidasAlmacen.reduce((sum, mov) => {
        return sum + calcularTotalMovimiento(mov);
      }, 0);

      const totalGastos = gastosPeriodo.reduce((sum, gasto) => {
        return sum + (gasto.valor || 0);
      }, 0);

      // Calcular total de deudas pendientes
      const totalDeudasPendientes = deudasPendientes.reduce((sum, deuda) => {
        return sum + (deuda.saldo_pendiente || 0);
      }, 0);

      // Los ingresos reales son las ventas menos las deudas pendientes
      const ingresosReales = totalIngresos - totalDeudasPendientes;
      const totalEgresos = totalGastos;

      setDatosBalance({
        ingresos: { total: ingresosReales },
        salidas: { total: totalEgresos }
      });

    } catch (error) {
      console.error('Error cargando datos del balance:', error);
      mostrarNotificacion('error', 'Error al cargar datos del balance');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsRefreshing(false);
        setTimeout(() => {
          setShowRefreshIndicator(false);
        }, 1000);
      }, 500);
    }
  };

  const handleRefresh = async () => {
    await cargarDatosBalance();
  };

  const handleNuevoGasto = () => {
    setIsEditarAgregarGastoOpen(true);
  };


  const handleGastoCreated = (gastoData) => {
    console.log('Gasto creado:', gastoData);
    mostrarNotificacion('success', 'Gasto registrado correctamente');

    // Actualizar balance directamente sin hacer nueva petición
    // Verificar si el gasto está dentro del período seleccionado (comparar solo fechas)
    const fechaGasto = obtenerFechaSinHora(gastoData.fecha_gasto); // Garantizar formato YYYY-MM-DD
    const fechaInicioStr = obtenerFechaSinHora(fechaInicio);
    const fechaFinStr = obtenerFechaSinHora(fechaFin);

    if (
      fechaGasto &&
      fechaInicioStr &&
      fechaFinStr &&
      fechaGasto >= fechaInicioStr &&
      fechaGasto <= fechaFinStr
    ) {
      // Agregar el nuevo gasto a los datos locales
      const nuevoGasto = {
        id: gastoData.id,
        fecha_gasto: gastoData.fecha_gasto,
        valor: gastoData.valor,
        concepto: gastoData.concepto,
        metodo_pago: gastoData.metodo_pago,
        proveedor_id: gastoData.proveedor_id
      };

      // Actualizar gastosData
      const gastosActualizados = [...gastosData, nuevoGasto];
      setGastosData(gastosActualizados);

      // Recalcular egresos con el nuevo gasto
      setDatosBalance(prevBalance => {
        const nuevoTotalEgresos = prevBalance.salidas.total + gastoData.valor;
        return {
          ...prevBalance,
          salidas: { total: nuevoTotalEgresos }
        };
      });
    }
  };

  const balance = datosBalance.ingresos.total - datosBalance.salidas.total;

  // Calcular porcentajes para el gráfico circular
  const total = datosBalance.ingresos.total + datosBalance.salidas.total;
  const porcentajeIngresos = total > 0 ? (datosBalance.ingresos.total / total) * 100 : 0;
  const porcentajeEgresos = total > 0 ? (datosBalance.salidas.total / total) * 100 : 0;

  // Datos para el gráfico circular
  const chartData = [
    { name: 'Ingresos', value: datosBalance.ingresos.total, percentage: porcentajeIngresos, color: '#48ec56' },
    { name: 'Egresos', value: datosBalance.salidas.total, percentage: porcentajeEgresos, color: '#cf3838' }
  ];

  // Calcular porcentajes de cambio (simulado por ahora, puedes calcularlo comparando con período anterior)
  const cambioIngresos = 4; // Porcentaje de cambio
  const cambioEgresos = 15; // Porcentaje de cambio

  // Calcular detalles de ingresos
  const detallesIngresos = useMemo(() => {
    if (!movimientosAlmacenData) return { totalVentas: 0, totalEfectivo: 0, totalOtros: 0 };

    const ventas = movimientosAlmacenData.filter(mov => mov.type === 'salida' && mov.estado !== 'anulado');
    const totalVentas = ventas.length;

    let totalEfectivo = 0;
    let totalOtros = 0;

    ventas.forEach(venta => {
      if (venta.productos && venta.productos.length > 0) {
        const totalVenta = venta.productos.reduce((sum, prod) => {
          const subtotalDeclarado = Number(prod.subtotal);
          if (!Number.isNaN(subtotalDeclarado)) {
            return sum + subtotalDeclarado;
          }
          const cantidad = Number(prod.cantidad) || 0;
          const precio = Number(prod.precio_unitario) || 0;
          return sum + (cantidad * precio);
        }, 0);

        // Revisar el método de pago real de la venta
        if (venta.metodo_pago === 'efectivo') {
          totalEfectivo += totalVenta;
        } else {
          totalOtros += totalVenta;
        }
      }
    });

    return { totalVentas, totalEfectivo, totalOtros };
  }, [movimientosAlmacenData]);

  // Calcular detalles de egresos
  const detallesEgresos = useMemo(() => {
    if (!gastosData) return { totalGastos: 0, totalEfectivo: 0, totalOtros: 0 };

    const totalGastos = gastosData.length;
    let totalEfectivo = 0;
    let totalOtros = 0;

    gastosData.forEach(gasto => {
      if (gasto.metodo_pago === 'efectivo') {
        totalEfectivo += gasto.valor || 0;
      } else {
        totalOtros += gasto.valor || 0;
      }
    });

    return { totalGastos, totalEfectivo, totalOtros };
  }, [gastosData]);

  // Cargar datos solo cuando se abre el componente (no cuando se cierra)
  useEffect(() => {
    // Solo cargar si cambió de cerrado a abierto
    if (isOpen && !prevIsOpenRef.current) {
      cargarDatosBalance(fechaInicio, fechaFin);
    }
    // Actualizar el ref con el valor actual
    prevIsOpenRef.current = isOpen;
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
      <HeaderView onBack={() => setIsOpen(false)} title="Balance" />
      <div className={styles.container}>

        <RefreshIndicator
          isVisible={showRefreshIndicator}
          isLoading={isRefreshing}
        />

        {/* Selector de fecha con FiltroFecha */}
        <Boton
          className='btn-gray'
          label={formatDateRangeForDisplay(fechaInicio, fechaFin, 'Seleccionar rango de fechas')}
          onClick={() => setIsFechaModalOpen(true)}
        />

        {/* Componente de Balance - Nuevo diseño */}
        <div className={balanceStyles.balanceCard}>
          {/* Contenido principal */}
          <div className={balanceStyles.balanceContent}>
            {/* Lado izquierdo: Balance, Ingresos y Gastos */}
            <div className={balanceStyles.balanceLeft}>
              {/* Balance restante */}
              <div className={balanceStyles.balanceRemaining}>
                <div className={balanceStyles.balanceAmount}>
                  Bs. {balance.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={balanceStyles.balanceLabel}>Total</div>
              </div>

              {/* Ingresos */}
              <div className={balanceStyles.incomeSection}>
                <div className={balanceStyles.incomeAmount}>
                  Bs. {datosBalance.ingresos.total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className={balanceStyles.percentageInline}>+{porcentajeIngresos.toFixed(1)}%</span>
                </div>
                <div className={balanceStyles.incomeLabel}>Ingresos</div>
              </div>

              {/* Egresos */}
              <div className={balanceStyles.expenseSection}>
                <div className={balanceStyles.expenseAmount}>
                  Bs. {datosBalance.salidas.total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className={balanceStyles.percentageInline}>-{porcentajeEgresos.toFixed(1)}%</span>
                </div>
                <div className={balanceStyles.expenseLabel}>Egresos</div>
              </div>
            </div>

            {/* Lado derecho: Gráfico circular */}
            <div className={balanceStyles.balanceRight}>
              <div className={balanceStyles.circularChart}>
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <defs>
                      {/* Gradiente lineal para Ingresos (verde) - más visible */}
                      <linearGradient id="gradientIngresos" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6ef07a" stopOpacity={1} />
                        <stop offset="50%" stopColor="#48ec56" stopOpacity={1} />
                        <stop offset="100%" stopColor="#2dd43a" stopOpacity={1} />
                      </linearGradient>
                      {/* Gradiente lineal para Egresos (rojo) - más visible */}
                      <linearGradient id="gradientEgresos" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e85a5a" stopOpacity={1} />
                        <stop offset="50%" stopColor="#cf3838" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a02a2a" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={35}
                      paddingAngle={0}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                      strokeLinecap="round"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.name === 'Ingresos' ? 'url(#gradientIngresos)' : 'url(#gradientEgresos)'}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen Ingresos */}
        <h3 className={styles.subTitle}>Resumen Ingresos</h3>
        <div className={styles.content}>

          <Dato
            label="Total de Ventas"
            value={detallesIngresos.totalVentas.toString()}
            icon="cart"
            vertical={false}
          />
          <Dato
            label="Total Efectivo"
            value={`Bs. ${detallesIngresos.totalEfectivo.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="money"
            vertical={false}
          />
          <Dato
            label="Total Otros"
            value={`Bs. ${detallesIngresos.totalOtros.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="credit-card"
            vertical={false}
          />
        </div>

        {/* Resumen Egresos */}
        <h3 className={styles.subTitle}>Resumen Egresos</h3>
        <div className={styles.content}>
          <Dato
            label="Total de Gastos"
            value={detallesEgresos.totalGastos.toString()}
            icon="receipt"
            vertical={false}
          />
          <Dato
            label="Total Efectivo"
            value={`Bs. ${detallesEgresos.totalEfectivo.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="money"
            vertical={false}
          />
          <Dato
            label="Total Otros"
            value={`Bs. ${detallesEgresos.totalOtros.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="credit-card"
            vertical={false}
          />
        </div>

        {/* Botones */}
        <Boton
          className='btn-red'
          label='Nuevo Gasto'
          onClick={handleNuevoGasto}
          style={{ marginTop: 'auto' }}
        />

      </div>

      {/* Modal de EditarAgregarGasto para nuevo gasto */}
      <EditarAgregarGasto
        isOpen={isEditarAgregarGastoOpen}
        setIsOpen={setIsEditarAgregarGastoOpen}
        onGastoCreated={handleGastoCreated}
      />

      {/* Modal de FiltroFecha */}
      <FiltroFecha
        isOpen={isFechaModalOpen}
        setIsOpen={setIsFechaModalOpen}
        startDate={fechaInicio}
        endDate={fechaFin}
        onApply={handleFechaChange}
        onClear={() => {
          const today = new Date();
          handleFechaChange(today, today);
        }}
        title="Seleccionar rango de fechas"
      />
    </View>
  );
};

export default Balance;
