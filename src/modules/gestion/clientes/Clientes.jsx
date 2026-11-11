import React, { useState, useCallback, useMemo } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { useEmployee } from '../../../context/EmployeeContext';
import { SideConfigOptions } from '../../../constants/SideBarOptions';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../modules/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import useSessionCache from '../../../hooks/useSessionCache';
import FetchData from '../../../components/mixed/FetchData';
import clientService from '../../../services/clientService';
import AgregarEditarCliente from './modals/AgregarEditarCliente';
import EliminarCliente from './modals/EliminarCliente';
import ViewInfo from './modals/ViewInfo';
import ModalOpcionesClientes from './modals/ModalOpcionesClientes';
import useVirtualPagination from '../../../hooks/useVirtualPagination';

const Clientes = () => {
  const { isLargeScreen } = useLayout();
  const { employee: employeeInfo } = useEmployee();

  const canExport = useMemo(() => {
    const token = localStorage.getItem('token');
    let isEmployeeSession = false;
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        isEmployeeSession = JSON.parse(jsonPayload).type === 'employee';
      } catch (e) {
        isEmployeeSession = false;
      }
    }
    const isEmployee = isEmployeeSession || !!employeeInfo;
    if (!isEmployee) return true;
    if (!employeeInfo?.modules) return false;
    const exportOption = SideConfigOptions.find(opt => opt.id === 'exportar');
    if (!exportOption) return false;
    return employeeInfo.modules.some(m => {
      if (exportOption.key_submenu) {
        return m.modulos?.clave === exportOption.key && m.name === exportOption.key_submenu;
      }
      return m.modulos?.clave === exportOption.key;
    });
  }, [employeeInfo]);

  const {
    value: clientesActivosCache,
    setValue: setClientesActivosCache,
  } = useSessionCache({
    key: 'clientesActivosListado',
    defaultValue: [],
  });
  const [clientes, setClientes] = useState(() => clientesActivosCache || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isOpcionesModalOpen, setIsOpcionesModalOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [returnToViewOnDeleteClose, setReturnToViewOnDeleteClose] = useState(false);
  
  const [search, setSearch] = useState('');
  const [tableFilters, setTableFilters] = useState({ is_active: ['true'] });

  const filtroIsActive = useMemo(() => {
    const activeArr = tableFilters?.is_active;
    if (!activeArr || activeArr.length !== 1) return null;
    return activeArr[0];
  }, [tableFilters]);

  const fetchMethodParams = useMemo(() => [filtroIsActive], [filtroIsActive]);

  const dynamicFilters = useMemo(() => [
    {
      id: 'sort_order',
      title: 'Ordenamiento',
      singleSelect: true,
      options: [
        { label: 'A - Z', value: 'asc' },
        { label: 'Z - A', value: 'desc' }
      ]
    },
    {
      id: 'is_active',
      title: 'Estado',
      singleSelect: true,
      options: [
        { label: 'Activo', value: 'true' },
        { label: 'Inactivo', value: 'false' }
      ]
    }
  ], []);

  const handleFiltersChange = useCallback((newFilters) => {
    const nextActiveArr = newFilters?.is_active;
    const nextActive = (!nextActiveArr || nextActiveArr.length !== 1) ? null : nextActiveArr[0];

    if (nextActive !== filtroIsActive) {
      if (nextActive === 'true' && (clientesActivosCache || []).length > 0) {
        setClientes(clientesActivosCache);
      } else {
        setClientes([]);
        setIsLoading(true);
      }
    }

    setTableFilters(newFilters);
  }, [filtroIsActive, clientesActivosCache]);

  const mappedClientes = useMemo(() => {
    return (clientes || []).map(c => ({
      ...c,
      estado_texto: c.is_active !== false ? 'Activo' : 'Inactivo'
    }));
  }, [clientes]);

  const filteredClientes = React.useMemo(() => {
    let result = mappedClientes;
    if (filtroIsActive === 'true') {
      result = result.filter(c => c.is_active !== false);
    } else if (filtroIsActive === 'false') {
      result = result.filter(c => c.is_active === false);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c => 
        (c.name && c.name.toLowerCase().includes(s)) ||
        (c.phone && c.phone.toLowerCase().includes(s))
      );
    }
    const isDesc = tableFilters?.sort_order && tableFilters.sort_order[0] === 'desc';
    if (tableFilters?.sort_order && tableFilters.sort_order.length > 0) {
      return [...result].sort((a, b) => {
        const nameA = String(a.name || '');
        const nameB = String(b.name || '');
        const cmp = nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        return isDesc ? -cmp : cmp;
      });
    }
    return result;
  }, [mappedClientes, filtroIsActive, search, tableFilters]);

  const { visibleItems, hasMore, loadMore } = useVirtualPagination(filteredClientes, 30);

  const handleClientesLoaded = useCallback((data) => {
    const list = data || [];
    setClientes(list);
    if (filtroIsActive === 'true') {
      setClientesActivosCache(list);
    } else if (filtroIsActive === null) {
      setClientesActivosCache(list.filter(c => c.is_active !== false));
    }
    setError(null);
  }, [filtroIsActive, setClientesActivosCache]);

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
      width: '20%',
      isMobileMain: true
    },
    {
      header: 'Descripción',
      accessor: 'description',
      truncate: true,
      width: '25%'
    },
    {
      header: 'Teléfono',
      accessor: 'phone',
      width: '20%'
    },
    {
      header: 'Total Pedidos',
      accessor: 'total_orders',
      width: '20%'
    },
    {
      header: 'Estado',
      accessor: 'estado_texto',
      hasStatusDot: true,
      statusType: (row) => row.is_active !== false ? 'success' : 'error',
      width: '15%',
      isMobileStatus: true
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
            buttonAlternativeIcon={canExport ? "export" : undefined}
            onButtonAlternativeClick={canExport ? () => setIsOpcionesModalOpen(true) : undefined}
            searchKeys={['name', 'phone']}
            sortKey="name"
            onRowClick={(cliente) => {
              setClienteSeleccionado(cliente);
              setIsViewModalOpen(true);
            }}
            remote={true}
            searchValue={search}
            onSearchChange={setSearch}
            externalFilters={tableFilters}
            onFiltersChange={handleFiltersChange}
            filters={dynamicFilters}
            onLoadMore={hasMore ? loadMore : undefined}
          />
        </div>
      </div>
      <ModalOpcionesClientes
        isOpen={isOpcionesModalOpen}
        onClose={() => setIsOpcionesModalOpen(false)}
        clientes={filteredClientes}
        onClientesActualizados={(actualizados) => {
          const mapActualizados = new Map(actualizados.map(c => [String(c.id), c]));
          setClientes(prev => prev.map(c => mapActualizados.has(String(c.id)) ? { ...c, ...mapActualizados.get(String(c.id)) } : c));
          setClientesActivosCache(prev => (prev || []).map(c => mapActualizados.has(String(c.id)) ? { ...c, ...mapActualizados.get(String(c.id)) } : c));
        }}
      />
      <AgregarEditarCliente
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clienteSeleccionado={clienteSeleccionado}
        onGuardar={(nuevoCliente) => {
          if (clienteSeleccionado) {
            const updated = { ...clienteSeleccionado, ...nuevoCliente };
            setClientes(prev => prev.map(c => c.id === clienteSeleccionado.id ? updated : c));
            setClienteSeleccionado(updated);
            setClientesActivosCache(prev => {
              const list = prev || [];
              if (updated.is_active === false) {
                return list.filter(c => c.id !== updated.id);
              }
              const exists = list.some(c => c.id === updated.id);
              return exists
                ? list.map(c => c.id === updated.id ? updated : c)
                : [...list, updated];
            });
          } else {
            const created = { id: nuevoCliente?.id || Date.now(), is_active: true, ...nuevoCliente };
            setClientes(prev => [...prev, created]);
            if (created.is_active !== false) {
              setClientesActivosCache(prev => [...(prev || []), created]);
            }
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
          setClientesActivosCache(prev => (prev || []).filter(c => c.id !== idEliminado));
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
        methodParams={fetchMethodParams}
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
