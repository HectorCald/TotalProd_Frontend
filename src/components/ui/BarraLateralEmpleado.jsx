import React, { useState, useMemo } from 'react';
import { BoxIcon } from 'boxicons-react';
import { useLayout } from '../../context/LayoutContext';
import { useModalStack } from '../../context/ModalStackContext';
import { getAvailableMainModules } from '../../constants/modules';
import styles from './BarraLateral.module.css';

// Importar componentes de vistas para empleados
import AlmacenGeneral from '../views/almacen-general/AlmacenGeneral';
import AlmacenAcopio from '../views/almacen-acopio/AlmacenAcopio';
import AlmacenGeneralAuxiliar from '../views/almacen-general-auxiliar/AlmacenGeneral-Auxiliar';
import AlmacenAcopioAuxiliar from '../views/almacen-acopio-auxiliar/AlmacenAcopio-Auxiliar';
import PanelMovimientos from '../views/movimientos/PanelMovimientos';
import PanelPedidos from '../views/pedidos/PanelPedidos';
import Clientes from '../views/clientes/Clientes';
import Proveedores from '../views/proveedores/Proveedores';
import Precios from '../views/precios/Precios';
import Gastos from '../views/gastos/PanelGastos';
import Deudas from '../views/deudas/PanelDeudas';
import Reportes from '../views/reportes/Reportes';
import Balance from '../views/balance/Balance';
import FormularioProduccion from '../views/damabrava/produccion/FormularioProduccion';
import VerificarProduccion from '../views/damabrava/produccion/VerificarProduccion';
import MiProduccion from '../views/damabrava/produccion/MiProduccion';
import PanelConteos from '../views/conteos/PanelConteos';

const BarraLateralEmpleado = ({ 
  onMenuClick, 
  activeRoute, 
  onViewOpen, 
  onNavigate,
  onScreenChange,
  activeScreen,
  employee
}) => {
  const { sidebarCollapsed, setSidebarState } = useLayout();
  const { modalStack, unregisterModal } = useModalStack();
  const [expandedMenus, setExpandedMenus] = useState(new Set());

  // Estados para todas las vistas modales
  const [activeView, setActiveView] = useState(null);
  const [viewProps, setViewProps] = useState({});
  
  // Estado para rastrear el último elemento clickeado
  const [lastClickedItem, setLastClickedItem] = useState(null);

  // Obtener módulos disponibles para el empleado con memoización
  const availableMainModules = useMemo(() => {
    console.log('🔍 [DEBUG] Employee data:', employee);
    console.log('🔍 [DEBUG] Employee modules:', employee?.modules);
    const modules = getAvailableMainModules(employee?.modules || []);
    console.log('🔍 [DEBUG] Available main modules:', modules);
    return modules;
  }, [employee?.modules]);

  // Función para mapear módulos a opciones del menú
  const mapModuleToMenuOption = (module) => {
    console.log('🔍 [DEBUG] Mapping module:', module);
    const iconMap = {
      'Almacen': 'package',
      'Acopio': 'leaf',
      'Movimientos': 'transfer',
      'Conteos': 'calculator',
      'Pedidos': 'shopping-bag',
      'Precios': 'dollar',
      'Clientes': 'user',
      'Proveedores': 'truck',
      'Gastos': 'receipt',
      'Deudas': 'receipt',
      'Reportes': 'bar-chart-alt-2',
      'Balance': 'trending-up',
      'Damabrava': 'category'
    };

    const viewMap = {
      'Almacen': 'almacenMedioGeneral',
      'Acopio': 'almacenMedio',
      'Movimientos': 'movimientos',
      'Conteos': 'conteos',
      'Pedidos': 'pedidos',
      'Precios': 'precios',
      'Clientes': 'clientes',
      'Proveedores': 'proveedores',
      'Gastos': 'gastos',
      'Deudas': 'deudas',
      'Reportes': 'reportes',
      'Balance': 'balance',
      'Damabrava': 'mi_produccion'
    };

    const propsMap = {
      'Almacen': { tipo: 'almacen' },
      'Acopio': { tipo: 'acopio' },
      'Movimientos': { tipo: 'almacen' },
      'Conteos': { tipo: 'almacen' },
      'Pedidos': { tipo: 'almacen' },
      'Precios': { tipo: 'almacen' },
      'Clientes': { tipo: 'almacen' },
      'Proveedores': { tipo: 'almacen' },
      'Gastos': { tipo: 'almacen' },
      'Deudas': { tipo: 'almacen' },
      'Reportes': { tipo: 'almacen' },
      'Balance': { tipo: 'almacen' },
      'Damabrava': { tipo: 'almacen' }
    };

    // Si el módulo tiene submodules
    if (module.submodules && module.submodules.length > 0) {
      // Si tiene solo un submódulo, mostrar el nombre del padre pero abrir directamente el submódulo
      if (module.submodules.length === 1) {
        const submodule = module.submodules[0];
        return {
          id: module.key.toLowerCase(),
          title: module.name, // Mostrar el nombre del módulo padre
          icon: iconMap[module.key] || 'grid',
          action: 'openView',
          view: submodule.component === 'AlmacenGeneral' ? 'almacenMedioGeneral' :
                submodule.component === 'AlmacenAcopio' ? 'almacenMedio' :
                submodule.component === 'AlmacenGeneralAuxiliar' ? 'almacenMedioGeneralAuxiliar' :
                submodule.component === 'AlmacenAcopioAuxiliar' ? 'almacenMedioAuxiliar' :
                submodule.component === 'Movimientos' ? 'movimientos' :
                submodule.component === 'PanelConteos' ? 'conteos' :
                submodule.component === 'Pedidos' ? 'pedidos' :
                submodule.component === 'Precios' ? 'precios' :
                submodule.component === 'Clientes' ? 'clientes' :
                submodule.component === 'Proveedores' ? 'proveedores' :
                submodule.component === 'Gastos' ? 'gastos' :
                submodule.component === 'Deudas' ? 'deudas' :
                submodule.component === 'Reportes' ? 'reportes' :
                submodule.component === 'Balance' ? 'balance' :
                submodule.component === 'FormularioProduccion' ? 'formulario' :
                submodule.component === 'VerificarProduccion' ? 'verificacion' :
                submodule.component === 'MiProduccion' ? 'mi_produccion' :
                submodule.component === 'Damabrava' ? 'mi_produccion' : 'verificar_produccion',
          props: submodule.props || propsMap[module.key] || { tipo: 'almacen' }
        };
      } else {
        // Si tiene múltiples submódulos, crear submenu desplegable
        return {
          id: module.key.toLowerCase(),
          title: module.name,
          icon: iconMap[module.key] || 'grid',
          hasSubmenu: true,
          submenu: module.submodules.map((submodule, index) => ({
            id: `${module.key.toLowerCase()}-${submodule.name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
            title: submodule.name,
            icon: submodule.icon || 'file',
            action: 'openView',
            view: submodule.component === 'AlmacenGeneral' ? 'almacenMedioGeneral' :
                  submodule.component === 'AlmacenAcopio' ? 'almacenMedio' :
                  submodule.component === 'AlmacenGeneralAuxiliar' ? 'almacenMedioGeneralAuxiliar' :
                  submodule.component === 'AlmacenAcopioAuxiliar' ? 'almacenMedioAuxiliar' :
                  submodule.component === 'Movimientos' ? 'movimientos' :
                  submodule.component === 'PanelConteos' ? 'conteos' :
                  submodule.component === 'Pedidos' ? 'pedidos' :
                  submodule.component === 'Clientes' ? 'clientes' :
                  submodule.component === 'Proveedores' ? 'proveedores' :
                  submodule.component === 'Gastos' ? 'gastos' :
                  submodule.component === 'Deudas' ? 'deudas' :
                  submodule.component === 'Reportes' ? 'reportes' :
                  submodule.component === 'Balance' ? 'balance' :
                  submodule.component === 'FormularioProduccion' ? 'formulario' :
                  submodule.component === 'VerificarProduccion' ? 'verificacion' :
                  submodule.component === 'MiProduccion' ? 'mi_produccion' :
                  submodule.component === 'Damabrava' ? 'mi_produccion' : 'verificar_produccion',
            props: submodule.props || propsMap[module.key] || { tipo: 'almacen' }
          }))
        };
      }
    } else {
      // Módulo simple sin submenu
      return {
        id: module.key.toLowerCase(),
        title: module.name,
        icon: iconMap[module.key] || 'grid',
        action: 'openView',
        view: viewMap[module.key] || 'almacenMedioGeneral',
        props: propsMap[module.key] || { tipo: 'almacen' }
      };
    }
  };

  // Opciones del menú para empleados con memoización
  const EMPLOYEE_MENU_OPTIONS = useMemo(() => [
    {
      id: 'dashboard',
      title: 'DASHBOARD',
      items: [
        {
          id: 'inicio',
          title: 'Inicio',
          icon: 'home',
          action: 'setScreen',
          route: '/dashboard/default'
        }
      ]
    },
    {
      id: 'funciones',
      title: 'FUNCIONES',
      items: availableMainModules.map(mapModuleToMenuOption)
    }
  ], [availableMainModules]);

  // Función para cerrar todas las vistas y limpiar el stack de modales
  const closeAllViewsAndClearStack = () => {
    // Cerrar todas las vistas activas
    setActiveView(null);
    setViewProps({});
    
    // Limpiar el stack de modales
    modalStack.forEach(modal => {
      unregisterModal(modal.id);
    });
  };

  // Función para abrir vistas
  const handleOpenView = (viewName, props = {}) => {
    setActiveView(viewName);
    setViewProps(props);
  };

  // Función para cerrar vistas
  const handleCloseView = () => {
    setActiveView(null);
    setViewProps({});
  };

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      // Solo permitir un submenu desplegado a la vez
      const newExpandedMenus = new Set();
      if (!expandedMenus.has(item.id)) {
        // Si el submenu no estaba abierto, abrirlo y cerrar los demás
        newExpandedMenus.add(item.id);
      }
      // Si ya estaba abierto, se cierra (newExpandedMenus queda vacío)
      setExpandedMenus(newExpandedMenus);
    } else {
      // Marcar como el último elemento clickeado
      setLastClickedItem(item);
      
      // Si es una acción de setScreen, cerrar todas las vistas y limpiar el stack
      if (item.action === 'setScreen') {
        closeAllViewsAndClearStack();
        if (onScreenChange) {
          onScreenChange('inicio');
        }
      }
      
      // Handle different actions
      if (item.action === 'openView') {
        handleOpenView(item.view, item.props);
      }
      
      // Fallback to original onMenuClick
      if (onMenuClick) {
        onMenuClick(item);
      }
    }
  };

  const handleSubmenuClick = (subItem) => {
    console.log('🔍 [DEBUG] Submenu clicked:', subItem);
    console.log('🔍 [DEBUG] Submenu props:', subItem.props);
    
    // Marcar como el último elemento clickeado
    setLastClickedItem(subItem);
    
    // Handle different actions
    if (subItem.action === 'openView') {
      console.log('🔍 [DEBUG] Opening view:', subItem.view, 'with props:', subItem.props);
      handleOpenView(subItem.view, subItem.props);
    }
    
    // Fallback to original onMenuClick
    if (onMenuClick) {
      onMenuClick(subItem);
    }
  };

  const toggleCollapse = () => {
    setSidebarState(!sidebarCollapsed);
  };

  const isMenuExpanded = (menuId) => {
    return expandedMenus.has(menuId);
  };

  const isActiveRoute = (route) => {
    return activeRoute === route;
  };

  const isActiveItem = (item) => {
    if (item.action === 'setScreen') {
      return isActiveRoute(item.route);
    }
    
    // Solo verificar si es el último elemento clickeado
    if (lastClickedItem && lastClickedItem.id === item.id) {
      return true;
    }
    
    return false;
  };

  const isActiveSubItem = (subItem) => {
    // Solo verificar si es el último elemento clickeado
    if (lastClickedItem && lastClickedItem.id === subItem.id) {
      return true;
    }
    
    return false;
  };

  return (
    <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Header */}
      <div className={styles.sidebarHeader}>
        {/* <button 
          className={styles.collapseButton}
          onClick={toggleCollapse}
        >
          <BoxIcon name={sidebarCollapsed ? "chevron-right" : "chevron-left"} size="16px" />
        </button> */}
      </div>

      {/* Menu Items */}
      <div className={styles.menuContainer}>
        {EMPLOYEE_MENU_OPTIONS.map((section) => (
          <div key={section.id} className={styles.section}>
            {!sidebarCollapsed && (
              <div className={styles.sectionTitle}>
                {section.title}
              </div>
            )}
            
            {section.items.map((item) => (
              <div key={item.id} className={styles.menuItem}>
                <div
                  className={`${styles.menuButton} ${
                    isActiveItem(item) ? styles.active : ''
                  }`}
                  onClick={() => handleMenuClick(item)}
                >
                  <BoxIcon 
                    name={item.icon} 
                    size="20px"
                    className={styles.menuIcon}
                    style={{
                      fontSize: sidebarCollapsed ? '15px !important' : '20px !important'
                    }}
                  />
                  {!sidebarCollapsed && (
                    <>
                      <span className={styles.menuText}>{item.title}</span>
                      {item.hasSubmenu && (
                        <BoxIcon 
                          name={isMenuExpanded(item.id) ? "chevron-up" : "chevron-down"} 
                          size="16px"
                          className={styles.chevronIcon}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Submenu */}
                {item.hasSubmenu && isMenuExpanded(item.id) && !sidebarCollapsed && (
                  <div className={styles.submenu}>
                    {item.submenu.map((subItem) => (
                      <div
                        key={subItem.id}
                        className={`${styles.submenuItem} ${
                          isActiveSubItem(subItem) ? styles.active : ''
                        }`}
                        onClick={() => handleSubmenuClick(subItem)}
                      >
                        <BoxIcon 
                          name={subItem.icon} 
                          size="16px"
                          className={styles.submenuIcon}
                        />
                        <span className={styles.submenuText}>{subItem.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        {!sidebarCollapsed && (
          <div className={styles.footerText}>
            <BoxIcon name="info-circle" size="16px" />
            <span>v1.0.0</span>
          </div>
        )}
      </div>

      {/* Vistas modales */}
      <AlmacenGeneral
        isOpen={activeView === 'almacenMedioGeneral'}
        setIsOpen={handleCloseView}
        tipo={viewProps.tipo || 'almacen'}
        {...viewProps}
      />

      <AlmacenAcopio
        isOpen={activeView === 'almacenMedio'}
        setIsOpen={handleCloseView}
        tipo={viewProps.tipo || 'almacen'}
        {...viewProps}
      />

      <AlmacenGeneralAuxiliar
        isOpen={activeView === 'almacenMedioGeneralAuxiliar'}
        setIsOpen={handleCloseView}
        tipo={viewProps.tipo || 'almacen'}
        {...viewProps}
      />

      <AlmacenAcopioAuxiliar
        isOpen={activeView === 'almacenMedioAuxiliar'}
        setIsOpen={handleCloseView}
        tipo={viewProps.tipo || 'almacen'}
        {...viewProps}
      />

      <PanelMovimientos
        isOpen={activeView === 'movimientos'}
        setIsOpen={handleCloseView}
        tipoMovimiento={viewProps.tipo || 'almacen'}
        {...viewProps}
      />
  
      <PanelConteos
        isOpen={activeView === 'conteos'}
        setIsOpen={handleCloseView}
        tipoConteo={viewProps.tipo || 'almacen'}
        {...viewProps}
      />
      
      <PanelPedidos
        isOpen={activeView === 'pedidos'}
        setIsOpen={handleCloseView}
        tipoPedido={viewProps.tipo || 'almacen'}
        {...viewProps}
      />

      <Clientes
        isOpen={activeView === 'clientes'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <Proveedores
        isOpen={activeView === 'proveedores'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <Precios
        isOpen={activeView === 'precios'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <Gastos
        isOpen={activeView === 'gastos'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <Deudas
        isOpen={activeView === 'deudas'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <Reportes
        isOpen={activeView === 'reportes'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <Balance
        isOpen={activeView === 'balance'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
      <FormularioProduccion
        isOpen={activeView === 'formulario'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
      <VerificarProduccion
        isOpen={activeView === 'verificacion'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
      <MiProduccion
        isOpen={activeView === 'mi_produccion'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
    </div>
  );
};

export default BarraLateralEmpleado;
