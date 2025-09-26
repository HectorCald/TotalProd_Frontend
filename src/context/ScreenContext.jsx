import React, { createContext, useContext, useState, useCallback } from 'react';

const ScreenContext = createContext();

export const ScreenProvider = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState('inicio');
  const [activeRoute, setActiveRoute] = useState('/dashboard/default');

  const setActiveScreenState = useCallback((screen) => {
    setActiveScreen(screen);
  }, []);

  const setActiveRouteState = useCallback((route) => {
    setActiveRoute(route);
  }, []);

  const clearScreenState = useCallback(() => {
    setActiveScreen('inicio');
    setActiveRoute('/dashboard/default');
  }, []);

  return (
    <ScreenContext.Provider value={{ 
      activeScreen, 
      activeRoute,
      setActiveScreenState, 
      setActiveRouteState,
      clearScreenState 
    }}>
      {children}
    </ScreenContext.Provider>
  );
};

export const useScreen = () => {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error('useScreen must be used within a ScreenProvider');
  }
  return context;
};
