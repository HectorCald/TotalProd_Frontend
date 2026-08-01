import React from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';

const Reportes = () => {
  const { isLargeScreen } = useLayout();

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Reportes</h1>
        </div>
      </div>
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Reportes;
