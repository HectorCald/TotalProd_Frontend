import React, { useState, useEffect } from 'react';
import styles from './VerCliente.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';

function VerCliente({ isOpen, setIsOpen, usuario }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleEliminar = (id) => {
        console.log('Eliminar cliente con id:', id);
        // Aquí iría la lógica para eliminar el cliente
        setIsDeleteOpen(false);
        setIsOpen(false);
    }

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {usuario?.nombre}
                    <div className={styles.iconButton} >
                        <button className={styles.iconButton} onClick={() => setIsDeleteOpen(true)}>
                            <BoxIcon
                                name='trash'
                                className={styles.iconTrash}
                            />
                        </button>

                        <button className={styles.iconButton} onClick={() => setIsEditOpen(true)}>
                            <BoxIcon
                                name='edit'
                                className={styles.icon}
                            />
                        </button>
                    </div>

                </h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato label="Nombre completo" value={usuario?.nombre} />
                    <Dato label="Teléfono" value={usuario?.telefono} />
                </div>
                <p className={styles.subTitle}>UBICACIÓN</p>
                <div className={styles.content}>
                    <Dato label="Pais" value={usuario?.pais} />
                    <Dato label="Ciudad" value={usuario?.ciudad} />
                    <Dato label="Dirección" value={usuario?.direccion} />
                </div>
                <p className={styles.subTitle}>PEDIDOS</p>
                <div className={styles.content}>
                    <Dato label="Total pedidos" value={usuario?.totalPedidos} />
                    <Dato label="Total dinero" value={'Bs. ' + usuario?.totalDinero} />
                </div>
            </div>

            {/* Modal de Editar*/}
            <EditarAgregar isOpen={isEditOpen} setIsOpen={setIsEditOpen} usuario={usuario} tipo='editar'/>



            {/* Modal de Eliminar*/}
            <ViewModal isOpen={isDeleteOpen} setIsOpen={setIsDeleteOpen}>
                <HeaderModal
                    title="Eliminar"
                    onClose={() => setIsDeleteOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estás seguro que deseas eliminar al cliente {usuario?.nombre} ? Esta acción no se puede deshacer.</p>
                    <Boton
                        className='btn-red'
                        label='Si, eliminar'
                        style={{ marginTop: 'auto' }}
                        onClick={()=> handleEliminar(usuario?.id)}
                    />
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsDeleteOpen(false)}
                    />
                </div>
            </ViewModal>

        </View>
    );
}
export default VerCliente;