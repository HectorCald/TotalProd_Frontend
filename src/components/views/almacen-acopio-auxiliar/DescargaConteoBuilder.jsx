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
    justificationInputsText = {}
}) {
    const [informacionSuperior, setInformacionSuperior] = useState({});
    const [tablaHeaders, setTablaHeaders] = useState([]);
    const [tablaValores, setTablaValores] = useState([]);
    const [nombreArchivo, setNombreArchivo] = useState('Pesaje de Materia Prima');
    const [tituloDocumento, setTituloDocumento] = useState('PESAJE DE MATERIA PRIMA');

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

        // Contar productos
        const cantidadProductos = productos.length;

        // Construir información superior
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
    }, [isOpen, productos, quantityInputs, quantityInputsText, justificationInputsText, user, employee]);

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
