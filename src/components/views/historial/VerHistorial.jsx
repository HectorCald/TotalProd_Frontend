import React, { useEffect, useMemo, useState } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import ItemView from '../../common/ItemView';
import OpcionDesplegable from '../../common/OpcionDesplegable';
import VerCliente from '../clientes/VerCliente';
import VerProveedor from '../proveedores/VerProveedor';
import VerPersona from '../personal/VerPersona';
import VerProducto from '../almacen-general/VerProducto';
import VerProductoAcopio from '../almacen-acopio/VerProducto';
import VerGasto from '../gastos/VerGasto';
import VerDeuda from '../deudas/VerDeuda';
import VerPrecio from '../precios/VerPrecio';
import VerSucursal from '../sucursales/VerSucursal';
import VerMovimiento from '../movimientos/VerMovimiento';
import VerMovimientoAcopio from '../movimientos/VerMovimientoAcopio';
import VerPedido from '../pedidos/VerPedido';
import VerPedidoAcopio from '../pedidos/VerPedidoAcopio';
import VerProduccion from '../damabrava/produccion/VerProduccion';
import VerPago from '../damabrava/produccion/pagos/VerPago';
import clientService from '../../../services/clientService';
import proveedorService from '../../../services/proveedorService';
import personalService from '../../../services/personalService';
import productsAlmacenService from '../../../services/productsAlmacenService';
import productsAcopioService from '../../../services/productsAcopioService';
import gastosService from '../../../services/gastosService';
import deudasService from '../../../services/deudasService';
import pricesTypesService from '../../../services/pricesTypesService';
import sucursalesService from '../../../services/sucursalesService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import registrosProduccionDamabravaService from '../../../services/registrosProduccionDamabravaService';
import pagosDamabravaService from '../../../services/pagosDamabravaService';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import { useLayout } from '../../../context/LayoutContext';
import { useToast } from '../../../context/ToastContext';

const stringifyValue = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }

  return String(value);
};

function VerHistorial({ isOpen, setIsOpen, registro }) {
  const { isLargeScreen } = useLayout();
  const { showDanger } = useToast();
  const [isAfectadoOpen, setIsAfectadoOpen] = useState(false);
  const [afectado, setAfectado] = useState(null);
  const [tipoAfectado, setTipoAfectado] = useState(null);
  const [loadingAfectado, setLoadingAfectado] = useState(false);

  const detallesParseados = useMemo(() => {
    if (!registro || registro.detalles === null || registro.detalles === undefined) {
      return { campos: {}, comentario: '', camposOrden: [] };
    }

    if (typeof registro.detalles === 'object') {
      return {
        campos: registro.detalles.campos || {},
        comentario: registro.detalles.comentario || '',
        camposOrden: registro.detalles.camposOrden || [],
        ...registro.detalles
      };
    }

    try {
      const parsed = JSON.parse(registro.detalles);
      return {
        campos: parsed.campos || {},
        comentario: parsed.comentario || '',
        camposOrden: parsed.camposOrden || [],
        ...parsed
      };
    } catch (error) {
      console.warn('VerHistorial: no se pudo parsear detalles como JSON', error);
      return { campos: {}, comentario: '', camposOrden: [], raw: registro.detalles, __parseError: true };
    }
  }, [registro]);

  useEffect(() => {
    if (detallesParseados.__parseError) {
      showDanger('Error', 'No se pudo interpretar los detalles del historial');
    }
  }, [detallesParseados.__parseError, showDanger]);

  const camposEntries = useMemo(() => {
    const campos = detallesParseados.campos || {};
    const orden = detallesParseados.camposOrden;
    if (Array.isArray(orden) && orden.length > 0) {
      return orden
        .filter((key) => campos[key] !== undefined && campos[key] !== null)
        .map((key) => [key, campos[key]]);
    }
    return Object.entries(campos);
  }, [detallesParseados.campos, detallesParseados.camposOrden]);

  const valueHasStructure = (value) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return false;
      return value.length > 1 || value.some(item => item && typeof item === 'object');
    }

    if (value && typeof value === 'object') {
      return Object.values(value).some(inner => {
        if (inner === value) {
          return false;
        }
        if (Array.isArray(inner)) {
          return inner.length > 0;
        }
        if (inner && typeof inner === 'object') {
          return valueHasStructure(inner) || Object.keys(inner).length > 0;
        }
        return false;
      });
    }

    return false;
  };

  const shouldRenderAsList = (info) => {
    if (Array.isArray(info)) return info.length > 0;

    if (info && typeof info === 'object') {
      if (info.antes !== undefined || info.despues !== undefined) {
        return valueHasStructure(info.antes) || valueHasStructure(info.despues);
      }

      return valueHasStructure(info);
    }

    return false;
  };

  const buildObjectNode = (item, index) => {
    const primaryLabel = item?.nombre || item?.producto || item?.label;
    const cantidad = item?.cantidad !== undefined ? stringifyValue(item.cantidad) : null;
    const unidad = item?.unidad ? stringifyValue(item.unidad) : null;

    const parts = [];
    if (primaryLabel) parts.push(primaryLabel);
    if (cantidad && unidad) {
      parts.push(`${cantidad} ${unidad}`);
    } else if (cantidad) {
      parts.push(`Cantidad: ${cantidad}`);
    } else if (unidad) {
      parts.push(`Unidad: ${unidad}`);
    }

    const excludedKeys = new Set(['nombre', 'producto', 'label', 'cantidad', 'unidad', 'children', 'items']);

    const extraChildren = Object.entries(item || {})
      .filter(([key]) => !excludedKeys.has(key))
      .map(([key, val]) => {
        if (Array.isArray(val) || (val && typeof val === 'object')) {
          const children = normalizeListItems(val);
          return {
            label: key,
            children: children.length > 0 ? children : undefined
          };
        }

        return { label: `${key}: ${stringifyValue(val)}` };
      })
      .filter(child => child.label || (child.children && child.children.length > 0));

    return {
      label: parts.length > 0 ? parts.join(' — ') : `Elemento ${index + 1}`,
      children: extraChildren.length > 0 ? extraChildren : undefined
    };
  };

  const normalizeListItems = (value) => {
    if (Array.isArray(value)) {
      return value.map((item, index) => {
        if (item && typeof item === 'object') {
          return buildObjectNode(item, index);
        }
        return { label: stringifyValue(item) };
      });
    }

    if (value && typeof value === 'object') {
      return Object.entries(value).map(([key, val]) => {
        if (Array.isArray(val) || (val && typeof val === 'object')) {
          const children = normalizeListItems(val);
          return {
            label: key,
            children: children.length > 0 ? children : undefined
          };
        }
        return { label: `${key}: ${stringifyValue(val)}` };
      });
    }

    if (value === null || value === undefined || value === '') {
      return [];
    }

    return [{ label: stringifyValue(value) }];
  };

  const isEmptyValue = (v) =>
    v === null || v === undefined || v === '';

  const valuesAreEqual = (a, b) => {
    if (a === b) return true;
    if (isEmptyValue(a) && isEmptyValue(b)) return true;
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  const buildListItemsFromInfo = (info) => {
    if (Array.isArray(info)) {
      return normalizeListItems(info);
    }

    if (!info || typeof info !== 'object') {
      return [];
    }

    if (info.antes !== undefined || info.despues !== undefined) {
      const same = info.antes !== undefined && info.despues !== undefined && valuesAreEqual(info.antes, info.despues);
      if (same) {
        const children = normalizeListItems(info.despues);
        return children.length > 0 ? children : [{ label: stringifyValue(info.despues) }];
      }

      const result = [];
      if (info.antes !== undefined) {
        const children = normalizeListItems(info.antes);
        result.push({
          label: 'Antes',
          children: children.length > 0 ? children : undefined
        });
      }

      if (info.despues !== undefined) {
        const children = normalizeListItems(info.despues);
        result.push({
          label: 'Después',
          children: children.length > 0 ? children : undefined
        });
      }

      return result;
    }

    return normalizeListItems(info);
  };

  const buildTextoCampo = (info) => {
    if (!info || (info.antes === undefined && info.despues === undefined)) {
      return 'Sin datos';
    }

    const hasAntes = info.antes !== undefined;
    const hasDespues = info.despues !== undefined;
    if (hasAntes && hasDespues && valuesAreEqual(info.antes, info.despues)) {
      return stringifyValue(info.despues);
    }

    if (hasAntes && hasDespues) {
      return { antes: stringifyValue(info.antes), despues: stringifyValue(info.despues) };
    }
    if (hasAntes) return stringifyValue(info.antes);
    if (hasDespues) return stringifyValue(info.despues);
    return 'Sin datos';
  };

  const obtenerRepresentacionCampo = (info) => {
    if (info === null || info === undefined || info === '') {
      return { tipo: 'texto', valor: 'Sin datos' };
    }

    if (shouldRenderAsList(info)) {
      const items = buildListItemsFromInfo(info);
      if (items.length > 0) {
        return { tipo: 'lista', valor: items };
      }
    }

    if (typeof info === 'object' && (info.antes !== undefined || info.despues !== undefined)) {
      return { tipo: 'texto', valor: buildTextoCampo(info) };
    }

    return { tipo: 'texto', valor: stringifyValue(info) };
  };

  const otherDetalleKeys = useMemo(() => {
    if (!detallesParseados || typeof detallesParseados !== 'object') {
      return [];
    }

    return Object.entries(detallesParseados)
      .filter(([key]) => !['campos', 'comentario', '__parseError'].includes(key));
  }, [detallesParseados]);

  useEffect(() => {
    setIsAfectadoOpen(false);
    setAfectado(null);
    setTipoAfectado(null);
    setLoadingAfectado(false);
  }, [registro?.id]);

  const handleVerAfectado = async () => {
    if (!registro?.registro_id) {
      showDanger('Error', 'No hay registro asociado para mostrar.');
      return;
    }

    const mod = (registro?.modulo || '').toLowerCase();
    const modNorm = mod.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const modulosSoportados = ['clientes', 'proveedores', 'personal', 'almacen general', 'almacen acopio', 'gastos', 'deudas', 'precios', 'sucursales', 'movimientos', 'movimientos acopio', 'pedidos', 'pedidos acopio', 'producción', 'produccion', 'pagos'];
    if (!modulosSoportados.includes(mod) && !modulosSoportados.includes(modNorm)) {
      showDanger('Error', 'No se puede abrir el registro afectado para este módulo.');
      return;
    }

    try {
      setLoadingAfectado(true);
      setAfectado(null);
      setTipoAfectado(null);
      setIsAfectadoOpen(false);

      let response;
      if (mod === 'clientes' || modNorm === 'clientes') {
        response = await clientService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el cliente.');
        setTipoAfectado('cliente');
      } else if (mod === 'proveedores' || modNorm === 'proveedores') {
        response = await proveedorService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el proveedor.');
        setTipoAfectado('proveedor');
      } else if (mod === 'personal' || modNorm === 'personal') {
        response = await personalService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró la persona.');
        setTipoAfectado('personal');
      } else if (mod === 'almacén general' || modNorm === 'almacen general') {
        response = await productsAlmacenService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el producto.');
        setTipoAfectado('productoAlmacen');
      } else if (mod === 'almacén acopio' || modNorm === 'almacen acopio') {
        response = await productsAcopioService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el producto de acopio.');
        setTipoAfectado('productoAcopio');
      } else if (mod === 'gastos' || modNorm === 'gastos') {
        response = await gastosService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el gasto.');
        setTipoAfectado('gasto');
      } else if (mod === 'deudas' || modNorm === 'deudas') {
        response = await deudasService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró la deuda.');
        setTipoAfectado('deuda');
      } else if (mod === 'precios' || modNorm === 'precios') {
        response = await pricesTypesService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el tipo de precio.');
        setTipoAfectado('precio');
      } else if (mod === 'sucursales' || modNorm === 'sucursales') {
        response = await sucursalesService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró la sucursal.');
        setTipoAfectado('sucursal');
      } else if (mod === 'movimientos' || modNorm === 'movimientos') {
        response = await movimientosAlmacenService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el movimiento.');
        setTipoAfectado('movimiento');
      } else if (mod === 'movimientos acopio' || modNorm === 'movimientos acopio') {
        response = await movimientosAcopioService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el movimiento de materia prima.');
        setTipoAfectado('movimientoAcopio');
      } else if (mod === 'pedidos' || modNorm === 'pedidos') {
        response = await pedidosAlmacenService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el pedido.');
        setTipoAfectado('pedido');
      } else if (mod === 'pedidos acopio' || modNorm === 'pedidos acopio') {
        response = await pedidosAcopioService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el pedido de materia prima.');
        setTipoAfectado('pedidoAcopio');
      } else if (mod === 'producción' || modNorm === 'produccion') {
        response = await registrosProduccionDamabravaService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el registro de producción.');
        setTipoAfectado('produccion');
      } else if (mod === 'pagos' || modNorm === 'pagos') {
        response = await pagosDamabravaService.getById(registro.registro_id);
        if (!response.success) throw new Error(response.message || 'No se encontró el pago.');
        setTipoAfectado('pago');
      } else {
        throw new Error('Módulo no soportado');
      }

      setAfectado(response.data);
      setIsAfectadoOpen(true);
    } catch (error) {
      console.error('Error al obtener registro afectado:', error);
      showDanger('Error', error.message || 'No se pudo obtener el registro afectado.');
    } finally {
      setLoadingAfectado(false);
    }
  };

  const renderUnCampo = ([campo, info]) => {
    const representacion = obtenerRepresentacionCampo(info);

    if (representacion.tipo === 'lista') {
      return (
        <Dato
          key={campo}
          label={campo}
          value={null}
          containerStyle={{ paddingBottom: 0, borderBottom: 'none' }}
        />
      );
    }

    const valor = representacion.valor;
    const valueNode = typeof valor === 'object' && valor !== null && 'antes' in valor && 'despues' in valor
      ? (
        <>
          <span className={styles.valorAnterior}>{valor.antes}</span>
          {'  >  '}
          <span>{valor.despues}</span>
        </>
      )
      : valor;

    return (
      <Dato
        key={campo}
        label={campo}
        value={valueNode}
        vertical={!isLargeScreen}
      />
    );
  };

  const renderDetallesContent = () => {
    if (camposEntries.length === 0) {
      return (
        <p className={styles.subTitle} style={{ fontWeight: 400 }}>
          No se registraron campos específicos para este historial.
        </p>
      );
    }
    const primerosCinco = camposEntries.slice(0, 5);
    const resto = camposEntries.slice(5);

    return (
      <>
        {primerosCinco.map(renderUnCampo)}
        {resto.length > 0 && (
          <OpcionDesplegable titulo={`Más campos (${resto.length})`} scrollOnOpen={false} disableAnimation={true}>
            <div className={styles.content}>
              {resto.map(renderUnCampo)}
            </div>
          </OpcionDesplegable>
        )}
      </>
    );
  };

  return (
    <View isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderView onBack={() => setIsOpen(false)} />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Detalles</h1>
            <p className={styles.subTitle}>
              {registro?.fecha
                ? ` Registrado el ${formatFechaLiteral(registro.fecha)} - ${formatHoraSinSegundos(registro.fecha)}`
                : '—'}
            </p>
          </div>
        </div>

        <div className={styles.contentRow}>
          {/* Columna izquierda: toda la información */}
          <div className={styles.contentHalf}>
            <div className={styles.content} style={{ height: '100%' }}>
              {(() => {
                const responsableNombre = registro?.user?.name || registro?.personal?.name;
                const responsableLabel = registro?.user
                  ? 'Usuario responsable'
                  : registro?.personal
                    ? 'Personal responsable'
                    : null;

                if (!responsableNombre) return null;

                return (
                  <>
                    <ItemView
                      title="Información de la Accción"
                      transparent={true}
                      icon="list-ul"
                      iconShape="square"
                      style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                    />
                    <Dato
                      label="Responsable"
                      value={responsableNombre}
                      description={responsableLabel}
                      vertical={false}
                    />
                  </>
                );
              })()}

              <Dato label="Módulo" value={registro?.modulo || '--'} vertical={false} />
              <Dato label="Acción" value={registro?.accion || '--'} vertical={false} />
              <Dato label="Lugar afectado" value={registro?.lugar_afectado || '--'} vertical={false} />


              {detallesParseados.comentario && (
                <>

                  <Dato
                    label="Comentario"
                    value={detallesParseados.comentario}
                  />

                </>
              )}
            </div>
          </div>

          {/* Columna derecha: Detalles + fecha debajo + campos afectados */}
          <div className={styles.contentHalf}>
            <div className={styles.content} style={{ height: '100%' }}>
              <ItemView
                title="Detalles"
                transparent={true}
                icon="list-ul"
                iconShape="square"
                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
              />
              {renderDetallesContent()}
            </div>
          </div>
        </div>

        {(() => {
          const mod = (registro?.modulo || '').toLowerCase();
          const modNorm = mod.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const puedeVerAfectado = ['clientes', 'proveedores', 'personal', 'almacen general', 'almacen acopio', 'gastos', 'deudas', 'precios', 'sucursales', 'movimientos', 'movimientos acopio', 'pedidos', 'pedidos acopio', 'producción', 'produccion', 'pagos'].includes(mod) ||
            ['clientes', 'proveedores', 'personal', 'almacen general', 'almacen acopio', 'gastos', 'deudas', 'precios', 'sucursales', 'movimientos', 'movimientos acopio', 'pedidos', 'pedidos acopio', 'producción', 'produccion', 'pagos'].includes(modNorm);
          return puedeVerAfectado && registro?.registro_id && (
            <Boton
              className="btn-gray"
              label="Ver Afectado"
              onClick={handleVerAfectado}
              loading={loadingAfectado}
              disabled={!registro?.registro_id}
              iconName="file"
            />
          );
        })()}

      </div>
      <div className={styles.space}></div>

      {tipoAfectado === 'cliente' && (
        <VerCliente
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          usuario={afectado}
          onClientDeleted={() => {}}
          onClientUpdated={() => {}}
        />
      )}
      {tipoAfectado === 'proveedor' && (
        <VerProveedor
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          usuario={afectado}
          onProveedorDeleted={() => {}}
          onProveedorUpdated={() => {}}
        />
      )}
      {tipoAfectado === 'personal' && (
        <VerPersona
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          usuario={afectado}
          sucursales={[]}
          onProveedorDeleted={() => {}}
          onProveedorUpdated={() => {}}
        />
      )}
      {tipoAfectado === 'productoAlmacen' && (
        <VerProducto
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          registro={afectado}
          onProductUpdated={() => {}}
          onProductDeleted={() => {}}
          preciosTipos={[]}
          loadingPrecios={false}
        />
      )}
      {tipoAfectado === 'productoAcopio' && (
        <VerProductoAcopio
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          registro={afectado}
          onProductUpdated={() => {}}
          onProductDeleted={() => {}}
          typeMeasures={[]}
        />
      )}
      {tipoAfectado === 'gasto' && (
        <VerGasto
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          gasto={afectado}
          onGastoEliminado={() => {}}
          onGastoActualizado={() => {}}
        />
      )}
      {tipoAfectado === 'deuda' && (
        <VerDeuda
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          deuda={afectado}
          onDeudaEliminada={() => {}}
          onDeudaActualizada={() => {}}
        />
      )}
      {tipoAfectado === 'precio' && (
        <VerPrecio
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          precio={afectado}
          onPrecioDeleted={() => {}}
          onPrecioUpdated={() => {}}
        />
      )}
      {tipoAfectado === 'sucursal' && (
        <VerSucursal
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          sucursal={afectado}
          onSucursalDeleted={() => {}}
          onSucursalUpdated={() => {}}
        />
      )}
      {tipoAfectado === 'movimiento' && (
        <VerMovimiento
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          movimiento={afectado}
          onMovimientoAnulado={() => {}}
          onMovimientoEliminado={() => {}}
          onMovimientoActualizado={() => {}}
          onMovimientoEditado={() => {}}
        />
      )}
      {tipoAfectado === 'movimientoAcopio' && (
        <VerMovimientoAcopio
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          movimiento={afectado}
          onMovimientoAnulado={() => {}}
          onMovimientoEliminado={() => {}}
        />
      )}
      {tipoAfectado === 'pedido' && (
        <VerPedido
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          pedido={afectado}
          tipoPedido="almacen"
          onPedidoEliminado={() => {}}
          onPedidoActualizado={() => {}}
        />
      )}
      {tipoAfectado === 'pedidoAcopio' && (
        <VerPedidoAcopio
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          pedido={afectado}
          onPedidoEliminado={() => {}}
          onPedidoActualizado={() => {}}
        />
      )}
      {tipoAfectado === 'produccion' && (
        <VerProduccion
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          registro={afectado}
          onRegistroAnulado={() => {}}
          onRegistroEliminado={() => {}}
          onRegistroVerificado={() => {}}
          reglas={[]}
        />
      )}
      {tipoAfectado === 'pago' && (
        <VerPago
          isOpen={isAfectadoOpen && !!afectado}
          setIsOpen={setIsAfectadoOpen}
          pago={afectado}
          onPagoActualizado={() => {}}
          onPagoEliminado={() => {}}
          reglas={[]}
        />
      )}
    </View>
  );
}

export default VerHistorial;

