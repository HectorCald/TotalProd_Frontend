import React, { useEffect, useState } from 'react';
import ModalDescarga from '../../ui/ModalDescarga';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import pedidosAcopioService from '../../../services/pedidosAcopioService';

function DescargaPedidoBuilder({ isOpen, setIsOpen, pedidoId, tipo = 'almacen', pedidoData = null }) {
    const [informacionSuperior, setInformacionSuperior] = useState({});
    const [tablaHeaders, setTablaHeaders] = useState([]);
    const [tablaValores, setTablaValores] = useState([]);
    const [nombreArchivo, setNombreArchivo] = useState('Descargar Pedido');
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
                            'Número de Pedido': `#${pedido.id.slice(-8)}`,
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
                        setNombreArchivo(`Pedido_Acopio_${new Date(pedido?.fecha || pedido?.created_at).toLocaleDateString().replace(/\//g, '-')}`);
                        return;
                    } else {
                        // Pedido de almacén
                        const pedido = pedidoData;
                        const nombreSucursal = pedido?.sucursal?.name || 'Sucursal no encontrada';
                        const infoSup = {
                            'Solicitante': pedido?.user?.name || pedido?.personal?.name || 'Usuario desconocido',
                            'Sucursal': nombreSucursal,
                            'Número de Pedido': `#${pedido.id.slice(-8)}`,
                            'Fecha': new Date(pedido.fecha || pedido.created_at).toLocaleString(),
                            'Estado': pedido.estado === 'Completado' ? 'Completado' : pedido.estado === 'Cancelado' ? 'Cancelado' : pedido.estado === 'Entregado' ? 'Entregado' : 'Pendiente'
                        };

                        // Para pedidos de almacén
                        if (pedido?.precio?.name) {
                            infoSup['Tipo de Precio'] = pedido.precio.name;
                        }
                        if (pedido?.cliente?.name) {
                            infoSup['Cliente'] = pedido.cliente.name;
                        }
                        
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
                        const valores = (pedido?.pedido_almacen_detalle || []).map(detalle => [
                            detalle?.producto_almacen?.name || 'Sin producto',
                            detalle?.cantidad || '0',
                            `Bs. ${(detalle?.precio || 0).toFixed(2)}`,
                            `Bs. ${((detalle?.precio || 0) * (detalle?.cantidad || 0)).toFixed(2)}`
                        ]);

                        setInformacionSuperior(infoSup);
                        setTablaHeaders(headers);
                        setTablaValores(valores);
                        setNombreArchivo(`Pedido_Almacen_${new Date(pedido?.fecha || pedido?.created_at).toLocaleDateString().replace(/\//g, '-')}`);
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
                            'Número de Pedido': `#${pedido.id.slice(-8)}`,
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
                        setNombreArchivo(`Pedido_Acopio_${new Date(pedido?.fecha || pedido?.created_at).toLocaleDateString().replace(/\//g, '-')}`);
                    }
                } else {
                    const response = await pedidosAlmacenService.getById(pedidoId);
                    if (response && response.success && response.data) {
                        const pedido = response.data;
                        const nombreSucursal = pedido?.sucursal?.name || 'Sucursal no encontrada';
                        const infoSup = {
                            'Solicitante': pedido?.user?.name || pedido?.personal?.name || 'Usuario desconocido',
                            'Sucursal': nombreSucursal,
                            'Número de Pedido': `#${pedido.id.slice(-8)}`,
                            'Fecha': new Date(pedido.fecha || pedido.created_at).toLocaleString(),
                            'Estado': pedido.estado === 'Completado' ? 'Completado' : pedido.estado === 'Cancelado' ? 'Cancelado' : pedido.estado === 'Entregado' ? 'Entregado' : 'Pendiente'
                        };

                        // Para pedidos de almacén
                        if (pedido?.precio?.name) {
                            infoSup['Tipo de Precio'] = pedido.precio.name;
                        }
                        if (pedido?.cliente?.name) {
                            infoSup['Cliente'] = pedido.cliente.name;
                        }
                        
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
                        const valores = (pedido?.pedido_almacen_detalle || []).map(detalle => [
                            detalle?.producto_almacen?.name || 'Sin producto',
                            detalle?.cantidad || '0',
                            `Bs. ${(detalle?.precio || 0).toFixed(2)}`,
                            `Bs. ${((detalle?.precio || 0) * (detalle?.cantidad || 0)).toFixed(2)}`
                        ]);

                        setInformacionSuperior(infoSup);
                        setTablaHeaders(headers);
                        setTablaValores(valores);
                        setNombreArchivo(`Pedido_Almacen_${new Date(pedido?.fecha || pedido?.created_at).toLocaleDateString().replace(/\//g, '-')}`);
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
            informacionSuperior={informacionSuperior}
            tablaHeaders={tablaHeaders}
            tablaValores={tablaValores}
            loading={cargando}
        />
    );
}

export default DescargaPedidoBuilder;
