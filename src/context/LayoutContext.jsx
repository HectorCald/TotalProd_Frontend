    import React, { createContext, useContext, useState, useEffect } from 'react';

const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout debe ser usado dentro de un LayoutProvider');
  }
  return context;
};

export const LayoutProvider = ({ children }) => {
  // Estado para detectar si es pantalla grande
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  // Estado para la barra lateral
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Detectar el tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    // Verificar tamaño inicial
    checkScreenSize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Función para toggle de la barra lateral
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Función para establecer el estado de la barra lateral
  const setSidebarState = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const value = {
    isLargeScreen,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarState
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
