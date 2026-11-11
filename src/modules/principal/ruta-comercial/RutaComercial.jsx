import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLayout } from '../../../context/LayoutContext';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import { useToast } from '../../../context/ToastContext';
import useSessionCache from '../../../hooks/useSessionCache';
import useFormatNumber from '../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import { formatFechaLiteral } from '../../../utils/dateUtils';
import clientService from '../../../services/clientService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import BotonIcon from '../../../components/common/botones/BotonIcon';
import CalendarModal from '../../../components/common/widgets/CalendarModal';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import layoutStyles from '../../../modules/home/View.module.css';
import styles from './RutaComercial.module.css';

// Límites geográficos de Bolivia (Suroeste -> Noreste)
const BOLIVIA_BOUNDS = L.latLngBounds(
  [-23.15, -69.95],
  [-9.55, -57.35]
);

const MAX_MAP_ZOOM = 19;

const haversineDistKm = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
};

// Ordena los puntos de venta desde la ubicación actual usando vecino más cercano + mejora 2-Opt
const buildOptimalVisitOrder = (origin, stops) => {
  const uniqueStops = [];
  stops.forEach((s) => {
    const exists = uniqueStops.some(
      (u) => Math.abs(u.lat - s.lat) < 0.00003 && Math.abs(u.lng - s.lng) < 0.00003
    );
    if (!exists) {
      uniqueStops.push({ lat: s.lat, lng: s.lng, id: s.id, name: s.name });
    }
  });

  if (uniqueStops.length <= 1) return uniqueStops;

  const remaining = [...uniqueStops];
  const ordered = [];
  let current = origin;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const d = haversineDistKm(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const [nextStop] = remaining.splice(bestIdx, 1);
    ordered.push(nextStop);
    current = nextStop;
  }

  // Refinamiento 2-Opt de camino abierto (manteniendo origin fijo al inicio)
  if (ordered.length >= 3 && ordered.length <= 80) {
    const path = [origin, ...ordered];
    let improved = true;
    let iterations = 0;

    while (improved && iterations < 40) {
      improved = false;
      iterations += 1;

      for (let i = 1; i < path.length - 1; i += 1) {
        for (let k = i + 1; k < path.length; k += 1) {
          const prevCost =
            haversineDistKm(path[i - 1], path[i]) +
            (k + 1 < path.length ? haversineDistKm(path[k], path[k + 1]) : 0);
          const newCost =
            haversineDistKm(path[i - 1], path[k]) +
            (k + 1 < path.length ? haversineDistKm(path[i], path[k + 1]) : 0);

          if (newCost + 1e-6 < prevCost) {
            const reversed = path.slice(i, k + 1).reverse();
            path.splice(i, k - i + 1, ...reversed);
            improved = true;
          }
        }
      }
    }

    return path.slice(1);
  }

  return ordered;
};

const fetchRoadRouteSegment = async (waypoints) => {
  if (!waypoints || waypoints.length < 2) return [];

  const coordsParam = waypoints
    .map((p) => `${Number(p.lng).toFixed(6)},${Number(p.lat).toFixed(6)}`)
    .join(';');

  const endpoints = [
    `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`,
  ];

  for (const url of endpoints) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8500);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        const coords = json?.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length >= 2) {
          return coords.map(([lng, lat]) => [lat, lng]);
        }
      }
    } catch (_) {
      clearTimeout(timer);
    }
  }

  return waypoints.map((p) => [p.lat, p.lng]);
};

const fetchCompleteRoadRoute = async (orderedPoints) => {
  if (!orderedPoints || orderedPoints.length < 2) return [];

  const maxPerChunk = 25;
  const chunks = [];
  for (let i = 0; i < orderedPoints.length - 1; i += maxPerChunk - 1) {
    chunks.push(orderedPoints.slice(i, i + maxPerChunk));
  }

  const segments = await Promise.all(chunks.map((chunk) => fetchRoadRouteSegment(chunk)));
  const fullLatLngs = [];

  segments.forEach((seg, idx) => {
    if (!seg || seg.length === 0) return;
    if (idx === 0) {
      fullLatLngs.push(...seg);
    } else {
      fullLatLngs.push(...seg.slice(1));
    }
  });

  return fullLatLngs;
};

const getTodayBoliviaStr = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date());
  } catch (_) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

const parseClientCoords = (loc) => {
  if (!loc) return null;
  if (typeof loc === 'object') {
    const rawLat = loc.x ?? loc.lat;
    const rawLng = loc.y ?? loc.lng;
    if (
      rawLat === null ||
      rawLat === undefined ||
      rawLat === '' ||
      rawLng === null ||
      rawLng === undefined ||
      rawLng === ''
    ) {
      return null;
    }
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
    return null;
  }
  const clean = String(loc).trim().replace(/[()]/g, '');
  if (!clean) return null;
  const rawParts = clean.split(',').map((p) => p.trim());
  if (rawParts.length !== 2 || rawParts[0] === '' || rawParts[1] === '') return null;
  const parts = rawParts.map((p) => Number(p));
  if (!Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const parseDescriptionLocation = (desc, fallbackCoords = null) => {
  if (!desc || !String(desc).trim()) {
    if (!fallbackCoords) return null;
    return {
      pais: 'Bolivia',
      ciudad: '--',
      direccion: `${fallbackCoords.lat}, ${fallbackCoords.lng}`,
    };
  }

  const parts = String(desc)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return {
      pais: parts[parts.length - 1],
      ciudad: parts[parts.length - 2],
      direccion: parts.slice(0, -2).join(', '),
    };
  }

  if (parts.length === 2) {
    return {
      pais: parts[1],
      ciudad: parts[0],
      direccion: '--',
    };
  }

  return {
    pais: 'Bolivia',
    ciudad: '--',
    direccion: parts[0],
  };
};

const RutaComercial = () => {
  const { isLargeScreen } = useLayout();
  const { sucursalSeleccionada: userSucursal } = useUser();
  const { sucursalSeleccionada: employeeSucursal } = useEmployee();
  const { showWarning } = useToast();
  const { formatPrice } = useFormatNumber();
  const sucursalId = employeeSucursal?.id || userSucursal?.id;

  const {
    value: clientes,
    setValue: setClientes,
  } = useSessionCache({
    key: 'clientesActivosListado',
    defaultValue: [],
  });

  const mapContainerRef = useRef(null);
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userLocationLayerRef = useRef(null);
  const activeCardRef = useRef(null);
  const hideCardTimerRef = useRef(null);
  const lastPointerTypeRef = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
      ? 'mouse'
      : 'touch'
  );
  const initialZoomRef = useRef(6);
  const lastFittedSignatureRef = useRef('');

  const [zoomPercent, setZoomPercent] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [clientesConVenta, setClientesConVenta] = useState(() => new Set());
  const [ventasSinCliente, setVentasSinCliente] = useState([]);
  const [isLoadingVentas, setIsLoadingVentas] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getTodayBoliviaStr());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showVendidos, setShowVendidos] = useState(true);
  const [showNoVendidos, setShowNoVendidos] = useState(true);
  const [showSinCliente, setShowSinCliente] = useState(true);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [rutaActiva, setRutaActiva] = useState(false);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);

  const hoyBolivia = getTodayBoliviaStr();
  const isTodaySelected = selectedDate === hoyBolivia;

  const dateLiteralAbbr = useFechaLiteral(selectedDate, true);
  const dateButtonLabel = isTodaySelected ? 'Hoy' : dateLiteralAbbr || selectedDate;

  const appliedDateRange = useMemo(
    () => ({ inicio: selectedDate, fin: selectedDate }),
    [selectedDate]
  );

  // Obtener y seguir la ubicación actual del usuario en tiempo real
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return undefined;

    let isMounted = true;

    const applyCoords = (pos) => {
      if (!isMounted || !pos?.coords) return;
      const lat = Number(pos.coords.latitude);
      const lng = Number(pos.coords.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setMiUbicacion({ lat, lng });
      }
    };

    navigator.geolocation.getCurrentPosition(
      applyCoords,
      () => {
        navigator.geolocation.getCurrentPosition(applyCoords, () => {}, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000,
        });
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
    );

    const watchId = navigator.geolocation.watchPosition(applyCoords, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 12000,
    });

    return () => {
      isMounted = false;
      if (watchId !== undefined && watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Obtener clientes y movimientos de venta sin límite para el rango de fechas seleccionado
  useEffect(() => {
    let isMounted = true;
    lastFittedSignatureRef.current = '';
    setRutaActiva(false);
    if (routeLayerRef.current) {
      routeLayerRef.current.clearLayers();
    }

    const loadRutaData = async () => {
      if (isMounted) setIsLoadingVentas(true);

      try {
        const [resClients, resVentas] = await Promise.all([
          clientService.getAll(true),
          movimientosAlmacenService.getAllSinLimiteRuta(appliedDateRange, 'salida'),
        ]);

        if (isMounted && resClients?.success && Array.isArray(resClients.data)) {
          setClientes(resClients.data);
        }

        const soldClientIds = new Set();
        const nonClientSales = [];

        if (resVentas?.success && Array.isArray(resVentas.data)) {
          resVentas.data.forEach((mov) => {
            if (mov.cliente_id !== null && mov.cliente_id !== undefined) {
              soldClientIds.add(String(mov.cliente_id));
            } else {
              nonClientSales.push(mov);
            }
          });
        }

        if (isMounted) {
          setClientesConVenta(soldClientIds);
          setVentasSinCliente(nonClientSales);
        }
      } catch (err) {
        console.error('Error al cargar datos en Ruta Comercial:', err);
        if (isMounted) {
          setClientesConVenta(new Set());
          setVentasSinCliente([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingVentas(false);
        }
      }
    };

    loadRutaData();

    return () => {
      isMounted = false;
    };
  }, [sucursalId, appliedDateRange, setClientes]);

  // Filtrar clientes que cuentan con coordenadas válidas en location
  const clientesConUbicacion = useMemo(() => {
    return (clientes || [])
      .map((c) => {
        const coords = parseClientCoords(c.location);
        if (!coords) return null;
        return {
          ...c,
          lat: coords.lat,
          lng: coords.lng,
        };
      })
      .filter(Boolean);
  }, [clientes]);

  // Ventas realizadas sin cliente asignado que cuentan con coordenadas GPS válidas
  const ventasSinClienteConUbicacion = useMemo(() => {
    const occupied = clientesConUbicacion.map((c) => ({ lat: c.lat, lng: c.lng }));

    return (ventasSinCliente || [])
      .map((v) => {
        const coords = parseClientCoords(v.ubicacion);
        if (!coords) return null;

        let displayLat = coords.lat;
        let displayLng = coords.lng;
        let offsetStep = 0;

        while (
          occupied.some(
            (o) =>
              Math.abs(o.lat - displayLat) < 0.00003 &&
              Math.abs(o.lng - displayLng) < 0.00003
          ) &&
          offsetStep < 16
        ) {
          offsetStep += 1;
          const angle = (offsetStep * 45 * Math.PI) / 180;
          const radius = 0.000045 * (1 + Math.floor((offsetStep - 1) / 8) * 0.65);
          displayLat = coords.lat + Math.sin(angle) * radius;
          displayLng = coords.lng + Math.cos(angle) * radius;
        }

        occupied.push({ lat: displayLat, lng: displayLng });

        return {
          ...v,
          lat: displayLat,
          lng: displayLng,
          rawLat: coords.lat,
          rawLng: coords.lng,
        };
      })
      .filter(Boolean);
  }, [ventasSinCliente, clientesConUbicacion]);

  // Clientes con ubicación a los que aún NO se les vendió en el periodo (para generar la ruta)
  const clientesPendientesConUbicacion = useMemo(() => {
    return clientesConUbicacion.filter((c) => !clientesConVenta.has(String(c.id)));
  }, [clientesConUbicacion, clientesConVenta]);

  // Estadísticas de clientes totales y porcentaje con venta en el periodo
  const { totalClientes, clientesVendidos, porcentajeVentas } = useMemo(() => {
    const lista = clientes || [];
    const total = lista.length;
    if (total === 0) {
      return { totalClientes: 0, clientesVendidos: 0, porcentajeVentas: '0%' };
    }
    const vendidos = lista.reduce(
      (acc, c) => (clientesConVenta.has(String(c.id)) ? acc + 1 : acc),
      0
    );
    const rawPct = (vendidos / total) * 100;
    const formattedPct = Number.isInteger(rawPct) ? `${rawPct}%` : `${rawPct.toFixed(1)}%`;
    return {
      totalClientes: total,
      clientesVendidos: vendidos,
      porcentajeVentas: formattedPct,
    };
  }, [clientes, clientesConVenta]);

  const clearHideTimer = useCallback(() => {
    if (hideCardTimerRef.current) {
      clearTimeout(hideCardTimerRef.current);
      hideCardTimerRef.current = null;
    }
  }, []);

  const closeActiveCard = useCallback(() => {
    clearHideTimer();
    const map = mapInstanceRef.current;
    if (activeCardRef.current && map) {
      map.removeLayer(activeCardRef.current);
      activeCardRef.current = null;
    }
  }, [clearHideTimer]);

  const zoomMaxToLocation = useCallback((lat, lng) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    closeActiveCard();
    map.flyTo([lat, lng], MAX_MAP_ZOOM, {
      animate: true,
      duration: 0.65,
    });
  }, [closeActiveCard]);

  const openClientCard = useCallback((cliente) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    clearHideTimer();

    if (activeCardRef.current) {
      map.removeLayer(activeCardRef.current);
      activeCardRef.current = null;
    }

    const pt = map.latLngToContainerPoint([cliente.lat, cliente.lng]);
    const size = map.getSize();

    let direction = 'top';
    let offset = [0, -32];

    if (pt.y < 200) {
      direction = 'bottom';
      offset = [0, 6];
    } else if (pt.x < 160) {
      direction = 'right';
      offset = [18, -18];
    } else if (pt.x > size.x - 160) {
      direction = 'left';
      offset = [-18, -18];
    }

    const nombre = escapeHtml(cliente.name || 'Sin nombre');
    const totalPedidos = Number(cliente.total_orders) || 0;
    const textoPedidos =
      totalPedidos > 1 ? `${totalPedidos} Pedidos` : totalPedidos === 1 ? '1 Pedido' : 'Sin Pedidos';
    const telefono = cliente.phone ? escapeHtml(cliente.phone) : '';
    const descripcion = cliente.description ? escapeHtml(cliente.description) : '';
    const ubicacionSeparada = parseDescriptionLocation(cliente.description_location, {
      lat: cliente.lat,
      lng: cliente.lng,
    });

    const tooltipHtml = `
      <div>
        <div class="${styles.tooltipHeader}">
          <span class="${styles.tooltipName}">${nombre}</span>
          <span class="${styles.tooltipBadge}">${textoPedidos}</span>
        </div>
        ${
          telefono
            ? `<div class="${styles.tooltipSection}">
                <div class="${styles.tooltipRow}">
                  <i class="bx bx-phone"></i>
                  <span>${telefono}</span>
                </div>
              </div>`
            : ''
        }
        ${
          descripcion
            ? `<div class="${styles.tooltipSection}">
                <div class="${styles.tooltipSectionTitle}">Descripción</div>
                <div class="${styles.tooltipText}">${descripcion}</div>
              </div>`
            : ''
        }
        ${
          ubicacionSeparada
            ? `<div class="${styles.tooltipSection}">
                <div class="${styles.tooltipSectionTitle}">Ubicación</div>
                <div class="${styles.tooltipKeyValList}">
                  <div class="${styles.tooltipKeyValRow}">
                    <span class="${styles.tooltipKey}">País</span>
                    <span class="${styles.tooltipVal}">${escapeHtml(ubicacionSeparada.pais)}</span>
                  </div>
                  <div class="${styles.tooltipKeyValRow}">
                    <span class="${styles.tooltipKey}">Ciudad</span>
                    <span class="${styles.tooltipVal}">${escapeHtml(ubicacionSeparada.ciudad)}</span>
                  </div>
                  <div class="${styles.tooltipKeyValRow}">
                    <span class="${styles.tooltipKey}">Dirección</span>
                    <span class="${styles.tooltipVal}">${escapeHtml(ubicacionSeparada.direccion)}</span>
                  </div>
                </div>
              </div>`
            : ''
        }
      </div>
    `;

    const cardTooltip = L.tooltip({
      permanent: true,
      interactive: true,
      direction,
      offset,
      opacity: 1,
      className: 'ruta-client-tooltip',
    })
      .setLatLng([cliente.lat, cliente.lng])
      .setContent(tooltipHtml)
      .addTo(map);

    activeCardRef.current = cardTooltip;

    const cardEl = cardTooltip.getElement();
    if (cardEl) {
      L.DomEvent.disableClickPropagation(cardEl);
      L.DomEvent.disableScrollPropagation(cardEl);

      cardEl.addEventListener('mouseenter', () => {
        clearHideTimer();
      });

      cardEl.addEventListener('mouseleave', () => {
        if (lastPointerTypeRef.current === 'mouse') {
          clearHideTimer();
          hideCardTimerRef.current = setTimeout(() => {
            closeActiveCard();
          }, 140);
        }
      });

      cardEl.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        zoomMaxToLocation(cliente.lat, cliente.lng);
      });
    }
  }, [clearHideTimer, closeActiveCard, zoomMaxToLocation]);

  const openSaleCard = useCallback((venta) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    clearHideTimer();

    if (activeCardRef.current) {
      map.removeLayer(activeCardRef.current);
      activeCardRef.current = null;
    }

    const pt = map.latLngToContainerPoint([venta.lat, venta.lng]);
    const size = map.getSize();

    let direction = 'top';
    let offset = [0, -32];

    if (pt.y < 200) {
      direction = 'bottom';
      offset = [0, 6];
    } else if (pt.x < 160) {
      direction = 'right';
      offset = [18, -18];
    } else if (pt.x > size.x - 160) {
      direction = 'left';
      offset = [-18, -18];
    }

    const nombreVenta = escapeHtml(
      venta.concepto && String(venta.concepto).trim()
        ? String(venta.concepto).trim()
        : 'Venta rápida'
    );
    const codigo = escapeHtml(venta.codigo || '--');
    const totalFormatted = escapeHtml(`Bs. ${formatPrice(venta.total || 0)}`);
    const fechaFormateada = venta.fecha ? escapeHtml(formatFechaLiteral(venta.fecha, true)) : '--';
    const coordsTexto = `${Number(venta.rawLat).toFixed(6)}, ${Number(venta.rawLng).toFixed(6)}`;

    const tooltipHtml = `
      <div>
        <div class="${styles.tooltipHeader}">
          <span class="${styles.tooltipName}">${nombreVenta}</span>
          <span class="${styles.tooltipBadge} ${styles.tooltipBadgeSale}">Sin cliente</span>
        </div>
        <div class="${styles.tooltipSection}">
          <div class="${styles.tooltipSectionTitle}">Detalles</div>
          <div class="${styles.tooltipKeyValList}">
            <div class="${styles.tooltipKeyValRow}">
              <span class="${styles.tooltipKey}">Código</span>
              <span class="${styles.tooltipVal}">${codigo}</span>
            </div>
            <div class="${styles.tooltipKeyValRow}">
              <span class="${styles.tooltipKey}">Total</span>
              <span class="${styles.tooltipVal} ${styles.tooltipValPrimary}">${totalFormatted}</span>
            </div>
            <div class="${styles.tooltipKeyValRow}">
              <span class="${styles.tooltipKey}">Fecha</span>
              <span class="${styles.tooltipVal}">${fechaFormateada}</span>
            </div>
          </div>
        </div>
        <div class="${styles.tooltipSection}">
          <div class="${styles.tooltipSectionTitle}">Ubicación GPS</div>
          <div class="${styles.tooltipKeyValList}">
            <div class="${styles.tooltipKeyValRow}">
              <span class="${styles.tooltipKey}">Coordenadas</span>
              <span class="${styles.tooltipVal}">${escapeHtml(coordsTexto)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const cardTooltip = L.tooltip({
      permanent: true,
      interactive: true,
      direction,
      offset,
      opacity: 1,
      className: 'ruta-client-tooltip',
    })
      .setLatLng([venta.lat, venta.lng])
      .setContent(tooltipHtml)
      .addTo(map);

    activeCardRef.current = cardTooltip;

    const cardEl = cardTooltip.getElement();
    if (cardEl) {
      L.DomEvent.disableClickPropagation(cardEl);
      L.DomEvent.disableScrollPropagation(cardEl);

      cardEl.addEventListener('mouseenter', () => {
        clearHideTimer();
      });

      cardEl.addEventListener('mouseleave', () => {
        if (lastPointerTypeRef.current === 'mouse') {
          clearHideTimer();
          hideCardTimerRef.current = setTimeout(() => {
            closeActiveCard();
          }, 140);
        }
      });

      cardEl.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        zoomMaxToLocation(venta.lat, venta.lng);
      });
    }
  }, [clearHideTimer, closeActiveCard, formatPrice, zoomMaxToLocation]);

  const updateZoomIndicator = useCallback((map) => {
    const baseZoom = initialZoomRef.current || 6;
    const currentZoom = map.getZoom();
    const pct = Math.max(25, Math.round(100 + (currentZoom - baseZoom) * 20));
    setZoomPercent(pct);
  }, []);

  // Inicializar instancia base del mapa de Bolivia
  useEffect(() => {
    const mapEl = mapElementRef.current;
    if (!mapEl || mapInstanceRef.current) return;

    const map = L.map(mapEl, {
      center: [-16.45, -64.45],
      zoom: 6,
      minZoom: 5,
      maxZoom: MAX_MAP_ZOOM,
      zoomSnap: 0.15,
      zoomDelta: 0.6,
      wheelPxPerZoomLevel: 80,
      maxBounds: BOLIVIA_BOUNDS.pad(0.06),
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      bounceAtZoomLimits: false,
    });

    mapInstanceRef.current = map;
    routeLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    userLocationLayerRef.current = L.layerGroup().addTo(map);

    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxNativeZoom: MAX_MAP_ZOOM,
      maxZoom: MAX_MAP_ZOOM,
    }).addTo(map);

    map.fitBounds(BOLIVIA_BOUNDS, { padding: [18, 18], animate: false });
    const fittedZoom = map.getZoom();
    initialZoomRef.current = fittedZoom;
    map.setMinZoom(Math.max(4.8, fittedZoom - 0.3));
    setZoomPercent(100);

    map.on('click', () => {
      closeActiveCard();
    });
    map.on('zoom', () => updateZoomIndicator(map));
    map.on('zoomend', () => updateZoomIndicator(map));
    map.on('dragstart', () => setIsPanning(true));
    map.on('dragend', () => setIsPanning(false));

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize({ animate: false });
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearHideTimer();
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      activeCardRef.current = null;
      userLocationLayerRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [clearHideTimer, closeActiveCard, updateZoomIndicator]);

  // Renderizar marcadores dinámicamente con los clientes y ventas sin cliente del periodo seleccionado
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    closeActiveCard();
    markersLayer.clearLayers();

    const primaryIcon = L.divIcon({
      className: 'ruta-client-marker-wrapper',
      html: `<div class="${styles.markerPin} ${styles.markerPinPrimary}"><i class="bx bx-store ${styles.markerIcon}"></i></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    const grayIcon = L.divIcon({
      className: 'ruta-client-marker-wrapper',
      html: `<div class="${styles.markerPin} ${styles.markerPinGray}"><i class="bx bx-store ${styles.markerIcon}"></i></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    const saleIcon = L.divIcon({
      className: 'ruta-client-marker-wrapper',
      html: `<div class="${styles.markerPin} ${styles.markerPinSale}"><i class="bx bx-receipt ${styles.markerIcon}"></i></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    let currentBounds = L.latLngBounds(
      BOLIVIA_BOUNDS.getSouthWest(),
      BOLIVIA_BOUNDS.getNorthEast()
    );
    let boundsExpanded = false;

    const attachMarkerInteractions = (marker, lat, lng, onOpenCard) => {
      marker.on('mouseover', () => {
        if (lastPointerTypeRef.current === 'mouse') {
          onOpenCard();
        }
      });

      marker.on('mouseout', () => {
        if (lastPointerTypeRef.current === 'mouse') {
          clearHideTimer();
          hideCardTimerRef.current = setTimeout(() => {
            closeActiveCard();
          }, 150);
        }
      });

      marker.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        if (lastPointerTypeRef.current === 'mouse') {
          zoomMaxToLocation(lat, lng);
        } else {
          onOpenCard();
        }
      });
    };

    clientesConUbicacion.forEach((cliente) => {
      if (!currentBounds.contains([cliente.lat, cliente.lng])) {
        currentBounds.extend([cliente.lat, cliente.lng]);
        boundsExpanded = true;
      }

      const tuvoVenta = clientesConVenta.has(String(cliente.id));
      if (tuvoVenta && !showVendidos) return;
      if (!tuvoVenta && !showNoVendidos) return;

      const marker = L.marker([cliente.lat, cliente.lng], {
        icon: tuvoVenta ? primaryIcon : grayIcon,
        zIndexOffset: tuvoVenta ? 200 : 0,
      }).addTo(markersLayer);

      attachMarkerInteractions(marker, cliente.lat, cliente.lng, () => openClientCard(cliente));
    });

    ventasSinClienteConUbicacion.forEach((venta) => {
      if (!currentBounds.contains([venta.lat, venta.lng])) {
        currentBounds.extend([venta.lat, venta.lng]);
        boundsExpanded = true;
      }

      if (!showSinCliente) return;

      const marker = L.marker([venta.lat, venta.lng], {
        icon: saleIcon,
        zIndexOffset: 260,
      }).addTo(markersLayer);

      attachMarkerInteractions(marker, venta.lat, venta.lng, () => openSaleCard(venta));
    });

    if (boundsExpanded) {
      map.setMaxBounds(currentBounds.pad(0.08));
    }

    const allPinPoints = [
      ...clientesConUbicacion.map((c) => [c.lat, c.lng]),
      ...ventasSinClienteConUbicacion.map((v) => [v.lat, v.lng]),
    ];

    if (allPinPoints.length > 0) {
      const coordsSignature = allPinPoints
        .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
        .sort()
        .join('|');

      if (lastFittedSignatureRef.current !== coordsSignature) {
        const isFirstFit = lastFittedSignatureRef.current === '';
        lastFittedSignatureRef.current = coordsSignature;

        map.invalidateSize({ animate: false });
        const pinsBounds = L.latLngBounds(allPinPoints);
        const fitOptions = {
          paddingTopLeft: [52, 98],
          paddingBottomRight: [48, 64],
          maxZoom: 16.5,
        };

        if (isFirstFit) {
          map.fitBounds(pinsBounds, { ...fitOptions, animate: false });
          initialZoomRef.current = map.getZoom();
          setZoomPercent(100);
        } else {
          map.flyToBounds(pinsBounds, { ...fitOptions, duration: 0.45 });
          const targetZoom = Math.min(
            16.5,
            map.getBoundsZoom(pinsBounds, false, L.point(100, 162))
          );
          if (Number.isFinite(targetZoom)) {
            initialZoomRef.current = targetZoom;
          }
        }
      }
    }
  }, [
    clearHideTimer,
    clientesConUbicacion,
    clientesConVenta,
    ventasSinClienteConUbicacion,
    showVendidos,
    showNoVendidos,
    showSinCliente,
    closeActiveCard,
    openClientCard,
    openSaleCard,
    zoomMaxToLocation,
  ]);

  // Renderizar en tiempo real el marcador de ubicación actual del usuario
  useEffect(() => {
    const map = mapInstanceRef.current;
    const userLayer = userLocationLayerRef.current;
    if (!map || !userLayer) return;

    userLayer.clearLayers();
    if (!miUbicacion) return;

    const currentMaxBounds = map.options.maxBounds;
    if (currentMaxBounds && !currentMaxBounds.contains([miUbicacion.lat, miUbicacion.lng])) {
      const extended = L.latLngBounds(
        currentMaxBounds.getSouthWest(),
        currentMaxBounds.getNorthEast()
      );
      extended.extend([miUbicacion.lat, miUbicacion.lng]);
      map.setMaxBounds(extended.pad(0.06));
    }

    const userIcon = L.divIcon({
      className: 'ruta-user-location-wrapper',
      html: `
        <div class="${styles.userLocationPin}">
          <span class="${styles.userLocationPulse}"></span>
          <span class="${styles.userLocationDot}"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const userMarker = L.marker([miUbicacion.lat, miUbicacion.lng], {
      icon: userIcon,
      zIndexOffset: 600,
    }).addTo(userLayer);

    userMarker.bindTooltip(
      `<div class="${styles.userLocationLabel}"><i class="bx bx-current-location"></i><span>Mi ubicación actual</span></div>`,
      {
        direction: 'top',
        offset: [0, -10],
        opacity: 1,
        className: 'ruta-client-tooltip',
      }
    );

    userMarker.on('click', (ev) => {
      L.DomEvent.stopPropagation(ev);
      if (lastPointerTypeRef.current === 'mouse') {
        zoomMaxToLocation(miUbicacion.lat, miUbicacion.lng);
      } else {
        userMarker.openTooltip();
      }
    });
  }, [miUbicacion, zoomMaxToLocation]);

  const handleGoToMyLocation = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    closeActiveCard();

    if (miUbicacion) {
      map.flyTo([miUbicacion.lat, miUbicacion.lng], Math.max(map.getZoom(), 17), {
        animate: true,
        duration: 0.55,
      });
    }

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;

    if (!miUbicacion) {
      setIsLocatingUser(true);
    }

    const onFound = (pos) => {
      setIsLocatingUser(false);
      const lat = Number(pos.coords.latitude);
      const lng = Number(pos.coords.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setMiUbicacion({ lat, lng });
        if (!miUbicacion && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, {
            animate: true,
            duration: 0.55,
          });
        }
      }
    };

    navigator.geolocation.getCurrentPosition(
      onFound,
      () => {
        navigator.geolocation.getCurrentPosition(
          onFound,
          () => setIsLocatingUser(false),
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const resolveCurrentOrigin = () =>
    new Promise((resolve) => {
      if (miUbicacion && !Number.isNaN(miUbicacion.lat) && !Number.isNaN(miUbicacion.lng)) {
        resolve({ lat: miUbicacion.lat, lng: miUbicacion.lng });
        return;
      }

      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        resolve(null);
        return;
      }

      const handleSuccess = (pos) => {
        const lat = Number(pos?.coords?.latitude);
        const lng = Number(pos?.coords?.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          const coords = { lat, lng };
          setMiUbicacion(coords);
          resolve(coords);
        } else {
          resolve(null);
        }
      };

      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        () => {
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            () => resolve(null),
            { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
          );
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    });

  const handleToggleRoute = async () => {
    if (isGeneratingRoute) return;

    if (rutaActiva) {
      if (routeLayerRef.current) {
        routeLayerRef.current.clearLayers();
      }
      setRutaActiva(false);
      return;
    }

    if (clientesConUbicacion.length === 0) {
      showWarning(
        'Sin puntos de venta',
        'No existen clientes con ubicación registrada para trazar la ruta.'
      );
      return;
    }

    if (clientesPendientesConUbicacion.length === 0) {
      showWarning(
        'Sin puntos pendientes',
        isTodaySelected
          ? 'Ya se realizó venta hoy a todos los clientes con ubicación registrada.'
          : 'Ya se realizó venta en esta fecha a todos los clientes con ubicación registrada.'
      );
      return;
    }

    setIsGeneratingRoute(true);

    try {
      const originCoords = await resolveCurrentOrigin();
      if (!originCoords) {
        showWarning(
          'Ubicación actual requerida',
          'Activa el permiso de ubicación para generar la ruta desde tu punto actual.'
        );
        return;
      }

      closeActiveCard();

      const orderedStops = buildOptimalVisitOrder(originCoords, clientesPendientesConUbicacion);
      const roadLatLngs = await fetchCompleteRoadRoute([originCoords, ...orderedStops]);

      const map = mapInstanceRef.current;
      const routeLayer = routeLayerRef.current;
      if (!map || !routeLayer || roadLatLngs.length < 2) return;

      routeLayer.clearLayers();

      const routeBounds = L.latLngBounds(roadLatLngs);
      const currentMaxBounds = map.options.maxBounds;
      if (
        currentMaxBounds &&
        (!currentMaxBounds.contains(routeBounds.getSouthWest()) ||
          !currentMaxBounds.contains(routeBounds.getNorthEast()))
      ) {
        const extended = L.latLngBounds(
          currentMaxBounds.getSouthWest(),
          currentMaxBounds.getNorthEast()
        );
        extended.extend(routeBounds);
        map.setMaxBounds(extended.pad(0.08));
      }

      L.polyline(roadLatLngs, {
        color: '#ffffff',
        weight: 8,
        opacity: 0.94,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(routeLayer);

      L.polyline(roadLatLngs, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(routeLayer);

      L.polyline(roadLatLngs, {
        color: '#dbeafe',
        weight: 2,
        opacity: 0.85,
        dashArray: '6, 10',
        lineCap: 'round',
        interactive: false,
      }).addTo(routeLayer);

      orderedStops.forEach((stop, idx) => {
        const stopBadgeIcon = L.divIcon({
          className: 'ruta-stop-order-wrapper',
          html: `<span class="${styles.routeStopBadge}">${idx + 1}</span>`,
          iconSize: [20, 20],
          iconAnchor: [-6, 38],
        });
        L.marker([stop.lat, stop.lng], {
          icon: stopBadgeIcon,
          interactive: false,
          zIndexOffset: 350,
        }).addTo(routeLayer);
      });

      map.flyToBounds(routeBounds, {
        paddingTopLeft: [56, 82],
        paddingBottomRight: [50, 68],
        maxZoom: 16.5,
        duration: 0.6,
      });

      setRutaActiva(true);
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn(0.6);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut(0.6);
  };

  const handleResetZoom = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    closeActiveCard();

    const points = [
      ...clientesConUbicacion
        .filter((c) => {
          const tuvoVenta = clientesConVenta.has(String(c.id));
          return tuvoVenta ? showVendidos : showNoVendidos;
        })
        .map((c) => [c.lat, c.lng]),
      ...(showSinCliente ? ventasSinClienteConUbicacion.map((v) => [v.lat, v.lng]) : []),
    ];

    if (points.length > 0) {
      if (rutaActiva && miUbicacion) {
        points.push([miUbicacion.lat, miUbicacion.lng]);
      }
      const pinsBounds = L.latLngBounds(points);
      map.flyToBounds(pinsBounds, {
        paddingTopLeft: [52, 98],
        paddingBottomRight: [48, 64],
        maxZoom: 16.5,
        duration: 0.45,
      });
    } else if (miUbicacion) {
      map.flyTo([miUbicacion.lat, miUbicacion.lng], 16, {
        animate: true,
        duration: 0.45,
      });
    } else {
      map.flyToBounds(BOLIVIA_BOUNDS, {
        padding: [18, 18],
        duration: 0.4,
      });
    }
  };

  const stopControlPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <NavBar />
      <div className={layoutStyles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={layoutStyles.contentArea}>
          <div className={styles.rutaWrapper}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className={layoutStyles.title} style={{ margin: 0 }}>Ruta Comercial</h1>
            </div>

            <div
              className={styles.mapContainer}
              ref={mapContainerRef}
              onPointerDownCapture={(e) => {
                if (e.pointerType) {
                  lastPointerTypeRef.current = e.pointerType === 'mouse' ? 'mouse' : 'touch';
                }
              }}
              style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            >
              <div
                ref={mapElementRef}
                className={styles.leafletMap}
                style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
              />

              <div className={styles.topOverlaysBar}>
                <div
                  className={styles.statsOverlay}
                  onPointerDown={stopControlPropagation}
                  onMouseDown={stopControlPropagation}
                  onTouchStart={stopControlPropagation}
                  onDoubleClick={stopControlPropagation}
                  onWheel={stopControlPropagation}
                >
                  <div
                    className={styles.statBox}
                    title={`${clientesVendidos} de ${totalClientes} clientes con venta${isTodaySelected ? ' hoy' : ` el ${dateLiteralAbbr || selectedDate}`}`}
                  >
                    <div className={styles.statIconWrap}>
                      <i className="bx bx-group"></i>
                    </div>
                    <div className={styles.statContent}>
                      <span className={styles.statValue}>{totalClientes}</span>
                      <span className={styles.statLabel}>Clientes</span>
                    </div>
                  </div>

                  <div className={styles.statDivider} />

                  <div
                    className={styles.statBox}
                    title={`${clientesVendidos} de ${totalClientes} clientes con venta${isTodaySelected ? ' hoy' : ` el ${dateLiteralAbbr || selectedDate}`}`}
                  >
                    <div className={`${styles.statIconWrap} ${styles.statIconPrimary}`}>
                      <i className="bx bx-shopping-bag"></i>
                    </div>
                    <div className={styles.statContent}>
                      <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
                        {porcentajeVentas}
                      </span>
                      <span className={styles.statLabel}>
                        {isTodaySelected ? 'Vendido hoy' : 'Vendido'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.statDivider} />

                  <BotonIcon
                    iconName={rutaActiva ? 'x' : 'trip'}
                    className={rutaActiva ? 'btn-error' : 'btn-primary'}
                    loading={isGeneratingRoute}
                    tooltip={rutaActiva ? 'Ocultar ruta' : 'Generar ruta'}
                    tooltipPosition="bottom"
                    tooltipAlign="end"
                    onClick={handleToggleRoute}
                    style={{
                      width: '30px',
                      height: '30px',
                      marginBottom: 0,
                      borderRadius: '7px',
                    }}
                  />
                </div>

                <div
                  className={styles.filterOverlay}
                  onPointerDown={stopControlPropagation}
                  onMouseDown={stopControlPropagation}
                  onTouchStart={stopControlPropagation}
                  onDoubleClick={stopControlPropagation}
                  onWheel={stopControlPropagation}
                >
                  <label className={styles.filterCheckLabel}>
                    <input
                      type="checkbox"
                      className={styles.filterCheckInput}
                      checked={showVendidos}
                      onChange={(e) => setShowVendidos(e.target.checked)}
                    />
                    <span className={`${styles.filterCheckBox} ${styles.filterCheckPrimary}`}>
                      <i className={`bx bx-check ${styles.filterCheckIcon}`} />
                    </span>
                    <span>Vendidos</span>
                  </label>

                  <label className={styles.filterCheckLabel}>
                    <input
                      type="checkbox"
                      className={styles.filterCheckInput}
                      checked={showNoVendidos}
                      onChange={(e) => setShowNoVendidos(e.target.checked)}
                    />
                    <span className={`${styles.filterCheckBox} ${styles.filterCheckGray}`}>
                      <i className={`bx bx-check ${styles.filterCheckIcon}`} />
                    </span>
                    <span>No vendidos</span>
                  </label>

                  <label className={styles.filterCheckLabel}>
                    <input
                      type="checkbox"
                      className={styles.filterCheckInput}
                      checked={showSinCliente}
                      onChange={(e) => setShowSinCliente(e.target.checked)}
                    />
                    <span className={`${styles.filterCheckBox} ${styles.filterCheckOrange}`}>
                      <i className={`bx bx-check ${styles.filterCheckIcon}`} />
                    </span>
                    <span>Sin cliente</span>
                  </label>
                </div>

                <button
                  type="button"
                  className={`${styles.dateOverlayBtn} ${!isTodaySelected ? styles.dateOverlayBtnCustom : ''}`}
                  onClick={() => setIsCalendarOpen(true)}
                  onPointerDown={stopControlPropagation}
                  onMouseDown={stopControlPropagation}
                  onTouchStart={stopControlPropagation}
                  onDoubleClick={stopControlPropagation}
                  onWheel={stopControlPropagation}
                  title="Seleccionar fecha"
                >
                  <div className={`${styles.statIconWrap} ${!isTodaySelected ? styles.statIconPrimary : ''}`}>
                    <i className={`bx ${isLoadingVentas ? 'bx-loader-alt bx-spin' : 'bx-calendar'}`} />
                  </div>
                  <span className={styles.dateOverlayText}>{dateButtonLabel}</span>
                  <i className={`bx bx-chevron-down ${styles.dateOverlayChevron}`} />
                </button>
              </div>

              <div
                className={styles.zoomControls}
                onPointerDown={stopControlPropagation}
                onMouseDown={stopControlPropagation}
                onTouchStart={stopControlPropagation}
                onDoubleClick={stopControlPropagation}
                onWheel={stopControlPropagation}
              >
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
                  {zoomPercent}%
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
                  title="Centrar ubicaciones"
                >
                  <i className="bx bx-target-lock"></i>
                </button>
                <button
                  type="button"
                  className={styles.zoomBtn}
                  onClick={handleGoToMyLocation}
                  title="Mi ubicación actual"
                >
                  <i className={`bx ${isLocatingUser ? 'bx-loader-alt bx-spin' : 'bx-current-location'}`}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={(val) => {
          if (val) setSelectedDate(val);
        }}
      />

      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default RutaComercial;
