import React, { useState, useEffect } from 'react';
import styles from './VerProveedor.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import MensajeError from '../../common/MensajeError';

function EditarAgregar({ isOpen, setIsOpen, usuario = '', tipo }) {
    const [dataEdit, setDataEdit] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        pais: '',
        ciudad: '',
    });

    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (usuario) {
            setDataEdit(usuario);
        } else {
            setDataEdit({
                nombre: '',
                telefono: '',
                direccion: '',
                pais: '',
                ciudad: '',
            });
        }
    }, [isOpen]);

    const handleAgregaCliente = () => {
        if (!dataEdit.nombre.trim()) {
            setErrorMessage('El nombre es obligatorio');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }
        if (!dataEdit.ciudad.trim()) {
            setErrorMessage('La ciudad es obligatoria');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }
        console.log(dataEdit);
        setIsOpen(false);
        // Limpiar el mensaje de error si todo está bien
        setErrorMessage('');
        // Aquí puedes continuar con la lógica de guardar
    }

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title={tipo === 'agregar' ? 'Nuevo proveedor' : 'Editar'}
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <MensajeError mensaje={errorMessage} />
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
                    placeholder='Celular'
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
                    label={tipo === 'agregar' ? 'Agregar' : 'Guardar'}
                    style={{ marginTop: 'auto' }}
                    onClick={handleAgregaCliente}
                />

            </div>
        </ViewModal>
    );
}
export default EditarAgregar;