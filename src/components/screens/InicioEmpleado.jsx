import React from 'react';
import { getAvailableMainModules } from '../../constants/modules';
import AtajoAnuncio from '../common/AtajoAnuncio';
import styles from '../../styles/view.module.css';

const InicioEmpleado = ({ employee, onMainModuleClick }) => {
  // Obtener módulos principales disponibles
  const availableMainModules = getAvailableMainModules(employee.modules || []);

  return (
    <div>
      <div className={styles.modulos}>
        <p className={styles.subTitle}>Módulos Disponibles</p>
        {availableMainModules.map((module, index) => (
          <AtajoAnuncio
            key={index}
            title={module.name}
            description={module.description}
            image={module.image}
            onClick={() => onMainModuleClick(module)}
          />
        ))}
      </div>

      {availableMainModules.length === 0 && (
        <div className={styles.noData}>
          <p>No tienes módulos asignados</p>
        </div>
      )}
    </div>
  );
};

export default InicioEmpleado;
