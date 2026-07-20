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
import pagosDamabravaService from '../../../services/pagosDamabravaService';
import reglasProduccionDamabravaService from '../../../services/reglasProduccionDamabravaService';
import personalService from '../../../services/personalService';
import { parseDateWithoutOffset } from '../../../utils/dateUtils';
import ViewInfoPago from './modals/ViewInfoPago';
import RegistrarPago from './modals/RegistrarPago';
import Boton from '../../../components/common/botones/Boton';
import { useToast } from '../../../context/ToastContext';

const formatFechaCorta = (value) => {
    const date = parseDateWithoutOffset(value);
    return date ? date.toLocaleDateString('es-BO') : '--';
};

const Pagos = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  const [pagos, setPagos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroResponsableId, setFiltroResponsableId] = useState(null);

  // Modals state
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [modalRegistrarOpen, setModalRegistrarOpen] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

  // Reglas
  const [reglasProduccion, setReglasProduccion] = useState([]);
  const [reglasLoaded, setReglasLoaded] = useState(false);

  const [debouncedSearch] = useDebounce(search, 500);
  const [tablaFilters, setTablaFilters] = useState({});

  const fetchReglas = useCallback(async () => {
    if (reglasLoaded) return;
    try {
        const response = await reglasProduccionDamabravaService.getAll();
        if (response.success) {
            setReglasProduccion(response.data || []);
            setReglasLoaded(true);
        }
    } catch (err) {
        console.error('Error cargando reglas de producción:', err);
    }
  }, [reglasLoaded]);

  useEffect(() => {
    fetchReglas();
  }, [fetchReglas]);

  const handleFiltersChange = (filters) => {
    setTablaFilters(filters);
    const estado = filters.estado && filters.estado.length > 0 ? filters.estado[0] : null;
    setFiltroEstado(estado);

    const responsable_id = filters.beneficiario_id && filters.beneficiario_id.length > 0 ? filters.beneficiario_id[0] : null;
    setFiltroResponsableId(responsable_id);
  };

  const dynamicFilters = useMemo(() => {
    return [
      {
        id: 'estado',
        title: 'Estado',
        singleSelect: true,
        options: [
          { label: 'Todos', value: 'todos' },
          { label: 'Pendientes', value: 'pendiente' },
          { label: 'Pagados', value: 'pagado' }
        ]
      },
      {
        id: 'beneficiario_id',
        title: 'Beneficiario',
        singleSelect: true,
        fetchOptions: async () => {
          const res = await personalService.getAll();
          if (res && res.success && res.data) {
            return res.data.map(p => ({ 
              label: `${p.first_name || ''} ${p.last_name || ''}`.trim(), 
              value: String(p.id) 
            }));
          }
          return [];
        }
      }
    ];
  }, []);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setTablaFilters({});
    setFiltroEstado(null);
  }, [location.pathname]);

  useEffect(() => {
    setPagos([]);
    setIsLoading(true);
    setPage(1);
  }, [debouncedSearch, filtroEstado, filtroResponsableId]);

  const sortPagos = useCallback((lista = []) => {
      return [...lista].sort((a, b) => {
          const fechaA = new Date(a?.fecha || a?.fecha_fin || a?.fecha_inicio || 0).getTime();
          const fechaB = new Date(b?.fecha || b?.fecha_fin || b?.fecha_inicio || 0).getTime();
          return fechaB - fechaA;
      });
  }, []);

  const handleDataLoaded = useCallback((data) => {
    setPagos(sortPagos(data));
    setError(null);
  }, [sortPagos]);

  const handleDataAccumulated = useCallback((newData) => {
    setPagos(prev => {
      const existingIds = new Set(prev.map(d => d.id));
      const uniqueNewData = newData.filter(d => !existingIds.has(d.id));
      return sortPagos([...prev, ...uniqueNewData]);
    });
  }, [sortPagos]);

  const handleLoadingStart = useCallback(() => {
    if (page === 1) {
      if (pagos.length === 0) {
        setIsLoading(true);
      }
    } else {
      setIsLoadingMore(true);
    }
  }, [page, pagos.length]);

  const handleLoadingEnd = useCallback(() => {
    setIsLoading(false);
    setIsLoadingMore(false);
  }, []);

  const handleError = useCallback((err) => {
    setError(err);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMorePages && !isLoading && !isLoadingMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMorePages, isLoading, isLoadingMore]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      handleLoadMore();
    }
  };

  const tableActions = [];

  const columns = [
    {
      header: 'Beneficiario',
      accessor: 'responsable_nombre',
      style: { fontWeight: 600, color: '#333' },
      width: '25%',
      render: (row) => row.responsable?.name || 'Sin responsable'
    },
    {
      header: 'Registrado por',
      accessor: 'registrado_por_nombre',
      width: '20%',
      render: (row) => row.registrado_por?.name || row.personal?.name || row.user?.name || 'Sin registrar'
    },
    {
      header: 'Periodo',
      accessor: 'periodo',
      width: '25%',
      render: (row) => `${formatFechaCorta(row.fecha_inicio)} - ${formatFechaCorta(row.fecha_fin)}`
    },
    {
      header: 'Total',
      accessor: 'total_calculado',
      width: '15%',
      render: (row) => `Bs. ${row.total_calculado}`
    },
    {
      header: 'Estado',
      accessor: 'estado_texto',
      hasStatusDot: true,
      statusType: (row) => row.estado === 'pendiente' ? 'error' : row.estado === 'pagado' ? 'success' : 'info',
      width: '15%'
    }
  ];

  const mappedPagos = useMemo(() => {
    return pagos.map(p => {
        const extras = Number(p?.extras) || 0;
        const descuento = Number(p?.descuento) || 0;
        const aumento = Number(p?.aumento) || 0;
        const totalProduccion = Number(p?.total) || 0;
        const totalConAjustes = totalProduccion + extras + aumento - descuento;
        const total = totalConAjustes.toLocaleString('es-BO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return {
            ...p,
            total_calculado: total,
            estado_texto: p.estado === 'pagado' ? 'Pagado' : 'Pendiente'
        };
    });
  }, [pagos]);

  const handlePagoActualizado = useCallback((pagoActualizado) => {
    if (!pagoActualizado || !pagoActualizado.id) return;
    setPagos(prev => {
        const actualizados = prev.map(pago => pago.id === pagoActualizado.id ? { ...pago, ...pagoActualizado } : pago);
        return sortPagos(actualizados);
    });
    setPagoSeleccionado(prev => (prev && prev.id === pagoActualizado.id ? { ...prev, ...pagoActualizado } : prev));
  }, [sortPagos]);

  const handlePagoEliminado = useCallback((pagoId, mensaje) => {
    setModalInfoOpen(false);
    setPagoSeleccionado(null);
    showSuccess(null, mensaje || 'Pago eliminado correctamente.');
    if (!pagoId) return;
    setPagos(prev => prev.filter(pago => pago.id !== pagoId));
  }, [showSuccess]);

  const handlePagoRegistrado = useCallback((nuevoPago) => {
    if (!nuevoPago) return;
    let pagoDetallado = { ...nuevoPago };
    if (!pagoDetallado?.responsable && nuevoPago?.responsable_id) {
        pagoDetallado = {
            ...pagoDetallado,
            responsable: nuevoPago.responsable || { id: nuevoPago.responsable_id, name: nuevoPago.responsable_nombre || 'Responsable desconocido' }
        };
    }
    const candidatoRegistrador = pagoDetallado?.registrado_por || pagoDetallado?.personal || pagoDetallado?.user || nuevoPago?.personal || nuevoPago?.user || null;
    if (candidatoRegistrador) {
        const tipoRegistrador = candidatoRegistrador === (pagoDetallado?.personal || nuevoPago?.personal) ? 'personal' : 'user';
        const nombreRegistrador = candidatoRegistrador.name || `${candidatoRegistrador.first_name || ''} ${candidatoRegistrador.last_name || ''}`.trim();
        pagoDetallado = {
            ...pagoDetallado,
            registrado_por: { ...candidatoRegistrador, tipo: tipoRegistrador, name: nombreRegistrador && nombreRegistrador.length > 0 ? nombreRegistrador : 'Sin nombre' }
        };
    }

    setPagos(prev => {
        const sinDuplicados = prev.filter(pagoExistente => pagoExistente.id !== pagoDetallado.id);
        return sortPagos([pagoDetallado, ...sinDuplicados]);
    });
    showSuccess(null, 'Pago registrado correctamente.');
  }, [sortPagos, showSuccess]);

  const pagosServiceWrapper = useMemo(() => ({
    getAll: async (page, limit, estado, responsableId, search) => {
        const searchParam = search ? search.split('|')[0] : '';
        return await pagosDamabravaService.getAll({
            page,
            limit,
            estado: estado || 'todos',
            responsableId: responsableId || null,
            search: searchParam || ''
        });
    }
  }), []);

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea} onScroll={handleScroll}>
          <h1 className={styles.title}>Pagos Producción</h1>
          <Tabla
            data={mappedPagos}
            columns={columns}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            acciones={tableActions}
            buttonLabel="Registrar pago"
            onButtonClick={() => setModalRegistrarOpen(true)}
            searchKeys={['responsable.name']}
            sortKey={'responsable.name'}
            onLoadMore={handleLoadMore}
            onRowClick={(pago) => {
              setPagoSeleccionado(pago);
              setModalInfoOpen(true);
            }}
            remote={true}
            searchValue={search}
            onSearchChange={setSearch}
            externalFilters={tablaFilters}
            onFiltersChange={handleFiltersChange}
            filters={dynamicFilters}
          />
        </div>
      </div>
      
      <FetchDataProgressive
        service={pagosServiceWrapper}
        serviceName="pagosDamabravaService"
        method="getAll"
        methodParams={[filtroEstado, filtroResponsableId, debouncedSearch]}
        isOpen={true}
        page={page}
        limit={30}
        onDataLoaded={handleDataLoaded}
        onDataAccumulated={handleDataAccumulated}
        onHasMorePagesChange={setHasMorePages}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />

      <ViewInfoPago
        isOpen={modalInfoOpen}
        onClose={() => setModalInfoOpen(false)}
        pago={pagoSeleccionado}
        onPagoActualizado={handlePagoActualizado}
        onPagoEliminado={handlePagoEliminado}
        reglas={reglasProduccion}
      />

      <RegistrarPago
        isOpen={modalRegistrarOpen}
        onClose={() => setModalRegistrarOpen(false)}
        reglas={reglasProduccion}
        onPagoRegistrado={handlePagoRegistrado}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Pagos;
