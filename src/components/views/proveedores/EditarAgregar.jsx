import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import MensajeError from '../../common/MensajeError';
import MapaModal from '../clientes/MapaModal';
import proveedorService from '../../../services/proveedorService';
import { useUser } from '../../../context/UserContext';

function EditarAgregar({ isOpen, setIsOpen, usuario, tipo, onProveedorCreated, onProveedorUpdated }) {
    const { sucursalSeleccionada } = useUser();

    // Estados para los datos del proveedor
    const [dataEdit, setDataEdit] = useState({
        name: '',
        phone: '',
        direccion: '',
        description: '',
        coordenadas: null
    });

    // Estados para los mensajes de error y éxito
    const [errorMessage, setErrorMessage] = useState('');

    // Estados para el mapa
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    // Estados para la carga
    const [loading, setLoading] = useState(false);
   

        // Efecto para cargar los datos del proveedor
    useEffect(() => {
        if (usuario && tipo === 'editar') {
            // Parsear las coordenadas del string a objeto
            let coordenadasObj = null;
            if (usuario.location && typeof usuario.location === 'string') {
                const coordsMatch = usuario.location.match(/\(([^,]+),([^)]+)\)/);
                if (coordsMatch) {
                    const lng = parseFloat(coordsMatch[1]);
                    const lat = parseFloat(coordsMatch[2]);
                    coordenadasObj = { lat, lng };
                }
            }

            setDataEdit({
                name: usuario.name || '',
                phone: usuario.phone || '',
                direccion: usuario.direccion || '',
                description: usuario.description || '',
                coordenadas: coordenadasObj
            });
        } else {
            setDataEdit({
                name: '',
                phone: '',
                direccion: '',
                description: '',
                coordenadas: null
            });
        }
        setErrorMessage('');
    }, [isOpen, usuario, tipo]);


    // Función para enviar los datos del proveedor
    const handleSubmit = async () => {
        if (!dataEdit.name.trim()) {
            setErrorMessage('El nombre es obligatorio');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }

        // Preparar datos para enviar
        const datosParaEnviar = {
            name: dataEdit.name,
            phone: dataEdit.phone,
            direccion: dataEdit.direccion,
            description: dataEdit.description,
            location: dataEdit.coordenadas ? `(${dataEdit.coordenadas.lng},${dataEdit.coordenadas.lat})` : null
        };
        setLoading(true);
        try {
            let response;

            if (tipo === 'editar') {
                response = await proveedorService.update(usuario.id, datosParaEnviar, sucursalSeleccionada?.id);
            } else {
                response = await proveedorService.create(datosParaEnviar, sucursalSeleccionada?.id);
            }

            if (response.success) {
                if (tipo === 'editar' && onProveedorUpdated) {
                    onProveedorUpdated(response.data);
                } else if (tipo === 'agregar' && onProveedorCreated) {
                    onProveedorCreated(response.data);
                }
                setIsOpen(false);
            } else {
                setErrorMessage(response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el proveedor`);
                setTimeout(() => {
                    setErrorMessage('')
                }, 3000);
            }
        } catch (error) {
            console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} proveedor:`, error);
            setErrorMessage('Error de conexión con el servidor');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
        } finally {
            setLoading(false);
        }
    }

    // Función para seleccionar la ubicación
    const handleLocationSelect = (locationData) => {

        const nuevaDireccion = locationData.direccion || locationData.address || `Ubicación: ${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`;
        const nuevasCoordenadas = {
            lat: locationData.lat,
            lng: locationData.lng
        };

        setDataEdit(prev => ({
            ...prev,
            direccion: nuevaDireccion,
            coordenadas: nuevasCoordenadas
        }));

        setIsMapModalOpen(false);
    };

    // Función para abrir el mapa
    const handleOpenMap = () => {
        setIsMapModalOpen(true);
    };

    // Función para mostrar coordenadas en el campo de dirección
    const getDireccionDisplay = () => {
        if (dataEdit.direccion && dataEdit.direccion.trim() !== '') {
            // Si hay dirección seleccionada (nueva o existente), mostrarla
            return dataEdit.direccion;
        } else if (tipo === 'editar' && dataEdit.coordenadas) {
            // Al editar, mostrar las coordenadas existentes si no hay dirección nueva
            return `Coordenadas: (${dataEdit.coordenadas.lng}, ${dataEdit.coordenadas.lat})`;
        } else {
            // Campo vacío para nuevo proveedor
            return '';
        }
    };

    // Título dinámico para el mapa
    const getMapTitle = () => {
        if (tipo === 'editar') {
            return 'Editar ubicación';
        } else {
            return 'Seleccionar ubicación';
        }
    };

    // Determinar si el mapa debe ser de solo lectura
    const isMapReadOnly = tipo === 'ver';

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal title={tipo === 'agregar' ? 'Nuevo proveedor' : tipo === 'editar' ? 'Editar proveedor' : 'Ver proveedor'} onClose={() => setIsOpen(false)} />
            <div className={styles.modalContent}>
                <MensajeError mensaje={errorMessage} />
                <p className={styles.subTitle}>INFORMACION PERSONAL</p>
                <InputNormal
                    tipo="text"
                    icon="user"
                    value={dataEdit.name}
                    placeholder='Nombre completo'
                    onChange={(e) => setDataEdit({ ...dataEdit, name: e.target.value })}
                    disabled={tipo === 'ver'}
                />
                <InputNormal
                    tipo="number"
                    icon="phone"
                    value={dataEdit.phone}
                    placeholder='Celular'
                    onChange={(e) => setDataEdit({ ...dataEdit, phone: e.target.value })}
                    disabled={tipo === 'ver'}
                />
                <InputNormal
                    tipo="text"
                    icon="text"
                    value={dataEdit.description}
                    placeholder='Descripción (opcional)'
                    onChange={(e) => setDataEdit({ ...dataEdit, description: e.target.value })}
                    disabled={tipo === 'ver'}
                />
                <p className={styles.subTitle}>UBICACIÓN</p>
                <InputNormal
                    tipo="text"
                    icon="map-pin"
                    value={getDireccionDisplay()}
                    placeholder='Dirección'
                    onChange={(e) => setDataEdit({ ...dataEdit, direccion: e.target.value })}
                    buttonIcon="map"
                    buttonIconClick={handleOpenMap}
                    disabled={tipo === 'ver'}
                />
                {tipo !== 'ver' && (
                    <Boton
                        className='btn-original'
                        label={tipo === 'editar' ? 'Actualizar' : 'Guardar'}
                        style={{ marginTop: 'auto' }}
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={!dataEdit.name}
                    />
                )}
            </div>

            <MapaModal
                isOpen={isMapModalOpen}
                setIsOpen={setIsMapModalOpen}
                onLocationSelect={handleLocationSelect}
                initialLocation={dataEdit.coordenadas ? `(${dataEdit.coordenadas.lng},${dataEdit.coordenadas.lat})` : null}
                readOnly={isMapReadOnly}
                title={getMapTitle()}
            />


        </ViewModal>
    );
}
export default EditarAgregar;