import React, { useEffect, useState } from 'react';
import ModalDescarga from '../../ui/ModalDescarga';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import pedidosAcopioService from '../../../services/pedidosAcopioService';

function DescargaPedidoBuilder({ isOpen, setIsOpen, pedidoId, tipo = 'almacen', pedidoData = null, nombreArchivoDefault = null, tituloDocumentoDefault = null, esPedido = false }) {
    const [informacionSuperior, setInformacionSuperior] = useState({});
    const [tablaHeaders, setTablaHeaders] = useState([]);
    const [tablaValores, setTablaValores] = useState([]);
    const [nombreArchivo, setNombreArchivo] = useState('Descargar Pedido');
    const [tituloDocumento, setTituloDocumento] = useState('Pedido');
    const [cargando, setCargando] = useState(false);


    useEffect(() => {
        const fetchPedido = async () => {
            if (!isOpen) return;
            try {
                // Si ya tenemos los datos del pedido, construir directamente sin pedir al servidor
                if (pedidoData) {
                    if (tipo === 'acopio') {
                        const pedido = pedidoData;
                        const nombreSucursal = pedido?.sucursal?.name || 'Sucursal no encontrada';
                        const infoSup = {
                            'Solicitante': pedido?.user?.name || pedido?.personal?.name || 'Usuario desconocido',
                            'Sucursal': nombreSucursal,
                            'Número de Pedido': pedido.numero_pedido ? `Nº ${pedido.numero_pedido}` : `#${pedido.id.slice(-8)}`,
                            'Fecha': new Date(pedido.fecha || pedido.created_at).toLocaleString(),
                            'Estado': pedido.estado === 'Completado' ? 'Completado' : pedido.estado === 'Cancelado' ? 'Cancelado' : pedido.estado === 'Entregado' ? 'Entregado' : 'Pendiente'
                        };
                        
                        if (pedido?.producto_acopio?.name) {
                            infoSup['Producto'] = pedido.producto_acopio.name;
                        }
                        if (pedido?.cantidad) {
                            infoSup['Cantidad'] = `${pedido.cantidad} ${pedido.tipo_medida || ''}`;
                        }
                        if (pedido?.observaciones) {
                            infoSup['Observaciones'] = pedido.observaciones;
                        }

                        setInformacionSuperior(infoSup);
                        setTablaHeaders([]);
                        setTablaValores([]);
                        setNombreArchivo(nombreArchivoDefault || 'NOTA DE ENTREGA');
                        setTituloDocumento(tituloDocumentoDefault || 'NOTA DE ENTREGA');
                        return;
                    } else {
                        // Pedido de almacén
                        const pedido = pedidoData;
                        const nombreSucursal = pedido?.sucursal?.name || 'Sucursal no encontrada';
                        const infoSup = {
                            'Solicitante': pedido?.user?.name || pedido?.personal?.name || 'Usuario desconocido',
                            'Sucursal': nombreSucursal,
                            'Número de Pedido': pedido.numero_pedido ? `Nº ${pedido.numero_pedido}` : `#${pedido.id.slice(-8)}`,
                            'Fecha': new Date(pedido.fecha || pedido.created_at).toLocaleString(),
                            'Estado': pedido.estado === 'Completado' ? 'Completado' : pedido.estado === 'Cancelado' ? 'Cancelado' : pedido.estado === 'Entregado' ? 'Entregado' : 'Pendiente'
                        };

                        // Agregar total de pedidos de la sucursal si está disponible
                        if (pedido?.sucursal?.total_pedidos !== undefined) {
                            infoSup['Total de Pedidos de la Sucursal'] = pedido.sucursal.total_pedidos.toString();
                        }

                        // Para pedidos de almacén
                        if (pedido?.precio?.name) {
                            infoSup['Tipo de Precio'] = pedido.precio.name;
                        }
                        if (pedido?.cliente?.name) {
                            infoSup['Cliente'] = pedido.cliente.name;
                        }
                        // Agregar modalidad (Agrupado o Unidades)
                        infoSup['Modalidad'] = pedido.agrupado ? 'Agrupado' : 'Unidades';
                        
                        // Mostrar método de pago si el pedido está entregado
                        if (pedido.estado === 'Entregado' && pedido?.movimiento_salida?.metodo_pago) {
                            infoSup['Método de Pago'] = pedido.movimiento_salida.metodo_pago;
                        }

                        // Calcular total
                        const total = (pedido?.pedido_almacen_detalle || []).reduce((sum, detalle) => {
                            const precio = detalle.precio || 0;
                            const cantidad = detalle.cantidad || 0;
                            return sum + (precio * cantidad);
                        }, 0);
                        infoSup['Total'] = `Bs. ${total.toFixed(2)}`;

                        // Tabla para almacén (múltiples productos)
                        const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
                        // Ordenar productos alfabéticamente por nombre
                        const detallesOrdenados = (pedido?.pedido_almacen_detalle || []).sort((a, b) => 
                            (a?.producto_almacen?.name || '').localeCompare(b?.producto_almacen?.name || '', 'es', { sensitivity: 'base' })
                        );
                        const valores = detallesOrdenados.map(detalle => {
                            // Si el pedido es agrupado, mostrar la cantidad visual (agrupada)
                            // Si no es agrupado, mostrar la cantidad real (unidades)
                            let cantidadVisual = detalle?.cantidad || 0;
                            let unidadVisual = detalle?.medida || detalle?.producto_almacen?.type_measure?.code || 'u';
                            let precioUnitario = detalle?.precio || 0;
                            
                            if (pedido.agrupado && detalle?.producto_almacen?.grup) {
                                // Calcular cantidad agrupada: cantidad real / factor de agrupación
                                const factorAgrupacion = detalle.producto_almacen.grup || 1;
                                cantidadVisual = Math.round((detalle?.cantidad || 0) / factorAgrupacion);
                                unidadVisual = 'grp';
                                // Precio unitario multiplicado por la cantidad de agrupación (redondeado)
                                precioUnitario = Math.round(precioUnitario * factorAgrupacion);
                            }
                            
                            return [
                                detalle?.producto_almacen?.name || 'Sin producto',
                                `${cantidadVisual} ${unidadVisual}`,
                                `Bs. ${precioUnitario.toFixed(2)}`,
                                `Bs. ${((detalle?.precio || 0) * (detalle?.cantidad || 0)).toFixed(2)}`
                            ];
                        });

                        setInformacionSuperior(infoSup);
                        setTablaHeaders(headers);
                        setTablaValores(valores);
                        setNombreArchivo(nombreArchivoDefault || 'NOTA DE ENTREGA');
                        setTituloDocumento(tituloDocumentoDefault || 'NOTA DE ENTREGA');
                        return;
                    }
                }

                // Si no tenemos datos, hacer fetch por id y mostrar loading en botones
                if (!pedidoId) return;
                setCargando(true);
                
                if (tipo === 'acopio') {
                    const response = await pedidosAcopioService.getById(pedidoId);
                    if (response && response.success && response.data) {
                        const pedido = response.data;
                        const nombreSucursal = pedido?.sucursal?.name || 'Sucursal no encontrada';
                        const infoSup = {
                            'Solicitante': pedido?.user?.name || pedido?.personal?.name || 'Usuario desconocido',
                            'Sucursal': nombreSucursal,
                            'Número de Pedido': pedido.numero_pedido ? `Nº ${pedido.numero_pedido}` : `#${pedido.id.slice(-8)}`,
                            'Fecha': new Date(pedido.fecha || pedido.created_at).toLocaleString(),
                            'Estado': pedido.estado === 'Completado' ? 'Completado' : pedido.estado === 'Cancelado' ? 'Cancelado' : pedido.estado === 'Entregado' ? 'Entregado' : 'Pendiente'
                        };
                        
                        if (pedido?.producto_acopio?.name) {
                            infoSup['Producto'] = pedido.producto_acopio.name;
                        }
                        if (pedido?.cantidad) {
                            infoSup['Cantidad'] = `${pedido.cantidad} ${pedido.tipo_medida || ''}`;
                        }
                        if (pedido?.observaciones) {
                            infoSup['Observaciones'] = pedido.observaciones;
                        }

                        setInformacionSuperior(infoSup);
                        setTablaHeaders([]);
                        setTablaValores([]);
                        setNombreArchivo(nombreArchivoDefault || 'NOTA DE ENTREGA');
                        setTituloDocumento(tituloDocumentoDefault || 'NOTA DE ENTREGA');
                    }
                } else {
                    const response = await pedidosAlmacenService.getById(pedidoId);
                    if (response && response.success && response.data) {
                        const pedido = response.data;
                        const nombreSucursal = pedido?.sucursal?.name || 'Sucursal no encontrada';
                        const infoSup = {
                            'Solicitante': pedido?.user?.name || pedido?.personal?.name || 'Usuario desconocido',
                            'Sucursal': nombreSucursal,
                            'Número de Pedido': pedido.numero_pedido ? `Nº ${pedido.numero_pedido}` : `#${pedido.id.slice(-8)}`,
                            'Fecha': new Date(pedido.fecha || pedido.created_at).toLocaleString(),
                            'Estado': pedido.estado === 'Completado' ? 'Completado' : pedido.estado === 'Cancelado' ? 'Cancelado' : pedido.estado === 'Entregado' ? 'Entregado' : 'Pendiente'
                        };

                        // Agregar total de pedidos de la sucursal si está disponible
                        if (pedido?.sucursal?.total_pedidos !== undefined) {
                            infoSup['Total de Pedidos de la Sucursal'] = pedido.sucursal.total_pedidos.toString();
                        }

                        // Para pedidos de almacén
                        if (pedido?.precio?.name) {
                            infoSup['Tipo de Precio'] = pedido.precio.name;
                        }
                        if (pedido?.cliente?.name) {
                            infoSup['Cliente'] = pedido.cliente.name;
                        }
                        // Agregar modalidad (Agrupado o Unidades)
                        infoSup['Modalidad'] = pedido.agrupado ? 'Agrupado' : 'Unidades';
                        
                        // Mostrar método de pago si el pedido está entregado
                        if (pedido.estado === 'Entregado' && pedido?.movimiento_salida?.metodo_pago) {
                            infoSup['Método de Pago'] = pedido.movimiento_salida.metodo_pago;
                        }

                        // Calcular total
                        const total = (pedido?.pedido_almacen_detalle || []).reduce((sum, detalle) => {
                            const precio = detalle.precio || 0;
                            const cantidad = detalle.cantidad || 0;
                            return sum + (precio * cantidad);
                        }, 0);
                        infoSup['Total'] = `Bs. ${total.toFixed(2)}`;

                        // Tabla para almacén (múltiples productos)
                        const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
                        // Ordenar productos alfabéticamente por nombre
                        const detallesOrdenados = (pedido?.pedido_almacen_detalle || []).sort((a, b) => 
                            (a?.producto_almacen?.name || '').localeCompare(b?.producto_almacen?.name || '', 'es', { sensitivity: 'base' })
                        );
                        const valores = detallesOrdenados.map(detalle => {
                            // Si el pedido es agrupado, mostrar la cantidad visual (agrupada)
                            // Si no es agrupado, mostrar la cantidad real (unidades)
                            let cantidadVisual = detalle?.cantidad || 0;
                            let unidadVisual = detalle?.medida || detalle?.producto_almacen?.type_measure?.code || 'u';
                            let precioUnitario = detalle?.precio || 0;
                            
                            if (pedido.agrupado && detalle?.producto_almacen?.grup) {
                                // Calcular cantidad agrupada: cantidad real / factor de agrupación
                                const factorAgrupacion = detalle.producto_almacen.grup || 1;
                                cantidadVisual = Math.round((detalle?.cantidad || 0) / factorAgrupacion);
                                unidadVisual = 'grp';
                                // Precio unitario multiplicado por la cantidad de agrupación (redondeado)
                                precioUnitario = Math.round(precioUnitario * factorAgrupacion);
                            }
                            
                            return [
                                detalle?.producto_almacen?.name || 'Sin producto',
                                `${cantidadVisual} ${unidadVisual}`,
                                `Bs. ${precioUnitario.toFixed(2)}`,
                                `Bs. ${((detalle?.precio || 0) * (detalle?.cantidad || 0)).toFixed(2)}`
                            ];
                        });

                        setInformacionSuperior(infoSup);
                        setTablaHeaders(headers);
                        setTablaValores(valores);
                        setNombreArchivo(nombreArchivoDefault || 'NOTA DE ENTREGA');
                        setTituloDocumento(tituloDocumentoDefault || 'NOTA DE ENTREGA');
                    }
                }
            } catch (error) {
                console.error('Error construyendo datos de descarga del pedido:', error);
            } finally {
                setCargando(false);
            }
        };

        fetchPedido();
    }, [isOpen, pedidoId, tipo, pedidoData]);

    return (
        <ModalDescarga
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            titulo="Descargar Pedido"
            subtitulo="Selecciona el formato que prefieras para descargar este pedido."
            nombreArchivo={nombreArchivo}
            tituloDocumento={tituloDocumento}
            informacionSuperior={informacionSuperior}
            tablaHeaders={tablaHeaders}
            tablaValores={tablaValores}
            loading={cargando}
            esPedido={esPedido}
        />
    );
}

export default DescargaPedidoBuilder;
