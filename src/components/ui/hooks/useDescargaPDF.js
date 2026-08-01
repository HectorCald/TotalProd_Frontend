import { pdf as pdfRenderer, Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import useFormatNumber from '../../../hooks/useFormatNumber';

export const useDescargaPDF = ({
    nombreArchivoState,
    tituloDocumentoState,
    informacionSuperior,
    tablaHeaders,
    tablaValores,
    empresaImageBase64,
    displayImage,
    isMobile,
    incluirFirmas,
    incluirLogos,
    separarColumnas,
    columnWidths,
    setIsSubmitting,
    setIsOpen
}) => {
    const { formatPrice } = useFormatNumber();

    const handleDescargaPDF = async () => {
        try {
            const styles = StyleSheet.create({
                page: {
                    paddingTop: 30,
                    paddingBottom: 36,
                    paddingHorizontal: 36,
                    position: 'relative'
                },
                // Marca de agua centrada
                watermarkFixed: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.05,
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                // Estilos para logo y marca de agua
                logoContainer: {
                    position: 'absolute',
                    top: 10, // En la esquina superior
                    left: -140, // En la esquina izquierda
                    width: 50,
                    height: 50,
                    zIndex: 10
                },
                logoImage: {
                    width: '400px',
                    height: '400px',
                    objectFit: 'contain'
                },
                watermark: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 200,
                    height: 200,
                    opacity: 0.03,
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                title: { textAlign: 'center', fontSize: 15, fontWeight: 700, marginBottom: 8 },
                infoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 2 },
                infoBoxLeft: { width: '49%', paddingTop: 6, paddingBottom: 2, paddingHorizontal: 8 },
                infoBoxRight: { width: '49%', paddingTop: 6, paddingBottom: 2, paddingHorizontal: 8 },
                infoItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
                infoLabel: { fontSize: 10, fontWeight: 700 },
                infoValue: { fontSize: 10, textAlign: 'right' },
                headerBox: { paddingVertical: 3, paddingHorizontal: 8, marginTop: 6, height: 22, justifyContent: 'center' },
                headerRow: { flexDirection: 'row', alignItems: 'center' },
                row: { flexDirection: 'row', marginTop: 0, paddingBottom: 2, paddingTop: 2 },
                totalRow: { flexDirection: 'row', paddingVertical: 2 },
                rowWithColumnBorders: { flexDirection: 'row', marginTop: 0, paddingBottom: 2, paddingTop: 2 },
                cellWithBorder: { borderRightWidth: 0.5, borderRightColor: '#888888', paddingRight: 4 },
                headerCell: { fontSize: 10, fontWeight: 900 },
                headerLast: { paddingLeft: 0 },
                cellText: { fontSize: 9 },
                contentPad: { paddingHorizontal: 8 },
                separator: { borderTopWidth: 1, borderTopColor: '#ccc', marginTop: 6, marginBottom: 4 },
                totalLabel: { fontSize: 10, fontWeight: 700, textAlign: 'right' },
                totalValue: { fontSize: 10, fontWeight: 700 },
                footer: { position: 'absolute', left: 0, right: 0, bottom: 10, alignItems: 'center' },
                footerLine1: { fontSize: 9, color: '#888', textAlign: 'center', fontStyle: 'italic', fontWeight: 300 }
            });

            // Ordenar y dividir sin zigzag: primero mitad izquierda, luego mitad derecha
            const preferredOrder = [
                'Responsable', 'Tipo', 'Fecha', 'Hora', 'Estado', 'Sucursal',
                'Método de Pago', 'Cliente', 'Proveedor', 'Órdenes del Cliente', 'Órdenes del Proveedor',
                'Tipo de Precio', 'Costo', 'Restar Ingredientes', 'Observaciones', 'Venta N°', 'Entrega N°', 'Total'
            ];
            const entriesAllRaw = Object.entries(informacionSuperior || {});
            const excluidosArriba = ['Total', 'Descuento', 'Aumento', 'Pagado', 'Saldo pendiente'];
            const entriesAll = entriesAllRaw.filter(([k]) => !excluidosArriba.includes(k));
            
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

            const finalHeaders = tablaHeaders && tablaHeaders.length > 0 ? ['Nro', ...tablaHeaders] : [];
            const finalValores = tablaValores && tablaValores.length > 0 ? tablaValores.map((row, index) => [index + 1, ...row]) : [];

            const getWidthsPct = (headers) => {
                if (!headers || headers.length === 0) return [];

                const getNumericWidth = (header, index) => {
                    if (columnWidths && typeof columnWidths === 'object') {
                        const headerKeys = ['fecha', 'concepto', 'proveedor', 'metodoPago', 'subtotal',
                            'producto', 'entradaGrup', 'entradaUd', 'salidaGrup', 'salidaUd',
                            'tipoMedida', 'entrada', 'salida', 'verificado', 'terminados',
                            'materiaPrima', 'cConsumida'];

                        const headerText = header.toString().toLowerCase();
                        const headerLower = headerText.replace(/[^a-z0-9]/g, '');
                        let matchedKey = null;

                        if (headerText === 'nro' || headerText === 'n°') matchedKey = 'nro';
                        else if (headerText === 'entrada (grup)' || headerText.includes('entrada') && headerText.includes('grup')) matchedKey = 'entradaGrup';
                        else if (headerText === 'entrada (ud)' || headerText.includes('entrada') && headerText.includes('ud') && !headerText.includes('grup')) matchedKey = 'entradaUd';
                        else if (headerText === 'salida (grup)' || headerText.includes('salida') && headerText.includes('grup')) matchedKey = 'salidaGrup';
                        else if (headerText === 'salida (ud)' || headerText.includes('salida') && headerText.includes('ud') && !headerText.includes('grup')) matchedKey = 'salidaUd';

                        if (!matchedKey) {
                            for (const key of headerKeys) {
                                const keyLower = key.toLowerCase();
                                if (headerLower === keyLower || headerLower.includes(keyLower) || keyLower.includes(headerLower)) {
                                    matchedKey = key;
                                    break;
                                }
                            }
                        }

                        if (!matchedKey) {
                            if (headerText.includes('fecha') || headerText === 'fecha') matchedKey = 'fecha';
                            else if (headerText.includes('concepto')) matchedKey = 'concepto';
                            else if (headerText.includes('proveedor')) matchedKey = 'proveedor';
                            else if (headerText.includes('m. pago') || headerText.includes('metodo') || (headerText.includes('pago') && !headerText.includes('subtotal'))) matchedKey = 'metodoPago';
                            else if (headerText.includes('subtotal')) matchedKey = 'subtotal';
                            else if (headerText === 'entrada' && !headerText.includes('(')) matchedKey = 'entrada';
                            else if (headerText === 'salida' && !headerText.includes('(')) matchedKey = 'salida';
                            else if (headerText === 'producto' || headerText.includes('producto')) matchedKey = 'producto';
                        }

                        if (matchedKey === 'nro') return 6;
                        if (matchedKey && columnWidths[matchedKey]) {
                            return parseFloat(columnWidths[matchedKey].toString().replace('%', ''));
                        }
                    }

                    const headerLength = header.toString().length;
                    if (index === 0) return 6;
                    if (index === 1) return 35;
                    const minWidth = Math.max(headerLength + 2, 8);
                    return Math.max((minWidth / 80) * 100, 8);
                };

                const rawWidths = headers.map((header, index) => getNumericWidth(header, index));
                const totalWidth = rawWidths.reduce((sum, w) => sum + w, 0);

                return rawWidths.map(w => `${((w / totalWidth) * 100).toFixed(2)}%`);
            };

            const RenderTotalRow = ({ label, value }) => {
                const currentWidths = getWidthsPct(finalHeaders);
                return (
                    <View style={[styles.contentPad, styles.totalRow]}>
                        {currentWidths.slice(0, currentWidths.length - 2).map((w, i) => (
                            <View key={i} style={{ width: w }} />
                        ))}
                        <View style={{ width: currentWidths[currentWidths.length - 2], paddingRight: 6 }}>
                            <Text style={styles.totalLabel}>{label}</Text>
                        </View>
                        <View style={{ width: currentWidths[currentWidths.length - 1] }}>
                            <Text style={styles.totalValue}>{String(value)}</Text>
                        </View>
                    </View>
                );
            };

            const doc = (
                <Document>
                    <Page size="A4" style={styles.page}>
                        {/* Marca de agua FIJA para todas las páginas automáticas */}
                        {incluirLogos && empresaImageBase64 && (
                            <View style={styles.watermarkFixed} fixed>
                                <Image
                                    src={empresaImageBase64}
                                    style={styles.logoImage}
                                />
                            </View>
                        )}

                        {/* Logo solo en la primera página (sin fixed) */}
                        {incluirLogos && empresaImageBase64 && (
                            <View style={styles.logoContainer}>
                                <Image
                                    src={empresaImageBase64}
                                    style={styles.logoImage}
                                />
                            </View>
                        )}

                        <Text style={styles.title}>{tituloDocumentoState}</Text>

                        <View style={styles.infoContainer}>
                            <View style={styles.infoBoxLeft}>
                                {leftEntries.map(([k, v], i) => (
                                    <View key={i} style={styles.infoItemRow}>
                                        <Text style={styles.infoLabel}>{`${k}:`}</Text>
                                        <Text style={styles.infoValue}>{String(v)}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={{ width: 1, backgroundColor: '#ccc' }} />
                            <View style={styles.infoBoxRight}>
                                {rightEntries.map(([k, v], i) => (
                                    <View key={i} style={styles.infoItemRow}>
                                        <Text style={styles.infoLabel}>{`${k}:`}</Text>
                                        <Text style={styles.infoValue}>{String(v)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={{ borderTopWidth: 1, borderTopColor: '#ccc', marginVertical: 6 }} />
                        {/* Renderizar también la tabla principal si existe (para mostrar totales alineados) */}
                        {finalHeaders.length > 0 && (
                            <View style={[styles.headerBox, styles.contentPad]}>
                                <View style={styles.headerRow}>
                                    {finalHeaders.map((h, idx) => (
                                        <View key={idx} style={{ width: getWidthsPct(finalHeaders)[idx] }}>
                                            <Text style={[styles.headerCell, idx === finalHeaders.length - 1 ? styles.headerLast : null]}>{String(h)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View style={styles.contentPad}>
                            {finalValores.map((row, rIdx) => (
                                <View key={rIdx} style={separarColumnas ? styles.rowWithColumnBorders : styles.row}>
                                    {row.map((cell, cIdx) => (
                                        <View key={cIdx} style={[{ width: getWidthsPct(finalHeaders)[cIdx] }, separarColumnas && cIdx < row.length - 1 ? styles.cellWithBorder : null]}>
                                            <Text style={styles.cellText}>{cell != null ? String(cell) : ''}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>

                        {/* TOTALES (desglose solo si hay aumento o descuento) */}
                        {finalValores.length > 0 && (
                            <>
                                <View style={[styles.contentPad, styles.separator]} />

                                {(() => {
                                    const tieneAumento = informacionSuperior && informacionSuperior.Aumento;
                                    const tieneDescuento = informacionSuperior && informacionSuperior.Descuento;

                                    // Si hay aumento o descuento, mostrar desglose completo
                                    if (tieneAumento || tieneDescuento) {
                                        const subtotalProductos = finalValores.reduce((sum, row) => {
                                            const subtotalStr = row[row.length - 1]?.toString() || '0';
                                            const cleanStr = subtotalStr
                                                .replace(/Bs\.\s*/g, '')
                                                .replace(/\./g, '')
                                                .replace(',', '.')
                                                .trim();
                                            const subtotalNum = parseFloat(cleanStr) || 0;
                                            return sum + subtotalNum;
                                        }, 0);

                                        return (
                                            <>
                                                <RenderTotalRow label="Subtotal:" value={`Bs. ${formatPrice(subtotalProductos)}`} />
                                                {tieneAumento && (
                                                    <RenderTotalRow label="Aumento:" value={informacionSuperior.Aumento} />
                                                )}
                                                {tieneDescuento && (
                                                    <RenderTotalRow label="Descuento:" value={informacionSuperior.Descuento} />
                                                )}
                                            </>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Totales al pie de la tabla principal (Total, Pagado, Saldo pendiente) */}
                                {informacionSuperior && (informacionSuperior.Total || informacionSuperior.Pagado || informacionSuperior['Saldo pendiente']) && (
                                    <>
                                        {['Total', 'Pagado', 'Saldo pendiente'].map((labelKey) => (
                                            informacionSuperior[labelKey] ? (
                                                <RenderTotalRow key={labelKey} label={`${labelKey}:`} value={informacionSuperior[labelKey]} />
                                            ) : null
                                        ))}
                                    </>
                                )}
                            </>
                        )}

                        {/* FIRMAS (si está activado) */}
                        {incluirFirmas && (
                            <>
                                <View style={[styles.contentPad, { marginTop: 20 }]}>
                                    <View style={[styles.row, { marginTop: 20 }]}>
                                        <View style={{ width: '50%', paddingRight: 20 }}>
                                            <Text style={[styles.totalLabel, { textAlign: 'left', marginBottom: 20 }]}>Entregado por:</Text>
                                            <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', height: 30 }} />
                                        </View>
                                        <View style={{ width: '50%', paddingLeft: 20 }}>
                                            <Text style={[styles.totalLabel, { textAlign: 'left', marginBottom: 20 }]}>Recibido por:</Text>
                                            <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', height: 30 }} />
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Pie de página FIJO para todas las páginas */}
                        <View style={styles.footer} fixed>
                            <Text style={styles.footerLine1}>Generado por TotalProd - Aplicación de Gestión de Procesos y Ventas</Text>
                        </View>
                    </Page>
                </Document>
            );

            try {
                const pdfBlob = await pdfRenderer(doc).toBlob();
                const fileName = `${nombreArchivoState.replace(/\s+/g, '_')}.pdf`;

                // Asegurar que el blob tenga el tipo MIME correcto
                const blob = pdfBlob.type === 'application/pdf'
                    ? pdfBlob
                    : new Blob([pdfBlob], { type: 'application/pdf' });

                // Descargar archivo
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                link.click();

                // Intentar compartir usando Web Share API solo en móvil
                if (isMobile && navigator.share) {
                    // Esperar un poco para que la descarga se complete
                    await new Promise(resolve => setTimeout(resolve, 300));

                    try {
                        // Crear el archivo con el blob asegurando el tipo MIME correcto
                        const file = new File([blob], fileName, {
                            type: 'application/pdf',
                            lastModified: Date.now()
                        });

                        // Verificar si puede compartir archivos
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: nombreArchivoState,
                                text: `Compartir ${nombreArchivoState}`
                            });
                        } else {
                            // Intentar compartir con archivo directamente
                            await navigator.share({
                                files: [file],
                                title: nombreArchivoState,
                                text: `Compartir ${nombreArchivoState}`
                            });
                        }
                    } catch (shareError) {
                        // Si el usuario cancela el share, no hacer nada
                        if (shareError.name !== 'AbortError') {
                            console.log('Error al compartir:', shareError);
                        }
                    }
                }
            } catch (pdfError) {
                console.error('Error específico del PDF:', pdfError);
                throw new Error('Error al generar el PDF. Verifique que @react-pdf/renderer esté instalado correctamente.');
            }
        } catch (error) {
            console.error('Error generando PDF:', error);
        }
    }
    return { handleDescargaPDF };
};
