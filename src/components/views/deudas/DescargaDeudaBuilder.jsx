import React, { useEffect, useState } from 'react';
import ModalDescarga from '../../ui/ModalDescarga';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import deudasService from '../../../services/deudasService';

function DescargaDeudaBuilder({ isOpen, setIsOpen, deuda, nombreArchivoDefault = null, tituloDocumentoDefault = null }) {
    const [informacionSuperior, setInformacionSuperior] = useState({});
    const [tablas, setTablas] = useState([]); // [{ titulo?, headers, valores }]
    const [tablaHeaders, setTablaHeaders] = useState([]);
    const [tablaValores, setTablaValores] = useState([]);
    const [nombreArchivo, setNombreArchivo] = useState('Deuda');
    const [tituloDocumento, setTituloDocumento] = useState('Deuda');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const buildDeuda = async () => {
            if (!isOpen || !deuda) return;
            setCargando(true);
            try {
                // Información superior base
                const infoSup = {
                    'Responsable': deuda?.user?.name || deuda?.personal?.name || 'Usuario desconocido',
                    'Fecha Deuda': deuda?.fecha_deuda ? new Date(deuda.fecha_deuda).toLocaleString() : '--',
                    'Fecha Vencimiento': deuda?.fecha_vencimiento ? new Date(deuda.fecha_vencimiento).toLocaleString() : '--',
                    'Concepto': deuda?.concepto || 'Sin concepto',
                    'Monto Total': `Bs. ${(parseFloat(deuda?.monto_total) || 0).toFixed(2)}`,
                    'Saldo Pendiente': `Bs. ${(parseFloat(deuda?.saldo_pendiente) || 0).toFixed(2)}`,
                    'Estado': deuda?.estado || 'Sin estado',
                    'Sucursal': deuda?.sucursal?.name || 'Sucursal no encontrada'
                };
                if (deuda?.cliente?.name) {
                    infoSup['Cliente'] = deuda.cliente.name;
                }

                const secciones = [];
                let totalPagos = 0;

                // Si tiene movimiento, agregar tabla de productos del movimiento como primera sección
                if (deuda?.movimiento_salida_id) {
                    const movResp = await movimientosAlmacenService.getById(deuda.movimiento_salida_id);
                    if (movResp?.success && movResp.data) {
                        const mov = movResp.data;
                        // Podemos enriquecer info superior con datos del movimiento si se desea
                        // Construir tabla de productos
                        const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
                        const productosOrdenados = (mov?.productos || []).slice().sort((a, b) => (a?.producto?.name || '').localeCompare(b?.producto?.name || '', 'es', { sensitivity: 'base' }));
                        const valores = productosOrdenados.map(p => {
                            const cantidad = parseFloat(p?.cantidad) || 0;
                            const grup = parseFloat(p?.producto?.grup) || 0;
                            const esAgrupado = mov?.agrupado && grup > 0;
                            const precioUnitario = parseFloat(p?.precio_unitario) || 0;

                            let cantidadTexto;
                            let precioTexto;

                            if (esAgrupado) {
                                const grupos = Math.floor(cantidad / grup);
                                const unidades = cantidad % grup;
                                cantidadTexto = unidades > 0 ? `${grupos}.${unidades}` : `${grupos}`;
                                precioTexto = `Bs. ${(precioUnitario * grup).toFixed(2)}`;
                            } else {
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
                        secciones.push({ titulo: 'Detalle de movimiento', headers, valores });
                    }
                }

                // Preparar tabla principal como Pagos parciales (para usar totales alineados en ModalDescarga)
                let pagosValores = [];
                try {
                    const pagosResp = await deudasService.getPagosParciales(deuda.id);
                    if (pagosResp?.success && Array.isArray(pagosResp.data)) {
                        pagosValores = pagosResp.data.map(p => {
                            const monto = parseFloat(p.monto) || 0;
                            totalPagos += monto;
                            return [
                                new Date(p.fecha).toLocaleString(),
                                `Bs. ${monto.toFixed(2)}`
                            ];
                        });
                    }
                } catch (e) {
                    // Ignorar errores de pagos para no romper descarga
                }
                // Setear tabla principal y total (saldo) para que ModalDescarga los muestre alineados
                setTablaHeaders(['Fecha', 'Pago parcial']);
                setTablaValores(pagosValores);

                const montoTotal = parseFloat(deuda?.monto_total) || 0;
                const saldoCalculado = Math.max(0, montoTotal - totalPagos);

                // Mostrar totales bajo la tabla principal (pagos): Total, Pagado, Saldo pendiente
                infoSup['Total'] = `Bs. ${montoTotal.toFixed(2)}`;
                infoSup['Pagado'] = `Bs. ${totalPagos.toFixed(2)}`;
                infoSup['Saldo pendiente'] = `Bs. ${saldoCalculado.toFixed(2)}`;
                setInformacionSuperior(infoSup);
                setTablas(secciones);

                const nombreDef = nombreArchivoDefault || `Deuda_${deuda?.fecha_deuda ? new Date(deuda.fecha_deuda).toLocaleDateString().replace(/\//g, '-') : ''}_${deuda?.concepto ? deuda.concepto.replace(/[^a-zA-Z0-9]/g, '_') : 'deuda'}`;
                setNombreArchivo(nombreDef);
                setTituloDocumento(tituloDocumentoDefault || 'Deuda');

            } finally {
                setCargando(false);
            }
        };
        buildDeuda();
    }, [isOpen, deuda, nombreArchivoDefault, tituloDocumentoDefault]);

    return (
        <ModalDescarga
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            titulo="Descargar Deuda"
            subtitulo="Selecciona el formato que prefieras para descargar esta deuda."
            nombreArchivo={nombreArchivo}
            tituloDocumento={tituloDocumento}
            informacionSuperior={informacionSuperior}
            tablas={tablas}
            tablaHeaders={tablaHeaders}
            tablaValores={tablaValores}
            loading={cargando}
        />
    );
}

export default DescargaDeudaBuilder;


