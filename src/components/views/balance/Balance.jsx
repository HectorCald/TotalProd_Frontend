import React, { useState, useEffect } from 'react';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import RefreshIndicator from '../../common/RefreshIndicator';
import Boton from '../../common/Boton';
import DateRangePicker from '../../common/DateRangePicker';
import AlmacenGeneral from '../almacen-general/AlmacenGeneral';
import EditarAgregarGasto from '../gastos/EditarAgregarGasto';
import VerBalance from './VerBalance';
import styles from '../../../styles/view.module.css';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import gastosService from '../../../services/gastosService';

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

  const handleFechaChange = (startDate, endDate) => {
    setFechaInicio(startDate);
    setFechaFin(endDate);
    console.log('Fechas seleccionadas:', { startDate, endDate });
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
      
      console.log('Fechas para filtrado:', {
        fechaInicioFormateada,
        fechaFinFormateada,
        fechaInicioAjustada: fechaInicioAjustada.toLocaleString(),
        fechaFinAjustada: fechaFinAjustada.toLocaleString()
      });
      
      // Hacer las 2 peticiones en paralelo para mejorar el rendimiento
      const [movimientosAlmacenResponse, gastosResponse] = await Promise.all([
        movimientosAlmacenService.getAllSinLimite(),
        gastosService.getAllSinLimite()
      ]);

      // Filtrar movimientos de almacén (salidas = ingresos/ventas)
      const salidasAlmacen = movimientosAlmacenResponse.data?.filter(mov => 
        mov.type === 'salida' && 
        new Date(mov.fecha) >= new Date(fechaInicioFormateada) && 
        new Date(mov.fecha) <= new Date(fechaFinFormateada)
      ) || [];

      // Filtrar gastos por período (incluye gastos de entradas de acopio + gastos manuales)
      const gastosPeriodo = gastosResponse.data?.filter(gasto => {
        // fecha_gasto es tipo DATE (YYYY-MM-DD), comparar solo fechas
        const fechaGasto = gasto.fecha_gasto; // Ya es YYYY-MM-DD
        const fechaInicioStr = fechaInicioFormateada.split('T')[0]; // Extraer solo YYYY-MM-DD
        const fechaFinStr = fechaFinFormateada.split('T')[0]; // Extraer solo YYYY-MM-DD
        
        return fechaGasto >= fechaInicioStr && fechaGasto <= fechaFinStr;
      }) || [];

      console.log('Datos filtrados:', {
        totalMovimientos: movimientosAlmacenResponse.data?.length || 0,
        salidasAlmacen: salidasAlmacen.length,
        totalGastos: gastosResponse.data?.length || 0,
        gastosPeriodo: gastosPeriodo.length
      });

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
    // Verificar si el gasto está dentro del período seleccionado (comparar solo fechas)
    const fechaGasto = gastoData.fecha_gasto; // Ya es YYYY-MM-DD
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0]; // Extraer solo YYYY-MM-DD
    const fechaFinStr = fechaFin.toISOString().split('T')[0]; // Extraer solo YYYY-MM-DD
    
    if (fechaGasto >= fechaInicioStr && fechaGasto <= fechaFinStr) {
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

  // Cargar datos solo la primera vez
  useEffect(() => {
    if (!datosCargados && isOpen) {
      cargarDatosBalance();
    }
  }, [datosCargados, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
      <HeaderView onBack={() => setIsOpen(false)} title='Balance' />
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <RefreshIndicator
            isVisible={showRefreshIndicator}
            isLoading={isRefreshing}
          />
        </div>
        <div className={styles.headerContainer}>
          <p className={styles.subTitle}>SELECCIONAR</p>
        </div>


          <DateRangePicker
            startDate={fechaInicio}
            endDate={fechaFin}
            onChange={handleFechaChange}
          />


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
    </View>
  );
};

export default Balance;
