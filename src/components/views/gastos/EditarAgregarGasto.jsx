import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import Input from '../../common/inputs/Input';
import InputFecha from '../../common/inputs/InputFecha';
import InputCall from '../../common/inputs/InputCall';
import SelectorMetodoPago from '../../mixed/SelectorMetodoPago';
import Proveedores from '../proveedores/Proveedores';
import gastosService from '../../../services/gastosService';
import { useToast } from '../../../context/ToastContext';
import useHistorialLogger from '../../ui/HistorialLogger';

function EditarAgregarGasto({ isOpen, setIsOpen, onGastoCreated, gasto = null, tipo = 'agregar', onGastoUpdated }) {
  const { showSuccess, showDanger, showWarning } = useToast();
  const { logAccion } = useHistorialLogger({ modulo: 'Gastos' });
  
  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const obtenerFechaActual = () => {
    const hoy = new Date();
    return hoy.getFullYear() + '-' + 
      String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
      String(hoy.getDate()).padStart(2, '0');
  };

  const [dataGasto, setDataGasto] = useState({
    fecha: obtenerFechaActual(),
    valor: '',
    concepto: '',
    proveedor_id: '',
    metodo_pago: ''
  });

  const [loading, setLoading] = useState(false);
  const [isProveedoresSeleccionOpen, setIsProveedoresSeleccionOpen] = useState(false);
  const [proveedorSeleccionadoData, setProveedorSeleccionadoData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ fecha: false, valor: false, concepto: false, metodo_pago: false });

  // Igual que almacen-general: cargar datos cuando hay gasto y tipo editar (sin depender de isOpen)
  useEffect(() => {
    setFieldErrors({ fecha: false, valor: false, concepto: false, metodo_pago: false });
    if (tipo === 'editar' && gasto) {
      setDataGasto({
        fecha: gasto.fecha_gasto || obtenerFechaActual(),
        valor: gasto.valor?.toString() || '',
        concepto: gasto.concepto || '',
        proveedor_id: gasto.proveedor_id || '',
        metodo_pago: gasto.metodo_pago || ''
      });
      setProveedorSeleccionadoData(gasto.proveedor || null);
    } else {
      setDataGasto({
        fecha: obtenerFechaActual(),
        valor: '',
        concepto: '',
        proveedor_id: '',
        metodo_pago: 'efectivo'
      });
      setProveedorSeleccionadoData(null);
    }
  }, [isOpen, gasto, tipo]);

  // Función para actualizar los datos del formulario
  const handleChange = (field, value) => {
    setDataGasto({ ...dataGasto, [field]: value });
    if (['fecha', 'valor', 'concepto', 'metodo_pago'].includes(field)) {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  // Función para manejar cuando se selecciona un proveedor
  const handleProveedorSeleccionado = (proveedor) => {
    setProveedorSeleccionadoData(proveedor);
    setDataGasto(prev => ({ ...prev, proveedor_id: proveedor.id }));
    setIsProveedoresSeleccionOpen(false);
  };

  // Función para enviar los datos
  const handleSubmit = async () => {
    if (!dataGasto.fecha) {
      setFieldErrors((prev) => ({ ...prev, fecha: true }));
      showWarning('Validación', 'La fecha es obligatoria', 5000);
      return;
    }
    const valorNum = parseFloat(String(dataGasto.valor).replace(',', '.'));
    if (dataGasto.valor === '' || dataGasto.valor == null || isNaN(valorNum) || valorNum <= 0) {
      setFieldErrors((prev) => ({ ...prev, valor: true }));
      showWarning('Validación', 'El valor es obligatorio y debe ser mayor a 0', 5000);
      return;
    }
    if (!dataGasto.concepto.trim()) {
      setFieldErrors((prev) => ({ ...prev, concepto: true }));
      showWarning('Validación', 'El concepto es obligatorio', 5000);
      return;
    }
    if (!dataGasto.metodo_pago) {
      setFieldErrors((prev) => ({ ...prev, metodo_pago: true }));
      showWarning('Validación', 'El método de pago es obligatorio', 5000);
      return;
    }

    setFieldErrors({ fecha: false, valor: false, concepto: false, metodo_pago: false });
    setLoading(true);
    try {
      const gastoData = {
        fecha_gasto: dataGasto.fecha,
        valor: parseFloat(dataGasto.valor),
        concepto: dataGasto.concepto.trim(),
        proveedor_id: dataGasto.proveedor_id || null,
        metodo_pago: dataGasto.metodo_pago
      };

      // Crear o actualizar el gasto
      let response;
      if (tipo === 'editar' && gasto?.id) {
        response = await gastosService.update(gasto.id, gastoData);
      } else {
        response = await gastosService.create(gastoData);
      }
      
      if (response.success) {
        const registroId = (response.data && response.data.id) || response.id || gasto?.id || null;
        const comentarioAccion = tipo === 'editar'
          ? 'Actualización de gasto'
          : 'Creación de gasto';

        // Detalles en orden del formulario. Keys en español.
        const proveedorNombreAntes = tipo === 'editar' ? (gasto?.proveedor?.name ?? null) : null;
        const proveedorNombreDespues = proveedorSeleccionadoData?.name ?? null;

        const camposOrden = [
          'Fecha del gasto',
          'Valor del gasto (Bs.)',
          'Concepto del gasto',
          'Método de pago',
          'Proveedor'
        ];
        const camposDetalle = {
          'Fecha del gasto': tipo === 'editar'
            ? { antes: gasto?.fecha_gasto ?? null, despues: gastoData.fecha_gasto }
            : { despues: gastoData.fecha_gasto },
          'Valor del gasto (Bs.)': tipo === 'editar'
            ? { antes: gasto?.valor ?? null, despues: gastoData.valor }
            : { despues: gastoData.valor },
          'Concepto del gasto': tipo === 'editar'
            ? { antes: gasto?.concepto ?? null, despues: gastoData.concepto }
            : { despues: gastoData.concepto },
          'Método de pago': tipo === 'editar'
            ? { antes: gasto?.metodo_pago ?? null, despues: gastoData.metodo_pago }
            : { despues: gastoData.metodo_pago },
          'Proveedor': tipo === 'editar'
            ? { antes: proveedorNombreAntes, despues: proveedorNombreDespues }
            : { despues: proveedorNombreDespues }
        };

        const detallesPersonalizados = {
          campos: camposDetalle,
          camposOrden,
          comentario: comentarioAccion
        };

        await logAccion({
          accion: tipo === 'editar' ? 'EDITAR' : 'CREAR',
          lugarAfectado: gastoData.concepto || 'Gasto',
          registroId,
          comentario: comentarioAccion,
          detallesPersonalizados
        });

        setIsOpen(false);
        const mensaje = tipo === 'editar' ? 'Gasto actualizado correctamente' : 'Gasto registrado correctamente';
        showSuccess('Éxito', mensaje);
        
        if (tipo === 'editar' && onGastoUpdated) {
          // Merge con gasto existente: el backend suele devolver solo lo enviado, conservar user/sucursal/proveedor
          const gastoActualizado = {
            ...gasto,
            ...response.data,
            proveedor: proveedorSeleccionadoData ?? response.data?.proveedor ?? gasto?.proveedor
          };
          onGastoUpdated(gastoActualizado);
        } else if (onGastoCreated) {
          onGastoCreated(response.data);
        }
      } else {
        const mensajeError = tipo === 'editar' ? 'Error al actualizar el gasto' : 'Error al crear el gasto';
        showDanger('Error', response.message || mensajeError);
      }

    } catch (error) {
      console.error('Error al registrar gasto:', error);
      showDanger('Error', error.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={tipo === 'editar' ? 'Editar Gasto' : 'Nuevo Gasto'}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <hr className={styles.separator} />

        <InputFecha
          label="Fecha del gasto"
          value={dataGasto.fecha}
          onChange={(val) => handleChange('fecha', val)}
          required={true}
          readOnly={loading}
          error={fieldErrors.fecha}
          onClearError={() => setFieldErrors((prev) => ({ ...prev, fecha: false }))}
        />

        <Input
          tipo="number"
          label="Valor del gasto (Bs.)"
          value={dataGasto.valor}
          onChange={(e) => handleChange('valor', e.target.value)}
          step="0.01"
          min="0"
          required={true}
          readOnly={loading}
          error={fieldErrors.valor}
          onClearError={() => setFieldErrors((prev) => ({ ...prev, valor: false }))}
        />

        <Input
          tipo="text"
          label="Concepto del gasto"
          value={dataGasto.concepto}
          onChange={(e) => handleChange('concepto', e.target.value)}
          required={true}
          readOnly={loading}
          error={fieldErrors.concepto}
          onClearError={() => setFieldErrors((prev) => ({ ...prev, concepto: false }))}
        />

        <SelectorMetodoPago
          label="Método de pago"
          value={dataGasto.metodo_pago}
          onChange={(val) => handleChange('metodo_pago', val)}
          placeholder="Seleccionar"
          required={true}
          readOnly={loading}
          error={fieldErrors.metodo_pago}
          onClearError={() => setFieldErrors((prev) => ({ ...prev, metodo_pago: false }))}
        />

        <InputCall
          label="Proveedor"
          value={proveedorSeleccionadoData?.name ?? ''}
          placeholder="Seleccionar"
          onClick={() => setIsProveedoresSeleccionOpen(true)}
          onClear={() => {
            setProveedorSeleccionadoData(null);
            setDataGasto((prev) => ({ ...prev, proveedor_id: '' }));
          }}
          readOnly={loading}
        />
        <div className={styles.space}></div>
        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Actualizar Gasto' : 'Registrar Gasto'}
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </div>
      {/* Modal de selección de proveedores */}
    <Proveedores
        isOpen={isProveedoresSeleccionOpen}
        setIsOpen={setIsProveedoresSeleccionOpen}
        modoSeleccion={true}
        onProveedorSeleccionado={handleProveedorSeleccionado}
      />
    </ViewModal>
    </>
  );
}

export default EditarAgregarGasto;
