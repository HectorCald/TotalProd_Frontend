import React, { useState, useEffect } from 'react';
import ViewModal from './ViewModal';
import HeaderModal from '../common/HeaderModal';
import Boton from '../common/Boton';
import InputNormal from '../common/InputNormal';
import styles from '../../styles/Inicial.module.css';
import pdfIcon from '../../assets/pdf.png';
import excelIcon from '../../assets/xls.png';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function ModalDescarga({ 
    isOpen, 
    setIsOpen, 
    titulo = "Descargar", 
    subtitulo = "Selecciona el formato que prefieras para descargar.",
    informacionSuperior = {},
    tablaHeaders = [],
    tablaValores = [],
    nombreArchivo = "Descargar Movimiento",
    loading = false,
    onExcel,
    onPDF,
    autoDownloadType = null,
    onAutoDownloadDone
}) {
    const [nombreArchivoState, setNombreArchivoState] = useState(nombreArchivo);

    // Actualizar el estado cuando cambie la prop
    useEffect(() => {
        setNombreArchivoState(nombreArchivo);
    }, [nombreArchivo]);

    const handleDescargaExcel = () => {
        try {
            // Crear un nuevo workbook
            const workbook = XLSX.utils.book_new();
            
            // Crear datos combinados (título + información superior + tabla)
            const allData = [];
            
            // 1. Título
            allData.push([nombreArchivoState]);
            allData.push([]); // Línea vacía
            
            // 2. Información superior (en 2 columnas)
            const keys = Object.keys(informacionSuperior);
            
            for (let i = 0; i < keys.length; i += 2) {
                const row = [];
                row.push(`${keys[i]}: ${informacionSuperior[keys[i]]}`);
                
                if (i + 1 < keys.length) {
                    row.push(`${keys[i + 1]}: ${informacionSuperior[keys[i + 1]]}`);
                } else {
                    row.push('');
                }
                allData.push(row);
            }
            
            // 3. Líneas vacías para separar
            allData.push([]);
            allData.push([]);
            
            // 4. Tabla de productos
            if (tablaHeaders.length > 0 && tablaValores.length > 0) {
                allData.push(tablaHeaders);
                allData.push(...tablaValores);
            }
            
            // Crear worksheet con todos los datos
            const worksheet = XLSX.utils.aoa_to_sheet(allData);
            
            // Configurar el ancho de las columnas (auto-fit)
            const colWidths = [];
            const maxCols = Math.max(
                keys.length > 0 ? 2 : 0, // Para información superior
                tablaHeaders.length // Para tabla
            );
            
            // Calcular ancho automático para cada columna
            for (let i = 0; i < maxCols; i++) {
                let maxWidth = 10; // Ancho mínimo
                
                // Revisar todas las filas para encontrar el contenido más largo
                for (let rowIndex = 0; rowIndex < allData.length; rowIndex++) {
                    const cellValue = allData[rowIndex][i];
                    if (cellValue && cellValue.toString().length > maxWidth) {
                        maxWidth = Math.min(cellValue.toString().length + 2, 50); // Máximo 50 caracteres
                    }
                }
                
                colWidths.push({ wch: maxWidth });
            }
            worksheet['!cols'] = colWidths;
            
            // Aplicar estilos a los headers de la tabla
            if (tablaHeaders.length > 0) {
                const headerRowIndex = allData.length - tablaValores.length - 1; // Fila de headers
                
                // Estilo para headers (fondo azul, texto blanco, negrita)
                for (let i = 0; i < tablaHeaders.length; i++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: i });
                    if (!worksheet[cellAddress]) worksheet[cellAddress] = { v: tablaHeaders[i] };
                    
                    worksheet[cellAddress].s = {
                        fill: { fgColor: { rgb: "428BCA" } }, // Color azul como en PDF
                        font: { 
                            color: { rgb: "FFFFFF" }, // Texto blanco
                            bold: true 
                        },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                }
            }
            
            // Estilo para el título (negrita y centrado)
            if (allData.length > 0) {
                const titleCellAddress = XLSX.utils.encode_cell({ r: 0, c: 0 });
                if (!worksheet[titleCellAddress]) worksheet[titleCellAddress] = { v: allData[0][0] };
                
                worksheet[titleCellAddress].s = {
                    font: { bold: true, size: 16 },
                    alignment: { horizontal: "center" }
                };
            }
            
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
            
            // Generar y descargar archivo
            XLSX.writeFile(workbook, `${nombreArchivoState.replace(/\s+/g, '_')}.xlsx`);
        } catch (error) {
            console.error('Error generando Excel:', error);
        }
    };

    const handleDescargaPDF = () => {
        try {
            const doc = new jsPDF();
            
            // Título centrado
            doc.setFontSize(16);
            const pageWidth = doc.internal.pageSize.getWidth();
            const textWidth = doc.getTextWidth(nombreArchivoState);
            const xPosition = (pageWidth - textWidth) / 2;
            doc.text(nombreArchivoState, xPosition, 20);
            
            // Información superior
            let yPosition = 35;
            const keys = Object.keys(informacionSuperior);
            
            doc.setFontSize(10);
            for (let i = 0; i < keys.length; i += 2) {
                const leftText = `${keys[i]}: ${informacionSuperior[keys[i]]}`;
                doc.text(leftText, 20, yPosition);
                
                if (i + 1 < keys.length) {
                    const rightText = `${keys[i + 1]}: ${informacionSuperior[keys[i + 1]]}`;
                    doc.text(rightText, 110, yPosition);
                }
                yPosition += 8;
            }
            
            // Tabla
            if (tablaHeaders.length > 0 && tablaValores.length > 0) {
                autoTable(doc, {
                    startY: yPosition + 5,
                    head: [tablaHeaders],
                    body: tablaValores,
                    theme: 'grid',
                    headStyles: { fillColor: [66, 139, 202] },
                    styles: { fontSize: 8 }
                });

                // Agregar total debajo de la tabla si es un movimiento de almacén
                const finalY = doc.lastAutoTable.finalY || (yPosition + 5);
                
                // Verificar si hay información de total en los datos superiores
                const totalInfo = Object.entries(informacionSuperior).find(([key, value]) => 
                    key === 'Total' && value && value.toString().includes('Bs.')
                );
                
                if (totalInfo) {
                    doc.setFontSize(10);
                    doc.setTextColor(0, 0, 0); // Resetear color a negro
                    doc.setFont(undefined, 'bold'); // Negrita para el total
                    
                    const totalText = `Total: ${totalInfo[1]}`;
                    const totalTextWidth = doc.getTextWidth(totalText);
                    const totalXPosition = pageWidth - totalTextWidth - 20; // Alineado a la derecha con margen
                    const totalYPosition = finalY + 15; // 15px debajo de la tabla
                    
                    doc.text(totalText, totalXPosition, totalYPosition);
                }
            }
            
            // Pie de página
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(9);
            doc.setFont(undefined, 'italic'); // Cursiva
            doc.setTextColor(128, 128, 128); // Color gris
            
            // TotalProd
            const footerText = 'TotalProd';
            const footerTextWidth = doc.getTextWidth(footerText);
            const footerXPosition = (pageWidth - footerTextWidth) / 2; // Centrado
            const footerYPosition = pageHeight - 15; // 15px desde abajo
            
            // Texto descriptivo
            const descText = 'Fue generado por la app de TotalProd - Gestión de Procesos y Ventas';
            const descTextWidth = doc.getTextWidth(descText);
            const descXPosition = (pageWidth - descTextWidth) / 2; // Centrado
            const descYPosition = pageHeight - 8; // 8px desde abajo
            
            doc.text(footerText, footerXPosition, footerYPosition);
            doc.text(descText, descXPosition, descYPosition);
            
            // Descargar archivo
            doc.save(`${nombreArchivoState.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error generando PDF:', error);
        }
    };

    // Auto-disparar descarga si se solicita desde afuera
    useEffect(() => {
        if (!autoDownloadType) return;
        try {
            if (autoDownloadType === 'excel') {
                handleDescargaExcel();
            } else if (autoDownloadType === 'pdf') {
                handleDescargaPDF();
            }
        } finally {
            if (onAutoDownloadDone) onAutoDownloadDone();
        }
    }, [autoDownloadType]);

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title={titulo}
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>{subtitulo}</p>

                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <InputNormal
                        label="Nombre del archivo"
                        value={nombreArchivoState}
                        onChange={(e) => setNombreArchivoState(e.target.value)}
                        placeholder="Ingresa el nombre del archivo"
                        style={{ width: '300px' }}
                        icon="file"
                    />
                </div>

                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Archivo Excel'
                        style={{ marginTop: 'auto' }}
                        icon={excelIcon}
                        onClick={onExcel || handleDescargaExcel}
                        loading={loading}
                        disabled={loading}
                    />
                    <Boton
                        className='btn-default'
                        label='Archivo PDF'
                        style={{ marginTop: 'auto' }}
                        icon={pdfIcon}
                        onClick={onPDF || handleDescargaPDF}
                        loading={loading}
                        disabled={loading}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalDescarga;
