import React, { useState, useCallback, useMemo } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import pricesTypesService from '../../../services/pricesTypesService';
import ItemMultiple from '../../../components/common/information/ItemMultiple';
import useSessionCache from '../../../hooks/useSessionCache';
import FetchData from '../../../components/mixed/FetchData';
import LayoutGrid from '../../../components/layout/LayoutGrid';
import BotonFlotante from '../../../components/common/botones/BotonFlotante';
import AgregarEditarPrecio from './modals/AgregarEditarPrecio';
import EliminarPrecio from './modals/EliminarPrecio';

const Precios = () => {
  const { isLargeScreen } = useLayout();

  // Estados para precios (persistidos por sesión)
  const {
    value: precios,
    setValue: setPrecios,
  } = useSessionCache({
    key: 'preciosListado',
    defaultValue: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para los modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [precioSeleccionado, setPrecioSeleccionado] = useState(null);

  const handlePreciosLoaded = useCallback((data) => {
    setPrecios(data || []);
    setError(null);
  }, [setPrecios]);

  const handleLoadingStart = useCallback(() => {
    if (precios.length === 0) {
      setIsLoading(true);
    }
  }, [precios.length]);

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
          <h1 className={styles.title}>Precios</h1>
          <LayoutGrid
            columns={3}
            isLoading={isLoading}
            empty={precios.length === 0}
            emptyMessage="No hay precios cargados."
          >
            {precios.map((precio, index) => (
              <ItemMultiple
                key={precio.id || index}
                title={precio.name || precio.nombre || 'Sin nombre'}
                description={precio.description || precio.descripcion || 'Sin descripción'}
                onEdit={() => {
                  setPrecioSeleccionado(precio);
                  setIsModalOpen(true);
                }}
                onDelete={() => {
                  setPrecioSeleccionado(precio);
                  setIsDeleteModalOpen(true);
                }}
              />
            ))}
          </LayoutGrid>
        </div>
      </div>

      {/* Botón flotante para agregar nuevo precio */}
      <BotonFlotante
        onClick={() => {
          setPrecioSeleccionado(null);
          setIsModalOpen(true);
        }}
        iconName="plus"
        ariaLabel="Nuevo Tipo de Precio"
        style={{ bottom: !isLargeScreen ? '80px' : undefined }}
      />

      {/* Modal para agregar o editar precio */}
      <AgregarEditarPrecio
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        precioSeleccionado={precioSeleccionado}
        onGuardar={(nuevoPrecio) => {
          if (precioSeleccionado) {
            setPrecios(prev => prev.map(p => p.id === precioSeleccionado.id ? { ...p, ...nuevoPrecio } : p));
          } else {
            setPrecios(prev => [...prev, { id: nuevoPrecio?.id || Date.now(), ...nuevoPrecio }]);
          }
          setIsModalOpen(false);
        }}
      />

      {/* Modal para eliminar precio */}
      <EliminarPrecio
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        precioSeleccionado={precioSeleccionado}
        onEliminar={(idEliminado) => {
          setPrecios(prev => prev.filter(p => p.id !== idEliminado));
          setIsDeleteModalOpen(false);
        }}
      />

      <FetchData
        service={pricesTypesService}
        serviceName="pricesTypesService"
        methodParams={[null, false]}
        isOpen={true}
        onDataLoaded={handlePreciosLoaded}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Precios;