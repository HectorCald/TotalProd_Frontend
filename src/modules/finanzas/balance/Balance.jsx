import React, { useState, useMemo, useEffect } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import viewStyles from '../../../modules/home/View.module.css';
import ColumnInfo from '../../../components/common/outputs/ColumnInfo';
import DateRibbon from '../../../components/common/widgets/DateRibbon/DateRibbon';
import LayoutGrid from '../../../components/layout/LayoutGrid';
import Skeleton from '../../../components/common/widgets/Skeleton';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import gastosService from '../../../services/gastosService';
import deudasService from '../../../services/deudasService';
import { parseDateWithoutOffset } from '../../../utils/dateUtils';

const parseNum = (v) => {
    if (v === null || v === undefined) return 0;
    const str = typeof v === 'string' ? v.replace(',', '.') : v;
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
};

const formatPrecio = (val) => {
    const num = parseNum(val);
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
    
    if (tipoBalance === 'anual') {
        const y = String(selectedDate).length === 4 ? selectedDate : String(parseDateWithoutOffset(selectedDate)?.getFullYear() || selectedDate);
        return { 
            inicio: `${y}-01-01`, 
            fin: `${y}-12-31`,
            fechaStrInicio: `${y}-01-01`,
            fechaStrFin: `${y}-12-31`
        };
    }

    const d = parseDateWithoutOffset(selectedDate);
    if (!d || isNaN(d.getTime())) return null;

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
        const lastDay = new Date(y, parseInt(m, 10), 0).getDate();
        const dateStrFin = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
        return { 
            inicio: `${y}-${m}-01`, 
            fin: dateStrFin,
            fechaStrInicio: `${y}-${m}-01`,
            fechaStrFin: dateStrFin
        };
    } else if (tipoBalance === 'semanal') {
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
  const [loading, setLoading] = useState(false);
  const [deudasSaldoTotal, setDeudasSaldoTotal] = useState(0);
  const [loadingDeudas, setLoadingDeudas] = useState(false);
  const [gastos, setGastos] = useState([]);
  const [loadingGastos, setLoadingGastos] = useState(false);

  const filtroFecha = useMemo(() => calcFiltroFecha(selectedDate, tipoBalance), [selectedDate, tipoBalance]);

  useEffect(() => {
      let isMounted = true;
      const fetchIngresos = async () => {
          if (!filtroFecha) {
              setMovimientos([]);
              return;
          }
          setLoading(true);
          try {
              const res = await movimientosAlmacenService.getAllSinLimite('salida', filtroFecha, 'finalizado');
              if (isMounted) {
                  if (res && res.success && res.data) {
                      setMovimientos(res.data);
                  } else {
                      setMovimientos([]);
                  }
              }
          } catch (error) {
              console.error('Error al obtener ingresos:', error);
              if (isMounted) setMovimientos([]);
          } finally {
              if (isMounted) setLoading(false);
          }
      };

      fetchIngresos();
      return () => {
          isMounted = false;
      };
  }, [filtroFecha]);

  useEffect(() => {
      let isMounted = true;
      const fetchGastos = async () => {
          if (!filtroFecha) {
              setGastos([]);
              return;
          }
          setLoadingGastos(true);
          try {
              const res = await gastosService.getAllSinLimite(null, filtroFecha);
              if (isMounted) {
                  if (res && res.success && res.data) {
                      setGastos(res.data);
                  } else {
                      setGastos([]);
                  }
              }
          } catch (error) {
              console.error('Error al obtener gastos:', error);
              if (isMounted) setGastos([]);
          } finally {
              if (isMounted) setLoadingGastos(false);
          }
      };

      fetchGastos();
      return () => {
          isMounted = false;
      };
  }, [filtroFecha]);

  useEffect(() => {
      let isMounted = true;
      const fetchDeudas = async () => {
          if (!filtroFecha) {
              setDeudasSaldoTotal(0);
              return;
          }
          setLoadingDeudas(true);
          try {
              const res = await deudasService.getAllSinLimite(null, filtroFecha);
              if (isMounted) {
                  if (res && res.success && res.data) {
                      const totalSaldo = res.data.reduce((sum, d) => sum + parseNum(d.saldo_pendiente), 0);
                      setDeudasSaldoTotal(totalSaldo);
                  } else {
                      setDeudasSaldoTotal(0);
                  }
              }
          } catch (error) {
              console.error('Error al obtener deudas:', error);
              if (isMounted) setDeudasSaldoTotal(0);
          } finally {
              if (isMounted) setLoadingDeudas(false);
          }
      };

      fetchDeudas();
      return () => {
          isMounted = false;
      };
  }, [filtroFecha]);

  const ingresosTotales = useMemo(() => {
      return (movimientos || []).reduce((sum, mov) => {
          return sum + parseNum(mov.total);
      }, 0);
  }, [movimientos]);

  const ventasPorMetodo = useMemo(() => {
      const totales = {};
      
      (movimientos || []).forEach(mov => {
          const raw = (mov.metodo_pago || '').toLowerCase().trim();
          const metodo = ['qr', 'transferencia', 'efectivo', 'credito'].includes(raw) ? raw : 'otros';
          totales[metodo] = (totales[metodo] || 0) + parseNum(mov.total);
      });
      return totales;
  }, [movimientos]);

  const { gastosPorMetodo, egresosTotales } = useMemo(() => {
      const totales = {};
      let sumaTotal = 0;
      
      (gastos || []).forEach(gasto => {
          const valor = parseNum(gasto.valor);
          const raw = (gasto.metodo_pago || '').toLowerCase().trim();
          const metodo = ['qr', 'transferencia', 'efectivo', 'credito'].includes(raw) ? raw : 'otros';
          totales[metodo] = (totales[metodo] || 0) + valor;
          sumaTotal += valor;
      });
      return { gastosPorMetodo: totales, egresosTotales: sumaTotal };
  }, [gastos]);

  const costosProduccionTotal = useMemo(() => {
      return (movimientos || []).reduce((sum, mov) => {
          return sum + (parseFloat(mov.costo_produccion) || 0);
      }, 0);
  }, [movimientos]);

  const totalGeneral = (ingresosTotales || 0) - (egresosTotales || 0);
  const totalGanancias = (totalGeneral || 0) - (deudasSaldoTotal || 0);

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

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isLargeScreen ? 'repeat(5, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))', 
                gap: '10px', 
                marginBottom: '10px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '12px 15px', minHeight: '110px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                    {loading ? (
                        <>
                            <Skeleton width="70%" height="16px" style={{ marginBottom: '6px', maxWidth: '120px' }} />
                            <Skeleton width="85%" height="22px" style={{ marginBottom: '4px', maxWidth: '140px' }} />
                            <Skeleton width="40%" height="14px" style={{ maxWidth: '60px' }} />
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px', fontWeight: '650', textTransform: 'uppercase', color: '#666', marginBottom: '4px', wordBreak: 'break-word', maxWidth: '100%' }}>Ingresos Totales</span>
                            <span style={{ fontSize: isLargeScreen ? '21px' : '18px', fontWeight: 'bold', color: '#28a745', wordBreak: 'break-all', maxWidth: '100%' }}>Bs. {formatPrecio(ingresosTotales || 0)}</span>
                            <span style={{ fontSize: '13px', textTransform: 'none', fontWeight: '600', color: '#28a745', marginTop: '4px' }}>Ventas</span>
                        </>
                    )}
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '12px 15px', minHeight: '110px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                    {loadingGastos ? (
                        <>
                            <Skeleton width="70%" height="16px" style={{ marginBottom: '6px', maxWidth: '120px' }} />
                            <Skeleton width="85%" height="22px" style={{ marginBottom: '4px', maxWidth: '140px' }} />
                            <Skeleton width="40%" height="14px" style={{ maxWidth: '60px' }} />
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px', fontWeight: '650', textTransform: 'uppercase', color: '#666', marginBottom: '4px', wordBreak: 'break-word', maxWidth: '100%' }}>Egresos Totales</span>
                            <span style={{ fontSize: isLargeScreen ? '21px' : '18px', fontWeight: 'bold', color: '#dc3545', wordBreak: 'break-all', maxWidth: '100%' }}>Bs. {formatPrecio(egresosTotales || 0)}</span>
                            <span style={{ fontSize: '13px', textTransform: 'none', fontWeight: '600', color: '#dc3545', marginTop: '4px' }}>Pagos</span>
                        </>
                    )}
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '12px 15px', minHeight: '110px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                    {loading || loadingGastos ? (
                        <>
                            <Skeleton width="70%" height="16px" style={{ marginBottom: '6px', maxWidth: '120px' }} />
                            <Skeleton width="85%" height="22px" style={{ marginBottom: '4px', maxWidth: '140px' }} />
                            <Skeleton width="60%" height="14px" style={{ maxWidth: '110px' }} />
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px', fontWeight: '650', textTransform: 'uppercase', color: '#666', marginBottom: '4px', wordBreak: 'break-word', maxWidth: '100%' }}>Total General</span>
                            <span style={{ fontSize: isLargeScreen ? '21px' : '18px', fontWeight: 'bold', color: 'var(--info-color)', wordBreak: 'break-all', maxWidth: '100%' }}>Bs. {formatPrecio(totalGeneral || 0)}</span>
                            <span style={{ fontSize: '13px', textTransform: 'none', fontWeight: 'normal', color: '#888', marginTop: '4px' }}><span style={{ color: '#28a745', fontWeight: '600' }}>Ingresos</span> - <span style={{ color: '#dc3545', fontWeight: '600' }}>Egresos</span></span>
                        </>
                    )}
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '12px 15px', minHeight: '110px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                    {loadingDeudas ? (
                        <>
                            <Skeleton width="70%" height="16px" style={{ marginBottom: '6px', maxWidth: '120px' }} />
                            <Skeleton width="85%" height="22px" style={{ marginBottom: '4px', maxWidth: '140px' }} />
                            <Skeleton width="40%" height="14px" style={{ maxWidth: '60px' }} />
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px', fontWeight: '650', textTransform: 'uppercase', color: '#666', marginBottom: '4px', wordBreak: 'break-word', maxWidth: '100%' }}>Deudas Pendientes</span>
                            <span style={{ fontSize: isLargeScreen ? '21px' : '18px', fontWeight: 'bold', color: 'var(--warning-color)', wordBreak: 'break-all', maxWidth: '100%' }}>Bs. {formatPrecio(deudasSaldoTotal || 0)}</span>
                            <span style={{ fontSize: '13px', textTransform: 'none', fontWeight: '600', color: 'var(--warning-color)', marginTop: '4px' }}>Total Deudas</span>
                        </>
                    )}
                </div>
                <div style={{ gridColumn: isLargeScreen ? 'auto' : '1 / -1', background: 'white', borderRadius: '12px', padding: '12px 15px', minHeight: '110px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                    {loading || loadingGastos || loadingDeudas ? (
                        <>
                            <Skeleton width="70%" height="16px" style={{ marginBottom: '6px', maxWidth: '120px' }} />
                            <Skeleton width="85%" height="22px" style={{ marginBottom: '4px', maxWidth: '140px' }} />
                            <Skeleton width="60%" height="14px" style={{ maxWidth: '110px' }} />
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px', fontWeight: '650', textTransform: 'uppercase', color: '#666', marginBottom: '4px', wordBreak: 'break-word', maxWidth: '100%' }}>Total Ganancias</span>
                            <span style={{ fontSize: isLargeScreen ? '21px' : '18px', fontWeight: 'bold', color: 'var(--primary-color)', wordBreak: 'break-all', maxWidth: '100%' }}>Bs. {formatPrecio(totalGanancias || 0)}</span>
                            <span style={{ fontSize: '13px', textTransform: 'none', fontWeight: 'normal', color: '#888', marginTop: '4px' }}><span style={{ color: 'var(--info-color)', fontWeight: '600' }}>Total General</span> - <span style={{ color: 'var(--warning-color)', fontWeight: '600' }}>Deudas</span></span>
                        </>
                    )}
                </div>
            </div>

            <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBlock: '15px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Resumen por Método de Pago</h3>
            
            <LayoutGrid columns={5}>
                {loading || loadingGastos ? (
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
      
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Balance;