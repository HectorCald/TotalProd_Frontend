import React, { useState, useEffect } from 'react';
import styles from '../../styles/Inicial.module.css';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import ItemLine from '../common/old/ItemLine';
import typeMeasureService from '../../services/typeMeasureService';

function FiltroTipoMedida({ isOpen, setIsOpen, onTipoMedidaSeleccionado }) {
    const [tiposMedida, setTiposMedida] = useState([]);
    const [loading, setLoading] = useState(false);

    // Cargar tipos de medida solo la primera vez
    useEffect(() => {
        if (tiposMedida.length === 0) {
            cargarTiposMedida();
        }
    }, []);

    const cargarTiposMedida = async () => {
        setLoading(true);
        try {
            const response = await typeMeasureService.getAll();
            if (response.success) {
                setTiposMedida(response.data);
            }
        } catch (error) {
            console.error('Error cargando tipos de medida:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTipoMedidaSelect = (tipoMedidaId) => {
        onTipoMedidaSeleccionado(tipoMedidaId);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Tipos de Medida"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona una opción para filtrar todos los productos que correspondan a ese tipo de medida.</p>

                {/* Opción para mostrar todos */}
                <ItemLine
                    title='Todas las medidas'
                    icon='ruler'
                    onClick={() => handleTipoMedidaSelect(null)}
                />

                {/* Tipos de medida dinámicos */}
                {loading ? (
                    <div className={styles.loadingMore}>
                        <p>Cargando tipos de medida...</p>
                    </div>
                ) : (
                    tiposMedida.map((tipoMedida) => (
                        <ItemLine
                            key={tipoMedida.id}
                            title={tipoMedida.name}
                            icon='ruler'
                            onClick={() => handleTipoMedidaSelect(tipoMedida.id)}
                        />
                    ))
                )}
            </div>
        </ViewModal>
    );
}

export default FiltroTipoMedida;
