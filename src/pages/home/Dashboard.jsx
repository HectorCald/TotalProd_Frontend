import React from 'react';
import { useLayout } from '../../context/LayoutContext';
import SideBar from '../../components/essentials/SideBar';
import NavBar from '../../components/essentials/NavBar';
import styles from './View.module.css';

const Dashboard = () => {
  const { isLargeScreen } = useLayout();

  return (
    <>
      {isLargeScreen && <NavBar />}
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
