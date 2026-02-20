/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportar como sitio estático
  output: 'export',
  
  // URLs sin barra final para evitar redirecciones (mejor para indexación en Google)
  trailingSlash: false,
  
  // Desactivar optimización de imágenes (no disponible en static)
  images: {
    unoptimized: true,
  },
  
  // Variables de entorno públicas disponibles en build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
  },
}

module.exports = nextConfig
