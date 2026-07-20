import React from 'react';
import styles from './TarjetaGrafico.module.css';
import Skeleton from '../common/widgets/Skeleton';
import useFormatNumber from '../../hooks/useFormatNumber';

const TarjetaGrafico = ({ titulo, valor, cargando, color }) => {
  const { formatPrice } = useFormatNumber();

  if (cargando) {
    return (
      <div className={styles.contenedorTarjeta}>
        <h3 className={styles.titulo}>{titulo}</h3>
      
          <Skeleton width="120px" height="30px" />
        
      </div>
    );
  }

  const valorFormateado = typeof valor === 'number' ? `Bs. ${formatPrice(valor)}` : valor;

  return (
    <div className={styles.contenedorTarjeta}>
      <h3 className={styles.titulo}>{titulo}</h3>
      <div className={styles.filaValor}>
        <span className={styles.valor} style={color ? { color } : undefined}>{valorFormateado}</span>
      </div>
    </div>
  );
};

export default TarjetaGrafico;
