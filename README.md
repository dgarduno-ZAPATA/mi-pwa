# mi-pwa
Calculadora de TCO — Zapata Camiones (PWA)

## Instalación y uso

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el entorno de desarrollo con recarga en caliente:
   ```bash
   npm run dev
   ```
3. Generar la versión optimizada para producción:
   ```bash
   npm run build
   ```

## Características PWA

- Integración con `vite-plugin-pwa` y registro de service worker con `autoUpdate`.
- Caché de recursos estáticos y de peticiones a la API mediante Workbox.
- Manifiesto con nombre, colores y conjunto de iconos que permite instalar la aplicación en dispositivos.

## Generación de iconos

La aplicación utiliza varios iconos declarados en el manifiesto para distintos dispositivos y tamaños. Para generarlos a partir de una imagen base se puede ejecutar:

```bash
npm run generate-icons
```

El comando genera los archivos en la carpeta `public/icons` para que sean incluidos durante la compilación.
