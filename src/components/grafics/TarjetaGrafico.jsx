import React from 'react';
import styles from './TarjetaGrafico.module.css';
import Skeleton from '../common/widgets/Skeleton';
import useFormatNumber from '../../hooks/useFormatNumber';

const TarjetaGrafico = ({ titulo, valor = 0, cargando, color, noDisponible = false }) => {
  const { formatPrice } = useFormatNumber();

  if (cargando) {
    return (
      <div className={styles.contenedorTarjeta}>
        <h3 className={styles.titulo}>{titulo}</h3>
        <Skeleton width="120px" height="30px" />
      </div>
    );
  }

  const valorAMostrar = noDisponible ? (typeof valor === 'number' && valor === 0 ? 0 : valor) : valor;
  const valorFormateado = typeof valorAMostrar === 'number' ? `Bs. ${formatPrice(valorAMostrar)}` : valorAMostrar;

  return (
    <div className={styles.contenedorTarjeta}>
      {noDisponible && (
        <div className={styles.overlayBloqueo}>
          <span className={styles.badgeNoDisponible}>No disponible por el momento</span>
        </div>
      )}
      <h3 className={styles.titulo}>{titulo}</h3>
      <div className={styles.filaValor}>
        <span className={styles.valor} style={color ? { color } : undefined}>{valorFormateado}</span>
      </div>
    </div>
  );
};

export default TarjetaGrafico;
