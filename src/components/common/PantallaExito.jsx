import React, { useState, useEffect } from 'react';
import styles from './PantallaExito.module.css';
import View from '../ui/View';
import HeaderView from './HeaderView';
import Boton from './Boton';
import { BoxIcon } from 'boxicons-react';
import checkGif from '../../assets/check.gif';
import pdfIcon from '../../assets/pdf.png';
import excelIcon from '../../assets/xls.png';
import whatsappIcon from '../../assets/whatsapp.png';

function PantallaExito({
    isOpen,
    setIsOpen,
    titulo,
    descripcion,
    datosPedido = [],
    onDescargarPDF,
    onDescargarExcel,
    onEnviarWhatsapp,
    onCerrar
}) {
    const [mostrarSpinner, setMostrarSpinner] = useState(true);
    const [mostrarCheck, setMostrarCheck] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Mostrar spinner por 2 segundos
            setMostrarSpinner(true);
            setMostrarCheck(false);

            const timer = setTimeout(() => {
                setMostrarCheck(true);
                setTimeout(() => {
                    setMostrarSpinner(false);
                }, 1000);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleCerrar = () => {
        setIsOpen(false);
        if (onCerrar) {
            onCerrar();
        }
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={handleCerrar} />
            <div className={styles.container}>
                <div className={styles.content}>
                    {/* Contenedor fijo para spinner y check */}
                    <div className={styles.animationContainer}>
                        {/* Spinner */}
                        {mostrarSpinner && (
                            <div className={styles.spinnerContainer}>
                                <div className={styles.spinner}></div>
                            </div>
                        )}

                        {/* Check GIF */}
                        {mostrarCheck && (
                            <div className={styles.checkContainer}>
                                <img
                                    src={checkGif}
                                    alt="Éxito"
                                    className={styles.checkGif}
                                />
                            </div>
                        )}
                    </div>

                    {/* Título */}
                    <h1 className={styles.titulo}>
                        {titulo}
                    </h1>

                    {/* Descripción */}
                    <p className={styles.descripcion}>
                        {descripcion}
                    </p>

                    {/* Resumen del pedido */}
                    {datosPedido.length > 0 && (
                        <div className={styles.resumenContainer}>
                            <h3 className={styles.resumenTitulo}>Resumen:</h3>
                            <div className={styles.resumenLista}>
                                {datosPedido.map((item, index) => (
                                    <div key={index} className={styles.resumenItem}>
                                        <BoxIcon name='box' className={styles.itemIcon} />
                                        <div className={styles.itemInfo}>
                                            <span className={styles.itemNombre}>{item.nombre}</span>
                                            <span className={styles.itemDetalle}>
                                                {item.cantidad} {item.medida}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Botones de descarga */}
                    <div className={styles.botonesContainer}>
                        <Boton
                            className='btn-default'
                            label='Descargar PDF'
                            icon={pdfIcon}
                            onClick={onDescargarPDF}
                        />
                        <Boton
                            className='btn-default'
                            label='Descargar Excel'
                            icon={excelIcon}
                            onClick={onDescargarExcel}
                        />
                        <Boton
                            className='btn-default'
                            label='Enviar WhatsApp'
                            icon={whatsappIcon}
                            onClick={onEnviarWhatsapp}
                        />
                        <Boton
                            className='btn-original'
                            label='Aceptar'
                            onClick={handleCerrar}
                        />
                    </div>
                </div>
            </div>
        </View>
    );
}

export default PantallaExito;
