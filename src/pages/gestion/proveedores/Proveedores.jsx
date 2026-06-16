import React, { useState, useCallback } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import useSessionCache from '../../../hooks/useSessionCache';
import FetchData from '../../../components/mixed/FetchData';
import proveedorService from '../../../services/proveedorService';
import AgregarEditarProveedor from './modals/AgregarEditarProveedor';
import EliminarProveedor from './modals/EliminarProveedor';
import ViewInfo from './modals/ViewInfo';


const Proveedores = () => {
  const { isLargeScreen } = useLayout();

  const {
    value: proveedores,
    setValue: setProveedores,
  } = useSessionCache({
    key: 'proveedoresListado',
    defaultValue: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  const handleProveedoresLoaded = useCallback((data) => {
    setProveedores(data);
    setError(null);
  }, [setProveedores]);

  const handleLoadingStart = useCallback(() => {
    if (proveedores.length === 0) {
      setIsLoading(true);
    }
  }, [proveedores.length]);

  const handleLoadingEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err) => {
    setError(err);
  }, []);

  const tableActions = [
    {
      name: 'Detalles', icon: 'show', onClick: (proveedor) => {
        setProveedorSeleccionado(proveedor);
        setIsViewModalOpen(true);
      }
    },
    {
      name: 'Editar', icon: 'edit', onClick: (proveedor) => {
        setProveedorSeleccionado(proveedor);
        setIsModalOpen(true);
      }
    },
    {
      name: 'Eliminar', icon: 'trash', onClick: (proveedor) => {
        setProveedorSeleccionado(proveedor);
        setIsDeleteModalOpen(true);
      }
    },
  ];

  const columns = [
    {
      header: 'Nombre',
      accessor: 'name',
      style: { fontWeight: 600, color: '#333' },
      hasIcon: true,
      width: '20%'
    },
    {
      header: 'Descripción',
      accessor: 'description',
      truncate: true,
      width: '30%'
    },
    {
      header: 'Teléfono',
      accessor: 'phone',
      width: '25%'
    },
    {
      header: 'Total Pedidos',
      accessor: 'total_orders',
      width: '25%'
    }
  ];

  return (
    <>
      {isLargeScreen && <NavBar />}
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Proveedores</h1>
          <Tabla
            data={proveedores}
            columns={columns}
            isLoading={isLoading}
            acciones={tableActions}
            buttonLabel="Nuevo Proveedor"
            onButtonClick={() => {
              setProveedorSeleccionado(null);
              setIsModalOpen(true);
            }}
            searchKeys={['name', 'phone']}
            sortKey="name"
            onRowClick={(proveedor) => {
              setProveedorSeleccionado(proveedor);
              setIsViewModalOpen(true);
            }}
          />
        </div>
      </div>
      <AgregarEditarProveedor
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        proveedorSeleccionado={proveedorSeleccionado}
        onGuardar={(nuevoProveedor) => {
          if (proveedorSeleccionado) {
            setProveedores(prev => prev.map(p => p.id === proveedorSeleccionado.id ? { ...p, ...nuevoProveedor } : p));
          } else {
            setProveedores(prev => [...prev, { id: nuevoProveedor?.id || Date.now(), ...nuevoProveedor }]);
          }
          setIsModalOpen(false);
        }}
      />
      <EliminarProveedor
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        proveedorSeleccionado={proveedorSeleccionado}
        onEliminar={(idEliminado) => {
          setProveedores(prev => prev.filter(p => p.id !== idEliminado));
        }}
      />
      <ViewInfo
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        proveedor={proveedorSeleccionado}
        onEdit={(proveedor) => {
          setProveedorSeleccionado(proveedor);
          setIsModalOpen(true);
        }}
      />
      <FetchData
        service={proveedorService}
        serviceName="proveedorService"
        isOpen={true}
        onDataLoaded={handleProveedoresLoaded}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />
    </>
  );
};

export default Proveedores;
