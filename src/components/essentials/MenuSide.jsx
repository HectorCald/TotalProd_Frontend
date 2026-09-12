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

  const getNavOptions = () => {
    const codigoEmpresa = sucursalSeleccionada?.empresas?.codigo || userInfo?.empresa?.codigo || employeeInfo?.sucursal?.empresas?.codigo || '';

    const availableLeftItems = [];
    let hasVender = false;

    if (!isEmployee) {
      availableLeftItems.push(
        { id: 'home', title: 'Inicio', icon: 'home', route: '/home' },
        { id: 'balance', title: 'Balance', icon: 'bar-chart-alt', route: '/balance' },
        { id: 'almacen-gestionar', title: 'Inventario', icon: 'package', route: '/almacen/gestionar' },
        { id: 'deudas', title: 'Deudas', icon: 'receipt', route: '/deudas' }
      );
      hasVender = true;
    } else {
      if (!usuario?.modules) return { leftItems: [], venderItem: null };

      availableLeftItems.push({ id: 'home', title: 'Inicio', icon: 'home', route: '/home' });

      const hasBalance = usuario.modules.some(m => m.modulos?.clave === 'balance');
      if (hasBalance) {
        availableLeftItems.push({ id: 'balance', title: 'Balance', icon: 'bar-chart-alt', route: '/balance' });
      }

      const hasInventario = usuario.modules.some(m =>
        m.modulos?.clave === 'almacen_general' && (!m.name || m.name === 'gestionar')
      );
      if (hasInventario) {
        availableLeftItems.push({ id: 'almacen-gestionar', title: 'Inventario', icon: 'package', route: '/almacen/gestionar' });
      }

      const hasDeudas = usuario.modules.some(m => m.modulos?.clave === 'deudas');
      if (hasDeudas) {
        availableLeftItems.push({ id: 'deudas', title: 'Deudas', icon: 'receipt', route: '/deudas' });
      }

      hasVender = usuario.modules.some(m =>
        m.modulos?.clave === 'almacen_general' && (!m.name || m.name === 'realizar_salidas')
      );
    }

    const venderItem = hasVender ? { id: 'almacen-salidas', title: 'Vender', icon: 'cart', route: '/almacen/salidas' } : null;

    return { leftItems: availableLeftItems, venderItem };
  };

  const { leftItems, venderItem } = getNavOptions();

  if (!usuario || !sucursalSeleccionada) {
    return null;
  }

  return (
    <div className={styles.menuSideContainer}>
      <div className={styles.leftItemsContainer}>
        {leftItems.map(item => {
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

      {venderItem && (
        <div
          className={`${styles.menuItem} ${styles.btnVender} ${currentPath.startsWith(venderItem.route) ? styles.btnVenderActive : ''}`}
          onClick={() => navigate(venderItem.route)}
        >
          <i className={`bx bx-${venderItem.icon} ${styles.icon}`}></i>
          <span className={styles.title}>{venderItem.title}</span>
        </div>
      )}
    </div>
  );
};

export default MenuSide;
