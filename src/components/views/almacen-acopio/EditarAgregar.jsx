import React, { useState } from 'react';
import styles from './EditarAgregar.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';


function Formulario({ isOpen, setIsOpen, data = '', tipo }) {
  const [dataMov, setDataMov] = useState({
    ...data,
    lotesBruto: data.lotesBruto?.length ? data.lotesBruto : [{ lote: '', peso: 0 }],
    lotesPrima: data.lotesPrima?.length ? data.lotesPrima : [{ lote: '', peso: 0 }],
  });

  // Función para actualizar un lote
  const handleLoteChange = (tipoLote, index, field, value) => {
    const lotes = [...dataMov[tipoLote]]; // clonar array
    lotes[index][field] = field === 'peso' ? Number(value) : value;
    setDataMov({ ...dataMov, [tipoLote]: lotes });
  };


  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={tipo === 'editar' ? 'Editar producto' : 'Nuevo producto'}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>

        <InputNormal
          tipo="text"
          value={dataMov.producto}
          placeholder='Producto'
          onChange={(e) => setDataMov({ ...dataMov, producto: e.target.value })}
        />

        {/* Lotes Bruto */}
        <p className={styles.subTitle}>Lotes Materia Bruta</p>
        {dataMov.lotesBruto?.map((lote, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
            <InputNormal
              tipo="text"
              value={lote.lote}
              placeholder='Número de lote'
              onChange={(e) => handleLoteChange('lotesBruto', index, 'lote', e.target.value)}
            />
            <InputNormal
              tipo="number"
              value={lote.peso}
              placeholder='Peso'
              onChange={(e) => handleLoteChange('lotesBruto', index, 'peso', e.target.value)}
            />
          </div>
        ))}

        {/* Lotes Prima */}
        <p className={styles.subTitle}>Lotes Materia Prima</p>
        {dataMov.lotesPrima?.map((lote, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
            <InputNormal
              tipo="text"
              value={lote.lote}
              placeholder='Número de lote'
              onChange={(e) => handleLoteChange('lotesPrima', index, 'lote', e.target.value)}
            />
            <InputNormal
              tipo="number"
              value={lote.peso}
              placeholder='Peso'
              onChange={(e) => handleLoteChange('lotesPrima', index, 'peso', e.target.value)}
            />
          </div>
        ))}
        
        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Guardar cambios' : 'Agregar producto'}
          style={{ marginTop: 'auto' }}
        />
      </div>
    </ViewModal>
  );
}

export default Formulario;