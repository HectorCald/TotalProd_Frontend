import React, { useState } from 'react';
import ModuloExtra from '../common/ModuloExtra';
import { EXTRAS } from '../../constants/extras';
import styles from './Screen.module.css';
import Precios from '../views/precios/Precios';
import Sucursales from '../views/sucursales/Sucursales';
import PanelGastos from '../views/gastos/PanelGastos';
import PanelDeudas from '../views/deudas/PanelDeudas';
import Balance from '../views/balance/Balance';
import Reportes from '../views/reportes/Reportes';
import Notification from '../common/Notification';
import { EXTRAS as EXTRAS_DAMABRAVA } from '../../constants/damabravaFunctions';
import FormularioProduccion from '../views/damabrava/produccion/FormularioProduccion';
import VerificarProduccion from '../views/damabrava/produccion/VerificarProduccion';
import MiProduccion from '../views/damabrava/produccion/MiProduccion';
import Reglas from '../views/damabrava/reglas/Reglas';
import ImportExport from '../views/exportar-importar/ImportExport';
import { isDamabrava } from '../../utils/empresaHelper';

const Explorar = () => {
  const [isOpenPrecios, setIsOpenPrecios] = useState(false);
  const [isOpenSucursales, setIsOpenSucursales] = useState(false);
  const [isOpenGastos, setIsOpenGastos] = useState(false);
  const [isOpenDeudas, setIsOpenDeudas] = useState(false);
  const [isOpenBalance, setIsOpenBalance] = useState(false);
  const [isOpenReportes, setIsOpenReportes] = useState(false);
  const [isOpenFormularioProduccion, setIsOpenFormularioProduccion] = useState(false);
  const [isOpenVerificarProduccion, setIsOpenVerificarProduccion] = useState(false);
  const [isOpenMiProduccion, setIsOpenMiProduccion] = useState(false);
  const [isOpenReglas, setIsOpenReglas] = useState(false);
  const [isOpenImportExport, setIsOpenImportExport] = useState(false);
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
    } else if (viewName === 'reportes') {
      setIsOpenReportes(true);
    } else if (viewName === 'formulario') {
      setIsOpenFormularioProduccion(true);
    } else if (viewName === 'verificacion') {
      setIsOpenVerificarProduccion(true);
    } else if (viewName === 'miProduccion') {
      setIsOpenMiProduccion(true);
    } else if (viewName === 'reglas') {
      setIsOpenReglas(true);
    } else if (viewName === 'importar-exportar') {
      setIsOpenImportExport(true);
    } else {
      // Mostrar notificación para módulos no implementados
      mostrarNotificacion('info', `La función "${viewName}" estará disponible próximamente`);
    }
  };

  return (
    <div style={{ paddingInline: '15px', width: '100%' }}>
      <p className={styles.subTitle} style={{ marginTop: '0' }}>OTRAS FUNCIONES</p>
      <div className={styles.funcionesExtras}>
        {EXTRAS.map((extra) => (
          <ModuloExtra
            key={extra.title}
            title={extra.title}
            image={extra.image}
            onClick={() => handleExplorarOpen(extra.view)}
          />
        ))}
      </div>
      {isDamabrava() && (
        <>
          <p className={styles.subTitle}>FUNCIONES DAMABRAVA</p>
          <div className={styles.funcionesExtras}>
            {EXTRAS_DAMABRAVA.map((extra) => (
              <ModuloExtra
                key={extra.title}
                title={extra.title}
                image={extra.image}
                onClick={() => handleExplorarOpen(extra.view)}
              />
            ))}
          </div>
        </>
      )}

      {/* Modales de explorar */}
      <Precios isOpen={isOpenPrecios} setIsOpen={setIsOpenPrecios} />
      <Sucursales isOpen={isOpenSucursales} setIsOpen={setIsOpenSucursales} />
      <PanelGastos isOpen={isOpenGastos} setIsOpen={setIsOpenGastos} />
      <PanelDeudas isOpen={isOpenDeudas} setIsOpen={setIsOpenDeudas} />
      <Balance isOpen={isOpenBalance} setIsOpen={setIsOpenBalance} />
      <Reportes isOpen={isOpenReportes} setIsOpen={setIsOpenReportes} />
      {isDamabrava() && (
        <>
          <FormularioProduccion isOpen={isOpenFormularioProduccion} setIsOpen={setIsOpenFormularioProduccion} />
          <VerificarProduccion isOpen={isOpenVerificarProduccion} setIsOpen={setIsOpenVerificarProduccion} />
          <MiProduccion isOpen={isOpenMiProduccion} setIsOpen={setIsOpenMiProduccion} />
          <Reglas isOpen={isOpenReglas} setIsOpen={setIsOpenReglas} />
        </>
      )}
      <ImportExport isOpen={isOpenImportExport} setIsOpen={setIsOpenImportExport} />
      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />
      {/* Conteos se maneja ahora desde Inicio.jsx */}
    </div>
  );
};

export default Explorar;
