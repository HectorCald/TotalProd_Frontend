import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import gastosService from '../../../../services/gastosService';

const HEADERS = [
    'concepto',
    'valor',
    'metodo_pago',
    'proveedor',
    'fecha_gasto',
    'responsable'
];

const ModalExportarPagos = ({
    isOpen,
    onClose,
    search = '',
    filtroMetodoPago = null,
    proveedorId = null,
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
            const response = await gastosService.getAllSinLimite(
                null,
                filtroFecha,
                search,
                filtroMetodoPago,
                proveedorId,
                sortOrder
            );

            if (!response || !response.success) {
                setLoading(false);
                showDanger(null, response?.message || 'Error al obtener los pagos para exportar');
                return;
            }

            const pagos = response.data || [];
            if (pagos.length === 0) {
                setLoading(false);
                showDanger(null, 'No hay pagos para exportar según el filtrado actual');
                return;
            }

            const rows = pagos.map((p) => [
                p.concepto ?? '',
                p.valor ?? 0,
                p.metodo_pago ? p.metodo_pago.charAt(0).toUpperCase() + p.metodo_pago.slice(1) : '',
                p.proveedor?.name || '',
                p.fecha_gasto ? String(p.fecha_gasto).split('T')[0] : '',
                p.user?.name || p.personal?.name || ''
            ]);

            const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
            ws['!cols'] = HEADERS.map(() => ({ wch: 24 }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Pagos');

            XLSX.writeFile(wb, 'pagos.xlsx');

            setLoading(false);
            onClose();
            showSuccess(null, `Se exportaron ${pagos.length} pagos exitosamente`);
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Error al exportar los pagos');
        }
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Exportar Pagos"
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

export default ModalExportarPagos;

