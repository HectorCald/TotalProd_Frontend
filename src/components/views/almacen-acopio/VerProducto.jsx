import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import pdfIcon from '../../../assets/pdf.png';
import excelIcon from '../../../assets/xls.png';
import EditarAgregar from './EditarAgregar';
import productsAcopioService from '../../../services/productsAcopioService';

function VerRegistro({ isOpen, setIsOpen, registro, onProductUpdated, onProductDeleted }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isDescargarOpen, setIsDescargarOpen] = useState(false);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {registro?.name}
                    <div className={styles.iconButton} >
                        <button className={styles.iconButton} onClick={() => setIsDeleteOpen(true)}>
                            <BoxIcon
                                name='trash'
                                className={styles.iconTrash}
                            />
                        </button>
                        <button className={styles.iconButton} onClick={() => setIsEditarOpen(true)}>
                            <BoxIcon
                                name='edit'
                                className={styles.icon}
                            />
                        </button>
                    </div>
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
                <div className={styles.content}>
                    <Dato
                        label="Descripción"
                        value={registro?.description || 'Sin descripción'}
                    />
                    <Dato
                        label="Cantidad"
                        value={`${registro?.quantity || 0} ${registro?.type_measure?.code || ''}`}
                    />
                    <Dato
                        label="Tipo de medida"
                        value={registro?.type_measure?.name || 'No especificado'}
                    />
                    <Dato
                        label="Categoría"
                        value={registro?.category?.name || 'Sin categoría'}
                    />
                </div>
            </div>

            {/* Modal de eliminar*/}
            <ViewModal isOpen={isDeleteOpen} setIsOpen={setIsDeleteOpen}>
                <HeaderModal
                    title="Eliminar"
                    onClose={() => setIsDeleteOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estás seguro que deseas eliminar el producto "{registro?.name}" ? Esta acción no se puede deshacer y podria afectar a registros relacionados.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Si, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={async () => {
                                try {
                                    const response = await productsAcopioService.delete(registro.id);
                                    if (response.success) {
                                        onProductDeleted(registro.id);
                                        setIsDeleteOpen(false);
                                        setIsOpen(false);
                                    }
                                } catch (error) {
                                    console.error('Error al eliminar producto:', error);
                                }
                            }}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsDeleteOpen(false)}
                        />
                    </div>

                </div>
            </ViewModal>
            {/* Modal de editar*/}
            <EditarAgregar 
                isOpen={isEditarOpen} 
                setIsOpen={setIsEditarOpen} 
                data={registro} 
                tipo='editar'
                onProductUpdated={onProductUpdated}
            />
        </View>
    );
}
export default VerRegistro;