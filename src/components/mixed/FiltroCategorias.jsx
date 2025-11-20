import React, { useState, useEffect } from 'react';
import styles from '../../styles/Inicial.module.css';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import Checkbox from '../common/Checkbox';
import Boton from '../common/Boton';
import categoryAlmacenService from '../../services/categoryAlmacenService';

function FiltroCategorias({ isOpen, setIsOpen, onCategoriaSeleccionada, categoriasSeleccionadas = [] }) {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selecciones, setSelecciones] = useState(new Set(categoriasSeleccionadas));

    // Sincronizar selecciones cuando cambian las categorías seleccionadas desde fuera
    useEffect(() => {
        if (isOpen) {
            setSelecciones(new Set(categoriasSeleccionadas));
        }
    }, [categoriasSeleccionadas, isOpen]);

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
            const response = await categoryAlmacenService.getAll();
            if (response.success) {
                setCategorias(response.data);
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleToggleCategoria = (categoriaId) => {
        setSelecciones(prev => {
            const nuevo = new Set(prev);
            if (nuevo.has(categoriaId)) {
                nuevo.delete(categoriaId);
            } else {
                nuevo.add(categoriaId);
            }
            return nuevo;
        });
    };

    const handleAplicar = () => {
        const arraySelecciones = Array.from(selecciones);
        // Obtener los nombres de las categorías seleccionadas
        const nombresSelecciones = arraySelecciones.map(id => {
            if (id === '') return { id: '', nombre: 'Sin categoría' };
            const categoria = categorias.find(c => c.id === id);
            return { id, nombre: categoria?.name || 'Categoría' };
        });

        onCategoriaSeleccionada(arraySelecciones, nombresSelecciones);
        setIsOpen(false);
    };

    const handleLimpiar = () => {
        setSelecciones(new Set());
        // Aplicar automáticamente al limpiar (array vacío = mostrar todas)
        onCategoriaSeleccionada([], []);
        setIsOpen(false);
    };

    const isChecked = (categoriaId) => {
        return selecciones.has(categoriaId);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Categorías"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona una o más categorías para filtrar los productos. Si no seleccionas ninguna, se mostrarán todas.</p>

                {/* Opción para productos sin categoría */}
                <Checkbox
                    title='Sin categoría'
                    icon='tag'
                    checked={isChecked('')}
                    onChange={() => handleToggleCategoria('')}
                />

                {/* Categorías dinámicas */}
                {loading ? (
                    <div className={styles.loadingMore}>
                        <p>Cargando categorías...</p>
                    </div>
                ) : (
                    categorias.map((categoria) => (
                        <Checkbox
                            key={categoria.id}
                            title={categoria.name}
                            icon='tag'
                            checked={isChecked(categoria.id)}
                            onChange={() => handleToggleCategoria(categoria.id)}
                        />
                    ))
                )}

                {/* Botones de acción */}
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Limpiar'
                        onClick={handleLimpiar}
                    />
                    <Boton
                        className='btn-original'
                        label='Aplicar'
                        onClick={handleAplicar}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default FiltroCategorias;
