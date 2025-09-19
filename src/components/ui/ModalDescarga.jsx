import React from 'react';
import ViewModal from './ViewModal';
import HeaderModal from '../common/HeaderModal';
import Boton from '../common/Boton';
import styles from '../../styles/Inicial.module.css';
import pdfIcon from '../../assets/pdf.png';
import excelIcon from '../../assets/xls.png';


function ModalDescarga({ isOpen, setIsOpen, titulo = "Descargar", subtitulo = "Selecciona el formato que prefieras para descargar." }) {

    const handleDescargaExcel = () => {
        // Aquí puedes agregar la lógica para descargar Excel
        console.log('Descargando Excel...');
        setIsOpen(false);
    };
    const handleDescargaPDF = () => {
        // Aquí puedes agregar la lógica para descargar PDF
        console.log('Descargando PDF...');
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title={titulo}
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>{subtitulo}</p>

                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Archivo Excel'
                        style={{ marginTop: 'auto' }}
                        icon={excelIcon}
                        onClick={handleDescargaExcel}
                    />
                    <Boton
                        className='btn-default'
                        label='Archivo PDF'
                        style={{ marginTop: 'auto' }}
                        icon={pdfIcon}
                        onClick={handleDescargaPDF}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalDescarga;
