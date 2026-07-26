import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import FetchDataProgressive from '../../../components/mixed/FetchDataProgressive';
import conteosService from '../../../services/conteosService';
import EliminarConteo from './modals/EliminarConteo';
import ReemplazarConteo from './modals/ReemplazarConteo';
import ProductosConteo from './modals/ProductosConteo';
import SelectTipoNuevo from './modals/SelectTipoNuevo';
import useFechaLiteral from '../../../hooks/useFechaLiteral';

const LiteralDateCell = ({ dateStr }) => {
  const literal = useFechaLiteral(dateStr, false, true);
  return <span>{literal || (dateStr ? new Date(dateStr).toLocaleDateString() : '')}</span>;
};

const Conteos = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();

  const getTitulo = () => 'Conteos';

  const conteosServiceWrapper = useMemo(() => ({
    getAll: async (page, limit) => {
        return await conteosService.getAll({ tipo: null });
    }
  }), []);

  const [conteos, setConteos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [tableFilters, setTableFilters] = useState({});

  // Modals state
  const [modalProductosOpen, setModalProductosOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [modalReemplazarOpen, setModalReemplazarOpen] = useState(false);
  const [modalAgregarEditarOpen, setModalAgregarEditarOpen] = useState(false);
  const [conteoSeleccionado, setConteoSeleccionado] = useState(null);

  useEffect(() => {
    setSearch('');
    setConteos([]);
    setIsLoading(true);
  }, [location.pathname]);

  const handleDataLoaded = useCallback((data) => {
    const sorted = [...data].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    setConteos(sorted);
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
      header: 'Responsable',
      accessor: 'responsable',
      width: '35%',
      render: (row) => row.user?.name || row.personal?.name || '--'
    }
  ];

  const tableFiltersConfig = [
    {
      id: 'tipo',
      title: 'Tipo',
      singleSelect: true,
      options: [
        { label: 'Almacén', value: 'almacen' },
        { label: 'Materia Prima', value: 'acopio' }
      ]
    }
  ];

  const filteredConteos = useMemo(() => {
    return conteos.filter(c => {
        if (debouncedSearch) {
            const text = `${c.codigo || ''} ${c.observaciones || ''}`.toLowerCase();
            if (!text.includes(debouncedSearch.toLowerCase())) return false;
        }

        if (tableFilters.tipo && tableFilters.tipo.length > 0) {
            if (!tableFilters.tipo.includes(c.tipo)) return false;
        }

        return true;
    });
  }, [conteos, debouncedSearch, tableFilters]);

  return (
    <>
      <NavBar />
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
              setModalAgregarEditarOpen(true);
            }}
            searchKeys={['observaciones']}
            filters={tableFiltersConfig}
            onRowClick={(conteo) => {
              setConteoSeleccionado(conteo);
              setModalProductosOpen(true);
            }}
            searchValue={search}
            onSearchChange={setSearch}
            externalFilters={tableFilters}
            onFiltersChange={setTableFilters}
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

      <SelectTipoNuevo
        isOpen={modalAgregarEditarOpen}
        onClose={(nuevoConteo) => {
            setModalAgregarEditarOpen(false);
            if (nuevoConteo && typeof nuevoConteo === 'object') {
                setConteos(prev => [nuevoConteo, ...prev].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
            }
        }}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Conteos;
