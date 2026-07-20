import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MenuSide.module.css';
import { SideBarOptions } from '../../constants/SideBarOptions';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';

const MenuSide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
  const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
  
  const usuario = userInfo || employeeInfo;
  const sucursalSeleccionada = userSucursal || employeeSucursal;
  const isEmployee = !!employeeInfo;

  const getFilteredOptions = () => {
    const codigoEmpresa = sucursalSeleccionada?.empresas?.codigo || userInfo?.empresa?.codigo || employeeInfo?.sucursal?.empresas?.codigo || '';

    const filteredSections = SideBarOptions.filter(section => {
      if (section.empresaCodigo && section.empresaCodigo !== codigoEmpresa) {
        return false;
      }
      return true;
    });

    if (!isEmployee || !usuario?.modules) return filteredSections;

    return filteredSections.map(section => {
      const filteredItems = section.items.map(item => {
        if (!item.key && item.id === 'home') return item;
        if (!item.key) return item;

        const hasModule = usuario.modules.some(m => m.modulos?.clave === item.key);
        if (!hasModule) return null;

        let filteredSubmenu = item.submenu;
        if (item.submenu) {
          filteredSubmenu = item.submenu.filter(sub => {
            if (!sub.key) return true;
            return usuario.modules.some(m => 
              m.modulos?.clave === item.key && m.name === sub.key
            );
          });
        }
        return { ...item, submenu: filteredSubmenu };
      }).filter(Boolean);

      if (filteredItems.length === 0) return null;
      return { ...section, items: filteredItems };
    }).filter(Boolean);
  };

  const visibleOptions = getFilteredOptions();
  const menuItems = [];
  visibleOptions.forEach(section => {
    section.items.forEach(item => {
      let addMainItem = item.MenuSide;

      // Si es empleado y tiene asignado balance o deudas, se muestra en el menú inferior
      if (isEmployee && (item.id === 'balance' || item.id === 'deudas')) {
        addMainItem = true;
      }

      if (addMainItem) {
        if (!menuItems.some(m => m.id === item.id)) {
          menuItems.push(item);
        }
      }

      if (item.submenu) {
        item.submenu.forEach(sub => {
          let addSubItem = sub.MenuSide;
          let subItemToPush = { ...sub };

          // Si es empleado y tiene asignado ventas (almacen-salidas), agregar opción de "Vender"
          if (isEmployee && sub.id === 'almacen-salidas') {
            addSubItem = true;
            subItemToPush.title = 'Vender';
          }

          if (addSubItem) {
            if (!menuItems.some(m => m.id === sub.id)) {
              menuItems.push(subItemToPush);
            }
          }
        });
      }
    });
  });

  if (!usuario || !sucursalSeleccionada) {
    return null;
  }

  return (
    <div className={styles.menuSideContainer}>
      {menuItems.map(item => {
        const isActive = currentPath === item.route || (item.route !== '/' && currentPath.startsWith(item.route));

        return (
          <div 
            key={item.id} 
            className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
            onClick={() => navigate(item.route)}
          >
            <i className={`bx bx-${item.icon} ${styles.icon}`}></i>
            <span className={styles.title}>{item.title}</span>
          </div>
        );
      })}
    </div>
  );
};

export default MenuSide;
