import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import InputSelect from '../../../../components/common/inputs/InputSelect';
import { useToast } from '../../../../context/ToastContext';
import clientService from '../../../../services/clientService';

const EXPECTED_HEADERS = [
    'id',
    'name',
    'phone',
    'description',
    'total_orders',
    'description_location',
    'location'
];

const formatLocationValue = (loc) => {
    if (!loc) return '';
    if (typeof loc === 'object') {
        const lat = loc.x ?? loc.lat;
        const lng = loc.y ?? loc.lng;
        if (lat !== undefined && lng !== undefined) {
            return `(${lat},${lng})`;
        }
        return '';
    }
    return String(loc);
};

const ModalOpcionesClientes = ({ isOpen, onClose, clientes = [], onClientesActualizados }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState(null);
    const [importedClientes, setImportedClientes] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setSelectedFileName(null);
            setImportedClientes([]);
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    const handleClearFile = () => {
        setSelectedFileName(null);
        setImportedClientes([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleExportar = async () => {
        if (!clientes || clientes.length === 0) {
            showDanger(null, 'No hay clientes para exportar');
            return;
        }

        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 300));

            const rows = clientes.map((c) => [
                c.id ?? '',
                c.name ?? '',
                c.phone ?? '',
                c.description ?? '',
                c.total_orders ?? 0,
                c.description_location ?? '',
                formatLocationValue(c.location)
            ]);

            const ws = XLSX.utils.aoa_to_sheet([EXPECTED_HEADERS, ...rows]);
            ws['!cols'] = EXPECTED_HEADERS.map(() => ({ wch: 25 }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

            XLSX.writeFile(wb, 'clientes.xlsx');

            setLoading(false);
            onClose();
            showSuccess(null, `Se exportaron ${clientes.length} clientes exitosamente`);
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Error al exportar los clientes');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

                if (!aoa || aoa.length < 1) {
                    showDanger(null, 'El archivo está vacío o no tiene el formato correcto');
                    e.target.value = '';
                    return;
                }

                const headers = (aoa[0] || []).map((h) => String(h).trim().toLowerCase());
                const isValidFormat =
                    headers.length === EXPECTED_HEADERS.length &&
                    EXPECTED_HEADERS.every((col, idx) => headers[idx] === col);

                if (!isValidFormat) {
                    showDanger(null, 'El archivo no tiene el mismo formato de columnas que el de exportación');
                    e.target.value = '';
                    return;
                }

                const parsedRows = aoa
                    .slice(1)
                    .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''))
                    .map((row) => ({
                        id: String(row[0] ?? '').trim(),
                        name: String(row[1] ?? '').trim(),
                        phone: String(row[2] ?? '').trim(),
                        description: String(row[3] ?? '').trim(),
                        total_orders: row[4] !== undefined && row[4] !== '' ? Number(row[4]) || 0 : 0,
                        description_location: String(row[5] ?? '').trim(),
                        location: String(row[6] ?? '').trim()
                    }))
                    .filter((item) => item.id && item.name);

                if (parsedRows.length === 0) {
                    showDanger(null, 'El archivo no contiene clientes válidos para actualizar');
                    e.target.value = '';
                    return;
                }

                setSelectedFileName(file.name);
                setImportedClientes(parsedRows);
            } catch (err) {
                showDanger(null, 'Archivo de Excel no válido');
                e.target.value = '';
            }
        };
        reader.onerror = () => {
            showDanger(null, 'Error al leer el archivo');
            e.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    };

    const handleActualizar = async () => {
        if (importedClientes.length === 0) return;

        setLoading(true);
        try {
            const response = await clientService.bulkUpdate(importedClientes);
            if (response && response.success) {
                if (onClientesActualizados) {
                    const updatedList = response.data?.clientes && response.data.clientes.length > 0
                        ? response.data.clientes
                        : importedClientes;
                    onClientesActualizados(updatedList);
                }
                setLoading(false);
                handleClearFile();
                onClose();
                showSuccess(null, response.message || 'Clientes actualizados exitosamente');
            } else {
                setLoading(false);
                showDanger(null, response?.message || 'Error al actualizar los clientes');
            }
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Revisa tu conexión a internet');
        }
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Opciones de Clientes"
            hideFooter={true}
            disableClose={loading}
            contentStyle={{ padding: '10px 20px 20px 20px' }}
        >
            <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {selectedFileName ? (
                <InputSelect
                    value={selectedFileName}
                    options={[{ value: selectedFileName, label: selectedFileName }]}
                    lockSingleOption={false}
                    onChange={(val) => {
                        if (!val) handleClearFile();
                    }}
                    readOnly={loading}
                />
            ) : (
                <Boton
                    label="Exportar"
                    onClick={handleExportar}
                    className="btn-cancel"
                    loading={loading}
                />
            )}

            <Boton
                label={selectedFileName ? 'Actualizar' : 'Importar'}
                onClick={selectedFileName ? handleActualizar : () => fileInputRef.current?.click()}
                className={selectedFileName ? 'btn-primary' : 'btn-cancel'}
                loading={selectedFileName ? loading : false}
                readOnly={!selectedFileName ? loading : false}
            />
        </ModalCentro>
    );
};

export default ModalOpcionesClientes;
