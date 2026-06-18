import React, { useState, useCallback } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import useSessionCache from '../../../hooks/useSessionCache';
import FetchData from '../../../components/mixed/FetchData';
import personalService from '../../../services/personalService';
import AgregarEditarPersonal from './modals/AgregarEditarPersonal';
import EliminarPersonal from './modals/EliminarPersonal';
import ResetPasswordPersonal from './modals/ResetPasswordPersonal';
import ViewInfo from './modals/ViewInfo';
import useVirtualPagination from '../../../hooks/useVirtualPagination';

const Personal = () => {
  const { isLargeScreen } = useLayout();

  const {
    value: personal,
    setValue: setPersonal,
  } = useSessionCache({
    key: 'personalListado',
    defaultValue: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);

  const handlePersonalLoaded = useCallback((data) => {
    setPersonal(data);
    setError(null);
  }, [setPersonal]);

  const handleLoadingStart = useCallback(() => {
    if (personal.length === 0) {
      setIsLoading(true);
    }
  }, [personal.length]);

  const handleLoadingEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err) => {
    setError(err);
  }, []);

  const tableActions = [
    {
      name: 'Detalles', icon: 'show', onClick: (personal) => {
        setPersonalSeleccionado(personal);
        setIsViewModalOpen(true);
      }
    },
    {
      name: 'Editar', icon: 'edit', onClick: (personal) => {
        setPersonalSeleccionado(personal);
        setIsModalOpen(true);
      }
    },
    {
      name: 'Resetear Contraseña', icon: 'key', onClick: (personal) => {
        setPersonalSeleccionado(personal);
        setIsResetPasswordModalOpen(true);
      }
    },
    {
      name: 'Eliminar', icon: 'trash', onClick: (personal) => {
        setPersonalSeleccionado(personal);
        setIsDeleteModalOpen(true);
      }
    },
  ];

  const columns = [
    {
      header: 'Nombre',
      accessor: 'nombre_completo',
      style: { fontWeight: 600, color: '#333' },
      hasIcon: true,
      width: '25%'
    },
    {
      header: 'Cargo',
      accessor: 'cargo',
      width: '15%'
    },
    {
      header: 'Correo Electrónico',
      accessor: 'codigo',
      width: '25%'
    },
    {
      header: 'Estado',
      accessor: 'estado_texto',
      hasStatusDot: true,
      statusType: (row) => row.is_active ? 'success' : 'error',
      width: '10%'
    },
    {
      header: 'Sucursal',
      accessor: 'sucursal_nombre',
      width: '25%'
    }
  ];

  const mappedPersonal = React.useMemo(() => {
    return personal.map(p => ({
      ...p,
      nombre_completo: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      estado_texto: p.is_active ? 'Activo' : 'Inactivo',
      sucursal_nombre: p.sucursal?.name || 'Sin sucursal',
      cargo: p.cargo || '--',
      codigo: p.codigo || '--'
    }));
  }, [personal]);

  const [search, setSearch] = useState('');

  const filteredPersonal = React.useMemo(() => {
    if (!search) return mappedPersonal;
    const s = search.toLowerCase();
    return mappedPersonal.filter(p => 
      (p.nombre_completo && p.nombre_completo.toLowerCase().includes(s)) ||
      (p.codigo && p.codigo.toLowerCase().includes(s)) ||
      (p.cargo && p.cargo.toLowerCase().includes(s))
    );
  }, [mappedPersonal, search]);

  const { visibleItems, hasMore, loadMore } = useVirtualPagination(filteredPersonal, 30);

  return (
    <>
      {isLargeScreen && <NavBar />}
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Personal</h1>
          <Tabla
            data={visibleItems}
            columns={columns}
            isLoading={isLoading}
            acciones={tableActions}
            buttonLabel="Nuevo Personal"
            onButtonClick={() => {
              setPersonalSeleccionado(null);
              setIsModalOpen(true);
            }}
            searchKeys={['nombre_completo', 'codigo', 'cargo']}
            sortKey="nombre_completo"
            onRowClick={(personal) => {
              setPersonalSeleccionado(personal);
              setIsViewModalOpen(true);
            }}
            remote={true}
            searchValue={search}
            onSearchChange={setSearch}
            onLoadMore={hasMore ? loadMore : undefined}
          />
        </div>
      </div>

      <AgregarEditarPersonal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        personalSeleccionado={personalSeleccionado}
        onGuardar={(nuevoPersonal) => {
          if (personalSeleccionado) {
            setPersonal(prev => prev.map(p => p.id === personalSeleccionado.id ? { ...p, ...nuevoPersonal } : p));
          } else {
            setPersonal(prev => [{ id: nuevoPersonal?.id || Date.now(), ...nuevoPersonal }, ...prev]);
          }
          setIsModalOpen(false);
        }}
      />

      <EliminarPersonal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        personalSeleccionado={personalSeleccionado}
        onEliminar={(idEliminado) => {
          setPersonal(prev => prev.filter(p => p.id !== idEliminado));
        }}
      />

      <ResetPasswordPersonal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        personalSeleccionado={personalSeleccionado}
      />

      <ViewInfo
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        personal={personalSeleccionado}
        onEdit={(personal) => {
          setPersonalSeleccionado(personal);
          setIsModalOpen(true);
        }}
        onResetPassword={(personal) => {
          setPersonalSeleccionado(personal);
          setIsResetPasswordModalOpen(true);
        }}
      />

      <FetchData
        service={personalService}
        serviceName="personalService"
        isOpen={true}
        onDataLoaded={handlePersonalLoaded}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />
    </>
  );
};

export default Personal;

