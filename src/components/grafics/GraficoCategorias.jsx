import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Skeleton from '../common/widgets/Skeleton';
import styles from './GraficoCategorias.module.css';

const GraficoCategorias = ({ data = [], total = 0, cargando = false, noDisponible = false }) => {
  const formatInteger = (val) => {
    const num = parseInt(val ?? 0);
    if (isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const colores = [
    '#ef4444', // Rojo
    '#3b82f6', // Azul
    '#10b981', // Verde
    '#f59e0b', // Naranja/Ámbar
    '#ec4899', // Rosado
    '#8b5cf6', // Púrpura
    '#06b6d4', // Cyan
    '#eab308', // Amarillo
    '#14b8a6', // Teal
    '#64748b'  // Gris Slate
  ];

  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) {
      return [{ nombre: 'Sin datos', valor: 1, visual_valor: 1 }];
    }
    const sumValues = data.reduce((acc, curr) => acc + curr.valor, 0);
    const minThreshold = sumValues * 0.025; // 2.5% minimum visual width
    return data.map(item => {
      const visualValue = item.valor > 0 && item.valor < minThreshold ? minThreshold : item.valor;
      return {
        ...item,
        visual_valor: visualValue
      };
    });
  }, [data]);

  const mesActual = React.useMemo(() => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[new Date().getMonth()];
  }, []);

  const totalAMostrar = noDisponible ? (total || 0) : total;

  return (
    <div className={styles.contenedorTarjeta}>
      {noDisponible && (
        <div className={styles.overlayBloqueo}>
          <span className={styles.badgeNoDisponible}>No disponible por el momento</span>
        </div>
      )}
      {cargando ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '280px', gap: '20px' }}>
          <Skeleton width="160px" height="160px" borderRadius="50%" />
          <Skeleton width="120px" height="20px" />
        </div>
      ) : (
        <>
          <div className={styles.contenedorCabeceraYGrafico}>
            <h3 className={styles.titulo}>{`Categorías (${mesActual})`}</h3>
            <div className={styles.contenedorSeccionGrafica}>
              <div className={styles.contenedorGraficoRelativo}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="visual_valor"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [formatInteger(props.payload.valor), name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.centroTexto}>
                  <span className={styles.valorCentro}>{formatInteger(totalAMostrar)}</span>
                  <span className={styles.labelCentro} style={{ textAlign: 'center', lineHeight: '1.2' }}>Productos<br/>vendidos</span>
                </div>
              </div>

              <div className={styles.subtituloCategorias}>{data.length < 6 ? 'Categorías más vendidas' : '6 categorías más vendidas'}</div>
            </div>
          </div>

          <div className={styles.leyenda}>
            {data.map((item, index) => (
              <div key={index} className={styles.itemLeyenda}>
                <span className={styles.punto} style={{ backgroundColor: colores[index % colores.length] }} />
                <span className={styles.textoItem}>{item.nombre}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GraficoCategorias;
