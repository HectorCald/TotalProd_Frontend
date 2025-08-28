import React, { useState, useEffect } from 'react';
import styles from './EditarAgregar.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';

function EditarAgregar({ isOpen, setIsOpen, usuario = '', tipo}) {

    const [dataEdit, setDataEdit] = useState(usuario);

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal title={tipo==='agregar'? 'Nuevo cliente': 'Editar'} onClose={() => setIsOpen(false)}/>
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>INFORMACION PERSONAL</p>
                <InputNormal
                    tipo="text"
                    value={dataEdit.nombre}
                    placeholder='Nombre completo'
                    onChange={(e) => setDataEdit({ ...dataEdit, nombre: e.target.value })}
                />
                <InputNormal
                    tipo="number"
                    value={dataEdit.telefono}
                    placeholder='Número de teléfono'
                    onChange={(e) => setDataEdit({ ...dataEdit, telefono: e.target.value })}
                />
                <p className={styles.subTitle}>UBICACIÓN</p>
                <InputNormal
                    tipo="text"
                    value={dataEdit.pais}
                    placeholder='Pais'
                    onChange={(e) => setDataEdit({ ...dataEdit, pais: e.target.value })}
                />
                <InputNormal
                    tipo="text"
                    value={dataEdit.ciudad}
                    placeholder='Ciudad'
                    onChange={(e) => setDataEdit({ ...dataEdit, ciudad: e.target.value })}
                />
                <InputNormal
                    tipo="text"
                    value={dataEdit.direccion}
                    placeholder='Dirección'
                    onChange={(e) => setDataEdit({ ...dataEdit, direccion: e.target.value })}
                />
                <Boton
                    className='btn-original'
                    label='Guardar'
                    style={{ marginTop: 'auto' }}
                />
            </div>
        </ViewModal>
    );
}
export default EditarAgregar;