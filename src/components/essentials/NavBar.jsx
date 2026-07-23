import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NavBar.module.css';
import LogoAnimation from './LogoAnimation';
import { useLayout } from '../../context/LayoutContext';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import Skeleton from '../common/widgets/Skeleton';
import CerrarSesion from './modals/CerrarSesion';
import ModalConfiguracion from './modals/ModalConfiguracion';
import InputSelect from '../common/inputs/InputSelect';
import sucursalesService from '../../services/sucursalesService';

const NavBar = () => {
  const navigate = useNavigate();
  const { toggleSidebar, sidebarCollapsed, isLargeScreen } = useLayout();
  const { user: userInfo, loading: userLoading, sucursalSeleccionada: userSucursal, seleccionarSucursal: seleccionarUserSucursal } = useUser();
  const { employee: employeeInfo, loading: employeeLoading, sucursalSeleccionada: employeeSucursal, seleccionarSucursal: seleccionarEmployeeSucursal } = useEmployee();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCerrarSesionOpen, setIsCerrarSesionOpen] = useState(false);
  const [isConfiguracionOpen, setIsConfiguracionOpen] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [hasFetchedSucursales, setHasFetchedSucursales] = useState(false);
  const dropdownRef = useRef(null);

  // Determinar tipo de sesión usando el token para robustez al recargar
  const token = localStorage.getItem('token');
  const isEmployeeSession = (() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        return decoded.type === 'employee';
      } catch (error) {
        return false;
      }
    }
    return false;
  })();

  const usuario = isEmployeeSession ? employeeInfo : userInfo;
  const loading = isEmployeeSession ? employeeLoading : userLoading;

  const sucursalSeleccionada = isEmployeeSession ? employeeSucursal : userSucursal;
  const seleccionarSucursal = isEmployeeSession ? seleccionarEmployeeSucursal : seleccionarUserSucursal;
  const empresaId = sucursalSeleccionada?.empresas?.id || userInfo?.empresa_id || employeeInfo?.sucursal?.empresas?.id;
  const isEverythingLoading = !usuario || !sucursalSeleccionada;
  const empresaPlan = isEmployeeSession
    ? employeeInfo?.sucursal?.empresas?.plan
    : userInfo?.empresa?.plan;
  const showCrown = empresaPlan?.name && empresaPlan.name !== 'Free';

  const sucursalesOptions = useMemo(() => {
    if (!empresaId) return [];

    if (isEmployeeSession && employeeInfo && !employeeInfo.permisos?.sucursales) {
      if (employeeInfo.sucursal) {
        return [{
          value: employeeInfo.sucursal.id,
          label: employeeInfo.sucursal.name,
          original: employeeInfo.sucursal
        }];
      }
      return [];
    }

    const isDamabrava = empresaId === '259a05d2-2417-47b0-8bbd-50cd5723aae1';

    const cached = sessionStorage.getItem('ListadoSucursales');
    if (cached) {
      try {
        const opciones = JSON.parse(cached);
        return opciones
          .filter(s => {
            if (isDamabrava) return true;
            return !(s.name && s.name.startsWith('Casa Matriz (') && s.name.endsWith(')'));
          })
          .map(s => ({
            value: s.id,
            label: s.name,
            original: s
          }));
      } catch (e) {
        console.error("Error parsing sucursales cache", e);
      }
    }

    return sucursales;
  }, [empresaId, isEmployeeSession, employeeInfo, sucursales]);

  useEffect(() => {
    if (isEverythingLoading) return;
    if (!empresaId) return;

    const cached = sessionStorage.getItem('ListadoSucursales');
    if (cached) return;

    if (isEmployeeSession && employeeInfo && !employeeInfo.permisos?.sucursales) return;

    const fetchFailsafe = async () => {
      setLoadingSucursales(true);
      try {
        const isDamabrava = empresaId === '259a05d2-2417-47b0-8bbd-50cd5723aae1';
        const response = await sucursalesService.getByEmpresaId(empresaId, isDamabrava);
        if (response.success && response.data) {
          const filtradas = response.data.filter(s => {
            if (isDamabrava) return true;
            return !(s.name && s.name.startsWith('Casa Matriz (') && s.name.endsWith(')'));
          });
          sessionStorage.setItem('ListadoSucursales', JSON.stringify(filtradas));
          const mapOpciones = filtradas.map(s => ({
            value: s.id,
            label: s.name,
            original: s
          }));
          setSucursales(mapOpciones);
        }
      } catch (error) {
        console.error('Error fetching sucursales failsafe', error);
      } finally {
        setLoadingSucursales(false);
      }
    };

    fetchFailsafe();
  }, [isEverythingLoading, empresaId, isEmployeeSession, employeeInfo]);

  const handleSucursalChange = (val) => {
    if (sucursalSeleccionada?.id === val) return;
    const opt = sucursalesOptions.find(s => s.value === val);
    if (opt) {
      sessionStorage.clear();
      seleccionarSucursal(opt.original);
      navigate('/home');
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayName = () => {
    if (!usuario) return 'Usuario';
    if (isEmployeeSession) {
      return `${usuario.first_name || ''} ${usuario.last_name || ''}`.trim() || 'Empleado';
    } else {
      return `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim() || 'Usuario';
    }
  };

  const getDisplayEmail = () => {
    if (!usuario) return '';
    return usuario.email || '';
  };

  const displayImage = usuario?.logo_tipo;

  return (
    <nav className={styles.navbar}>
      <div className={styles.leftContainer}>
        <div className={styles.logoContainer}>
          {isEverythingLoading ? (
            <Skeleton width={isLargeScreen ? "80px" : "30px"} height="24px" borderRadius="4px" />
          ) : (
            <LogoAnimation height="24px" hideIcon={true} short={!isLargeScreen} />
          )}
        </div>
        {isLargeScreen && (
          isEverythingLoading ? (
            <Skeleton width="34px" height="34px" borderRadius="5px" />
          ) : (
            <button className={styles.toggleBtn} onClick={toggleSidebar}>
              <i className={`bx ${sidebarCollapsed ? 'bx-menu' : 'bx-menu-alt-left'}`}></i>
            </button>
          )
        )}

        {isEverythingLoading ? (
          <div className={styles.sucursalSkeleton}>
            <Skeleton width={isLargeScreen ? "150px" : "100px"} height="35px" borderRadius="8px" />
          </div>
        ) : (
          <div className={styles.sucursalSelector}>
            <InputSelect
              value={sucursalSeleccionada?.id}
              onChange={handleSucursalChange}
              options={sucursalesOptions}
              placeholder={loadingSucursales ? "Cargando..." : "Seleccionar sucursal"}
              disabled={sucursalesOptions.length <= 1 || loadingSucursales}
              clearable={false}
            />
          </div>
        )}
      </div>

      <div className={styles.rightContainer}>
        {isEverythingLoading || !usuario ? (
          <div className={styles.skeletonContainer}>
            <Skeleton width="40px" height="40px" borderRadius="8px" />
            {isLargeScreen && (
              <div className={styles.skeletonText}>
                <Skeleton width="100px" height="15px" />
                <Skeleton width="150px" height="12px" />
              </div>
            )}
          </div>
        ) : (
          <div className={styles.userProfile} ref={dropdownRef}>
            <div
              className={styles.userInfo}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className={styles.avatar}>
                {displayImage ? (
                  <img src={displayImage} alt="User Avatar" />
                ) : (
                  <div className={styles.avatarFallback}>
                    <i className='bx bxs-building' style={{ fontSize: '24px' }}></i>
                  </div>
                )}
              </div>
              {isLargeScreen && (
                <div className={styles.userDetails}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.userName}>
                      {getDisplayName()}
                    </span>
                    {showCrown && (
                      <div className={styles.goldBadgeSmall} title={empresaPlan.name}>
                        <i className='bx bx-crown' style={{ color: '#fff', fontSize: '12px' }}></i>
                      </div>
                    )}
                  </div>
                  <span className={styles.userEmail}>{getDisplayEmail()}</span>
                </div>
              )}
            </div>
 
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {!isLargeScreen && (
                  <>
                    <div className={styles.dropdownHeaderMobile}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={styles.dropdownUserName}>{getDisplayName()}</span>
                        {showCrown && (
                          <div className={styles.goldBadgeSmall} title={empresaPlan.name}>
                            <i className='bx bx-crown' style={{ color: '#fff', fontSize: '12px' }}></i>
                          </div>
                        )}
                      </div>
                      <span className={styles.dropdownUserEmail}>{getDisplayEmail()}</span>
                    </div>
                  </>
                )}
                <button className={styles.dropdownItem} onClick={() => {
                  setIsConfiguracionOpen(true);
                  setIsDropdownOpen(false);
                }}>
                  <i className='bx bx-cog'></i> Configuración
                </button>
                <button className={styles.dropdownItem} onClick={() => {
                  setIsCerrarSesionOpen(true);
                  setIsDropdownOpen(false);
                }}>
                  <i className='bx bx-log-out'></i> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {isCerrarSesionOpen && (
        <CerrarSesion
          isOpen={isCerrarSesionOpen}
          onClose={() => setIsCerrarSesionOpen(false)}
        />
      )}
      {isConfiguracionOpen && (
        <ModalConfiguracion
          isOpen={isConfiguracionOpen}
          onClose={() => setIsConfiguracionOpen(false)}
        />
      )}
    </nav>
  );
};

export default NavBar;
