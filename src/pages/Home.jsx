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

      {/* Vistas modales - Solo cargar cuando están abiertas */}

      {activeView === 'personal' && (
        <Personal
          isOpen={true}
          setIsOpen={() => handleViewClose()}
        />
      )}

      {activeView === 'clientes' && (
        <Clientes
          isOpen={true}
          setIsOpen={() => handleViewClose()}
        />
      )}

      {activeView === 'proveedores' && (
        <Proveedores
          isOpen={true}
          setIsOpen={() => handleViewClose()}
        />
      )}

      {activeView === 'pagos' && (
        <Pagos
          isOpen={true}
          setIsOpen={() => handleViewClose()}
        />
      )}

      {activeView === 'almacenMedio' && (
        <AlmacenMedio
          isOpen={true}
          setIsOpen={() => handleViewClose()}
        />
      )}

      {activeView === 'almacenMedioGeneral' && (
        <AlmacenMedioGeneral
          isOpen={true}
          setIsOpen={() => handleViewClose()}
        />
      )}

      {activeView === 'movimientos' && (
        <MovimientosMedio
          isOpen={true}
          setIsOpen={() => handleViewClose()}
        />
      )}

      {activeView === 'pedidos' && (
        <PedidosMedio
          isOpen={true}
          setIsOpen={() => handleViewClose()}
        />
      )}
    </div>
  );
};

export default Home;