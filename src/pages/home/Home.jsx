import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../context/LayoutContext';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import { useModalStack } from '../../context/ModalStackContext';
import { useToast } from '../../context/ToastContext';
import { SideBarOptions } from '../../constants/SideBarOptions';
import SideBar from '../../components/essentials/SideBar';
import NavBar from '../../components/essentials/NavBar';
import MenuSide from '../../components/essentials/MenuSide';
import styles from './View.module.css';

import Boton from '../../components/common/botones/Boton';
import Carousel from '../../components/common/widgets/Carousel/Carousel';
import BotonCuadrante from '../../components/common/botones/BotonCuadrante';
import ModalOpcionesAlmacen from '../inventario/almacen/modals/ModalOpcionesAlmacen';
import ModalOpcionesMateriaPrima from '../inventario/materia-prima/modals/ModalOpcionesMateriaPrima';
import ModalOpcionesMovimientos from '../registros-pedidos/movimientos/modals/ModalOpcionesMovimientos';
import ModalOpcionesPedidos from '../registros-pedidos/pedidos/modals/ModalOpcionesPedidos';
import TarjetaGrafico from '../../components/grafics/TarjetaGrafico';
import GraficoVentas from '../../components/grafics/GraficoVentas';
import GraficoCategorias from '../../components/grafics/GraficoCategorias';
import gridStyles from '../../components/layout/LayoutGrid.module.css';

const Home = () => {
  const { isLargeScreen } = useLayout();
  const navigate = useNavigate();
  const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
  const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
  const { clearStack } = useModalStack();
  const { showWarning } = useToast();

  useEffect(() => {
    clearStack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usuario = userInfo || employeeInfo;
  const sucursalSeleccionada = userSucursal || employeeSucursal;
  const isEmployee = !!employeeInfo;

  const tieneGraficosInicio = useMemo(() => {
    if (!isEmployee) return false;
    return usuario?.modules?.some(m => m.modulos?.clave === 'balance' && m.name === 'graficos_inicio');
  }, [isEmployee, usuario]);

  const tipoEmpresa = sucursalSeleccionada?.empresas?.tipo || userInfo?.empresa?.tipo || employeeInfo?.sucursal?.empresas?.tipo || 'ventas_produccion';
  const isSoloVentas = tipoEmpresa === 'ventas';

  const getCarouselItems = () => {
    const codigoEmpresaRaw = sucursalSeleccionada?.empresas?.codigo || userInfo?.empresa?.codigo || employeeInfo?.sucursal?.empresas?.codigo || '';
    const codigoEmpresa = codigoEmpresaRaw.toLowerCase();

    const filteredSections = SideBarOptions.filter(section => {
      // Para empleados, omitir filtro por empresa — los módulos asignados lo controlan.
      // Solo ocultar para usuarios (owner) cuya empresa no coincida.
      if (section.empresaCodigo && !isEmployee) {
        if (section.empresaCodigo.toLowerCase() !== codigoEmpresa) return false;
      }
      return true;
    });

    const itemsWithoutSubmenu = [];
    const itemsWithSubmenu = [];

    filteredSections.forEach(section => {
      section.items.forEach(item => {
        if (item.id === 'home') return;
        if (isSoloVentas && item.id === 'materia-prima') return;

        let newItem = { ...item };

        if (isEmployee && usuario?.modules) {
          if (newItem.submenu) {
            const filteredSubmenu = newItem.submenu.filter(sub => {
              if (sub.key && sub.key_submenu) {
                return usuario.modules.some(m =>
                  m.modulos?.clave === sub.key && m.name === sub.key_submenu
                );
              }
              if (!sub.key) return true;
              return usuario.modules.some(m =>
                m.modulos?.clave === (newItem.key || sub.key) && m.name === sub.key
              );
            });
            if (filteredSubmenu.length === 0) return;
            newItem.submenu = filteredSubmenu;
          } else if (newItem.key) {
            const hasModule = usuario.modules.some(m => m.modulos?.clave === newItem.key);
            if (!hasModule) return;

            if (newItem.key_submenu) {
              const hasSpecificSubModule = usuario.modules.some(m =>
                m.modulos?.clave === newItem.key && m.name === newItem.key_submenu
              );
              if (!hasSpecificSubModule) return;
            }
          }
        }

        if (item.submenu) {
          itemsWithSubmenu.push(newItem);
        } else {
          itemsWithoutSubmenu.push(newItem);
        }
      });
    });

    return { itemsWithoutSubmenu, itemsWithSubmenu };
  };

  const { itemsWithoutSubmenu: carouselItems, itemsWithSubmenu } = getCarouselItems();

  const mesActual = useMemo(() => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[new Date().getMonth()];
  }, []);

  const [modalOpcionesAlmacenOpen, setModalOpcionesAlmacenOpen] = useState(false);
  const [modalOpcionesMateriaPrimaOpen, setModalOpcionesMateriaPrimaOpen] = useState(false);
  const [modalOpcionesMovimientosOpen, setModalOpcionesMovimientosOpen] = useState(false);
  const [modalOpcionesPedidosOpen, setModalOpcionesPedidosOpen] = useState(false);

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          {!isEmployee || tieneGraficosInicio ? (
            isLargeScreen ? (
              <>
                <h1 className={styles.title}>Inicio</h1>
                <div className={gridStyles.layoutGrid}>
                  <TarjetaGrafico
                    titulo={`Ingresos (${mesActual})`}
                    noDisponible={true}
                    color="var(--success-color)"
                  />
                  <TarjetaGrafico
                    titulo={`Pedidos (${mesActual})`}
                    noDisponible={true}
                    color="var(--warning-color)"
                  />
                  <TarjetaGrafico
                    titulo={`Egresos (${mesActual})`}
                    noDisponible={true}
                    color="var(--error-color)"
                  />
                </div>

                <div className={gridStyles.layoutGrid} style={{ marginTop: '20px' }}>
                  <div style={{ gridColumn: 'span 2', height: '100%' }}>
                    <GraficoVentas noDisponible={true} />
                  </div>
                  <div style={{ gridColumn: 'span 1', height: '100%' }}>
                    <GraficoCategorias noDisponible={true} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className={styles.title}>Descubre más</h1>
                <Carousel
                  items={carouselItems}
                  itemsPerPage={4}
                  renderItem={(item) => (
                    <BotonCuadrante
                      key={item.id}
                      icon={item.icon}
                      title={item.title}
                      onClick={() => {
                        if (item.isBuilding) {
                          showWarning('En construcción', 'Este módulo aún está en construcción');
                          return;
                        }
                        navigate(item.route);
                      }}
                      isNew={item.isNew}
                      isBuilding={item.isBuilding}
                    />
                  )}
                />

                <h1 className={styles.title}>Gestión</h1>
                <div style={{ display: 'grid', gridTemplateColumns: itemsWithSubmenu.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '10px', padding: '0 5px' }}>
                  {itemsWithSubmenu.map(item => (
                    <BotonCuadrante
                      key={item.id}
                      icon={item.icon}
                      title={item.title}
                      onClick={() => {
                        if (item.isBuilding) {
                          showWarning('En construcción', 'Este módulo aún está en construcción');
                          return;
                        }
                        if (item.submenu && item.submenu.length === 1 && item.submenu[0].route) {
                          navigate(item.submenu[0].route);
                          return;
                        }
                        if (item.id === 'almacen') setModalOpcionesAlmacenOpen(true);
                        else if (item.id === 'materia-prima') setModalOpcionesMateriaPrimaOpen(true);
                        else if (item.id === 'movimientos') {
                          if (isSoloVentas) navigate('/movimientos/almacen');
                          else setModalOpcionesMovimientosOpen(true);
                        }
                        else if (item.id === 'pedidos') {
                          if (isSoloVentas) navigate('/pedidos/almacen');
                          else setModalOpcionesPedidosOpen(true);
                        } else if (item.submenu && item.submenu.length > 0 && item.submenu[0].route) {
                          navigate(item.submenu[0].route);
                        }
                      }}
                      isNew={item.isNew}
                      isBuilding={item.isBuilding}
                    />
                  ))}
                </div>
              </>
            )
          ) : (
            <>
              <h1 className={styles.title}>Módulos Asignados</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', padding: '0 5px' }}>
                {[...itemsWithSubmenu, ...carouselItems].map(item => (
                  <BotonCuadrante
                    key={item.id}
                    icon={item.icon}
                    title={item.title}
                    onClick={() => {
                      if (item.isBuilding) {
                        showWarning('En construcción', 'Este módulo aún está en construcción');
                        return;
                      }
                      if (item.submenu) {
                        if (item.submenu.length === 1 && item.submenu[0].route) {
                          navigate(item.submenu[0].route);
                          return;
                        }
                        if (item.id === 'almacen') setModalOpcionesAlmacenOpen(true);
                        else if (item.id === 'materia-prima') setModalOpcionesMateriaPrimaOpen(true);
                        else if (item.id === 'movimientos') {
                          if (isSoloVentas) navigate('/movimientos/almacen');
                          else setModalOpcionesMovimientosOpen(true);
                        }
                        else if (item.id === 'pedidos') {
                          if (isSoloVentas) navigate('/pedidos/almacen');
                          else setModalOpcionesPedidosOpen(true);
                        } else if (item.submenu && item.submenu.length > 0 && item.submenu[0].route) {
                          navigate(item.submenu[0].route);
                        }
                      } else {
                        navigate(item.route);
                      }
                    }}
                    isNew={item.isNew}
                    isBuilding={item.isBuilding}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {!isLargeScreen && <MenuSide />}

      <ModalOpcionesAlmacen isOpen={modalOpcionesAlmacenOpen} onClose={() => setModalOpcionesAlmacenOpen(false)} />
      <ModalOpcionesMateriaPrima isOpen={modalOpcionesMateriaPrimaOpen} onClose={() => setModalOpcionesMateriaPrimaOpen(false)} />
      <ModalOpcionesMovimientos isOpen={modalOpcionesMovimientosOpen} onClose={() => setModalOpcionesMovimientosOpen(false)} />
      <ModalOpcionesPedidos isOpen={modalOpcionesPedidosOpen} onClose={() => setModalOpcionesPedidosOpen(false)} />
    </>
  );
};

export default Home;
