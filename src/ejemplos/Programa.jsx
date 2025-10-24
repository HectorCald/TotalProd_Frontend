import React, { useState, useEffect, useCallback } from 'react'
import { useLayout } from '../../context/LayoutContext'
import styles from '../styles/Screen.module.css'
import NoResult from '../common/NoResult'
import BotonMenuFlotante from '../botones/BotonMenuFlotante'
import AccionBox from '../ui/AccionBox'
import DetalleAccionBox from '../ui/DetalleAccionBox'
import InlineSpinner from '../common/InlineSpinner'
import AccionesService from '../../services/accionesService'
import Notification from '../common/Notification'
import PullToRefresh from '../common/PullToRefresh'
import NuevaAccion from '../ui/NuevaAccion'
import ProgramaTour from '../tours/ProgramaTour'

function Programa({ isVisible = false }) {
  const { isLargeScreen } = useLayout()
  const [acciones, setAcciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAccion, setSelectedAccion] = useState(null)
  const [isDetalleOpen, setIsDetalleOpen] = useState(false)
  const [notification, setNotification] = useState({ isVisible: false, type: 'success', text: '' })
  const [ejesData, setEjesData] = useState([])
  const [isNuevaAccionOpen, setIsNuevaAccionOpen] = useState(false)
  const [selectedEjeId, setSelectedEjeId] = useState(null)

  // Colores para los ejes según especificación
  const getEjeColor = (ejeNumero) => {
    const ejeColors = {
      1: '#F59E0B', // Naranja
      2: '#8B5CF6', // Púrpura
      3: '#06B6D4', // Celeste
      4: '#EC4899', // Rosa
      5: '#1E40AF', // Azul oscuro
      6: '#F97316', // Naranja oscuro
      7: '#84CC16', // Lima
      8: '#6366F1', // Índigo
    }

    return ejeColors[ejeNumero] || '#3B82F6' // Color por defecto
  }

  // Función para cargar datos de ejes desde localStorage
  const cargarEjesData = useCallback(() => {
    try {
      const ejesCompletados = localStorage.getItem('ejesRSE')
      const totalStr = localStorage.getItem('ejesRSE_total')
      const total = totalStr ? parseInt(totalStr, 10) : null
      
      if (ejesCompletados && Number.isFinite(total) && total > 0) {
        const ejes = []
        for (let i = 0; i < total; i++) {
          const ejeKey = `ejesRSE_eje_${i}`
          const ejeData = localStorage.getItem(ejeKey)
          if (ejeData) {
            try {
              const estructuraEje = JSON.parse(ejeData)
              
              // Calcular porcentaje del eje usando la misma lógica que Resultados.jsx
              const subejesConPorcentajes = estructuraEje.subejes
                .filter(subeje => {
                  const preguntasObligatorias = subeje.preguntas.filter(pregunta => !pregunta.opcional);
                  const tieneObligatorias = preguntasObligatorias.length > 0;
                  return tieneObligatorias;
                })
                .map(subeje => {
                  const preguntasTodas = Array.isArray(subeje.preguntas) ? subeje.preguntas : []
                  const totalPorcentaje = preguntasTodas.reduce((sum, pregunta) => {
                    const valor = parseFloat(pregunta.porcentaje)
                    const valorFinal = Number.isFinite(valor) ? valor : 0
                    return sum + valorFinal
                  }, 0)
                  const porcentajeSubeje = Math.min(totalPorcentaje, 100)
                  return {
                    titulo: subeje.titulo,
                    numero: subeje.numero,
                    porcentaje: parseFloat(porcentajeSubeje.toFixed(2)),
                    preguntas: preguntasTodas
                  }
                })

              const sumaTotal = subejesConPorcentajes.reduce((sum, subeje) => sum + subeje.porcentaje, 0);
              const promedioEje = subejesConPorcentajes.length > 0 ? sumaTotal / subejesConPorcentajes.length : 0;
              
              ejes.push({
                id: estructuraEje.id,
                eje: estructuraEje.eje || `Eje ${i + 1}`,
                numero: estructuraEje.numero || i + 1,
                promedio: Math.round(promedioEje)
              })
            } catch (error) {
              console.error('Error parsing eje data:', error)
            }
          }
        }
        setEjesData(ejes)
      } else {
        setEjesData([])
      }
    } catch (error) {
      console.error('Error loading ejes data:', error)
      setEjesData([])
    }
  }, [])

  const cargarAcciones = useCallback(async () => {
    setLoading(true)
    try {
      const result = await AccionesService.getAllAcciones()
      if (result.success) {
        const accionesData = result.data
        setAcciones(accionesData)
        // Eliminado: actualización de acciones_pendientes en el contexto de usuario
      } else {
        console.error('❌ Programa: Error al cargar acciones:', result.error)
        setAcciones([])
      }
    } catch (error) {
      console.error('❌ Programa: Error al cargar acciones:', error)
      setAcciones([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = async () => {
    await cargarAcciones()
  }

  useEffect(() => {
    if (isVisible) {
      cargarEjesData()
      if (acciones.length === 0) {
        cargarAcciones()
      }
    }
  }, [isVisible, cargarAcciones, cargarEjesData, acciones.length])




  // Escuchar evento global de creación de acción para notificar
  useEffect(() => {
    const handleAccionCreada = (evt) => {
      const text = evt?.detail?.text || 'Acción creada exitosamente'
      setNotification({ isVisible: true, type: 'success', text })
      // auto ocultar
      setTimeout(() => setNotification(prev => ({ ...prev, isVisible: false })), 3000)
      // recargar acciones por si hay nuevas
      cargarAcciones()
    }
    window.addEventListener('accionCreada', handleAccionCreada)
    return () => window.removeEventListener('accionCreada', handleAccionCreada)
  }, [cargarAcciones])

  // Escuchar evento de refresh desde el sidebar
  useEffect(() => {
    const handleRefreshScreen = (evt) => {
      if (evt?.detail?.screenName === 'programa' && isVisible) {
        cargarAcciones()
        cargarEjesData()
      }
    }
    window.addEventListener('refreshScreen', handleRefreshScreen)
    return () => window.removeEventListener('refreshScreen', handleRefreshScreen)
  }, [cargarAcciones, cargarEjesData, isVisible])

  // Función para manejar la selección de eje del menú flotante
  const handleEjeSeleccionado = useCallback((ejeId) => {
    setSelectedEjeId(ejeId)
    // Diferir apertura para evitar que el click actual cierre el modal inmediatamente
    setTimeout(() => {
      setIsNuevaAccionOpen(true)
    }, 0)
  }, [])

  // Función para manejar cuando se crea una nueva acción
  const handleAccionCreada = useCallback(async (nuevaAccion) => {
    // Cerrar el modal
    setIsNuevaAccionOpen(false)
    setSelectedEjeId(null)
    // Mostrar notificación
    setNotification({ isVisible: true, type: 'success', text: 'Acción creada exitosamente' })
    setTimeout(() => setNotification(prev => ({ ...prev, isVisible: false })), 3000)
    // Refrescar las acciones desde el backend
    await cargarAcciones()
  }, [cargarAcciones])

  const handleAccionClick = useCallback((accion) => {
    setSelectedAccion(accion)
    setIsDetalleOpen(true)
  }, [])

  const handleAccionUpdated = useCallback((updatedAccion) => {
    if (updatedAccion.deleted) {
      // Si se eliminó la acción, removerla de la lista
      setAcciones(prevAcciones =>
        prevAcciones.filter(accion => accion.id !== updatedAccion.id)
      )
      setSelectedAccion(null) // Limpiar la acción seleccionada
      setIsDetalleOpen(false) // Cerrar el modal de detalle
    } else {
      // Si se actualizó la acción, actualizarla en la lista
      setAcciones(prevAcciones =>
        prevAcciones.map(accion =>
          accion.id === updatedAccion.id ? updatedAccion : accion
        )
      )
      setSelectedAccion(updatedAccion) // Actualizar la acción seleccionada en el detalle
    }
    // Eliminado: recálculo y actualización de acciones_pendientes en contexto de usuario
  }, [])

  // Función para acortar el nombre del eje
  const acortarNombre = (nombre, maxLength = 35) => {
    if (nombre.length <= maxLength) return nombre
    return nombre.substring(0, maxLength) + '...'
  }

  // Función para obtener el color según el porcentaje
  const getProgressColor = (porcentaje) => {
    if (porcentaje <= 20) {
      return '#E7180B' // Rojo
    } else if (porcentaje <= 40) {
      return '#FF692A' // Naranja
    } else if (porcentaje <= 60) {
      return '#FE9A37' // Amarillo
    } else if (porcentaje <= 80) {
      return '#7CCF35' // Verde
    } else {
      return '#7CCF35' // Verde
    }
  }


  // Función para iniciar el tour usando el componente separado
  const startTour = useCallback(() => {
    ProgramaTour.start()
  }, [])

  // Iniciar el tour automáticamente si es la primera vez y la pantalla está visible
  useEffect(() => {
    if (!ProgramaTour.isCompleted() && isVisible) {
      // Solo iniciar el tour si la pantalla Programa está visible y es la primera vez
      setTimeout(() => {
        startTour()
      }, 1000)
    }
  }, [startTour, isVisible])

  // Crear opciones del menú flotante basadas en los ejes disponibles
  const menuOptions = ejesData.map(eje => ({
    label: `${acortarNombre(eje.eje)} (${eje.promedio}%)`,
    icon: 'plus',
    onClick: () => handleEjeSeleccionado(eje.id),
    style: {
      color: getProgressColor(eje.promedio)
    }
  }))

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 'calc(100vh - 250px)' }}>
        <InlineSpinner size={42} thickness={4} />
      </div>
    )
  }

  if (acciones.length === 0) {
    const noActionsContent = (
      <div style={{ display: 'flex', flexDirection: 'column', height: '75vh' }}>
        <NoResult
          title={'No hay acciones'}
          iconName={'calendar'}
          message={'No tienes acciones creadas aún.\nCrea tu primera acción basada en los resultados de tu evaluación.'}
          showButton={false}
        />
      </div>
    )

    return (
      <>
        {isLargeScreen ? noActionsContent : (
          <PullToRefresh onRefresh={handleRefresh} screenName="Programa">
            {noActionsContent}
          </PullToRefresh>
        )}
        
        {/* Botón flotante fuera del contenedor de scroll */}
        <BotonMenuFlotante
          icon="plus"
          options={menuOptions}
          className="btnOriginal"
        />

        {/* Modal de nueva acción */}
        <NuevaAccion
          isOpen={isNuevaAccionOpen}
          setIsOpen={setIsNuevaAccionOpen}
          ejeId={selectedEjeId}
          onAccionCreada={handleAccionCreada}
        />
      </>
    )
  }

  const actionsContent = (
    <>
      <h1 id="programa-title" className={styles.screenTitle} style={{ marginBottom: '10px' }}>Programa</h1>
      <p className={styles.text} style={{ textAlign: 'center', marginBottom: '10px' }}>Aquí puedes ver el progreso de todas tus acciones planificadas.</p>

      <div className={styles.content}>
      {acciones.map((accion) => {
        const ejeColor = getEjeColor(accion.eje_numero)

        return (
          <AccionBox
            key={accion.id}
            accion={accion}
            color={ejeColor}
            onClick={() => handleAccionClick(accion)}
          />
          )
        })}
      </div>
    </>
  )

  return (
    <>
      {isLargeScreen ? actionsContent : (
        <PullToRefresh onRefresh={handleRefresh} screenName="Programa">
          {actionsContent}
        </PullToRefresh>
      )}
      
      {/* Botón flotante fuera del contenedor de scroll */}
      <BotonMenuFlotante
        icon="plus"
        options={menuOptions}
        className="btnOriginal"
      />
      
      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />
      {/* Modal de detalle de acción */}
      <DetalleAccionBox
        isOpen={isDetalleOpen}
        setIsOpen={setIsDetalleOpen}
        accion={selectedAccion}
        onAccionUpdated={handleAccionUpdated}
      />
      
      {/* Modal de nueva acción */}
      <NuevaAccion
        isOpen={isNuevaAccionOpen}
        setIsOpen={setIsNuevaAccionOpen}
        ejeId={selectedEjeId}
        onAccionCreada={handleAccionCreada}
      />
    </>
  )
}

export default Programa