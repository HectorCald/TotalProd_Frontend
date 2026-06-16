import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/old/HeaderModal';
import Boton from '../../common/botones/Boton';
import Input from '../../common/inputs/Input';
import InputCall from '../../common/inputs/InputCall';
import productsAlmacenService from '../../../services/productsAlmacenService';
import EditarAgregarReceta from './EditarAgregarReceta';
import Switch from '../../common/old/Switch';
import CategoriasAlmacen from './CategoriasAlmacen';
import { useToast } from '../../../context/ToastContext';
import NoData from '../../common/widgets/NoData';
import { useUser } from '../../../context/UserContext';
import { isSoloVentas } from '../../../utils/empresaHelper';
import { extractRecetaFromAlmacen } from '../../../utils/logFormatters';
import useHistorialLogger from '../../ui/HistorialLogger';

function EditarAgregar({ isOpen, setIsOpen, data = '', tipo, onProductCreated, onProductUpdated, preciosTipos = [], loadingPrecios = false }) {
  const { user } = useUser();
  const soloVentas = isSoloVentas(user);
  const { showSuccess, showDanger, showWarning } = useToast();
  const { logAccion } = useHistorialLogger({
    modulo: 'Almacén General'
  });

  const [dataMov, setDataMov] = useState({
    name: '',
    description: '',
    stock: '',
    codigo_barras: '',
    category_id: '',
    grup: '',
    stock_minimo: '',
    costo_produccion: '',
    prices: {} // Objeto para almacenar los precios por tipo
  });

  const [loading, setLoading] = useState(false);
  const [isRecetaOpen, setIsRecetaOpen] = useState(false);
  const [hasReceta, setHasReceta] = useState(false);
  const [recetaGuardada, setRecetaGuardada] = useState(null);
  const [hasMovements, setHasMovements] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [isCategoriasSeleccionOpen, setIsCategoriasSeleccionOpen] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ name: false, stock: false, prices: {} });

  // Efecto para cargar los datos del producto en editar
  useEffect(() => {
    setFieldErrors({ name: false, stock: false, prices: {} });
    if (data && tipo === 'editar') {
      // Convertir price_product a prices
      const prices = {};
      if (data.price_product && Array.isArray(data.price_product)) {
        data.price_product.forEach(price => {
          if (price.prices_types && price.prices_types.id) {
            prices[price.prices_types.id] = price.valor || '';
          }
        });
      }

      // Cargar receta si existe
      let recetaData = null;
      if (data.recetas && data.recetas.length > 0) {
        const receta = data.recetas[0];
        recetaData = {
          descripcion: receta.descripcion || '',
          productos: receta.recetas_detalle ? receta.recetas_detalle.map(detalle => ({
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
        stock: data.stock !== undefined && data.stock !== null ? data.stock : '',
        codigo_barras: data.codigo_barras || '',
        category_id: data.category_id || '',
        grup: data.grup || '',
        stock_minimo: data.stock_minimo !== undefined && data.stock_minimo !== null ? data.stock_minimo : '',
        costo_produccion: data.costo_produccion !== undefined && data.costo_produccion !== null ? data.costo_produccion : '',
        prices: prices
      });

      // Establecer la categoría seleccionada si existe
      if (data.category_id) {
        if (data.category_almacen) {
          // Si tenemos el objeto completo de la categoría
          setCategoriaSeleccionada(data.category_almacen);
        } else if (data.category_name) {
          // Si solo tenemos el nombre, crear un objeto temporal
          setCategoriaSeleccionada({
            id: data.category_id,
            name: data.category_name
          });
        } else {
          setCategoriaSeleccionada(null);
        }
      } else {
        setCategoriaSeleccionada(null);
      }

      // Cargar receta guardada
      setRecetaGuardada(recetaData);
    } else {
      setDataMov({
        name: '',
        description: '',
        stock: '',
        codigo_barras: '',
        category_id: '',
        grup: '',
        stock_minimo: '',
        costo_produccion: '',
        prices: {}
      });
      setHasReceta(false);
      setRecetaGuardada(null);
      setCategoriaSeleccionada(null);
      setFieldErrors({ name: false, stock: false, prices: {} });
    }
  }, [isOpen, data, tipo]);



  // Efecto para verificar movimientos cuando se está editando
  useEffect(() => {
    const checkMovements = async () => {
      if (data?.id && tipo === 'editar' && isOpen) {
        setLoadingMovements(true);
        try {
          // Por ahora no verificamos movimientos para productos de almacén
          // En el futuro se puede implementar si es necesario
          setHasMovements(false);
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
    if (field === 'name' || field === 'stock') {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
  };



  // Función para actualizar los precios
  const handlePriceChange = (priceTypeId, value) => {
    setDataMov(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [priceTypeId]: value
      }
    }));
    setFieldErrors((prev) => ({
      ...prev,
      prices: { ...prev.prices, [priceTypeId]: false }
    }));
  };
  // Función para manejar el switch de receta
  const handleRecetaSwitch = (checked) => {
    setHasReceta(checked);
    if (!checked) {
      setRecetaGuardada(null);
    }
  };
  // Función para manejar cuando se selecciona una categoría
  const handleCategoriaSeleccionada = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setDataMov(prev => ({ ...prev, category_id: categoria.id }));
    setIsCategoriasSeleccionOpen(false);
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

    if (dataMov.stock === '' || dataMov.stock === null || dataMov.stock === undefined) {
      setFieldErrors((prev) => ({ ...prev, stock: true }));
      showWarning('Validación', 'El stock es obligatorio', 5000);
      return;
    }

    if (isNaN(dataMov.stock) || parseInt(dataMov.stock) < 0) {
      setFieldErrors((prev) => ({ ...prev, stock: true }));
      showWarning('Validación', 'El stock debe ser un número válido mayor o igual a 0', 5000);
      return;
    }

    // Validar receta solo si está marcado el switch y no es solo ventas
    if (!soloVentas && hasReceta && (!recetaGuardada || !recetaGuardada.productos || recetaGuardada.productos.length === 0)) {
      showWarning('Validación', 'Debe crear una receta con al menos un producto', 5000);
      return;
    }

    // Validar precios: todos deben tener valor (no vacío) y ser >= 0
    if (preciosTipos && preciosTipos.length > 0) {
      const priceErrors = {};
      preciosTipos.forEach((pt) => {
        const val = dataMov.prices[pt.id];
        if (val === '' || val === null || val === undefined) priceErrors[pt.id] = true;
        else {
          const num = parseFloat(String(val).replace(',', '.'));
          if (isNaN(num) || num < 0) priceErrors[pt.id] = true;
        }
      });
      if (Object.keys(priceErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, prices: { ...prev.prices, ...priceErrors } }));
        showWarning('Validación', 'Todos los precios son obligatorios y deben ser mayor o igual a 0', 5000);
        return;
      }
    }

    setFieldErrors({ name: false, stock: false, prices: {} });
    setLoading(true);
    try {
      let response;
      // Campos numéricos opcionales: vacío → null (consistencia crear/actualizar)
      const parseOptionalNum = (val, parser = parseFloat) => {
        if (val === '' || val === null || val === undefined) return null;
        const n = parser(val);
        return isNaN(n) ? null : n;
      };

      const productData = {
        name: dataMov.name,
        description: dataMov.description || null,
        stock: parseInt(dataMov.stock),
        codigo_barras: dataMov.codigo_barras || null,
        category_id: dataMov.category_id || null,
        grup: parseOptionalNum(dataMov.grup, (v) => parseInt(v)),
        stock_minimo: parseOptionalNum(dataMov.stock_minimo),
        costo_produccion: parseOptionalNum(dataMov.costo_produccion),
        prices: dataMov.prices,
        receta: (!soloVentas && hasReceta) ? recetaGuardada : null // Incluir receta solo si no es solo ventas y está marcado el switch
      };

      if (tipo === 'editar') {
        response = await productsAlmacenService.update(data.id, productData);
      } else {
        response = await productsAlmacenService.create(productData);
      }

      if (response.success) {
        const registroId = (response.data && response.data.id) || response.id || data?.id || null;
        const comentarioAccion = tipo === 'editar'
          ? 'Actualización de producto de almacén'
          : 'Creación de producto de almacén';

        // Detalles en orden del formulario. Keys en español. Precios como "Precio [nombre]".
        const categoriaNombreAntes = tipo === 'editar'
          ? (data?.category_almacen?.name ?? data?.category_name ?? categoriaSeleccionada?.name ?? null)
          : null;
        const categoriaNombreDespues = categoriaSeleccionada?.name ?? null;

        const camposDetalle = {};
        const camposOrden = [
          'Nombre del Producto',
          'Descripción',
          'Stock',
          'Stock mínimo',
          'Código de barras',
          'Grupo',
          'Categoría'
        ];

        camposDetalle['Nombre del Producto'] = tipo === 'editar'
          ? { antes: data?.name ?? null, despues: productData.name }
          : { despues: productData.name };
        camposDetalle['Descripción'] = tipo === 'editar'
          ? { antes: data?.description ?? null, despues: productData.description ?? null }
          : { despues: productData.description ?? null };
        camposDetalle['Stock'] = tipo === 'editar'
          ? { antes: data?.stock ?? null, despues: productData.stock }
          : { despues: productData.stock };
        camposDetalle['Stock mínimo'] = tipo === 'editar'
          ? { antes: data?.stock_minimo ?? null, despues: productData.stock_minimo ?? null }
          : { despues: productData.stock_minimo ?? null };
        camposDetalle['Código de barras'] = tipo === 'editar'
          ? { antes: data?.codigo_barras ?? null, despues: productData.codigo_barras ?? null }
          : { despues: productData.codigo_barras ?? null };
        camposDetalle['Grupo'] = tipo === 'editar'
          ? { antes: data?.grup ?? null, despues: productData.grup ?? null }
          : { despues: productData.grup ?? null };
        camposDetalle['Categoría'] = tipo === 'editar'
          ? { antes: categoriaNombreAntes, despues: categoriaNombreDespues }
          : { despues: categoriaNombreDespues };

        preciosTipos.forEach((pt) => {
          const labelPrecio = `Precio ${pt.name}`;
          camposOrden.push(labelPrecio);
          const valAntes = tipo === 'editar' && data?.price_product
            ? (data.price_product.find(p => String(p.prices_types?.id) === String(pt.id))?.valor ?? null)
            : null;
          const valDespues = productData.prices?.[pt.id] ?? null;
          camposDetalle[labelPrecio] = tipo === 'editar'
            ? { antes: valAntes, despues: valDespues }
            : { despues: valDespues };
        });

        camposOrden.push('Receta');
        const recetaAntes = tipo === 'editar' ? extractRecetaFromAlmacen(data) : null;
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
          lugarAfectado: (response.data && response.data.name) || productData.name || data?.name || 'Producto de almacén',
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

  return (
    <>
      <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
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
              label="Stock"
              value={dataMov.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              required={true}
              readOnly={loading}
              error={fieldErrors.stock}
              onClearError={() => setFieldErrors((prev) => ({ ...prev, stock: false }))}
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
          <div className={styles.horizontal}>
            <Input
              tipo="text"
              label="Código de barras"
              value={dataMov.codigo_barras}
              onChange={(e) => handleChange('codigo_barras', e.target.value)}
              readOnly={loading}
            />

            <Input
              tipo="number"
              label="Grupo"
              value={dataMov.grup}
              onChange={(e) => handleChange('grup', e.target.value)}
              step="1"
              min="1"
              readOnly={loading}
            />
          </div>

          {/* Costo de producción 
          <Input
            tipo="number"
            label="Costo de producción (opcional)"
            value={dataMov.costo_produccion}
            onChange={(e) => handleChange('costo_produccion', e.target.value)}
            step="0.01"
            min="0"
          />
          */}

          <InputCall
            label="Categoría"
            value={categoriaSeleccionada?.name ?? ''}
            placeholder="Seleccionar"
            onClick={() => setIsCategoriasSeleccionOpen(true)}
            onClear={() => {
              setCategoriaSeleccionada(null);
              setDataMov(prev => ({ ...prev, category_id: '' }));
            }}
            readOnly={loading}
          />

          {/* Sección de Precios */}
          <p className={styles.subTitle}>Precios</p>
          {loadingPrecios ? (
            <NoData
              icon="loader-alt"
              title="Cargando precios..."
              detail="Obteniendo tipos de precios disponibles para configurar"
              transparent={true}
              minHeight="150px"
            />
          ) : (
            (() => {
              const rows = [];
              for (let i = 0; i < preciosTipos.length; i += 2) {
                rows.push(preciosTipos.slice(i, i + 2));
              }
              return rows.map((row, rowIndex) => (
                <div className={styles.horizontal} key={`row-${rowIndex}`}>
                  {row.map((priceType) => (
                    <Input
                      key={priceType.id}
                      tipo="number"
                      label={priceType.name}
                      value={dataMov.prices[priceType.id] || ''}
                      onChange={(e) => handlePriceChange(priceType.id, e.target.value)}
                      step="0.01"
                      min="0"
                      required={true}
                      readOnly={loading}
                      error={fieldErrors.prices?.[priceType.id]}
                      onClearError={() => setFieldErrors((prev) => ({ ...prev, prices: { ...prev.prices, [priceType.id]: false } }))}
                    />
                  ))}
                </div>
              ));
            })()
          )}
          {/* Switch para receta (solo si no es solo ventas) */}
          {!soloVentas && (
            <>
              <p className={styles.subTitle}>Receta</p>
              <div className={styles.content} style={{ padding: '10px 15px', marginBottom: '15px' }}>
                <Switch
                  title="¿Tiene receta?"
                  subtitle="Marca si este producto se produce a partir de materias primas de acopio"
                  checked={hasReceta}
                  onChange={handleRecetaSwitch}
                  icon="receipt"
                  readOnly={loading}
                />
              </div>

              {/* Botón de receta (solo si está marcado el switch) */}
              {hasReceta && (
                <Boton
                  className='btn-gray'
                  label={recetaGuardada ? 'Editar Receta' : 'Crear Receta'}
                  style={{ marginTop: 'auto' }}
                  onClick={() => setIsRecetaOpen(true)}
                  readOnly={loading}
                />
              )}
            </>
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
        <CategoriasAlmacen
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
      />
    </>
  );
}

export default EditarAgregar;