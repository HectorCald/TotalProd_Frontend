import React, { useState, useEffect } from 'react';
import styles from './EditarAgregar.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import MensajeError from '../../common/MensajeError';
import MapaModal from './MapaModal';
import clientService from '../../../services/clientService';
import MensajeExito from '../../common/MensajeExito';

function EditarAgregar({ isOpen, setIsOpen, usuario, tipo, onClientCreated, onClientUpdated }) {

    const [dataEdit, setDataEdit] = useState({
        name: '',
        phone: '',
        direccion: '',
        coordenadas: null
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');

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
                coordenadas: coordenadasObj
            });
        } else {
            setDataEdit({
                name: '',
                phone: '',
                direccion: '',
                coordenadas: null
            });
        }
        setErrorMessage('');
        setMensajeExito('');
    }, [isOpen, usuario, tipo]);

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
            location: dataEdit.coordenadas ? `(${dataEdit.coordenadas.lng},${dataEdit.coordenadas.lat})` : null
        };

        console.log('🔍 Datos a enviar:', datosParaEnviar);
        console.log('🔍 dataEdit.coordenadas:', dataEdit.coordenadas);
        console.log('🔍 location string:', dataEdit.coordenadas ? `(${dataEdit.coordenadas.lng},${dataEdit.coordenadas.lat})` : 'null');

        setLoading(true);
        try {
            let response;
            
            if (tipo === 'editar') {
                response = await clientService.update(usuario.id, datosParaEnviar);
            } else {
                response = await clientService.create(datosParaEnviar);
            }
            
            if (response.success) {
                const mensaje = tipo === 'editar' ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente';
                setMensajeExito(mensaje);
                setTimeout(() => {
                    setMensajeExito('');
                    setIsOpen(false);
                    if (tipo === 'editar' && onClientUpdated) {
                        onClientUpdated(response.data);
                    } else if (tipo === 'agregar' && onClientCreated) {
                        onClientCreated(response.data);
                    }
                }, 2000);
            } else {
                setErrorMessage(response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el cliente`);
                setTimeout(() => {
                    setErrorMessage('')
                }, 3000);
            }
        } catch (error) {
            console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} cliente:`, error);
            setErrorMessage('Error de conexión con el servidor');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
        } finally {
            setLoading(false);
        }
    }

    const handleLocationSelect = (locationData) => {
        console.log('🔍 Nueva ubicación seleccionada:', locationData);
        
        const nuevaDireccion = locationData.direccion || locationData.address || `Ubicación: ${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`;
        const nuevasCoordenadas = {
            lat: locationData.lat,
            lng: locationData.lng
        };
        
        console.log('🔍 Nueva dirección:', nuevaDireccion);
        console.log('🔍 Nuevas coordenadas:', nuevasCoordenadas);
        
        setDataEdit(prev => ({
            ...prev,
            direccion: nuevaDireccion,
            coordenadas: nuevasCoordenadas
        }));
        
        console.log('🔍 dataEdit actualizado:', {
            ...dataEdit,
            direccion: nuevaDireccion,
            coordenadas: nuevasCoordenadas
        });
        
        setIsMapModalOpen(false);
    };

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
            // Campo vacío para nuevo cliente
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
            <HeaderModal title={tipo === 'agregar' ? 'Nuevo cliente' : tipo === 'editar' ? 'Editar cliente' : 'Ver cliente'} onClose={() => setIsOpen(false)} />
            <div className={styles.modalContent}>
                <MensajeError mensaje={errorMessage} />
                <MensajeExito mensaje={mensajeExito} />
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