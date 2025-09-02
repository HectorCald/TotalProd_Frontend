import React, { useState, useEffect } from 'react';
import styles from './Clientes.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerCliente from './VerCliente';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import clientService from '../../../services/clientService';
import LoadingSpinner from '../../common/LoadingSpinner';

function Clientes({ isOpen, setIsOpen }) {
    const [isOpenVerCliente, setIsOpenVerCliente] = useState(false);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [personaData, setPersonaData] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleCliente = (persona) => {
        setIsOpenVerCliente(true);
        setInfoPersona(persona);
    };

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await clientService.getAll();
            console.log('Respuesta del servicio:', response);
            if (response.success && response.data) {
                setPersonaData(response.data);
            }
        } catch (error) {
            console.error('Error obteniendo clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen]);

    // Función para manejar cuando se crea un nuevo cliente
    const handleClientCreated = (newClient) => {
        // Agregar el nuevo cliente a la lista
        setPersonaData(prev => [newClient, ...prev]);
        // Cerrar el modal
        setIsOpenEditarAgregar(false);
    };

    // Función para manejar cuando se elimina un cliente
    const handleClientDeleted = (deletedId) => {
        // Remover el cliente eliminado de la lista
        setPersonaData(prev => prev.filter(cliente => cliente.id !== deletedId));
        // Cerrar el modal de ver cliente
        setIsOpenVerCliente(false);
    };

    // Función para manejar cuando se actualiza un cliente
    const handleClientUpdated = (updatedClient) => {
        // Actualizar solo el cliente específico en la lista
        setPersonaData(prev => prev.map(cliente => 
            cliente.id === updatedClient.id ? updatedClient : cliente
        ));
        // Cerrar el modal de ver cliente
        setIsOpenVerCliente(false);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Clientes</h1>
                <InputSearch
                    placeholder='Buscar cliente'
                    type="text"
                />
                <div className={styles.content}>
                    {personaData.length > 0 ? (
                        personaData.map((cliente, index) => (
                            <ItemView
                                key={cliente.id || index}
                                title={cliente.name || 'Sin nombre'}
                                arrow={true}
                                onClick={() => handleCliente(cliente)}
                            />
                        ))
                    ) : (
                        <div className={styles.noData}>
                            <p>No hay clientes registrados</p>
                        </div>
                    )}
                </div>
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar cliente'
                        onClick={() => setIsOpenEditarAgregar(true)}
                    />
                </div>
            </div>
            
            {/* Modal de Ver Cliente */}
            <VerCliente 
                isOpen={isOpenVerCliente} 
                setIsOpen={setIsOpenVerCliente} 
                usuario={infoPersona}
                onClientDeleted={handleClientDeleted}
                onClientUpdated={handleClientUpdated}
            />

            {/* Modal de Editar/Agregar */}
            <EditarAgregar 
                isOpen={isOpenEditarAgregar} 
                setIsOpen={setIsOpenEditarAgregar} 
                tipo='agregar'
                onClientCreated={handleClientCreated}
            />
        </View>
    );
}

export default Clientes;