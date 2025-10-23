import React, { useEffect, useState } from 'react';
import ModalDescarga from '../../ui/ModalDescarga';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import movimientosAcopioService from '../../../services/movimientosAcopioService';

function DescargaMovimientoBuilder({ isOpen, setIsOpen, movimientoId, tipo = 'almacen', movimientoData = null, nombreArchivoDefault = null, tituloDocumentoDefault = null }) {
    const [informacionSuperior, setInformacionSuperior] = useState({});
    const [tablaHeaders, setTablaHeaders] = useState([]);
    const [tablaValores, setTablaValores] = useState([]);
    const [nombreArchivo, setNombreArchivo] = useState('Descargar Movimiento');
    const [tituloDocumento, setTituloDocumento] = useState('Movimiento');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const fetchMovimiento = async () => {
            if (!isOpen) return;
            try {
                const pickOrderNumber = (mov) => {
                    // Busca un posible número/código de venta/entrega
                    const candidates = [
                        mov?.total_ordenes,
                        mov?.total_ordenrs,
                        mov?.total_orden,
                        mov?.nro_venta,
                        mov?.numero_venta,
                        mov?.nro_entrega,
                        mov?.numero_entrega,
                        mov?.nro,
                        mov?.numero,
                        mov?.num,
                        mov?.codigo,
                    ];
                    return candidates.find(v => v !== undefined && v !== null && v !== '') || null;
                };

                // Si ya tenemos los datos del movimiento, construir directamente sin pedir al servidor
                if (movimientoData) {
                    if (tipo === 'acopio') {
                        const movimiento = movimientoData;
                        const nombreSucursal = movimiento?.sucursal?.name || 'Sucursal no encontrada';
                        const infoSup = {
                            'Responsable': movimiento?.user?.name || movimiento?.personal?.name || 'Usuario desconocido',
                            'Tipo': movimiento?.type === 'entrada' ? 'Entrada' : 'Salida',
                            'Fecha': new Date(movimiento?.date).toLocaleString(),
                            'Estado': movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado',
                            'Sucursal': nombreSucursal
                        };
                        if (movimiento?.type === 'entrada' && movimiento?.proveedor?.name) {
                            infoSup['Proveedor'] = movimiento.proveedor.name;
                            infoSup['Órdenes del Proveedor'] = (movimiento?.proveedor?.total_orders ?? 0);
                        }
                        if (movimiento?.type === 'salida' && movimiento?.cliente?.name) {
                            infoSup['Cliente'] = movimiento.cliente.name;
                            infoSup['Órdenes del Cliente'] = (movimiento?.cliente?.total_orders ?? 0);
                        }
                        const orderNumberA = pickOrderNumber(movimiento);
                        if (orderNumberA) {
                            const etiqueta = movimiento?.type === 'salida' ? 'Venta N°' : 'Entrega N°';
                            infoSup[etiqueta] = String(orderNumberA);
                        }
                        if (movimiento?.metodo_pago) infoSup['Método de Pago'] = movimiento.metodo_pago;
                        if (movimiento?.costo) infoSup['Costo'] = `Bs. ${parseFloat(movimiento.costo).toFixed(2)}`;
                        if (movimiento?.restar_ingredientes !== undefined) infoSup['Restar Ingredientes'] = movimiento.restar_ingredientes ? 'Sí' : 'No';
                        if (movimiento?.observaciones) infoSup['Observaciones'] = movimiento.observaciones;
                        const headers = ['Producto', 'Cantidad', 'Unidad de Medida'];
                        const valores = [[
                            movimiento?.product?.name || 'Sin producto',
                            movimiento?.quantity || '0',
                            movimiento?.product?.type_measure?.code || ''
                        ]];
                        setInformacionSuperior(infoSup);
                        setTablaHeaders(headers);
                        setTablaValores(valores);
                        setNombreArchivo(nombreArchivoDefault || (movimiento?.type === 'entrada' ? 'NOTA DE INGRESO' : 'NOTA DE ENTREGA'));
                        setTituloDocumento(tituloDocumentoDefault || (movimiento?.type === 'entrada' ? 'NOTA DE INGRESO' : 'NOTA DE ENTREGA'));
                        return;
                    } else {
                        const movimiento = movimientoData;
                        const nombreSucursal = movimiento?.sucursal?.name || 'Sucursal no encontrada';
                        const infoSup = {
                            'Responsable': movimiento?.user?.name || movimiento?.personal?.name || 'Usuario desconocido',
                            'Tipo': movimiento?.type === 'entrada' ? 'Entrada' : 'Salida',
                            'Fecha': new Date(movimiento?.fecha).toLocaleString(),
                            'Estado': movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado',
                            'Sucursal': nombreSucursal
                        };
                        if (movimiento?.type === 'entrada' && movimiento?.proveedor?.name) {
                            infoSup['Proveedor'] = movimiento.proveedor.name;
                            infoSup['Órdenes del Proveedor'] = (movimiento?.proveedor?.total_orders ?? 0);
                        }
                        if (movimiento?.type === 'salida' && movimiento?.cliente?.name) {
                            infoSup['Cliente'] = movimiento.cliente.name;
                            infoSup['Número de Orden'] = (movimiento?.numero_orden ?? 0);
                        }
                        const orderNumberB = pickOrderNumber(movimiento);
                        if (orderNumberB) {
                            const etiqueta = movimiento?.type === 'salida' ? 'Venta N°' : 'Entrega N°';
                            infoSup[etiqueta] = String(orderNumberB);
                        }
                        if (movimiento?.precio?.name) infoSup['Tipo de Precio'] = movimiento.precio.name;
                        if (movimiento?.metodo_pago) infoSup['Método de Pago'] = movimiento.metodo_pago;
                        if (movimiento?.agrupado !== undefined) infoSup['Modalidad'] = movimiento.agrupado ? 'Agrupado' : 'Unidades';
                        if (movimiento?.productos && movimiento.productos.length > 0) {
                            const total = movimiento.productos.reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0);
                            infoSup['Total'] = `Bs. ${total.toFixed(2)}`;
                        }
                        if (movimiento?.observaciones) infoSup['Observaciones'] = movimiento.observaciones;
                        const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
                        const valores = (movimiento?.productos || []).map(p => {
                            const cantidad = parseFloat(p?.cantidad) || 0;
                            const grup = parseFloat(p?.producto?.grup) || 0;
                            const esAgrupado = movimiento?.agrupado && grup > 0;
                            const precioUnitario = parseFloat(p?.precio_unitario) || 0;

                            let cantidadTexto;
                            let precioTexto;

                            if (esAgrupado) {
                                const grupos = Math.floor(cantidad / grup);
                                const unidades = cantidad % grup;
                                // Solo números, sin "grup" ni "ud"
                                cantidadTexto = unidades > 0 ? `${grupos}.${unidades}` : `${grupos}`;
                                // Precio unitario multiplicado por la cantidad de agrupación
                                precioTexto = `Bs. ${(precioUnitario * grup).toFixed(2)}`;
                            } else {
                                // Solo números, sin "ud"
                                cantidadTexto = `${cantidad}`;
                                precioTexto = `Bs. ${precioUnitario.toFixed(2)}`;
                            }

                            return [
                                p?.producto?.name || 'Sin producto',
                                cantidadTexto,
                                precioTexto,
                                `Bs. ${(parseFloat(p?.subtotal) || 0).toFixed(2)}`
                            ];
                        });
                        // Fila de total al final
                        const totalFila = (movimiento?.productos || []).reduce((sum, p) => sum + (parseFloat(p?.subtotal) || 0), 0);
                        valores.push(['TOTAL', '', '', `Bs. ${totalFila.toFixed(2)}`]);
                        setInformacionSuperior(infoSup);
                        setTablaHeaders(headers);
                        setTablaValores(valores);
                        setNombreArchivo(nombreArchivoDefault || (movimiento?.type === 'entrada' ? 'NOTA DE INGRESO' : 'NOTA DE ENTREGA'));
                        setTituloDocumento(tituloDocumentoDefault || (movimiento?.type === 'entrada' ? 'NOTA DE INGRESO' : 'NOTA DE ENTREGA'));
                        return;
                    }
                }

                // Si no tenemos datos, hacer fetch por id y mostrar loading en botones
                if (!movimientoId) return;
                setCargando(true);
                if (tipo === 'acopio') {
                    const response = await movimientosAcopioService.getById(movimientoId);
                    if (response && response.success && response.data) {
                        const movimiento = response.data;

                        const nombreSucursal = movimiento?.sucursal?.name || 'Sucursal no encontrada';

                        const infoSup = {
                            'Responsable': movimiento?.user?.name || movimiento?.personal?.name || 'Usuario desconocido',
                            'Tipo': movimiento?.type === 'entrada' ? 'Entrada' : 'Salida',
                            'Fecha': new Date(movimiento?.date).toLocaleString(),
                            'Estado': movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado',
                            'Sucursal': nombreSucursal
                        };

                        if (movimiento?.type === 'entrada' && movimiento?.proveedor?.name) {
                            infoSup['Proveedor'] = movimiento.proveedor.name;
                        }
                        if (movimiento?.type === 'salida' && movimiento?.cliente?.name) {
                            infoSup['Cliente'] = movimiento.cliente.name;
                        }
                        if (movimiento?.metodo_pago) {
                            infoSup['Método de Pago'] = movimiento.metodo_pago;
                        }
                        if (movimiento?.costo) {
                            infoSup['Costo'] = `Bs. ${parseFloat(movimiento.costo).toFixed(2)}`;
                        }
                        if (movimiento?.restar_ingredientes !== undefined) {
                            infoSup['Restar Ingredientes'] = movimiento.restar_ingredientes ? 'Sí' : 'No';
                        }
                        if (movimiento?.observaciones) {
                            infoSup['Observaciones'] = movimiento.observaciones;
                        }

                        const headers = ['Producto', 'Cantidad', 'Unidad de Medida'];
                        const valores = [[
                            movimiento?.product?.name || 'Sin producto',
                            movimiento?.quantity || '0',
                            movimiento?.product?.type_measure?.code || ''
                        ]];

                        // Cliente/Proveedor y número de venta/entrega si existen
                        if (movimiento?.type === 'entrada' && movimiento?.proveedor?.name) {
                            infoSup['Proveedor'] = movimiento.proveedor.name;
                            infoSup['Órdenes del Proveedor'] = (movimiento?.proveedor?.total_orders ?? 0);
                        }
                        if (movimiento?.type === 'salida' && movimiento?.cliente?.name) {
                            infoSup['Cliente'] = movimiento.cliente.name;
                            infoSup['Órdenes del Cliente'] = (movimiento?.cliente?.total_orders ?? 0);
                        }
                        const orderNumberA = pickOrderNumber(movimiento);
                        if (orderNumberA) {
                            const etiqueta = movimiento?.type === 'salida' ? 'Venta N°' : 'Entrega N°';
                            infoSup[etiqueta] = String(orderNumberA);
                        }

                        setInformacionSuperior(infoSup);
                        setTablaHeaders(headers);
                        setTablaValores(valores);
                        setNombreArchivo(nombreArchivoDefault || (movimiento?.type === 'entrada' ? 'NOTA DE INGRESO' : 'NOTA DE ENTREGA'));
                        setTituloDocumento(tituloDocumentoDefault || (movimiento?.type === 'entrada' ? 'NOTA DE INGRESO' : 'NOTA DE ENTREGA'));
                    }
                } else {
                    const response = await movimientosAlmacenService.getById(movimientoId);
                    if (response && response.success && response.data) {
                        const movimiento = response.data;

                        const nombreSucursal = movimiento?.sucursal?.name || 'Sucursal no encontrada';

                        const infoSup = {
                            'Responsable': movimiento?.user?.name || movimiento?.personal?.name || 'Usuario desconocido',
                            'Tipo': movimiento?.type === 'entrada' ? 'Entrada' : 'Salida',
                            'Fecha': new Date(movimiento?.fecha).toLocaleString(),
                            'Estado': movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado',
                            'Sucursal': nombreSucursal
                        };

                        if (movimiento?.precio?.name) {
                            infoSup['Tipo de Precio'] = movimiento.precio.name;
                        }
                        if (movimiento?.metodo_pago) {
                            infoSup['Método de Pago'] = movimiento.metodo_pago;
                        }
                        if (movimiento?.agrupado !== undefined) {
                            infoSup['Modalidad'] = movimiento.agrupado ? 'Agrupado' : 'Unidades';
                        }
                        if (movimiento?.productos && movimiento.productos.length > 0) {
                            const total = movimiento.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0);
                            infoSup['Total'] = `Bs. ${total.toFixed(2)}`;
                        }
                        if (movimiento?.observaciones) {
                            infoSup['Observaciones'] = movimiento.observaciones;
                        }

                        const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
                        const valores = (movimiento?.productos || []).map(producto => {
                            const cantidad = parseFloat(producto?.cantidad) || 0;
                            const grup = parseFloat(producto?.producto?.grup) || 0;
                            const esAgrupado = movimiento?.agrupado && grup > 0;
                            const precioUnitario = parseFloat(producto?.precio_unitario) || 0;

                            let cantidadTexto;
                            let precioTexto;

                            if (esAgrupado) {
                                const grupos = Math.floor(cantidad / grup);
                                const unidades = cantidad % grup;
                                // Solo números, sin "grup" ni "ud"
                                cantidadTexto = unidades > 0 ? `${grupos}.${unidades}` : `${grupos}`;
                                // Precio unitario multiplicado por la cantidad de agrupación
                                precioTexto = `Bs. ${(precioUnitario * grup).toFixed(2)}`;
                            } else {
                                // Solo números, sin "ud"
                                cantidadTexto = `${cantidad}`;
                                precioTexto = `Bs. ${precioUnitario.toFixed(2)}`;
                            }

                            return [
                                producto?.producto?.name || 'Sin producto',
                                cantidadTexto,
                                precioTexto,
                                `Bs. ${(parseFloat(producto?.subtotal) || 0).toFixed(2)}`
                            ];
                        });
                        const totalFila = (movimiento?.productos || []).reduce((sum, p) => sum + (parseFloat(p?.subtotal) || 0), 0);
                        valores.push(['TOTAL', '', '', `Bs. ${totalFila.toFixed(2)}`]);

                        // Cliente/Proveedor y número
                        if (movimiento?.type === 'entrada' && movimiento?.proveedor?.name) infoSup['Proveedor'] = movimiento.proveedor.name;
                        if (movimiento?.type === 'salida' && movimiento?.cliente?.name) {
                            infoSup['Cliente'] = movimiento.cliente.name;
                            infoSup['Número de Orden'] = (movimiento?.numero_orden ?? 0);
                        }
                        const orderNumberB = pickOrderNumber(movimiento);
                        if (orderNumberB) {
                            const etiqueta = movimiento?.type === 'salida' ? 'Venta N°' : 'Entrega N°';
                            infoSup[etiqueta] = String(orderNumberB);
                        }

                        setInformacionSuperior(infoSup);
                        setTablaHeaders(headers);
                        setTablaValores(valores);
                        
                        setNombreArchivo(nombreArchivoDefault || (movimiento?.type === 'entrada' ? 'NOTA DE INGRESO' : 'NOTA DE ENTREGA'));
                        setTituloDocumento(tituloDocumentoDefault || (movimiento?.type === 'entrada' ? 'NOTA DE INGRESO' : 'NOTA DE ENTREGA'));
                    }
                }
            } catch (error) {
                console.error('Error construyendo datos de descarga del movimiento:', error);
            } finally {
                setCargando(false);
            }
        };

        fetchMovimiento();
    }, [isOpen, movimientoId, tipo, movimientoData]);

    // Obtener información del cliente para el switch de "ver número"
    const getClienteInfo = () => {
        // Si tenemos datos del movimiento (ya sea pasados como prop o obtenidos por fetch)
        let movimiento = null;
        
        if (movimientoData) {
            movimiento = movimientoData;
        } else if (informacionSuperior && informacionSuperior.Cliente) {
            // Si no tenemos movimientoData pero sí tenemos información del cliente en informacionSuperior
            // Esto significa que se obtuvo por fetch y ya se procesó
            const nombreCliente = informacionSuperior.Cliente;
            const numeroOrden = informacionSuperior['Número de Orden'] || 0;
            // Obtener solo el primer nombre
            const primerNombre = nombreCliente.split(' ')[0];
            return {
                nombre: primerNombre,
                numeroOrden: numeroOrden
            };
        }
        
        if (movimiento && movimiento?.type === 'salida' && movimiento?.cliente?.name && movimiento?.numero_orden !== undefined) {
            // Obtener solo el primer nombre
            const primerNombre = movimiento.cliente.name.split(' ')[0];
            return {
                nombre: primerNombre,
                numeroOrden: movimiento.numero_orden
            };
        }
        
        return null;
    };

    const clienteInfo = getClienteInfo();



    return (
        <ModalDescarga
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            titulo="Descargar Movimiento"
            subtitulo="Selecciona el formato que prefieras para descargar este movimiento."
            nombreArchivo={nombreArchivo}
            tituloDocumento={tituloDocumento}
            informacionSuperior={informacionSuperior}
            tablaHeaders={tablaHeaders}
            tablaValores={tablaValores}
            loading={cargando}
            esMovimiento={true}
            clienteInfo={clienteInfo}
        />
    );
}

export default DescargaMovimientoBuilder;


