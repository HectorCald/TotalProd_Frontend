import React, { useState, useEffect } from 'react';
import styles from './VerProducto.module.css';
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

function VerRegistro({ isOpen, setIsOpen, registro }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isDescargarOpen, setIsDescargarOpen] = useState(false);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {registro?.producto}
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
                <p className={styles.subTitle}>MATERIA BRUTA</p>
                <div className={styles.content}>
                    {registro?.lotesBruto?.map((lote, index) => (
                        <Dato
                            key={index}
                            label={`Lote ${lote.lote}`}
                            value={`${lote.peso} kg`}
                        />
                    ))}
                </div>

                <p className={styles.subTitle}>MATERIA PRIMA</p>
                <div className={styles.content}>
                    {registro?.lotesPrima?.map((lote, index) => (
                        <Dato
                            key={index}
                            label={`Lote ${lote.lote}`}
                            value={`${lote.peso} kg`}
                        />
                    ))}
                </div>

                <Boton
                    className='btn-default'
                    label='Descargar registro'
                    style={{ marginTop: 'auto' }}
                    onClick={() => setIsDescargarOpen(true)}
                />
            </div>

            {/* Modal de eliminar*/}
            <ViewModal isOpen={isDeleteOpen} setIsOpen={setIsDeleteOpen}>
                <HeaderModal
                    title="Eliminar"
                    onClose={() => setIsDeleteOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estás seguro que deseas eliminar el producto "{registro?.producto}" ? Esta acción no se puede deshacer y podria afectar a registros relacionados.</p>
                    <Boton
                        className='btn-red'
                        label='Si, eliminar'
                        style={{ marginTop: 'auto' }}
                    />
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsDeleteOpen(false)}
                    />
                </div>
            </ViewModal>
            {/* Modal de editar*/}
            <EditarAgregar isOpen={isEditarOpen} setIsOpen={setIsEditarOpen} data={registro} tipo='editar' />

            {/* Modal de descargar*/}
            <ViewModal isOpen={isDescargarOpen} setIsOpen={setIsDescargarOpen}>
                <HeaderModal
                    title="Descargar"
                    onClose={() => setIsDescargarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona el formato que prefieras para descargar el registro.</p>
                    <Boton
                        className='btn-default'
                        label='Archivo Excel'
                        style={{ marginTop: 'auto' }}
                        icon={excelIcon}
                    />
                    <Boton
                        className='btn-default'
                        label='Archivo PDF'
                        style={{ marginTop: 'auto' }}
                        icon={pdfIcon}
                    />
                </div>
            </ViewModal>
        </View>
    );
}
export default VerRegistro;