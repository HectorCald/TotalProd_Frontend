import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SideBar.module.css';
import { SideBarOptions } from '../../constants/SideBarOptions';
import { useLayout } from '../../context/LayoutContext';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import Skeleton from '../common/widgets/Skeleton';
import { useToast } from '../../context/ToastContext';

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { showWarning } = useToast();
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
  const isEmployee = !!employeeInfo;

  // IDs estables para usar como dependencias del useMemo
  const usuarioId = usuario?.id;
  const sucursalId = sucursalSeleccionada?.id;
  const modulesLength = usuario?.modules?.length;


  const visibleOptions = useMemo(() => {
    const codigoEmpresaRaw = sucursalSeleccionada?.empresas?.codigo || userInfo?.empresa?.codigo || employeeInfo?.sucursal?.empresas?.codigo || '';
    const codigoEmpresa = codigoEmpresaRaw.toLowerCase();
    const tipoEmpresa = sucursalSeleccionada?.empresas?.tipo || userInfo?.empresa?.tipo || employeeInfo?.sucursal?.empresas?.tipo || 'ventas_produccion';
    const isSoloVentas = tipoEmpresa === 'ventas';

    let filteredSections = SideBarOptions.filter(section => {
      // Para empleados: el filtro de módulos controla qué ven.
      // Para usuarios (owner): ocultar secciones de empresa que no coincidan.
      if (section.empresaCodigo && !isEmployee) {
        if (section.empresaCodigo.toLowerCase() !== codigoEmpresa) return false;
      }
      return true;
    });

    filteredSections = filteredSections.map(section => {
      const newItems = section.items.filter(item => {
        if (isSoloVentas && item.id === 'materia-prima') return false;
        return true;
      }).map(item => {
        if (isSoloVentas && (item.id === 'movimientos' || item.id === 'pedidos')) {
          return {
            ...item,
            submenu: undefined,
            route: `/${item.id}/almacen`,
            MenuSide: true
          };
        }
        return item;
      });
      return { ...section, items: newItems };
    }).filter(s => s.items.length > 0);

    if (!isEmployee || !usuario?.modules) return filteredSections;

    return filteredSections.map(section => {
      const filteredItems = section.items.map(item => {
        if (!item.key && item.id === 'home') return item;

        let filteredSubmenu = item.submenu;
        if (item.submenu) {
          filteredSubmenu = item.submenu.filter(sub => {
            if (sub.key && sub.key_submenu) {
              return usuario.modules.some(m =>
                m.modulos?.clave === sub.key && m.name === sub.key_submenu
              );
            }
            if (!sub.key) return true;
            return usuario.modules.some(m =>
              m.modulos?.clave === (item.key || sub.key) && m.name === sub.key
            );
          });
          if (filteredSubmenu.length === 0) return null;
          return { ...item, submenu: filteredSubmenu };
        }

        if (!item.key) return item;

        const hasModule = usuario.modules.some(m => m.modulos?.clave === item.key);
        if (!hasModule) return null;

        if (item.key_submenu) {
          const hasSpecificSubModule = usuario.modules.some(m =>
            m.modulos?.clave === item.key && m.name === item.key_submenu
          );
          if (!hasSpecificSubModule) return null;
        }

        return item;
      }).filter(Boolean);

      if (filteredItems.length === 0) return null;
      return { ...section, items: filteredItems };
    }).filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId, sucursalId, isEmployee, modulesLength]);


  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    SideBarOptions.forEach((section, idx) => {
      const sectionKey = section.title || `section-${idx}`;
      if (section.isCollapsible === false) {
        initial[sectionKey] = true;
      } else {
        initial[sectionKey] = section.defaultOpen ?? false;
      }
    });
    return initial;
  });

  const toggleSection = (sectionKey, canCollapse) => {
    if (sidebarCollapsed || !canCollapse) return;
    setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Auto-expand submenus and sections if current path matches any of their subitems
  useEffect(() => {
    const autoOpen = {};
    const autoOpenSections = {};
    visibleOptions.forEach((section, idx) => {
      const sectionKey = section.title || `section-${idx}`;
      section.items.forEach(item => {
        if (item.route === currentPath) {
          autoOpenSections[sectionKey] = true;
        }
        if (item.submenu) {
          const hasActiveSub = item.submenu.some(sub => sub.route === currentPath);
          if (hasActiveSub) {
            autoOpen[item.id] = true;
            autoOpenSections[sectionKey] = true;
          }
        }
      });
    });
    setOpenSubmenus(prev => ({ ...prev, ...autoOpen }));
    if (Object.keys(autoOpenSections).length > 0) {
      setOpenSections(prev => ({ ...prev, ...autoOpenSections }));
    }
  }, [currentPath, setOpenSubmenus, visibleOptions]);

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
      {visibleOptions.map((section, idx) => {
        const sectionKey = section.title || `section-${idx}`;
        const canCollapse = section.isCollapsible !== false;
        const isSectionOpen = canCollapse ? (openSections[sectionKey] ?? false) : true;

        return (
          <div key={idx} className={styles.section}>
            {!sidebarCollapsed && (
              canCollapse ? (
                <div
                  className={styles.sectionHeader}
                  onClick={() => toggleSection(sectionKey, canCollapse)}
                >
                  <div className={styles.sectionTitle}>
                    {typeof section.title === 'string' ? section.title.toUpperCase() : section.title}
                  </div>
                  <span className={`${styles.sectionChevron} ${isSectionOpen ? styles.chevronOpen : ''}`}>
                    <i className='bx bx-chevron-down'></i>
                  </span>
                </div>
              ) : (
                <div className={styles.sectionTitleStatic}>
                  {typeof section.title === 'string' ? section.title.toUpperCase() : section.title}
                </div>
              )
            )}
            <div className={!sidebarCollapsed && canCollapse ? (isSectionOpen ? styles.sectionItemsOpen : styles.sectionItemsClosed) : ''}>
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
                        if (item.isBuilding) {
                          showWarning('En construcción', 'Este módulo aún está en construcción');
                          return;
                        }
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
                            {item.isBuilding && <span className={styles.buildingBadge}><i className='bx bx-wrench'></i></span>}
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
                              if (sub.isBuilding) {
                                showWarning('En construcción', 'Este módulo aún está en construcción');
                                return;
                              }
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
                              if (sub.isBuilding) {
                                showWarning('En construcción', 'Este módulo aún está en construcción');
                                return;
                              }
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
                        {item.isBuilding && <span className={styles.buildingBadgeTooltip}><i className='bx bx-wrench'></i></span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SideBar;
