import React, { useState } from 'react';
import ModuloExtra from '../common/ModuloExtra';
import { EXTRAS } from '../../constants/extras';
import Precios from '../views/precios/Precios';
import Sucursales from '../views/sucursales/Sucursales';
import PanelGastos from '../views/gastos/PanelGastos';
import PanelDeudas from '../views/deudas/PanelDeudas';
import Balance from '../views/balance/Balance';
import Destacados from '../views/destacados/Destacados';
import Reportes from '../views/reportes/Reportes';
import Notification from '../common/Notification';

const Explorar = () => {
  const [isOpenPrecios, setIsOpenPrecios] = useState(false);
  const [isOpenSucursales, setIsOpenSucursales] = useState(false);
  const [isOpenGastos, setIsOpenGastos] = useState(false);
  const [isOpenDeudas, setIsOpenDeudas] = useState(false);
  const [isOpenBalance, setIsOpenBalance] = useState(false);
  const [isOpenDestacados, setIsOpenDestacados] = useState(false);
  const [isOpenReportes, setIsOpenReportes] = useState(false);
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
    } else if (viewName === 'gastos') {
      setIsOpenGastos(true);
    } else if (viewName === 'deudas') {
      setIsOpenDeudas(true);
    } else if (viewName === 'balance') {
      setIsOpenBalance(true);
    } else if (viewName === 'destacados') {
      setIsOpenDestacados(true);
    } else if (viewName === 'reportes') {
      setIsOpenReportes(true);
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
      <PanelGastos isOpen={isOpenGastos} setIsOpen={setIsOpenGastos} />
      <PanelDeudas isOpen={isOpenDeudas} setIsOpen={setIsOpenDeudas} />
      <Balance isOpen={isOpenBalance} setIsOpen={setIsOpenBalance} />
      <Destacados isOpen={isOpenDestacados} setIsOpen={setIsOpenDestacados} />
      <Reportes isOpen={isOpenReportes} setIsOpen={setIsOpenReportes} />
      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />
    </>
  );
};

export default Explorar;
