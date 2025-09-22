import React, { useState } from 'react';
import '../styles/Home.css';
import Nav from '../components/ui/Nav';
import BarraNavegacion from '../components/ui/BarraNavegacion';

import AlmacenMedio from '../components/views/almacen-acopio/AlmacenMedio';
import AlmacenMedioGeneral from '../components/views/almacen-general/AlmacenMedioGeneral';
import MovimientosMedio from '../components/views/movimientos/MovimientosMedio';
import PedidosMedio from '../components/views/pedidos/PedidosMedio';
import Personal from '../components/views/personal/Personal';
import Clientes from '../components/views/clientes/Clientes';
import Proveedores from '../components/views/proveedores/Proveedores';
import Pagos from '../components/views/pagos/Pagos';

const Home = () => {
  const [activeView, setActiveView] = useState(null);
  const [activeScreen, setActiveScreen] = useState('inicio');

  const handleViewOpen = (viewName) => {
    setActiveView(viewName);
  };

  const handleViewClose = () => {
    setActiveView(null);
  };

  const handleScreenChange = (screenId) => {
    setActiveScreen(screenId);
  };


  return (
    <div className="home-page">
      <Nav />
      <BarraNavegacion 
        activeScreen={activeScreen} 
        onScreenChange={handleScreenChange}
        onViewOpen={handleViewOpen}
        isEmployee={false}
      />

      {/* Vistas modales */}

      <Personal
        isOpen={activeView === 'personal'}
        setIsOpen={() => handleViewClose()}
      />

      <Clientes
        isOpen={activeView === 'clientes'}
        setIsOpen={() => handleViewClose()}
      />
      <Proveedores
        isOpen={activeView === 'proveedores'}
        setIsOpen={() => handleViewClose()}
      />
      <Pagos
        isOpen={activeView === 'pagos'}
        setIsOpen={() => handleViewClose()}
      />
      <AlmacenMedio
        isOpen={activeView === 'almacenMedio'}
        setIsOpen={() => handleViewClose()}
      />
      <AlmacenMedioGeneral
        isOpen={activeView === 'almacenMedioGeneral'}
        setIsOpen={() => handleViewClose()}
      />
      <MovimientosMedio
        isOpen={activeView === 'movimientos'}
        setIsOpen={() => handleViewClose()}
      />
      <PedidosMedio
        isOpen={activeView === 'pedidos'}
        setIsOpen={() => handleViewClose()}
      />
    </div>
  );
};

export default Home;