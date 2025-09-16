import React, { useState } from 'react';
import ModuloExtra from '../common/ModuloExtra';
import { EXTRAS } from '../../constants/extras';
import Precios from '../views/precios/Precios';
import Sucursales from '../views/sucursales/Sucursales';
import Notification from '../common/Notification';

const Explorar = () => {
  const [isOpenPrecios, setIsOpenPrecios] = useState(false);
  const [isOpenSucursales, setIsOpenSucursales] = useState(false);
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

  const handleExplorarOpen = (viewName) => {
    if (viewName === 'precios') {
      setIsOpenPrecios(true);
    } else if (viewName === 'sucursales') {
      setIsOpenSucursales(true);
    } else {
      // Mostrar notificación para módulos no implementados
      mostrarNotificacion('info', `La función "${viewName}" estará disponible próximamente`);
    }
  };

  return (
    <>
      <p className="subTitle">Otras Funciones</p>
      <div className="funciones-extras">
        {EXTRAS.map((extra) => (
          <ModuloExtra
            key={extra.title}
            title={extra.title}
            image={extra.image}
            onClick={() => handleExplorarOpen(extra.view)}
          />
        ))}
      </div>

      {/* Modales de explorar */}
      <Precios isOpen={isOpenPrecios} setIsOpen={setIsOpenPrecios} />
      <Sucursales isOpen={isOpenSucursales} setIsOpen={setIsOpenSucursales} />
      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />
    </>
  );
};

export default Explorar;
