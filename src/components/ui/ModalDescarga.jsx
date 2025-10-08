import React, { useState, useEffect } from 'react';
import ViewModal from './ViewModal';
import HeaderModal from '../common/HeaderModal';
import Boton from '../common/Boton';
import InputNormal from '../common/InputNormal';
import styles from '../../styles/Inicial.module.css';
import pdfIcon from '../../assets/pdf.png';
import excelIcon from '../../assets/xls.png';
import * as XLSX from 'xlsx';
import { pdf as pdfRenderer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

function ModalDescarga({ 
    isOpen, 
    setIsOpen, 
    titulo = "Descargar", 
    subtitulo = "Selecciona el formato que prefieras para descargar.",
    informacionSuperior = {},
    tablaHeaders = [],
    tablaValores = [],
    tablas = null, // [{ titulo?: string, headers: string[], valores: string[][] }]
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
            
            // 4. Tablas
            if (Array.isArray(tablas) && tablas.length > 0) {
                tablas.forEach((seccion, idx) => {
                    allData.push([]);
                    if (seccion.titulo) allData.push([seccion.titulo]);
                    if (seccion.headers && seccion.headers.length > 0) {
                        allData.push(seccion.headers);
                    }
                    if (seccion.valores && seccion.valores.length > 0) {
                        allData.push(...seccion.valores);
                    }
                    if (idx !== tablas.length - 1) allData.push([]);
                });
            } else if (tablaHeaders.length > 0 && tablaValores.length > 0) {
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
            
            // Aplicar estilos básicos al primer header encontrado (mejoras futuras: estilos por sección)
            // Opcional: omitir si no hay headers
            
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

    const handleDescargaPDF = async () => {
        try {
            const styles = StyleSheet.create({
                page: { paddingTop: 30, paddingBottom: 36, paddingHorizontal: 36 },
                title: { textAlign: 'center', fontSize: 15, fontWeight: 700, marginBottom: 8 },
                infoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
                infoBox: { width: '49%', borderWidth: 1, borderRadius: 8, borderColor: '#000', paddingVertical: 6, paddingHorizontal: 8 },
                infoItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
                infoLabel: { fontSize: 10, fontWeight: 700 },
                infoValue: { fontSize: 10, textAlign: 'right' },
                headerBox: { borderWidth: 1.2, borderRadius: 8, borderColor: '#000', paddingVertical: 3, paddingHorizontal: 8, marginTop: 6, height: 22, justifyContent: 'center' },
                headerRow: { flexDirection: 'row', alignItems: 'center' },
                row: { flexDirection: 'row', marginTop: 6 },
                headerCell: { fontSize: 9, fontWeight: 700 },
                headerLast: { paddingLeft: 0 },
                cellText: { fontSize: 9 },
                contentPad: { paddingHorizontal: 8 },
                separator: { borderTopWidth: 1, borderColor: '#000', marginTop: 6, marginBottom: 4 },
                totalLabel: { fontSize: 10, fontWeight: 700, textAlign: 'right' },
                totalValue: { fontSize: 10, fontWeight: 700 },
                footer: { position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' },
                footerLine1: { fontSize: 9, color: '#888', marginBottom: 2, textAlign: 'center' },
                footerLine2: { fontSize: 9, color: '#888', textAlign: 'center' }
            });

            // Ordenar y dividir sin zigzag: primero mitad izquierda, luego mitad derecha
            const preferredOrder = [
                'Responsable','Tipo','Fecha','Hora','Estado','Sucursal',
                'Método de Pago','Cliente','Proveedor','Órdenes del Cliente','Órdenes del Proveedor',
                'Tipo de Precio','Costo','Restar Ingredientes','Observaciones','Venta N°','Entrega N°','Total'
            ];
            const entriesAll = Object.entries(informacionSuperior || {});
            const entriesSorted = entriesAll.sort((a, b) => {
                const ia = preferredOrder.indexOf(a[0]);
                const ib = preferredOrder.indexOf(b[0]);
                if (ia === -1 && ib === -1) return 0;
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
            });
            const mid = Math.ceil(entriesSorted.length / 2);
            const leftEntries = entriesSorted.slice(0, mid);
            const rightEntries = entriesSorted.slice(mid);

            const getWidthsPct = (headers) => {
                if (!headers || headers.length === 0) return [];
                if (headers.length === 8) return ['9%', '43%', '8%', '8%', '14%', '6%', '6%', '6%'];
                if (headers.length === 4) return ['46%', '18%', '18%', '18%'];
                return new Array(headers.length).fill(`${Math.floor(100 / headers.length)}%`);
            };

            const doc = (
                <Document>
                    <Page size="A4" style={styles.page}>
                        <Text style={styles.title}>{nombreArchivoState}</Text>

                        <View style={styles.infoContainer}>
                            <View style={styles.infoBox}>
                                {leftEntries.map(([k, v], i) => (
                                    <View key={i} style={styles.infoItemRow}>
                                        <Text style={styles.infoLabel}>{`${k}:`}</Text>
                                        <Text style={styles.infoValue}>{String(v)}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.infoBox}>
                                {rightEntries.map(([k, v], i) => (
                                    <View key={i} style={styles.infoItemRow}>
                                        <Text style={styles.infoLabel}>{`${k}:`}</Text>
                                        <Text style={styles.infoValue}>{String(v)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {Array.isArray(tablas) && tablas.length > 0 ? (
                            tablas.map((seccion, sIdx) => {
                                const widths = getWidthsPct(seccion.headers || []);
                                return (
                                    <View key={sIdx}>
                                        {(seccion.titulo) && (
                                            <View style={{ marginTop: 8, marginBottom: 2 }}>
                                                <Text style={{ fontSize: 10, fontWeight: 700 }}>{String(seccion.titulo)}</Text>
                                            </View>
                                        )}
                                        {seccion.headers && seccion.headers.length > 0 && (
                                            <View style={[styles.headerBox, styles.contentPad]}>
                                                <View style={styles.headerRow}>
                                                    {seccion.headers.map((h, idx) => (
                                                        <View key={idx} style={{ width: widths[idx] }}>
                                                            <Text style={[styles.headerCell, idx === seccion.headers.length - 1 ? styles.headerLast : null]}>{String(h)}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                        {seccion.valores && seccion.valores.length > 0 && (
                                            <View style={styles.contentPad}>
                                                {seccion.valores.map((row, rIdx) => (
                                                    <View key={rIdx} style={styles.row}>
                                                        {row.map((cell, cIdx) => (
                                                            <View key={cIdx} style={{ width: widths[cIdx] }}>
                                                                <Text style={styles.cellText}>{cell != null ? String(cell) : ''}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        ) : (
                            <>
                                {tablaHeaders.length > 0 && (
                                    <View style={[styles.headerBox, styles.contentPad]}>
                                        <View style={styles.headerRow}>
                                            {tablaHeaders.map((h, idx) => (
                                                <View key={idx} style={{ width: getWidthsPct(tablaHeaders)[idx] }}>
                                                    <Text style={[styles.headerCell, idx === tablaHeaders.length - 1 ? styles.headerLast : null]}>{String(h)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                {tablaValores.length > 0 && (
                                    <View style={styles.contentPad}>
                                        {tablaValores.map((row, rIdx) => (
                                            <View key={rIdx} style={styles.row}>
                                                {row.map((cell, cIdx) => (
                                                    <View key={cIdx} style={{ width: getWidthsPct(tablaHeaders)[cIdx] }}>
                                                        <Text style={styles.cellText}>{cell != null ? String(cell) : ''}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}

                        {informacionSuperior && informacionSuperior.Total && (
                            <>
                                <View style={[styles.contentPad, styles.separator]} />
                                <View style={[styles.contentPad, styles.row]}>
                                    {(() => {
                                        const currentWidths = Array.isArray(tablas) && tablas.length > 0 
                                            ? getWidthsPct(tablas[tablas.length - 1].headers || [])
                                            : getWidthsPct(tablaHeaders);
                                        return currentWidths.slice(0, currentWidths.length - 2).map((w, i) => (
                                            <View key={i} style={{ width: w }} />
                                        ));
                                    })()}
                                    {/* Columna de etiqueta (alineada a la derecha) */}
                                    <View style={{ 
                                        width: (() => {
                                            const currentWidths = Array.isArray(tablas) && tablas.length > 0 
                                                ? getWidthsPct(tablas[tablas.length - 1].headers || [])
                                                : getWidthsPct(tablaHeaders);
                                            return currentWidths[currentWidths.length - 2];
                                        })(), 
                                        paddingRight: 6 
                                    }}>
                                        <Text style={styles.totalLabel}>Total:</Text>
                                    </View>
                                    {/* Columna de valor (alineada a la derecha) */}
                                    <View style={{ 
                                        width: (() => {
                                            const currentWidths = Array.isArray(tablas) && tablas.length > 0 
                                                ? getWidthsPct(tablas[tablas.length - 1].headers || [])
                                                : getWidthsPct(tablaHeaders);
                                            return currentWidths[currentWidths.length - 1];
                                        })()
                                    }}>
                                        <Text style={styles.totalValue}>{String(informacionSuperior.Total)}</Text>
                                    </View>
                                </View>
                            </>
                        )}
                        {/* Pie de página fijo */}
                        <View style={styles.footer} fixed>
                            <Text style={styles.footerLine1}>TotalProd</Text>
                            <Text style={styles.footerLine2}>Generado por TotalProd - aplicación de gestión de procesos y ventas</Text>
                        </View>
                    </Page>
                </Document>
            );

            const blob = await pdfRenderer(doc).toBlob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${nombreArchivoState.replace(/\s+/g, '_')}.pdf`;
            link.click();
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
