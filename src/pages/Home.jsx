import React, { useState } from 'react';
import '../styles/Home.css';
import Nav from '../components/ui/Nav';
import Coleccion from '../components/common/Coleccion';
import { FUNCTIONS } from '../constants/functions';
import Personal from '../components/views/personal/Personal';
import Clientes from '../components/views/clientes/Clientes';
import Proveedores from '../components/views/proveedores/Proveedores';
import Pagos from '../components/views/pagos/Pagos';
import Reportes from '../components/views/reportes/Reportes';
import BarraNavegacion from '../components/ui/BarraNavegacion';
import AtajoAnuncio from '../components/common/AtajoAnuncio';
import almacenImage from '../assets/almacen.png';
import acopioImage from '../assets/acopio.png';
import movimientosImage from '../assets/movimientos.png';
import pedidosImage from '../assets/pedidos.png';

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
      <BarraNavegacion />
      <p className="subTitle">Funciones</p>
      <div className="funciones">
        {FUNCTIONS.slice(0, 4).map((func) => (
          <Coleccion
            key={func.name}
            title={func.name}
            icon={func.icon}
            onClick={() => handleViewOpen(func.view)}
          />
        ))}
      </div>
      <p className="subTitle">Atajos</p>
      <div className="atajoAnuncio">
        <AtajoAnuncio title="Almacen" description="Administra tu almacén de productos terminados, realiza entradas y salidas de productos" image={almacenImage} onClick={() => handleViewOpen('atajoAnuncio')} />
        <AtajoAnuncio title="Acopio" description="Administra tu acopio de productos, realiza entradas y salidas de materias primas" image={acopioImage} onClick={() => handleViewOpen('atajoAnuncio')} />
      </div>
      <p className="subTitle">Otros</p>
      <div className="atajoAnuncioOtros">
        <AtajoAnuncio title="Movimientos" description="" image={movimientosImage} onClick={() => handleViewOpen('atajoAnuncio')} />
        <AtajoAnuncio title="Pedidos" description="" image={pedidosImage} onClick={() => handleViewOpen('atajoAnuncio')} />
      </div>

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
