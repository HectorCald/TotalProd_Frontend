import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../context/LayoutContext';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import { useModalStack } from '../../context/ModalStackContext';
import { SideBarOptions } from '../../constants/SideBarOptions';
import SideBar from '../../components/essentials/SideBar';
import NavBar from '../../components/essentials/NavBar';
import MenuSide from '../../components/essentials/MenuSide';
import styles from './View.module.css';

import FetchData from '../../components/mixed/FetchData';
import movimientosAlmacenService from '../../services/movimientosAlmacenService';
import deudasService from '../../services/deudasService';
import gastosService from '../../services/gastosService';
import Skeleton from '../../components/common/widgets/Skeleton';
import useFormatNumber from '../../hooks/useFormatNumber';
import Boton from '../../components/common/botones/Boton';
import Link from '../../components/common/outputs/Link';
import Carousel from '../../components/common/widgets/Carousel/Carousel';
import BotonCuadrante from '../../components/common/botones/BotonCuadrante';
import ModalOpcionesAlmacen from '../inventario/almacen/modals/ModalOpcionesAlmacen';
import ModalOpcionesMateriaPrima from '../inventario/materia-prima/modals/ModalOpcionesMateriaPrima';
import ModalOpcionesMovimientos from '../registros-pedidos/movimientos/modals/ModalOpcionesMovimientos';
import ModalOpcionesPedidos from '../registros-pedidos/pedidos/modals/ModalOpcionesPedidos';
import TarjetaGrafico from '../../components/grafics/TarjetaGrafico';
import GraficoVentas from '../../components/grafics/GraficoVentas';
import GraficoCategorias from '../../components/grafics/GraficoCategorias';
import pedidosAlmacenService from '../../services/pedidosAlmacenService';
import gridStyles from '../../components/layout/LayoutGrid.module.css';



const calcFiltroFecha = (selectedDate, tipoBalance) => {
  if (!selectedDate) return null;

  const d = new Date(selectedDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${day}`;

  if (tipoBalance === 'diario') {
    return {
      inicio: dateStr,
      fin: dateStr,
      fechaStrInicio: dateStr,
      fechaStrFin: dateStr
    };
  } else if (tipoBalance === 'mensual') {
    const lastDay = new Date(y, m, 0).getDate();
    const dateStrFin = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    return {
      inicio: `${y}-${m}-01`,
      fin: dateStrFin,
      fechaStrInicio: `${y}-${m}-01`,
      fechaStrFin: dateStrFin
    };
  } else if (tipoBalance === 'anual') {
    return {
      inicio: `${y}-01-01`,
      fin: `${y}-12-31`,
      fechaStrInicio: `${y}-01-01`,
      fechaStrFin: `${y}-12-31`
    };
  } else if (tipoBalance === 'semanal') {
    const inicioDate = new Date(selectedDate);
    const finDate = new Date(inicioDate);
    finDate.setDate(finDate.getDate() + 6);

    const y2 = finDate.getFullYear();
    const m2 = String(finDate.getMonth() + 1).padStart(2, '0');
    const day2 = String(finDate.getDate()).padStart(2, '0');
    const dateStrFin = `${y2}-${m2}-${day2}`;

    return {
      inicio: dateStr,
      fin: dateStrFin,
      fechaStrInicio: dateStr,
      fechaStrFin: dateStrFin
    };
  }
  return null;
};

const Home = () => {
  const { isLargeScreen } = useLayout();
  const navigate = useNavigate();
  const { formatPrice } = useFormatNumber();
  const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
  const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
  const { clearStack } = useModalStack();

  useEffect(() => {
    clearStack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const usuario = userInfo || employeeInfo;
  const sucursalSeleccionada = userSucursal || employeeSucursal;
  const isEmployee = !!employeeInfo;

  const tieneGraficosInicio = useMemo(() => {
    if (!isEmployee) return false;
    return usuario?.modules?.some(m => m.modulos?.clave === 'balance' && m.name === 'graficos_inicio');
  }, [isEmployee, usuario]);

  const tipoEmpresa = sucursalSeleccionada?.empresas?.tipo || userInfo?.empresa?.tipo || employeeInfo?.sucursal?.empresas?.tipo || 'ventas_produccion';
  const isSoloVentas = tipoEmpresa === 'ventas';

  const getCarouselItems = () => {
    const codigoEmpresa = sucursalSeleccionada?.empresas?.codigo || userInfo?.empresa?.codigo || employeeInfo?.sucursal?.empresas?.codigo || '';
    
    const filteredSections = SideBarOptions.filter(section => {
      if (section.empresaCodigo && section.empresaCodigo !== codigoEmpresa) {
        return false;
      }
      return true;
    });

    const itemsWithoutSubmenu = [];
    const itemsWithSubmenu = [];

    filteredSections.forEach(section => {
      section.items.forEach(item => {
        if (item.id === 'home') return;
        if (isSoloVentas && item.id === 'materia-prima') return;
        
        if (isEmployee && usuario?.modules && item.key) {
           const hasModule = usuario.modules.some(m => m.modulos?.clave === item.key);
           if (!hasModule) return;
           
           if (item.key_submenu) {
             const hasSpecificSubModule = usuario.modules.some(m => 
               m.modulos?.clave === item.key && m.name === item.key_submenu
             );
             if (!hasSpecificSubModule) return;
           }
        }
        
        if (item.submenu) {
          itemsWithSubmenu.push(item);
        } else {
          itemsWithoutSubmenu.push(item);
        }
      });
    });

    return { itemsWithoutSubmenu, itemsWithSubmenu };
  };

  const { itemsWithoutSubmenu: carouselItems, itemsWithSubmenu } = getCarouselItems();

  const [resumenDashboard, setResumenDashboard] = useState({
    ingresos: 0,
    ingresosPorcentaje: 0,
    pedidos: 0,
    pedidosPorcentaje: 0,
    compras: 0,
    comprasPorcentaje: 0
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [loadingGrafico, setLoadingGrafico] = useState(true);
  const [datosCategorias, setDatosCategorias] = useState([]);
  const [totalProdVendidos, setTotalProdVendidos] = useState(0);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  const mesActual = useMemo(() => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[new Date().getMonth()];
  }, []);

  useEffect(() => {
    const fetchGraficoData = async () => {
      if (!sucursalSeleccionada?.id) return;
      setLoadingGrafico(true);
      try {
        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth();
        
        const fechaFiltroAnual = {
          inicio: `${currentYear}-01-01`,
          fin: `${currentYear}-12-31`
        };

        const [movsRes, pedidosRes] = await Promise.all([
          movimientosAlmacenService.getAllSinLimite('salida', null, 'fecha_desc', sucursalSeleccionada.id, fechaFiltroAnual),
          pedidosAlmacenService.getAll(1, 99999, null, null, 'fecha_desc', sucursalSeleccionada.id, null, fechaFiltroAnual)
        ]);

        const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const datos = mesesNombres.map((mes, index) => {
          if (index <= currentMonthIndex) {
            return { fecha: mes, Ventas: 0, Pedidos: 0 };
          } else {
            return { fecha: mes, Ventas: null, Pedidos: null };
          }
        });

        if (movsRes?.success && Array.isArray(movsRes.data)) {
          movsRes.data.forEach(mov => {
            const dateStr = mov.fecha || '';
            const yyyy = parseInt(dateStr.slice(0, 4));
            const mm = parseInt(dateStr.slice(5, 7)) - 1;
            if (yyyy === currentYear && mm <= currentMonthIndex && mm >= 0 && mm < 12) {
              let movTotal = parseFloat(mov.total) || 0;
              const descuento = parseFloat(mov.descuento) || 0;
              const aumento = parseFloat(mov.aumento) || 0;
              if (mov.porcentaje) {
                movTotal = movTotal - (movTotal * (descuento / 100)) + (movTotal * (aumento / 100));
              } else {
                movTotal = movTotal - descuento + aumento;
              }
              datos[mm].Ventas += movTotal;
            }
          });
        }

        if (pedidosRes?.success && Array.isArray(pedidosRes.data)) {
          pedidosRes.data.forEach(ped => {
            const dateStr = ped.fecha || ped.created_at || '';
            const yyyy = parseInt(dateStr.slice(0, 4));
            const mm = parseInt(dateStr.slice(5, 7)) - 1;
            if (yyyy === currentYear && mm <= currentMonthIndex && mm >= 0 && mm < 12) {
              datos[mm].Pedidos += 1;
            }
          });
        }

        setDatosGrafico(datos);
      } catch (error) {
        console.error('Error fetching annual graph data:', error);
      } finally {
        setLoadingGrafico(false);
      }
    };

    const fetchCategoriasData = async () => {
      if (!sucursalSeleccionada?.id) return;
      setLoadingCategorias(true);
      try {
        const res = await movimientosAlmacenService.getCategoriasMasVendidas(sucursalSeleccionada.id);
        if (res?.success && res.data) {
          setDatosCategorias(res.data.categorias || []);
          setTotalProdVendidos(res.data.totalProductos || 0);
        } else {
          setDatosCategorias([]);
          setTotalProdVendidos(0);
        }
      } catch (error) {
        console.error('Error fetching categories chart data:', error);
      } finally {
        setLoadingCategorias(false);
      }
    };

    const fetchDashboardData = async () => {
      if (!sucursalSeleccionada?.id) return;
      setLoadingDashboard(true);
      try {
        const ahora = new Date();
        const y = ahora.getFullYear();
        const m = ahora.getMonth();

        // Rango Mes Actual
        const lastDayActual = new Date(y, m + 1, 0).getDate();
        const dateStrFinActual = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDayActual).padStart(2, '0')}`;
        const filtroActual = {
          inicio: `${y}-${String(m + 1).padStart(2, '0')}-01`,
          fin: dateStrFinActual,
          fechaStrInicio: `${y}-${String(m + 1).padStart(2, '0')}-01`,
          fechaStrFin: dateStrFinActual
        };

        // Rango Mes Anterior
        let yPrev = y;
        let mPrev = m - 1;
        if (mPrev < 0) {
          mPrev = 11;
          yPrev = y - 1;
        }
        const lastDayPrev = new Date(yPrev, mPrev + 1, 0).getDate();
        const dateStrFinPrev = `${yPrev}-${String(mPrev + 1).padStart(2, '0')}-${String(lastDayPrev).padStart(2, '0')}`;
        const filtroAnterior = {
          inicio: `${yPrev}-${String(mPrev + 1).padStart(2, '0')}-01`,
          fin: dateStrFinPrev,
          fechaStrInicio: `${yPrev}-${String(mPrev + 1).padStart(2, '0')}-01`,
          fechaStrFin: dateStrFinPrev
        };

        // Promesas en paralelo
        const [
          movsActualRes,
          movsAnteriorRes,
          gastosActualRes,
          gastosAnteriorRes,
          pedidosRes
        ] = await Promise.all([
          movimientosAlmacenService.getAllSinLimite('salida', null, 'fecha_desc', sucursalSeleccionada.id, filtroActual),
          movimientosAlmacenService.getAllSinLimite('salida', null, 'fecha_desc', sucursalSeleccionada.id, filtroAnterior),
          gastosService.getAllSinLimite(sucursalSeleccionada.id, null, filtroActual),
          gastosService.getAllSinLimite(sucursalSeleccionada.id, null, filtroAnterior),
          pedidosAlmacenService.getResumenMensual(sucursalSeleccionada.id)
        ]);

        const calcIngresosHelper = (movs) => {
          return (movs || []).reduce((sum, mov) => {
            let movTotal = parseFloat(mov.total) || 0;
            const descuento = parseFloat(mov.descuento) || 0;
            const aumento = parseFloat(mov.aumento) || 0;
            if (mov.porcentaje) {
              movTotal = movTotal - (movTotal * (descuento / 100)) + (movTotal * (aumento / 100));
            } else {
              movTotal = movTotal - descuento + aumento;
            }
            return sum + movTotal;
          }, 0);
        };

        const calcGastosHelper = (gts) => {
          return (gts || []).reduce((sum, gasto) => sum + (parseFloat(gasto.valor) || 0), 0);
        };

        // Procesar Ingresos
        const ingresosAct = movsActualRes?.success ? calcIngresosHelper(movsActualRes.data) : 0;
        const ingresosAnt = movsAnteriorRes?.success ? calcIngresosHelper(movsAnteriorRes.data) : 0;
        const ingresosPct = ingresosAnt > 0 ? ((ingresosAct - ingresosAnt) / ingresosAnt) * 100 : 0;

        // Procesar Gastos
        const gastosAct = gastosActualRes?.success ? calcGastosHelper(gastosActualRes.data) : 0;
        const gastosAnt = gastosAnteriorRes?.success ? calcGastosHelper(gastosAnteriorRes.data) : 0;
        const gastosPct = gastosAnt > 0 ? ((gastosAct - gastosAnt) / gastosAnt) * 100 : 0;

        // Procesar Pedidos
        const pedidosAct = Math.round(pedidosRes?.success ? (pedidosRes.data?.mesActual || 0) : 0);
        const pedidosAnt = Math.round(pedidosRes?.success ? (pedidosRes.data?.mesAnterior || 0) : 0);
        const pedidosPct = pedidosAnt > 0 ? Math.round(((pedidosAct - pedidosAnt) / pedidosAnt) * 100) : 0;

        setResumenDashboard({
          ingresos: ingresosAct,
          ingresosPorcentaje: Number(ingresosPct.toFixed(1)),
          pedidos: pedidosAct,
          pedidosPorcentaje: pedidosPct,
          compras: gastosAct,
          comprasPorcentaje: Number(gastosPct.toFixed(1))
        });
      } catch (err) {
        console.error('Error fetching dashboard summary data:', err);
      } finally {
        setLoadingDashboard(false);
      }
    };

    if (isLargeScreen && (!isEmployee || tieneGraficosInicio)) {
      fetchDashboardData();
      fetchGraficoData();
      fetchCategoriasData();
    }
  }, [sucursalSeleccionada, isLargeScreen, isEmployee, tieneGraficosInicio]);

  const tipoBalance = 'diario';
  const selectedDate = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  }, []);

  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deudasSaldoTotal, setDeudasSaldoTotal] = useState(0);
  const [loadingDeudas, setLoadingDeudas] = useState(false);
  const [gastos, setGastos] = useState([]);
  const [loadingGastos, setLoadingGastos] = useState(false);

  const [modalOpcionesAlmacenOpen, setModalOpcionesAlmacenOpen] = useState(false);
  const [modalOpcionesMateriaPrimaOpen, setModalOpcionesMateriaPrimaOpen] = useState(false);
  const [modalOpcionesMovimientosOpen, setModalOpcionesMovimientosOpen] = useState(false);
  const [modalOpcionesPedidosOpen, setModalOpcionesPedidosOpen] = useState(false);

  const filtroFecha = useMemo(() => calcFiltroFecha(selectedDate, tipoBalance), [selectedDate, tipoBalance]);

  const fetchParams = useMemo(() => [
    'salida',
    null,
    'fecha_desc',
    null,
    filtroFecha
  ], [filtroFecha]);

  const ingresosTotales = useMemo(() => {
    return movimientos.reduce((sum, mov) => {
      let movTotal = parseFloat(mov.total) || 0;
      const descuento = parseFloat(mov.descuento) || 0;
      const aumento = parseFloat(mov.aumento) || 0;
      if (mov.porcentaje) {
        movTotal = movTotal - (movTotal * (descuento / 100)) + (movTotal * (aumento / 100));
      } else {
        movTotal = movTotal - descuento + aumento;
      }
      return sum + movTotal;
    }, 0);
  }, [movimientos]);

  const egresosTotales = useMemo(() => {
    return gastos.reduce((sum, gasto) => sum + (parseFloat(gasto.valor) || 0), 0);
  }, [gastos]);

  const costosProduccionTotal = useMemo(() => {
    return movimientos.reduce((sum, mov) => sum + (parseFloat(mov.costo_produccion) || 0), 0);
  }, [movimientos]);

  const totalGeneral = ingresosTotales - egresosTotales - deudasSaldoTotal;
  const totalGanancias = totalGeneral - costosProduccionTotal;

  const handleDataLoaded = (data) => {
    const soloSalidas = (data || []).filter(m => m.type === 'salida');
    setMovimientos(soloSalidas);
  };

  useEffect(() => {
    const fetchDeudas = async () => {
      const movimientosCredito = movimientos.filter(m => (m.metodo_pago || '').toLowerCase() === 'credito');
      if (movimientosCredito.length === 0) {
        setDeudasSaldoTotal(0);
        return;
      }
      setLoadingDeudas(true);
      try {
        const res = await deudasService.getAll(1, 99999, '', null, null, 'fecha_desc', null, filtroFecha);
        if (res && res.success && res.data) {
          const idsMovimientosCredito = movimientosCredito.map(m => m.id);
          const deudasAsociadas = res.data.filter(d => idsMovimientosCredito.includes(d.movimiento_salida_id));
          const totalSaldo = deudasAsociadas.reduce((sum, d) => {
            const saldo = d.saldo_pendiente !== undefined && d.saldo_pendiente !== null
              ? Number(d.saldo_pendiente)
              : (Number(d.monto_total) - (Number(d.total_pagado) || 0));
            return sum + (saldo || 0);
          }, 0);
          setDeudasSaldoTotal(totalSaldo);
        }
      } catch (error) {
        console.error('Error al obtener deudas:', error);
      } finally {
        setLoadingDeudas(false);
      }
    };
    fetchDeudas();
  }, [movimientos, filtroFecha]);

  useEffect(() => {
    const fetchGastos = async () => {
      setLoadingGastos(true);
      try {
        const res = await gastosService.getAllSinLimite(null, null, filtroFecha);
        if (res && res.success && res.data) {
          setGastos(res.data);
        } else {
          setGastos([]);
        }
      } catch (error) {
        console.error('Error al obtener gastos:', error);
        setGastos([]);
      } finally {
        setLoadingGastos(false);
      }
    };
    fetchGastos();
  }, [filtroFecha]);

  const ItemRow = ({ label, value, loadingState, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}>{label}</span>
      {loadingState ? (
        <Skeleton width="80px" height="18px" />
      ) : (
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: color || '#333' }}>
          {value}
        </span>
      )}
    </div>
  );

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          {!isEmployee || tieneGraficosInicio ? (
            isLargeScreen ? (
              <>
                <h1 className={styles.title}>Inicio</h1>
                <div className={gridStyles.layoutGrid}>
                  <TarjetaGrafico 
                    titulo={`Ingresos (${mesActual})`}
                    valor={`Bs. ${formatPrice(resumenDashboard.ingresos)}`} 
                    porcentaje={resumenDashboard.ingresosPorcentaje} 
                    comparacion="vs. mes anterior" 
                    cargando={loadingDashboard}
                    color="var(--success-color)"
                  />
                  <TarjetaGrafico 
                    titulo={`Pedidos (${mesActual})`}
                    valor={resumenDashboard.pedidos} 
                    porcentaje={resumenDashboard.pedidosPorcentaje} 
                    comparacion="vs. mes anterior" 
                    cargando={loadingDashboard}
                    color="var(--warning-color)"
                  />
                  <TarjetaGrafico 
                    titulo={`Egresos (${mesActual})`}
                    valor={`Bs. ${formatPrice(resumenDashboard.compras)}`} 
                    porcentaje={resumenDashboard.comprasPorcentaje} 
                    comparacion="vs. mes anterior" 
                    cargando={loadingDashboard}
                    color="var(--error-color)"
                  />
                </div>

                <div className={gridStyles.layoutGrid} style={{ marginTop: '20px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <GraficoVentas data={datosGrafico} cargando={loadingGrafico} />
                  </div>
                  <div style={{ gridColumn: 'span 1' }}>
                    <GraficoCategorias data={datosCategorias} total={totalProdVendidos} cargando={loadingCategorias} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className={styles.title}>Ventas de Hoy</h1>

            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '20px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
              border: '1px solid #eee', 
            }}>

              <ItemRow label="Ingresos Totales" value={`Bs. ${formatPrice(ingresosTotales)}`} loadingState={loading} color="#28a745" />
              <ItemRow label="Egresos Totales" value={`Bs. ${formatPrice(egresosTotales)}`} loadingState={loadingGastos} color="#dc3545" />
              <ItemRow label="Total General" value={`Bs. ${formatPrice(totalGeneral)}`} loadingState={loading || loadingGastos || loadingDeudas} color="var(--info-color)" />
              
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                <Link 
                  text="Ver Balance" 
                  iconEnd="right-arrow-alt" 
                  onClick={() => navigate('/balance')} 
                />
              </div>
              
              <Boton
                className="btn-primary"
                label="Registrar Venta"
                iconName="cart"
                onClick={() => navigate('/almacen/salidas')}
                style={{ width: '100%', marginTop: '15px' }}
              />
            </div>
            <h1 className={styles.title}>Descubre más</h1>
            <Carousel 
              items={carouselItems} 
              itemsPerPage={4}
              renderItem={(item) => (
                <BotonCuadrante 
                  key={item.id} 
                  icon={item.icon} 
                  title={item.title} 
                  onClick={() => navigate(item.route)} 
                  isNew={item.isNew}
                />
              )}
            />

            <h1 className={styles.title}>Gestión</h1>
            <div style={{ display: 'grid', gridTemplateColumns: itemsWithSubmenu.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '10px', padding: '0 5px' }}>
              {itemsWithSubmenu.map(item => (
                <BotonCuadrante 
                  key={item.id} 
                  icon={item.icon} 
                  title={item.title} 
                  onClick={() => {
                    if (item.id === 'almacen') setModalOpcionesAlmacenOpen(true);
                    else if (item.id === 'materia-prima') setModalOpcionesMateriaPrimaOpen(true);
                    else if (item.id === 'movimientos') {
                      if (isSoloVentas) navigate('/movimientos/almacen');
                      else setModalOpcionesMovimientosOpen(true);
                    }
                    else if (item.id === 'pedidos') {
                      if (isSoloVentas) navigate('/pedidos/almacen');
                      else setModalOpcionesPedidosOpen(true);
                    }
                  }} 
                  isNew={item.isNew}
                />
              ))}
            </div>
            </>
          )
        ) : (
            <>
              <h1 className={styles.title}>Módulos Asignados</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', padding: '0 5px' }}>
                {[...itemsWithSubmenu, ...carouselItems].map(item => (
                  <BotonCuadrante 
                    key={item.id} 
                    icon={item.icon} 
                    title={item.title} 
                    onClick={() => {
                      if (item.submenu) {
                        if (item.id === 'almacen') setModalOpcionesAlmacenOpen(true);
                        else if (item.id === 'materia-prima') setModalOpcionesMateriaPrimaOpen(true);
                        else if (item.id === 'movimientos') {
                          if (isSoloVentas) navigate('/movimientos/almacen');
                          else setModalOpcionesMovimientosOpen(true);
                        }
                        else if (item.id === 'pedidos') {
                          if (isSoloVentas) navigate('/pedidos/almacen');
                          else setModalOpcionesPedidosOpen(true);
                        }
                      } else {
                        navigate(item.route);
                      }
                    }} 
                    isNew={item.isNew}
                  />
                ))}
              </div>
            </>
          )}
          </div>
        </div>
    


      <FetchData
        service={movimientosAlmacenService}
        serviceName="movimientosAlmacenService"
        method="getAllSinLimite"
        methodParams={fetchParams}
        isOpen={!!filtroFecha}
        onDataLoaded={handleDataLoaded}
        onLoadingStart={() => setLoading(true)}
        onLoadingEnd={() => setLoading(false)}
      />
      {!isLargeScreen && <MenuSide />}

      <ModalOpcionesAlmacen isOpen={modalOpcionesAlmacenOpen} onClose={() => setModalOpcionesAlmacenOpen(false)} />
      <ModalOpcionesMateriaPrima isOpen={modalOpcionesMateriaPrimaOpen} onClose={() => setModalOpcionesMateriaPrimaOpen(false)} />
      <ModalOpcionesMovimientos isOpen={modalOpcionesMovimientosOpen} onClose={() => setModalOpcionesMovimientosOpen(false)} />
      <ModalOpcionesPedidos isOpen={modalOpcionesPedidosOpen} onClose={() => setModalOpcionesPedidosOpen(false)} />
    </>
  );
};

export default Home;
