import React, { useEffect, useState } from 'react';
import ModalDescarga from '../../ui/ModalDescarga';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';

function DescargaConteoBuilder({ 
    isOpen, 
    setIsOpen, 
    productos = [], 
    quantityInputs = {}, 
    quantityInputsText = {},
    justificationInputsText = {},
    tipo = 'acopio', // 'acopio' o 'almacen'
    detalles = [] // Para almacén: detalles completos con producto_almacen
}) {
    const [informacionSuperior, setInformacionSuperior] = useState({});
    const [tablaHeaders, setTablaHeaders] = useState([]);
    const [tablaValores, setTablaValores] = useState([]);
    const [nombreArchivo, setNombreArchivo] = useState(tipo === 'almacen' ? 'Conteo de Almacén' : 'Pesaje de Materia Prima');
    const [tituloDocumento, setTituloDocumento] = useState(tipo === 'almacen' ? 'CONTEO DE ALMACÉN' : 'PESAJE DE MATERIA PRIMA');

    const { user } = useUser();
    const { employee } = useEmployee();

    useEffect(() => {
        if (!isOpen) return;

        // Obtener responsable (first name y last name según usuario o empleado)
        let responsable = 'Usuario desconocido';
        if (employee) {
            const firstName = employee.first_name || '';
            const lastName = employee.last_name || '';
            responsable = `${firstName} ${lastName}`.trim() || 'Empleado';
        } else if (user) {
            const firstName = user.firstName || '';
            const lastName = user.lastName || '';
            responsable = `${firstName} ${lastName}`.trim() || 'Usuario';
        }

        // Obtener fecha y hora actuales separadas
        const ahora = new Date();
        const fecha = ahora.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const hora = ahora.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (tipo === 'almacen') {
            // Lógica para conteo de almacén
            const cantidadProductos = detalles.length;

            const infoSup = {
                'Responsable': responsable,
                'Hora de conteo': hora,
                'Fecha de conteo': fecha,
                'Cantidad de productos': cantidadProductos.toString()
            };

            // Ordenar detalles alfabéticamente por nombre
            const detallesOrdenados = [...detalles].sort((a, b) => {
                const nombreA = a.producto_almacen?.name || '';
                const nombreB = b.producto_almacen?.name || '';
                return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
            });

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

            setInformacionSuperior(infoSup);
            setTablaHeaders(headers);
            setTablaValores(valores);
            setNombreArchivo('Conteo de Almacén');
            setTituloDocumento('CONTEO DE ALMACÉN');
        } else {
            // Lógica para conteo de acopio (materia prima)
            const cantidadProductos = productos.length;

            const infoSup = {
                'Responsable': responsable,
                'Hora de pesaje': hora,
                'Fecha de pesaje': fecha,
                'Cantidad de productos': cantidadProductos.toString()
            };

            // Ordenar productos alfabéticamente por nombre
            const productosOrdenados = [...productos].sort((a, b) => 
                (a?.name || '').localeCompare(b?.name || '', 'es', { sensitivity: 'base' })
            );

            // Construir headers
            const headers = ['Producto', 'Peso sistema', 'Peso real', 'Cantidad ud', 'Merma', 'Observaciones'];

            // Construir valores
            const valores = productosOrdenados.map(p => {
                const rawQty = parseFloat(p.quantity || 0);
                const pesoSistema = rawQty.toFixed(2); // Solo número, sin unidades
                
                // Los demás campos vacíos
                const pesoReal = '';
                const cantidadUd = '';
                const merma = '';
                const observaciones = justificationInputsText[p.id] || '';

                return [
                    p.name || 'Sin producto',
                    pesoSistema,
                    pesoReal,
                    cantidadUd,
                    merma,
                    observaciones
                ];
            });

            setInformacionSuperior(infoSup);
            setTablaHeaders(headers);
            setTablaValores(valores);
            setNombreArchivo('Pesaje de Materia Prima');
            setTituloDocumento('PESAJE DE MATERIA PRIMA');
        }

    }, [isOpen, productos, quantityInputs, quantityInputsText, justificationInputsText, user, employee, tipo, detalles]);

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
            loading={false}
            separarColumnas={true}
        />
    );
}

export default DescargaConteoBuilder;
