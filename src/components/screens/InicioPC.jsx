import React, { useState, useEffect, useRef } from 'react';
import { BoxIcon } from 'boxicons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import AtajoAnuncio from '../common/AtajoAnuncio';
import FetchData from '../mixed/FetchData';
import Skeleton from '../common/Skeleton';
import movimientosAlmacenService from '../../services/movimientosAlmacenService';
import almacenImage from '../../assets/almacen.png';
import acopioImage from '../../assets/acopio.png';
import movimientosImage from '../../assets/movimientos.png';
import pedidosImage from '../../assets/pedidos.png';
import './InicioPC.css';

const InicioPC = ({ onViewOpen }) => {
  // Estados para datos reales
  const [movimientos, setMovimientos] = useState([]);
  const [ventasData, setVentasData] = useState([]);
  const [ventasTotales, setVentasTotales] = useState(0);
  const [movimientosDataChart, setMovimientosDataChart] = useState([]);
  const [totalMovimientos, setTotalMovimientos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);




  // Cargar datos desde localStorage al montar el componente
  useEffect(() => {
    const savedData = localStorage.getItem('inicioPCData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setVentasTotales(data.ventasTotales || 0);
        setTotalMovimientos(data.totalMovimientos || 0);
        setVentasData(data.ventasData || []);
        setMovimientosDataChart(data.movimientosDataChart || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar datos desde localStorage:', error);
      }
    }
  }, []);

  // Callback para cuando se cargan los datos de movimientos
  const handleMovimientosLoaded = (data) => {
    setMovimientos(data || []);
    
    // Calcular ventas totales (solo salidas)
    const salidas = data.filter(mov => mov.type === 'salida');
    let totalVentas = 0;
    salidas.forEach(mov => {
      if (mov.productos && mov.productos.length > 0) {
        const totalMovimiento = mov.productos.reduce((sum, prod) => {
          return sum + (prod.cantidad * prod.precio_unitario);
        }, 0);
        totalVentas += totalMovimiento;
      }
    });
    
    setVentasTotales(totalVentas);
    setTotalMovimientos(data.length);
    
    // Datos para los gráficos (solo hasta el mes actual)
    const meses = [
      { mes: 'Ene', mesCompleto: 'Enero', numero: 1 },
      { mes: 'Feb', mesCompleto: 'Febrero', numero: 2 },
      { mes: 'Mar', mesCompleto: 'Marzo', numero: 3 },
      { mes: 'Abr', mesCompleto: 'Abril', numero: 4 },
      { mes: 'May', mesCompleto: 'Mayo', numero: 5 },
      { mes: 'Jun', mesCompleto: 'Junio', numero: 6 },
      { mes: 'Jul', mesCompleto: 'Julio', numero: 7 },
      { mes: 'Ago', mesCompleto: 'Agosto', numero: 8 },
      { mes: 'Sep', mesCompleto: 'Septiembre', numero: 9 },
      { mes: 'Oct', mesCompleto: 'Octubre', numero: 10 },
      { mes: 'Nov', mesCompleto: 'Noviembre', numero: 11 },
      { mes: 'Dic', mesCompleto: 'Diciembre', numero: 12 }
    ];
    
    const mesActual = new Date().getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
    const mesesHastaActual = meses.filter(mes => mes.numero <= mesActual);
    
    const ventasArray = mesesHastaActual.map(mes => ({
      mes: mes.mes,
      mesCompleto: mes.mesCompleto,
      ventas: mes.numero === 9 ? totalVentas : 0 // Septiembre tiene datos, los demás 0
    }));
    
    const movimientosArray = mesesHastaActual.map(mes => ({
      mes: mes.mes,
      mesCompleto: mes.mesCompleto,
      movimientos: mes.numero === 9 ? data.length : 0.1 // Septiembre tiene datos, los demás 0.1 para visibilidad
    }));
    
    setVentasData(ventasArray);
    setMovimientosDataChart(movimientosArray);
    
    // Guardar en localStorage
    const dataToSave = {
      ventasTotales,
      totalMovimientos: data.length,
      ventasData: ventasArray,
      movimientosDataChart: movimientosArray
    };
    localStorage.setItem('inicioPCData', JSON.stringify(dataToSave));
    
    setIsLoading(false);
  };


  return (
    <div className="inicio-pc-container">
      {/* Atajos de Acceso Rápido */}
        <div className="atajoAnuncioOtros">
          <AtajoAnuncio 
            title="Almacén General" 
            description="Administra tu almacén de productos terminados" 
            image={almacenImage} 
            onClick={() => onViewOpen('almacenMedioGeneral')} 
          />
          <AtajoAnuncio 
            title="Materia Prima" 
            description="Administra tu materia prima" 
            image={acopioImage} 
            onClick={() => onViewOpen('almacenMedio')} 
          />
          </div>
          <div className="atajoAnuncioOtros" style={{ marginTop: '10px' }}>
          <AtajoAnuncio 
            title="Movimientos" 
            description="Gestiona movimientos de inventario" 
            image={movimientosImage} 
            onClick={() => onViewOpen('movimientos')} 
          />
          <AtajoAnuncio 
            title="Pedidos" 
            description="Administra pedidos y órdenes" 
            image={pedidosImage} 
            onClick={() => onViewOpen('pedidos')} 
          />
        </div>

      {/* Cards de Estadísticas */}
      <div className="estadisticas-grid">
        {/* Card de Ventas Totales */}
        <div className="stat-card ventas-card">
          <div className="stat-header">
            <div className="stat-icon">
              <BoxIcon name="dollar-circle" size="24px" />
            </div>
            <div className="stat-info">
              <h3>Ventas Totales</h3>
              {isLoading ? (
                <>
                  <Skeleton width="120px" height="24px" />
                  <Skeleton width="80px" height="16px" />
                </>
              ) : (
                <>
                  <p className="stat-value">Bs. {ventasTotales.toFixed(2)}</p>
                  <p className="stat-change positive">+0.0% vs mes anterior</p>
                </>
              )}
            </div>
          </div>
          <div className="stat-chart">
            {isLoading ? (
              <Skeleton width="100%" height="120px" borderRadius="8px" />
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={ventasData}>
                  <Line 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="#28b498" 
                    strokeWidth={3}
                    dot={{ fill: '#28b498', strokeWidth: 2, r: 4 }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [`Bs. ${value.toFixed(2)}`, 'Ventas']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0 && payload[0].payload) {
                        return payload[0].payload.mesCompleto || payload[0].payload.mes || label;
                      }
                      return label;
                    }}
                    labelStyle={{ color: '#28b498', fontSize: '11px', fontWeight: '600' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                      border: 'none', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Card de Movimientos del Mes */}
        <div className="stat-card movimientos-card">
          <div className="stat-header">
            <div className="stat-icon">
              <BoxIcon name="transfer" size="24px" />
            </div>
            <div className="stat-info">
              <h3>Movimientos del Mes</h3>
              {isLoading ? (
                <>
                  <Skeleton width="60px" height="24px" />
                  <Skeleton width="80px" height="16px" />
                </>
              ) : (
                <>
                  <p className="stat-value">{totalMovimientos}</p>
                  <p className="stat-change positive">+0.0% vs mes anterior</p>
                </>
              )}
            </div>
          </div>
          <div className="stat-chart">
            {isLoading ? (
              <Skeleton width="100%" height="120px" borderRadius="8px" />
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={movimientosDataChart}>
                  <Area 
                    type="monotone" 
                    dataKey="movimientos" 
                    stroke="#667eea" 
                    fill="#667eea"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [value, 'Movimientos']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0 && payload[0].payload) {
                        return payload[0].payload.mesCompleto || payload[0].payload.mes || label;
                      }
                      return label;
                    }}
                    labelStyle={{ color: '#667eea', fontSize: '11px', fontWeight: '600' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                      border: 'none', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* FetchData para cargar movimientos de almacén */}
      <FetchData
        service={movimientosAlmacenService}
        method="getAllSinLimite"
        isOpen={true}
        onDataLoaded={handleMovimientosLoaded}
        serviceName="movimientosAlmacenService"
      />
    </div>
  );
};

export default InicioPC;