import React, { useState, useEffect, useRef } from 'react';
import styles from './MapaModal.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputSugerencias from '../../common/InputSugerencias';
import LoadingSpinner from '../../common/LoadingSpinner';
import Notification from '../../common/Notification';
import Dato from '../../common/Dato';

// Estilos de mapa para tema oscuro
const darkMapStyles = [
    {
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#212121"
            }
        ]
    },
    {
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#212121"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#757575"
            }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "administrative.land_parcel",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#181818"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#1b1b1b"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#2a2a2a"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#2d2d2d"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#3c3c3c"
            }
        ]
    },
    {
        "featureType": "road.highway.controlled_access",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#4e4e4e"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#4a4a4a"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    }
];

const MapaModal = ({ isOpen, setIsOpen, onLocationSelect, initialLocation, readOnly = false, title = "Seleccionar Ubicación" }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [geocoder, setGeocoder] = useState(null);
    const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
    const [sugerenciasBusqueda, setSugerenciasBusqueda] = useState([]);
    const [loadingBusqueda, setLoadingBusqueda] = useState(false);
    const mapRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [initialLocationSet, setInitialLocationSet] = useState(false);

    // Estado para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 5000);
    };

    // Función para obtener el tema actual
    const getCurrentTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'light' ? 'light' : 'dark';
    };

    // Función para obtener los estilos del mapa según el tema
    const getMapStyles = () => {
        const theme = getCurrentTheme();
        return theme === 'dark' ? darkMapStyles : null; // null = colores originales de Google
    };

    // Inicializar el mapa cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            // Resetear estado
            setIsGoogleMapsLoaded(false);
            setLoading(true);

            // Timeout de seguridad para evitar loading infinito
            const safetyTimeout = setTimeout(() => {
                setLoading(false);
            }, 10000); // 10 segundos máximo

            // Esperar a que Google Maps esté disponible
            const checkGoogleMaps = () => {
                if (window.google && window.google.maps && window.google.maps.Map && window.googleMapsLoaded) {
                    clearTimeout(safetyTimeout); // Limpiar timeout de seguridad
                    setIsGoogleMapsLoaded(true);
                    // Pequeño delay para asegurar que el DOM esté listo
                    setTimeout(() => {
                        initializeMap();
                    }, 100);
                } else {
                    console.log('Esperando a que Google Maps se cargue...');
                    setTimeout(checkGoogleMaps, 200);
                }
            };
            checkGoogleMaps();

        }
    }, [isOpen]);

    // Inicializar Google Maps
    const initializeMap = () => {
        if (!mapRef.current) {
            return;
        }

        // Verificar que Google Maps esté disponible
        if (!window.google || !window.google.maps) {
            return;
        }

        // Si hay coordenadas iniciales, usarlas
        if (initialLocation && typeof initialLocation === 'string' && initialLocation.includes(',')) {
            const coordsMatch = initialLocation.match(/\(([^,]+),([^)]+)\)/);
            if (coordsMatch) {
                const firstValue = parseFloat(coordsMatch[1]);
                const secondValue = parseFloat(coordsMatch[2]);

                // Tu base de datos tiene formato (longitud, latitud), Google Maps necesita (latitud, longitud)
                let lat, lng;
                if (firstValue >= -90 && firstValue <= 90 && secondValue < -90) {
                    // Caso raro: primer valor es latitud válida, segundo es longitud muy negativa
                    lat = firstValue;
                    lng = secondValue;
                } else {
                    // Tu base de datos tiene (longitud, latitud), siempre intercambiar
                    lat = secondValue;  // El segundo valor es la latitud
                    lng = firstValue;   // El primer valor es la longitud
                }

                const initialCoords = { lat, lng };

                const mapInstance = new window.google.maps.Map(mapRef.current, {
                    center: initialCoords,
                    zoom: 15,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    panControl: false,
                    zoomControl: false,
                    scaleControl: false,
                    rotateControl: false,
                    clickableIcons: false,
                    disableDefaultUI: true,
                    gestureHandling: 'cooperative',
                    styles: getMapStyles()
                });

                // Delay para asegurar que Google Maps esté completamente cargado
                setTimeout(() => {
                    // Forzar el centro del mapa después de la inicialización
                    mapInstance.setCenter(initialCoords);
                    mapInstance.setZoom(15);

                    initializeMapComponents(mapInstance, initialCoords);

                    // Forzar posición del marcador después de inicializar componentes
                    setTimeout(() => {
                        if (marker) {
                            marker.setPosition(initialCoords);
                        }

                        // Hacer geocoding para obtener la dirección real de las coordenadas iniciales
                        const geocoderToUse = geocoder || new window.google.maps.Geocoder();
                        geocoderToUse.geocode({ location: initialCoords }, (results, status) => {
                            if (status === 'OK' && results[0]) {
                                const result = results[0];
                                const addressComponents = extractAddressComponents(result.formatted_address);
                                setSelectedLocation({
                                    lat: initialCoords.lat,
                                    lng: initialCoords.lng,
                                    address: result.formatted_address,
                                    placeId: result.place_id,
                                    ...addressComponents
                                });
                            } else {
                                // Si falla el geocoding, usar coordenadas como fallback
                                setSelectedLocation({
                                    lat: initialCoords.lat,
                                    lng: initialCoords.lng,
                                    address: `Ubicación: ${initialCoords.lat.toFixed(6)}, ${initialCoords.lng.toFixed(6)}`,
                                    placeId: null,
                                    direccion: `Ubicación: ${initialCoords.lat.toFixed(6)}, ${initialCoords.lng.toFixed(6)}`,
                                    ciudad: '',
                                    pais: ''
                                });
                            }
                        });
                    }, 1500);
                }, 1000);
                return;
            }
        }

        // Obtener ubicación actual del usuario si no hay coordenadas iniciales
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    const mapInstance = new window.google.maps.Map(mapRef.current, {
                        center: userLocation,
                        zoom: 15,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        panControl: false,
                        zoomControl: false,
                        scaleControl: false,
                        rotateControl: false,
                        clickableIcons: false,
                        disableDefaultUI: true,
                        gestureHandling: 'cooperative',
                        styles: getMapStyles()
                    });

                    initializeMapComponents(mapInstance, userLocation);
                },
                (error) => {
                    // Usar ubicación por defecto si falla la geolocalización
                    const defaultLocation = { lat: 19.4326, lng: -99.1332 };

                    const mapInstance = new window.google.maps.Map(mapRef.current, {
                        center: defaultLocation,
                        zoom: 13,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        panControl: false,
                        zoomControl: false,
                        scaleControl: false,
                        rotateControl: false,
                        clickableIcons: false,
                        disableDefaultUI: true,
                        gestureHandling: 'cooperative',
                        styles: getMapStyles()
                    });

                    initializeMapComponents(mapInstance, defaultLocation);
                }
            );
        } else {
            // Fallback si no hay geolocalización
            const defaultLocation = { lat: 19.4326, lng: -99.1332 };

            const mapInstance = new window.google.maps.Map(mapRef.current, {
                center: defaultLocation,
                zoom: 13,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                panControl: false,
                zoomControl: false,
                scaleControl: false,
                rotateControl: false,
                clickableIcons: false,
                disableDefaultUI: true,
                gestureHandling: 'cooperative',
                styles: getMapStyles()
            });

            initializeMapComponents(mapInstance, defaultLocation);
        }
    };

    // Inicializar componentes del mapa
    const initializeMapComponents = (mapInstance, initialPosition) => {
        // Crear geocoder
        const geocoderInstance = new window.google.maps.Geocoder();

        // Guardar el geocoder en el estado
        setGeocoder(geocoderInstance);

        // Usar Marker tradicional
        const markerInstance = new window.google.maps.Marker({
            position: initialPosition,
            map: mapInstance,
            draggable: true,
            title: 'Arrastra para seleccionar ubicación'
        });

        setMap(mapInstance);
        setMarker(markerInstance);

        // Forzar posición del marcador si tenemos coordenadas iniciales
        if (initialLocation) {
            setTimeout(() => {
                markerInstance.setPosition(initialPosition);
            }, 500);
        }

        // Evento cuando se arrastra el marcador
        markerInstance.addListener('dragend', () => {
            const position = markerInstance.getPosition();
            reverseGeocode(position);
        });

        // Evento cuando se hace click en el mapa
        mapInstance.addListener('click', (event) => {
            const position = event.latLng;
            markerInstance.setPosition(position);
            reverseGeocode(position);
        });

        // Configurar autocompletado del buscador - REMOVIDO
        // Ya no usamos el autocompletado de Google, usamos InputSugerencias

        // Seleccionar ubicación inicial automáticamente
        if (initialPosition) {
            // Asegurar que la posición sea válida
            const lat = typeof initialPosition.lat === 'function' ? initialPosition.lat() : initialPosition.lat;
            const lng = typeof initialPosition.lng === 'function' ? initialPosition.lng() : initialPosition.lng;

            // Solo hacer reverseGeocode si NO tenemos coordenadas iniciales específicas
            if (!initialLocation) {
                // Crear un objeto de posición válido para reverseGeocode
                const validPosition = {
                    lat: () => lat,
                    lng: () => lng
                };

                // Pequeño delay para asegurar que el mapa esté completamente cargado
                setTimeout(() => {
                    reverseGeocode(validPosition);
                    // Ocultar loading después de que todo esté listo
                    setLoading(false);
                }, 500);
            } else {
                // Ocultar loading de inmediato
                setLoading(false);
            }
        } else {
            // Si no hay posición inicial, ocultar loading de inmediato
            setLoading(false);
        }
    };

    // Geocodificación inversa para obtener dirección desde coordenadas
    const reverseGeocode = (position) => {
        // Asegurar que la posición sea válida
        let lat, lng;
        if (typeof position.lat === 'function') {
            lat = position.lat();
            lng = position.lng();
        } else {
            lat = position.lat;
            lng = position.lng;
        }

        if (!geocoder) {
            // Crear un nuevo geocoder si no está disponible
            const newGeocoder = new window.google.maps.Geocoder();
            setGeocoder(newGeocoder);

            newGeocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const result = results[0];
                    const addressComponents = extractAddressComponents(result.formatted_address);
                    setSelectedLocation({
                        lat: lat,
                        lng: lng,
                        address: result.formatted_address,
                        placeId: result.place_id,
                        ...addressComponents
                    });
                    if (!initialLocationSet) {
                        setInitialLocationSet(true);
                    }
                } else {
                    setSelectedLocation({
                        lat: lat,
                        lng: lng,
                        address: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                        placeId: null,
                        direccion: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                        ciudad: '',
                        pais: ''
                    });
                }
            });
            return;
        }

        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const result = results[0];
                const addressComponents = extractAddressComponents(result.formatted_address);
                setSelectedLocation({
                    lat: lat,
                    lng: lng,
                    address: result.formatted_address,
                    placeId: result.place_id,
                    ...addressComponents
                });
                if (!initialLocationSet) {
                    setInitialLocationSet(true);
                }
            } else {
                setSelectedLocation({
                    lat: lat,
                    lng: lng,
                    address: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    placeId: null,
                    direccion: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    ciudad: '',
                    pais: ''
                });
            }
        });
    };

    // Buscar sugerencias usando Google Geocoder
    const buscarSugerencias = async (query) => {
        if (!query || query.length < 2 || !geocoder) {
            setSugerenciasBusqueda([]);
            return;
        }

        console.log('Buscando sugerencias para:', query);
        setLoadingBusqueda(true);
        
        try {
            // Usar Places API para obtener sugerencias más precisas
            if (window.google && window.google.maps && window.google.maps.places) {
                const service = new window.google.maps.places.AutocompleteService();
                service.getPlacePredictions({
                    input: query,
                    types: ['geocode'] // Solo geocode para evitar conflictos
                }, (predictions, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                        const sugerencias = predictions.map(prediction => ({
                            id: prediction.place_id,
                            name: prediction.structured_formatting.main_text,
                            descripcion: prediction.structured_formatting.secondary_text || '',
                            placeId: prediction.place_id,
                            description: prediction.description
                        }));
                        console.log('Sugerencias Places API:', sugerencias);
                        setSugerenciasBusqueda(sugerencias);
                    } else {
                        setSugerenciasBusqueda([]);
                    }
                    setLoadingBusqueda(false);
                });
            } else {
                // Fallback usando Geocoder
                geocoder.geocode({ address: query }, (results, status) => {
                    if (status === 'OK' && results) {
                        const sugerencias = results.slice(0, 5).map(result => ({
                            id: result.place_id,
                            name: result.formatted_address.split(',')[0],
                            descripcion: result.formatted_address,
                            placeId: result.place_id,
                            description: result.formatted_address
                        }));
                        console.log('Sugerencias Geocoder:', sugerencias);
                        setSugerenciasBusqueda(sugerencias);
                    } else {
                        setSugerenciasBusqueda([]);
                    }
                    setLoadingBusqueda(false);
                });
            }
        } catch (error) {
            console.error('Error buscando sugerencias:', error);
            setSugerenciasBusqueda([]);
            setLoadingBusqueda(false);
        }
    };

    // Manejar cambio en el input de búsqueda
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        buscarSugerencias(value);
    };

    // Manejar selección de sugerencia
    const handleSugerenciaSelect = async (sugerencia) => {
        setSearchQuery(sugerencia.name);
        setSugerenciasBusqueda([]);
        
        if (!geocoder) {
            mostrarNotificacion('error', 'El servicio de búsqueda no está disponible.');
            return;
        }

        try {
            // Usar Places API para obtener detalles del lugar
            if (window.google && window.google.maps && window.google.maps.places && sugerencia.placeId) {
                const service = new window.google.maps.places.PlacesService(map);
                service.getDetails({
                    placeId: sugerencia.placeId,
                    fields: ['geometry', 'formatted_address', 'place_id']
                }, (place, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
                        const position = place.geometry.location;
                        
                        map.setCenter(position);
                        map.setZoom(15);
                        marker.setPosition(position);

                        const addressComponents = extractAddressComponents(place.formatted_address);
                        setSelectedLocation({
                            lat: position.lat(),
                            lng: position.lng(),
                            address: place.formatted_address,
                            placeId: place.place_id,
                            ...addressComponents
                        });
                    } else {
                        // Fallback usando geocoder
                        geocoder.geocode({ address: sugerencia.description }, (results, status) => {
                            if (status === 'OK' && results[0]) {
                                const result = results[0];
                                const position = result.geometry.location;

                                map.setCenter(position);
                                map.setZoom(15);
                                marker.setPosition(position);

                                const addressComponents = extractAddressComponents(result.formatted_address);
                                setSelectedLocation({
                                    lat: position.lat(),
                                    lng: position.lng(),
                                    address: result.formatted_address,
                                    placeId: result.place_id,
                                    ...addressComponents
                                });
                            }
                        });
                    }
                });
            } else {
                // Fallback usando geocoder
                geocoder.geocode({ address: sugerencia.description }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const result = results[0];
                        const position = result.geometry.location;

                        map.setCenter(position);
                        map.setZoom(15);
                        marker.setPosition(position);

                        const addressComponents = extractAddressComponents(result.formatted_address);
                        setSelectedLocation({
                            lat: position.lat(),
                            lng: position.lng(),
                            address: result.formatted_address,
                            placeId: result.place_id,
                            ...addressComponents
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error obteniendo detalles del lugar:', error);
            mostrarNotificacion('error', 'Error al obtener detalles de la ubicación.');
        }
    };

    // Confirmar selección
    const handleConfirm = () => {
        if (selectedLocation) {
            // Extraer información de la dirección
            const addressComponents = extractAddressComponents(selectedLocation.address);
            onLocationSelect({
                ...selectedLocation,
                ...addressComponents
            });
            setIsOpen(false);
        }
    };

    // Extraer componentes de la dirección
    const extractAddressComponents = (address) => {
        const components = {
            direccion: address,
            pais: '',
            ciudad: '',
            estado: ''
        };

        // Buscar país (última parte)
        const countryMatch = address.match(/, ([^,]+)$/);
        if (countryMatch) {
            components.pais = countryMatch[1].trim();
        }

        // Buscar ciudad (segunda parte desde el final)
        const parts = address.split(', ');
        if (parts.length >= 3) {
            // La ciudad suele ser la penúltima parte
            components.ciudad = parts[parts.length - 2].trim();
            // El estado sería la tercera desde el final
            if (parts.length >= 4) {
                components.estado = parts[parts.length - 3].trim();
            }
        } else if (parts.length === 2) {
            // Si solo hay 2 partes, la primera es la ciudad
            components.ciudad = parts[0].trim();
        }

        return components;
    };

    // Cerrar modal
    const handleClose = () => {
        setSelectedLocation(null);
        setSearchQuery('');
        setSugerenciasBusqueda([]);
        setInitialLocationSet(false);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title={title}
                onClose={handleClose}
            />
            <div className={styles.modalContent}>

                <div className={styles.searchWrapper}>
                    <InputSugerencias
                        type="text"
                        value={searchQuery}
                        placeholder="Buscar dirección..."
                        onChange={handleSearchChange}
                        sugerencias={sugerenciasBusqueda}
                        onSugerenciaSelect={handleSugerenciaSelect}
                        mostrarCampo="name"
                        buscarCampo="name"
                        maxSugerencias={5}
                        minCaracteres={2}
                        showIcon={true}
                        iconName="search"
                        loading={loadingBusqueda}
                    />
                </div>

                <div className={styles.mapContainer}>
                    {loading && (
                        <div className={styles.mapLoading}>
                            <LoadingSpinner iconName='map' />
                        </div>
                    )}
                    <div ref={mapRef} className={styles.map} style={{
                        '--google-maps-logo': 'none',
                        '--google-maps-terms': 'none'
                    }}></div>
                </div>

                <div className={styles.locationInfo}>
                    <div className={styles.locationDetails}>
                        <div className={styles.locationDetailsTop}>
                            <Dato
                                label="País"
                                value={selectedLocation?.pais || initialLocation?.pais || "Seleccionando..."}
                            />
                            <Dato
                                label="Ciudad"
                                value={selectedLocation?.ciudad || initialLocation?.ciudad || "Seleccionando..."}
                            />
                        </div>
                        
                        <Dato
                            label="Dirección"
                            value={selectedLocation?.direccion || selectedLocation?.address || initialLocation?.direccion || initialLocation?.address || "Selecciona una ubicación en el mapa"}
                        />
                    </div>
                </div>


                {!readOnly && (
                    <Boton
                        className="btn-original"
                        label="Confirmar Ubicación"
                        onClick={handleConfirm}
                        disabled={!selectedLocation}
                        style={{ marginTop: 'auto' }}
                    />
                )}
            </div>
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </ViewModal>
    );
};

export default MapaModal;
