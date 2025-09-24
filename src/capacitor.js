import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';

// Función para inicializar Capacitor
export const initializeCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Configurar la barra de estado
      await StatusBar.setStyle({ style: 'dark' });
      await StatusBar.setBackgroundColor({ color: '#28b498' });

      // Ocultar la pantalla de splash después de un tiempo
      setTimeout(async () => {
        await SplashScreen.hide();
      }, 2000);

      // Configurar el botón de atrás en Android
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });

      // Escuchar cambios de estado de la app
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      // Escuchar cuando la app se reanuda
      App.addListener('resume', () => {
        console.log('App resumed');
      });

      // Escuchar cuando la app se pausa
      App.addListener('pause', () => {
        console.log('App paused');
      });

      console.log('Capacitor initialized successfully');
    } catch (error) {
      console.error('Error initializing Capacitor:', error);
    }
  }
};

// Función para obtener información del dispositivo
export const getDeviceInfo = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await Device.getInfo();
      return info;
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  }
  return null;
};

// Función para verificar el estado de la red
export const getNetworkStatus = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Network.getStatus();
      return status;
    } catch (error) {
      console.error('Error getting network status:', error);
      return null;
    }
  }
  return null;
};

// Función para escuchar cambios de conectividad
export const addNetworkListener = (callback) => {
  if (Capacitor.isNativePlatform()) {
    Network.addListener('networkStatusChange', callback);
  }
};

// Función para remover el listener de red
export const removeNetworkListener = () => {
  if (Capacitor.isNativePlatform()) {
    Network.removeAllListeners();
  }
};
