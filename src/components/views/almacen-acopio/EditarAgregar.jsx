import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/old/HeaderModal';
import Boton from '../../common/botones/Boton';
import Input from '../../common/inputs/Input';
import InputCall from '../../common/inputs/InputCall';
import InputSelect from '../../common/inputs/InputSelect';
import productsAcopioService from '../../../services/productsAcopioService';
import EditarAgregarReceta from '../almacen-general/EditarAgregarReceta';
import Switch from '../../common/old/Switch';
import CategoriasAcopio from './CategoriasAcopio';
import { useToast } from '../../../context/ToastContext';
import { extractRecetaFromAcopio } from '../../../utils/logFormatters';
import useHistorialLogger from '../../ui/HistorialLogger';

function EditarAgregar({ isOpen, setIsOpen, data = '', tipo, onProductCreated, onProductUpdated, typeMeasures = [] }) {
  const { showSuccess, showDanger, showWarning } = useToast();
  const { logAccion } = useHistorialLogger({
    modulo: 'Almacén Acopio'
  });

  const [dataMov, setDataMov] = useState({
    name: '',
    description: '',
    quantity: '',
    type_measure_id: '',
    category_id: '',
    stock_minimo: ''
  });

  const [loading, setLoading] = useState(false);
  const [isRecetaOpen, setIsRecetaOpen] = useState(false);
  const [hasReceta, setHasReceta] = useState(false);
  const [recetaGuardada, setRecetaGuardada] = useState(null);
  const [hasMovements, setHasMovements] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [isCategoriasSeleccionOpen, setIsCategoriasSeleccionOpen] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ name: false, quantity: false, type_measure_id: false });



  // Efecto para cargar los datos del producto
  useEffect(() => {
    setFieldErrors({ name: false, quantity: false, type_measure_id: false });
    if (data && tipo === 'editar') {
      // Cargar receta si existe
      let recetaData = null;
      if (data.recetas_acopio && data.recetas_acopio.length > 0) {
        const receta = data.recetas_acopio[0];
        recetaData = {
          descripcion: receta.description || '',
          productos: receta.recetas_acopio_detalle ? receta.recetas_acopio_detalle.map(detalle => ({
            producto_acopio_id: detalle.products_acopio?.id || detalle.producto_acopio_id,
            cantidad: detalle.cantidad
          })) : []
        };
        setHasReceta(true);
      } else {
        setHasReceta(false);
      }

      setDataMov({
        name: data.name || '',
        description: data.description || '',
        quantity: data.quantity !== undefined && data.quantity !== null ? data.quantity : '',
        type_measure_id: data.type_measure_id || '',
        category_id: data.category_id || '',
        stock_minimo: data.stock_minimo !== undefined && data.stock_minimo !== null ? data.stock_minimo : ''
      });

      // Establecer la categoría seleccionada si existe
      if (data.category_id && data.category) {
        setCategoriaSeleccionada(data.category);
      } else {
        setCategoriaSeleccionada(null);
      }

      setRecetaGuardada(recetaData);
    } else {
      setDataMov({
        name: '',
        description: '',
        quantity: '',
        type_measure_id: '',
        category_id: '',
        stock_minimo: ''
      });
      setHasReceta(false);
      setRecetaGuardada(null);
      setCategoriaSeleccionada(null);
      setFieldErrors({ name: false, quantity: false, type_measure_id: false });
    }
  }, [isOpen, data, tipo]);

  // Efecto para verificar movimientos cuando se está editando
  useEffect(() => {
    const checkMovements = async () => {
      if (data?.id && tipo === 'editar' && isOpen) {
        setLoadingMovements(true);
        try {
          const response = await productsAcopioService.hasMovements(data.id);
          if (response.success) {
            setHasMovements(response.data.hasMovements);
          }
        } catch (error) {
          console.error('Error verificando movimientos:', error);
        } finally {
          setLoadingMovements(false);
        }
      } else {
        setHasMovements(false);
      }
    };

    checkMovements();
  }, [data?.id, tipo, isOpen]);

  // Función para actualizar los datos del formulario
  const handleChange = (field, value) => {
    setDataMov({ ...dataMov, [field]: value });
    if (field === 'name' || field === 'quantity' || field === 'type_measure_id') {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  // Función para manejar el switch de receta
  const handleRecetaSwitch = (checked) => {
    setHasReceta(checked);
    if (!checked) {
      setRecetaGuardada(null);
    }
  };

  // Función para manejar cuando se crea una receta
  const handleRecetaCreated = (recetaData) => {
    setRecetaGuardada(recetaData);
    setIsRecetaOpen(false);
  };

  // Función para manejar cuando se actualiza una receta
  const handleRecetaUpdated = (recetaData) => {
    setRecetaGuardada(recetaData);
    setIsRecetaOpen(false);
  };

  // Función para enviar los datos
  const handleSubmit = async () => {
    if (!dataMov.name.trim()) {
      setFieldErrors((prev) => ({ ...prev, name: true }));
      showWarning('Validación', 'El nombre es obligatorio', 5000);
      return;
    }

    if (dataMov.quantity === '' || dataMov.quantity === null || dataMov.quantity === undefined) {
      setFieldErrors((prev) => ({ ...prev, quantity: true }));
      showWarning('Validación', 'La cantidad es obligatoria', 5000);
      return;
    }

    if (isNaN(parseFloat(String(dataMov.quantity).replace(',', '.'))) || parseFloat(String(dataMov.quantity).replace(',', '.')) < 0) {
      setFieldErrors((prev) => ({ ...prev, quantity: true }));
      showWarning('Validación', 'La cantidad debe ser un número mayor o igual a 0', 5000);
      return;
    }

    if (!dataMov.type_measure_id) {
      setFieldErrors((prev) => ({ ...prev, type_measure_id: true }));
      showWarning('Validación', 'Debe seleccionar un tipo de medida', 5000);
      return;
    }

    // Validar receta si está marcado el switch
    if (hasReceta && (!recetaGuardada || !recetaGuardada.productos || recetaGuardada.productos.length === 0)) {
      showWarning('Validación', 'Debe crear una receta con al menos un producto', 5000);
      return;
    }

    setFieldErrors({ name: false, quantity: false, type_measure_id: false });
    setLoading(true);
    try {
      let response;
      const productData = {
        name: dataMov.name,
        description: dataMov.description,
        quantity: parseFloat(dataMov.quantity) || 0,
        type_measure_id: dataMov.type_measure_id,
        category_id: dataMov.category_id,
        stock_minimo: dataMov.stock_minimo ? parseFloat(dataMov.stock_minimo) : 0,
        receta: hasReceta ? recetaGuardada : null // Incluir receta solo si está marcado el switch
      };

      if (tipo === 'editar') {
        response = await productsAcopioService.update(data.id, productData);
      } else {
        response = await productsAcopioService.create(productData);
      }

      if (response.success) {
        const registroId = (response.data && response.data.id) || response.id || data?.id || null;
        const comentarioAccion = tipo === 'editar'
          ? 'Actualización de producto de materia prima'
          : 'Creación de producto de materia prima';

        // Detalles en orden del formulario. Keys en español.
        const categoriaNombreAntes = tipo === 'editar'
          ? (data?.category?.name ?? data?.category_name ?? categoriaSeleccionada?.name ?? null)
          : null;
        const categoriaNombreDespues = categoriaSeleccionada?.name ?? null;

        const getTipoMedidaNombre = (typeMeasureId) => {
          if (!typeMeasureId) return null;
          const tm = typeMeasures.find(t => String(t.id) === String(typeMeasureId));
          return tm?.name ?? tm?.code ?? null;
        };
        const tipoMedidaAntes = tipo === 'editar' ? (data?.type_measure?.name ?? data?.type_measure?.code ?? getTipoMedidaNombre(data?.type_measure_id)) : null;
        const tipoMedidaDespues = getTipoMedidaNombre(productData.type_measure_id);

        const camposDetalle = {};
        const camposOrden = [
          'Nombre del Producto',
          'Descripción',
          'Cantidad',
          'Stock mínimo (opcional)',
          'Tipo de medida',
          'Categoría',
          'Receta'
        ];

        camposDetalle['Nombre del Producto'] = tipo === 'editar'
          ? { antes: data?.name ?? null, despues: productData.name }
          : { despues: productData.name };
        camposDetalle['Descripción'] = tipo === 'editar'
          ? { antes: data?.description ?? null, despues: productData.description ?? null }
          : { despues: productData.description ?? null };
        camposDetalle['Cantidad'] = tipo === 'editar'
          ? { antes: data?.quantity ?? null, despues: productData.quantity }
          : { despues: productData.quantity };
        camposDetalle['Stock mínimo (opcional)'] = tipo === 'editar'
          ? { antes: data?.stock_minimo ?? null, despues: productData.stock_minimo ?? null }
          : { despues: productData.stock_minimo ?? null };
        camposDetalle['Tipo de medida'] = tipo === 'editar'
          ? { antes: tipoMedidaAntes, despues: tipoMedidaDespues }
          : { despues: tipoMedidaDespues };
        camposDetalle['Categoría'] = tipo === 'editar'
          ? { antes: categoriaNombreAntes, despues: categoriaNombreDespues }
          : { despues: categoriaNombreDespues };

        const recetaAntes = tipo === 'editar' ? extractRecetaFromAcopio(data) : null;
        const recetaDespues = productData.receta
          ? { descripcion: productData.receta.descripcion ?? null, productos: productData.receta.productos ?? [] }
          : null;
        camposDetalle['Receta'] = tipo === 'editar'
          ? { antes: recetaAntes, despues: recetaDespues }
          : { despues: recetaDespues };

        const detallesPersonalizados = {
          campos: camposDetalle,
          camposOrden,
          comentario: comentarioAccion
        };

        await logAccion({
          accion: tipo === 'editar' ? 'EDITAR' : 'CREAR',
          lugarAfectado: (response.data && response.data.name) || productData.name || data?.name || 'Producto de acopio',
          registroId,
          comentario: comentarioAccion,
          detallesPersonalizados
        });

        if (tipo === 'editar' && onProductUpdated) {
          onProductUpdated(response.data);
        } else if (tipo === 'agregar' && onProductCreated) {
          onProductCreated(response.data);
        }
        showSuccess(
          tipo === 'editar' ? 'Producto actualizado' : 'Producto creado',
          `El producto "${dataMov.name}" ha sido ${tipo === 'editar' ? 'actualizado' : 'creado'} exitosamente`,
          5000
        );
        setIsOpen(false);
      } else {
        showDanger('Error', response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el producto`, 5000);
      }
    } catch (error) {
      console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} producto:`, error);
      showDanger('Error', error.message || 'Error de conexión con el servidor', 5000);
    } finally {
      setLoading(false);
    }
  };


  // Función para manejar cuando se selecciona una categoría
  const handleCategoriaSeleccionada = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setDataMov(prev => ({ ...prev, category_id: categoria.id }));
    setIsCategoriasSeleccionOpen(false);
  };

  return (
    <>
      <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
        <HeaderModal
          title={tipo === 'editar' ? 'Editar Producto' : 'Nuevo Producto'}
          onClose={() => setIsOpen(false)}
        />
        <div className={styles.modalContent}>
          <hr className={styles.separator} />
          <p className={styles.subTitle}>Información</p>

          <Input
            tipo="text"
            label="Nombre del Producto"
            value={dataMov.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required={true}
            readOnly={loading}
            error={fieldErrors.name}
            onClearError={() => setFieldErrors((prev) => ({ ...prev, name: false }))}
          />

          <Input
            tipo="text"
            label="Descripción"
            value={dataMov.description}
            onChange={(e) => handleChange('description', e.target.value)}
            readOnly={loading}
          />

          <div className={styles.horizontal}>
            <Input
              tipo="number"
              label="Cantidad"
              value={dataMov.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              required={true}
              readOnly={loading}
              error={fieldErrors.quantity}
              onClearError={() => setFieldErrors((prev) => ({ ...prev, quantity: false }))}
            />
            <Input
              tipo="number"
              label="Stock mínimo"
              value={dataMov.stock_minimo}
              onChange={(e) => handleChange('stock_minimo', e.target.value)}
              step="0.01"
              min="0"
              readOnly={loading}
            />
          </div>

          <InputSelect
            label="Tipo de medida"
            value={dataMov.type_measure_id}
            onChange={(value) => handleChange('type_measure_id', value)}
            options={typeMeasures?.map((item, index) => ({
              value: item.id || item.value || `unique_${index}`,
              label: item.name || item.label || item.code || 'Sin nombre'
            })).filter((item, index, self) =>
              index === self.findIndex(t => t.value === item.value)
            ) || []}
            placeholder={tipo === 'editar' && hasMovements ? 'No editable - tiene movimientos' : 'Seleccionar'}
            disabled={tipo === 'editar' && hasMovements}
            readOnly={loading}
            required={true}
            error={fieldErrors.type_measure_id}
          />

          <InputCall
            label="Categoría (opcional)"
            value={categoriaSeleccionada?.name ?? ''}
            placeholder="Seleccionar"
            onClick={() => setIsCategoriasSeleccionOpen(true)}
            onClear={() => {
              setCategoriaSeleccionada(null);
              setDataMov(prev => ({ ...prev, category_id: '' }));
            }}
            readOnly={loading}
          />

          <p className={styles.subTitle}>Receta</p>
          <div className={styles.content} style={{ padding: '10px 15px', marginBottom: '15px' }}>
            <Switch
              title="¿Tiene receta?"
              subtitle="Marca si esta materia prima se produce a partir de otra materia prima"
              checked={hasReceta}
              onChange={handleRecetaSwitch}
              icon="receipt"
              readOnly={loading}
            />
          </div>

          {hasReceta && (
            <Boton
              className='btn-gray'
              label={recetaGuardada ? 'Editar Receta' : 'Crear Receta'}
              style={{ marginTop: 'auto' }}
              onClick={() => setIsRecetaOpen(true)}
              readOnly={loading}
            />
          )}

          <Boton
            className='btn-original'
            label={tipo === 'editar' ? 'Guardar cambios' : 'Agregar producto'}
            style={{ marginTop: 'auto' }}
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </div>
        {/* Modal de selección de categorías */}
      <CategoriasAcopio
        isOpen={isCategoriasSeleccionOpen}
        setIsOpen={setIsCategoriasSeleccionOpen}
        modoSeleccion={true}
        onCategoriaSeleccionada={handleCategoriaSeleccionada}
      />
      </ViewModal>
      
      {/* Modal de receta */}
      <EditarAgregarReceta
        isOpen={isRecetaOpen}
        setIsOpen={setIsRecetaOpen}
        productoAlmacenId={data?.id || null}
        recetaData={recetaGuardada}
        onRecetaCreated={handleRecetaCreated}
        onRecetaUpdated={handleRecetaUpdated}
        tipoProducto="acopio"
      />
    </>
  );
}

export default EditarAgregar;