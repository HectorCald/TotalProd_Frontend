import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import InputSearch from '../../../../components/common/inputs/InputSearch';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import { useToast } from '../../../../context/ToastContext';
import apiClient from '../../../../config/apiClient';
import styles from './SeleccionarUbicacionModal.module.css';

const BOLIVIA_BOUNDS = L.latLngBounds(
  [-23.15, -69.95],
  [-9.55, -57.35]
);

const DEFAULT_SUGGESTIONS = [
  {
    id: 'bo-scz',
    label: 'Plaza 24 de Septiembre - Centro, Santa Cruz de la Sierra, Bolivia',
    searchTerms: 'Santa Cruz de la Sierra Plaza 24 de Septiembre Centro Bolivia',
    lat: -17.7833,
    lng: -63.1821,
    description_location: 'Plaza 24 de Septiembre - Centro, Santa Cruz de la Sierra, Bolivia',
  },
  {
    id: 'bo-lpz',
    label: 'Av. Mariscal Santa Cruz - Centro, La Paz, Bolivia',
    searchTerms: 'La Paz Avenida Mariscal Santa Cruz Centro Sopocachi Bolivia',
    lat: -16.4980,
    lng: -68.1345,
    description_location: 'Av. Mariscal Santa Cruz - Centro, La Paz, Bolivia',
  },
  {
    id: 'bo-cbba',
    label: 'Plaza 14 de Septiembre - Cercado, Cochabamba, Bolivia',
    searchTerms: 'Cochabamba Plaza 14 de Septiembre Cercado Bolivia',
    lat: -17.3936,
    lng: -66.1570,
    description_location: 'Plaza 14 de Septiembre - Cercado, Cochabamba, Bolivia',
  },
  {
    id: 'bo-elalto',
    label: 'Av. 6 de Marzo - Ceja, El Alto, Bolivia',
    searchTerms: 'El Alto Avenida 6 de Marzo Ceja La Paz Bolivia',
    lat: -16.5047,
    lng: -68.1633,
    description_location: 'Av. 6 de Marzo - Ceja, El Alto, Bolivia',
  },
  {
    id: 'bo-sucre',
    label: 'Plaza 25 de Mayo - Centro Histórico, Sucre, Bolivia',
    searchTerms: 'Sucre Chuquisaca Plaza 25 de Mayo Bolivia',
    lat: -19.0478,
    lng: -65.2596,
    description_location: 'Plaza 25 de Mayo - Centro Histórico, Sucre, Bolivia',
  },
  {
    id: 'bo-tarija',
    label: 'Plaza Luis de Fuentes - Centro, Tarija, Bolivia',
    searchTerms: 'Tarija Plaza Luis de Fuentes Bolivia',
    lat: -21.5339,
    lng: -64.7341,
    description_location: 'Plaza Luis de Fuentes - Centro, Tarija, Bolivia',
  },
];

const cleanSegment = (str) =>
  str ? String(str).replace(/,/g, ' - ').replace(/\s+/g, ' ').trim() : '';

const dedupeSegments = (arr) => {
  const seen = new Set();
  const out = [];
  arr.forEach((item) => {
    const cleaned = cleanSegment(item);
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(cleaned);
    }
  });
  return out;
};

// Construye siempre "Dirección, Ciudad, País" desde datos de Nominatim
export const formatFromNominatim = (address = {}, displayName = '') => {
  const pais = cleanSegment(address.country) || 'Bolivia';

  const ciudadCandidate =
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.hamlet ||
    address.county ||
    address.state ||
    '';
  const ciudad = cleanSegment(ciudadCandidate) || 'Bolivia';

  const street = [
    address.road || address.pedestrian || address.footway || address.path || address.highway,
    address.house_number,
  ]
    .filter(Boolean)
    .join(' ');

  const poi =
    address.amenity ||
    address.shop ||
    address.building ||
    address.office ||
    address.tourism ||
    address.leisure ||
    address.historic ||
    '';

  const zone =
    address.neighbourhood ||
    address.suburb ||
    address.quarter ||
    address.city_district ||
    address.residential ||
    address.commercial ||
    address.industrial ||
    address.locality ||
    '';

  let dirParts = dedupeSegments([poi, street, zone]).filter(
    (p) => p.toLowerCase() !== ciudad.toLowerCase() && p.toLowerCase() !== pais.toLowerCase()
  );

  // Si es zona rural sin calle directa, usar segmentos descriptivos de display_name o provincia/departamento
  if (dirParts.length === 0 && displayName) {
    const chunks = String(displayName)
      .split(',')
      .map(cleanSegment)
      .filter(
        (c) =>
          c &&
          c.toLowerCase() !== ciudad.toLowerCase() &&
          c.toLowerCase() !== pais.toLowerCase() &&
          !/^\d{4,6}$/.test(c)
      );
    if (chunks.length > 0) {
      dirParts = chunks.slice(0, 2);
    }
  }

  if (dirParts.length === 0) {
    const secondary = cleanSegment(address.county || address.state_district || address.state);
    if (secondary && secondary.toLowerCase() !== ciudad.toLowerCase()) {
      dirParts = [`Zona ${ciudad}`, secondary];
    } else {
      dirParts = [`Zona ${ciudad}`];
    }
  }

  const direccion = dirParts.join(' - ');
  return `${direccion}, ${ciudad}, ${pais}`;
};

// Construye siempre "Dirección, Ciudad, País" desde datos de Photon (Komoot OpenStreetMap)
const formatFromPhoton = (props = {}) => {
  const pais = cleanSegment(props.country) || 'Bolivia';
  const ciudad =
    cleanSegment(props.city || props.town || props.locality || props.county || props.state) ||
    'Bolivia';

  const street = [props.street, props.housenumber].filter(Boolean).join(' ');
  const name = props.name || '';
  const district = props.district || props.suburb || '';

  let dirParts = dedupeSegments([name, street, district]).filter(
    (p) => p.toLowerCase() !== ciudad.toLowerCase() && p.toLowerCase() !== pais.toLowerCase()
  );

  if (dirParts.length === 0) {
    const extra = cleanSegment(props.county || props.state);
    if (extra && extra.toLowerCase() !== ciudad.toLowerCase()) {
      dirParts = [ciudad, extra];
    } else {
      dirParts = [`Zona ${ciudad}`];
    }
  }

  const direccion = dirParts.join(' - ');
  return `${direccion}, ${ciudad}, ${pais}`;
};

// Construye siempre "Dirección, Ciudad, País" desde BigDataCloud (respaldo rural/urbano)
const formatFromBigDataCloud = (data = {}) => {
  const pais = cleanSegment(data.countryName) || 'Bolivia';
  const ciudad =
    cleanSegment(data.city || data.locality || data.principalSubdivision) || 'Bolivia';

  const adminNames = (data.localityInfo?.informative || [])
    .concat(data.localityInfo?.administrative || [])
    .map((x) => cleanSegment(x?.name))
    .filter(
      (n) =>
        n &&
        n.toLowerCase() !== ciudad.toLowerCase() &&
        n.toLowerCase() !== pais.toLowerCase() &&
        !n.toLowerCase().includes('américa') &&
        !n.toLowerCase().includes('bolivia')
    );

  const dirParts = dedupeSegments([
    data.locality !== ciudad ? data.locality : '',
    adminNames[0] || '',
    data.principalSubdivision !== ciudad ? data.principalSubdivision : '',
  ]);

  const direccion = dirParts.length > 0 ? dirParts.slice(0, 2).join(' - ') : `Zona ${ciudad}`;
  return `${direccion}, ${ciudad}, ${pais}`;
};

const parseInitialCoords = (loc) => {
  if (!loc) return null;
  if (typeof loc === 'object') {
    const lat = Number(loc.x ?? loc.lat);
    const lng = Number(loc.y ?? loc.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
    return null;
  }
  const clean = String(loc).trim().replace(/[()]/g, '');
  const parts = clean.split(',').map((p) => Number(p.trim()));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
};

// Geocodificación inversa multicapa (Backend Nominatim -> Nominatim directo zoom 18 -> Photon OSM -> BigDataCloud)
export const reverseGeocodeBolivia = async (lat, lng, signal) => {
  // 1. Intentar proxy del backend (con User-Agent oficial de servidor)
  try {
    const backendRes = await apiClient.request(
      `/clients/geocode/reverse?lat=${lat}&lng=${lng}`,
      { method: 'GET', signal },
      false
    );
    if (backendRes && backendRes.ok) {
      const json = await backendRes.json();
      if (json?.success && json?.data && (json.data.address || json.data.display_name)) {
        return formatFromNominatim(json.data.address, json.data.display_name);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // 2. Intentar Photon Reverse (OpenStreetMap rápido con soporte CORS completo y sin bloqueo de localhost)
  try {
    const photonRes = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&distance_sort=true&radius=2`,
      { signal }
    );
    if (photonRes.ok) {
      const photonData = await photonRes.json();
      const firstFeature = photonData?.features?.[0];
      if (firstFeature?.properties) {
        return formatFromPhoton(firstFeature.properties);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  // 3. Intentar Nominatim directo con zoom=18 (detalle a nivel calle/avenida)
  try {
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`,
      { signal }
    );
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (nomData && (nomData.address || nomData.display_name)) {
        return formatFromNominatim(nomData.address, nomData.display_name);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  // 4. Respaldo garantizado BigDataCloud (funciona incluso en zonas rurales sin calles cercanas)
  const bdcRes = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
    { signal }
  );
  if (bdcRes.ok) {
    const bdcData = await bdcRes.json();
    return formatFromBigDataCloud(bdcData);
  }

  throw new Error('No se pudo resolver la dirección');
};

// Búsqueda multicapa en Bolivia (Photon OpenStreetMap autocompletado instantáneo -> Backend Nominatim -> Nominatim directo)
const searchPlacesInBolivia = async (query, signal) => {
  const encoded = encodeURIComponent(query);

  // 1. Photon Komoot (motor de autocompletado OpenStreetMap con bbox de Bolivia, CORS * y sin rate-limit de 1 req/s)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encoded}&lat=-16.5&lon=-64.5&bbox=-69.95,-23.15,-57.35,-9.55&limit=8`;
    const photonRes = await fetch(photonUrl, { signal });
    if (photonRes.ok) {
      const photonJson = await photonRes.json();
      const features = photonJson?.features || [];
      if (features.length > 0) {
        const usedLabels = new Set();
        return features
          .map((f, idx) => {
            const coords = f.geometry?.coordinates;
            if (!Array.isArray(coords) || coords.length < 2) return null;
            const lng = Number(Number(coords[0]).toFixed(6));
            const lat = Number(Number(coords[1]).toFixed(6));
            const structured = formatFromPhoton(f.properties);
            let uniqueLabel = structured;
            if (usedLabels.has(uniqueLabel)) {
              uniqueLabel = `${structured} (${idx + 1})`;
            }
            usedLabels.add(uniqueLabel);
            return {
              id: `ph-${f.properties?.osm_id || idx}-${lat}-${lng}`,
              label: uniqueLabel,
              searchTerms: `${query} ${uniqueLabel} ${f.properties?.name || ''} ${f.properties?.street || ''} ${f.properties?.city || ''}`,
              lat,
              lng,
              description_location: structured,
            };
          })
          .filter(Boolean);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  // 2. Proxy Backend Nominatim
  try {
    const backendRes = await apiClient.request(
      `/clients/geocode/search?q=${encoded}`,
      { method: 'GET', signal },
      false
    );
    if (backendRes && backendRes.ok) {
      const json = await backendRes.json();
      if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
        const usedLabels = new Set();
        return json.data.map((item, idx) => {
          const lat = Number(Number(item.lat).toFixed(6));
          const lng = Number(Number(item.lon).toFixed(6));
          const structured = formatFromNominatim(item.address, item.display_name);
          let uniqueLabel = structured;
          if (usedLabels.has(uniqueLabel)) {
            uniqueLabel = `${structured} (${idx + 1})`;
          }
          usedLabels.add(uniqueLabel);
          return {
            id: `bn-${item.place_id || idx}`,
            label: uniqueLabel,
            searchTerms: `${query} ${uniqueLabel} ${item.display_name || ''}`,
            lat,
            lng,
            description_location: structured,
          };
        });
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  // 3. Nominatim directo
  const nomRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=bo&limit=8&accept-language=es&q=${encoded}`,
    { signal }
  );
  if (nomRes.ok) {
    const results = await nomRes.json();
    if (Array.isArray(results)) {
      const usedLabels = new Set();
      return results.map((item, idx) => {
        const lat = Number(Number(item.lat).toFixed(6));
        const lng = Number(Number(item.lon).toFixed(6));
        const structured = formatFromNominatim(item.address, item.display_name);
        let uniqueLabel = structured;
        if (usedLabels.has(uniqueLabel)) {
          uniqueLabel = `${structured} (${idx + 1})`;
        }
        usedLabels.add(uniqueLabel);
        return {
          id: `nm-${item.place_id || idx}`,
          label: uniqueLabel,
          searchTerms: `${query} ${uniqueLabel} ${item.display_name || ''}`,
          lat,
          lng,
          description_location: structured,
        };
      });
    }
  }

  return [];
};

const SeleccionarUbicacionModal = ({
  isOpen,
  onClose,
  initialLocation = '',
  initialDescription = '',
  onSelectLocation,
  readOnly = false,
  title,
}) => {
  const { showWarning, showDanger } = useToast();

  const mapViewportRef = useRef(null);
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const initialZoomRef = useRef(6);
  const reverseAbortRef = useRef(null);
  const selectedLabelRef = useRef('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOptions, setSearchOptions] = useState(DEFAULT_SUGGESTIONS);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isPanning, setIsPanning] = useState(false);

  const updateZoomIndicator = useCallback((map) => {
    const baseZoom = initialZoomRef.current || 6;
    const currentZoom = map.getZoom();
    const pct = Math.max(50, Math.round(100 + (currentZoom - baseZoom) * 25));
    setZoomPercent(pct);
  }, []);

  const createPinIcon = useCallback(() => {
    return L.divIcon({
      className: 'seleccion-ubicacion-marker-wrapper',
      html: `<div class="${styles.selectedPin}"><i class="bx bx-map-pin ${styles.selectedPinIcon}"></i></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });
  }, []);

  const placeOrMoveMarker = useCallback((map, lat, lng) => {
    const roundedLat = Number(Number(lat).toFixed(6));
    const roundedLng = Number(Number(lng).toFixed(6));

    // Si el punto cae ligeramente fuera del encuadre inicial, ampliar límites para permitir centrarlo
    if (!BOLIVIA_BOUNDS.contains([roundedLat, roundedLng])) {
      const expanded = L.latLngBounds(
        BOLIVIA_BOUNDS.getSouthWest(),
        BOLIVIA_BOUNDS.getNorthEast()
      ).extend([roundedLat, roundedLng]);
      map.setMaxBounds(expanded.pad(0.1));
    }

    if (!markerRef.current) {
      const marker = L.marker([roundedLat, roundedLng], {
        icon: createPinIcon(),
        draggable: !readOnly,
      }).addTo(map);

      if (!readOnly) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          handleMapCoordinatePick(pos.lat, pos.lng);
        });
      }

      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([roundedLat, roundedLng]);
    }

    setSelectedCoords({ lat: roundedLat, lng: roundedLng });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPinIcon, readOnly]);

  const handleMapCoordinatePick = useCallback(async (lat, lng, flyToZoom = null) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const roundedLat = Number(Number(lat).toFixed(6));
    const roundedLng = Number(Number(lng).toFixed(6));
    placeOrMoveMarker(map, roundedLat, roundedLng);

    if (flyToZoom) {
      map.flyTo([roundedLat, roundedLng], flyToZoom, { duration: 0.5 });
    }

    if (reverseAbortRef.current) {
      reverseAbortRef.current.abort();
    }
    const controller = new AbortController();
    reverseAbortRef.current = controller;

    setIsResolvingAddress(true);
    try {
      const formatted = await reverseGeocodeBolivia(roundedLat, roundedLng, controller.signal);
      setSelectedDescription(formatted);
      selectedLabelRef.current = formatted;

      const syntheticOption = {
        id: `picked-${roundedLat}-${roundedLng}`,
        label: formatted,
        searchTerms: formatted,
        lat: roundedLat,
        lng: roundedLng,
        description_location: formatted,
      };
      setSearchOptions((prev) => [
        syntheticOption,
        ...prev.filter((o) => o.label !== formatted),
      ]);
      setSearchQuery(formatted);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const fallback = 'Ubicación seleccionada, Bolivia, Bolivia';
        setSelectedDescription(fallback);
      }
    } finally {
      if (reverseAbortRef.current === controller) {
        setIsResolvingAddress(false);
      }
    }
  }, [placeOrMoveMarker]);

  // Obtener punto actual del usuario mediante GPS / Geolocalización del navegador
  const handleCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      showWarning('Ubicación no disponible', 'Tu navegador o dispositivo no soporta geolocalización');
      return;
    }

    setIsLocatingUser(true);

    const onSuccess = (position) => {
      setIsLocatingUser(false);
      const { latitude, longitude } = position.coords;
      handleMapCoordinatePick(latitude, longitude, 16);
    };

    const onFinalError = (err) => {
      setIsLocatingUser(false);
      if (err?.code === 1) {
        showWarning('Permiso denegado', 'Activa el permiso de ubicación en tu navegador para usar tu punto actual');
      } else {
        showDanger('Error de ubicación', 'No se pudo obtener tu ubicación actual');
      }
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        // Reintento rápido sin alta precisión (útil en PC con Wi-Fi)
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onFinalError,
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  // Inicializar estado al abrir el modal
  useEffect(() => {
    if (!isOpen) {
      if (reverseAbortRef.current) {
        reverseAbortRef.current.abort();
      }
      setIsLocatingUser(false);
      return;
    }

    const parsed = parseInitialCoords(initialLocation);
    if (parsed) {
      setSelectedCoords(parsed);
      if (initialDescription) {
        setSelectedDescription(initialDescription);
        selectedLabelRef.current = initialDescription;
        setSearchQuery(initialDescription);
        setSearchOptions([
          {
            id: `init-${parsed.lat}-${parsed.lng}`,
            label: initialDescription,
            searchTerms: initialDescription,
            lat: parsed.lat,
            lng: parsed.lng,
            description_location: initialDescription,
          },
          ...DEFAULT_SUGGESTIONS,
        ]);
      } else {
        setSelectedDescription('');
        selectedLabelRef.current = '';
        setSearchQuery('');
        setSearchOptions(DEFAULT_SUGGESTIONS);
      }
    } else {
      setSelectedCoords(null);
      setSelectedDescription('');
      selectedLabelRef.current = '';
      setSearchQuery('');
      setSearchOptions(DEFAULT_SUGGESTIONS);
    }
  }, [isOpen, initialLocation, initialDescription]);

  // Búsqueda con debounce para el buscador InputSearch (sin searchOptions en dependencias para no cancelar peticiones)
  useEffect(() => {
    if (!isOpen) return;
    const q = (searchQuery || '').trim();

    if (!q) {
      setSearchOptions(DEFAULT_SUGGESTIONS);
      return;
    }

    if (q.length < 2) return;
    if (q === selectedLabelRef.current) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlacesInBolivia(q, controller.signal);
        if (results.length > 0) {
          setSearchOptions(results);
        }
      } catch (_) {
        // Ignorar cancelación por escritura continua
      }
    }, 260);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, searchQuery]);

  // Montar mapa Leaflet al abrir el modal
  useEffect(() => {
    if (!isOpen) return;
    const mapEl = mapElementRef.current;
    if (!mapEl || mapInstanceRef.current) return;

    const map = L.map(mapEl, {
      center: [-16.45, -64.45],
      zoom: 6,
      minZoom: 5,
      maxZoom: 19,
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

    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxNativeZoom: 19,
      maxZoom: 19,
    }).addTo(map);

    map.fitBounds(BOLIVIA_BOUNDS, { padding: [14, 14], animate: false });
    const fittedZoom = map.getZoom();
    initialZoomRef.current = fittedZoom;
    map.setMinZoom(Math.max(4.6, fittedZoom - 0.3));
    setZoomPercent(100);

    const parsedInit = parseInitialCoords(initialLocation);
    if (parsedInit) {
      placeOrMoveMarker(map, parsedInit.lat, parsedInit.lng);
      map.setView([parsedInit.lat, parsedInit.lng], readOnly ? 19 : 15, { animate: false });
      updateZoomIndicator(map);
      if (!initialDescription) {
        handleMapCoordinatePick(parsedInit.lat, parsedInit.lng);
      }
    }

    if (!readOnly) {
      map.on('click', (e) => {
        handleMapCoordinatePick(e.latlng.lat, e.latlng.lng);
      });
    }

    map.on('zoom', () => updateZoomIndicator(map));
    map.on('zoomend', () => updateZoomIndicator(map));
    map.on('dragstart', () => setIsPanning(true));
    map.on('dragend', () => setIsPanning(false));

    const t1 = setTimeout(() => {
      map.invalidateSize({ animate: false });
      if (readOnly && parsedInit) {
        map.setView([parsedInit.lat, parsedInit.lng], 19, { animate: false });
      }
    }, 100);
    const t2 = setTimeout(() => {
      map.invalidateSize({ animate: false });
      if (readOnly && parsedInit) {
        map.setView([parsedInit.lat, parsedInit.lng], 19, { animate: false });
      }
    }, 350);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && mapViewportRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize({ animate: false });
      });
      resizeObserver.observe(mapViewportRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      markerRef.current = null;
      map.remove();
      mapInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSelectSearchOption = (opt) => {
    if (!opt || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const desc = opt.description_location || opt.label;
    selectedLabelRef.current = opt.label;
    placeOrMoveMarker(map, opt.lat, opt.lng);
    setSelectedDescription(desc);
    map.flyTo([opt.lat, opt.lng], 16, { duration: 0.45 });
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
    if (!mapInstanceRef.current) return;
    if (selectedCoords) {
      mapInstanceRef.current.flyTo([selectedCoords.lat, selectedCoords.lng], readOnly ? 19 : 15, { duration: 0.4 });
    } else {
      mapInstanceRef.current.flyToBounds(BOLIVIA_BOUNDS, { padding: [14, 14], duration: 0.4 });
    }
  };

  const stopControlPropagation = (e) => {
    e.stopPropagation();
  };

  const handleConfirm = () => {
    if (!selectedCoords) return;
    const coordString = `(${selectedCoords.lat},${selectedCoords.lng})`;
    const finalDescription =
      selectedDescription || 'Ubicación seleccionada, Bolivia, Bolivia';

    if (onSelectLocation) {
      onSelectLocation({
        location: coordString,
        description_location: finalDescription,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
      });
    }
    onClose();
  };

  return (
    <ModalCentro
      isOpen={isOpen}
      onClose={onClose}
      title={title || (readOnly ? 'Ubicación de Venta' : 'Seleccionar Ubicación')}
      mensaje={readOnly ? undefined : 'Busca una dirección, usa tu ubicación actual o toca un punto en el mapa.'}
      confirmText="Seleccionar"
      onConfirm={handleConfirm}
      confirmDisabled={!selectedCoords || isResolvingAddress}
      hideFooter={readOnly}
      width="650px"
      contentStyle={readOnly ? { paddingTop: '12px', paddingBottom: '22px' } : { paddingBlock: '8px' }}
    >
      <div className={styles.modalBody}>
        {!readOnly && (
          <div className={styles.searchRow}>
            <div className={styles.searchInputBox}>
              <InputSearch
                value={searchQuery}
                onChange={(e) => {
                  selectedLabelRef.current = '';
                  setSearchQuery(e.target.value);
                }}
                onSelect={handleSelectSearchOption}
                placeholder="Buscar calle, avenida, zona o ciudad..."
                options={searchOptions}
                mostrarCampo="label"
                buscarCampo="searchTerms"
                minChars={2}
                maxOptions={8}
              />
            </div>

            <BotonIcon
              iconName="current-location"
              className="btn-primary"
              loading={isLocatingUser}
              tooltip="Mi ubicación actual"
              tooltipAlign="end"
              onClick={handleCurrentLocation}
              style={{
                height: '40px',
                width: '40px',
                flexShrink: 0,
              }}
            />
          </div>
        )}

        <div
          className={styles.mapViewport}
          ref={mapViewportRef}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <div
            ref={mapElementRef}
            className={styles.leafletMap}
            style={{ cursor: isPanning ? 'grabbing' : (readOnly ? 'grab' : 'crosshair') }}
          />

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
              title="Restablecer vista"
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
              title="Centrar ubicación"
            >
              <i className="bx bx-target-lock"></i>
            </button>
          </div>
        </div>

        <div className={styles.selectedInfoBox}>
          <i className={`bx ${isResolvingAddress ? 'bx-loader-alt bx-spin' : 'bx-map'} ${styles.selectedInfoIcon}`}></i>
          <div className={styles.selectedInfoText}>
            {selectedCoords ? (
              <>
                <span className={styles.selectedPlaceName}>
                  {isResolvingAddress ? 'Obteniendo calle, ciudad y país...' : selectedDescription}
                </span>
                <span className={styles.selectedCoordsHint}>
                  Coordenadas: {selectedCoords.lat}, {selectedCoords.lng}
                </span>
              </>
            ) : (
              <span className={styles.selectedCoordsHint}>
                Ninguna ubicación marcada aún. Usa "Mi punto actual", busca una calle o haz clic en el mapa.
              </span>
            )}
          </div>
        </div>
      </div>
    </ModalCentro>
  );
};

export default SeleccionarUbicacionModal;
