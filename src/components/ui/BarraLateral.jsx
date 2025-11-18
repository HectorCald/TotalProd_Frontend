import React, { useState, useMemo } from 'react';
import { BoxIcon } from 'boxicons-react';
import { getMenuOptions, handleMenuAction } from '../../constants/menuOptions';
import { useLayout } from '../../context/LayoutContext';
import { useModalStack } from '../../context/ModalStackContext';
import { useUser } from '../../context/UserContext';
import styles from './BarraLateral.module.css';

// Importar todos los componentes de vistas
import AlmacenGeneral from '../views/almacen-general/AlmacenGeneral';
import AlmacenAcopio from '../views/almacen-acopio/AlmacenAcopio';
import PanelMovimientos from '../views/movimientos/PanelMovimientos';
import PanelPedidos from '../views/pedidos/PanelPedidos';
import Clientes from '../views/clientes/Clientes';
import Proveedores from '../views/proveedores/Proveedores';
import Personal from '../views/personal/Personal';
import PanelGastos from '../views/gastos/PanelGastos';
import PanelDeudas from '../views/deudas/PanelDeudas';
import Sucursales from '../views/sucursales/Sucursales';
import Precios from '../views/precios/Precios';
import Balance from '../views/balance/Balance';
import Reportes from '../views/reportes/Reportes';
import FormularioProduccion from '../views/damabrava/produccion/FormularioProduccion';
import VerificarProduccion from '../views/damabrava/produccion/VerificarProduccion';
import MiProduccion from '../views/damabrava/produccion/MiProduccion';
import Reglas from '../views/damabrava/reglas/Reglas';
import PanelPagos from '../views/damabrava/produccion/pagos/PanelPagos';
import AlmacenGeneralAuxiliar from '../views/almacen-general-auxiliar/AlmacenGeneral-Auxiliar';
import AlmacenAcopioAuxiliar from '../views/almacen-acopio-auxiliar/AlmacenAcopio-Auxiliar';
import AlmacenGeneralII from '../views/almacen-general-auxiliar-II/AlmacenGeneral-II';
import PanelConteos from '../views/conteos/PanelConteos';
import PanelCotizaciones from '../views/cotizaciones/PanelCotizaciones';
import ImportExport from '../views/exportar-importar/ImportExport';
import PanelHistorial from '../views/historial/PanelHistorial';
import AsociadosSearch from '../views/asociados/AsociadosSearch';

const BarraLateral = ({ 
  onMenuClick, 
  activeRoute, 
  onViewOpen, 
  onNavigate,
  onScreenChange,
  activeScreen
}) => {
  const { sidebarCollapsed, setSidebarState } = useLayout();
  const { modalStack, unregisterModal } = useModalStack();
  const { user } = useUser();
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  
  // Obtener opciones de menú filtradas según el tipo de empresa
  const menuOptions = useMemo(() => getMenuOptions(user), [user]);

  // Estados para todas las vistas modales
  const [activeView, setActiveView] = useState(null);
  const [viewProps, setViewProps] = useState({});
  
  // Estado para rastrear el último elemento clickeado
  const [lastClickedItem, setLastClickedItem] = useState(null);

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
    // Si es la misma vista (independientemente de props), cerrar y volver a abrir para recargar
    if (activeView === viewName) {
      setActiveView(null);
      setViewProps({});
      // Usar setTimeout para asegurar que se cierre antes de abrir
      setTimeout(() => {
        setActiveView(viewName);
        setViewProps(props);
      }, 50);
    } else {
      setActiveView(viewName);
      setViewProps(props);
    }
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
      }
      
      // Handle different actions
      handleMenuAction(item, handleOpenView, onNavigate, onScreenChange);
      
      // Fallback to original onMenuClick
      if (onMenuClick) {
        onMenuClick(item);
      }
    }
  };

  const handleSubmenuClick = (subItem) => {
    // Marcar como el último elemento clickeado
    setLastClickedItem(subItem);
    
    // Si es una acción de setScreen, cerrar todas las vistas y limpiar el stack
    if (subItem.action === 'setScreen') {
      closeAllViewsAndClearStack();
    }
    
    // Handle different actions
    handleMenuAction(subItem, handleOpenView, onNavigate, onScreenChange);
    
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
    
    // Para opciones del menú que no son dashboard (almacén, movimientos, etc.)
    // Verificar si la vista está activa
    if (item.action === 'openView' && activeView === item.view) {
      return true;
    }
    
    // Si hay un último elemento clickeado, priorizar ese
    if (lastClickedItem && lastClickedItem.id === item.id) {
      return true;
    }
    
    return false;
  };

  const isActiveSubItem = (subItem) => {
    // Para opciones del submenú que no son dashboard (almacén, movimientos, etc.)
    // Verificar si la vista está activa
    if (subItem.action === 'openView' && activeView === subItem.view) {
      return true;
    }
    
    // Si hay un último elemento clickeado, priorizar ese
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
        {menuOptions.map((section) => (
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

      <PanelMovimientos
        isOpen={activeView === 'movimientos'}
        setIsOpen={handleCloseView}
        tipoMovimiento={viewProps.tipo || 'almacen'}
        {...viewProps}
      />

      <PanelPedidos
        isOpen={activeView === 'pedidos'}
        tipoPedido={viewProps.tipo || 'almacen'}
        {...viewProps}
        setIsOpen={handleCloseView}
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

      <Personal
        isOpen={activeView === 'personal'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <PanelGastos
        isOpen={activeView === 'gastos'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <PanelDeudas
        isOpen={activeView === 'deudas'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <Sucursales
        isOpen={activeView === 'sucursales'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <Precios
        isOpen={activeView === 'precios'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
      <AsociadosSearch
        isOpen={activeView === 'asociados'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <PanelHistorial
        isOpen={activeView === 'historial'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <Balance
        isOpen={activeView === 'balance'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />

      <Reportes
        isOpen={activeView === 'reportes'}
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
      <PanelPagos
        isOpen={activeView === 'pagosDamabrava'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
      <Reglas
        isOpen={activeView === 'reglas'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
      <AlmacenGeneralAuxiliar
        isOpen={activeView === 'almacenGeneralAuxiliar'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
      <AlmacenAcopioAuxiliar
        isOpen={activeView === 'almacenAcopioAuxiliar'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
      <AlmacenGeneralII
        isOpen={activeView === 'almacenGeneralAuxiliarII'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
      <PanelConteos
        isOpen={activeView === 'conteos'}
        setIsOpen={handleCloseView}
        tipoConteo={viewProps.tipo || 'almacen'}
        {...viewProps}
      />
      <PanelCotizaciones
        isOpen={activeView === 'cotizaciones'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
      <ImportExport
        isOpen={activeView === 'importar-exportar'}
        setIsOpen={handleCloseView}
        {...viewProps}
      />
    </div>
  );
};

export default BarraLateral;
