import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import Checkbox from '../../common/Checkbox';
import Notification from '../../common/Notification';
import Etapa from '../../common/Etapa';
import InfoModal from '../../common/InfoModal';
import productsAlmacenService from '../../../services/productsAlmacenService';
import pricesTypesService from '../../../services/pricesTypesService';
import * as XLSX from 'xlsx';
import xlsIcon from '../../../assets/xls.png';

function ImportExport({ isOpen, setIsOpen }) {
    // Estados para los checkboxes de almacén
    const [preciosChecked, setPreciosChecked] = useState(false);
    const [codigoBarrasChecked, setCodigoBarrasChecked] = useState(false);
    const [descripcionChecked, setDescripcionChecked] = useState(false);

    // Estados para datos
    const [productos, setProductos] = useState([]);
    const [preciosData, setPreciosData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para etapas (siempre visible)
    const [etapaActual, setEtapaActual] = useState(-1); // -1 = ninguna etapa activa
    const [mostrarEtapas, setMostrarEtapas] = useState(true);
    const [tipoOperacion, setTipoOperacion] = useState(''); // 'importar' o 'exportar'

    // Estados para la notificación
    const [notification, setNotification] = useState({ isVisible: false, type: 'success', text: '' });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Estados y configuraciones para el modal de información
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        showButton: false
    });

    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Importar/Exportar';
            
            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Modulo no incluido',
                description: `${errorMessage}`,
                showButton: true
            });
        }
    }, [error, isOpen]);

    const etapasExportar = [
        { label: 'Preparando datos', icon: 'cog' },
        { label: 'Obteniendo datos', icon: 'download' },
        { label: 'Generando archivo', icon: 'file' },
        { label: 'Exportación completada', icon: 'check' }
    ];

    const etapasImportar = [
        { label: 'Archivo Excel subido', icon: 'upload' },
        { label: 'Analizando archivo', icon: 'search' },
        { label: 'Cargando productos', icon: 'loader-alt' },
        { label: 'Importación completada', icon: 'check' }
    ];

    const etapasPlantilla = [
        { label: 'Preparando plantilla', icon: 'cog' },
        { label: 'Generando formato', icon: 'file' },
        { label: 'Descarga completada', icon: 'check' }
    ];

    const handleImportar = () => {
        // Crear input de archivo dinámicamente
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = (e) => {
            const archivo = e.target.files[0];
            if (archivo) {
                procesarArchivo(archivo);
            }
        };
        input.click();
    };

    const procesarArchivo = async (archivo) => {
        try {
            setTipoOperacion('importar');
            setMostrarEtapas(true);
            setEtapaActual(0);

            // Etapa 1: Subido
            await new Promise(resolve => setTimeout(resolve, 500));
            setEtapaActual(1);

            // Etapa 2: Análisis
            const data = await leerArchivoExcel(archivo);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setEtapaActual(2);

            // Etapa 3: Cargando
            const resultado = await importarDatos(data);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setEtapaActual(3);

            // Etapa 4: Finalizado - Ocultar etapas después de un delay
            setTimeout(() => {
                setMostrarEtapas(false);
                setEtapaActual(-1);
                setTipoOperacion('');
            }, 2000);

            const esPlantilla = data.formato?.tipo === 'plantilla';
            
            // Mostrar errores específicos si los hay
            if (resultado.errores && resultado.errores.length > 0) {
                mostrarNotificacion('error', `Errores: ${resultado.errores.join(', ')}`);
            } else {
                const mensaje = esPlantilla 
                    ? `Importación completada: ${resultado.creados || resultado.total} productos creados`
                    : `Importación completada: ${resultado.actualizados}/${resultado.total} productos actualizados`;
                mostrarNotificacion('success', mensaje);
            }

        } catch (error) {
            setError(error);
            mostrarNotificacion('error', `Error al procesar el archivo: ${error.message}`);
            setMostrarEtapas(false);
            setEtapaActual(-1);
            setTipoOperacion('');
        }
    };

    const leerArchivoExcel = (archivo) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Buscar la hoja de productos
                    const sheetName = workbook.SheetNames.find(name => 
                        name.toLowerCase().includes('producto') || 
                        name.toLowerCase().includes('productos')
                    ) || workbook.SheetNames[0];
                    
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    // Leer formato de la primera fila
                    const formatoRow = jsonData[0];
                    let formato = null;
                    
                    if (formatoRow && formatoRow.length > 0) {
                        try {
                            formato = JSON.parse(formatoRow[0]);
                        } catch (e) {
                            console.warn('No se pudo parsear el formato de la primera fila');
                        }
                    }
                    
                    // Leer headers de la segunda fila
                    const headers = jsonData[1] || [];
                    
                    // Leer datos desde la tercera fila
                    const datos = jsonData.slice(2).map(fila => {
                        const producto = {};
                        headers.forEach((header, index) => {
                            if (header && fila[index] !== undefined) {
                                producto[header] = fila[index];
                            }
                        });
                        return producto;
                    }).filter(producto => {
                        // Para plantillas, no necesitamos ID, solo nombre (manejar tanto "Nombre" como "Nombre producto")
                        if (formato?.tipo === 'plantilla') {
                            const nombreProducto = producto['Nombre producto'] || producto.Nombre;
                            return nombreProducto && nombreProducto.trim() !== '';
                        }
                        // Para actualización, necesitamos ID
                        return producto.ID;
                    });
                    
                    resolve({ formato, headers, datos });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(archivo);
        });
    };

    const importarDatos = async (data) => {
        const { formato, datos } = data;
        
        if (!formato || (formato.tipo !== 'almacen' && formato.tipo !== 'plantilla')) {
            throw new Error('Formato de archivo no válido');
        }

        const opciones = formato.opciones || [];
        const esPlantilla = formato.tipo === 'plantilla';
        const productosParaProcesar = [];

        for (const producto of datos) {
            // Para plantillas, no necesitamos ID
            if (!esPlantilla && !producto.ID) continue;

            // Solo procesar si tiene nombre válido (manejar tanto "Nombre" como "Nombre producto")
            const nombreProducto = producto['Nombre producto'] || producto.Nombre;
            if (!nombreProducto || nombreProducto.trim() === '') {
                continue;
            }

            const productoData = { 
                name: nombreProducto.trim()
            };

            // Solo agregar ID si no es plantilla
            if (!esPlantilla && producto.ID) {
                productoData.id = producto.ID;
            }

            // Actualizar según las opciones del formato
            if (opciones.includes('codigo_barras') && producto['Código de Barras']) {
                productoData.codigo_barras = producto['Código de Barras'];
            }

            if (opciones.includes('descripcion') && producto.Descripción) {
                productoData.description = producto.Descripción;
            }

            if (opciones.includes('precios')) {
                const precios = {};
                // Buscar columnas de precios (formato: "Nombre (ID)")
                Object.keys(producto).forEach(key => {
                    if (key.includes('(') && key.includes(')')) {
                        const match = key.match(/^(.+)\s+\((.+)\)$/);
                        if (match) {
                            const [, nombre, id] = match;
                            const valor = producto[key];
                            if (valor !== undefined && valor !== null && valor !== '') {
                                precios[id] = parseFloat(valor) || 0;
                            }
                        }
                    }
                });
                
                if (Object.keys(precios).length > 0) {
                    productoData.precios = precios;
                }
            }

            productosParaProcesar.push(productoData);
        }

        if (productosParaProcesar.length === 0) {
            throw new Error('No hay productos válidos para procesar');
        }

        let response;
        if (esPlantilla) {
            // Crear nuevos productos desde plantilla
            response = await productsAlmacenService.bulkCreate(productosParaProcesar);
        } else {
            // Actualizar productos existentes
            response = await productsAlmacenService.bulkUpdate(productosParaProcesar);
        }
        
        if (!response.success) {
            throw new Error(response.message || 'Error en la operación');
        }
        
        return response.data;
    };

    const handleExportar = async () => {
        await exportarAlmacen();
    };

    const handlePlantilla = async () => {
        await exportarPlantilla();
    };

    const exportarAlmacen = async () => {
        try {
            setTipoOperacion('exportar');
            setLoading(true);
            setMostrarEtapas(true);
            setEtapaActual(0);
            
            // Etapa 1: Preparando
            await new Promise(resolve => setTimeout(resolve, 500));
            setEtapaActual(1);
            
            // Etapa 2: Obteniendo datos
            const response = await productsAlmacenService.getAll();
            
            if (!response.success) {
                throw new Error(response.message);
            }
            
            const productosData = response.data;
            
            // Hacer petición para obtener precios si está marcado
            let preciosData = [];
            if (preciosChecked) {
                const preciosResponse = await pricesTypesService.getAll();
                if (preciosResponse.success) {
                    preciosData = preciosResponse.data;
                }
            }
            
            if (productosData.length === 0) {
                throw new Error('No hay productos para exportar');
            }
            
            // Etapa 3: Generando archivo
            await new Promise(resolve => setTimeout(resolve, 500));
            setEtapaActual(2);

            // Crear el formato de descarga en A1
            const opcionesSeleccionadas = [];
            if (preciosChecked) opcionesSeleccionadas.push('precios');
            if (codigoBarrasChecked) opcionesSeleccionadas.push('codigo_barras');
            if (descripcionChecked) opcionesSeleccionadas.push('descripcion');

            const formatoDescarga = {
                tipo: 'almacen',
                opciones: opcionesSeleccionadas,
                fecha: new Date().toISOString()
            };

            // Crear headers dinámicos
            const headers = ['ID', 'Nombre'];
            
            // Agregar headers de precios si está seleccionado
            if (preciosChecked && preciosData.length > 0) {
                preciosData.forEach(precio => {
                    headers.push(`${precio.name} (${precio.id})`);
                });
            }

            // Agregar código de barras si está seleccionado
            if (codigoBarrasChecked) {
                headers.push('Código de Barras');
            }

            // Agregar descripción si está seleccionado
            if (descripcionChecked) {
                headers.push('Descripción');
            }

            // Crear datos de la tabla
            const datos = productosData.map((producto) => {
                const fila = [producto.id, producto.name];

                // Agregar precios si está seleccionado
                if (preciosChecked && preciosData.length > 0) {
                    preciosData.forEach(precio => {
                        const precioProducto = producto.price_product?.find(pp => pp.prices_types?.id === precio.id);
                        const valor = precioProducto?.valor || 0;
                        fila.push(valor);
                    });
                }

                // Agregar código de barras si está seleccionado
                if (codigoBarrasChecked) {
                    const codigo = producto.codigo_barras || '';
                    fila.push(codigo);
                }

                // Agregar descripción si está seleccionado
                if (descripcionChecked) {
                    const descripcion = producto.description || '';
                    fila.push(descripcion);
                }

                return fila;
            });

            // Crear workbook
            const workbook = XLSX.utils.book_new();
            
            // Crear datos completos: formato en A1, headers en fila 2, datos desde fila 3
            const formatoRow = [JSON.stringify(formatoDescarga)];
            const allData = [
                formatoRow,  // Fila 1: Formato
                headers,     // Fila 2: Headers
                ...datos     // Fila 3+: Datos de productos
            ];
            
            const worksheet = XLSX.utils.aoa_to_sheet(allData);

            // Configurar anchos de columnas específicos
            const colWidths = headers.map((header, index) => {
                if (index === 0) return { wch: 15 }; // ID - más pequeña
                if (index === 1) return { wch: 30 }; // Nombre - se ajusta al contenido
                if (header === 'Código de Barras') return { wch: 25 }; // Código de Barras - ajustado al contenido
                if (header === 'Descripción') return { wch: 35 }; // Descripción - ajustado al contenido
                return { wch: 12 }; // Precios - más pequeñas
            });
            worksheet['!cols'] = colWidths;

            // Aplicar estilos a los headers (fila 2)
            const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
            for (let col = 0; col <= headerRange.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col }); // Fila 2 (índice 1)
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "366092" } },
                        alignment: { horizontal: "center" }
                    };
                }
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

            // Descargar archivo
            const nombreArchivo = `Almacen_${new Date().toISOString().split('T')[0]}`;
            XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`);

            // Etapa 4: Completado
            await new Promise(resolve => setTimeout(resolve, 500));
            setEtapaActual(3);
            
            // Ocultar etapas después de un delay
            setTimeout(() => {
                setMostrarEtapas(false);
                setEtapaActual(-1);
                setTipoOperacion('');
            }, 2000);

            mostrarNotificacion('success', 'Archivo exportado correctamente');
        } catch (error) {
            setError(error);
            mostrarNotificacion('error', 'Error al exportar el archivo');
            setMostrarEtapas(false);
            setEtapaActual(-1);
            setTipoOperacion('');
        } finally {
            setLoading(false);
        }
    };

    const exportarPlantilla = async () => {
        try {
            setTipoOperacion('plantilla');
            setLoading(true);
            setMostrarEtapas(true);
            setEtapaActual(0);
            
            // Etapa 1: Preparando
            await new Promise(resolve => setTimeout(resolve, 500));
            setEtapaActual(1);
            
            // Etapa 2: Generando formato
            await new Promise(resolve => setTimeout(resolve, 500));
            setEtapaActual(2);

            // Obtener precios si está marcado
            let preciosData = [];
            if (preciosChecked) {
                const preciosResponse = await pricesTypesService.getAll();
                if (preciosResponse.success) {
                    preciosData = preciosResponse.data;
                }
            }

            // Crear el formato de plantilla
            const opcionesSeleccionadas = [];
            if (preciosChecked) opcionesSeleccionadas.push('precios');
            if (codigoBarrasChecked) opcionesSeleccionadas.push('codigo_barras');
            if (descripcionChecked) opcionesSeleccionadas.push('descripcion');

            const formatoPlantilla = {
                tipo: 'plantilla',
                opciones: opcionesSeleccionadas,
                fecha: new Date().toISOString()
            };

            // Crear headers dinámicos (sin ID)
            const headers = ['Nombre producto'];
            
            // Agregar headers de precios si está seleccionado
            if (preciosChecked && preciosData.length > 0) {
                preciosData.forEach(precio => {
                    headers.push(`${precio.name} (${precio.id})`);
                });
            }

            // Agregar código de barras si está seleccionado
            if (codigoBarrasChecked) {
                headers.push('Código de Barras');
            }

            // Agregar descripción si está seleccionado
            if (descripcionChecked) {
                headers.push('Descripción');
            }

            // Crear workbook
            const workbook = XLSX.utils.book_new();
            
            // Crear datos completos: formato en A1, headers en fila 2, sin datos de productos
            const formatoRow = [JSON.stringify(formatoPlantilla)];
            const allData = [
                formatoRow,  // Fila 1: Formato
                headers      // Fila 2: Headers (sin datos)
            ];
            
            const worksheet = XLSX.utils.aoa_to_sheet(allData);

            // Configurar anchos de columnas específicos
            const colWidths = headers.map((header, index) => {
                if (index === 0) return { wch: 30 }; // Nombre - se ajusta al contenido
                if (header === 'Código de Barras') return { wch: 25 }; // Código de Barras - ajustado al contenido
                if (header === 'Descripción') return { wch: 35 }; // Descripción - ajustado al contenido
                return { wch: 12 }; // Precios - más pequeñas
            });
            worksheet['!cols'] = colWidths;

            // Aplicar estilos a los headers (fila 2)
            const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
            for (let col = 0; col <= headerRange.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col }); // Fila 2 (índice 1)
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "366092" } },
                        alignment: { horizontal: "center" }
                    };
                }
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

            // Descargar archivo
            const nombreArchivo = `Plantilla_Almacen_${new Date().toISOString().split('T')[0]}`;
            XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`);
            
            // Etapa 3: Completado
            await new Promise(resolve => setTimeout(resolve, 500));
            setEtapaActual(3);
            
            // Ocultar etapas después de un delay
            setTimeout(() => {
                setMostrarEtapas(false);
                setEtapaActual(-1);
                setTipoOperacion('');
            }, 2000);

            mostrarNotificacion('success', 'Plantilla descargada correctamente');
        } catch (error) {
            setError(error);
            mostrarNotificacion('error', 'Error al generar la plantilla');
            setMostrarEtapas(false);
            setEtapaActual(-1);
            setTipoOperacion('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Importar/Exportar"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>IMPORTA O EXPORTA EN EXCEL EL ALMACÉN GENERAL </p>

                <Etapa 
                    etapas={
                        tipoOperacion === 'importar' ? etapasImportar : 
                        tipoOperacion === 'plantilla' ? etapasPlantilla : 
                        etapasExportar
                    } 
                    etapaActual={etapaActual} 
                />


                <div className={styles.content} style={{ marginTop: '10px' }}>
                    <Checkbox
                        title="Precios"
                        subtitle="Incluir información de precios"
                        checked={preciosChecked}
                        onChange={setPreciosChecked}
                        icon="dollar"
                    />
                    <Checkbox
                        title="Código de Barras"
                        subtitle="Incluir códigos de barras"
                        checked={codigoBarrasChecked}
                        onChange={setCodigoBarrasChecked}
                        icon="barcode"
                    />
                    <Checkbox
                        title="Descripción"
                        subtitle="Incluir descripciones de productos"
                        checked={descripcionChecked}
                        onChange={setDescripcionChecked}
                        icon="text"
                    />
                </div>

                <div className={styles.buttons} style={{ marginTop: '10px' }}>
                    <Boton
                        className='btn-default'
                        label='Importar'
                        icon={xlsIcon}
                        onClick={handleImportar}
                        disabled={loading}
                    />
                    <Boton
                        className='btn-default'
                        label='Exportar'
                        icon={xlsIcon}
                        onClick={handleExportar}
                        disabled={loading}
                    />
                </div>
                
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Plantilla'
                        icon={xlsIcon}
                        onClick={handlePlantilla}
                        disabled={loading}
                    />
                </div>
            </div>


            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Modal de Información */}
            <InfoModal
                isOpen={modalConfig.isOpen}
                setIsOpen={(isOpen) => setModalConfig(prev => ({ ...prev, isOpen }))}
                type={modalConfig.type}
                title={modalConfig.title}
                description={modalConfig.description}
                showButton={modalConfig.showButton}
                buttonText="Aceptar"
                onButtonClick={() => setIsOpen(false)}
            />
        </ViewModal>
    );
}

export default ImportExport;
