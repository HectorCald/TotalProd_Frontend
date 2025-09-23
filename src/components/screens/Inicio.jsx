import React, { useState } from 'react';
import Coleccion from '../common/Coleccion';
import { FUNCTIONS } from '../../constants/functions';
import AtajoAnuncio from '../common/AtajoAnuncio';
import Notification from '../common/Notification';
import almacenImage from '../../assets/almacen.png';
import acopioImage from '../../assets/acopio.png';
import movimientosImage from '../../assets/movimientos.png';
import pedidosImage from '../../assets/pedidos.png';

const Inicio = ({ onViewOpen }) => {
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'info',
    text: ''
  });

  const mostrarNotificacion = (tipo, texto) => {
    setNotification({
      isVisible: true,
      type: tipo,
      text: texto
    });

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const handleFunctionClick = (func) => {
    if (func.view === 'transferencias') {
      mostrarNotificacion('info', 'Transferencias estará disponible próximamente');
    } else {
      onViewOpen(func.view);
    }
  };

  return (
    <>
      <p className="subTitle">Funciones</p>
      <div className="funciones">
        {FUNCTIONS.slice(0, 4).map((func) => (
          <Coleccion
            key={func.name}
            title={func.name}
            icon={func.icon}
            onClick={() => handleFunctionClick(func)}
          />
        ))}
      </div>
      <p className="subTitle">Atajos</p>
      <div className="atajoAnuncio">
        <AtajoAnuncio 
          title="Almacén General" 
          description="Administra tu almacén de productos terminados, realiza entradas y salidas." 
          image={almacenImage} 
          onClick={() => onViewOpen('almacenMedioGeneral')} 
        />
        <AtajoAnuncio 
          title="Materia Prima" 
          description="Administra tu materia prima, realiza entradas y salidas." 
          image={acopioImage} 
          onClick={() => onViewOpen('almacenMedio')} 
        />
      </div>
      <p className="subTitle">Otros</p>
      <div className="atajoAnuncioOtros">
        <AtajoAnuncio 
          title="Movimientos" 
          description="" 
          image={movimientosImage} 
          onClick={() => onViewOpen('movimientos')} 
        />
        <AtajoAnuncio 
          title="Pedidos" 
          description="" 
          image={pedidosImage} 
          onClick={() => onViewOpen('pedidos')} 
        />
      </div>

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />
    </>
  );
};

export default Inicio;