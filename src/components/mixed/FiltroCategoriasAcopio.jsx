import React, { useState, useEffect } from 'react';
import styles from '../../styles/Inicial.module.css';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import ItemLine from '../common/old/ItemLine';
import categoryAcopioService from '../../services/categoryAcopioService';

function FiltroCategoriasAcopio({ isOpen, setIsOpen, onCategoriaSeleccionada }) {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);

    // Cargar categorías solo la primera vez
    useEffect(() => {
        if (categorias.length === 0) {
            cargarCategorias(false);
        }
    }, []);

    // Refrescar categorías en silencio cuando el modal se abra, sin bloquear la UI
    useEffect(() => {
        if (isOpen) {
            cargarCategorias(true);
        }
    }, [isOpen]);

    const cargarCategorias = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await categoryAcopioService.getAll();
            if (response.success) {
                setCategorias(response.data);
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleCategoriaSelect = (categoriaId) => {
        onCategoriaSeleccionada(categoriaId);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Categorías"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona una opción para filtrar todos los productos que correspondan a esa categoría.</p>

                {/* Opción para mostrar todos */}
                <ItemLine
                    title='Todas las categorías'
                    icon='tag'
                    onClick={() => handleCategoriaSelect(null)}
                />

                {/* Opción para productos sin categoría */}
                <ItemLine
                    title='Sin categoría'
                    icon='tag'
                    onClick={() => handleCategoriaSelect('')}
                />

                {/* Categorías dinámicas */}
                {loading ? (
                    <div className={styles.loadingMore}>
                        <p>Cargando categorías...</p>
                    </div>
                ) : (
                    categorias.map((categoria) => (
                        <ItemLine
                            key={categoria.id}
                            title={categoria.name}
                            icon='tag'
                            onClick={() => handleCategoriaSelect(categoria.id)}
                        />
                    ))
                )}
            </div>
        </ViewModal>
    );
}

export default FiltroCategoriasAcopio;
