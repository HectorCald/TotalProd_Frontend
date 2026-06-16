import React from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import styles from '../../../pages/home/View.module.css';

const MiProduccion = () => {
  const { isLargeScreen } = useLayout();

  return (
    <>
      {isLargeScreen && <NavBar />}
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Mi Producción</h1>
        </div>
      </div>
    </>
  );
};

export default MiProduccion;
