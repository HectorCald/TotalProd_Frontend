import React, { useEffect, useMemo, useState } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import Notification from '../../common/Notification';
import ItemView from '../../common/ItemView';
import VerCliente from '../clientes/VerCliente';
import clientService from '../../../services/clientService';

const formatDateTime = (value) => {
  if (!value) return '--';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
};

const stringifyValue = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }

  return String(value);
};

function VerHistorial({ isOpen, setIsOpen, registro }) {
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'success',
    text: ''
  });
  const [isDetallesOpen, setIsDetallesOpen] = useState(false);
  const [isAfectadoOpen, setIsAfectadoOpen] = useState(false);
  const [afectado, setAfectado] = useState(null);
  const [loadingAfectado, setLoadingAfectado] = useState(false);

  const showNotification = (type, text) => {
    setNotification({
      isVisible: true,
      type,
      text
    });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const detallesParseados = useMemo(() => {
    if (!registro || registro.detalles === null || registro.detalles === undefined) {
      return { campos: {}, comentario: '' };
    }

    if (typeof registro.detalles === 'object') {
      return {
        campos: registro.detalles.campos || {},
        comentario: registro.detalles.comentario || '',
        ...registro.detalles
      };
    }

    try {
      const parsed = JSON.parse(registro.detalles);
      return {
        campos: parsed.campos || {},
        comentario: parsed.comentario || '',
        ...parsed
      };
    } catch (error) {
      console.warn('VerHistorial: no se pudo parsear detalles como JSON', error);
      return { campos: {}, comentario: '', raw: registro.detalles, __parseError: true };
    }
  }, [registro]);

  useEffect(() => {
    if (detallesParseados.__parseError) {
      showNotification('error', 'No se pudo interpretar los detalles del historial');
    }
  }, [detallesParseados.__parseError]);

  const camposEntries = useMemo(() => {
    return Object.entries(detallesParseados.campos || {});
  }, [detallesParseados.campos]);

  const buildCampoValue = (info) => {
    if (!info || (info.antes === undefined && info.despues === undefined)) {
      return 'Sin datos';
    }

    const partes = [];

    if (info.antes !== undefined) {
      partes.push(`Antes: ${stringifyValue(info.antes)}`);
    }

    if (info.despues !== undefined) {
      partes.push(`Después: ${stringifyValue(info.despues)}`);
    }

    return partes.join('  |  ');
  };

  const otherDetalleKeys = useMemo(() => {
    if (!detallesParseados || typeof detallesParseados !== 'object') {
      return [];
    }

    return Object.entries(detallesParseados)
      .filter(([key]) => !['campos', 'comentario', '__parseError'].includes(key));
  }, [detallesParseados]);

  useEffect(() => {
    setIsDetallesOpen(false);
    setIsAfectadoOpen(false);
    setAfectado(null);
    setLoadingAfectado(false);
  }, [registro?.id]);

  const detallesString = useMemo(() => {
    try {
      if (registro?.detalles === null || registro?.detalles === undefined) {
        return 'Sin detalles';
      }
      if (typeof registro?.detalles === 'string') {
        return JSON.stringify(JSON.parse(registro.detalles), null, 2);
      }
      return JSON.stringify(registro.detalles, null, 2);
    } catch (error) {
      return typeof registro?.detalles === 'string'
        ? registro.detalles
        : 'No se pudo formatear los detalles.';
    }
  }, [registro]);

  const handleVerAfectado = async () => {
    if (!registro?.registro_id) {
      showNotification('error', 'No hay registro asociado para mostrar.');
      return;
    }

    try {
      setLoadingAfectado(true);
      setAfectado(null);
      setIsAfectadoOpen(false);
      const response = await clientService.getById(registro.registro_id);

      if (!response.success) {
        throw new Error(response.message || 'No se pudo obtener el registro afectado');
      }

      setAfectado(response.data);
      setIsAfectadoOpen(true);
    } catch (error) {
      console.error('Error al obtener registro afectado:', error);
      showNotification('error', error.message || 'Error al obtener el registro afectado');
    } finally {
      setLoadingAfectado(false);
    }
  };

  return (
    <View isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderView onBack={() => setIsOpen(false)} />
      <div className={styles.container}>
        <h1 className={styles.title}>Detalle del Historial</h1>
        {(() => {
          const responsableNombre = registro?.user?.name || registro?.personal?.name;
          const responsableLabel = registro?.user
            ? 'Usuario responsable'
            : registro?.personal
              ? 'Personal responsable'
              : null;

          if (!responsableNombre) return null;

          return (
            <>
              <p className={styles.subTitle}>RESPONSABLE</p>
              <ItemView
                title={responsableNombre}
                description={responsableLabel}
                transparent={false}
                icon={registro?.user ? 'user' : 'id-card'}
              />
            </>
          );
        })()}
        <p className={styles.subTitle}>INFORMACIÓN GENERAL</p>

        <div className={styles.content}>
          <Dato label="Módulo" value={registro?.modulo || '--'} />
          <Dato label="Acción" value={registro?.accion || '--'} />
          <Dato label="Lugar afectado" value={registro?.lugar_afectado || '--'} />
          <Dato label="Registro asociado" value={registro?.registro_id ? 'Disponible' : 'No disponible'} />
          <Dato label="Fecha" value={formatDateTime(registro?.fecha)} />
        </div>

        {detallesParseados.comentario && (
          <>
            <p className={styles.subTitle}>COMENTARIO</p>
            <div className={styles.content}>
              <Dato
                label="Comentario"
                value={detallesParseados.comentario}
              />
            </div>
          </>
        )}

        {otherDetalleKeys.length > 0 && (
          <>
            <p className={styles.subTitle}>DETALLE ADICIONAL</p>
            <div className={styles.content}>
              {otherDetalleKeys.map(([key, value]) => (
                <Dato
                  key={key}
                  label={key}
                  value={stringifyValue(value)}
                />
              ))}
            </div>
          </>
        )}

        <div className={styles.buttons}>
          <Boton
            className="btn-default"
            label="Ver detalles"
            onClick={() => setIsDetallesOpen(true)}
          />
          {/*
          <Boton
            className="btn-default"
            label="Ver afectado"
            onClick={handleVerAfectado}
            loading={loadingAfectado}
            disabled={!registro?.registro_id}
          />
        */}
        </div>

      </div>

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />

      <ViewModal isOpen={isDetallesOpen} setIsOpen={setIsDetallesOpen}>
        <HeaderModal
          title="Detalles del Historial"
          onClose={() => setIsDetallesOpen(false)}
        />
        <div className={styles.modalContent}>
          <p className={styles.subTitle}>CAMPOS AFECTADOS</p>
          {camposEntries.length > 0 ? (
            <div className={styles.content}>
              {camposEntries.map(([campo, info]) => (
                <Dato
                  key={campo}
                  label={campo}
                  value={buildCampoValue(info)}
                />
              ))}
            </div>
          ) : (
            <p className={styles.subTitle} style={{ fontWeight: 400 }}>
              No se registraron campos específicos para este historial.
            </p>
          )}
        </div>
      </ViewModal>

      <VerCliente
        isOpen={isAfectadoOpen && !!afectado}
        setIsOpen={setIsAfectadoOpen}
        usuario={afectado}
        onClientDeleted={() => {}}
        onClientUpdated={() => {}}
      />
    </View>
  );
}

export default VerHistorial;

