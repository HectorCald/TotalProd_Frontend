import React, { useState, useEffect } from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import styles from '../../styles/Inicial.module.css';
import ItemLine from '../common/ItemLine';
import LoadingSpinner from '../common/LoadingSpinner';
import personalService from '../../services/personalService';
import historialService from '../../services/historialService';

function FiltroResponsable({ isOpen, setIsOpen, onResponsableSeleccionado, responsableSeleccionado }) {
    const [responsables, setResponsables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar responsables solo la primera vez
    useEffect(() => {
        if (responsables.length === 0) {
            cargarResponsables(false);
        }
    }, []);

    // Refrescar en silencio cuando el modal se abra (como FiltroCategorias)
    useEffect(() => {
        if (isOpen) {
            cargarResponsables(true);
        }
    }, [isOpen]);

    const cargarResponsables = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        try {
            // 1. Cargar TODOS los empleados (personal)
            const personalResponse = await personalService.getAll();
            const personalList = (personalResponse.success && personalResponse.data)
                ? personalResponse.data.map(p => ({
                    id: p.id,
                    name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre',
                    tipo: 'personal'
                  }))
                : [];

            // 2. Cargar usuarios (owners) que tienen historial
            const historialResponse = await historialService.getResponsablesUnicos({});
            const usersFromHistorial = (historialResponse.success && historialResponse.data)
                ? historialResponse.data.filter(r => r.tipo === 'user')
                : [];

            // 3. Unir: todos los empleados + usuarios
            const byKey = new Map();
            personalList.forEach(r => byKey.set(`personal-${r.id}`, r));
            usersFromHistorial.forEach(r => byKey.set(`user-${r.id}`, r));
            const merged = Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));

            setResponsables(merged);
        } catch (err) {
            console.error('Error cargando responsables:', err);
            setError('Error al cargar los responsables');
            if (!silent) setResponsables([]);
        } finally {
            if (!silent) setLoading(false);
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
                    <LoadingSpinner />
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
