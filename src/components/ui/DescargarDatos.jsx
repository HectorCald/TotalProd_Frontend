import React, { useState, useEffect } from 'react';
import ModalCentro from '../common/modals/ModalCentro';
import InputSelectIcon from '../common/inputs/InputSelectIcon';
import Checkbox from '../common/inputs/Checkbox';
import movimientosAlmacenService from '../../services/movimientosAlmacenService';
import { useDescargaExcel } from './hooks/useDescargaExcel';
import { useDescargaPDF } from './hooks/useDescargaPDF';
import { useDescargaImagen } from './hooks/useDescargaImagen';
import Input from '../common/inputs/Input';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import { useLayout } from '../../context/LayoutContext';
import EmpresaImagenService from '../../services/empresaImagenService';
import useFormatNumber from '../../hooks/useFormatNumber';
import useFormatNumberPrice from '../../hooks/useFormatNumberPrice';
import { LEGACY_PERCENTAGE_CUTOFF_DATE } from '../../constants/movimientosConstants';

function DescargarDatos({
    isOpen,
    setIsOpen,
    titulo = "Descargar",
    subtitulo = "SELECCIONA EL FORMATO QUE PREFIERAS PARA DESCARGAR.",
    informacionSuperior = {},
    tablaHeaders = [],
    tablaValores = [],
    nombreArchivo = "Descargar Movimiento",
    tituloDocumento = "Documento",
    loading = false,
    onExcel,
    onPDF,
    esMovimiento = false,
    fechaMovimiento = '',
    movimientoId = null,
    clienteInfo = null, // { nombre: string, numeroOrden: number }
    separarColumnas = false, // Prop para separar columnas con líneas
    columnWidths = null, // { [key: string]: string } - Anchos personalizados para columnas (por texto de header o clave legacy)
    mostrarNro = true, // Si es false, no agrega la columna automática "Nro" en PDF/Imagen
    orientacion = 'vertical' // 'vertical' u 'horizontal' - orientación de la hoja PDF / ancho del canvas Imagen
}) {
    const { formatPrice } = useFormatNumber();
    const { calculateSubtotal, calculateSpecialPrice } = useFormatNumberPrice();
    
    const [localInfoSuperior, setLocalInfoSuperior] = useState(informacionSuperior);
    const [localTablaHeaders, setLocalTablaHeaders] = useState(tablaHeaders);
    const [localTablaValores, setLocalTablaValores] = useState(tablaValores);
    const [localClienteInfo, setLocalClienteInfo] = useState(clienteInfo);
    
    // Actualizar locales si cambian los props originales (por si no se usa movimientoId)
    useEffect(() => {
        if (!movimientoId) {
            setLocalInfoSuperior(informacionSuperior);
            setLocalTablaHeaders(tablaHeaders);
            setLocalTablaValores(tablaValores);
            setLocalClienteInfo(clienteInfo);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(informacionSuperior), JSON.stringify(tablaHeaders), JSON.stringify(tablaValores), JSON.stringify(clienteInfo), movimientoId]);
    
    // Fetch data if movimientoId is present
    useEffect(() => {
        if (isOpen && movimientoId) {
            setIsSubmitting(true);
            movimientosAlmacenService.getById(movimientoId).then(res => {
                if (res.success && res.data) {
                    const mov = res.data;
                    
                    const fechaLiteral = mov.fecha ? new Date(mov.fecha).toLocaleDateString() : '';
                    
                    let subtotalNum = (mov.productos || []).reduce((sum, p) => {
                        const cant = Number(p.pivot?.cantidad ?? p.cantidad ?? 0);
                        const prec = p.pivot?.precio_unitario ?? p.precio_unitario ?? p.pivot?.precio ?? p.precio ?? 0;
                        const grup = Number(p.producto?.grup ?? p.grup ?? 0);
                        const esVenta = mov.type === 'salida' || mov.tipo === 'salida';
                        return sum + calculateSubtotal(cant, prec, grup, mov.agrupado, esVenta);
                    }, 0);
                    subtotalNum = Math.round(subtotalNum * 10) / 10;
                    const descValNum = parseFloat(mov.descuento) || 0;
                    const aumValNum = parseFloat(mov.aumento) || 0;
                    const esPorcentaje = mov.porcentaje;
                    
                    const dateStr = mov.fecha ? (mov.fecha.split('T')[0] || mov.fecha.substring(0, 10)) : '';
                    const isLegacyPercentage = esPorcentaje && dateStr && dateStr <= LEGACY_PERCENTAGE_CUTOFF_DATE;
                    
                    const descCalculadoNum = esPorcentaje 
                        ? (isLegacyPercentage ? descValNum : (subtotalNum * descValNum / 100)) 
                        : descValNum;
                    const aumCalculadoNum = esPorcentaje 
                        ? (isLegacyPercentage ? aumValNum : (subtotalNum * aumValNum / 100)) 
                        : aumValNum;
                    let totalFinalRaw = subtotalNum - descCalculadoNum + aumCalculadoNum;
                    const totalFinalNum = Math.round(totalFinalRaw * 10) / 10;

                    const info = {
                        'Fecha': fechaLiteral,
                        'Cliente': mov.entidad?.nombre || 'Cliente ocasional',
                        'Método de pago': mov.metodo_pago || ''
                    };
                    
                    if (mov?.codigo) info['Código'] = mov.codigo;
                    if (mov?.agrupado !== undefined && mov?.agrupado !== null) {
                        info['Modalidad'] = mov.agrupado ? 'Grupos' : 'Unidades';
                    }
                    if (mov?.precio?.name) {
                        info['Tipo de Precio'] = mov.precio.name;
                    }
                    if (mov?.concepto) info['Concepto'] = mov.concepto;
                    
                    const obs = mov.descripcion || mov.observaciones || '';
                    if (obs) info['Observaciones'] = obs;
                    
                    if (descValNum > 0) info['Descuento'] = `Bs. ${formatPrice(descCalculadoNum)}`;
                    if (aumValNum > 0) info['Aumento'] = `Bs. ${formatPrice(aumCalculadoNum)}`;
                    info['Total'] = `Bs. ${formatPrice(totalFinalNum)}`;
                    
                    const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
                    const valores = (mov.productos || []).map(p => {
                        const cant = Number(p.pivot?.cantidad ?? p.cantidad ?? 0);
                        const prec = p.pivot?.precio_unitario ?? p.precio_unitario ?? p.pivot?.precio ?? p.precio ?? 0;
                        const name = p.name || p.producto?.name || 'Desconocido';
                        const code = p.type_measure?.code || p.producto?.type_measure?.code || '';
                        
                        const grup = Number(p.producto?.grup ?? p.grup ?? 0);
                        const esAgrupado = mov.agrupado && grup > 0;
                        const esVenta = mov.type === 'salida' || mov.tipo === 'salida';
                        
                        let cantidadStr = `${cant}`;
                        let precioDescarga = calculateSpecialPrice(prec, grup, esAgrupado, esVenta);
                        const subt = calculateSubtotal(cant, prec, grup, mov.agrupado, esVenta);
                        
                        if (esAgrupado) {
                            const cantEnGrupos = cant / grup;
                            cantidadStr = Number.isInteger(cantEnGrupos) ? cantEnGrupos.toString() : cantEnGrupos.toFixed(2);
                        } else {
                            cantidadStr = `${cant} ${code}`.trim();
                        }
                        
                        return [
                            name,
                            cantidadStr,
                            `Bs. ${formatPrice(precioDescarga)}`,
                            `Bs. ${formatPrice(subt)}`
                        ];
                    });
                    
                    setLocalInfoSuperior(info);
                    setLocalTablaHeaders(headers);
                    setLocalTablaValores(valores);
                    setLocalClienteInfo({
                        nombre: mov.entidad?.nombre || '',
                        numeroOrden: mov.numero_orden || ''
                    });
                }
                setIsSubmitting(false);
            }).catch(e => {
                console.error("Error fetching movimiento", e);
                setIsSubmitting(false);
            });
        }
    }, [isOpen, movimientoId]);

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

    const codigoEmpresa = sucursal?.empresas?.codigo || currentUser?.empresa?.codigo || '';
    const isDamabrava = codigoEmpresa?.toLowerCase() === 'damabrava';

    const [isMobile, setIsMobile] = useState(false);
    const [formato, setFormato] = useState('pdf');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const FORMAT_OPTIONS = [
        { value: 'excel', label: 'EXCEL', icon: 'file', color: 'var(--success-color)', bgColor: 'rgba(96, 223, 67, 0.1)' },
        { value: 'pdf', label: 'PDF', icon: 'file-pdf', iconType: 'solid', color: 'var(--error-color)', bgColor: 'rgba(255, 76, 76, 0.1)' },
        { value: 'img', label: 'IMAGEN', icon: 'image', color: 'var(--primary-color)', bgColor: 'var(--primary-color-light)' },
    ];

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

    useEffect(() => {
        if (esMovimiento) {
            if (isDamabrava) {
                setNombreArchivoState('NT');
                setTituloDocumentoState('NOTA DE ENTREGA');
            } else {
                const fechaFormat = fechaMovimiento || new Date().toISOString().slice(0, 10);
                setNombreArchivoState(`venta_${fechaFormat}`);
                setTituloDocumentoState('VENTA DE PRODUCTOS');
            }
        } else {
            setNombreArchivoState(nombreArchivo);
            setTituloDocumentoState(tituloDocumento);
        }
    }, [nombreArchivo, tituloDocumento, esMovimiento, isDamabrava]);

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

        if (ver && localClienteInfo && localClienteInfo.numeroOrden && localClienteInfo.nombre) {
            // Agregar número y nombre del cliente al nombre del archivo: "NT - Nº X Nombre" (con guion)
            setNombreArchivoState(`NT - Nº ${localClienteInfo.numeroOrden} ${localClienteInfo.nombre}`);
            // Agregar número y nombre del cliente al final del título del documento (sin guion)
            const sufijo = ` Nº ${localClienteInfo.numeroOrden} ${localClienteInfo.nombre}`;
            setTituloDocumentoState(prev => {
                // Si ya tiene el sufijo, no agregarlo de nuevo
                if (prev.endsWith(sufijo)) return prev;
                return prev + sufijo;
            });
        } else {
            if (isDamabrava) {
                setNombreArchivoState('NT');
            } else {
                const fechaFormat = fechaMovimiento || new Date().toISOString().slice(0, 10);
                setNombreArchivoState(`venta_${fechaFormat}`);
            }
            // Remover el sufijo del título del documento si existe
            if (localClienteInfo && localClienteInfo.numeroOrden && localClienteInfo.nombre) {
                const sufijo = ` Nº ${localClienteInfo.numeroOrden} ${localClienteInfo.nombre}`;
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

    const hookOptions = {
    nombreArchivoState,
    tituloDocumentoState,
    informacionSuperior: localInfoSuperior,
    tablaHeaders: localTablaHeaders,
    tablaValores: localTablaValores,
    empresaImageBase64,
    displayImage,
    isMobile,
    incluirFirmas,
    incluirLogos,
    separarColumnas,
    columnWidths,
    mostrarNro,
    orientacion,
    setIsSubmitting,
    setIsOpen
};
    const { handleDescargaExcel } = useDescargaExcel(hookOptions);
    const { handleDescargaPDF } = useDescargaPDF(hookOptions);
    const { handleDescargaImagen } = useDescargaImagen(hookOptions);


    

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

    ;

    const handleImagenDownloadClick = async () => {
        await handleDescargaImagen();
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            if (formato === 'excel') {
                await handleDescargaExcel();
            } else if (formato === 'pdf') {
                await handleDescargaPDF();
            } else if (formato === 'img') {
                await handleDescargaImagen();
            }
        } catch (error) {
            console.error('Error in download:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onClose = () => setIsOpen(false);

    if (!isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title={titulo || "Descargar Datos"}
            confirmText="Descargar"
            onConfirm={handleConfirm}
            loading={isSubmitting}
            disableClose={isSubmitting}
            contentStyle={{ paddingBlock: 0 }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
                <Input
                    label="Nombre del archivo"
                    value={nombreArchivoState}
                    onChange={(e) => handleNombreArchivoChange(e.target.value)}
                    placeholder="Nombre del archivo"
                />
                
                <Input
                    label="Título del documento"
                    value={tituloDocumentoState}
                    onChange={(e) => handleTituloDocumentoChange(e.target.value)}
                    placeholder="Título del documento"
                />

                <InputSelectIcon
                    options={FORMAT_OPTIONS}
                    value={formato}
                    onChange={(val) => setFormato(val)}
                />
                
                {isDamabrava && localClienteInfo && (
                    <Checkbox
                        id="ver_numero"
                        label={`Incluir (Nº ${localClienteInfo.numeroOrden} ${localClienteInfo.nombre})`}
                        checked={verNumero}
                        onChange={handleVerNumeroChange}
                    />
                )}
                
                {formato === 'pdf' && (
                    <Checkbox
                        id="incluir_firmas"
                        label="Incluir espacios para firmas"
                        checked={incluirFirmas}
                        onChange={handleIncluirFirmasChange}
                    />
                )}
                
                {displayImage && (formato === 'pdf' || formato === 'img') && (
                    <Checkbox
                        id="incluir_logos"
                        label="Incluir logo de la empresa"
                        checked={incluirLogos}
                        onChange={handleIncluirLogosChange}
                    />
                )}
            </div>
        </ModalCentro>
    );
}

export default DescargarDatos;