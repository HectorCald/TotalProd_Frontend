import React, { useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import InputSelect from '../../../components/common/inputs/InputSelect';

const Reportes = () => {
  const { isLargeScreen } = useLayout();
  
  const [reportes, setReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const [activeFilters, setActiveFilters] = useState({
    fecha: { inicio: today, fin: today }
  });
  
  const [reportType, setReportType] = useState('Ventas');

  const filtersConfig = [
    {
      id: 'sort_order',
      title: 'Ordenamiento',
      singleSelect: true,
      options: [
        { label: 'A - Z', value: 'asc' },
        { label: 'Z - A', value: 'desc' }
      ]
    },
    {
      id: 'fecha',
      title: 'Fecha',
      type: 'date'
    }
  ];

  const columns = [
    { header: 'Campo 1', accessor: 'campo1', width: '20%' },
    { header: 'Campo 2', accessor: 'campo2', width: '20%' },
    { header: 'Campo 3', accessor: 'campo3', width: '20%' },
    { header: 'Campo 4', accessor: 'campo4', width: '20%' },
    { header: 'Campo 5', accessor: 'campo5', width: '20%' }
  ];

  const handleExportar = () => {
    // Lógica para exportar
    console.log("Exportar reportes");
  };

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Reportes</h1>
          <Tabla
            data={reportes}
            columns={columns}
            isLoading={isLoading}
            buttonLabel="Exportar"
            buttonIcon="download"
            onButtonClick={handleExportar}
            searchKeys={['name']}
            sortKey="name"
            filters={filtersConfig}
            searchValue={search}
            onSearchChange={setSearch}
            externalFilters={activeFilters}
            onFiltersChange={setActiveFilters}
            hideSearch={true}
            customHeaderComponent={
              <div style={{ width: '200px' }}>
                <InputSelect
                  value={reportType}
                  onChange={setReportType}
                  options={[
                    { value: 'Produccion', label: 'Producción' },
                    { value: 'Ventas', label: 'Ventas' },
                    { value: 'Materia prima', label: 'Materia prima' }
                  ]}
                  clearable={false}
                />
              </div>
            }
          />
        </div>
      </div>
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Reportes;
