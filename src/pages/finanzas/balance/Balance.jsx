import React, { useState, useMemo, useEffect } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import viewStyles from '../../../pages/home/View.module.css';
import ColumnInfo from '../../../components/common/outputs/ColumnInfo';
import DateRibbon from '../../../components/common/widgets/DateRibbon/DateRibbon';
import LayoutGrid from '../../../components/layout/LayoutGrid';
import FetchData from '../../../components/mixed/FetchData';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import deudasService from '../../../services/deudasService';
import gastosService from '../../../services/gastosService';
import Skeleton from '../../../components/common/widgets/Skeleton';
import { parseDateWithoutOffset } from '../../../utils/dateUtils';

// Formato de precio: redondea al múltiplo de 0.10 más cercano y muestra 2 decimales
const formatPrecio = (val) => {
    let num = parseFloat(val ?? 0);
    if (isNaN(num)) return '0,00';
    
    // Redondear a 1 decimal (múltiplos de 0.10, ej: 133.77 -> 133.8)
    num = Math.round(num * 10) / 10;
    
    const [intPart, decPart] = num.toFixed(2).split('.');
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intFormatted},${decPart}`;
};

const metodosPago = [
    { value: 'qr', label: 'QR' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'credito', label: 'Crédito' },
    { value: 'otros', label: 'Otros' }
];

// Dado un valor de fecha de la cinta y el tipo, calcula inicio y fin del periodo
const calcFiltroFecha = (selectedDate, tipoBalance) => {
    if (!selectedDate) return null;
    
    // Fecha personalizada: el valor viene como 'inicio__fin'
    if (tipoBalance === 'personalizada') {
        if (selectedDate.includes('__')) {
            const [inicio, fin] = selectedDate.split('__');
            return {
                inicio,
                fin,
                fechaStrInicio: inicio,
                fechaStrFin: fin
            };
        }
        return null;
    }
    
    const d = parseDateWithoutOffset(selectedDate);
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
        const inicioDate = parseDateWithoutOffset(selectedDate);
        const finDate = parseDateWithoutOffset(selectedDate);
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

const Balance = () => {
  const { isLargeScreen } = useLayout();
  const [tipoBalance, setTipoBalance] = useState('diario');
  const [selectedDate, setSelectedDate] = useState(() => {
      const today = new Date();
      return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  });
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deudasSaldoTotal, setDeudasSaldoTotal] = useState(0);
  const [loadingDeudas, setLoadingDeudas] = useState(false);
  const [gastos, setGastos] = useState([]);
  const [loadingGastos, setLoadingGastos] = useState(false);

  const filtroFecha = useMemo(() => calcFiltroFecha(selectedDate, tipoBalance), [selectedDate, tipoBalance]);

  // Params para getAllSinLimite: (tipo, estado, ordenamiento, sucuIdParam, filtroFecha)
  const fetchParams = useMemo(() => [
      'salida',         // tipo - solo salidas
      null,             // estado - todos
      'fecha_desc',     // ordenamiento
      null,             // sucuIdParam - usa el del context
      filtroFecha       // filtroFecha
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

  const ventasPorMetodo = useMemo(() => {
      const totales = {};
      
      movimientos.forEach(mov => {
          let movTotal = parseFloat(mov.total) || 0;
          const descuento = parseFloat(mov.descuento) || 0;
          const aumento = parseFloat(mov.aumento) || 0;
          
          if (mov.porcentaje) {
              movTotal = movTotal - (movTotal * (descuento / 100)) + (movTotal * (aumento / 100));
          } else {
              movTotal = movTotal - descuento + aumento;
          }
          
          const metodo = (mov.metodo_pago || 'otros').toLowerCase();
          totales[metodo] = (totales[metodo] || 0) + movTotal;
      });
      return totales;
  }, [movimientos]);

  const { gastosPorMetodo, egresosTotales } = useMemo(() => {
      const totales = {};
      let sumaTotal = 0;
      
      gastos.forEach(gasto => {
          const valor = parseFloat(gasto.valor) || 0;
          const metodo = (gasto.metodo_pago || 'otros').toLowerCase();
          totales[metodo] = (totales[metodo] || 0) + valor;
          sumaTotal += valor;
      });
      return { gastosPorMetodo: totales, egresosTotales: sumaTotal };
  }, [gastos]);

  const costosProduccionTotal = useMemo(() => {
      return movimientos.reduce((sum, mov) => {
          return sum + (parseFloat(mov.costo_produccion) || 0);
      }, 0);
  }, [movimientos]);

  const totalGeneral = ingresosTotales - egresosTotales - deudasSaldoTotal;
  const totalGanancias = totalGeneral - costosProduccionTotal;

  const handleDataLoaded = (data) => {
      // Solo salidas (el servicio ya filtra por tipo, pero filtramos por si acaso)
      const soloSalidas = (data || []).filter(m => m.type === 'salida');
      setMovimientos(soloSalidas);
      console.log('📊 BALANCE - Movimientos de salida cargados:', soloSalidas.length, 'movimientos');
      if (soloSalidas.length > 0) {
          console.log('📊 BALANCE - Todos los movimientos:', soloSalidas.map(m => ({
              id: m.id,
              fecha: m.fecha,
              metodo_pago: m.metodo_pago,
              total: m.total,
              costo_produccion: m.costo_produccion,
              descuento: m.descuento,
              aumento: m.aumento,
              porcentaje: m.porcentaje
          })));
      }
  };

  useEffect(() => {
      const fetchDeudas = async () => {
          if (!filtroFecha) return;

          const movimientosCredito = movimientos.filter(m => (m.metodo_pago || '').toLowerCase() === 'credito');
          if (movimientosCredito.length === 0) {
              setDeudasSaldoTotal(0);
              return;
          }

          setLoadingDeudas(true);
          try {
              const res = await deudasService.getAllSinLimite(null, null);
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
          if (!filtroFecha) return;

          setLoadingGastos(true);
          try {
              const res = await gastosService.getAllSinLimite(null, filtroFecha);
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

  return (
    <>
      <NavBar />
      <div className={viewStyles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={viewStyles.contentArea}>
          
            <h1 className={viewStyles.title}>Balance {tipoBalance.charAt(0).toUpperCase() + tipoBalance.slice(1)}</h1>
            
            <DateRibbon 
                onTipoFechaChange={setTipoBalance} 
                onDateSelected={setSelectedDate} 
            />

            <div style={{ display: 'grid', gridTemplateColumns: isLargeScreen ? 'repeat(5, 1fr)' : 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    {loading ? (
                        <>
                            <Skeleton width="120px" height="20px" style={{ marginBottom: '5px' }} />
                            <Skeleton width="150px" height="20px" />
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px', fontWeight: '650', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>Ingresos Totales</span>
                            <span style={{ fontSize: '21px', fontWeight: 'bold', color: '#28a745' }}>Bs. {formatPrecio(ingresosTotales)}</span>
                        </>
                    )}
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    {loadingGastos ? (
                        <>
                            <Skeleton width="120px" height="20px" style={{ marginBottom: '8px' }} />
                            <Skeleton width="150px" height="20px" />
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px', fontWeight: '650', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>Egresos Totales</span>
                            <span style={{ fontSize: '21px', fontWeight: 'bold', color: '#dc3545' }}>Bs. {formatPrecio(egresosTotales)}</span>
                        </>
                    )}
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    {loading || loadingDeudas ? (
                        <>
                            <Skeleton width="120px" height="20px" style={{ marginBottom: '8px' }} />
                            <Skeleton width="150px" height="20px" />
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px', fontWeight: '650', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>Deudas Saldos (Ingresos)</span>
                            <span style={{ fontSize: '21px', fontWeight: 'bold', color: 'var(--warning-color)' }}>Bs. {formatPrecio(deudasSaldoTotal)}</span>
                        </>
                    )}
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    {loading || loadingGastos || loadingDeudas ? (
                        <>
                            <Skeleton width="120px" height="20px" style={{ marginBottom: '8px' }} />
                            <Skeleton width="150px" height="20px" />
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px', fontWeight: '650', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>Total General</span>
                            <span style={{ fontSize: '21px', fontWeight: 'bold', color: 'var(--info-color)' }}>Bs. {formatPrecio(totalGeneral)}</span>
                        </>
                    )}
                </div>
                <div style={{ gridColumn: isLargeScreen ? 'auto' : '1 / -1', background: 'white', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    {loading || loadingGastos || loadingDeudas ? (
                        <>
                            <Skeleton width="120px" height="20px" style={{ marginBottom: '8px' }} />
                            <Skeleton width="150px" height="20px" />
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px', fontWeight: '650', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>Total Ganancias</span>
                            <span style={{ fontSize: '21px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Bs. {formatPrecio(totalGanancias)}</span>
                        </>
                    )}
                </div>
            </div>

            <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBlock: '15px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Resumen por Método de Pago</h3>
            
            <LayoutGrid columns={5}>
                {loading ? (
                     Array.from({ length: 5 }).map((_, idx) => (
                         <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                             <Skeleton width="60%" height="24px" style={{ marginBottom: '15px' }} />
                             <Skeleton width="100%" height="20px" style={{ marginBottom: '10px' }} />
                             <Skeleton width="100%" height="20px" style={{ marginBottom: '10px' }} />
                             <Skeleton width="100%" height="20px" />
                         </div>
                     ))
                ) : (
                    metodosPago.map(method => {
                        const ventasM = ventasPorMetodo[method.value] || 0;
                        const gastosM = gastosPorMetodo[method.value] || 0;
                        const balanceM = ventasM - gastosM;
                        
                        return (
                            <ColumnInfo 
                                key={method.value}
                                title={method.label}
                                finance={true}
                                financeTotal={`Bs. ${formatPrecio(balanceM)}`}
                                items={[
                                    { clave: 'Ventas', valor: `Bs. ${formatPrecio(ventasM)}`, colorValor: '#28a745' },
                                    { clave: 'Gastos', valor: `Bs. ${formatPrecio(gastosM)}`, colorValor: '#dc3545' },
                                    { clave: 'Balance Total', valor: `Bs. ${formatPrecio(balanceM)}`, colorValor: '#007bff' }
                                ]}
                            />
                        );
                    })
                )}
            </LayoutGrid>
        
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
    </>
  );
};

export default Balance;