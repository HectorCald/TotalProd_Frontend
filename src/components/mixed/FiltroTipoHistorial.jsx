import React from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import ItemLine from '../common/ItemLine';
import styles from '../../styles/Inicial.module.css';

function FiltroTipoHistorial({ isOpen, setIsOpen, onTipoSeleccionado }) {
  const opciones = [
    {
      value: null,
      label: 'Todas las acciones',
      icon: 'list-ul'
    },
    {
      value: 'CREAR',
      label: 'Crear',
      icon: 'plus-circle'
    },
    {
      value: 'EDITAR',
      label: 'Editar',
      icon: 'edit'
    },
    {
      value: 'ELIMINAR',
      label: 'Eliminar',
      icon: 'trash'
    }
  ];

  const handleSelect = (valor) => {
    onTipoSeleccionado(valor);
    setIsOpen(false);
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title="Acción del historial"
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <p className={styles.subTitle}>Selecciona la acción a mostrar</p>
        {opciones.map(opcion => (
          <ItemLine
            key={opcion.value ?? 'todos'}
            title={opcion.label}
            icon={opcion.icon}
            onClick={() => handleSelect(opcion.value)}
          />
        ))}
      </div>
    </ViewModal>
  );
}

export default FiltroTipoHistorial;

