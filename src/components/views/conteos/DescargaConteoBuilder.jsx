import React, { useEffect, useState, useMemo } from 'react';
import ModalDescarga from '../../ui/ModalDescarga';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import { useLayout } from '../../../context/LayoutContext';
import conteosService from '../../../services/conteosService';

function DescargaConteoBuilder({ 
    isOpen, 
    setIsOpen, 
    conteo,
    detalles = []
}) {
    const { isLargeScreen } = useLayout();
    const [informacionSuperior, setInformacionSuperior] = useState({});
    const [tablaHeaders, setTablaHeaders] = useState([]);
    const [tablaValores, setTablaValores] = useState([]);
    const [nombreArchivo, setNombreArchivo] = useState('');
    const [tituloDocumento, setTituloDocumento] = useState('');
    const [detallesCargados, setDetallesCargados] = useState([]);
    const [cargando, setCargando] = useState(false);

    // Cargar detalles si no se pasaron como prop
    useEffect(() => {
        if (!isOpen || !conteo?.id) return;

        const cargarDetalles = async () => {
            // Si ya tenemos detalles pasados como prop, usarlos
            if (detalles.length > 0) {
                setDetallesCargados(detalles);
                return;
            }

            // Si no, obtenerlos por ID
            setCargando(true);
            try {
                const resp = await conteosService.getDetalles(conteo.id);
                if (resp.success) {
                    setDetallesCargados(resp.data || []);
                } else {
                    console.error('Error al cargar detalles del conteo:', resp.message);
                    setDetallesCargados([]);
                }
            } catch (error) {
                console.error('Error al cargar detalles del conteo:', error);
                setDetallesCargados([]);
            } finally {
                setCargando(false);
            }
        };

        cargarDetalles();
    }, [isOpen, conteo?.id, detalles]);

    // Detalles ordenados alfabéticamente
    const detallesOrdenados = useMemo(() => {
        if (!conteo || detallesCargados.length === 0) return [];
        
        const isAlmacen = conteo.tipo === 'almacen';
        return [...detallesCargados].sort((a, b) => {
            const nombreA = isAlmacen ? (a.producto_almacen?.name || '') : (a.producto_acopio?.name || '');
            const nombreB = isAlmacen ? (b.producto_almacen?.name || '') : (b.producto_acopio?.name || '');
            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        });
    }, [detallesCargados, conteo]);

    useEffect(() => {
        if (!isOpen || !conteo) return;

        const isAlmacen = conteo.tipo === 'almacen';
        const tipoNombre = isAlmacen ? 'Almacén' : 'Materia Prima';
        
        // Información superior
        const fechaLocal = formatFechaLiteral(conteo.fecha, !isLargeScreen);
        const horaLocal = formatHoraSinSegundos(conteo.fecha);
        
        const infoSup = {
            'Responsable': conteo?.user?.name || conteo?.personal?.name || 'Usuario desconocido',
            'Fecha': fechaLocal,
            'Hora': horaLocal,
            'Tipo': tipoNombre,
            'Cantidad de productos': (conteo?.detalles_count || detallesCargados.length || 0).toString()
        };

        if (conteo?.observaciones) {
            infoSup['Observaciones'] = conteo.observaciones;
        }

        setInformacionSuperior(infoSup);

        if (isAlmacen) {
            // Headers para almacén
            const headers = ['Producto', 'Sistema', 'Físico', 'Stock grup sist.', 'Stock grup fís.'];
            
            // Construir valores para almacén
            const valores = detallesOrdenados.map(d => {
                const nombreProducto = d.producto_almacen?.name || 'Sin producto';
                const sistema = Number(d.sistema ?? 0);
                const fisico = Number(d.fisico ?? 0);
                const grup = Number(d.producto_almacen?.grup || 0);

                let stockGrupSist = '--';
                let stockGrupFis = '--';

                if (grup > 0) {
                    const sysG = Math.floor(sistema / grup);
                    const sysU = sistema % grup;
                    const fisG = Math.floor(fisico / grup);
                    const fisU = fisico % grup;

                    stockGrupSist = sysU > 0 ? `${sysG} g. ${sysU} u.` : `${sysG} g.`;
                    stockGrupFis = fisU > 0 ? `${fisG} g. ${fisU} u.` : `${fisG} g.`;
                }

                return [
                    nombreProducto,
                    `${sistema} ud`,
                    `${fisico} ud`,
                    stockGrupSist,
                    stockGrupFis
                ];
            });

            setTablaHeaders(headers);
            setTablaValores(valores);
            setNombreArchivo('Conteo de Almacén');
            setTituloDocumento('CONTEO DE ALMACÉN');
        } else {
            // Headers para acopio (materia prima)
            const headers = ['Producto', 'Sistema', 'Físico', 'Medida', 'Justificación'];
            
            // Construir valores para acopio
            const valores = detallesOrdenados.map(d => {
                const nombreProducto = d.producto_acopio?.name || 'Sin producto';
                const sistema = Number(d.sistema ?? 0);
                const fisico = Number(d.fisico ?? 0);
                const medidaCode = d.producto_acopio?.type_measure?.code || '';
                const justificacion = d.justificacion || '';

                return [
                    nombreProducto,
                    `${Number(sistema).toFixed(2)}${medidaCode ? ` ${medidaCode}` : ''}`,
                    `${Number(fisico).toFixed(2)}${medidaCode ? ` ${medidaCode}` : ''}`,
                    medidaCode || '--',
                    justificacion || '--'
                ];
            });

            setTablaHeaders(headers);
            setTablaValores(valores);
            setNombreArchivo('Pesaje de Materia Prima');
            setTituloDocumento('PESAJE DE MATERIA PRIMA');
        }

    }, [isOpen, conteo, detallesOrdenados, isLargeScreen, detallesCargados.length]);

    return (
        <ModalDescarga
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            titulo="Descargar Conteo"
            subtitulo="Selecciona el formato que prefieras para descargar este conteo."
            nombreArchivo={nombreArchivo}
            tituloDocumento={tituloDocumento}
            informacionSuperior={informacionSuperior}
            tablaHeaders={tablaHeaders}
            tablaValores={tablaValores}
            loading={cargando}
            separarColumnas={true}
        />
    );
}

export default DescargaConteoBuilder;
