import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/layout.css'
import { registerSW } from 'virtual:pwa-register'

// Registrar Service Worker con actualización automática
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('Nueva versión disponible. ¿Actualizar ahora?')) {
        updateSW(true)
      }
    },
    onOfflineReady() {
      console.log('App lista para usar offline')
      // Mostrar notificación de que está disponible offline
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('TCO Calculator', {
          body: 'App disponible para usar sin conexión',
          icon: '/icons/icon-192.png'
        })
      }
    },
    onRegistered(r) {
      console.log('SW registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    }
  })
}

// Solicitar permisos de notificación
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
