import React, { useState, useEffect } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import Input from '../../../common/inputs/Input';
import InputFecha from '../../../common/inputs/InputFecha';
import { useToast } from '../../../../context/ToastContext';
import { useLayout } from '../../../../context/LayoutContext';
import deudasService from '../../../../services/deudasService';
import styles from '../../../../styles/view.module.css';

function ModalRegistrarPago({
  isOpen,
  setIsOpen,
  deudaActual,
  onDeudaActualizada
}) {
  const { isLargeScreen } = useLayout();
  const { showSuccess, showDanger, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [pagoForm, setPagoForm] = useState({ fecha: '', monto: '', detalle: '' });
  const [fieldErrors, setFieldErrors] = useState({ fecha: false, monto: false });

  useEffect(() => {
    setFieldErrors({ fecha: false, monto: false });
    if (isOpen) {
      const hoy = new Date();
      const fechaHoy = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
      setPagoForm({ fecha: fechaHoy, monto: '', detalle: '' });
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setPagoForm(prev => ({ ...prev, [field]: value }));
    if (field === 'fecha' || field === 'monto') setFieldErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmitPago = async () => {
    if (!pagoForm.fecha) {
      setFieldErrors(prev => ({ ...prev, fecha: true }));
      showWarning('Validación', 'La fecha es obligatoria', 5000);
      return;
    }
    const montoNum = parseFloat(String(pagoForm.monto).replace(',', '.'));
    if (pagoForm.monto === '' || pagoForm.monto == null || isNaN(montoNum) || montoNum <= 0) {
      setFieldErrors(prev => ({ ...prev, monto: true }));
      showWarning('Validación', 'El monto es obligatorio y debe ser mayor a 0', 5000);
      return;
    }

    setFieldErrors({ fecha: false, monto: false });
    setLoading(true);
    try {
      const response = await deudasService.createPagoParcial(deudaActual.id, {
        monto: montoNum,
        fecha: pagoForm.fecha,
        detalle: pagoForm.detalle?.trim() || null
      });
      if (response.success) {
        const deudaActualizada = response.data?.deuda || { ...deudaActual };
        if (onDeudaActualizada) onDeudaActualizada(deudaActualizada);
        showSuccess('Éxito', 'Pago parcial registrado');
        setIsOpen(false);
      } else {
        showDanger('Error', response.message || 'Error al registrar el pago');
      }
    } catch (e) {
      console.error('Error registrando pago parcial:', e);
      showDanger('Error', 'Error al registrar el pago parcial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title="Registrar Pago Parcial"
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent} style={!isLargeScreen ? { minHeight: '50vh' } : undefined}>
        <hr className={styles.separator} />

        <InputFecha
          label="Fecha del pago"
          value={pagoForm.fecha}
          onChange={(val) => handleChange('fecha', val)}
          required={true}
          readOnly={loading}
          error={fieldErrors.fecha}
          onClearError={() => setFieldErrors(prev => ({ ...prev, fecha: false }))}
        />

        <Input
          tipo="number"
          label="Monto del pago (Bs.)"
          value={pagoForm.monto}
          onChange={(e) => handleChange('monto', e.target.value)}
          step="0.01"
          min="0"
          required={true}
          readOnly={loading}
          error={fieldErrors.monto}
          onClearError={() => setFieldErrors(prev => ({ ...prev, monto: false }))}
        />

        <Input
          tipo="text"
          label="Detalle"
          value={pagoForm.detalle}
          onChange={(e) => handleChange('detalle', e.target.value)}
          readOnly={loading}
        />
        <div className={styles.space}></div>
        <Boton
          className="btn-original"
          label="Registrar Pago"
          style={{ marginTop: 'auto' }}
          onClick={handleSubmitPago}
          loading={loading}
          disabled={loading}
        />
      </div>
    </ViewModal>
  );
}

export default ModalRegistrarPago;
