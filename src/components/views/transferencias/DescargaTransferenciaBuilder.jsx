import React, { useEffect, useState } from 'react';
import ModalDescarga from '../../ui/ModalDescarga';
import transferenciasAlmacenService from '../../../services/transferenciasAlmacenService';
import { formatCurrency } from '../../../utils/numberUtils';

function DescargaTransferenciaBuilder({ isOpen, setIsOpen, transferenciaId, transferenciaData = null, nombreArchivoDefault = null, tituloDocumentoDefault = null }) {
    const [informacionSuperior, setInformacionSuperior] = useState({});
    const [tablaHeaders, setTablaHeaders] = useState([]);
    const [tablaValores, setTablaValores] = useState([]);
    const [nombreArchivo, setNombreArchivo] = useState('Descargar Transferencia');
    const [tituloDocumento, setTituloDocumento] = useState('Transferencia');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const fetchTransferencia = async () => {
            if (!isOpen) return;
            try {
                // Si ya tenemos los datos de la transferencia, construir directamente sin pedir al servidor
                if (transferenciaData) {
                    const transferencia = transferenciaData;
                    const nombreSucursalOrigen = transferencia?.sucursal_origen?.name || 'Sucursal origen no encontrada';
                    const nombreSucursalDestino = transferencia?.sucursal_destino?.name || 'Sucursal destino no encontrada';
                    
                    const responsable = transferencia?.user?.name || transferencia?.personal?.name || 'Usuario desconocido';
                    
                    const infoSup = {
                        'Responsable': responsable,
                        'Sucursal Origen': nombreSucursalOrigen,
                        'Sucursal Destino': nombreSucursalDestino,
                        'Fecha': new Date(transferencia?.fecha).toLocaleString(),
                        'Estado': transferencia?.estado === 'Anulado' ? 'Anulado' : transferencia?.estado === 'Finalizado' ? 'Finalizado' : 'Transferido'
                    };

                    if (transferencia?.precio?.name) {
                        infoSup['Tipo de Precio'] = transferencia.precio.name;
                    }
                    if (transferencia?.agrupado !== undefined) {
                        infoSup['Modalidad'] = transferencia.agrupado ? 'Agrupado' : 'Unidades';
                    }
                    if (transferencia?.productos && transferencia.productos.length > 0) {
                        const total = transferencia.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0);
                        infoSup['Total'] = formatCurrency(total);
                    }
                    if (transferencia?.concepto) {
                        infoSup['Concepto'] = transferencia.concepto;
                    }

                    const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
                    // Ordenar productos alfabéticamente por nombre
                    const productosOrdenados = (transferencia?.productos || []).sort((a, b) => 
                        (a?.producto?.name || '').localeCompare(b?.producto?.name || '', 'es', { sensitivity: 'base' })
                    );
                    const valores = productosOrdenados.map(producto => {
                        const cantidad = parseFloat(producto.cantidad) || 0;
                        const grup = parseFloat(producto.producto?.grup) || 0;
                        const esAgrupado = transferencia?.agrupado && grup > 0;
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
                    const totalFila = (transferencia?.productos || []).reduce((sum, p) => sum + (parseFloat(p?.subtotal) || 0), 0);
                    valores.push(['TOTAL', '', '', formatCurrency(totalFila)]);

                    setInformacionSuperior(infoSup);
                    setTablaHeaders(headers);
                    setTablaValores(valores);
                    setNombreArchivo(nombreArchivoDefault || `TRANSFERENCIA ${nombreSucursalOrigen} → ${nombreSucursalDestino}`);
                    setTituloDocumento(tituloDocumentoDefault || `TRANSFERENCIA ${nombreSucursalOrigen} → ${nombreSucursalDestino}`);
                    return;
                }

                // Si no tenemos datos, hacer fetch por id y mostrar loading en botones
                if (!transferenciaId) return;
                setCargando(true);
                
                const response = await transferenciasAlmacenService.getById(transferenciaId);
                if (response && response.success && response.data) {
                    const transferencia = response.data;
                    const nombreSucursalOrigen = transferencia?.sucursal_origen?.name || 'Sucursal origen no encontrada';
                    const nombreSucursalDestino = transferencia?.sucursal_destino?.name || 'Sucursal destino no encontrada';
                    
                    const responsable = transferencia?.user?.name || transferencia?.personal?.name || 'Usuario desconocido';
                    
                    const infoSup = {
                        'Responsable': responsable,
                        'Sucursal Origen': nombreSucursalOrigen,
                        'Sucursal Destino': nombreSucursalDestino,
                        'Fecha': new Date(transferencia?.fecha).toLocaleString(),
                        'Estado': transferencia?.estado === 'Anulado' ? 'Anulado' : transferencia?.estado === 'Finalizado' ? 'Finalizado' : 'Transferido'
                    };

                    if (transferencia?.precio?.name) {
                        infoSup['Tipo de Precio'] = transferencia.precio.name;
                    }
                    if (transferencia?.agrupado !== undefined) {
                        infoSup['Modalidad'] = transferencia.agrupado ? 'Agrupado' : 'Unidades';
                    }
                    if (transferencia?.productos && transferencia.productos.length > 0) {
                        const total = transferencia.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0);
                        infoSup['Total'] = formatCurrency(total);
                    }
                    if (transferencia?.concepto) {
                        infoSup['Concepto'] = transferencia.concepto;
                    }

                    const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
                    // Ordenar productos alfabéticamente por nombre
                    const productosOrdenados = (transferencia?.productos || []).sort((a, b) => 
                        (a?.producto?.name || '').localeCompare(b?.producto?.name || '', 'es', { sensitivity: 'base' })
                    );
                    const valores = productosOrdenados.map(producto => {
                        const cantidad = parseFloat(producto.cantidad) || 0;
                        const grup = parseFloat(producto.producto?.grup) || 0;
                        const esAgrupado = transferencia?.agrupado && grup > 0;
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
                    const totalFila = (transferencia?.productos || []).reduce((sum, p) => sum + (parseFloat(p?.subtotal) || 0), 0);
                    valores.push(['TOTAL', '', '', formatCurrency(totalFila)]);

                    setInformacionSuperior(infoSup);
                    setTablaHeaders(headers);
                    setTablaValores(valores);
                    setNombreArchivo(nombreArchivoDefault || `TRANSFERENCIA ${nombreSucursalOrigen} → ${nombreSucursalDestino}`);
                    setTituloDocumento(tituloDocumentoDefault || `TRANSFERENCIA ${nombreSucursalOrigen} → ${nombreSucursalDestino}`);
                }
            } catch (error) {
                console.error('Error construyendo datos de descarga de la transferencia:', error);
            } finally {
                setCargando(false);
            }
        };

        fetchTransferencia();
    }, [isOpen, transferenciaId, transferenciaData]);

    return (
        <ModalDescarga
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            titulo="Descargar Transferencia"
            subtitulo="Selecciona el formato que prefieras para descargar esta transferencia."
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

export default DescargaTransferenciaBuilder;
