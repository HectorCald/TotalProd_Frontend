import React, { useState } from 'react';
import styles from './NuevoMovimiento.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import InputNormal from '../../common/InputNormal';
import Boton from '../../common/Boton';
import Select from '../../common/Select';
const tipos = [
    { value: 'entrada', label: 'Entrada', icon: 'plus' },
    { value: 'salida', label: 'Salida', icon: 'minus' },
];
const formasPagos = [
    { value: 'efectivo', label: 'Efectivo', icon: 'wallet' },
    { value: 'transferencia', label: 'Transferencia/QR', icon: 'qr' },
    { value: 'Tarjeta', label: 'Tarjeta', icon: 'credit-card' },
];
function NuevoMovimiento({ isOpen, setIsOpen }) {
    const [selectedTipos, setSelectedTipos] = useState('');
    const [selectedFormasPago, setSelectedFormasPago] = useState('');
    const [dataMov, setDataMov] = useState({
        concepto: '',
        tipo: '',
        monto: '',
        formaPago: '',
        observacines: '',
    });
    return (

        <ViewModal ViewModal isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderModal
                title="Nuevo movimiento"
                onClose={() => setIsOpen(false)}
            />

            <div className={styles.modalContent}>
                <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                <InputNormal
                    tipo="text"
                    value={dataMov.concepto}
                    placeholder='Concepto'
                    onChange={(e) => setDataMov({ ...dataMov, nombre: e.target.value })}
                />
                <div className={styles.content}>
                    <Select
                        placeholder="Seleccionar opción"
                        options={tipos}
                        value={selectedTipos}
                        onChange={setSelectedTipos}
                        icon="transfer"
                    />
                </div>
                <InputNormal
                    tipo="text"
                    value={dataMov.monto}
                    placeholder='Monto'
                    onChange={(e) => setDataMov({ ...dataMov, pais: e.target.value })}
                />
                <div className={styles.content}>
                    <Select
                        placeholder="Seleccionar opción"
                        options={formasPagos}
                        value={selectedFormasPago}
                        onChange={setSelectedFormasPago}
                        icon="money"
                    />
                </div>
                <InputNormal
                    tipo="text"
                    value={dataMov.observacines}
                    placeholder='Observaciones'
                    onChange={(e) => setDataMov({ ...dataMov, direccion: e.target.value })}
                />
                <Boton
                    className='btn-original'
                    label='Registrar'
                    style={{ marginTop: 'auto' }}
                />
            </div>
        </ViewModal >
    );
}
export default NuevoMovimiento;