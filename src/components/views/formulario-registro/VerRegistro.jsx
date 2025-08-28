import React, { useState, useEffect } from 'react';
import styles from './VerRegistro.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import pdfIcon from '../../../assets/pdf.png';
import excelIcon from '../../../assets/xls.png';
import Carousel from '../../common/Carousel';
import Formulario from './Formulario';

function VerRegistro({ isOpen, setIsOpen, registro }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
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
                        <button className={styles.iconButton} onClick={() => setIsAnularOpen(true)}>
                            <BoxIcon
                                name='no-entry'
                                className={styles.icon}
                            />
                        </button>
                        <button className={styles.iconButton} onClick={() => setIsEditOpen(true)}>
                            <BoxIcon
                                name='edit'
                                className={styles.iconEdit}
                            />
                        </button>
                    </div>

                </h1>
                <Carousel>
                    <div>
                        <p className={styles.subTitle}>INFORMACIÓN</p>
                        <div className={styles.content}>
                            <Dato label="Fecha" value={registro?.fecha} />
                            <Dato label="Gramaje" value={registro?.gramaje + ' gr.'} especial='orange' />
                            <Dato label="Lote" value={registro?.lote} />
                            <Dato label="Proceso" value={registro?.proceso} />
                            <Dato label="Microondas" value={registro?.microondas} />
                            <Dato label="Terminados" value={registro?.envasesTerminados} />
                            <Dato label="Vencimiento" value={registro?.fechaVencimiento} />
                        </div>
                    </div>
                    <div>
                        <p className={styles.subTitle}>VERIFICACIÓN</p>
                        <div className={styles.content}>
                            <Dato label="Fecha" value={registro?.fechaVerificación} />
                            <Dato label="Cantidad" value={registro?.cantidadVerificada} />
                            <Dato label="Observaciones" value={registro?.observaciones} />
                        </div>
                    </div>

                </Carousel>
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
                    <p className={styles.subTitle}>¿Estás seguro que deseas eliminar el registro "{registro?.producto}" ? Esta acción no se puede deshacer y la materia prima se devolvera a ACOPIO.</p>
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
            {/* Modal de anular*/}
            <ViewModal isOpen={isAnularOpen} setIsOpen={setIsAnularOpen}>
                <HeaderModal
                    title="Anular"
                    onClose={() => setIsAnularOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estás seguro que deseas anular el registro "{registro?.producto}" ? Esta acción no se puede deshacer y el registro cambiara a estado "Pendiente" si se cosumio materia prima se devolvera a ACOPIO.</p>
                    <Boton
                        className='btn-red'
                        label='Si, anular'
                        style={{ marginTop: 'auto' }}
                    />
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsAnularOpen(false)}
                    />
                </div>
            </ViewModal>
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
            <Formulario isOpen={isEditOpen} setIsOpen={setIsEditOpen} data={registro} tipo='editar' />
        </View>
    );
}
export default VerRegistro;