import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLayout } from '../../../../context/LayoutContext';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';
import SideBar from '../../../../components/essentials/SideBar';
import NavBar from '../../../../components/essentials/NavBar';
import MenuSide from '../../../../components/essentials/MenuSide';
import layoutStyles from '../../../../pages/home/View.module.css';
import styles from './Organigrama.module.css';
import InputSelectBox from '../../../../components/common/inputs/InputSelectBox';
import NoData from '../../../../components/common/widgets/NoData';
import personalService from '../../../../services/personalService';
import UserService from '../../../../services/userService';
import EmpresaService from '../../../../services/empresaService';

// Estructura inicial: una raíz vacía
const createEmptyNode = () => ({
  id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
  person: null,
  children: []
});

const Organigrama = () => {
  const { isLargeScreen } = useLayout();
  const { user: userInfo, empresa: userEmpresa, setEmpresa } = useUser();
  const { employee: employeeInfo, sucursalSeleccionada } = useEmployee();
  const [adminUserData, setAdminUserData] = useState(null);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isReadOnly = useMemo(() => {
    return (
      !!location.state?.fromPerfilModal ||
      !!location.state?.readOnly ||
      searchParams.get('mode') === 'view' ||
      searchParams.get('readOnly') === 'true'
    );
  }, [location.state, location.search]);

  const token = localStorage.getItem('token');
  const isEmployeeSession = useMemo(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        return decoded.type === 'employee';
      } catch (error) {
        return false;
      }
    }
    return false;
  }, [token]);

  const currentUserId = useMemo(() => {
    if (isEmployeeSession) {
      return employeeInfo?.id || employeeInfo?.personal_id;
    }
    return userInfo?.id || adminUserData?.id;
  }, [isEmployeeSession, employeeInfo, userInfo, adminUserData]);

  const isNodeMe = useCallback(
    (person) => {
      if (!person) return false;
      if (isEmployeeSession) {
        const myId = String(currentUserId || '');
        const pId = String(person.id || '');
        return (
          (myId && pId === myId) ||
          (employeeInfo?.email && person.email && person.email.toLowerCase() === employeeInfo.email.toLowerCase()) ||
          (employeeInfo?.codigo && person.codigo && person.codigo === employeeInfo.codigo)
        );
      }
      const myId = String(currentUserId || '');
      const pId = String(person.id || '');
      return (
        !!person.isAdmin ||
        (myId && (pId === myId || pId === `admin-${myId}`)) ||
        (userInfo?.email && person.email && person.email.toLowerCase() === userInfo.email.toLowerCase())
      );
    },
    [isEmployeeSession, currentUserId, employeeInfo, userInfo]
  );

  // Catálogo de personal con petición directa
  const [personal, setPersonal] = useState([]);
  const [isLoadingPersonal, setIsLoadingPersonal] = useState(true);

  // Organigrama cargado desde BD
  const [initialSavedOrganigrama, setInitialSavedOrganigrama] = useState(null);
  const [treeRoots, setTreeRoots] = useState([createEmptyNode()]);

  // ID del nodo que se está guardando (para mostrar spinner en avatar sin texto)
  const [savingNodeId, setSavingNodeId] = useState(null);

  // Nodo que tiene el InputSelectBox abierto
  const [activeSelectNodeId, setActiveSelectNodeId] = useState(null);

  // Zoom y Pan del lienzo
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Obtener ID de empresa actual
  const getEmpresaId = useCallback(() => {
    return (
      userEmpresa?.id ||
      userInfo?.empresa_id ||
      userInfo?.empresa?.id ||
      employeeInfo?.company_id ||
      employeeInfo?.sucursal?.empresa_id ||
      sucursalSeleccionada?.empresa_id ||
      sucursalSeleccionada?.empresas?.id ||
      localStorage.getItem('empresa_id')
    );
  }, [userEmpresa, userInfo, employeeInfo, sucursalSeleccionada]);

  // Serializar el árbol a JSON minimalista (id, person_id, person_name, is_admin, children)
  const serializeTree = useCallback((nodes) => {
    return nodes.map((node) => ({
      id: node.id,
      person_id: node.person ? String(node.person.id) : null,
      person_name: node.person ? (node.person.nombre_completo || null) : null,
      is_admin: !!node.person?.isAdmin,
      children: Array.isArray(node.children) ? serializeTree(node.children) : []
    }));
  }, []);

  // Manejo de zoom con la rueda del ratón (solo en el div del canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      // Si el cursor está sobre el select o su menú desplegable, permitir el scroll natural del menú y NO hacer zoom
      if (
        e.target.closest(`.${styles.selectWrapper}`) ||
        e.target.closest('[role="listbox"]') ||
        e.target.closest('ul') ||
        e.target.closest('li')
      ) {
        return;
      }

      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom((prevZoom) => {
        const next = Math.min(Math.max(prevZoom * zoomFactor, 0.4), 2.0);
        return Number(next.toFixed(2));
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // Manejo de gestos táctiles (desplazamiento con un dedo y pellizcar para zoom con dos dedos)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchData = {
      mode: null,
      startX: 0,
      startY: 0,
      initialPanX: 0,
      initialPanY: 0,
      initialDistance: 0,
      initialZoom: 1,
      initialMidpoint: { x: 0, y: 0 },
      hasMoved: false,
    };

    const getDistance = (t1, t2) => {
      return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    };

    const getMidpoint = (t1, t2) => {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    };

    const isInteractive = (target) => {
      return (
        target.closest(`.${styles.selectWrapper}`) ||
        target.closest(`.${styles.zoomControls}`) ||
        target.closest('[role="listbox"]') ||
        target.closest('ul') ||
        target.closest('li')
      );
    };

    const handleTouchStart = (e) => {
      if (isInteractive(e.target)) return;

      // Prevenir scroll del contenedor padre desde el primer toque
      e.preventDefault();

      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchData = {
          mode: 'pan',
          startX: t.clientX,
          startY: t.clientY,
          initialPanX: panRef.current.x,
          initialPanY: panRef.current.y,
          initialDistance: 0,
          initialZoom: zoomRef.current,
          initialMidpoint: { x: 0, y: 0 },
          hasMoved: false,
        };
        setIsPanning(true);
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = getDistance(t1, t2);
        const mid = getMidpoint(t1, t2);
        touchData = {
          mode: 'pinch',
          startX: mid.x,
          startY: mid.y,
          initialPanX: panRef.current.x,
          initialPanY: panRef.current.y,
          initialDistance: dist > 0 ? dist : 1,
          initialZoom: zoomRef.current,
          initialMidpoint: mid,
          hasMoved: true,
        };
        setIsPanning(true);
      }
    };

    const handleTouchMove = (e) => {
      // Si el modo es pan o pinch, prevenir scroll del padre SIEMPRE (no condicionalmente)
      if (touchData.mode === 'pan' || touchData.mode === 'pinch') {
        e.preventDefault();
      }

      if (isInteractive(e.target) && touchData.mode !== 'pinch') return;

      if (e.touches.length === 1 && touchData.mode === 'pan') {
        const t = e.touches[0];
        const dx = t.clientX - touchData.startX;
        const dy = t.clientY - touchData.startY;

        if (!touchData.hasMoved && Math.hypot(dx, dy) > 3) {
          touchData.hasMoved = true;
        }

        if (touchData.hasMoved) {
          setPan({
            x: Math.round(touchData.initialPanX + dx),
            y: Math.round(touchData.initialPanY + dy),
          });
        }
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = getDistance(t1, t2);
        const mid = getMidpoint(t1, t2);

        if (touchData.mode !== 'pinch') {
          touchData = {
            mode: 'pinch',
            startX: mid.x,
            startY: mid.y,
            initialPanX: panRef.current.x,
            initialPanY: panRef.current.y,
            initialDistance: dist > 0 ? dist : 1,
            initialZoom: zoomRef.current,
            initialMidpoint: mid,
            hasMoved: true,
          };
          setIsPanning(true);
          return;
        }

        const factor = dist / touchData.initialDistance;
        const nextZoom = Math.min(Math.max(touchData.initialZoom * factor, 0.4), 2.0);
        setZoom(Number(nextZoom.toFixed(2)));

        const midDx = mid.x - touchData.initialMidpoint.x;
        const midDy = mid.y - touchData.initialMidpoint.y;
        setPan({
          x: Math.round(touchData.initialPanX + midDx),
          y: Math.round(touchData.initialPanY + midDy),
        });
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length === 0) {
        touchData.mode = null;
        setIsPanning(false);
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        touchData = {
          mode: 'pan',
          startX: t.clientX,
          startY: t.clientY,
          initialPanX: panRef.current.x,
          initialPanY: panRef.current.y,
          initialDistance: 0,
          initialZoom: zoomRef.current,
          initialMidpoint: { x: 0, y: 0 },
          hasMoved: false,
        };
        setIsPanning(true);
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // Manejo de arrastre (pan)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (
      e.target.closest(`.${styles.selectWrapper}`) ||
      e.target.closest(`.${styles.card}`) ||
      e.target.closest(`.${styles.emptyCard}`) ||
      e.target.closest(`.${styles.zoomControls}`) ||
      e.target.closest('button, input, [role="button"], a, select, [role="listbox"], [role="option"], li, ul')
    ) {
      return;
    }
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(Number((z + 0.1).toFixed(2)), 2.0));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(Number((z - 0.1).toFixed(2)), 0.4));
  };

  const centerOnUser = useCallback((customZoom = null) => {
    if (!canvasRef.current) return false;

    const myCardEl = canvasRef.current.querySelector('[data-is-me="true"]');
    if (!myCardEl) return false;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const nodeRect = myCardEl.getBoundingClientRect();

    const diffX = (canvasRect.left + canvasRect.width / 2) - (nodeRect.left + nodeRect.width / 2);
    const diffY = (canvasRect.top + canvasRect.height / 2) - (nodeRect.top + nodeRect.height / 2);

    setPan((prev) => ({
      x: Math.round(prev.x + diffX),
      y: Math.round(prev.y + diffY),
    }));

    if (customZoom !== null) {
      setZoom(customZoom);
    }

    return true;
  }, []);

  const hasAutoCenteredRef = useRef(false);

  useEffect(() => {
    if (isLoadingPersonal || hasAutoCenteredRef.current) return;

    const timer = setTimeout(() => {
      const centered = centerOnUser();
      if (centered) {
        hasAutoCenteredRef.current = true;
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isLoadingPersonal, treeRoots, centerOnUser]);

  const handleResetZoom = () => {
    const centered = centerOnUser(1);
    if (!centered) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  // Carga de respaldo de información del usuario administrador si aún no está en contexto
  useEffect(() => {
    if (userInfo) {
      setAdminUserData(userInfo);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);

      if (decoded?.type === 'user' && decoded?.id) {
        UserService.getCurrentUser(decoded.id).then((res) => {
          if (res && res.success && res.data?.user) {
            setAdminUserData(res.data.user);
          }
        }).catch(() => {});
      }
    } catch (e) {}
  }, [userInfo]);

  // Petición directa para obtener el personal y la estructura del organigrama (solo al montar)
  useEffect(() => {
    const loadData = async () => {
      try {
        const empresaId = getEmpresaId();
        const isValidEmpresaId = empresaId && empresaId !== 'null' && empresaId !== 'undefined';

        // 1. Cargar catálogo de personal
        try {
          const personalRes = await personalService.getAll();
          if (personalRes && personalRes.success && Array.isArray(personalRes.data)) {
            setPersonal(personalRes.data);
          }
        } catch (pErr) {
          console.error('Error cargando personal:', pErr);
        }

        // 2. Cargar organigrama de la empresa y datos del propietario administrador
        let savedTree = userEmpresa?.organigrama || userInfo?.empresa?.organigrama || null;
        if (isValidEmpresaId) {
          try {
            const empresaRes = await EmpresaService.getById(empresaId);
            if (empresaRes && empresaRes.success && empresaRes.data?.empresa) {
              const emp = empresaRes.data.empresa;
              if (emp.organigrama) {
                savedTree = emp.organigrama;
              }
              if (emp.propietario) {
                setAdminUserData(emp.propietario);
              }
            }
          } catch (eErr) {
            console.error('Error cargando empresa:', eErr);
          }
        }

        if (savedTree) {
          setInitialSavedOrganigrama(savedTree);
        }
      } catch (err) {
        console.error('Error general cargando organigrama:', err);
      } finally {
        setIsLoadingPersonal(false);
      }
    };

    loadData();
  }, []);

  // Opción del usuario Administrador / Dueño del sistema
  const adminOption = useMemo(() => {
    const admin = userInfo || adminUserData;
    const firstName = admin?.first_name || admin?.firstName || '';
    const lastName = admin?.last_name || admin?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || admin?.name || 'Administrador del Sistema';
    const cargo = 'Administrador / Propietario';
    const empresaNombre = (
      userEmpresa?.name ||
      admin?.empresa?.name ||
      employeeInfo?.sucursal?.empresas?.name ||
      'Administración General'
    );

    return {
      value: `admin-${admin?.id || 'sys'}`,
      label: `${fullName} (${cargo})`,
      raw: {
        id: `admin-${admin?.id || 'sys'}`,
        first_name: firstName || fullName,
        last_name: lastName,
        nombre_completo: fullName,
        cargo: cargo,
        sucursal: empresaNombre,
        email: admin?.email || '',
        phone: admin?.phone || '',
        isAdmin: true,
      },
    };
  }, [userInfo, adminUserData, userEmpresa?.name, employeeInfo]);

  // Opciones para InputSelectBox (Admin + Personal Activo)
  const personalOptions = useMemo(() => {
    const list = (personal || [])
      .filter((p) => p.is_active)
      .map((p) => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'Sin nombre';
        const cargo = p.cargo || p.cargos?.name;
        const sucursalName = p.sucursal?.name || p.sucursal || '';
        return {
          value: String(p.id),
          label: cargo ? `${fullName} (${cargo})` : fullName,
          raw: {
            ...p,
            nombre_completo: fullName,
            cargo: cargo || '--',
            sucursal: sucursalName,
          },
        };
      });

    if (adminOption) {
      return [adminOption, ...list];
    }
    return list;
  }, [personal, adminOption]);

  // Reconstruir árbol a partir del organigrama guardado y opciones de personal
  const hasReconstructedRef = useRef(false);

  useEffect(() => {
    if (!initialSavedOrganigrama || hasReconstructedRef.current) return;
    if (personalOptions.length === 0) return;

    try {
      const rawNodes = Array.isArray(initialSavedOrganigrama)
        ? initialSavedOrganigrama
        : typeof initialSavedOrganigrama === 'string'
        ? JSON.parse(initialSavedOrganigrama)
        : [initialSavedOrganigrama];

      if (rawNodes.length > 0) {
        const reconstructNode = (savedNode) => {
          let person = null;
          if (savedNode.person_id) {
            let matchedOpt = null;
            if (savedNode.is_admin || String(savedNode.person_id).startsWith('admin-')) {
              matchedOpt = adminOption;
            } else {
              matchedOpt = personalOptions.find(
                (o) => String(o.value) === String(savedNode.person_id)
              );
            }

            if (matchedOpt) {
              person = { ...matchedOpt.raw };
            } else if (savedNode.is_admin || String(savedNode.person_id).startsWith('admin-')) {
              person = {
                id: savedNode.person_id,
                first_name: adminOption.raw.first_name,
                last_name: adminOption.raw.last_name,
                nombre_completo: adminOption.raw.nombre_completo,
                cargo: 'Administrador / Propietario',
                sucursal: adminOption.raw.sucursal,
                email: adminOption.raw.email,
                phone: adminOption.raw.phone,
                isAdmin: true,
              };
            } else {
              person = {
                id: savedNode.person_id,
                first_name: savedNode.person_name || '',
                last_name: '',
                nombre_completo: savedNode.person_name || 'Personal',
                cargo: '--',
                sucursal: '',
                isAdmin: false,
              };
            }
          }

          return {
            id: savedNode.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            person: person,
            children: Array.isArray(savedNode.children) ? savedNode.children.map(reconstructNode) : [],
          };
        };

        const reconstructed = rawNodes.map(reconstructNode);
        setTreeRoots(reconstructed);
        hasReconstructedRef.current = true;
      }
    } catch (e) {
      console.error('Error al reconstruir el árbol del organigrama:', e);
    }
  }, [initialSavedOrganigrama, personalOptions, adminOption]);

  // Sincronizar datos del administrador en el árbol si se cargan posteriormente
  useEffect(() => {
    if (!adminUserData) return;

    setTreeRoots((prev) => {
      const updateAdminInTree = (nodes) => {
        return nodes.map((n) => {
          if (n.person?.isAdmin || String(n.person?.id).startsWith('admin-')) {
            return {
              ...n,
              person: {
                ...n.person,
                first_name: adminOption.raw.first_name,
                last_name: adminOption.raw.last_name,
                nombre_completo: adminOption.raw.nombre_completo,
                cargo: 'Administrador / Propietario',
                email: adminOption.raw.email,
                phone: adminOption.raw.phone,
                sucursal: adminOption.raw.sucursal,
                isAdmin: true,
              },
            };
          }
          if (n.children && n.children.length > 0) {
            return { ...n, children: updateAdminInTree(n.children) };
          }
          return n;
        });
      };

      return updateAdminInTree(prev);
    });
  }, [adminUserData, adminOption]);

  // Asignar persona a un nodo y guardar en base de datos
  const handleAssignPerson = useCallback(async (nodeId, personId) => {
    const opt = personalOptions.find((o) => String(o.value) === String(personId));
    if (!opt) return;
    const selected = opt.raw;

    const updatedPerson = {
      id: selected.id,
      first_name: selected.first_name,
      last_name: selected.last_name,
      nombre_completo: selected.nombre_completo || `${selected.first_name || ''} ${selected.last_name || ''}`.trim(),
      cargo: selected.cargo || selected.cargos?.name || (selected.isAdmin ? 'Administrador' : '--'),
      sucursal: selected.sucursal?.name || selected.sucursal || '',
      email: selected.email || '',
      phone: selected.phone || '',
      isAdmin: selected.isAdmin || false,
    };

    const updateRecursive = (nodes) => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            person: updatedPerson,
          };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: updateRecursive(node.children) };
        }
        return node;
      });
    };

    const nextTree = updateRecursive(treeRoots);
    setTreeRoots(nextTree);
    setActiveSelectNodeId(null);

    // Spinner en avatar del cuadrante mientras se guarda
    setSavingNodeId(nodeId);
    try {
      const empresaId = getEmpresaId();
      if (empresaId) {
        const serialized = serializeTree(nextTree);
        const res = await EmpresaService.updateOrganigrama(empresaId, serialized);
        if (res && res.success && setEmpresa) {
          setEmpresa((prev) => (prev ? { ...prev, organigrama: serialized } : prev));
        }
      }
    } catch (err) {
      console.error('Error guardando organigrama:', err);
    } finally {
      setSavingNodeId(null);
    }
  }, [personalOptions, treeRoots, getEmpresaId, serializeTree, setEmpresa]);

  // Agregar hijo (nivel inferior / jerarquía)
  const handleAddChild = useCallback((parentNodeId) => {
    const newChild = createEmptyNode();

    const addRecursive = (nodes) => {
      return nodes.map((node) => {
        if (node.id === parentNodeId) {
          return {
            ...node,
            children: [...(node.children || []), newChild],
          };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: addRecursive(node.children) };
        }
        return node;
      });
    };

    setTreeRoots((prev) => addRecursive(prev));
    setActiveSelectNodeId(null);
  }, []);

  // Agregar hermano (mismo nivel / a los lados)
  const handleAddSibling = useCallback((targetNodeId) => {
    const newSibling = createEmptyNode();

    setTreeRoots((prev) => {
      // Si es un nodo raíz
      const isRoot = prev.some((r) => r.id === targetNodeId);
      if (isRoot) {
        const targetIndex = prev.findIndex((r) => r.id === targetNodeId);
        const nextRoots = [...prev];
        nextRoots.splice(targetIndex + 1, 0, newSibling);
        return nextRoots;
      }

      // Si es un nodo hijo de alguien
      const addSiblingRecursive = (nodes) => {
        return nodes.map((node) => {
          if (node.children && node.children.some((c) => c.id === targetNodeId)) {
            const childIdx = node.children.findIndex((c) => c.id === targetNodeId);
            const nextChildren = [...node.children];
            nextChildren.splice(childIdx + 1, 0, newSibling);
            return { ...node, children: nextChildren };
          }
          if (node.children && node.children.length > 0) {
            return { ...node, children: addSiblingRecursive(node.children) };
          }
          return node;
        });
      };

      return addSiblingRecursive(prev);
    });

    setActiveSelectNodeId(null);
  }, []);

  // Eliminar nodo y sincronizar
  const handleDeleteNode = useCallback(async (nodeId) => {
    const deleteRecursive = (nodes) => {
      return nodes
        .filter((n) => n.id !== nodeId)
        .map((n) => {
          if (n.children && n.children.length > 0) {
            return { ...n, children: deleteRecursive(n.children) };
          }
          return n;
        });
    };

    const updated = deleteRecursive(treeRoots);
    const finalTree = updated.length === 0 ? [createEmptyNode()] : updated;
    setTreeRoots(finalTree);

    if (activeSelectNodeId === nodeId) {
      setActiveSelectNodeId(null);
    }

    try {
      const empresaId = getEmpresaId();
      if (empresaId) {
        const serialized = serializeTree(finalTree);
        const res = await EmpresaService.updateOrganigrama(empresaId, serialized);
        if (res && res.success && setEmpresa) {
          setEmpresa((prev) => (prev ? { ...prev, organigrama: serialized } : prev));
        }
      }
    } catch (err) {
      console.error('Error actualizando organigrama al eliminar nodo:', err);
    }
  }, [treeRoots, activeSelectNodeId, getEmpresaId, serializeTree, setEmpresa]);

  // Obtener iniciales para el avatar
  const getInitials = (person) => {
    if (!person) return '';
    const f = (person.first_name || '').charAt(0).toUpperCase();
    const l = (person.last_name || '').charAt(0).toUpperCase();
    return `${f}${l}` || 'P';
  };

  // Cantidad total de nodos en el organigrama
  const totalNodes = useMemo(() => {
    let count = 0;
    const countRecursive = (nodes) => {
      nodes.forEach((n) => {
        count++;
        if (n.children) countRecursive(n.children);
      });
    };
    countRecursive(treeRoots);
    return count;
  }, [treeRoots]);

  // Opciones disponibles para un nodo específico (excluye personas ya asignadas en otros cuadrantes)
  const getAvailableOptions = useCallback((currentNode) => {
    const assignedIds = new Set();
    const collectRecursive = (nodes) => {
      nodes.forEach((n) => {
        if (n.id !== currentNode.id && n.person?.id) {
          assignedIds.add(String(n.person.id));
        }
        if (n.children && n.children.length > 0) {
          collectRecursive(n.children);
        }
      });
    };
    collectRecursive(treeRoots);

    return personalOptions.filter((opt) => !assignedIds.has(String(opt.value)));
  }, [treeRoots, personalOptions]);

  // Renderizar un nodo individual (recursivo)
  const renderNode = (node) => {
    const isEditing = !isReadOnly && activeSelectNodeId === node.id;
    const hasPerson = !!node.person;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className={styles.treeNode}>
        <div className={styles.nodeCardWrapper}>
          {isEditing ? (
            /* Cuadrante en modo selección con InputSelectBox */
            <div
              className={styles.selectWrapper}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              <div className={styles.selectHeader}>
                <span>SELECCIONAR PERSONAL O ADMIN</span>
                <button
                  type="button"
                  className={styles.closeSelectBtn}
                  onClick={() => setActiveSelectNodeId(null)}
                  title="Cancelar"
                >
                  <i className="bx bx-x"></i>
                </button>
              </div>
              <InputSelectBox
                placeholder="Escribe o selecciona personal o admin..."
                options={getAvailableOptions(node)}
                value={node.person ? String(node.person.id) : null}
                onChange={(val) => handleAssignPerson(node.id, val)}
                openDirection="down"
              />
            </div>
          ) : !hasPerson ? (
            /* Cuadrante vacío con símbolo + */
            <div
              className={styles.emptyCard}
              onClick={isReadOnly ? undefined : () => setActiveSelectNodeId(node.id)}
              style={isReadOnly ? { cursor: 'default', opacity: 0.7 } : {}}
              title={isReadOnly ? undefined : "Click para asignar personal o administrador"}
            >
              {!isReadOnly && totalNodes > 1 && (
                <button
                  type="button"
                  className={styles.deleteEmptyBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNode(node.id);
                  }}
                  title="Eliminar cuadrante vacío"
                >
                  <i className="bx bx-x"></i>
                </button>
              )}
              <div className={styles.plusIconWrap}>
                <i className="bx bx-plus"></i>
              </div>
              <span className={styles.emptyText}>{isReadOnly ? 'Sin asignar' : 'Asignar persona'}</span>
            </div>
          ) : (
            /* Cuadrante asignado con persona o admin */
            (() => {
              const isMe = isNodeMe(node.person);
              return (
                <div
                  className={`${styles.card} ${isMe ? styles.myCard : ''}`}
                  data-is-me={isMe ? 'true' : undefined}
                >
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        className={styles.avatarCircle}
                        style={node.person.isAdmin ? { backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fde68a' } : {}}
                        title={node.person.isAdmin ? 'Administrador del Sistema' : ''}
                      >
                        {savingNodeId === node.id ? (
                          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '20px' }}></i>
                        ) : node.person.isAdmin ? (
                          <i className="bx bx-crown" style={{ fontSize: '18px' }}></i>
                        ) : (
                          getInitials(node.person)
                        )}
                      </div>
                      {isMe && <span className={styles.meBadge}>Tú</span>}
                    </div>
                    {!isReadOnly && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => setActiveSelectNodeId(node.id)}
                          title="Cambiar persona"
                        >
                          <i className="bx bx-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteNode(node.id)}
                          title="Eliminar cuadrante"
                        >
                          <i className="bx bx-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.personName}>{node.person.nombre_completo}</div>
                    <div className={styles.personCargo}>{node.person.cargo}</div>
                    {node.person.sucursal && (
                      <div className={styles.personSucursal}>
                        <i className="bx bx-building" style={{ marginRight: '3px' }}></i>
                        {node.person.sucursal}
                      </div>
                    )}
                    {node.person.email && (
                      <div className={styles.personEmail}>
                        <i className="bx bx-envelope" style={{ marginRight: '3px' }}></i>
                        {node.person.email}
                      </div>
                    )}
                  </div>

                  {/* Botones de acción para crear jerarquía abajo o al lado */}
                  {!isReadOnly && (
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.actionPill}
                        onClick={() => handleAddChild(node.id)}
                        title="Crear nivel inferior (subordinado)"
                      >
                        <i className="bx bx-chevron-down"></i>
                        Jerarquía
                      </button>
                      <button
                        type="button"
                        className={styles.actionPill}
                        onClick={() => handleAddSibling(node.id)}
                        title="Crear cuadrante al mismo nivel (colega)"
                      >
                        <i className="bx bx-plus"></i>
                        Nivel
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* Hijos conectados jerárquicamente con líneas continuas precisas */}
        {hasChildren && (
          <div className={styles.childrenSection}>
            {/* Tallo vertical que sale desde la parte inferior del nodo padre */}
            <div className={styles.parentLineDown} />

            {/* Fila horizontal que contiene a todos los hijos */}
            <div className={styles.childrenWrapper}>
              {node.children.map((child, index) => {
                const isFirst = index === 0;
                const isLast = index === node.children.length - 1;
                const isOnly = node.children.length === 1;

                return (
                  <div key={child.id} className={styles.childBranch}>
                    {/* Conector superior del hijo que recibe la línea de la jerarquía */}
                    <div className={styles.connectorContainer}>
                      {/* Riel horizontal que conecta entre hermanos */}
                      {!isOnly && (
                        <div
                          className={`${styles.railSegment} ${
                            isFirst ? styles.railFirst : isLast ? styles.railLast : styles.railMiddle
                          }`}
                        />
                      )}
                      {/* Línea vertical que baja desde el riel horizontal a la tarjeta del hijo */}
                      <div className={styles.childLineDown} />
                    </div>

                    {renderNode(child)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <NavBar />
      <div className={layoutStyles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={layoutStyles.contentArea}>
          <div className={styles.organigramaWrapper}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className={layoutStyles.title} style={{ margin: 0 }}>Organigrama</h1>
            </div>

            {isLoadingPersonal ? (
              <NoData
                icon="loader-alt"
                title="Cargando personal..."
                detail="Obteniendo la lista de personal y estructura del organigrama"
                transparent={true}
                minHeight="450px"
              />
            ) : (
              /* Lienzo del Organigrama con Zoom y Arrastre (solo en este div) */
              <div
                className={styles.canvasContainer}
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
              >
                <div
                  className={styles.transformArea}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transition: isPanning ? 'none' : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                >
                  <div className={styles.treeRoot}>
                    {treeRoots.length === 1 ? (
                      renderNode(treeRoots[0])
                    ) : (
                      <div className={styles.childrenWrapper}>
                        {treeRoots.map((rootNode, index) => {
                          const isFirst = index === 0;
                          const isLast = index === treeRoots.length - 1;

                          return (
                            <div key={rootNode.id} className={styles.childBranch}>
                              <div className={styles.connectorContainer}>
                                <div
                                  className={`${styles.railSegment} ${
                                    isFirst ? styles.railFirst : isLast ? styles.railLast : styles.railMiddle
                                  }`}
                                />
                                <div className={styles.childLineDown} />
                              </div>
                              {renderNode(rootNode)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Controles flotantes de Zoom y Centrado */}
                <div className={styles.zoomControls}>
                  <button
                    type="button"
                    className={styles.zoomBtn}
                    onClick={handleZoomIn}
                    title="Acercar"
                  >
                    <i className="bx bx-plus"></i>
                  </button>
                  <button
                    type="button"
                    className={styles.zoomTextBtn}
                    onClick={handleResetZoom}
                    title="Restablecer (100%)"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    className={styles.zoomBtn}
                    onClick={handleZoomOut}
                    title="Alejar"
                  >
                    <i className="bx bx-minus"></i>
                  </button>
                  <div className={styles.zoomDivider} />
                  <button
                    type="button"
                    className={styles.zoomBtn}
                    onClick={handleResetZoom}
                    title="Centrar organigrama"
                  >
                    <i className="bx bx-target-lock"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Organigrama;
