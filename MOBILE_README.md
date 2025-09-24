# TotalProd - Aplicación Móvil

Esta aplicación React ha sido convertida en una aplicación móvil nativa usando Capacitor.

## Configuración del Entorno

### Android

1. **Instalar Android Studio**
   - Descargar desde: https://developer.android.com/studio
   - Instalar Android SDK y herramientas de desarrollo

2. **Configurar variables de entorno**
   ```bash
   # Agregar al PATH de Windows
   ANDROID_HOME=C:\Users\[Usuario]\AppData\Local\Android\Sdk
   ANDROID_SDK_ROOT=C:\Users\[Usuario]\AppData\Local\Android\Sdk
   ```

3. **Aceptar licencias de Android SDK**
   ```bash
   %ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager --licenses
   ```

### iOS (Solo en macOS)

1. **Instalar Xcode**
   - Descargar desde App Store
   - Instalar CocoaPods: `sudo gem install cocoapods`

## Comandos Disponibles

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm start

# Construir y sincronizar con Capacitor
npm run cap:build

# Sincronizar cambios
npm run cap:sync
```

### Plataformas Móviles
```bash
# Abrir proyecto Android en Android Studio
npm run cap:android

# Abrir proyecto iOS en Xcode (solo macOS)
npm run cap:ios
```

## Estructura del Proyecto

```
frontend/
├── android/                 # Proyecto Android nativo
├── ios/                     # Proyecto iOS nativo
├── src/
│   ├── capacitor.js         # Configuración de Capacitor
│   └── ...
├── capacitor.config.js      # Configuración principal
└── build/                   # Build de la aplicación web
```

## Plugins Instalados

- **@capacitor/app**: Gestión del ciclo de vida de la app
- **@capacitor/device**: Información del dispositivo
- **@capacitor/keyboard**: Gestión del teclado
- **@capacitor/network**: Estado de la red
- **@capacitor/splash-screen**: Pantalla de carga
- **@capacitor/status-bar**: Barra de estado

## Desarrollo y Testing

### Android
1. Ejecutar `npm run cap:android`
2. En Android Studio, seleccionar un dispositivo o emulador
3. Hacer clic en "Run" (▶️)

### iOS (Solo macOS)
1. Ejecutar `npm run cap:ios`
2. En Xcode, seleccionar un simulador
3. Hacer clic en "Run" (▶️)

## Permisos Configurados

La aplicación incluye los siguientes permisos:

- **INTERNET**: Acceso a internet
- **ACCESS_NETWORK_STATE**: Estado de la red
- **CAMERA**: Acceso a la cámara
- **READ_EXTERNAL_STORAGE**: Lectura de archivos
- **WRITE_EXTERNAL_STORAGE**: Escritura de archivos
- **ACCESS_FINE_LOCATION**: Ubicación precisa
- **ACCESS_COARSE_LOCATION**: Ubicación aproximada
- **VIBRATE**: Vibración del dispositivo
- **WAKE_LOCK**: Mantener pantalla activa

## Flujo de Trabajo

1. **Desarrollo**: Modificar código en `src/`
2. **Build**: Ejecutar `npm run cap:build`
3. **Sync**: Los cambios se sincronizan automáticamente
4. **Test**: Abrir en Android Studio/Xcode y probar

## Notas Importantes

- Siempre ejecutar `npm run cap:build` después de cambios importantes
- Los plugins nativos requieren sincronización con `cap sync`
- Para cambios en `capacitor.config.js`, reiniciar la aplicación
- La aplicación mantiene todas las funcionalidades de la PWA original

## Troubleshooting

### Error de licencias Android
```bash
%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager --licenses
```

### Error de CocoaPods (iOS)
```bash
cd ios/App
pod install
```

### Limpiar cache
```bash
npm run cap:sync
```
