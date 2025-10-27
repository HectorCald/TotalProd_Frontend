import React, { useState, useEffect, useRef } from 'react';
import styles from './MapaModal.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import LoadingSpinner from '../../common/LoadingSpinner';

// Configuración de Mapbox - Cambia este token por el tuyo
const MAPBOX_TOKEN = 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsZXhhbXBsZTAwMDAwM3BqZXhhbXBsZSJ9.your-token-here';

const MapaModal2 = ({ isOpen, setIsOpen, onLocationSelect, initialLocation, readOnly = false, title = "Seleccionar Ubicación" }) => {
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [loading, setLoading] = useState(false);
    const mapRef = useRef(null);

    // Inicializar el mapa cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            
            // Cargar Mapbox dinámicamente
            const loadMapbox = async () => {
                try {
                    const mapboxgl = await import('mapbox-gl');
                    mapboxgl.default.accessToken = MAPBOX_TOKEN;
                    
                    // Crear el mapa
                    const mapInstance = new mapboxgl.default.Map({
                        container: mapRef.current,
                        style: 'mapbox://styles/mapbox/streets-v12',
                        center: [-99.1332, 19.4326], // Ciudad de México
                        zoom: 13
                    });

                    // Crear marcador
                    const markerInstance = new mapboxgl.default.Marker({
                        color: '#ff6b6b',
                        draggable: true
                    })
                    .setLngLat([-99.1332, 19.4326])
                    .addTo(mapInstance);

                    // Si hay ubicación inicial, centrar ahí
                    if (initialLocation && typeof initialLocation === 'string' && initialLocation.includes(',')) {
                        const coordsMatch = initialLocation.match(/\(([^,]+),([^)]+)\)/);
                        if (coordsMatch) {
                            const lng = parseFloat(coordsMatch[1]);
                            const lat = parseFloat(coordsMatch[2]);
                            mapInstance.setCenter([lng, lat]);
                            mapInstance.setZoom(15);
                            markerInstance.setLngLat([lng, lat]);
                        }
                    }

                    setMap(mapInstance);
                    setMarker(markerInstance);
                    setLoading(false);

                } catch (error) {
                    console.error('Error cargando Mapbox:', error);
                    setLoading(false);
                }
            };

            loadMapbox();
        }
    }, [isOpen, initialLocation]);

    // Limpiar mapa cuando se cierra
    useEffect(() => {
        if (!isOpen && map) {
            map.remove();
            setMap(null);
            setMarker(null);
        }
    }, [isOpen, map]);

    // Confirmar selección
    const handleConfirm = () => {
        if (marker) {
            const position = marker.getLngLat();
            onLocationSelect({
                lat: position.lat,
                lng: position.lng,
                address: `Ubicación: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
                direccion: `Ubicación: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
            });
            setIsOpen(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner iconName='map' />}
            <HeaderModal
                title={title}
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <div className={styles.mapContainer}>
                    <div ref={mapRef} className={styles.map}></div>
                </div>
                
                {!readOnly && (
                    <Boton
                        className="btn-original"
                        label="Confirmar Ubicación"
                        onClick={handleConfirm}
                        style={{ marginTop: '20px' }}
                    />
                )}
            </div>
        </ViewModal>
    );
};

export default MapaModal2;