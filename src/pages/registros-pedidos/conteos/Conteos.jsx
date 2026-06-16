import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import FetchDataProgressive from '../../../components/mixed/FetchDataProgressive';
import conteosService from '../../../services/conteosService';
import EliminarConteo from './modals/EliminarConteo';
import ReemplazarConteo from './modals/ReemplazarConteo';
import ProductosConteo from './modals/ProductosConteo';

const LiteralDateCell = ({ dateStr }) => {
  return <span>{dateStr ? new Date(dateStr).toLocaleString() : ''}</span>;
};

const Conteos = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();

  const isAcopio = location.pathname.includes('/conteos/acopio');
  const getTitulo = () => {
    return isAcopio ? 'Conteos Materia Prima' : 'Conteos Almacén';
  };

  const tipoConteo = isAcopio ? 'acopio' : 'almacen';

  const conteosServiceWrapper = useMemo(() => ({
    getAll: async (page, limit) => {
        return await conteosService.getAll({ tipo: tipoConteo });
    }
  }), [tipoConteo]);

  const [conteos, setConteos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);

  // Modals state
  const [modalProductosOpen, setModalProductosOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [modalReemplazarOpen, setModalReemplazarOpen] = useState(false);
  const [conteoSeleccionado, setConteoSeleccionado] = useState(null);

  useEffect(() => {
    setSearch('');
    setConteos([]);
    setIsLoading(true);
  }, [location.pathname]);

  const handleDataLoaded = useCallback((data) => {
    setConteos(data);
    setError(null);
  }, []);

  const handleLoadingStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleLoadingEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err) => {
    setError(err);
  }, []);

  const handleConteoEliminado = (id) => {
    setConteos(prev => prev.filter(c => c.id !== id));
  };

  const handleConteoReemplazado = (id) => {
    // Si necesitas actualizar el estado visualmente, se puede hacer aquí
  };

  const tableActions = [
    {
      name: 'Ver Productos', 
      icon: 'show', 
      onClick: (conteo) => {
        setConteoSeleccionado(conteo);
        setModalProductosOpen(true);
      }
    },
    {
      name: 'Reemplazar Stock', 
      icon: 'box', 
      onClick: (conteo) => {
        setConteoSeleccionado(conteo);
        setModalReemplazarOpen(true);
      }
    },
    {
      name: 'Eliminar', 
      icon: 'trash', 
      onClick: (conteo) => {
        setConteoSeleccionado(conteo);
        setModalEliminarOpen(true);
      }
    }
  ];

  const columns = [
    {
      header: 'Código',
      accessor: 'codigo',
      style: { fontWeight: 600, color: '#333' },
      width: '15%',
      render: (row) => row.codigo || '--'
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      hasStatus: true,
      statusType: (row) => row.tipo === 'almacen' ? 'info' : 'success',
      width: '15%',
      render: (row) => row.tipo === 'almacen' ? 'Almacén' : 'Materia Prima'
    },
    {
      header: 'Fecha',
      accessor: 'fecha',
      width: '20%',
      render: (row) => <LiteralDateCell dateStr={row.fecha} />
    },
    {
      header: 'Ítems Contados',
      accessor: 'detalles_count',
      width: '15%',
      render: (row) => `${row.detalles_count || 0} ítems`
    },
    {
      header: 'Observaciones',
      accessor: 'observaciones',
      width: '35%',
      render: (row) => row.observaciones || '--'
    }
  ];

  const filteredConteos = useMemo(() => {
    return conteos.filter(c => {
        if (!debouncedSearch) return true;
        const text = `${c.codigo || ''} ${c.observaciones || ''}`.toLowerCase();
        return text.includes(debouncedSearch.toLowerCase());
    });
  }, [conteos, debouncedSearch]);

  return (
    <>
      {isLargeScreen && <NavBar />}
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>{getTitulo()}</h1>
          <Tabla
            data={filteredConteos}
            columns={columns}
            isLoading={isLoading}
            acciones={tableActions}
            buttonLabel="Nuevo Conteo"
            onButtonClick={() => {
              if (isAcopio) {
                navigate('/materia-prima/pesaje');
              } else {
                navigate('/almacen/conteo');
              }
            }}
            searchKeys={['codigo', 'observaciones']}
            sortKey={'fecha'}
            onRowClick={(conteo) => {
              setConteoSeleccionado(conteo);
              setModalProductosOpen(true);
            }}
            searchValue={search}
            onSearchChange={setSearch}
            remote={false}
          />
        </div>
      </div>
      
      <FetchDataProgressive
        service={conteosServiceWrapper}
        serviceName="conteosService"
        method="getAll"
        methodParams={[]}
        isOpen={true}
        page={1}
        limit={100}
        onDataLoaded={handleDataLoaded}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />

      <ProductosConteo
        isOpen={modalProductosOpen}
        onClose={() => setModalProductosOpen(false)}
        conteoSeleccionado={conteoSeleccionado}
      />

      <EliminarConteo
        isOpen={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        conteoSeleccionado={conteoSeleccionado}
        onEliminar={handleConteoEliminado}
      />

      <ReemplazarConteo
        isOpen={modalReemplazarOpen}
        onClose={() => setModalReemplazarOpen(false)}
        conteoSeleccionado={conteoSeleccionado}
        onReemplazar={handleConteoReemplazado}
      />
    </>
  );
};

export default Conteos;
