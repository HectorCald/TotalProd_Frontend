import React, { useState, useEffect } from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import styles from '../../styles/Inicial.module.css';
import ItemLine from '../common/ItemLine';
import personalService from '../../services/personalService';

function FiltroResponsable({ isOpen, setIsOpen, onResponsableSeleccionado, responsableSeleccionado }) {
    const [responsables, setResponsables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar responsables cuando se monta el componente
    useEffect(() => {
        cargarResponsables();
    }, []);

    const cargarResponsables = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('🔍 Cargando personal...');
            const personalResponse = await personalService.getAll();
            console.log('📋 Respuesta del personal:', personalResponse);
            
            if (personalResponse.success && personalResponse.data) {
                console.log('✅ Personal obtenido:', personalResponse.data.length, 'elementos');
                
                const responsablesList = personalResponse.data.map(personal => ({
                    id: personal.id,
                    name: `${personal.first_name} ${personal.last_name}`.trim(),
                    tipo: 'personal'
                }));

                // Ordenar por nombre
                responsablesList.sort((a, b) => a.name.localeCompare(b.name));
                setResponsables(responsablesList);
                console.log('📝 Lista de responsables:', responsablesList);
            } else {
                console.log('❌ Error en respuesta:', personalResponse);
                setError(personalResponse.message || 'Error al obtener el personal');
                setResponsables([]);
            }
        } catch (error) {
            console.error('❌ Error cargando responsables:', error);
            setError('Error al cargar los responsables');
            setResponsables([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSeleccionar = (responsable) => {
        onResponsableSeleccionado(responsable);
        setIsOpen(false);
    };

    const handleLimpiar = () => {
        onResponsableSeleccionado(null);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Filtrar por Responsable"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el responsable de los registros a mostrar</p>

                {loading && (
                    <div className={styles.loading}>
                        <p>Cargando responsables...</p>
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Opción para mostrar todos */}
                        <ItemLine
                            title="Todos los responsables"
                            icon="user"
                            onClick={handleLimpiar}
                        />

                        {responsables.map((responsable) => (
                            <ItemLine
                                key={`${responsable.tipo}-${responsable.id}`}
                                title={responsable.name}
                                icon={responsable.tipo === 'personal' ? 'user' : 'user-circle'}
                                onClick={() => handleSeleccionar(responsable)}
                            />
                        ))}

                        {responsables.length === 0 && (
                            <div className={styles.noData}>
                                <p>No se encontraron responsables</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </ViewModal>
    );
}

export default FiltroResponsable;
