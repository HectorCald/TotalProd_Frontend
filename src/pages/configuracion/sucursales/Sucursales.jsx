import React, { useState, useCallback } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import sucursalesService from '../../../services/sucursalesService';
import ItemMultiple from '../../../components/common/information/ItemMultiple';
import useSessionCache from '../../../hooks/useSessionCache';
import FetchData from '../../../components/mixed/FetchData';
import LayoutGrid from '../../../components/layout/LayoutGrid';
import BotonFlotante from '../../../components/common/botones/BotonFlotante';
import AgregarEditarSucursal from './modals/AgregarEditarSucursal';
import EliminarSucursal from './modals/EliminarSucursal';

const Sucursales = () => {
  const { isLargeScreen } = useLayout();

  // Estados para sucursales (persistidos por sesión)
  const {
    value: sucursales,
    setValue: setSucursales,
  } = useSessionCache({
    key: 'sucursalesListadoConfig',
    defaultValue: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para los modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);

  const handleSucursalesLoaded = useCallback((data) => {
    setSucursales(data || []);
    setError(null);
  }, [setSucursales]);

  const handleLoadingStart = useCallback(() => {
    if (sucursales.length === 0) {
      setIsLoading(true);
    }
  }, [sucursales.length]);

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
          <h1 className={styles.title}>Sucursales</h1>
          <LayoutGrid
            columns={3}
            isLoading={isLoading}
            empty={sucursales.length === 0}
            emptyMessage="No hay sucursales cargadas."
          >
            {sucursales.map((sucursal, index) => {
              const isCasaMatriz = sucursal.name === 'Casa Matriz';
              return (
                <ItemMultiple
                  key={sucursal.id || index}
                  icon="store"
                  title={sucursal.name || 'Sin nombre'}
                  description={sucursal.almacen_sucursal_id ? 'Comparte almacén' : 'Almacén propio'}
                  onEdit={isCasaMatriz ? null : () => {
                    setSucursalSeleccionada(sucursal);
                    setIsModalOpen(true);
                  }}
                  onDelete={isCasaMatriz ? null : () => {
                    setSucursalSeleccionada(sucursal);
                    setIsDeleteModalOpen(true);
                  }}
                />
              );
            })}
          </LayoutGrid>
        </div>
      </div>

      {/* Botón flotante para agregar nueva sucursal */}
      <BotonFlotante
        onClick={() => {
          setSucursalSeleccionada(null);
          setIsModalOpen(true);
        }}
        iconName="plus"
        ariaLabel="Nueva Sucursal"
        style={{ bottom: !isLargeScreen ? '100px' : undefined }}
      />

      {/* Modal para agregar o editar sucursal */}
      <AgregarEditarSucursal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sucursalSeleccionada={sucursalSeleccionada}
        onGuardar={(nuevaSucursal) => {
          if (sucursalSeleccionada) {
            setSucursales(prev => prev.map(s => s.id === sucursalSeleccionada.id ? { ...s, ...nuevaSucursal } : s));
          } else {
            setSucursales(prev => [...prev, { id: nuevaSucursal?.id || Date.now(), ...nuevaSucursal }]);
          }
          setIsModalOpen(false);
        }}
      />

      {/* Modal para eliminar sucursal */}
      <EliminarSucursal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        sucursalSeleccionada={sucursalSeleccionada}
        onEliminar={(idEliminado) => {
          setSucursales(prev => prev.filter(s => s.id !== idEliminado));
          setIsDeleteModalOpen(false);
        }}
      />

      <FetchData
        service={sucursalesService}
        method="getByEmpresaId"
        methodParams={[null, false]}
        serviceName="sucursalesService"
        isOpen={true}
        onDataLoaded={handleSucursalesLoaded}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Sucursales;