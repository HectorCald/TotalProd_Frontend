import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../components/common/modals/ModalLateral';
import Input from '../../../components/common/inputs/Input';
import InputSelect from '../../../components/common/inputs/InputSelect';
import Mensaje from '../../../components/common/outputs/Mensaje';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import { useToast } from '../../../context/ToastContext';
import UserService from '../../../services/userService';

const ModalEncuestaIA = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const { employee } = useEmployee();
  const { showSuccess, showDanger } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    area: '',
    area_otro: '',
    tipo_ayuda: '',
    tipo_ayuda_otro: '',
    funciones: '',
    frecuencia: '',
    frecuencia_otro: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        area: '',
        area_otro: '',
        tipo_ayuda: '',
        tipo_ayuda_otro: '',
        funciones: '',
        frecuencia: '',
        frecuencia_otro: ''
      });
      setFieldErrors({});
    }
  }, [isOpen]);

  const opcionesAreas = [
    { value: 'inventario', label: 'Gestión de Inventario y Almacén' },
    { value: 'ventas', label: 'Ventas, Pedidos y Cotizaciones' },
    { value: 'finanzas', label: 'Finanzas, Pagos y Deudas' },
    { value: 'produccion', label: 'Producción y Materia Prima' },
    { value: 'clientes', label: 'Clientes y Proveedores' },
    { value: 'general', label: 'Asistente General del Sistema' },
    { value: 'otro', label: 'Otro' }
  ];

  const opcionesTipoAyuda = [
    { value: 'automatizacion', label: 'Automatizar tareas repetitivas y registros' },
    { value: 'analisis', label: 'Análisis de datos y recomendaciones de negocio' },
    { value: 'alertas', label: 'Alertas predictivas (stock mínimo, cobros pendientes)' },
    { value: 'asistente', label: 'Chat inteligente para consultas y dudas' },
    { value: 'documentos', label: 'Generación rápida de presupuestos y pedidos' },
    { value: 'otro', label: 'Otro' }
  ];

  const opcionesFrecuencia = [
    { value: 'diario', label: 'Diariamente en mi jornada laboral' },
    { value: 'semanal', label: 'Varias veces por semana' },
    { value: 'reportes', label: 'Al revisar reportes y métricas' },
    { value: 'ocasional', label: 'Ocasionalmente cuando sea necesario' },
    { value: 'otro', label: 'Otro' }
  ];

  const handleConfirm = async () => {
    let hasErrors = false;
    const errors = {};

    if (!formData.area) {
      errors.area = true;
      hasErrors = true;
    } else if (formData.area === 'otro' && !formData.area_otro.trim()) {
      errors.area_otro = true;
      hasErrors = true;
    }

    if (!formData.tipo_ayuda) {
      errors.tipo_ayuda = true;
      hasErrors = true;
    } else if (formData.tipo_ayuda === 'otro' && !formData.tipo_ayuda_otro.trim()) {
      errors.tipo_ayuda_otro = true;
      hasErrors = true;
    }

    if (!formData.funciones.trim()) {
      errors.funciones = true;
      hasErrors = true;
    }

    if (!formData.frecuencia) {
      errors.frecuencia = true;
      hasErrors = true;
    } else if (formData.frecuencia === 'otro' && !formData.frecuencia_otro.trim()) {
      errors.frecuencia_otro = true;
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const currentUser = user || employee;
      const userName = currentUser
        ? (`${currentUser.firstName || currentUser.nombre || ''} ${currentUser.lastName || currentUser.apellido || ''}`).trim() || currentUser.name || currentUser.username || 'Usuario'
        : 'Usuario';
      const userEmail = currentUser?.email || '';

      const areaTexto = formData.area === 'otro'
        ? `Otro: ${formData.area_otro.trim()}`
        : (opcionesAreas.find(o => o.value === formData.area)?.label || formData.area);

      const tipoAyudaTexto = formData.tipo_ayuda === 'otro'
        ? `Otro: ${formData.tipo_ayuda_otro.trim()}`
        : (opcionesTipoAyuda.find(o => o.value === formData.tipo_ayuda)?.label || formData.tipo_ayuda);

      const frecuenciaTexto = formData.frecuencia === 'otro'
        ? `Otro: ${formData.frecuencia_otro.trim()}`
        : (opcionesFrecuencia.find(o => o.value === formData.frecuencia)?.label || formData.frecuencia);

      const respuestas = {
        area: areaTexto,
        tipo_ayuda: tipoAyudaTexto,
        funciones: formData.funciones.trim(),
        frecuencia: frecuenciaTexto
      };

      const result = await UserService.enviarEncuestaIA({
        userName,
        userEmail,
        respuestas
      });

      if (result && result.success) {
        showSuccess('Encuesta enviada', '¡Muchas gracias por tus comentarios sobre IA!');
        onClose();
      } else {
        showDanger('Error', result?.message || 'No se pudo enviar la encuesta.');
      }
    } catch (error) {
      console.error('Error al enviar encuesta de IA:', error);
      showDanger('Error', 'Ocurrió un error inesperado al enviar la encuesta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalLateral
      isOpen={isOpen}
      onClose={onClose}
      title="Encuesta sobre IA"
      confirmText="Enviar"
      onConfirm={handleConfirm}
      loading={loading}
      disableClose={loading}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <InputSelect
            label="¿En qué área te gustaría implementar Inteligencia Artificial?"
            value={formData.area}
            onChange={(val) => {
              setFormData(prev => ({ ...prev, area: val, area_otro: val === 'otro' ? prev.area_otro : '' }));
              setFieldErrors(prev => ({ ...prev, area: false, area_otro: false }));
            }}
            options={opcionesAreas}
            placeholder="Selecciona un área..."
            required={true}
            error={fieldErrors.area}
          />
          {formData.area === 'otro' && (
            <div style={{ marginTop: '12px' }}>
              <Input
                tipo="text"
                label="Especificar otra área"
                value={formData.area_otro}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, area_otro: e.target.value }));
                  setFieldErrors(prev => ({ ...prev, area_otro: false }));
                }}
                placeholder="Indica el área..."
                required={true}
                error={fieldErrors.area_otro}
                onClearError={() => setFieldErrors(prev => ({ ...prev, area_otro: false }))}
              />
            </div>
          )}
        </div>

        <div>
          <InputSelect
            label="¿Cómo te gustaría que la IA te ayude principalmente?"
            value={formData.tipo_ayuda}
            onChange={(val) => {
              setFormData(prev => ({ ...prev, tipo_ayuda: val, tipo_ayuda_otro: val === 'otro' ? prev.tipo_ayuda_otro : '' }));
              setFieldErrors(prev => ({ ...prev, tipo_ayuda: false, tipo_ayuda_otro: false }));
            }}
            options={opcionesTipoAyuda}
            placeholder="Selecciona un tipo de ayuda..."
            required={true}
            error={fieldErrors.tipo_ayuda}
          />
          {formData.tipo_ayuda === 'otro' && (
            <div style={{ marginTop: '12px' }}>
              <Input
                tipo="text"
                label="Especificar otro tipo de ayuda"
                value={formData.tipo_ayuda_otro}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, tipo_ayuda_otro: e.target.value }));
                  setFieldErrors(prev => ({ ...prev, tipo_ayuda_otro: false }));
                }}
                placeholder="Indica cómo te gustaría que te ayude..."
                required={true}
                error={fieldErrors.tipo_ayuda_otro}
                onClearError={() => setFieldErrors(prev => ({ ...prev, tipo_ayuda_otro: false }))}
              />
            </div>
          )}
        </div>

        <Input
          tipo="textarea"
          label="¿Qué funciones o tareas específicas te gustaría que realice?"
          value={formData.funciones}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, funciones: e.target.value }));
            setFieldErrors(prev => ({ ...prev, funciones: false }));
          }}
          placeholder="Describe aquí tus ideas o necesidades cotidianas..."
          rows={4}
          required={true}
          error={fieldErrors.funciones}
          onClearError={() => setFieldErrors(prev => ({ ...prev, funciones: false }))}
        />

        <div>
          <InputSelect
            label="¿Con qué frecuencia usarías estas funciones?"
            value={formData.frecuencia}
            onChange={(val) => {
              setFormData(prev => ({ ...prev, frecuencia: val, frecuencia_otro: val === 'otro' ? prev.frecuencia_otro : '' }));
              setFieldErrors(prev => ({ ...prev, frecuencia: false, frecuencia_otro: false }));
            }}
            options={opcionesFrecuencia}
            placeholder="Selecciona la frecuencia..."
            required={true}
            error={fieldErrors.frecuencia}
          />
          {formData.frecuencia === 'otro' && (
            <div style={{ marginTop: '12px' }}>
              <Input
                tipo="text"
                label="Especificar otra frecuencia"
                value={formData.frecuencia_otro}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, frecuencia_otro: e.target.value }));
                  setFieldErrors(prev => ({ ...prev, frecuencia_otro: false }));
                }}
                placeholder="Indica la frecuencia..."
                required={true}
                error={fieldErrors.frecuencia_otro}
                onClearError={() => setFieldErrors(prev => ({ ...prev, frecuencia_otro: false }))}
              />
            </div>
          )}
        </div>

        <Mensaje
          type="info"
          message="Esta encuesta es totalmente anónima. Puedes enviar tus sugerencias o respuestas más de una vez si lo deseas."
        />
      </div>
    </ModalLateral>
  );
};

export default ModalEncuestaIA;
