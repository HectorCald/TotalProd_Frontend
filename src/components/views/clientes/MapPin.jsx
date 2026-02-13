import React, { useState, useEffect, useRef } from 'react';
import styles from './MapaModal.module.css';
import Dato from '../../common/Dato';
import LoadingSpinner from '../../common/LoadingSpinner';
import NoData from '../../common/NoData';

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

const MapPin = ({ initialLocation, onLocationData, onLoadingChange }) => {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [geocoder, setGeocoder] = useState(null);
    const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);

    // Notificar cambios en el estado de carga
    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(loading);
        }
    }, [loading, onLoadingChange]);

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
                    const locationData = {
                        lat: lat,
                        lng: lng,
                        address: result.formatted_address,
                        placeId: result.place_id,
                        ...addressComponents
                    };
                    setSelectedLocation(locationData);
                    if (onLocationData) {
                        onLocationData(locationData);
                    }
                    setLoading(false);
                } else {
                    const locationData = {
                        lat: lat,
                        lng: lng,
                        address: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                        placeId: null,
                        direccion: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                        ciudad: '',
                        pais: ''
                    };
                    setSelectedLocation(locationData);
                    if (onLocationData) {
                        onLocationData(locationData);
                    }
                    setLoading(false);
                }
            });
            return;
        }

        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const result = results[0];
                const addressComponents = extractAddressComponents(result.formatted_address);
                const locationData = {
                    lat: lat,
                    lng: lng,
                    address: result.formatted_address,
                    placeId: result.place_id,
                    ...addressComponents
                };
                setSelectedLocation(locationData);
                if (onLocationData) {
                    onLocationData(locationData);
                }
                setLoading(false);
            } else {
                const locationData = {
                    lat: lat,
                    lng: lng,
                    address: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    placeId: null,
                    direccion: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    ciudad: '',
                    pais: ''
                };
                setSelectedLocation(locationData);
                if (onLocationData) {
                    onLocationData(locationData);
                }
                setLoading(false);
            }
        });
    };

    // Inicializar el mapa
    useEffect(() => {
        if (!initialLocation) {
            setLoading(false);
            return;
        }

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

        return () => {
            clearTimeout(safetyTimeout);
        };
    }, [initialLocation]);

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
                    zoomControl: true,
                    scaleControl: false,
                    rotateControl: false,
                    clickableIcons: false,
                    disableDefaultUI: false,
                    gestureHandling: 'cooperative',
                    styles: getMapStyles()
                });

                // Crear geocoder
                const geocoderInstance = new window.google.maps.Geocoder();
                setGeocoder(geocoderInstance);

                // Usar Marker tradicional
                const markerInstance = new window.google.maps.Marker({
                    position: initialCoords,
                    map: mapInstance,
                    draggable: false,
                    title: 'Ubicación del cliente'
                });

                setMap(mapInstance);
                setMarker(markerInstance);

                // Delay para asegurar que Google Maps esté completamente cargado
                setTimeout(() => {
                    // Forzar el centro del mapa después de la inicialización
                    mapInstance.setCenter(initialCoords);
                    mapInstance.setZoom(15);

                    // Hacer geocoding para obtener la dirección real de las coordenadas iniciales
                    geocoderInstance.geocode({ location: initialCoords }, (results, status) => {
                        if (status === 'OK' && results[0]) {
                            const result = results[0];
                            const addressComponents = extractAddressComponents(result.formatted_address);
                            const locationData = {
                                lat: initialCoords.lat,
                                lng: initialCoords.lng,
                                address: result.formatted_address,
                                placeId: result.place_id,
                                ...addressComponents
                            };
                            setSelectedLocation(locationData);
                            if (onLocationData) {
                                onLocationData(locationData);
                            }
                        } else {
                            // Si falla el geocoding, usar coordenadas como fallback
                            const locationData = {
                                lat: initialCoords.lat,
                                lng: initialCoords.lng,
                                address: `Ubicación: ${initialCoords.lat.toFixed(6)}, ${initialCoords.lng.toFixed(6)}`,
                                placeId: null,
                                direccion: `Ubicación: ${initialCoords.lat.toFixed(6)}, ${initialCoords.lng.toFixed(6)}`,
                                ciudad: '',
                                pais: ''
                            };
                            setSelectedLocation(locationData);
                            if (onLocationData) {
                                onLocationData(locationData);
                            }
                        }
                        setLoading(false);
                    });
                }, 1000);
            }
        }
    };

    if (!initialLocation) {
        return (
            <div className={styles.mapPinContainer}>
                <div className={styles.mapContainer} style={{ height: '260px', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <NoData
                        icon="map"
                        title="No hay ubicación"
                        detail="Este cliente no tiene una ubicación registrada"
                        transparent={false}
                        minHeight="100%"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.mapPinContainer} style={{ minHeight: '350px' }}>
            <div className={styles.mapContainer} style={{ minHeight: '350px' }}>
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
        </div>
    );
};

export default MapPin;
