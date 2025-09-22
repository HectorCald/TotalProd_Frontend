import React, { useState } from 'react';
import Screen from '../ui/Screen';
import Select from '../common/Select';
import RefreshIndicator from '../common/RefreshIndicator';
import { useSucursales } from '../../hooks/useData';
import styles from './Reportes.module.css';
import Boton from '../common/Boton';

const Reportes = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
  const [areaSeleccionada, setAreaSeleccionada] = useState('');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');

  // Hook para cargar sucursales
  const { sucursales, error, isLoading, refetch } = useSucursales(true);

  const opcionesPeriodo = [
    { value: 'hoy', label: 'Hoy', icon: 'calendar' },
    { value: '1_semana', label: '1 Semana', icon: 'calendar' },
    { value: '1_mes', label: '1 Mes', icon: 'calendar' },
    { value: '3_meses', label: '3 Meses', icon: 'calendar' },
    { value: '6_meses', label: '6 Meses', icon: 'calendar' },
    { value: '1_año', label: '1 Año', icon: 'calendar' }
  ];

  const opcionesArea = [
    { value: 'ventas', label: 'Ventas', icon: 'money' },
    { value: 'almacen_general', label: 'Almacen General', icon: 'money' },
    { value: 'materia_Prima', label: 'Materia Prima', icon: 'money' },
    { value: 'transferencias', label: 'Transferencias', icon: 'money' },
    { value: 'pedidos', label: 'Pedidos', icon: 'money' },
  ];

  // Convertir sucursales a formato para el Select
  const opcionesSucursales = sucursales.map(sucursal => ({
    value: sucursal.id,
    label: sucursal.name,
    icon: 'map'
  }));

  const handleAreaChange = (valor) => {
    setAreaSeleccionada(valor);
    console.log('Área seleccionada:', valor);
  };

  const handleSucursalChange = (valor) => {
    setSucursalSeleccionada(valor);
    console.log('Sucursal seleccionada:', valor);
  };

  const handlePeriodoChange = (valor) => {
    setPeriodoSeleccionado(valor);
    console.log('Período seleccionado:', valor);
    // Aquí puedes agregar la lógica para cargar reportes según el período
  };

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <Screen title="Reportes">
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <p className={styles.subTitle}>SELECCIONAR</p>
          <RefreshIndicator
            isVisible={isLoading}
            isLoading={isLoading}
          />
        </div>

        <div className={styles.content}>
          <Select
            placeholder="Período de tiempo"
            options={opcionesPeriodo}
            value={periodoSeleccionado}
            onChange={handlePeriodoChange}
            icon="calendar"
          />
        </div>

        <div className={styles.content}>
          <Select
            placeholder="Área"
            options={opcionesArea}
            value={areaSeleccionada}
            onChange={handleAreaChange}
            icon="category"
          />
        </div>

        <div className={styles.content}>
          <Select
            placeholder="Sucursal"
            options={opcionesSucursales}
            value={sucursalSeleccionada}
            onChange={handleSucursalChange}
            icon="map"
          />
        </div>
        <div className={styles.buttons}>
          <Boton
            className='btn-blue'
            label='Generar Reporte'
          />
        </div>

        {/* Mostrar estado de carga o error si es necesario */}
        {error && (
          <div className={styles.errorContainer}>
            <p>Error al cargar sucursales: {error.message}</p>
          </div>
        )}
      </div>
    </Screen>
  );
};

export default Reportes;
