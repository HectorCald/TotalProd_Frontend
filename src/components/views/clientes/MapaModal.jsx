import React, { useState, useEffect, useRef } from 'react';
import styles from './MapaModal.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import LoadingSpinner from '../../common/LoadingSpinner';
import Notification from '../../common/Notification';

const MapaModal = ({ isOpen, setIsOpen, onLocationSelect, initialLocation, readOnly = false, title = "Seleccionar Ubicación" }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [geocoder, setGeocoder] = useState(null);
    const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
    const mapRef = useRef(null);
    const searchInputRef = useRef(null);
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
                    mapTypeControl: true,
                    streetViewControl: true,
                    fullscreenControl: true,
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
                                setSelectedLocation({
                                    lat: initialCoords.lat,
                                    lng: initialCoords.lng,
                                    address: result.formatted_address,
                                    placeId: result.place_id
                                });
                            } else {
                                // Si falla el geocoding, usar coordenadas como fallback
                                setSelectedLocation({
                                    lat: initialCoords.lat,
                                    lng: initialCoords.lng,
                                    address: `Ubicación: ${initialCoords.lat.toFixed(6)}, ${initialCoords.lng.toFixed(6)}`,
                                    placeId: null
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
                        mapTypeControl: true,
                        streetViewControl: true,
                        fullscreenControl: true,
                    });

                    initializeMapComponents(mapInstance, userLocation);
                },
                (error) => {
                    // Usar ubicación por defecto si falla la geolocalización
                    const defaultLocation = { lat: 19.4326, lng: -99.1332 };

                    const mapInstance = new window.google.maps.Map(mapRef.current, {
                        center: defaultLocation,
                        zoom: 13,
                        mapTypeControl: true,
                        streetViewControl: true,
                        fullscreenControl: true,
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
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
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

        // Configurar autocompletado del buscador
        if (searchInputRef.current && window.google.maps.places) {
            try {
                const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current);
                autocomplete.bindTo('bounds', mapInstance);
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.geometry) {
                        const position = place.geometry.location;
                        mapInstance.setCenter(position);
                        mapInstance.setZoom(15);
                        markerInstance.setPosition(position);

                        // Actualizar el valor del buscador
                        setSearchQuery(place.formatted_address);

                        setSelectedLocation({
                            lat: position.lat(),
                            lng: position.lng(),
                            address: place.formatted_address,
                            placeId: place.place_id
                        });
                    }
                });
            } catch (error) {
                console.log('Error configurando autocompletado:', error);
            }
        } else {
            console.log('Places API no disponible para autocompletado');
        }

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
                    setSelectedLocation({
                        lat: lat,
                        lng: lng,
                        address: result.formatted_address,
                        placeId: result.place_id
                    });
                    if (!initialLocationSet) {
                        setInitialLocationSet(true);
                    }
                } else {
                    setSelectedLocation({
                        lat: lat,
                        lng: lng,
                        address: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                        placeId: null
                    });
                }
            });
            return;
        }

        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const result = results[0];
                setSelectedLocation({
                    lat: lat,
                    lng: lng,
                    address: result.formatted_address,
                    placeId: result.place_id
                });
                if (!initialLocationSet) {
                    setInitialLocationSet(true);
                }
            } else {
                setSelectedLocation({
                    lat: lat,
                    lng: lng,
                    address: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    placeId: null
                });
            }
        });
    };

    // Buscar ubicación por texto
    const handleSearch = () => {
        if (!searchQuery.trim()) {
            return;
        }

        if (!geocoder) {
            mostrarNotificacion('error', 'El servicio de búsqueda no está disponible. Intenta hacer clic en el mapa para seleccionar una ubicación.');
            return;
        }

        geocoder.geocode({ address: searchQuery }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const result = results[0];
                const position = result.geometry.location;

                map.setCenter(position);
                map.setZoom(15);
                marker.setPosition(position);

                setSelectedLocation({
                    lat: position.lat(),
                    lng: position.lng(),
                    address: result.formatted_address,
                    placeId: result.place_id
                });
            } else {
                if (status === 'ZERO_RESULTS') {
                    mostrarNotificacion('error', 'No se encontró la ubicación. Intenta con una dirección más específica o usa el mapa para seleccionar.');
                } else {
                    mostrarNotificacion('error', 'Error en la búsqueda. Intenta con una dirección más específica o usa el mapa para seleccionar.');
                }
            }
        });
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
        setInitialLocationSet(false);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner iconName='map' />}
            <HeaderModal
                title={title}
                onClose={handleClose}
            />
            <div className={styles.modalContent}>

                <div className={styles.searchWrapper}>
                    <InputNormal
                        ref={searchInputRef}
                        tipo="text"
                        value={searchQuery}
                        placeholder="Buscar dirección..."
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        className={styles.searchButton}
                        onClick={handleSearch}
                        type="button"
                    >
                        <i className="bx bx-search"></i>
                    </button>
                </div>

                <div className={styles.mapContainer}>

                    <div ref={mapRef} className={styles.map}></div>

                </div>

                {selectedLocation && (
                    <div className={styles.locationInfo}>
                        <h4>Ubicación seleccionada:</h4>
                        <p>{selectedLocation.address}</p>
                        <p>Coordenadas: {selectedLocation.lat}, {selectedLocation.lng}</p>
                    </div>
                )}
                
                {!selectedLocation && initialLocation && (
                    <div className={styles.locationInfo}>
                        <h4>📍 Cargando ubicación del cliente...</h4>
                        <p>Obteniendo dirección desde las coordenadas</p>
                        <p>Coordenadas: {initialLocation}</p>
                    </div>
                )}
                
                {!selectedLocation && !initialLocation && initialLocationSet && (
                    <div className={styles.locationInfo}>
                        <h4>📍 Ubicación actual:</h4>
                        <p>Selecciona una ubicación en el mapa o usa el buscador</p>
                    </div>
                )}

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
