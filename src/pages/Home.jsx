import React, { useState } from 'react';
import '../styles/Home.css';
import Nav from '../components/ui/Nav';
import Coleccion from '../components/common/Coleccion';
import MenuBoton from '../components/ui/MenuBoton';
import { FUNCTIONS } from '../constants/functions';
import Personal from '../components/views/personal/Personal';
import Clientes from '../components/views/clientes/Clientes';
import Proveedores from '../components/views/proveedores/Proveedores';
import Pagos from '../components/views/pagos/Pagos';
import Reportes from '../components/views/reportes/Reportes';

const Home = () => {
  const [activeView, setActiveView] = useState(null);

  const handleViewOpen = (viewName) => {
    setActiveView(viewName);
  };

  const handleViewClose = () => {
    setActiveView(null);
  };

  return (
    <div className="home-page">
      <Nav />
      <div className="funciones">
        {FUNCTIONS.slice(0, 5).map((func) => (
          <Coleccion
            key={func.name}
            title={func.name}
            icon={func.icon}
            onClick={() => handleViewOpen(func.view)}
          />
        ))}
      </div>
      <MenuBoton onViewChange={handleViewOpen} />
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
      <Reportes
        isOpen={activeView === 'reportes'}
        setIsOpen={() => handleViewClose()}
      />
    </div>
  );
};

export default Home;
