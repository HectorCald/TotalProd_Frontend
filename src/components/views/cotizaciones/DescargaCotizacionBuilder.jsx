import React, { useEffect, useState } from 'react';
import ModalDescarga from '../../ui/ModalDescarga';
import cotizacionesService from '../../../services/cotizacionesService';
import { formatCurrency } from '../../../utils/numberUtils';

function DescargaCotizacionBuilder({ isOpen, setIsOpen, cotizacionId, cotizacionData = null, nombreArchivoDefault = null, tituloDocumentoDefault = null }) {
    const [informacionSuperior, setInformacionSuperior] = useState({});
    const [tablaHeaders, setTablaHeaders] = useState([]);
    const [tablaValores, setTablaValores] = useState([]);
    const [nombreArchivo, setNombreArchivo] = useState('Descargar Cotización');
    const [tituloDocumento, setTituloDocumento] = useState('Cotización');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const fetchCotizacion = async () => {
            if (!isOpen) return;
            try {
                // Si ya tenemos los datos de la cotización, construir directamente sin pedir al servidor
                if (cotizacionData) {
                    const cotizacion = cotizacionData;
                    const nombreSucursal = cotizacion?.sucursales?.name || 'Sucursal no encontrada';
                    
                    const responsable = cotizacion?.user 
                        ? `${cotizacion.user.first_name || ''} ${cotizacion.user.last_name || ''}`.trim()
                        : cotizacion?.personal 
                            ? `${cotizacion.personal.first_name || ''} ${cotizacion.personal.last_name || ''}`.trim()
                            : 'Usuario desconocido';
                    
                    const infoSup = {
                        'Responsable': responsable,
                        'Número de Cotización': cotizacion?.numero_cotizacion || 'Sin número',
                        'Fecha': new Date(cotizacion?.fecha).toLocaleString(),
                        'Estado': cotizacion?.estado === 'anulado' ? 'Anulado' : cotizacion?.estado === 'aprobada' ? 'Aprobada' : 'Pendiente',
                        'Sucursal': nombreSucursal
                    };

                    if (cotizacion?.cliente?.name) {
                        infoSup['Cliente'] = cotizacion.cliente.name;
                    }
                    if (cotizacion?.precio?.name) {
                        infoSup['Tipo de Precio'] = cotizacion.precio.name;
                    }
                    if (cotizacion?.metodo_pago) {
                        infoSup['Método de Pago'] = cotizacion.metodo_pago;
                    }
                    if (cotizacion?.fecha_vencimiento) {
                        infoSup['Fecha de Vencimiento'] = new Date(cotizacion.fecha_vencimiento).toLocaleDateString();
                    }
                    if (cotizacion?.agrupado !== undefined) {
                        infoSup['Modalidad'] = cotizacion.agrupado ? 'Agrupado' : 'Unidades';
                    }
                    if (cotizacion?.productos && cotizacion.productos.length > 0) {
                        const total = cotizacion.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0);
                        infoSup['Total'] = formatCurrency(total);
                    }
                    if (cotizacion?.observaciones) {
                        infoSup['Observaciones'] = cotizacion.observaciones;
                    }

                    const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
                    // Ordenar productos alfabéticamente por nombre
                    const productosOrdenados = (cotizacion?.productos || []).sort((a, b) => 
                        (a?.producto?.name || '').localeCompare(b?.producto?.name || '', 'es', { sensitivity: 'base' })
                    );
                    const valores = productosOrdenados.map(producto => {
                        const cantidad = parseFloat(producto.cantidad) || 0;
                        const grup = parseFloat(producto.producto?.grup) || 0;
                        const esAgrupado = cotizacion?.agrupado && grup > 0;
                        const precioUnitario = parseFloat(producto.precio_unitario) || 0;

                        let cantidadTexto;
                        let precioTexto;

                        if (esAgrupado) {
                            const grupos = Math.floor(cantidad / grup);
                            const unidades = cantidad % grup;
                            cantidadTexto = unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                            precioTexto = formatCurrency(precioUnitario * grup);
                        } else {
                            cantidadTexto = `${cantidad} ud`;
                            precioTexto = formatCurrency(precioUnitario);
                        }

                        return [
                            producto.producto?.name || 'Sin producto',
                            cantidadTexto,
                            precioTexto,
                            formatCurrency(parseFloat(producto.subtotal) || 0)
                        ];
                    });

                    // Fila de total al final
                    const totalFila = (cotizacion?.productos || []).reduce((sum, p) => sum + (parseFloat(p?.subtotal) || 0), 0);
                    valores.push(['TOTAL', '', '', formatCurrency(totalFila)]);

                    setInformacionSuperior(infoSup);
                    setTablaHeaders(headers);
                    setTablaValores(valores);
                    setNombreArchivo(nombreArchivoDefault || `COTIZACIÓN #${cotizacion?.numero_cotizacion || 'Sin número'}`);
                    setTituloDocumento(tituloDocumentoDefault || `COTIZACIÓN #${cotizacion?.numero_cotizacion || 'Sin número'}`);
                    return;
                }

                // Si no tenemos datos, hacer fetch por id y mostrar loading en botones
                if (!cotizacionId) return;
                setCargando(true);
                
                const response = await cotizacionesService.getById(cotizacionId);
                if (response && response.success && response.data) {
                    const cotizacion = response.data;
                    const nombreSucursal = cotizacion?.sucursales?.name || 'Sucursal no encontrada';
                    
                    const responsable = cotizacion?.user 
                        ? `${cotizacion.user.first_name || ''} ${cotizacion.user.last_name || ''}`.trim()
                        : cotizacion?.personal 
                            ? `${cotizacion.personal.first_name || ''} ${cotizacion.personal.last_name || ''}`.trim()
                            : 'Usuario desconocido';
                    
                    const infoSup = {
                        'Responsable': responsable,
                        'Número de Cotización': cotizacion?.numero_cotizacion || 'Sin número',
                        'Fecha': new Date(cotizacion?.fecha).toLocaleString(),
                        'Estado': cotizacion?.estado === 'anulado' ? 'Anulado' : cotizacion?.estado === 'aprobada' ? 'Aprobada' : 'Pendiente',
                        'Sucursal': nombreSucursal
                    };

                    if (cotizacion?.cliente?.name) {
                        infoSup['Cliente'] = cotizacion.cliente.name;
                    }
                    if (cotizacion?.precio?.name) {
                        infoSup['Tipo de Precio'] = cotizacion.precio.name;
                    }
                    if (cotizacion?.metodo_pago) {
                        infoSup['Método de Pago'] = cotizacion.metodo_pago;
                    }
                    if (cotizacion?.fecha_vencimiento) {
                        infoSup['Fecha de Vencimiento'] = new Date(cotizacion.fecha_vencimiento).toLocaleDateString();
                    }
                    if (cotizacion?.agrupado !== undefined) {
                        infoSup['Modalidad'] = cotizacion.agrupado ? 'Agrupado' : 'Unidades';
                    }
                    if (cotizacion?.productos && cotizacion.productos.length > 0) {
                        const total = cotizacion.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0);
                        infoSup['Total'] = formatCurrency(total);
                    }
                    if (cotizacion?.observaciones) {
                        infoSup['Observaciones'] = cotizacion.observaciones;
                    }

                    const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
                    // Ordenar productos alfabéticamente por nombre
                    const productosOrdenados = (cotizacion?.productos || []).sort((a, b) => 
                        (a?.producto?.name || '').localeCompare(b?.producto?.name || '', 'es', { sensitivity: 'base' })
                    );
                    const valores = productosOrdenados.map(producto => {
                        const cantidad = parseFloat(producto.cantidad) || 0;
                        const grup = parseFloat(producto.producto?.grup) || 0;
                        const esAgrupado = cotizacion?.agrupado && grup > 0;
                        const precioUnitario = parseFloat(producto.precio_unitario) || 0;

                        let cantidadTexto;
                        let precioTexto;

                        if (esAgrupado) {
                            const grupos = Math.floor(cantidad / grup);
                            const unidades = cantidad % grup;
                            cantidadTexto = unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                            precioTexto = formatCurrency(precioUnitario * grup);
                        } else {
                            cantidadTexto = `${cantidad} ud`;
                            precioTexto = formatCurrency(precioUnitario);
                        }

                        return [
                            producto.producto?.name || 'Sin producto',
                            cantidadTexto,
                            precioTexto,
                            formatCurrency(parseFloat(producto.subtotal) || 0)
                        ];
                    });

                    // Fila de total al final
                    const totalFila = (cotizacion?.productos || []).reduce((sum, p) => sum + (parseFloat(p?.subtotal) || 0), 0);
                    valores.push(['TOTAL', '', '', formatCurrency(totalFila)]);

                    setInformacionSuperior(infoSup);
                    setTablaHeaders(headers);
                    setTablaValores(valores);
                    setNombreArchivo(nombreArchivoDefault || `COTIZACIÓN #${cotizacion?.numero_cotizacion || 'Sin número'}`);
                    setTituloDocumento(tituloDocumentoDefault || `COTIZACIÓN #${cotizacion?.numero_cotizacion || 'Sin número'}`);
                }
            } catch (error) {
                console.error('Error construyendo datos de descarga de la cotización:', error);
            } finally {
                setCargando(false);
            }
        };

        fetchCotizacion();
    }, [isOpen, cotizacionId, cotizacionData]);

    return (
        <ModalDescarga
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            titulo="Descargar Cotización"
            subtitulo="Selecciona el formato que prefieras para descargar esta cotización."
            nombreArchivo={nombreArchivo}
            tituloDocumento={tituloDocumento}
            informacionSuperior={informacionSuperior}
            tablaHeaders={tablaHeaders}
            tablaValores={tablaValores}
            loading={cargando}
            esMovimiento={false}
        />
    );
}

export default DescargaCotizacionBuilder;
