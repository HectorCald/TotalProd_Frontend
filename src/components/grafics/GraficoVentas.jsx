import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import useFormatNumber from '../../hooks/useFormatNumber';
import Skeleton from '../common/widgets/Skeleton';
import styles from './GraficoVentas.module.css';

const GraficoVentas = ({ data = [], cargando = false }) => {
  const { formatPrice } = useFormatNumber();

  const mesActual = React.useMemo(() => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[new Date().getMonth()];
  }, []);

  return (
    <div className={styles.contenedorGrafico}>
      <div className={styles.cabecera}>
        <h3 className={styles.titulo}>{`Ventas (${mesActual})`}</h3>
      </div>
      <div className={styles.cuerpoGrafico}>
        {cargando ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <Skeleton width="100%" height="300px" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="fecha" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
              />
              <YAxis 
                yAxisId="left"
                domain={[0, 'auto']}
                allowDecimals={false}
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[0, 'auto']}
                allowDecimals={false}
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
              />
              <Tooltip 
                formatter={(value, name) => [name === 'Ventas' ? `Bs. ${formatPrice(value)}` : value, name]} 
                labelFormatter={(label) => {
                  const mapMeses = {
                    'Ene': 'Enero', 'Feb': 'Febrero', 'Mar': 'Marzo', 'Abr': 'Abril',
                    'May': 'Mayo', 'Jun': 'Junio', 'Jul': 'Julio', 'Ago': 'Agosto',
                    'Sep': 'Septiembre', 'Oct': 'Octubre', 'Nov': 'Noviembre', 'Dic': 'Diciembre'
                  };
                  return mapMeses[label] || label;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar 
                yAxisId="left"
                dataKey="Ventas" 
                fill="#6366f1" 
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
              <Bar 
                yAxisId="right"
                dataKey="Pedidos" 
                fill="#f97316" 
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default GraficoVentas;
