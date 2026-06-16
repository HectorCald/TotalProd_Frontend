import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SideBar.module.css';
import { SideBarOptions } from '../../constants/SideBarOptions';
import { useLayout } from '../../context/LayoutContext';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import Skeleton from '../common/widgets/Skeleton';

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const {
    sidebarCollapsed,
    openSubmenus,
    setOpenSubmenus,
    sidebarScroll,
    setSidebarScroll
  } = useLayout();
  const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
  const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoverPos, setHoverPos] = useState(0);
  const sidebarRef = useRef(null);

  const usuario = userInfo || employeeInfo;
  const sucursalSeleccionada = userSucursal || employeeSucursal;

  // Auto-expand submenus if current path matches any of their subitems
  useEffect(() => {
    const autoOpen = {};
    SideBarOptions.forEach(section => {
      section.items.forEach(item => {
        if (item.submenu) {
          const hasActiveSub = item.submenu.some(sub => sub.route === currentPath);
          if (hasActiveSub) {
            autoOpen[item.id] = true;
          }
        }
      });
    });
    setOpenSubmenus(prev => ({ ...prev, ...autoOpen }));
  }, [currentPath, setOpenSubmenus]);

  // Restore scroll position on mount
  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = sidebarScroll;
    }
  }, []);

  const toggleSubmenu = (id) => {
    if (sidebarCollapsed) return;
    setOpenSubmenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMouseEnter = (e, id) => {
    if (!sidebarCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos(rect.top);
    setHoveredItem(id);
  };

  const handleMouseLeave = () => {
    if (!sidebarCollapsed) return;
    setHoveredItem(null);
  };

  const handleScroll = (e) => {
    setSidebarScroll(e.target.scrollTop);
  };

  if (!usuario || !sucursalSeleccionada) {
    return (
      <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.section} style={{ marginTop: '20px' }}>
          {!sidebarCollapsed && (
            <div className={styles.sectionTitle} style={{ paddingLeft: '15px', marginBottom: '15px' }}>
              <Skeleton width="100px" height="15px" />
            </div>
          )}
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={styles.itemContainer} style={{ marginBottom: '10px' }}>
              <div className={styles.item} style={{ padding: sidebarCollapsed ? '10px 0' : '10px 15px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
                <Skeleton width="24px" height="24px" borderRadius="4px" />
                {!sidebarCollapsed && <Skeleton width="130px" height="20px" style={{ marginLeft: '15px' }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}
      ref={sidebarRef}
      onScroll={handleScroll}
    >
      {SideBarOptions.map((section, idx) => (
        <div key={idx} className={styles.section}>
          {!sidebarCollapsed && <div className={styles.sectionTitle}>{typeof section.title === 'string' ? section.title.toUpperCase() : section.title}</div>}
          {section.items.map((item) => {
            const isOpen = openSubmenus[item.id];
            const isItemActive = item.route === currentPath ||
              (item.submenu && sidebarCollapsed && item.submenu.some(sub => sub.route === currentPath));

            return (
              <div
                key={item.id}
                className={styles.itemContainer}
                onMouseEnter={(e) => handleMouseEnter(e, item.id)}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  className={`${styles.item} ${isItemActive ? styles.active : ''}`}
                  onClick={() => {
                    if (item.submenu) {
                      toggleSubmenu(item.id);
                    } else if (item.route) {
                      navigate(item.route);
                    }
                  }}
                >
                  <div className={styles.itemLeft}>
                    {item.icon && <span className={styles.icon}><i className={`bx bx-${item.icon}`}></i></span>}
                    {!sidebarCollapsed && (
                      <span className={styles.itemTitleWrap}>
                        {typeof item.title === 'string' ? item.title.toUpperCase() : item.title}
                        {item.isNew && <span className={styles.newBadge}>NEW</span>}
                      </span>
                    )}
                  </div>
                  {!sidebarCollapsed && item.submenu && (
                    <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                      <i className='bx bx-chevron-down'></i>
                    </span>
                  )}
                </div>

                {/* Floating submenu logic */}
                {item.submenu && sidebarCollapsed && hoveredItem === item.id && (
                  <div className={styles.floatingSubmenu} style={{ top: hoverPos }}>
                    <div className={styles.floatingTitle}>{typeof item.title === 'string' ? item.title.toUpperCase() : item.title}</div>
                    {item.submenu.map(sub => (
                      <div
                        key={sub.id}
                        className={`${styles.subitem} ${sub.route === currentPath ? styles.active : ''}`}
                        onClick={() => {
                          if (sub.route) navigate(sub.route);
                        }}
                      >
                        {typeof sub.title === 'string' ? sub.title.toUpperCase() : sub.title}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline submenu logic */}
                {item.submenu && !sidebarCollapsed && (
                  <div className={`${styles.submenu} ${isOpen ? styles.inlineSubmenuOpen : styles.inlineSubmenuClosed}`}>
                    {item.submenu.map(sub => (
                      <div
                        key={sub.id}
                        className={`${styles.subitem} ${sub.route === currentPath ? styles.active : ''}`}
                        onClick={() => {
                          if (sub.route) navigate(sub.route);
                        }}
                      >
                        {typeof sub.title === 'string' ? sub.title.toUpperCase() : sub.title}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tooltip logic */}
                {sidebarCollapsed && !item.submenu && hoveredItem === item.id && (
                  <div className={styles.tooltip} style={{ top: hoverPos + 10 }}>
                    {typeof item.title === 'string' ? item.title.toUpperCase() : item.title}
                    {item.isNew && <span className={styles.newBadgeTooltip}>NEW</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SideBar;
