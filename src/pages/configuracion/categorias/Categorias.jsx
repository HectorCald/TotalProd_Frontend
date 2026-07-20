import React, { useState, useCallback } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import categoryAlmacenService from '../../../services/categoryAlmacenService';
import categoryAcopioService from '../../../services/categoryAcopioService';
import ItemMultiple from '../../../components/common/information/ItemMultiple';
import useSessionCache from '../../../hooks/useSessionCache';
import LayoutGrid from '../../../components/layout/LayoutGrid';
import BotonFlotante from '../../../components/common/botones/BotonFlotante';
import AgregarEditarCategoria from './modals/AgregarEditarCategoria';
import EliminarCategoria from './modals/EliminarCategoria';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';

const Categorias = () => {
  const { isLargeScreen } = useLayout();
  const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
  const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
  const sucursalSeleccionada = userSucursal || employeeSucursal;
  const tipoEmpresa = sucursalSeleccionada?.empresas?.tipo || userInfo?.empresa?.tipo || employeeInfo?.sucursal?.empresas?.tipo || 'ventas_produccion';
  const isSoloVentas = tipoEmpresa === 'ventas';

  // Cache de sesión: persiste durante la sesión sin refetch al volver
  const {
    value: categorias,
    setValue: setCategorias,
    hasCache,
  } = useSessionCache({
    key: 'categoriasListado',
    defaultValue: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para los modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // Carga inicial solo si no hay cache en sesión
  const handleLoadCategorias = useCallback(async () => {
    if (hasCache) return; // ya tenemos datos en sesión, no recargar
    setIsLoading(true);
    setError(null);
    try {
      const [resAlmacen, resAcopio] = await Promise.all([
        categoryAlmacenService.getAll().catch(e => ({ success: false, message: e.message })),
        categoryAcopioService.getAll().catch(e => ({ success: false, message: e.message }))
      ]);

      let nuevasCategorias = [];

      if (resAlmacen?.success && resAlmacen.data) {
        const almacenCats = resAlmacen.data.map(cat => ({
          ...cat,
          _tipo_modulo: 'almacen',
          description: 'Almacén'
        }));
        nuevasCategorias = [...nuevasCategorias, ...almacenCats];
      }

      if (!isSoloVentas && resAcopio?.success && resAcopio.data) {
        const acopioCats = resAcopio.data.map(cat => ({
          ...cat,
          _tipo_modulo: 'acopio',
          description: 'Materia Prima'
        }));
        nuevasCategorias = [...nuevasCategorias, ...acopioCats];
      }

      setCategorias(nuevasCategorias);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [hasCache, setCategorias]);

  // Se ejecuta una sola vez al montar si no hay cache
  React.useEffect(() => {
    handleLoadCategorias();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Categorías</h1>
          {!isSoloVentas && (
            <h3 className={styles.title} style={{ fontSize: '13px', color: '#555' }}>
              Almacén General
            </h3>
          )}
          <LayoutGrid
            columns={3}
            isLoading={isLoading}
            empty={categorias.filter(c => c._tipo_modulo === 'almacen').length === 0}
            emptyMessage="No hay categorías de almacén cargadas."
          >
            {categorias.filter(c => c._tipo_modulo === 'almacen').map((categoria, index) => (
              <ItemMultiple
                key={`${categoria._tipo_modulo}-${categoria.id || index}`}
                title={categoria.name || categoria.nombre || 'Sin nombre'}
                description={categoria.description}
                onEdit={() => {
                  setCategoriaSeleccionada(categoria);
                  setIsModalOpen(true);
                }}
                onDelete={() => {
                  setCategoriaSeleccionada(categoria);
                  setIsDeleteModalOpen(true);
                }}
              />
            ))}
          </LayoutGrid>

          {!isSoloVentas && (
            <>
              <h3 className={styles.title} style={{ marginTop: '24px', fontSize: '13px', color: '#555' }}>
                Materia Prima
              </h3>
              <LayoutGrid
                columns={3}
                isLoading={isLoading}
                empty={categorias.filter(c => c._tipo_modulo === 'acopio').length === 0}
                emptyMessage="No hay categorías de materia prima cargadas."
              >
                {categorias.filter(c => c._tipo_modulo === 'acopio').map((categoria, index) => (
                  <ItemMultiple
                    key={`${categoria._tipo_modulo}-${categoria.id || index}`}
                    title={categoria.name || categoria.nombre || 'Sin nombre'}
                    description={categoria.description}
                    onEdit={() => {
                      setCategoriaSeleccionada(categoria);
                      setIsModalOpen(true);
                    }}
                    onDelete={() => {
                      setCategoriaSeleccionada(categoria);
                      setIsDeleteModalOpen(true);
                    }}
                  />
                ))}
              </LayoutGrid>
            </>
          )}
        </div>
      </div>

      <BotonFlotante
        onClick={() => {
          setCategoriaSeleccionada(null);
          setIsModalOpen(true);
        }}
        iconName="plus"
        ariaLabel="Nueva Categoría"
        style={{ bottom: !isLargeScreen ? '80px' : undefined }}
      />

      <AgregarEditarCategoria
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoriaSeleccionada={categoriaSeleccionada}
        onGuardar={(categoriaGuardada) => {
          if (categoriaSeleccionada) {
            // Edición: reemplaza el elemento con los datos actualizados y mantiene orden
            setCategorias(prev =>
              prev
                .map(c =>
                  c._tipo_modulo === categoriaSeleccionada._tipo_modulo && c.id === categoriaSeleccionada.id
                    ? { ...c, ...categoriaGuardada }
                    : c
                )
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            );
          } else {
            // Creación: inserta y ordena A-Z
            const descripcion = categoriaGuardada._tipo_modulo === 'acopio' ? 'Materia Prima' : 'Almacén';
            const nuevaCategoria = { ...categoriaGuardada, description: descripcion };
            setCategorias(prev =>
              [...prev, nuevaCategoria].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            );
          }
          setIsModalOpen(false);
        }}
      />

      {/* Al eliminar: quita el elemento localmente sin refetch */}
      <EliminarCategoria
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        categoriaSeleccionada={categoriaSeleccionada}
        onEliminar={(idEliminado, tipoEliminado) => {
          setCategorias(prev =>
            prev.filter(c => !(c.id === idEliminado && c._tipo_modulo === tipoEliminado))
          );
          setIsDeleteModalOpen(false);
        }}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Categorias;
