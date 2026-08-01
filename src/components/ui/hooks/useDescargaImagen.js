import html2canvas from 'html2canvas';
import useFormatNumber from '../../../hooks/useFormatNumber';

export const useDescargaImagen = ({
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

    const handleDescargaImagen = async () => {
        try {
            // Importar html2canvas dinámicamente
            const html2canvas = (await import('html2canvas')).default;

            // Crear un contenedor temporal oculto para renderizar el documento
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '794px'; // Ancho A4 en píxeles (210mm a 96 DPI)
            container.style.backgroundColor = '#ffffff';
            container.style.padding = '30px 36px';
            container.style.fontFamily = 'Arial, sans-serif';
            container.style.boxSizing = 'border-box';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            document.body.appendChild(container);

            // Renderizar el contenido del documento
            const title = document.createElement('h1');
            title.textContent = tituloDocumentoState;
            title.style.textAlign = 'center';
            title.style.fontSize = '15px';
            title.style.fontWeight = '700';
            title.style.marginBottom = '8px';
            title.style.marginTop = '0';
            container.appendChild(title);

            // Información superior en dos columnas
            const infoContainer = document.createElement('div');
            infoContainer.style.display = 'flex';
            infoContainer.style.justifyContent = 'space-between';
            infoContainer.style.marginTop = '8px';
            infoContainer.style.marginBottom = '2px';
            infoContainer.style.gap = '2%';

            const leftBox = document.createElement('div');
            leftBox.style.width = '49%';
            leftBox.style.padding = '6px 8px 2px 8px';

            const rightBox = document.createElement('div');
            rightBox.style.width = '49%';
            rightBox.style.padding = '6px 8px 2px 8px';

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

            leftEntries.forEach(([k, v]) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.marginBottom = '4px';
                const label = document.createElement('span');
                label.textContent = `${k}:`;
                label.style.fontSize = '10px';
                label.style.fontWeight = '700';
                const value = document.createElement('span');
                value.textContent = String(v);
                value.style.fontSize = '10px';
                value.style.textAlign = 'right';
                row.appendChild(label);
                row.appendChild(value);
                leftBox.appendChild(row);
            });

            rightEntries.forEach(([k, v]) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.marginBottom = '4px';
                const label = document.createElement('span');
                label.textContent = `${k}:`;
                label.style.fontSize = '10px';
                label.style.fontWeight = '700';
                const value = document.createElement('span');
                value.textContent = String(v);
                value.style.fontSize = '10px';
                value.style.textAlign = 'right';
                row.appendChild(label);
                row.appendChild(value);
                rightBox.appendChild(row);
            });

            infoContainer.appendChild(leftBox);

            const separator = document.createElement('div');
            separator.style.width = '1px';
            separator.style.backgroundColor = '#ccc';
            infoContainer.appendChild(separator);

            infoContainer.appendChild(rightBox);
            container.appendChild(infoContainer);

            const horizontalSeparator = document.createElement('div');
            horizontalSeparator.style.borderTop = '1px solid #ccc';
            horizontalSeparator.style.marginTop = '6px';
            horizontalSeparator.style.marginBottom = '6px';
            container.appendChild(horizontalSeparator);

            // Logo si está habilitado
            if (incluirLogos && empresaImageBase64) {
                const logoContainer = document.createElement('div');
                logoContainer.style.position = 'absolute';
                logoContainer.style.top = '10px';
                logoContainer.style.left = '36px';
                logoContainer.style.width = '50px';
                logoContainer.style.height = '50px';
                logoContainer.style.zIndex = '10';
                const logoImg = document.createElement('img');
                logoImg.src = empresaImageBase64;
                logoImg.style.width = '50px';
                logoImg.style.height = '50px';
                logoImg.style.objectFit = 'contain';
                logoContainer.appendChild(logoImg);
                container.appendChild(logoContainer);

                // Marca de agua
                const watermark = document.createElement('div');
                watermark.style.position = 'absolute';
                watermark.style.top = '50%';
                watermark.style.left = '50%';
                watermark.style.transform = 'translate(-50%, -50%)';
                watermark.style.width = '200px';
                watermark.style.height = '200px';
                watermark.style.opacity = '0.03';
                watermark.style.zIndex = '1';
                watermark.style.display = 'flex';
                watermark.style.alignItems = 'center';
                watermark.style.justifyContent = 'center';
                const watermarkImg = document.createElement('img');
                watermarkImg.src = empresaImageBase64;
                watermarkImg.style.width = '400px';
                watermarkImg.style.height = '400px';
                watermarkImg.style.objectFit = 'contain';
                watermark.appendChild(watermarkImg);
                container.appendChild(watermark);
            }

            const finalHeaders = tablaHeaders && tablaHeaders.length > 0 ? ['Nro', ...tablaHeaders] : [];
            const finalValores = tablaValores && tablaValores.length > 0 ? tablaValores.map((row, index) => [index + 1, ...row]) : [];

            // Tablas
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

            // Renderizar tablas múltiples
            if (finalHeaders.length > 0) {
                const headerRow = document.createElement('div');
                headerRow.style.display = 'flex';
                headerRow.style.paddingTop = '3px';
                headerRow.style.paddingBottom = '3px';
                headerRow.style.paddingLeft = '8px';
                headerRow.style.paddingRight = '8px';
                headerRow.style.marginTop = '6px';

                const widths = getWidthsPct(finalHeaders);

                finalHeaders.forEach((headerText, index) => {
                    const headerCell = document.createElement('div');
                    headerCell.textContent = String(headerText);
                    headerCell.style.width = widths[index];
                    headerCell.style.fontSize = '10px';
                    headerCell.style.fontWeight = '900';
                    headerRow.appendChild(headerCell);
                });

                container.appendChild(headerRow);
            }

            finalValores.forEach((row, rIdx) => {
                const rowDiv = document.createElement('div');
                rowDiv.style.display = 'flex';
                rowDiv.style.paddingTop = '2px';
                rowDiv.style.paddingBottom = '2px';
                rowDiv.style.paddingLeft = '8px';
                rowDiv.style.paddingRight = '8px';

                const widths = getWidthsPct(finalHeaders);

                row.forEach((cellText, cIdx) => {
                    const cell = document.createElement('div');
                    cell.textContent = cellText != null ? String(cellText) : '';
                    cell.style.width = widths[cIdx];
                    cell.style.fontSize = '9px';
                    
                    if (separarColumnas && cIdx < row.length - 1) {
                        cell.style.borderRight = '0.5px solid #888888';
                        cell.style.paddingRight = '4px';
                    }

                    rowDiv.appendChild(cell);
                });

                container.appendChild(rowDiv);
            });

            // Totales
            if (finalValores.length > 0) {
                const separator = document.createElement('div');
                separator.style.borderTop = '1px solid #ccc';
                separator.style.marginTop = '6px';
                separator.style.marginBottom = '4px';
                container.appendChild(separator);

                const tieneAumento = informacionSuperior && informacionSuperior.Aumento;
                const tieneDescuento = informacionSuperior && informacionSuperior.Descuento;
                const widths = getWidthsPct(finalHeaders);

                const addTotalRow = (labelStr, valueStr) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.paddingBottom = '2px';
                    row.style.paddingTop = '2px';

                    widths.slice(0, widths.length - 2).forEach((w) => {
                        const empty = document.createElement('div');
                        empty.style.width = w;
                        row.appendChild(empty);
                    });

                    const label = document.createElement('div');
                    label.textContent = labelStr;
                    label.style.fontSize = '10px';
                    label.style.fontWeight = '700';
                    label.style.textAlign = 'right';
                    label.style.width = widths[widths.length - 2];
                    label.style.paddingRight = '6px';
                    row.appendChild(label);

                    const value = document.createElement('div');
                    value.textContent = String(valueStr);
                    value.style.fontSize = '10px';
                    value.style.fontWeight = '700';
                    value.style.width = widths[widths.length - 1];
                    row.appendChild(value);
                    container.appendChild(row);
                };

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

                    addTotalRow('Subtotal:', `Bs. ${formatPrice(subtotalProductos)}`);

                    if (tieneAumento) {
                        addTotalRow('Aumento:', informacionSuperior.Aumento);
                    }

                    if (tieneDescuento) {
                        addTotalRow('Descuento:', informacionSuperior.Descuento);
                    }
                }

                // Total, Pagado, Saldo pendiente
                if (informacionSuperior) {
                    ['Total', 'Pagado', 'Saldo pendiente'].forEach((labelKey) => {
                        if (informacionSuperior[labelKey]) {
                            addTotalRow(`${labelKey}:`, informacionSuperior[labelKey]);
                        }
                    });
                }
            }

            // Firmas
            if (incluirFirmas) {
                const firmasContainer = document.createElement('div');
                firmasContainer.style.marginTop = '20px';
                firmasContainer.style.display = 'flex';
                firmasContainer.style.gap = '20px';

                const entregado = document.createElement('div');
                entregado.style.width = '50%';
                const entregadoLabel = document.createElement('div');
                entregadoLabel.textContent = 'Entregado por:';
                entregadoLabel.style.fontSize = '10px';
                entregadoLabel.style.fontWeight = '700';
                entregadoLabel.style.marginBottom = '20px';
                const entregadoLine = document.createElement('div');
                entregadoLine.style.borderBottom = '1px solid #000';
                entregadoLine.style.height = '30px';
                entregado.appendChild(entregadoLabel);
                entregado.appendChild(entregadoLine);

                const recibido = document.createElement('div');
                recibido.style.width = '50%';
                const recibidoLabel = document.createElement('div');
                recibidoLabel.textContent = 'Recibido por:';
                recibidoLabel.style.fontSize = '10px';
                recibidoLabel.style.fontWeight = '700';
                recibidoLabel.style.marginBottom = '20px';
                const recibidoLine = document.createElement('div');
                recibidoLine.style.borderBottom = '1px solid #000';
                recibidoLine.style.height = '30px';
                recibido.appendChild(recibidoLabel);
                recibido.appendChild(recibidoLine);

                firmasContainer.appendChild(entregado);
                firmasContainer.appendChild(recibido);
                container.appendChild(firmasContainer);
            }

            // Pie de página
            const footer = document.createElement('div');
            footer.style.marginTop = '20px';
            footer.style.paddingTop = '10px';
            footer.style.textAlign = 'center';
            footer.style.fontSize = '9px';
            footer.style.color = '#888';
            footer.style.fontStyle = 'italic';
            footer.style.fontWeight = '300';
            footer.textContent = 'Generado por TotalProd - Aplicación de Gestión de Procesos y Ventas';
            container.appendChild(footer);

            // Esperar a que las imágenes se carguen y el contenido se renderice
            await new Promise(resolve => setTimeout(resolve, 500));

            // Forzar recálculo del layout
            container.style.height = 'auto';

            // Obtener la altura real del contenido
            const contentHeight = container.scrollHeight;

            // Generar la imagen con html2canvas ajustada al contenido
            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                width: container.scrollWidth,
                height: contentHeight,
                windowWidth: container.scrollWidth,
                windowHeight: contentHeight
            });

            // Convertir canvas a blob
            const blob = await new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            });

            const fileName = `${nombreArchivoState.replace(/\s+/g, '_')}.png`;

            // Descargar archivo
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();

            // Limpiar el contenedor
            document.body.removeChild(container);
            URL.revokeObjectURL(link.href);

            // Intentar compartir usando Web Share API solo en móvil
            if (isMobile && navigator.share) {
                // Esperar un poco para que la descarga se complete
                await new Promise(resolve => setTimeout(resolve, 300));

                try {
                    // Crear el archivo con el blob
                    const file = new File([blob], fileName, {
                        type: 'image/png',
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
            console.error('Error generando imagen:', error);
        }
    }
    return { handleDescargaImagen };
};
