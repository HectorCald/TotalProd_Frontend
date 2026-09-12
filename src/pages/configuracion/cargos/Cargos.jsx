import React, { useState, useCallback } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import cargosService from '../../../services/cargosService';
import ItemMultiple from '../../../components/common/information/ItemMultiple';
import useSessionCache from '../../../hooks/useSessionCache';
import FetchData from '../../../components/mixed/FetchData';
import LayoutGrid from '../../../components/layout/LayoutGrid';
import BotonFlotante from '../../../components/common/botones/BotonFlotante';
import AgregarEditarCargo from './modals/AgregarEditarCargo';
import EliminarCargo from './modals/EliminarCargo';

const Cargos = () => {
  const { isLargeScreen } = useLayout();

  // Estados para cargos (persistidos por sesión)
  const {
    value: cargos,
    setValue: setCargos,
  } = useSessionCache({
    key: 'cargosListado',
    defaultValue: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para los modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cargoSeleccionado, setCargoSeleccionado] = useState(null);

  const handleCargosLoaded = useCallback((data) => {
    setCargos(data || []);
    setError(null);
  }, [setCargos]);

  const handleLoadingStart = useCallback(() => {
    if (cargos.length === 0) {
      setIsLoading(true);
    }
  }, [cargos.length]);

  const handleLoadingEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err) => {
    setError(err);
  }, []);

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Cargos</h1>
          <LayoutGrid
            columns={3}
            isLoading={isLoading}
            empty={cargos.length === 0}
            emptyMessage="No hay cargos cargados."
          >
            {cargos.map((cargo, index) => (
              <ItemMultiple
                key={cargo.id || index}
                title={cargo.name || cargo.nombre || 'Sin nombre'}
                description={cargo.description || cargo.descripcion || 'Sin descripción'}
                onEdit={() => {
                  setCargoSeleccionado(cargo);
                  setIsModalOpen(true);
                }}
                onDelete={() => {
                  setCargoSeleccionado(cargo);
                  setIsDeleteModalOpen(true);
                }}
              />
            ))}
          </LayoutGrid>
        </div>
      </div>

      {/* Botón flotante para agregar nuevo cargo */}
      <BotonFlotante
        onClick={() => {
          setCargoSeleccionado(null);
          setIsModalOpen(true);
        }}
        iconName="plus"
        ariaLabel="Nuevo Cargo"
        style={{ bottom: !isLargeScreen ? '100px' : undefined }}
      />

      {/* Modal para agregar o editar cargo */}
      <AgregarEditarCargo
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cargoSeleccionado={cargoSeleccionado}
        onGuardar={(nuevoCargo) => {
          if (cargoSeleccionado) {
            setCargos(prev => prev.map(c => c.id === cargoSeleccionado.id ? { ...c, ...nuevoCargo } : c));
          } else {
            setCargos(prev => [...prev, { id: nuevoCargo?.id || Date.now(), ...nuevoCargo }]);
          }
          setIsModalOpen(false);
        }}
      />

      {/* Modal para eliminar cargo */}
      <EliminarCargo
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        cargoSeleccionado={cargoSeleccionado}
        onEliminar={(idEliminado) => {
          setCargos(prev => prev.filter(c => c.id !== idEliminado));
          setIsDeleteModalOpen(false);
        }}
      />

      <FetchData
        service={cargosService}
        serviceName="cargosService"
        isOpen={true}
        onDataLoaded={handleCargosLoaded}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Cargos;
