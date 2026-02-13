import React, { useState, useEffect } from 'react';
import ViewModal from './ViewModal';
import HeaderModal from '../common/HeaderModal';
import Boton from '../common/Boton';
import InputNormal from '../common/InputNormal';
import styles from '../../styles/Inicial.module.css';
import pdfIcon from '../../assets/pdf.png';
import excelIcon from '../../assets/xls.png';
import imagenIcon from '../../assets/imagen.png';
import * as XLSX from 'xlsx';
import { pdf as pdfRenderer, Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import { useLayout } from '../../context/LayoutContext';
import EmpresaImagenService from '../../services/empresaImagenService';
import Checkbox from '../common/Checkbox';

function ModalDescarga({
    isOpen,
    setIsOpen,
    titulo = "Descargar",
    subtitulo = "SELECCIONA EL FORMATO QUE PREFERIAS PARA DESCARGAR.",
    informacionSuperior = {},
    tablaHeaders = [],
    tablaValores = [],
    tablas = null, // [{ titulo?: string, headers: string[], valores: string[][] }]
    nombreArchivo = "Descargar Movimiento",
    tituloDocumento = "Documento",
    loading = false,
    onExcel,
    onPDF,
    autoDownloadType = null,
    onAutoDownloadDone,
    esPedido = false,
    esMovimiento = false,
    clienteInfo = null, // { nombre: string, numeroOrden: number }
    separarColumnas = false, // Prop para separar columnas con líneas
    columnWidths = null // { [key: string]: string } - Anchos personalizados para columnas
}) {
    const [nombreArchivoState, setNombreArchivoState] = useState(nombreArchivo);
    const [tituloDocumentoState, setTituloDocumentoState] = useState(tituloDocumento);
    const [verNumero, setVerNumero] = useState(false);
    const [incluirFirmas, setIncluirFirmas] = useState(false);
    const [incluirLogos, setIncluirLogos] = useState(() => {
        // Cargar desde localStorage al inicializar
        const saved = localStorage.getItem('incluirLogos');
        return saved ? JSON.parse(saved) : false;
    });
    const [empresaImage, setEmpresaImage] = useState(null);
    const [empresaImageBase64, setEmpresaImageBase64] = useState(null);



    // Obtener contexto de usuario y layout
    const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
    const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
    const { isLargeScreen } = useLayout();

    // Determinar si es usuario normal o empleado
    const isEmployee = !!employeeInfo;
    const currentUser = isEmployee ? employeeInfo : userInfo;
    const sucursal = isEmployee ? employeeSucursal : userSucursal;

    // Estado para detectar si es móvil
    const [isMobile, setIsMobile] = useState(false);

    // Detectar si es móvil (no es pantalla grande y ancho < 768px)
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(!isLargeScreen && window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [isLargeScreen]);

    // Obtener la imagen de la empresa
    const displayImage = empresaImage || currentUser?.logo_tipo || sucursal?.empresas?.logo_tipo;

    // Actualizar el estado cuando cambien las props
    useEffect(() => {
        // Por defecto, si es movimiento, usar "NT", sino usar el nombreArchivo que viene
        if (esMovimiento) {
            setNombreArchivoState('NT');
        } else {
            setNombreArchivoState(nombreArchivo);
        }
        setTituloDocumentoState(tituloDocumento);
    }, [nombreArchivo, tituloDocumento, esMovimiento]);

    // Función para convertir imagen a base64
    const convertImageToBase64 = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting image to base64:', error);
            return null;
        }
    };

    // Cargar imagen de empresa al abrir el modal
    useEffect(() => {
        const loadEmpresaImage = async () => {
            if (isOpen) {
                try {
                    // Para usuarios normales
                    if (!isEmployee && currentUser?.logo_tipo) {
                        setEmpresaImage(currentUser.logo_tipo);
                        // Convertir a base64 para usar en PDF
                        convertImageToBase64(currentUser.logo_tipo).then(base64 => {
                            setEmpresaImageBase64(base64);
                        });
                        return;
                    }

                    // Para empleados
                    if (isEmployee && sucursal?.empresas?.id) {
                        // Primero intentar obtener de los datos ya cargados
                        if (sucursal.empresas.logo_tipo) {
                            setEmpresaImage(sucursal.empresas.logo_tipo);
                            // Convertir a base64 para usar en PDF
                            convertImageToBase64(sucursal.empresas.logo_tipo).then(base64 => {
                                setEmpresaImageBase64(base64);
                            });
                            return;
                        }

                        // Si no está en los datos, hacer llamada al servicio
                        const response = await EmpresaImagenService.getImage(sucursal.empresas.id);

                        // Intentar diferentes propiedades de la respuesta
                        const imageUrl = response.data?.imagen_url ||
                            response.data?.secure_url ||
                            response.data?.url ||
                            response.data?.image_url;

                        if (response.success && imageUrl) {
                            setEmpresaImage(imageUrl);
                            // Convertir a base64 para usar en PDF
                            convertImageToBase64(imageUrl).then(base64 => {
                                setEmpresaImageBase64(base64);
                            });
                        }
                    }
                } catch (error) {
                    console.log('Error cargando imagen de empresa:', error);
                }
            }
        };

        loadEmpresaImage();
    }, [isOpen, isEmployee, currentUser, sucursal?.empresas?.id, sucursal?.empresas?.logo_tipo]);

    // Función para manejar el cambio del nombre del archivo
    const handleNombreArchivoChange = (nuevoNombre) => {
        setNombreArchivoState(nuevoNombre);
    };

    // Función para manejar el cambio del título del documento
    const handleTituloDocumentoChange = (nuevoTitulo) => {
        setTituloDocumentoState(nuevoTitulo);
    };


    // Función para manejar el cambio del switch de "ver número"
    const handleVerNumeroChange = (ver) => {
        setVerNumero(ver);

        if (ver && clienteInfo && clienteInfo.numeroOrden && clienteInfo.nombre) {
            // Agregar número y nombre del cliente al nombre del archivo: "NT - Nº X Nombre" (con guion)
            setNombreArchivoState(`NT - Nº ${clienteInfo.numeroOrden} ${clienteInfo.nombre}`);
            // Agregar número y nombre del cliente al final del título del documento (sin guion)
            const sufijo = ` Nº ${clienteInfo.numeroOrden} ${clienteInfo.nombre}`;
            setTituloDocumentoState(prev => {
                // Si ya tiene el sufijo, no agregarlo de nuevo
                if (prev.endsWith(sufijo)) return prev;
                return prev + sufijo;
            });
        } else {
            // Volver a solo "NT" en el nombre del archivo
            setNombreArchivoState('NT');
            // Remover el sufijo del título del documento si existe
            if (clienteInfo && clienteInfo.numeroOrden && clienteInfo.nombre) {
                const sufijo = ` Nº ${clienteInfo.numeroOrden} ${clienteInfo.nombre}`;
                setTituloDocumentoState(prev => {
                    if (prev.endsWith(sufijo)) {
                        return prev.slice(0, -sufijo.length);
                    }
                    return prev;
                });
            }
        }
    };

    // Función para manejar el cambio del switch de "firmas"
    const handleIncluirFirmasChange = (incluir) => {
        setIncluirFirmas(incluir);
    };

    // Función para manejar el cambio del switch de "logos"
    const handleIncluirLogosChange = (incluir) => {
        setIncluirLogos(incluir);
        // Guardar en localStorage
        localStorage.setItem('incluirLogos', JSON.stringify(incluir));
    };


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

            // 4. TABLAS (limpiar unidades de cantidades y precios)
            if (Array.isArray(tablas) && tablas.length > 0) {
                tablas.forEach((seccion, idx) => {
                    allData.push([]);
                    if (seccion.titulo) allData.push([seccion.titulo]);
                    if (seccion.headers && seccion.headers.length > 0) {
                        allData.push(seccion.headers);
                    }
                    if (seccion.valores && seccion.valores.length > 0) {
                        // Limpiar unidades de los valores
                        const valoresLimpios = seccion.valores.map(row =>
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
                                        .replace(',', '.')
                                        .trim();
                                    const numeric = parseFloat(cleaned);
                                    return Number.isNaN(numeric) ? cleaned : numeric;
                                } else if (index === 3) { // Columna de subtotal (cuarta columna)
                                    const cleaned = raw
                                        .replace(/Bs\.\s*/i, '')
                                        .replace(',', '.')
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
                    if (idx !== tablas.length - 1) allData.push([]);
                });
                // Añadir también la tabla principal si existe, incluso cuando hay secciones
                if (tablaHeaders.length > 0 && tablaValores.length > 0) {
                    allData.push([]);
                    allData.push(tablaHeaders);
                    const valoresLimpios = tablaValores.map(row =>
                        row.map((cell, index) => {
                            if (cell === null || cell === undefined) return '';
                            const raw = cell.toString().trim();
                            if (raw === '') return '';

                            if (index === 1) {
                                const cleaned = raw
                                    .replace(/\s*u\s*$/i, '')
                                    .replace(/\s*gr\s*$/i, '')
                                    .replace(/\s*kg\s*$/i, '')
                                    .replace(/\s*ml\s*$/i, '')
                                    .trim();
                                const numeric = parseFloat(cleaned.replace(',', '.'));
                                return Number.isNaN(numeric) ? cleaned : numeric;
                            } else if (index === 2) {
                                const cleaned = raw
                                    .replace(/Bs\.\s*/i, '')
                                    .replace(',', '.')
                                    .trim();
                                const numeric = parseFloat(cleaned);
                                return Number.isNaN(numeric) ? cleaned : numeric;
                            } else if (index === 3) {
                                const cleaned = raw
                                    .replace(/Bs\.\s*/i, '')
                                    .replace(',', '.')
                                    .trim();
                                const numeric = parseFloat(cleaned);
                                return Number.isNaN(numeric) ? cleaned : numeric;
                            }
                            return raw;
                        })
                    );
                    allData.push(...valoresLimpios);
                }
            } else if (tablaHeaders.length > 0 && tablaValores.length > 0) {
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
                                .replace(',', '.')
                                .trim();
                            const numeric = parseFloat(cleaned);
                            return Number.isNaN(numeric) ? cleaned : numeric;
                        } else if (index === 3) { // Columna de subtotal (cuarta columna)
                            const cleaned = raw
                                .replace(/Bs\.\s*/i, '')
                                .replace(',', '.')
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
                        // Extraer solo el número, removiendo "Bs." y otros caracteres
                        const cleanStr = subtotalStr.replace(/Bs\.\s*/, '').trim();
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
    };

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
                infoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
                infoBox: { width: '49%', borderWidth: 1, borderRadius: 8, borderColor: '#000', paddingVertical: 6, paddingHorizontal: 8 },
                infoItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
                infoLabel: { fontSize: 10, fontWeight: 700 },
                infoValue: { fontSize: 10, textAlign: 'right' },
                headerBox: { borderWidth: 1.2, borderRadius: 8, borderColor: '#000', paddingVertical: 3, paddingHorizontal: 8, marginTop: 6, height: 22, justifyContent: 'center' },
                headerRow: { flexDirection: 'row', alignItems: 'center' },
                row: { flexDirection: 'row', marginTop: 0, borderBottomWidth: 0.5, borderBottomColor: '#888888', paddingBottom: 2, paddingTop: 2 },
                rowWithColumnBorders: { flexDirection: 'row', marginTop: 0, borderBottomWidth: 0.5, borderBottomColor: '#888888', paddingBottom: 2, paddingTop: 2 },
                cellWithBorder: { borderRightWidth: 0.5, borderRightColor: '#888888', paddingRight: 4 },
                headerCell: { fontSize: 9, fontWeight: 700 },
                headerLast: { paddingLeft: 0 },
                cellText: { fontSize: 9 },
                contentPad: { paddingHorizontal: 8 },
                separator: { borderTopWidth: 1, borderColor: '#000', marginTop: 6, marginBottom: 4 },
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
                
                // Si hay columnWidths definido, usarlo
                if (columnWidths && typeof columnWidths === 'object') {
                    // Mapear headers a keys de columnWidths
                    const headerKeys = ['fecha', 'concepto', 'proveedor', 'metodoPago', 'subtotal', 
                                       'producto', 'entradaGrup', 'entradaUd', 'salidaGrup', 'salidaUd',
                                       'tipoMedida', 'entrada', 'salida', 'verificado', 'terminados', 
                                       'materiaPrima', 'cConsumida'];
                    
                    const widths = headers.map((header, index) => {
                        const headerText = header.toString().toLowerCase();
                        const headerLower = headerText.replace(/[^a-z0-9]/g, '');
                        
                        // Casos especiales MUY específicos primero (antes de la búsqueda genérica)
                        let matchedKey = null;
                        
                        // Reportes de Almacén General
                        if (headerText === 'entrada (grup)' || headerText.includes('entrada') && headerText.includes('grup')) {
                            matchedKey = 'entradaGrup';
                        } else if (headerText === 'entrada (ud)' || headerText.includes('entrada') && headerText.includes('ud') && !headerText.includes('grup')) {
                            matchedKey = 'entradaUd';
                        } else if (headerText === 'salida (grup)' || headerText.includes('salida') && headerText.includes('grup')) {
                            matchedKey = 'salidaGrup';
                        } else if (headerText === 'salida (ud)' || headerText.includes('salida') && headerText.includes('ud') && !headerText.includes('grup')) {
                            matchedKey = 'salidaUd';
                        }
                        // Reportes de Materia Prima
                        else if (headerText === 'tipo medida' || headerText.includes('tipo') && headerText.includes('medida')) {
                            matchedKey = 'tipoMedida';
                        }
                        // Reportes de Producción
                        else if (headerText === 'verificado' || headerText.includes('verificado')) {
                            matchedKey = 'verificado';
                        } else if (headerText === 'terminados' || headerText.includes('terminados')) {
                            matchedKey = 'terminados';
                        } else if (headerText === 'materia prima' || headerText.includes('materia') && headerText.includes('prima')) {
                            matchedKey = 'materiaPrima';
                        } else if (headerText === 'c. consumida' || headerText.includes('consumida')) {
                            matchedKey = 'cConsumida';
                        }
                        // Reportes de Gastos
                        else if (headerText.includes('fecha') || headerText === 'fecha') {
                            matchedKey = 'fecha';
                        } else if (headerText.includes('concepto')) {
                            matchedKey = 'concepto';
                        } else if (headerText.includes('proveedor')) {
                            matchedKey = 'proveedor';
                        } else if (headerText.includes('m. pago') || headerText.includes('metodo') || (headerText.includes('pago') && !headerText.includes('subtotal'))) {
                            matchedKey = 'metodoPago';
                        } else if (headerText.includes('subtotal')) {
                            matchedKey = 'subtotal';
                        }
                        // Casos generales simples (entrada, salida, producto)
                        else if (headerText === 'entrada' && !headerText.includes('(')) {
                            matchedKey = 'entrada';
                        } else if (headerText === 'salida' && !headerText.includes('(')) {
                            matchedKey = 'salida';
                        } else if (headerText === 'producto' || headerText.includes('producto')) {
                            matchedKey = 'producto';
                        }
                        
                        // Si no hay match específico, buscar genéricamente
                        if (!matchedKey) {
                            for (const key of headerKeys) {
                                const keyLower = key.toLowerCase();
                                if (headerLower === keyLower || headerLower.includes(keyLower) || keyLower.includes(headerLower)) {
                                    matchedKey = key;
                                    break;
                                }
                            }
                        }
                        
                        // Si hay un match en columnWidths, usar ese valor
                        if (matchedKey && columnWidths[matchedKey]) {
                            return columnWidths[matchedKey];
                        }
                        
                        // Si no hay match, usar lógica por defecto
                        const headerLength = header.toString().length;
                        if (index === 0) {
                            return '35%';
                        }
                        const minWidth = Math.max(headerLength + 2, 8);
                        const percentage = Math.max((minWidth / 80) * 100, 8);
                        return `${percentage.toFixed(1)}%`;
                    });
                    
                    return widths;
                }
                
                // Calcular ancho mínimo basado en el título de cada columna (lógica original)
                const widths = headers.map((header, index) => {
                    const headerLength = header.toString().length;
                    
                    // La primera columna (Producto) debe tener más espacio para el contenido
                    if (index === 0) {
                        return '35%'; // Espacio fijo generoso para productos
                    }
                    
                    // Ancho mínimo: longitud del título + padding (mínimo 8 caracteres)
                    const minWidth = Math.max(headerLength + 2, 8);
                    // Convertir a porcentaje aproximado (asumiendo página de ~80 caracteres)
                    const percentage = Math.max((minWidth / 80) * 100, 8); // Mínimo 8%
                    return `${percentage.toFixed(1)}%`;
                });
                
                return widths;
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

                        {Array.isArray(tablas) && tablas.length > 0 && (
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
                                                            <View key={cIdx} style={[
                                                                { width: widths[cIdx] },
                                                                separarColumnas && cIdx < row.length - 1 && styles.cellWithBorder
                                                            ]}>
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
                        )}

                        {/* Renderizar también la tabla principal si existe (para mostrar totales alineados) */}
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
                                            <View key={cIdx} style={[
                                                { width: getWidthsPct(tablaHeaders)[cIdx] },
                                                separarColumnas && cIdx < row.length - 1 && styles.cellWithBorder
                                            ]}>
                                                <Text style={styles.cellText}>{cell != null ? String(cell) : ''}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* TOTALES (desglose solo si hay aumento o descuento) */}
                        {tablaValores.length > 0 && (
                            <>
                                <View style={[styles.contentPad, styles.separator]} />

                                {(() => {
                                    const tieneAumento = informacionSuperior && informacionSuperior.Aumento;
                                    const tieneDescuento = informacionSuperior && informacionSuperior.Descuento;

                                    // Si hay aumento o descuento, mostrar desglose completo
                                    if (tieneAumento || tieneDescuento) {
                                        return (
                                            <>
                                                {/* Subtotal (solo productos) */}
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
                                                        <Text style={styles.totalLabel}>Subtotal:</Text>
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
                                                        <Text style={styles.totalValue}>
                                                            {(() => {
                                                                const subtotalProductos = tablaValores.reduce((sum, row) => {
                                                                    // Obtener el valor de la última columna (subtotal)
                                                                    const subtotalStr = row[row.length - 1]?.toString() || '0';
                                                                    // Extraer solo el número, removiendo "Bs." y otros caracteres
                                                                    const cleanStr = subtotalStr.replace(/Bs\.\s*/, '').trim();
                                                                    const subtotalNum = parseFloat(cleanStr) || 0;
                                                                    return sum + subtotalNum;
                                                                }, 0);
                                                                return `Bs. ${subtotalProductos.toFixed(2)}`;
                                                            })()}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Aumento (si aplica) */}
                                                {tieneAumento && (
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
                                                            <Text style={styles.totalLabel}>Aumento:</Text>
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
                                                            <Text style={styles.totalValue}>{String(informacionSuperior.Aumento)}</Text>
                                                        </View>
                                                    </View>
                                                )}

                                                {/* Descuento (si aplica) */}
                                                {tieneDescuento && (
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
                                                            <Text style={styles.totalLabel}>Descuento:</Text>
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
                                                            <Text style={styles.totalValue}>{String(informacionSuperior.Descuento)}</Text>
                                                        </View>
                                                    </View>
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
                                        <View key={labelKey} style={[styles.contentPad, styles.row]}>
                                            {(() => {
                                                const currentWidths = Array.isArray(tablas) && tablas.length > 0
                                                    ? getWidthsPct(tablas[tablas.length - 1].headers || [])
                                                    : getWidthsPct(tablaHeaders);
                                                return currentWidths.slice(0, currentWidths.length - 2).map((w, i) => (
                                                    <View key={i} style={{ width: w }} />
                                                ));
                                            })()}
                                            <View style={{
                                                width: (() => {
                                                    const currentWidths = Array.isArray(tablas) && tablas.length > 0
                                                        ? getWidthsPct(tablas[tablas.length - 1].headers || [])
                                                        : getWidthsPct(tablaHeaders);
                                                    return currentWidths[currentWidths.length - 2];
                                                })(),
                                                paddingRight: 6
                                            }}>
                                                <Text style={styles.totalLabel}>{`${labelKey}:`}</Text>
                                            </View>
                                            <View style={{
                                                width: (() => {
                                                    const currentWidths = Array.isArray(tablas) && tablas.length > 0
                                                        ? getWidthsPct(tablas[tablas.length - 1].headers || [])
                                                        : getWidthsPct(tablaHeaders);
                                                    return currentWidths[currentWidths.length - 1];
                                                })()
                                            }}>
                                                <Text style={styles.totalValue}>{String(informacionSuperior[labelKey])}</Text>
                                            </View>
                                        </View>
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
                            <Text style={styles.footerLine1}>Generado por TotalProd - aplicación de gestión de procesos y ventas</Text>
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
    };


    // Auto-disparar descarga si se solicita desde afuera
    useEffect(() => {
        if (!autoDownloadType) return;
        const executeDownload = async () => {
            try {
                if (autoDownloadType === 'excel') {
                    await handleDescargaExcel();
                } else if (autoDownloadType === 'pdf') {
                    await handleDescargaPDF();
                }
            } finally {
                if (onAutoDownloadDone) onAutoDownloadDone();
            }
        };
        executeDownload();
    }, [autoDownloadType]);

    const handleExcelDownloadClick = async () => {
        if (onExcel) {
            onExcel();
            return;
        }
        await handleDescargaExcel();
    };

    const handlePdfDownloadClick = async () => {
        if (onPDF) {
            onPDF();
            return;
        }
        await handleDescargaPDF();
    };

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
            infoContainer.style.marginBottom = '12px';
            infoContainer.style.gap = '2%';

            const leftBox = document.createElement('div');
            leftBox.style.width = '49%';
            leftBox.style.border = '1px solid #000';
            leftBox.style.borderRadius = '8px';
            leftBox.style.padding = '6px 8px';

            const rightBox = document.createElement('div');
            rightBox.style.width = '49%';
            rightBox.style.border = '1px solid #000';
            rightBox.style.borderRadius = '8px';
            rightBox.style.padding = '6px 8px';

            const preferredOrder = [
                'Responsable', 'Tipo', 'Fecha', 'Hora', 'Estado', 'Sucursal',
                'Método de Pago', 'Cliente', 'Proveedor', 'Órdenes del Cliente', 'Órdenes del Proveedor',
                'Tipo de Precio', 'Costo', 'Restar Ingredientes', 'Observaciones', 'Venta N°', 'Entrega N°', 'Total'
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
            infoContainer.appendChild(rightBox);
            container.appendChild(infoContainer);

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

            // Tablas
            const getWidthsPct = (headers) => {
                if (!headers || headers.length === 0) return [];
                
                if (columnWidths && typeof columnWidths === 'object') {
                    const headerKeys = ['fecha', 'concepto', 'proveedor', 'metodoPago', 'subtotal', 
                                       'producto', 'entradaGrup', 'entradaUd', 'salidaGrup', 'salidaUd',
                                       'tipoMedida', 'entrada', 'salida', 'verificado', 'terminados', 
                                       'materiaPrima', 'cConsumida'];
                    
                    const widths = headers.map((header, index) => {
                        const headerLower = header.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                        let matchedKey = null;
                        for (const key of headerKeys) {
                            const keyLower = key.toLowerCase();
                            if (headerLower.includes(keyLower) || keyLower.includes(headerLower)) {
                                matchedKey = key;
                                break;
                            }
                        }
                        
                        if (!matchedKey) {
                            const headerText = header.toString().toLowerCase();
                            if (headerText.includes('fecha') || headerText === 'fecha') matchedKey = 'fecha';
                            else if (headerText.includes('concepto')) matchedKey = 'concepto';
                            else if (headerText.includes('proveedor')) matchedKey = 'proveedor';
                            else if (headerText.includes('m. pago') || headerText.includes('metodo') || headerText.includes('pago')) matchedKey = 'metodoPago';
                            else if (headerText.includes('subtotal')) matchedKey = 'subtotal';
                        }
                        
                        if (matchedKey && columnWidths[matchedKey]) {
                            return columnWidths[matchedKey];
                        }
                        
                        const headerLength = header.toString().length;
                        if (index === 0) {
                            return '35%';
                        }
                        const minWidth = Math.max(headerLength + 2, 8);
                        const percentage = Math.max((minWidth / 80) * 100, 8);
                        return `${percentage.toFixed(1)}%`;
                    });
                    
                    return widths;
                }
                
                const widths = headers.map((header, index) => {
                    const headerLength = header.toString().length;
                    if (index === 0) {
                        return '35%';
                    }
                    const minWidth = Math.max(headerLength + 2, 8);
                    const percentage = Math.max((minWidth / 80) * 100, 8);
                    return `${percentage.toFixed(1)}%`;
                });
                
                return widths;
            };

            // Renderizar tablas múltiples
            if (Array.isArray(tablas) && tablas.length > 0) {
                tablas.forEach((seccion, sIdx) => {
                    if (seccion.titulo) {
                        const titulo = document.createElement('div');
                        titulo.textContent = String(seccion.titulo);
                        titulo.style.fontSize = '10px';
                        titulo.style.fontWeight = '700';
                        titulo.style.marginTop = '8px';
                        titulo.style.marginBottom = '2px';
                        container.appendChild(titulo);
                    }

                    if (seccion.headers && seccion.headers.length > 0) {
                        const widths = getWidthsPct(seccion.headers);
                        const headerBox = document.createElement('div');
                        headerBox.style.border = '1.2px solid #000';
                        headerBox.style.borderRadius = '8px';
                        headerBox.style.padding = '3px 8px';
                        headerBox.style.marginTop = '6px';
                        headerBox.style.height = '22px';
                        headerBox.style.display = 'flex';
                        headerBox.style.alignItems = 'center';
                        
                        const headerRow = document.createElement('div');
                        headerRow.style.display = 'flex';
                        headerRow.style.width = '100%';
                        
                        seccion.headers.forEach((h, idx) => {
                            const headerCell = document.createElement('div');
                            headerCell.textContent = String(h);
                            headerCell.style.fontSize = '9px';
                            headerCell.style.fontWeight = '700';
                            headerCell.style.width = widths[idx];
                            headerRow.appendChild(headerCell);
                        });
                        
                        headerBox.appendChild(headerRow);
                        container.appendChild(headerBox);
                    }

                    if (seccion.valores && seccion.valores.length > 0) {
                        const widths = getWidthsPct(seccion.headers || []);
                        seccion.valores.forEach((row) => {
                            const rowDiv = document.createElement('div');
                            rowDiv.style.display = 'flex';
                            rowDiv.style.borderBottom = '0.5px solid #888888';
                            rowDiv.style.paddingBottom = '2px';
                            rowDiv.style.paddingTop = '2px';
                            
                            row.forEach((cell, cIdx) => {
                                const cellDiv = document.createElement('div');
                                cellDiv.textContent = cell != null ? String(cell) : '';
                                cellDiv.style.fontSize = '9px';
                                cellDiv.style.width = widths[cIdx];
                                if (separarColumnas && cIdx < row.length - 1) {
                                    cellDiv.style.borderRight = '0.5px solid #888888';
                                    cellDiv.style.paddingRight = '4px';
                                }
                                rowDiv.appendChild(cellDiv);
                            });
                            
                            container.appendChild(rowDiv);
                        });
                    }
                });
            }

            // Tabla principal
            if (tablaHeaders.length > 0) {
                const widths = getWidthsPct(tablaHeaders);
                const headerBox = document.createElement('div');
                headerBox.style.border = '1.2px solid #000';
                headerBox.style.borderRadius = '8px';
                headerBox.style.padding = '3px 8px';
                headerBox.style.marginTop = '6px';
                headerBox.style.height = '22px';
                headerBox.style.display = 'flex';
                headerBox.style.alignItems = 'center';
                
                const headerRow = document.createElement('div');
                headerRow.style.display = 'flex';
                headerRow.style.width = '100%';
                
                tablaHeaders.forEach((h, idx) => {
                    const headerCell = document.createElement('div');
                    headerCell.textContent = String(h);
                    headerCell.style.fontSize = '9px';
                    headerCell.style.fontWeight = '700';
                    headerCell.style.width = widths[idx];
                    headerRow.appendChild(headerCell);
                });
                
                headerBox.appendChild(headerRow);
                container.appendChild(headerBox);
            }

            if (tablaValores.length > 0) {
                const widths = getWidthsPct(tablaHeaders);
                tablaValores.forEach((row) => {
                    const rowDiv = document.createElement('div');
                    rowDiv.style.display = 'flex';
                    rowDiv.style.borderBottom = '0.5px solid #888888';
                    rowDiv.style.paddingBottom = '2px';
                    rowDiv.style.paddingTop = '2px';
                    
                    row.forEach((cell, cIdx) => {
                        const cellDiv = document.createElement('div');
                        cellDiv.textContent = cell != null ? String(cell) : '';
                        cellDiv.style.fontSize = '9px';
                        cellDiv.style.width = widths[cIdx];
                        if (separarColumnas && cIdx < row.length - 1) {
                            cellDiv.style.borderRight = '0.5px solid #888888';
                            cellDiv.style.paddingRight = '4px';
                        }
                        rowDiv.appendChild(cellDiv);
                    });
                    
                    container.appendChild(rowDiv);
                });
            }

            // Totales
            if (tablaValores.length > 0) {
                const separator = document.createElement('div');
                separator.style.borderTop = '1px solid #000';
                separator.style.marginTop = '6px';
                separator.style.marginBottom = '4px';
                container.appendChild(separator);

                const tieneAumento = informacionSuperior && informacionSuperior.Aumento;
                const tieneDescuento = informacionSuperior && informacionSuperior.Descuento;
                const widths = Array.isArray(tablas) && tablas.length > 0
                    ? getWidthsPct(tablas[tablas.length - 1].headers || [])
                    : getWidthsPct(tablaHeaders);

                if (tieneAumento || tieneDescuento) {
                    const subtotalProductos = tablaValores.reduce((sum, row) => {
                        const subtotalStr = row[row.length - 1]?.toString() || '0';
                        const cleanStr = subtotalStr.replace(/Bs\.\s*/, '').trim();
                        const subtotalNum = parseFloat(cleanStr) || 0;
                        return sum + subtotalNum;
                    }, 0);

                    const totalRow = document.createElement('div');
                    totalRow.style.display = 'flex';
                    totalRow.style.borderBottom = '0.5px solid #888888';
                    totalRow.style.paddingBottom = '2px';
                    totalRow.style.paddingTop = '2px';
                    
                    widths.slice(0, widths.length - 2).forEach(() => {
                        const empty = document.createElement('div');
                        empty.style.width = widths[0];
                        totalRow.appendChild(empty);
                    });
                    
                    const label = document.createElement('div');
                    label.textContent = 'Subtotal:';
                    label.style.fontSize = '10px';
                    label.style.fontWeight = '700';
                    label.style.textAlign = 'right';
                    label.style.width = widths[widths.length - 2];
                    label.style.paddingRight = '6px';
                    totalRow.appendChild(label);
                    
                    const value = document.createElement('div');
                    value.textContent = `Bs. ${subtotalProductos.toFixed(2)}`;
                    value.style.fontSize = '10px';
                    value.style.fontWeight = '700';
                    value.style.width = widths[widths.length - 1];
                    totalRow.appendChild(value);
                    container.appendChild(totalRow);

                    if (tieneAumento) {
                        const aumentoRow = document.createElement('div');
                        aumentoRow.style.display = 'flex';
                        aumentoRow.style.borderBottom = '0.5px solid #888888';
                        aumentoRow.style.paddingBottom = '2px';
                        aumentoRow.style.paddingTop = '2px';
                        
                        widths.slice(0, widths.length - 2).forEach(() => {
                            const empty = document.createElement('div');
                            empty.style.width = widths[0];
                            aumentoRow.appendChild(empty);
                        });
                        
                        const label = document.createElement('div');
                        label.textContent = 'Aumento:';
                        label.style.fontSize = '10px';
                        label.style.fontWeight = '700';
                        label.style.textAlign = 'right';
                        label.style.width = widths[widths.length - 2];
                        label.style.paddingRight = '6px';
                        aumentoRow.appendChild(label);
                        
                        const value = document.createElement('div');
                        value.textContent = String(informacionSuperior.Aumento);
                        value.style.fontSize = '10px';
                        value.style.fontWeight = '700';
                        value.style.width = widths[widths.length - 1];
                        aumentoRow.appendChild(value);
                        container.appendChild(aumentoRow);
                    }

                    if (tieneDescuento) {
                        const descuentoRow = document.createElement('div');
                        descuentoRow.style.display = 'flex';
                        descuentoRow.style.borderBottom = '0.5px solid #888888';
                        descuentoRow.style.paddingBottom = '2px';
                        descuentoRow.style.paddingTop = '2px';
                        
                        widths.slice(0, widths.length - 2).forEach(() => {
                            const empty = document.createElement('div');
                            empty.style.width = widths[0];
                            descuentoRow.appendChild(empty);
                        });
                        
                        const label = document.createElement('div');
                        label.textContent = 'Descuento:';
                        label.style.fontSize = '10px';
                        label.style.fontWeight = '700';
                        label.style.textAlign = 'right';
                        label.style.width = widths[widths.length - 2];
                        label.style.paddingRight = '6px';
                        descuentoRow.appendChild(label);
                        
                        const value = document.createElement('div');
                        value.textContent = String(informacionSuperior.Descuento);
                        value.style.fontSize = '10px';
                        value.style.fontWeight = '700';
                        value.style.width = widths[widths.length - 1];
                        descuentoRow.appendChild(value);
                        container.appendChild(descuentoRow);
                    }
                }

                // Total, Pagado, Saldo pendiente
                if (informacionSuperior) {
                    ['Total', 'Pagado', 'Saldo pendiente'].forEach((labelKey) => {
                        if (informacionSuperior[labelKey]) {
                            const totalRow = document.createElement('div');
                            totalRow.style.display = 'flex';
                            totalRow.style.borderBottom = '0.5px solid #888888';
                            totalRow.style.paddingBottom = '2px';
                            totalRow.style.paddingTop = '2px';
                            
                            widths.slice(0, widths.length - 2).forEach(() => {
                                const empty = document.createElement('div');
                                empty.style.width = widths[0];
                                totalRow.appendChild(empty);
                            });
                            
                            const label = document.createElement('div');
                            label.textContent = `${labelKey}:`;
                            label.style.fontSize = '10px';
                            label.style.fontWeight = '700';
                            label.style.textAlign = 'right';
                            label.style.width = widths[widths.length - 2];
                            label.style.paddingRight = '6px';
                            totalRow.appendChild(label);
                            
                            const value = document.createElement('div');
                            value.textContent = String(informacionSuperior[labelKey]);
                            value.style.fontSize = '10px';
                            value.style.fontWeight = '700';
                            value.style.width = widths[widths.length - 1];
                            totalRow.appendChild(value);
                            container.appendChild(totalRow);
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
            footer.textContent = 'Generado por TotalProd - aplicación de gestión de procesos y ventas';
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
    };

    const handleImagenDownloadClick = async () => {
        await handleDescargaImagen();
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title={titulo}
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>DEFINIR EL NOMBRE Y TÍTULO DEL DOCUMENTO</p>
                <InputNormal
                    label="Nombre del archivo"
                    value={nombreArchivoState}
                    onChange={(e) => handleNombreArchivoChange(e.target.value)}
                    onBlur={() => { }}
                    placeholder="Nombre del archivo"
                    icon="file"
                />
                <InputNormal
                    label="Título del documento"
                    value={tituloDocumentoState}
                    onChange={(e) => handleTituloDocumentoChange(e.target.value)}
                    onBlur={() => { }}
                    placeholder="Título del documento"
                    icon="text"
                />
                <p className={styles.subTitle}>OPCIONES ADICIONALES</p>
                <div className={styles.contentModal} style={{ gap: '10px', padding: '10px 5px'}}>
                    {clienteInfo && (

                        <Checkbox
                            title="Ver número"
                            subtitle={`Número de orden y nombre (Nº ${clienteInfo.numeroOrden} ${clienteInfo.nombre})`}
                            checked={verNumero}
                            onChange={handleVerNumeroChange}
                            icon="user"
                        />

                    )}
                    <Checkbox
                        title="Firmas"
                        subtitle="Incluir espacios para firmas"
                        checked={incluirFirmas}
                        onChange={handleIncluirFirmasChange}
                        icon="edit"
                    />


                    {/* Solo mostrar switch de logos si la empresa tiene logo */}
                    {displayImage && (

                        <Checkbox
                            title="Logos"
                            subtitle="Incluir logo de la empresa y marca de agua (PDF)"
                            checked={incluirLogos}
                            onChange={handleIncluirLogosChange}
                            icon="image"
                        />

                    )}
                </div>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='XSLX'
                        style={{ marginTop: 'auto' }}
                        icon={excelIcon}
                        onClick={handleExcelDownloadClick}
                        loading={loading}
                        disabled={loading}
                    />
                    <Boton
                        className='btn-default'
                        label='PDF'
                        style={{ marginTop: 'auto' }}
                        icon={pdfIcon}
                        onClick={handlePdfDownloadClick}
                        loading={loading}
                        disabled={loading}
                    />
                    <Boton
                        className='btn-default'
                        label='IMG'
                        style={{ marginTop: 'auto' }}
                        icon={imagenIcon}
                        onClick={handleImagenDownloadClick}
                        loading={loading}
                        disabled={loading}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalDescarga;