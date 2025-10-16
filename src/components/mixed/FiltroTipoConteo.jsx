import React from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import ItemLine from '../common/ItemLine';
import styles from '../../styles/Inicial.module.css';

function FiltroTipoConteo({ isOpen, setIsOpen, onTipoSeleccionado }) {
    const tipos = [
        { value: null, label: 'Todos' },
        { value: 'almacen', label: 'Almacén' },
        { value: 'acopio', label: 'Materia Prima' }
    ];

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Tipo de Conteo"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el tipo de conteo</p>
                {tipos.map((t) => (
                    <ItemLine
                        key={t.label}
                        title={t.label}
                        icon='category'
                        onClick={() => { onTipoSeleccionado(t.value); setIsOpen(false); }}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroTipoConteo;


