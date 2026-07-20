import React, { createContext, useContext, useState, useEffect } from 'react';

const ModalStackContext = createContext();

// Hook para usar el contexto
export const useModalStack = () => {
  const context = useContext(ModalStackContext);
  if (!context) {
    throw new Error('useModalStack debe ser usado dentro de ModalStackProvider');
  }
  return context;
};

// Provider del contexto
export const ModalStackProvider = ({ children }) => {
  const [modalStack, setModalStack] = useState([]);
  const [modalCounter, setModalCounter] = useState(0);

  // Función para registrar un modal cuando se abre
  const registerModal = (modalId, onClose) => {
    const newModal = {
      id: modalId,
      counter: modalCounter + 1,
      onClose,
      timestamp: Date.now()
    };
    
    setModalStack(prev => [...prev, newModal]);
    setModalCounter(prev => prev + 1);
    
    // Agregar entrada al history
    window.history.pushState({ modalId, action: 'open' }, '', window.location.href);
    
    return newModal.counter;
  };

  // Función para desregistrar un modal cuando se cierra
  const unregisterModal = (modalId) => {
    setModalStack(prev => prev.filter(modal => modal.id !== modalId));
  };

  // Función para cerrar el último modal
  const closeLastModal = () => {
    if (modalStack.length > 0) {
      const lastModal = modalStack[modalStack.length - 1];
      if (lastModal.onClose) {
        lastModal.onClose();
      }
      unregisterModal(lastModal.id);
    }
  };

  // Función para obtener el número de modales abiertos
  const getOpenModalsCount = () => modalStack.length;

  // Función para verificar si es el último modal
  const isLastModal = (modalId) => {
    if (modalStack.length === 0) return false;
    const lastModal = modalStack[modalStack.length - 1];
    return lastModal.id === modalId;
  };

  // Manejar el evento popstate (botón atrás del navegador)
  useEffect(() => {
    const handlePopState = (event) => {
      closeLastModal();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [modalStack]);

  // Función para limpiar todo el stack de modales
  const clearStack = () => {
    setModalStack([]);
    setModalCounter(0);
  };

  const value = {
    registerModal,
    unregisterModal,
    closeLastModal,
    getOpenModalsCount,
    isLastModal,
    modalStack,
    clearStack
  };

  return (
    <ModalStackContext.Provider value={value}>
      {children}
    </ModalStackContext.Provider>
  );
};

export default ModalStackContext;
