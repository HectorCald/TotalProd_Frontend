import React, { useState, useEffect } from 'react';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import styles from '../../../styles/view.module.css';
import ItemView from '../../common/ItemView';
import VerMovimiento from '../movimientos/VerMovimiento';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';

const Destacados = ({ isOpen, setIsOpen }) => {
  const [movimientosDestacados, setMovimientosDestacados] = useState([]);
  const [isOpenVerMovimiento, setIsOpenVerMovimiento] = useState(false);
  const [infoMovimiento, setInfoMovimiento] = useState(null);
  const [, setLoading] = useState(false);
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cargar movimientos destacados desde localStorage
  const loadDestacadosFromStorage = () => {
    try {
      const destacados = JSON.parse(localStorage.getItem('MovimientosDestacados') || '[]');
      return destacados;
    } catch (error) {
      console.error('Error cargando destacados:', error);
      return [];
    }
  };

  // Función para obtener movimientos por IDs masivamente (solo para movimientos verificados)
  const fetchMovimientosByIds = async (ids, tipo) => {
    if (!ids || ids.length === 0) return [];

    try {
      const promises = ids.map(id => {
        if (tipo === 'acopio') {
          return movimientosAcopioService.getById(id);
        } else {
          return movimientosAlmacenService.getById(id);
        }
      });

      const responses = await Promise.all(promises);
      
      // Filtrar solo las respuestas exitosas y extraer los datos
      const movimientos = responses
        .filter(response => response && response.success && response.data)
        .map(response => response.data);

      return movimientos;
    } catch (error) {
      console.error(`Error obteniendo movimientos de ${tipo}:`, error);
      return [];
    }
  };

  // Función para verificar si un movimiento pertenece a la sucursal actual
  const verificarMovimientoPerteneceSucursal = async (id, tipo) => {
    try {
      if (tipo === 'acopio') {
        const response = await movimientosAcopioService.getById(id);
        return response && response.success;
      } else {
        const response = await movimientosAlmacenService.getById(id);
        return response && response.success;
      }
    } catch (error) {
      return false;
    }
  };

  // Función para cargar todos los movimientos destacados
  const loadDestacados = async () => {
    const destacados = loadDestacadosFromStorage();
    
    if (destacados.length === 0) {
      setMovimientosDestacados([]);
      return;
    }

    setLoading(true);
    setShowRefreshIndicator(true);
    setIsRefreshing(true);

    try {
      // Primero verificar qué movimientos pertenecen a la sucursal actual
      const verificaciones = await Promise.all(
        destacados.map(async (destacado) => {
          const pertenece = await verificarMovimientoPerteneceSucursal(destacado.id, destacado.tipo);
          return { ...destacado, pertenece };
        })
      );

      // Filtrar solo los que pertenecen a la sucursal actual
      const destacadosAccesibles = verificaciones.filter(d => d.pertenece);
      
      if (destacadosAccesibles.length === 0) {
        setMovimientosDestacados([]);
        return;
      }

      // Agrupar por tipo solo los accesibles
      const acopioIds = destacadosAccesibles.filter(d => d.tipo === 'acopio').map(d => d.id);
      const almacenIds = destacadosAccesibles.filter(d => d.tipo === 'almacen').map(d => d.id);

      // Hacer peticiones masivas solo para los accesibles
      const [movimientosAcopio, movimientosAlmacen] = await Promise.all([
        fetchMovimientosByIds(acopioIds, 'acopio'),
        fetchMovimientosByIds(almacenIds, 'almacen')
      ]);

      // Combinar y agregar el tipo de movimiento
      const todosLosMovimientos = [
        ...movimientosAcopio.map(m => ({ ...m, tipoMovimiento: 'acopio' })),
        ...movimientosAlmacen.map(m => ({ ...m, tipoMovimiento: 'almacen' }))
      ];

      // Ordenar por fecha (más recientes primero)
      todosLosMovimientos.sort((a, b) => {
        const fechaA = new Date(a.type === 'acopio' ? a.date : a.fecha);
        const fechaB = new Date(b.type === 'acopio' ? b.date : b.fecha);
        return fechaB - fechaA;
      });

      setMovimientosDestacados(todosLosMovimientos);
    } catch (error) {
      console.error('Error cargando movimientos destacados:', error);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setIsRefreshing(false);
        setTimeout(() => {
          setShowRefreshIndicator(false);
        }, 1000);
      }, 500);
    }
  };

  // Función para manejar el click en un movimiento
  const handleRegistro = (movimiento) => {
    setInfoMovimiento(movimiento);
    setIsOpenVerMovimiento(true);
  };

  // Cargar destacados al montar el componente
  useEffect(() => {
    if (isOpen) {
      loadDestacados();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escuchar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      loadDestacados();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar cambios en la misma ventana (cuando se agregan/quitan destacados)
    const interval = setInterval(() => {
      const currentDestacados = loadDestacadosFromStorage();
      const currentIds = currentDestacados.map(d => d.id);
      const displayedIds = movimientosDestacados.map(m => m.id);
      
      // Si hay diferencias, recargar
      if (currentIds.length !== displayedIds.length || 
          !currentIds.every(id => displayedIds.includes(id))) {
        loadDestacados();
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [movimientosDestacados]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
      <HeaderView onBack={() => setIsOpen(false)} title='Destacados' />
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <RefreshIndicator
            isVisible={showRefreshIndicator}
            isLoading={isRefreshing}
          />
        </div>
        <div className={styles.headerContainer}>
          <p className={styles.subTitle}>
            {movimientosDestacados.length > 0 
              ? `${movimientosDestacados.length} movimiento${movimientosDestacados.length !== 1 ? 's' : ''} destacado${movimientosDestacados.length !== 1 ? 's' : ''}`
              : 'SIN MOVIMIENTOS DESTACADOS'
            }
          </p>
        </div>


          {movimientosDestacados.length > 0 ? (
            movimientosDestacados.map((movimiento, index) => (
              <ItemView
                key={`${movimiento.tipoMovimiento}-${movimiento.id}-${index}`}
                title={
                  movimiento.tipoMovimiento === 'acopio' 
                    ? `${movimiento.product?.name || 'Sin producto'} - ${movimiento.quantity || '0'} ${movimiento.product?.type_measure?.code || ''}`
                    : movimiento.productos && movimiento.productos.length > 0
                        ? movimiento.productos.length === 1
                            ? `${movimiento.productos[0]?.producto?.name || 'Sin producto'} - ${movimiento.productos[0]?.cantidad || '0'} ud`
                            : `${movimiento.productos.length} productos`
                        : 'Sin productos'
                }
                description={`${movimiento.observations || 'Sin observaciones'} • ${new Date(movimiento.tipoMovimiento === 'acopio' ? movimiento.date : movimiento.fecha).toLocaleDateString()}${movimiento.type === 'entrada' && movimiento.proveedor?.name ? ` • ${movimiento.proveedor.name}` : ''}${movimiento.type === 'salida' && movimiento.cliente?.name ? ` • ${movimiento.cliente.name}` : ''}`}
                icon={movimiento.type === 'entrada' ? 'plus-circle' : 'minus-circle'}
                onClick={() => handleRegistro(movimiento)}
                arrow={false}
                flot2={movimiento?.estado === 'anulado' ? 'Anulado' : ''}
                flot1={movimiento?.estado === 'anulado' ? '' : 'Finalizado'}
                flot3={movimiento.tipoMovimiento === 'acopio' ? 'Prima' : 'Almacén'}
              />
            ))
          ) : (
            <div className={styles.noData} style={{ background: 'none' }}>
              <BoxIcon name='star' className={styles.noDataIcon} />
              <p className={styles.noDataTitle}>No tienes  destacados</p>
              <p className={styles.noDataDescription}>
                Destaca movimientos desde la vista de detalles de un movimiento para que aparezcan aquí
              </p>
            </div>
          )}
      </div>

      {/* Modal de ver movimiento */}
      <VerMovimiento
        isOpen={isOpenVerMovimiento}
        setIsOpen={setIsOpenVerMovimiento}
        movimiento={infoMovimiento}
        tipoMovimiento={infoMovimiento?.tipoMovimiento || ''}
        onMovimientoAnulado={(id) => {
          // Recargar después de anular
          loadDestacados();
        }}
        onMovimientoEliminado={(id) => {
          // Recargar después de eliminar
          loadDestacados();
        }}
      />
    </View>
  );
};

export default Destacados;
