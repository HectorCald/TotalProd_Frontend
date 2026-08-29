import React, { useState, useCallback } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import useSessionCache from '../../../hooks/useSessionCache';
import FetchData from '../../../components/mixed/FetchData';
import clientService from '../../../services/clientService';
import AgregarEditarCliente from './modals/AgregarEditarCliente';
import EliminarCliente from './modals/EliminarCliente';
import ViewInfo from './modals/ViewInfo';
import useVirtualPagination from '../../../hooks/useVirtualPagination';

const Clientes = () => {
  const { isLargeScreen } = useLayout();

  const {
    value: clientes,
    setValue: setClientes,
  } = useSessionCache({
    key: 'clientesListado',
    defaultValue: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [returnToViewOnDeleteClose, setReturnToViewOnDeleteClose] = useState(false);
  
  const [search, setSearch] = useState('');

  const filteredClientes = React.useMemo(() => {
    if (!search) return clientes;
    const s = search.toLowerCase();
    return clientes.filter(c => 
      (c.name && c.name.toLowerCase().includes(s)) ||
      (c.phone && c.phone.toLowerCase().includes(s))
    );
  }, [clientes, search]);

  const { visibleItems, hasMore, loadMore } = useVirtualPagination(filteredClientes, 30);

  const handleClientesLoaded = useCallback((data) => {
    setClientes(data);
    setError(null);
  }, [setClientes]);

  const handleLoadingStart = useCallback(() => {
    if (clientes.length === 0) {
      setIsLoading(true);
    }
  }, [clientes.length]);

  const handleLoadingEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err) => {
    setError(err);
  }, []);


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
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Clientes</h1>
          <Tabla
            data={visibleItems}
            columns={columns}
            isLoading={isLoading}
            buttonLabel="Nuevo Cliente"
            onButtonClick={() => {
              setClienteSeleccionado(null);
              setIsModalOpen(true);
            }}
            searchKeys={['name', 'phone']}
            sortKey="name"
            onRowClick={(cliente) => {
              setClienteSeleccionado(cliente);
              setIsViewModalOpen(true);
            }}
            remote={true}
            searchValue={search}
            onSearchChange={setSearch}
            onLoadMore={hasMore ? loadMore : undefined}
          />
        </div>
      </div>
      <AgregarEditarCliente
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clienteSeleccionado={clienteSeleccionado}
        onGuardar={(nuevoCliente) => {
          if (clienteSeleccionado) {
            setClientes(prev => prev.map(c => c.id === clienteSeleccionado.id ? { ...c, ...nuevoCliente } : c));
            setClienteSeleccionado(prev => ({ ...prev, ...nuevoCliente }));
          } else {
            setClientes(prev => [...prev, { id: nuevoCliente?.id || Date.now(), ...nuevoCliente }]);
          }
          setIsModalOpen(false);
        }}
      />
      <EliminarCliente
        isOpen={isDeleteModalOpen}
        onClose={(wasDeleted) => {
          setIsDeleteModalOpen(false);
          if (returnToViewOnDeleteClose && wasDeleted !== true) {
            setIsViewModalOpen(true);
          }
          setReturnToViewOnDeleteClose(false);
        }}
        clienteSeleccionado={clienteSeleccionado}
        onEliminar={(idEliminado) => {
          setClientes(prev => prev.filter(c => c.id !== idEliminado));
          setReturnToViewOnDeleteClose(false);
          setIsViewModalOpen(false);
        }}
      />
      <ViewInfo
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        cliente={clienteSeleccionado}
        onEdit={(cliente) => {
          setClienteSeleccionado(cliente);
          setIsModalOpen(true);
        }}
        onDelete={(cliente) => {
          setReturnToViewOnDeleteClose(true);
          setIsViewModalOpen(false);
          setIsDeleteModalOpen(true);
        }}
      />
      <FetchData
        service={clientService}
        serviceName="clientService"
        isOpen={true}
        onDataLoaded={handleClientesLoaded}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Clientes;
