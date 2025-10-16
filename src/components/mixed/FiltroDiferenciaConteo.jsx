import React from 'react';
import styles from '../../styles/Inicial.module.css';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import ItemLine from '../common/ItemLine';

// Componente de filtro con misma estructura que FiltroCategorias
// Props: isOpen, setIsOpen, onDiferenciaSeleccionada
// Opciones: 'todos' | 'faltantes' | 'sobrantes' | 'iguales'
function FiltroDiferenciaConteo({ isOpen, setIsOpen, onDiferenciaSeleccionada }) {
  const handleSelect = (value) => {
    if (onDiferenciaSeleccionada) onDiferenciaSeleccionada(value);
    setIsOpen(false);
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title="Diferencia"
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <p className={styles.subTitle}>Filtrar productos por resultado del conteo respecto al stock actual.</p>

        <ItemLine
          title='Todos'
          icon='filter'
          onClick={() => handleSelect('todos')}
        />
        <ItemLine
          title='Faltantes'
          icon='minus-circle'
          onClick={() => handleSelect('faltantes')}
        />
        <ItemLine
          title='Sobrantes'
          icon='plus-circle'
          onClick={() => handleSelect('sobrantes')}
        />
        <ItemLine
          title='Iguales'
          icon='check-circle'
          onClick={() => handleSelect('iguales')}
        />
      </div>
    </ViewModal>
  );
}

export default FiltroDiferenciaConteo;


