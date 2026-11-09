import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';

const HEADERS = [
    'producto',
    'responsable',
    'lote',
    'proceso',
    'terminados',
    'cantidad_verificada',
    'cantidad_ingresada',
    'microondas',
    'estado',
    'fecha',
    'fecha_verificado',
    'vencimiento',
    'sucursal',
    'observaciones'
];

const ModalExportarVerificacion = ({
    isOpen,
    onClose,
    filtroEstado = null,
    search = '',
    filtroResponsable = null,
    filtroFecha = null
}) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    const handleExportar = async () => {
        setLoading(true);
        try {
            const response = await registrosProduccionDamabravaService.getAllSinLimite(
                filtroEstado,
                'fecha_desc',
                search,
                filtroResponsable,
                filtroFecha
            );

            if (!response || !response.success) {
                setLoading(false);
                showDanger(null, response?.message || 'Error al obtener los registros para exportar');
                return;
            }

            const registros = response.data || [];
            if (registros.length === 0) {
                setLoading(false);
                showDanger(null, 'No hay registros para exportar según el filtrado actual');
                return;
            }

            const rows = registros.map((r) => [
                r.producto_almacen?.name || 'Sin producto',
                r.user?.name || r.personal?.name || 'Usuario desconocido',
                r.lote ?? 0,
                r.proceso === 'cernido'
                    ? 'Cernido'
                    : r.proceso === 'seleccionado'
                    ? 'Seleccionado'
                    : r.proceso === 'ninguno'
                    ? 'Ninguno'
                    : (r.proceso || ''),
                r.terminados ?? 0,
                r.cantidad_verificada ?? 0,
                r.cantidad_ingresada ?? 0,
                r.microondas ?? 0,
                r.estado === 'pendiente'
                    ? 'Pendiente'
                    : r.estado === 'verificado'
                    ? 'Verificado'
                    : r.estado === 'Ingresado'
                    ? 'Ingresado'
                    : (r.estado || ''),
                r.fecha ? String(r.fecha).split('T')[0] : '',
                r.fecha_verificado ? String(r.fecha_verificado).split('T')[0] : '',
                r.vencimiento ? String(r.vencimiento).split('T')[0] : '',
                r.sucursal?.name || '',
                r.observaciones ?? ''
            ]);

            const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
            ws['!cols'] = HEADERS.map(() => ({ wch: 22 }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Verificacion');

            XLSX.writeFile(wb, 'verificacion_produccion.xlsx');

            setLoading(false);
            onClose();
            showSuccess(null, `Se exportaron ${registros.length} registros exitosamente`);
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Error al exportar los registros');
        }
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Exportar Registros"
            mensaje="Se descargarán todos los registros según el filtrado actual."
            hideFooter={true}
            disableClose={loading}
            contentStyle={{ padding: '10px 20px 20px 20px' }}
        >
            <Boton
                label="Exportar"
                onClick={handleExportar}
                className="btn-primary"
                loading={loading}
            />
        </ModalCentro>
    );
};

export default ModalExportarVerificacion;

