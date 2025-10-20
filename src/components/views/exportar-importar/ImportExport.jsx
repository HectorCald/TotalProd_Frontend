import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import Checkbox from '../../common/Checkbox';
import Notification from '../../common/Notification';
import Etapa from '../../common/Etapa';
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

            mostrarNotificacion('success', `Importación completada: ${resultado.actualizados}/${resultado.total} productos actualizados`);

        } catch (error) {
            mostrarNotificacion('error', 'Error al procesar el archivo');
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
                    }).filter(producto => producto.ID); // Solo productos con ID
                    
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
        
        if (!formato || formato.tipo !== 'almacen') {
            throw new Error('Formato de archivo no válido');
        }

        const opciones = formato.opciones || [];
        const productosParaActualizar = [];

        for (const producto of datos) {
            if (!producto.ID) continue;

            // Solo procesar si tiene nombre válido
            if (!producto.Nombre || producto.Nombre.trim() === '') {
                continue;
            }

            const productoData = { 
                id: producto.ID,
                name: producto.Nombre.trim()
            };

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

            productosParaActualizar.push(productoData);
        }

        if (productosParaActualizar.length === 0) {
            throw new Error('No hay productos válidos para actualizar');
        }

        // Llamar al servicio de actualización masiva
        const response = await productsAlmacenService.bulkUpdate(productosParaActualizar);
        return response.data;
    };

    const handleExportar = async () => {
        await exportarAlmacen();
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
            mostrarNotificacion('error', 'Error al exportar el archivo');
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
                    etapas={tipoOperacion === 'importar' ? etapasImportar : etapasExportar} 
                    etapaActual={etapaActual} 
                />


                <div className={styles.content}>
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

                <div className={styles.buttons}>
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
                        loading={loading}
                        disabled={loading}
                    />
                </div>
            </div>


            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </ViewModal>
    );
}

export default ImportExport;
