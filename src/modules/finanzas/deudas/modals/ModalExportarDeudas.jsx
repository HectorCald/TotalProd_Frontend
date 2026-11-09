import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import deudasService from '../../../../services/deudasService';

const HEADERS = [
    'concepto',
    'cliente',
    'monto_total',
    'saldo_pendiente',
    'estado',
    'fecha_deuda',
    'fecha_vencimiento',
    'responsable'
];

const ModalExportarDeudas = ({
    isOpen,
    onClose,
    search = '',
    filtroEstado = null,
    clienteId = null,
    sortOrder = 'fecha_desc',
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
            const response = await deudasService.getAllSinLimite(
                null,
                filtroFecha,
                search,
                filtroEstado,
                clienteId,
                sortOrder
            );

            if (!response || !response.success) {
                setLoading(false);
                showDanger(null, response?.message || 'Error al obtener las deudas para exportar');
                return;
            }

            const deudas = response.data || [];
            if (deudas.length === 0) {
                setLoading(false);
                showDanger(null, 'No hay deudas para exportar según el filtrado actual');
                return;
            }

            const rows = deudas.map((d) => [
                d.concepto ?? '',
                d.cliente?.name || (d.sucursal_destino ? `${d.sucursal_destino.empresas?.name ? d.sucursal_destino.empresas.name + ' - ' : ''}${d.sucursal_destino.name}` : ''),
                d.monto_total ?? 0,
                d.saldo_pendiente ?? 0,
                d.estado ? d.estado.charAt(0).toUpperCase() + d.estado.slice(1) : '',
                d.fecha_deuda ? String(d.fecha_deuda).split('T')[0] : '',
                d.fecha_vencimiento ? String(d.fecha_vencimiento).split('T')[0] : '',
                d.user?.name || d.personal?.name || ''
            ]);

            const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
            ws['!cols'] = HEADERS.map(() => ({ wch: 24 }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Deudas');

            XLSX.writeFile(wb, 'deudas.xlsx');

            setLoading(false);
            onClose();
            showSuccess(null, `Se exportaron ${deudas.length} deudas exitosamente`);
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Error al exportar las deudas');
        }
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Exportar Deudas"
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

export default ModalExportarDeudas;
