import * as XLSX from 'xlsx';

export const useDescargaExcel = ({
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
    const handleDescargaExcel = async () => {
        try {
            // Crear un nuevo workbook con XLSX (más confiable)
            const workbook = XLSX.utils.book_new();

            // Crear datos combinados con formato
            const allData = [];

            // 1. TÍTULO PRINCIPAL (centrado)
            allData.push([tituloDocumentoState]);
            allData.push([]); // Línea vacía

            // 2. INFORMACIÓN SUPERIOR (en 2 columnas)
            const keysRaw = Object.keys(informacionSuperior || {});
            const excluidosArriba = ['Total', 'Descuento', 'Aumento', 'Pagado', 'Saldo pendiente'];
            const keys = keysRaw.filter(k => !excluidosArriba.includes(k));

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

            // 4. TABLAS (limpiar unidades de cantidades y precios)
            if (tablaHeaders.length > 0 && tablaValores.length > 0) {
                allData.push(tablaHeaders);
                // Limpiar unidades de los valores
                const valoresLimpios = tablaValores.map(row =>
                    row.map((cell, index) => {
                        if (cell === null || cell === undefined) return '';
                        const raw = cell.toString().trim();
                        if (raw === '') return '';

                        if (index === 1) { // Columna de cantidad (segunda columna)
                            const cleaned = raw
                                .replace(/\s*u\s*$/i, '')
                                .replace(/\s*gr\s*$/i, '')
                                .replace(/\s*kg\s*$/i, '')
                                .replace(/\s*ml\s*$/i, '')
                                .trim();
                            const numeric = parseFloat(cleaned.replace(',', '.'));
                            return Number.isNaN(numeric) ? cleaned : numeric;
                        } else if (index === 2) { // Columna de precio unitario (tercera columna)
                            const cleaned = raw
                                .replace(/Bs\.\s*/i, '')
                                .replace(/\.(\d{3})/g, '$1') // Eliminar puntos de miles (ej. 1.080 -> 1080)
                                .replace(',', '.') // Convertir coma decimal a punto
                                .trim();
                            const numeric = parseFloat(cleaned);
                            return Number.isNaN(numeric) ? cleaned : numeric;
                        } else if (index === 3) { // Columna de subtotal (cuarta columna)
                            const cleaned = raw
                                .replace(/Bs\.\s*/i, '')
                                .replace(/\.(\d{3})/g, '$1') // Eliminar puntos de miles (ej. 1.080 -> 1080)
                                .replace(',', '.') // Convertir coma decimal a punto
                                .trim();
                            const numeric = parseFloat(cleaned);
                            return Number.isNaN(numeric) ? cleaned : numeric;
                        }
                        // Columna de producto (primera) sin cambios
                        return raw;
                    })
                );
                allData.push(...valoresLimpios);
            }

            // 5. TOTALES (desglose extra y totales personalizados al final de la tabla principal)
            if (tablaValores.length > 0) {
                allData.push([]);

                const tieneAumento = informacionSuperior && informacionSuperior.Aumento;
                const tieneDescuento = informacionSuperior && informacionSuperior.Descuento;

                // Si hay aumento o descuento, mostrar desglose completo
                if (tieneAumento || tieneDescuento) {
                    // Calcular solo la suma de subtotales de productos
                    const subtotalProductos = tablaValores.reduce((sum, row) => {
                        // Obtener el valor de la última columna (subtotal)
                        const subtotalStr = row[row.length - 1]?.toString() || '0';
                        // Extraer solo el número, removiendo "Bs.", puntos de miles y convirtiendo coma decimal
                        const cleanStr = subtotalStr
                            .replace(/Bs\.\s*/, '')
                            .replace(/\.(\d{3})/g, '$1') // Eliminar puntos de miles
                            .replace(',', '.') // Coma decimal → punto
                            .trim();
                        const subtotalNum = parseFloat(cleanStr) || 0;
                        return sum + subtotalNum;
                    }, 0);
                    const subtotalConComa = `Bs. ${subtotalProductos.toFixed(2).replace(/\./g, ',')}`;
                    // Crear array con el número correcto de columnas, poniendo el total en la última columna
                    const totalRow = new Array(tablaHeaders.length).fill('');
                    totalRow[totalRow.length - 2] = 'Total:';
                    totalRow[totalRow.length - 1] = subtotalConComa;
                    allData.push(totalRow);

                    // AUMENTO (si aplica)
                    if (tieneAumento) {
                        const aumentoConComa = informacionSuperior.Aumento.toString()
                            .replace(/\./g, ',') // Cambiar punto por coma
                            .trim();
                        const aumentoRow = new Array(tablaHeaders.length).fill('');
                        aumentoRow[aumentoRow.length - 2] = 'Aumento:';
                        aumentoRow[aumentoRow.length - 1] = aumentoConComa;
                        allData.push(aumentoRow);
                    }

                    // DESCUENTO (si aplica)
                    if (tieneDescuento) {
                        const descuentoConComa = informacionSuperior.Descuento.toString()
                            .replace(/\./g, ',') // Cambiar punto por coma
                            .trim();
                        const descuentoRow = new Array(tablaHeaders.length).fill('');
                        descuentoRow[descuentoRow.length - 2] = 'Descuento:';
                        descuentoRow[descuentoRow.length - 1] = descuentoConComa;
                        allData.push(descuentoRow);
                    }
                }

                // TOTAL FINAL y filas extra (Total, Pagado, Saldo pendiente) si existen
                const pushFooterRow = (label, value) => {
                    const val = (value || '').toString().replace(/\./g, ',').trim();
                    const row = new Array(tablaHeaders.length).fill('');
                    row[row.length - 2] = `${label}:`;
                    row[row.length - 1] = val;
                    allData.push(row);
                };

                if (informacionSuperior) {
                    if (informacionSuperior.Total) pushFooterRow('Total', informacionSuperior.Total);
                    if (informacionSuperior.Pagado) pushFooterRow('Pagado', informacionSuperior.Pagado);
                    if (informacionSuperior['Saldo pendiente']) pushFooterRow('Saldo pendiente', informacionSuperior['Saldo pendiente']);
                }
            }

            // 6. FIRMAS (si está activado)
            if (incluirFirmas) {
                allData.push([]); // Línea vacía
                allData.push([]); // Línea vacía
                allData.push(['', '', 'Entregado por:', '']); // Espacio para firma
                allData.push([]); // Línea vacía
                allData.push(['', '', 'Recibido por:', '']); // Espacio para firma
            }

            // Crear worksheet con todos los datos
            const worksheet = XLSX.utils.aoa_to_sheet(allData);

            // CONFIGURAR ANCHOS DE COLUMNAS (AUTO-FIT REAL)
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

            // APLICAR ESTILOS BÁSICOS
            const range = XLSX.utils.decode_range(worksheet['!ref']);

            // Estilo para el título (negrita y centrado)
            if (allData.length > 0) {
                const titleCellAddress = XLSX.utils.encode_cell({ r: 0, c: 0 });
                if (!worksheet[titleCellAddress]) worksheet[titleCellAddress] = { v: allData[0][0] };

                worksheet[titleCellAddress].s = {
                    font: { bold: true, size: 16 },
                    alignment: { horizontal: "center" }
                };
            }

            // Estilos para headers de tabla (fondo azul, texto blanco, negrita)
            let headerRowStart = -1;
            for (let row = 0; row < allData.length; row++) {
                if (allData[row] && allData[row].length > 0 &&
                    (allData[row][0] === 'Producto' || allData[row].includes('Producto'))) {
                    headerRowStart = row;
                    break;
                }
            }

            if (headerRowStart >= 0) {
                for (let col = 0; col < maxCols; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: headerRowStart, c: col });
                    if (worksheet[cellAddress]) {
                        // Color más oscuro para las líneas (gris oscuro)
                        const borderColor = { rgb: "888888" };

                        worksheet[cellAddress].s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            fill: { fgColor: { rgb: "366092" } },
                            alignment: { horizontal: "center" },
                            border: {
                                top: { style: "thin", color: borderColor },
                                bottom: { style: "thin", color: borderColor },
                                left: { style: "thin", color: borderColor },
                                right: { style: "thin", color: borderColor }
                            }
                        };
                    }
                }
            }

            // Estilos para datos de tabla (bordes)
            if (headerRowStart >= 0) {
                for (let row = headerRowStart + 1; row < allData.length; row++) {
                    if (allData[row] && allData[row].length > 0) {
                        for (let col = 0; col < maxCols; col++) {
                            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                            if (worksheet[cellAddress]) {
                                // Color más oscuro para las líneas
                                const borderColor = { rgb: "888888" };

                                worksheet[cellAddress].s = {
                                    border: {
                                        top: { style: "thin", color: borderColor },
                                        bottom: { style: "thin", color: borderColor },
                                        left: { style: "thin", color: borderColor },
                                        right: { style: "thin", color: borderColor }
                                    }
                                };

                                // Alineación derecha para columnas numéricas
                                if (col > 0) {
                                    worksheet[cellAddress].s.alignment = { horizontal: "right" };
                                }
                            }
                        }
                    }
                }
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

            // Generar archivo como blob
            const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const fileName = `${nombreArchivoState.replace(/\s+/g, '_')}.xlsx`;

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
                    // Crear el archivo con el blob
                    const file = new File([blob], fileName, {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
        } catch (error) {
            console.error('Error generando Excel:', error);
        }
    }
    return { handleDescargaExcel };
};
