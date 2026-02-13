import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import RefreshIndicator from '../../common/RefreshIndicator';
import Boton from '../../common/Boton';
import FiltroFecha, { formatDateRangeForDisplay } from '../../mixed/FiltroFecha';
import EditarAgregarGasto from '../gastos/EditarAgregarGasto';
import Dato from '../../common/Dato';
import ItemView from '../../common/ItemView';
import InputSelect from '../../common/inputs/InputSelect';
import ModalDescarga from '../../ui/ModalDescarga';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import styles from '../../../styles/view.module.css';
import balanceStyles from './Balance.module.css';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import gastosService from '../../../services/gastosService';
import deudasService from '../../../services/deudasService';
import { useUser } from '../../../context/UserContext';
import { isDamabrava, isSoloVentas } from '../../../utils/empresaHelper';
import { useToast } from '../../../context/ToastContext';
import { useGenerarReporte } from '../../../hooks/useGenerarReporte';

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
  const { user } = useUser();
  const soloVentas = isSoloVentas(user);
  const { showSuccess, showDanger, showWarning, showInfo } = useToast();
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [areaSeleccionada, setAreaSeleccionada] = useState('ventas');
  const [isLoading, setIsLoading] = useState(false);
  const mostrarNotificacion = useCallback((tipo, titulo, detalle, duracion = 5000) => {
    if (tipo === 'success') showSuccess(titulo, detalle, duracion);
    else if (tipo === 'error') showDanger(titulo, detalle, duracion, false);
    else if (tipo === 'warning') showWarning(titulo, detalle, duracion);
    else showInfo(titulo, detalle, duracion);
  }, [showSuccess, showDanger, showWarning, showInfo]);
  const {
    handleGenerarReporte,
    isLoading: isLoadingReporte,
    datosReporte,
    isDescargaOpen,
    setIsDescargaOpen
  } = useGenerarReporte(fechaInicio, fechaFin, areaSeleccionada, mostrarNotificacion);
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [datosBalance, setDatosBalance] = useState({
    ingresos: { total: 0 },
    salidas: { total: 0 }
  });
  // Resumen del balance: total ventas, total gastos, total efectivo/otros (por ventas), total deudas (saldos)
  const [resumenBalance, setResumenBalance] = useState({
    totalVentas: 0,
    totalGastos: 0,
    totalDeudasSaldos: 0,
    totalEfectivo: 0,
    totalOtros: 0
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

      // 1) Total ventas y desglose efectivo/otros (por metodo_pago de cada venta)
      let totalVentas = 0;
      let totalEfectivo = 0;
      let totalOtros = 0;
      salidasAlmacen.forEach(mov => {
        const monto = calcularTotalMovimiento(mov);
        totalVentas += monto;
        if (mov.metodo_pago === 'efectivo') {
          totalEfectivo += monto;
        } else {
          totalOtros += monto;
        }
      });

      // 2) Total gastos (solo montos)
      const totalGastos = gastosPeriodo.reduce((sum, gasto) => sum + (Number(gasto.valor) || 0), 0);

      // 3) Total deudas: solo saldos pendientes (no montos totales)
      const totalDeudasSaldos = deudasPendientes.reduce((sum, deuda) => sum + (Number(deuda.saldo_pendiente) || 0), 0);

      // Ingresos = ventas. Egresos = gastos + deudas (saldos). Balance = ventas - gastos - deudas
      const totalEgresos = totalGastos + totalDeudasSaldos;

      setResumenBalance({
        totalVentas,
        totalGastos,
        totalDeudasSaldos,
        totalEfectivo,
        totalOtros
      });
      setDatosBalance({
        ingresos: { total: totalVentas },
        salidas: { total: totalEgresos }
      });

    } catch (error) {
      console.error('Error cargando datos del balance:', error);
      mostrarNotificacion('error', 'Error', 'Error al cargar datos del balance');
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


  const handleNuevoGasto = () => {
    setIsEditarAgregarGastoOpen(true);
  };


  const handleGastoCreated = (gastoData) => {
    console.log('Gasto creado:', gastoData);
    mostrarNotificacion('success', 'Éxito', 'Gasto registrado correctamente');

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

      const valor = Number(gastoData.valor) || 0;
      setResumenBalance(prev => ({
        ...prev,
        totalGastos: prev.totalGastos + valor
      }));
      setDatosBalance(prev => ({
        ...prev,
        salidas: { total: prev.salidas.total + valor }
      }));
    }
  };

  const balance = datosBalance.ingresos.total - datosBalance.salidas.total;

  // Total para el gráfico: ventas + gastos + deudas (tres segmentos)
  const totalChart = datosBalance.ingresos.total + resumenBalance.totalGastos + resumenBalance.totalDeudasSaldos;
  const porcentajeVentas = totalChart > 0 ? (datosBalance.ingresos.total / totalChart) * 100 : 0;
  const porcentajeGastos = totalChart > 0 ? (resumenBalance.totalGastos / totalChart) * 100 : 0;
  const porcentajeDeudas = totalChart > 0 ? (resumenBalance.totalDeudasSaldos / totalChart) * 100 : 0;

  // Datos para el gráfico circular: Ventas (verde), Gastos (rojo), Deudas (azul); si todo es 0 → gris
  const hasData = totalChart > 0;
  const chartData = hasData
    ? [
      { name: 'Ventas', value: datosBalance.ingresos.total, percentage: porcentajeVentas, color: '#48ec56' },
      { name: 'Gastos', value: resumenBalance.totalGastos, percentage: porcentajeGastos, color: '#cf3838' },
      { name: 'Deudas', value: resumenBalance.totalDeudasSaldos, percentage: porcentajeDeudas, color: '#4a90d9' }
    ]
    : [{ name: 'Sin datos', value: 1, color: '#9e9e9e' }];

  // Mismas opciones de área que en Reportes
  const opcionesArea = [
    { value: 'ventas', label: 'Ventas' },
    { value: 'almacen_general', label: 'Almacen General' },
    ...(soloVentas ? [] : [{ value: 'materia_Prima', label: 'Materia Prima' }]),
    { value: 'deudas', label: 'Deudas' },
    { value: 'gastos', label: 'Gastos' },
    ...(isDamabrava() ? [{ value: 'produccion', label: 'Producción (Damabrava)' }] : []),
  ];

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

        {/* Mitad izquierda: Resumen del balance. Mitad derecha: totales + gráfico */}
        <div className={styles.contentRow}>
          <div className={styles.contentHalf}>
            <div className={balanceStyles.balanceCard} style={{ height: '100%' }}>
              <div className={balanceStyles.balanceContent}>
                <div className={balanceStyles.balanceLeft}>
                  <div className={balanceStyles.balanceRemaining}>
                    <div className={balanceStyles.balanceAmount}>
                      Bs. {balance.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={balanceStyles.balanceLabel}>Total</div>
                  </div>
                  <div className={balanceStyles.incomeSection}>
                    <div className={balanceStyles.incomeAmount}>
                      Bs. {datosBalance.ingresos.total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className={balanceStyles.percentageInline}>+{porcentajeVentas.toFixed(1)}%</span>
                    </div>
                    <div className={balanceStyles.incomeLabel}>Ventas</div>
                  </div>
                  <div className={balanceStyles.expenseSection}>
                    <div className={balanceStyles.expenseAmount}>
                      Bs. {resumenBalance.totalGastos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className={balanceStyles.percentageInline}>-{porcentajeGastos.toFixed(1)}%</span>
                    </div>
                    <div className={balanceStyles.expenseLabel}>Gastos</div>
                  </div>
                  <div className={balanceStyles.deudasSection}>
                    <div className={balanceStyles.deudasAmount}>
                      Bs. {resumenBalance.totalDeudasSaldos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className={balanceStyles.percentageInline}>-{porcentajeDeudas.toFixed(1)}%</span>
                    </div>
                    <div className={balanceStyles.deudasLabel}>Deudas (saldos)</div>
                  </div>
                </div>
                <div className={balanceStyles.balanceRight}>
                  <div className={balanceStyles.chartWithLegend}>
                    <div className={balanceStyles.circularChart}>
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <defs>
                            <linearGradient id="gradientVentas" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#6ef07a" stopOpacity={1} />
                              <stop offset="50%" stopColor="#48ec56" stopOpacity={1} />
                              <stop offset="100%" stopColor="#2dd43a" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradientGastos" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#e85a5a" stopOpacity={1} />
                              <stop offset="50%" stopColor="#cf3838" stopOpacity={1} />
                              <stop offset="100%" stopColor="#a02a2a" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradientDeudas" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#6ba3e8" stopOpacity={1} />
                              <stop offset="50%" stopColor="#4a90d9" stopOpacity={1} />
                              <stop offset="100%" stopColor="#2d6bb5" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                          innerRadius={35}
                          outerRadius={63}
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
                                fill={hasData
                                  ? (entry.name === 'Ventas'
                                    ? 'url(#gradientVentas)'
                                    : entry.name === 'Gastos'
                                      ? 'url(#gradientGastos)'
                                      : 'url(#gradientDeudas)')
                                  : '#9e9e9e'}
                                stroke="none"
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className={balanceStyles.chartLegend}>
                      <div className={balanceStyles.legendItem}>
                        <span className={balanceStyles.legendLine} style={{ backgroundColor: '#48ec56' }} />
                        <span className={balanceStyles.legendLabel}>Ventas</span>
                      </div>
                      <div className={balanceStyles.legendItem}>
                        <span className={balanceStyles.legendLine} style={{ backgroundColor: '#cf3838' }} />
                        <span className={balanceStyles.legendLabel}>Gastos</span>
                      </div>
                      <div className={balanceStyles.legendItem}>
                        <span className={balanceStyles.legendLine} style={{ backgroundColor: '#4a90d9' }} />
                        <span className={balanceStyles.legendLabel}>Deudas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.contentHalf}>
            <div className={styles.content} style={{ height: '100%' }}>
              <ItemView
                title="Resumen del Balance"
                transparent={true}
                icon="trending-up"
                iconShape="square"
                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
              />
              <Dato
                label="Total efectivo"
                value={`Bs. ${resumenBalance.totalEfectivo.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon="money"
                vertical={false}
              />
              <Dato
                label="Total otros"
                value={`Bs. ${resumenBalance.totalOtros.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon="credit-card"
                vertical={false}
              />
            </div>
            <div className={styles.horizontal}>
              <InputSelect
                placeholder="Área"
                options={opcionesArea}
                value={areaSeleccionada}
                onChange={(valor) => setAreaSeleccionada(valor ?? '')}
              />
              <Boton
                className='btn-blue'
                label='Generar Reporte'
                onClick={handleGenerarReporte}
                disabled={isLoadingReporte}
                loading={isLoadingReporte}
                iconName="file-export"
              />
            </div>
          </div>

        </div>

        {/* Botones */}
        <Boton
          className='btn-red'
          label='Nuevo Gasto'
          onClick={handleNuevoGasto}
          style={{ marginTop: 'auto' }}
          iconName="plus"
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

      {/* Modal de descarga de reporte */}
      <ModalDescarga
        isOpen={isDescargaOpen}
        setIsOpen={setIsDescargaOpen}
        titulo="Descargar Reporte"
        subtitulo="Selecciona el formato que prefieras para descargar este reporte."
        nombreArchivo={`Reporte_${areaSeleccionada}_${fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-BO').replace(/\//g, '-') : ''}_${fechaFin ? new Date(fechaFin).toLocaleDateString('es-BO').replace(/\//g, '-') : ''}`}
        {...datosReporte}
      />
    </View>
  );
};

export default Balance;