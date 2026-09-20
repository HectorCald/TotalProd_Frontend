import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalLateral from '../../common/modals/ModalLateral';
import Input from '../../common/inputs/Input';

import UserService from '../../../services/userService';
import ColumnInfo from '../../common/outputs/ColumnInfo';
import Link from '../../common/outputs/Link';
import Boton from '../../common/botones/Boton';
import BotonIcon from '../../common/botones/BotonIcon';
import Accordion from '../../common/widgets/Accordion';
import { UPDATE_INFO } from '../../update/constants/updateInfo';
import ModalInformacion from './ModalInformacion';
import inputStyles from '../../common/inputs/Input.module.css';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import { useToast } from '../../../context/ToastContext';

const ModalPerfil = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user: userInfo, empresa: userEmpresa, setUserFromService, setEmpresa } = useUser();
  const { employee: employeeInfo, sucursalSeleccionada } = useEmployee();
  const { showDanger } = useToast();

  const [isVersionDetailsOpen, setIsVersionDetailsOpen] = useState(false);

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

  const empresaLogo =
    sucursalSeleccionada?.empresas?.logo_tipo ||
    sucursalSeleccionada?.empresas?.logo ||
    employeeInfo?.sucursal?.empresas?.logo_tipo ||
    employeeInfo?.sucursal?.empresas?.logo ||
    employeeInfo?.empresa?.logo_tipo ||
    employeeInfo?.empresa?.logo ||
    employeeInfo?.logo_tipo ||
    userEmpresa?.logo_tipo;

  const [fetchedEmpresaLogo, setFetchedEmpresaLogo] = useState(null);

  useEffect(() => {
    if (isEmployeeSession && !empresaLogo && !fetchedEmpresaLogo) {
      const empresaId =
        sucursalSeleccionada?.empresas?.id ||
        sucursalSeleccionada?.empresa_id ||
        employeeInfo?.sucursal?.empresas?.id ||
        employeeInfo?.empresa_id ||
        localStorage.getItem('empresa_id');
      if (empresaId) {
        import('../../../services/empresaService').then(({ default: service }) => {
          service.getImage(empresaId).then(res => {
            if (res?.success) {
              const url = res.data?.imagen_url || res.data?.secure_url || res.data?.url || res.data?.image_url;
              if (url) setFetchedEmpresaLogo(url);
            }
          }).catch(() => {});
        });
      }
    }
  }, [isEmployeeSession, empresaLogo, fetchedEmpresaLogo, sucursalSeleccionada, employeeInfo]);

  const displayImage = isEmployeeSession
    ? (empresaLogo || fetchedEmpresaLogo)
    : (userInfo?.logo_tipo || userEmpresa?.logo_tipo);

  const [previewLogo, setPreviewLogo] = useState(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  
  const currentLogo = previewLogo || (logoRemoved ? null : displayImage);
  const currentVersion = window.__current_sw_version || localStorage.getItem('sw_version') || UPDATE_INFO.version;

  const cargoName = typeof employeeInfo?.cargo === 'object' ? (employeeInfo?.cargo?.name || employeeInfo?.cargo?.nombre || '') : (employeeInfo?.cargo || '');
  const sucursalName = employeeInfo?.sucursal?.name || sucursalSeleccionada?.name || '';

  const [loading, setLoading] = useState(false);

  // Estados para el usuario propietario
  const [userFirstName, setUserFirstName] = useState(userInfo?.firstName || userInfo?.first_name || '');
  const [userLastName, setUserLastName] = useState(userInfo?.lastName || userInfo?.last_name || '');
  const [userPhone, setUserPhone] = useState(userInfo?.phone || '');
  const [userEmail, setUserEmail] = useState(userInfo?.email || '');

  const [empresaName, setEmpresaName] = useState(userEmpresa?.name || '');
  const [empresaDesc, setEmpresaDesc] = useState(userEmpresa?.description || '');
  const [empresaCodigo, setEmpresaCodigo] = useState(userEmpresa?.codigo || '');

  const initialValues = useMemo(() => ({
    userFirstName: userInfo?.firstName || userInfo?.first_name || '',
    userLastName: userInfo?.lastName || userInfo?.last_name || '',
    userPhone: userInfo?.phone || '',
    userEmail: userInfo?.email || '',
    empresaName: userEmpresa?.name || '',
    empresaDesc: userEmpresa?.description || '',
    empresaCodigo: userEmpresa?.codigo || '',
    previewLogo: null
  }), [userInfo, userEmpresa]);

  const hasChanges = 
    userFirstName !== initialValues.userFirstName ||
    userLastName !== initialValues.userLastName ||
    userPhone !== initialValues.userPhone ||
    userEmail !== initialValues.userEmail ||
    empresaName !== initialValues.empresaName ||
    empresaDesc !== initialValues.empresaDesc ||
    empresaCodigo !== initialValues.empresaCodigo ||
    previewLogo !== initialValues.previewLogo ||
    logoRemoved;

  const [fieldErrors, setFieldErrors] = useState({
    userFirstName: false,
    userLastName: false,
    userEmail: false,
    empresaName: false,
    empresaCodigo: false
  });

  const fileInputRef = useRef(null);

  const getTipoEmpresa = () => {
    const rawTipo = userEmpresa?.tipo || employeeInfo?.sucursal?.empresas?.tipo || employeeInfo?.empresa?.tipo;
    if (rawTipo === 'ventas_produccion') return 'Ventas y Producción';
    if (rawTipo === 'ventas') return 'Ventas';
    return rawTipo || 'Ventas';
  };

  // Superior inmediato del empleado (obtenido una sola vez junto a toda la información del empleado)
  const superiorInmediatoNombre = useMemo(() => {
    if (employeeInfo?.reporta_a && employeeInfo.reporta_a !== 'No asignado') {
      return employeeInfo.reporta_a;
    }
    if (employeeInfo?.superior_inmediato && employeeInfo.superior_inmediato !== 'No asignado') {
      return employeeInfo.superior_inmediato;
    }
    const organigrama =
      employeeInfo?.sucursal?.empresas?.organigrama ||
      sucursalSeleccionada?.empresas?.organigrama ||
      employeeInfo?.empresa?.organigrama ||
      userEmpresa?.organigrama;

    if (!organigrama || !employeeInfo?.id) return 'No asignado';

    let rawTree = [];
    try {
      rawTree = Array.isArray(organigrama)
        ? organigrama
        : typeof organigrama === 'string'
        ? JSON.parse(organigrama)
        : [organigrama];
    } catch (e) {
      return 'No asignado';
    }

    const findSuperior = (nodes, targetId) => {
      if (!nodes || !Array.isArray(nodes)) return null;

      for (const node of nodes) {
        if (node.children && Array.isArray(node.children)) {
          const hasTargetChild = node.children.some((child) => {
            const childId = child.person?.id || child.person_id;
            return childId && String(childId) === String(targetId);
          });

          if (hasTargetChild) {
            if (node.is_admin || String(node.person_id).startsWith('admin-')) {
              return node.person_name || 'Administrador / Propietario';
            }

            return node.person?.nombre_completo || node.person_name || 'Sin nombre';
          }

          const nested = findSuperior(node.children, targetId);
          if (nested) return nested;
        }
      }

      return null;
    };

    return findSuperior(rawTree, employeeInfo.id) || 'No asignado';
  }, [employeeInfo?.reporta_a, employeeInfo?.superior_inmediato, employeeInfo?.sucursal, sucursalSeleccionada, employeeInfo?.empresa, userEmpresa, employeeInfo?.id]);

  const handleConfirm = async () => {
    if (isEmployeeSession) {
      onClose();
      return;
    }

    let hasErrors = false;
    const newErrors = {
      userFirstName: false,
      userLastName: false,
      userEmail: false,
      empresaName: false,
      empresaCodigo: false
    };

    if (!String(userFirstName || '').trim()) { newErrors.userFirstName = true; hasErrors = true; }
    if (!String(userLastName || '').trim()) { newErrors.userLastName = true; hasErrors = true; }
    if (!String(userEmail || '').trim()) { newErrors.userEmail = true; hasErrors = true; }
    if (!String(empresaName || '').trim()) { newErrors.empresaName = true; hasErrors = true; }

    if (hasErrors) {
      setFieldErrors(newErrors);
      return;
    }

    const payload = {
      userId: userInfo?.id,
      empresaId: userEmpresa?.id,
      userData: {
        first_name: userFirstName,
        last_name: userLastName,
        phone: userPhone,
        email: userEmail
      },
      empresaData: {
        name: empresaName,
        description: empresaDesc,
        codigo: empresaCodigo || null
      }
    };

    // Si hay logo nuevo, convertir a base64 real
    if (previewLogo && previewLogo !== initialValues.previewLogo) {
      payload.logoBase64 = previewLogo;
    }
    if (logoRemoved) {
      payload.removeLogo = true;
    }

    setLoading(true);
    try {
      const res = await UserService.updateConfig(payload);
      setLoading(false);
      if (res.success) {
        if (res.data?.user) {
          setUserFromService(res.data.user);
          if (res.data.user.empresa) {
            setEmpresa(res.data.user.empresa);
          }
        }
        onClose();
      } else {
        showDanger(null, res.message || 'Error al actualizar');
      }
    } catch (error) {
      setLoading(false);
      showDanger(null, 'Error inesperado');
    }
  };

  const renderEmployeeContent = () => {
    const infoPersonalItems = [
      ...(employeeInfo?.ci || employeeInfo?.documento
        ? [{ clave: 'Documento / CI:', valor: employeeInfo.ci || employeeInfo.documento }]
        : []),
      { clave: 'Celular:', valor: employeeInfo?.celular || employeeInfo?.phone || '--' },
      ...(sucursalName ? [{ clave: 'Sucursal:', valor: sucursalName }] : []),
      { clave: 'Reporta a:', valor: superiorInmediatoNombre },
    ];

    return (
      <div style={{ paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <ColumnInfo
          title="Información Personal"
          noScroll={true}
          items={infoPersonalItems}
        />

        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Boton 
            label="Organigrama"
            className="btn-cancel"
            iconName="sitemap"
            onClick={() => {
              onClose();
              navigate('/recursos-humanos/organigrama', { state: { fromPerfilModal: true, readOnly: true } });
            }}
          />
          <Boton 
            label="Detalles de la versión"
            className="btn-cancel"
            iconName="info-circle"
            onClick={() => setIsVersionDetailsOpen(true)}
          />
          <Link 
            text="Términos y Condiciones" 
            iconEnd="right-arrow-alt" 
            onClick={() => showDanger(null, 'Los términos y condiciones no están disponibles por el momento')} 
            align="center"
          />
          <p style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center', margin: '0' }}>Versión {currentVersion}</p>
        </div>
      </div>
    );
  };

  const renderUserContent = () => {
    return (
      <div style={{ paddingBottom: '20px' }}>
        <Accordion title="Detalles de la cuenta">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ marginBlock: '5px', fontSize: '12px', color: 'var(--black-color)' }}>INFORMACIÓN DEL USUARIO</h3>
            <Input 
              label="Nombre" 
              value={userFirstName} 
              onChange={(e) => { setUserFirstName(e.target.value); setFieldErrors(p => ({...p, userFirstName: false})); }} 
              required={true}
              error={fieldErrors.userFirstName}
            />
            <Input 
              label="Apellido" 
              value={userLastName} 
              onChange={(e) => { setUserLastName(e.target.value); setFieldErrors(p => ({...p, userLastName: false})); }} 
              required={true}
              error={fieldErrors.userLastName}
            />
            <Input 
              label="Teléfono" 
              value={userPhone} 
              onChange={(e) => setUserPhone(e.target.value)} 
            />
            <Input 
              label="Correo Electrónico" 
              value={userEmail} 
              onChange={(e) => { setUserEmail(e.target.value); setFieldErrors(p => ({...p, userEmail: false})); }} 
              required={true}
              error={fieldErrors.userEmail}
            />

            <h3 style={{ marginBlock: '5px', fontSize: '12px', color: 'var(--black-color)' }}>INFORMACIÓN DE LA EMPRESA</h3>
            <Input 
              label="Nombre de la Empresa" 
              value={empresaName} 
              onChange={(e) => { setEmpresaName(e.target.value); setFieldErrors(p => ({...p, empresaName: false})); }} 
              required={true}
              error={fieldErrors.empresaName}
            />
            <Input 
              label="Descripción" 
              tipo="textarea" 
              value={empresaDesc} 
              onChange={(e) => setEmpresaDesc(e.target.value)} 
            />
            <Input 
              label="Tipo de Empresa" 
              value={getTipoEmpresa()} 
              readOnly={true} 
            />
            <Input 
              label="Código" 
              value={empresaCodigo} 
              onChange={(e) => setEmpresaCodigo(e.target.value)} 
            />
          </div>
        </Accordion>
        <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Boton 
            label="Organigrama"
            className="btn-cancel"
            iconName="sitemap"
            onClick={() => {
              onClose();
              navigate('/recursos-humanos/organigrama', { state: { fromPerfilModal: true, readOnly: true } });
            }}
          />
          <Boton 
            label="Detalles de la versión"
            className="btn-cancel"
            iconName="info-circle"
            onClick={() => setIsVersionDetailsOpen(true)}
          />
          <Link 
            text="Términos y Condiciones" 
            iconEnd="right-arrow-alt" 
            onClick={() => showDanger(null, 'Los términos y condiciones no están disponibles por el momento')} 
            align="center"
          />
          <p style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center', margin: '0' }}>Versión {currentVersion}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <ModalLateral
        isOpen={isOpen}
        onClose={onClose}
        title="Perfil"
        onConfirm={handleConfirm}
        confirmText="Guardar"
        hideFooter={isEmployeeSession}
        confirmDisabled={!hasChanges}
        loading={loading}
        disableClose={loading}
      >
        <div style={{ paddingRight: '4px', paddingBottom: '8px' }}>
          <style>{`
            .goldBadgeSmall {
              background: linear-gradient(90deg, #dfa91b 0%, #ffeb9b 50%, #dfa91b 100%);
              background-size: 200% auto;
              border-radius: 50%;
              padding: 8px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              animation: shimmerGold 3s linear infinite;
              box-shadow: 0 2px 8px rgba(223, 169, 27, 0.4);
              position: absolute;
              top: -8px;
              right: -8px;
              z-index: 2;
            }
            @keyframes shimmerGold {
              0% { background-position: 0% center; }
              100% { background-position: -200% center; }
            }
          `}</style>

          {isEmployeeSession ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', margin: '10px 0 20px 0', gap: '8px' }}>
              <div style={{ position: 'relative', width: '88px', height: '88px', flexShrink: 0 }}>
                {currentLogo ? (
                  <img
                    src={currentLogo}
                    alt="Logo Empresa"
                    style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--primary-color)' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: '12px', backgroundColor: 'var(--primary-color-light, #e6f0fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary-color)' }}>
                    <i className='bx bxs-building' style={{ color: 'var(--primary-color, #3182ce)', fontSize: '44px' }}></i>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span className={inputStyles.switchLabel} style={{ fontSize: '16px', fontWeight: 650, margin: 0, color: 'var(--black-color)' }}>
                  {`${employeeInfo?.first_name || ''} ${employeeInfo?.last_name || ''}`.trim() || 'Empleado'}
                </span>
                <span className={inputStyles.subtitle} style={{ fontSize: '13px', color: '#718096', margin: 0 }}>
                  {employeeInfo?.codigo || employeeInfo?.email || ''}
                </span>
                {cargoName && (
                  <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--primary-color)', marginTop: '2px' }}>
                    {cargoName}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{ position: 'relative', width: '88px', height: '88px', flexShrink: 0 }}>
                {currentLogo ? (
                  <img src={currentLogo} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--primary-color)' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: '8px', backgroundColor: 'var(--primary-color-light, #e6f0fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary-color)' }}>
                    <i className='bx bxs-building' style={{ color: 'var(--primary-color, #3182ce)', fontSize: '44px' }}></i>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={inputStyles.switchLabel} style={{ fontSize: '14px', margin: 0 }}>
                      {`${userFirstName} ${userLastName}`.trim()}
                    </span>
                  </div>
                  <p className={inputStyles.subtitle} style={{ fontSize: '12px' }}>
                    {userEmail}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                  <Boton 
                    label={currentLogo ? "Cambiar Logo" : "Agregar Logo"} 
                    className="btn-cancel" 
                    iconName={currentLogo ? "upload" : "plus"}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ flex: 1 }}
                  />
                  <BotonIcon 
                    className="btn-error" 
                    iconName="trash"
                    tooltip="Eliminar Logo"
                    tooltipAlign="end"
                    readOnly={!currentLogo} 
                    onClick={() => { 
                      if (previewLogo) {
                        setPreviewLogo(null);
                      } else {
                        setLogoRemoved(true);
                      }
                    }} 
                  />
                </div>
              </div>
            </div>
          )}

          {!isEmployeeSession && (
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const base64 = event.target.result;
                    const img = new Image();
                    img.onload = () => {
                      const ratio = img.width / img.height;
                      if (ratio < 0.8 || ratio > 1.25) {
                        showDanger(null, 'La imagen debe ser similar a un cuadrado');
                      } else {
                        setPreviewLogo(base64);
                        setLogoRemoved(false);
                      }
                    };
                    img.src = base64;
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }
              }}
            />
          )}

          {isEmployeeSession ? renderEmployeeContent() : renderUserContent()}
        </div>
      </ModalLateral>

      <ModalInformacion
        isOpen={isVersionDetailsOpen}
        onClose={() => setIsVersionDetailsOpen(false)}
        info={{ ...UPDATE_INFO, version: currentVersion }}
      />
    </>
  );
};

export default ModalPerfil;
