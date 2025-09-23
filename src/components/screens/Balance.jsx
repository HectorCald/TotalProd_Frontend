import React, { useState, useEffect } from 'react';
import Screen from '../ui/Screen';
import Select from '../common/Select';
import RefreshIndicator from '../common/RefreshIndicator';
import Boton from '../common/Boton';
import AlmacenGeneral from '../views/almacen-general/AlmacenGeneral';
import EditarAgregarGasto from '../views/gastos/EditarAgregarGasto';
import VerBalance from '../views/balance/VerBalance';
import styles from './Reportes.module.css';
import movimientosAlmacenService from '../../services/movimientosAlmacenService';
import gastosService from '../../services/gastosService';

const Balance = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('hoy');
  const [isLoading, setIsLoading] = useState(false);
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [datosBalance, setDatosBalance] = useState({
    ingresos: { total: 0 },
    salidas: { total: 0 }
  });
  const [gastosData, setGastosData] = useState([]);
  const [movimientosAlmacenData, setMovimientosAlmacenData] = useState([]);
  const [datosCargados, setDatosCargados] = useState(false);
  
  // Estados para AlmacenGeneral
  const [isAlmacenGeneralOpen, setIsAlmacenGeneralOpen] = useState(false);
  
  // Estados para EditarAgregarGasto
  const [isEditarAgregarGastoOpen, setIsEditarAgregarGastoOpen] = useState(false);
  
  // Estados para VerBalance
  const [isVerBalanceOpen, setIsVerBalanceOpen] = useState(false);

  // Función para mostrar notificaciones
  const mostrarNotificacion = (tipo, texto) => {
    console.log(`${tipo.toUpperCase()}: ${texto}`);
  };

  // Función para calcular fechas según el período
  const getFechasPeriodo = (periodo) => {
    const hoy = new Date();
    const fechaInicio = new Date();
    
    switch (periodo) {
      case 'hoy':
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case '1_semana':
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      case '1_mes':
        fechaInicio.setMonth(hoy.getMonth() - 1);
        break;
      case '3_meses':
        fechaInicio.setMonth(hoy.getMonth() - 3);
        break;
      case '6_meses':
        fechaInicio.setMonth(hoy.getMonth() - 6);
        break;
      case '1_año':
        fechaInicio.setFullYear(hoy.getFullYear() - 1);
        break;
      default:
        fechaInicio.setHours(0, 0, 0, 0);
    }
    
    return {
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: hoy.toISOString(),
      fechaInicioFormateada: fechaInicio.toLocaleDateString('es-ES'),
      fechaFinFormateada: hoy.toLocaleDateString('es-ES')
    };
  };

  const opcionesPeriodo = [
    { value: 'hoy', label: 'Hoy', icon: 'calendar' },
    { value: '1_semana', label: '1 Semana', icon: 'calendar' },
    { value: '1_mes', label: '1 Mes', icon: 'calendar' },
    { value: '3_meses', label: '3 Meses', icon: 'calendar' },
    { value: '6_meses', label: '6 Meses', icon: 'calendar' },
    { value: '1_año', label: '1 Año', icon: 'calendar' }
  ];

  const handlePeriodoChange = (valor) => {
    setPeriodoSeleccionado(valor);
    console.log('Período seleccionado:', valor);
    cargarDatosBalance(valor);
  };

  const cargarDatosBalance = async (periodo = periodoSeleccionado) => {
    setIsLoading(true);
    setShowRefreshIndicator(true);
    setIsRefreshing(true);

    try {
      const fechas = getFechasPeriodo(periodo);
      
      // Hacer las 2 peticiones en paralelo para mejorar el rendimiento
      const [movimientosAlmacenResponse, gastosResponse] = await Promise.all([
        movimientosAlmacenService.getAllSinLimite(),
        gastosService.getAllSinLimite()
      ]);

      // Filtrar movimientos de almacén (salidas = ingresos/ventas)
      const salidasAlmacen = movimientosAlmacenResponse.data?.filter(mov => 
        mov.type === 'salida' && 
        new Date(mov.fecha) >= new Date(fechas.fechaInicio) && 
        new Date(mov.fecha) <= new Date(fechas.fechaFin)
      ) || [];

      // Filtrar gastos por período (incluye gastos de entradas de acopio + gastos manuales)
      const gastosPeriodo = gastosResponse.data?.filter(gasto => {
        // fecha_gasto es tipo DATE (YYYY-MM-DD), comparar solo fechas
        const fechaGasto = gasto.fecha_gasto; // Ya es YYYY-MM-DD
        const fechaInicio = fechas.fechaInicio.split('T')[0]; // Extraer solo YYYY-MM-DD
        const fechaFin = fechas.fechaFin.split('T')[0]; // Extraer solo YYYY-MM-DD
        
        return fechaGasto >= fechaInicio && fechaGasto <= fechaFin;
      }) || [];

      // Guardar datos para actualización directa y para VerBalance
      setGastosData(gastosResponse.data || []);
      setMovimientosAlmacenData(movimientosAlmacenResponse.data || []);

      // Calcular totales
      const totalIngresos = salidasAlmacen.reduce((sum, mov) => {
        // Sumar el total de productos vendidos
        if (mov.productos && mov.productos.length > 0) {
          return sum + mov.productos.reduce((productSum, prod) => {
            return productSum + (prod.cantidad * prod.precio_unitario);
          }, 0);
        }
        return sum;
      }, 0);

      const totalGastos = gastosPeriodo.reduce((sum, gasto) => {
        return sum + (gasto.valor || 0);
      }, 0);

      const totalEgresos = totalGastos;

      setDatosBalance({
        ingresos: { total: totalIngresos },
        salidas: { total: totalEgresos }
      });
      setDatosCargados(true);

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

  const handleNuevaVenta = () => {
    setIsAlmacenGeneralOpen(true);
  };

  const handleNuevoGasto = () => {
    setIsEditarAgregarGastoOpen(true);
  };

  const handleVerMas = () => {
    setIsVerBalanceOpen(true);
  };

  const handleGastoCreated = (gastoData) => {
    console.log('Gasto creado:', gastoData);
    mostrarNotificacion('success', 'Gasto registrado correctamente');
    
    // Actualizar balance directamente sin hacer nueva petición
    const fechas = getFechasPeriodo(periodoSeleccionado);
    
    // Verificar si el gasto está dentro del período seleccionado (comparar solo fechas)
    const fechaGasto = gastoData.fecha_gasto; // Ya es YYYY-MM-DD
    const fechaInicio = fechas.fechaInicio.split('T')[0]; // Extraer solo YYYY-MM-DD
    const fechaFin = fechas.fechaFin.split('T')[0]; // Extraer solo YYYY-MM-DD
    
    if (fechaGasto >= fechaInicio && fechaGasto <= fechaFin) {
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
      
      console.log('Balance actualizado con nuevo gasto:', gastoData.valor);
    }
  };

  const balance = datosBalance.ingresos.total - datosBalance.salidas.total;

  // Cargar datos solo la primera vez
  useEffect(() => {
    if (!datosCargados) {
      cargarDatosBalance();
    }
  }, [datosCargados]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen title="Balance">
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <p className={styles.subTitle}>SELECCIONAR</p>
          <RefreshIndicator
            isVisible={showRefreshIndicator}
            isLoading={isRefreshing}
          />
        </div>

        <div className={styles.content}>
          <Select
            placeholder="Período de tiempo"
            options={opcionesPeriodo}
            value={periodoSeleccionado}
            onChange={handlePeriodoChange}
            icon="calendar"
          />
        </div>

        {/* Componente de Balance - Simple */}
        <div className={styles.balanceSimple}>
          {/* Balance Total */}
          <div className={styles.balanceTotalSimple}>
            <span className={`${styles.balanceTotalTexto} ${balance < 0 ? styles.negativo : ''}`}>
              Bs. {balance.toFixed(2)}
            </span>
          </div>

          {/* Ingresos y Salidas lado a lado */}
          <div className={styles.ingresosSalidasContainer}>
            {/* Ingresos */}
            <div className={styles.ingresosSimple}>
              <div className={styles.iconoIngresos}>↗ <span className={styles.textoIngresos}>Ingresos</span></div>
              <div className={styles.valorIngresos}>Bs. {datosBalance.ingresos.total.toFixed(2)}</div>
            </div>

            {/* Salidas */}
            <div className={styles.salidasSimple}>
              <div className={styles.iconoSalidas}>↙ <span className={styles.textoSalidas}>Egresos</span></div>
              <div className={styles.valorSalidas}>-Bs. {datosBalance.salidas.total.toFixed(2)}</div>
            </div>
          </div>
          <span className={styles.verMas} onClick={handleVerMas}>Ver detalles</span>
        </div>

        {/* Botones */}
        <div className={styles.buttons}>
          <Boton
            className='btn-default'
            label='Nueva Venta'
            onClick={handleNuevaVenta}
          />
          <Boton
            className='btn-red'
            label='Nuevo Gasto'
            onClick={handleNuevoGasto}
          />
        </div>
      </div>

      {/* Modal de AlmacenGeneral para nueva venta */}
      <AlmacenGeneral
        isOpen={isAlmacenGeneralOpen}
        setIsOpen={setIsAlmacenGeneralOpen}
        tipo="salida"
      />

      {/* Modal de EditarAgregarGasto para nuevo gasto */}
      <EditarAgregarGasto
        isOpen={isEditarAgregarGastoOpen}
        setIsOpen={setIsEditarAgregarGastoOpen}
        onGastoCreated={handleGastoCreated}
      />

      {/* Modal de VerBalance para ver detalles */}
      <VerBalance
        isOpen={isVerBalanceOpen}
        setIsOpen={setIsVerBalanceOpen}
        datosBalance={datosBalance}
        gastosData={gastosData}
        movimientosAlmacen={movimientosAlmacenData}
      />
    </Screen>
  );
};

export default Balance;
