import React, { useState, useCallback, useMemo } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';

import reglasProduccionDamabravaService from '../../../services/reglasProduccionDamabravaService';
import ViewInfoReglas from './modals/ViewInfoReglas';
import SelectTipoRegla from './modals/SelectTipoRegla';
import { useToast } from '../../../context/ToastContext';

const formatNumber = (value) => {
    if (value === undefined || value === null || value === '') return '--';
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) return String(value);
    return parsed.toFixed(3).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
};

const Reglas = () => {
  const { isLargeScreen } = useLayout();
  const { showSuccess } = useToast();

  const [reglas, setReglas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [reloadToken, setReloadToken] = useState(0);
  const [search, setSearch] = useState('');

  // Modals state
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [reglaSeleccionada, setReglaSeleccionada] = useState(null);
  const [isOpenSelectTipo, setIsOpenSelectTipo] = useState(false);

  const fetchReglas = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await reglasProduccionDamabravaService.getAll();
      if (response.success) {
        setReglas(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error('Error in response:', response);
        setError(response.message || 'Error al obtener reglas');
      }
    } catch (err) {
      console.error('Exception fetching reglas:', err);
      setError(err.message || 'Excepcion al obtener reglas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchReglas();
  }, [fetchReglas, reloadToken]);

  const handleReglaRegistrada = (nuevaRegla) => {
    if (nuevaRegla) {
        setReglas((prev) => [nuevaRegla, ...prev]);
    }
    setReloadToken((prev) => prev + 1);
    showSuccess(null, 'Regla registrada correctamente.');
  };

  const handleReglaEliminada = (reglaId) => {
    if (!reglaId) return;
    setReglas((prev) => prev.filter((regla) => regla.id !== reglaId));
    setModalInfoOpen(false);
    setReglaSeleccionada(null);
  };

  const obtenerTipoRegla = (regla) => {
    if (regla.general === true) return 'General';
    if (regla.general === false) return 'Especial';
    return 'Por gramaje';
  };

  const obtenerNombreRegla = (regla) => {
    if (regla.general === true) return 'Regla general';
    if (regla.general === false) {
        return regla.producto_almacen?.name || 'Regla especial';
    }
    return 'Regla por gramaje';
  };

  const obtenerDetalleRegla = (regla) => {
    if (regla.general === true) {
        return 'Aplica a todos los productos';
    }
    if (regla.general === false) {
        return regla.contiene || 'Aplicación específica';
    }
    return `Gramaje: ${formatNumber(regla.desde_gramaje)} - ${formatNumber(regla.hasta_gramaje)}`;
  };

  const tableActions = [];

  const columns = [
    {
      header: 'Nombre',
      accessor: 'nombre',
      style: { fontWeight: 600, color: '#333' },
      width: '35%',
      render: (row) => obtenerNombreRegla(row)
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      width: '20%',
      render: (row) => obtenerTipoRegla(row)
    },
    {
      header: 'Detalle',
      accessor: 'detalle',
      width: '45%',
      render: (row) => obtenerDetalleRegla(row)
    }
  ];

  const mappedReglas = useMemo(() => {
    return reglas.map(r => ({
      ...r,
      nombre: obtenerNombreRegla(r),
      tipo: obtenerTipoRegla(r),
      detalle: obtenerDetalleRegla(r)
    }));
  }, [reglas]);

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Reglas de Producción</h1>
          <Tabla
            data={mappedReglas}
            columns={columns}
            isLoading={isLoading}
            acciones={tableActions}
            buttonLabel="Nueva Regla"
            onButtonClick={() => setIsOpenSelectTipo(true)}
            searchKeys={['nombre', 'detalle']}
            sortKey={'nombre'}
            onRowClick={(regla) => {
              setReglaSeleccionada(regla);
              setModalInfoOpen(true);
            }}
            remote={false}
            searchValue={search}
            onSearchChange={setSearch}
            showPagination={true}
            rowsPerPage={30}
          />
        </div>
      </div>
      
      <ViewInfoReglas
        isOpen={modalInfoOpen}
        onClose={() => setModalInfoOpen(false)}
        regla={reglaSeleccionada}
        onReglaEliminada={handleReglaEliminada}
      />

      <SelectTipoRegla
        isOpen={isOpenSelectTipo}
        onClose={() => setIsOpenSelectTipo(false)}
        onReglaRegistrada={handleReglaRegistrada}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Reglas;
