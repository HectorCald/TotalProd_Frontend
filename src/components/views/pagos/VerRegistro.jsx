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

function VerRegistro({ isOpen, setIsOpen, registro }) {
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isDescargarOpen, setIsDescargarOpen] = useState(false);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {registro?.concepto}
                    <button className={styles.iconButton} onClick={() => setIsAnularOpen(true)}>
                        <BoxIcon
                            name='no-entry'
                            className={styles.iconTrash}
                        />
                    </button>
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN</p>
                <div className={styles.content}>
                    <Dato label="Fecha" value={registro?.fecha} />
                    <Dato label="Monto" value={'Bs. ' + registro?.monto} especial='orange' />
                    <Dato label="Beneficiario" value={registro?.beneficiario} />
                    <Dato label="Pagador" value={registro?.pagador} />
                    <Dato label="Tipo" value={registro?.tipo} />
                    <Dato label="Estado" value={registro?.estado} especial={registro?.estado === 'Completado' ? 'green' : registro?.estado === 'Anulado' ? 'red' : ''} />
                    <Dato label="Observaciones" value={registro?.observaciones} />
                </div>
                <Boton
                    className='btn-default'
                    label='Descargar Comprobante'
                    style={{ marginTop: 'auto' }}
                    onClick={() => setIsDescargarOpen(true)}
                />
            </div>

            {/* Modal de Anular*/}
            <ViewModal isOpen={isAnularOpen} setIsOpen={setIsAnularOpen}>
                <HeaderModal
                    title="Anular"
                    onClose={() => setIsAnularOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estás seguro que deseas anular el registro "{registro?.concepto}" ? Esta acción no se puede deshacer y el registro cambiara a estado "Anulado".</p>
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
                    <p className={styles.subTitle}>Selecciona el formato que prefieras para descargar el comprobante.</p>
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