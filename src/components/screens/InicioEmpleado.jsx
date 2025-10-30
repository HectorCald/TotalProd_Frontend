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
          {(() => {
            // Agrupar por secciones como en la barra lateral del empleado
            const sectionMap = {
              // INVENTARIO
              'Almacen': 'INVENTARIO',
              'Acopio': 'INVENTARIO',
              // REGISTROS Y PEDIDOS
              'Movimientos': 'REGISTROS Y PEDIDOS',
              'Conteos': 'REGISTROS Y PEDIDOS',
              'Pedidos': 'REGISTROS Y PEDIDOS',
              'Cotizaciones': 'REGISTROS Y PEDIDOS',
              // GESTIÓN
              'Clientes': 'GESTIÓN',
              'Proveedores': 'GESTIÓN',
              // FINANZAS
              'Gastos': 'FINANZAS',
              'Deudas': 'FINANZAS',
              'Balance': 'FINANZAS',
              'Reportes': 'FINANZAS',
              // CONFIGURACIÓN
              'Precios': 'CONFIGURACIÓN',
              // DAMABRAVA
              'Damabrava': 'DAMABRAVA'
            };

            const buckets = new Map();
            availableMainModules.forEach((module) => {
              const sectionTitle = sectionMap[module.key] || 'INVENTARIO';
              if (!buckets.has(sectionTitle)) buckets.set(sectionTitle, []);
              buckets.get(sectionTitle).push(module);
            });

            // Orden sugerido de secciones
            const order = ['INVENTARIO', 'REGISTROS Y PEDIDOS', 'GESTIÓN', 'FINANZAS', 'CONFIGURACIÓN', 'DAMABRAVA'];
            const orderedSections = order.filter(title => buckets.has(title));

            return orderedSections.map((title) => (
              <div key={title} className={styles.section}>
                <p className={styles.subTitle}>{title}</p>
                {buckets.get(title).map((module, index) => {
                  const hasSingleSubmodule = Array.isArray(module.submodules) && module.submodules.length === 1;
                  const singleSub = hasSingleSubmodule ? module.submodules[0] : null;

                  const shouldShowParen = hasSingleSubmodule && singleSub?.name && singleSub.name !== module.name;
                  const cardTitle = shouldShowParen ? (
                    <>
                      <span>{module.name}</span>{' '}
                      <span style={{ fontWeight: 400, color: 'var(--primary-color)', fontSize: 'calc(1em - 2px)' }}>({singleSub.name})</span>
                    </>
                  ) : module.name;

                  const cardDescription = hasSingleSubmodule ? (singleSub.description || module.description) : module.description;

                  return (
                    <AtajoAnuncio
                      key={`${title}-${index}`}
                      title={cardTitle}
                      description={cardDescription}
                      image={module.image}
                      onClick={() => onMainModuleClick(module)}
                    />
                  );
                })}
              </div>
            ));
          })()}
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
