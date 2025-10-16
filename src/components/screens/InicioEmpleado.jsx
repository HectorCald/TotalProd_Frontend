import React, { useMemo } from 'react';
import { getAvailableMainModules } from '../../constants/modules';
import AtajoAnuncio from '../common/AtajoAnuncio';
import InicioEmpleadoPC from './InicioEmpleadoPC';
import styles from '../../styles/view.module.css';
import './Inicio.css';

const InicioEmpleado = ({ employee, onMainModuleClick, onViewOpen }) => {
  // Obtener módulos principales disponibles con memoización
  const availableMainModules = useMemo(() => {
    return getAvailableMainModules(employee.modules || []);
  }, [employee.modules]);

  return (
    <>
      {/* Contenido original para móvil */}
      <div className="inicio-mobile">
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

      {/* Contenido para pantallas grandes */}
      <div className="inicio-desktop">
        <InicioEmpleadoPC onViewOpen={onViewOpen} />
      </div>
    </>
  );
};

export default InicioEmpleado;
