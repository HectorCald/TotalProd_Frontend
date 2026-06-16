import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NavBar.module.css';
import LogoAnimation from './LogoAnimation';
import { useLayout } from '../../context/LayoutContext';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import Skeleton from '../common/widgets/Skeleton';
import CerrarSesion from './modals/CerrarSesion';
import InputSelect from '../common/inputs/InputSelect';
import sucursalesService from '../../services/sucursalesService';

const NavBar = () => {
  const navigate = useNavigate();
  const { toggleSidebar, sidebarCollapsed } = useLayout();
  const { user: userInfo, loading: userLoading, sucursalSeleccionada: userSucursal, seleccionarSucursal: seleccionarUserSucursal } = useUser();
  const { employee: employeeInfo, loading: employeeLoading, sucursalSeleccionada: employeeSucursal, seleccionarSucursal: seleccionarEmployeeSucursal } = useEmployee();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCerrarSesionOpen, setIsCerrarSesionOpen] = useState(false);
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

    const cached = sessionStorage.getItem('ListadoSucursales');
    if (cached) {
      try {
        const opciones = JSON.parse(cached);
        return opciones.map(s => ({
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
        const response = await sucursalesService.getByEmpresaId(empresaId);
        if (response.success && response.data) {
          sessionStorage.setItem('ListadoSucursales', JSON.stringify(response.data));
          const mapOpciones = response.data.map(s => ({
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
      navigate('/dashboard');
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
          <LogoAnimation height="24px" />
        </div>
        <button className={styles.toggleBtn} onClick={toggleSidebar}>
          <i className={`bx ${sidebarCollapsed ? 'bx-menu' : 'bx-menu-alt-left'}`}></i>
        </button>

        {isEverythingLoading ? (
          <div className={styles.sucursalSkeleton}>
            <Skeleton width="150px" height="35px" borderRadius="8px" />
          </div>
        ) : (
          <div className={styles.sucursalSelector}>
            <InputSelect
              value={sucursalSeleccionada?.id}
              onChange={handleSucursalChange}
              options={sucursalesOptions}
              placeholder={loadingSucursales ? "Cargando..." : "Seleccionar sucursal"}
              disabled={sucursalesOptions.length <= 1 || loadingSucursales}
            />
          </div>
        )}
      </div>

      <div className={styles.rightContainer}>
        {isEverythingLoading || !usuario ? (
          <div className={styles.skeletonContainer}>
            <Skeleton width="40px" height="40px" borderRadius="50%" />
            <div className={styles.skeletonText}>
              <Skeleton width="100px" height="15px" />
              <Skeleton width="150px" height="12px" />
            </div>
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
                    {getDisplayName().charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>
                  {getDisplayName()}
                </span>
                <span className={styles.userEmail}>{getDisplayEmail()}</span>
              </div>
            </div>

            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button className={styles.dropdownItem}>
                  <i className='bx bx-user'></i> Perfil
                </button>
                <button className={styles.dropdownItem}>
                  <i className='bx bx-cog'></i> Configuración
                </button>
                <div className={styles.dropdownDivider}></div>
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
    </nav>
  );
};

export default NavBar;
