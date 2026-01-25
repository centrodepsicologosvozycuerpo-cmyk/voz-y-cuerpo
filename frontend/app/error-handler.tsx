'use client'

import { useEffect } from 'react'

export function ErrorHandler() {
  useEffect(() => {
    // Silenciar errores de extensiones del navegador que no afectan la aplicación
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const error = event.reason
      // Ignorar errores de extensiones del navegador
      if (
        error?.message?.includes('cookieManager') ||
        error?.message?.includes('RegisterClientLocalizations') ||
        error?.message?.includes('Receiving end does not exist') ||
        error?.message?.includes('message port closed') ||
        error?.name === 'MessageNotSentError' ||
        error?.name === 'RegisterClientLocalizationsError' ||
        (error?.messageName && (
          error.messageName.includes('cookieManager') ||
          error.messageName.includes('RegisterClientLocalizations')
        ))
      ) {
        event.preventDefault() // Prevenir que aparezca en la consola
        return
      }
    }

    const errorHandler = (error: ErrorEvent) => {
      // Ignorar errores de extensiones del navegador
      if (
        error.message?.includes('cookieManager') ||
        error.message?.includes('RegisterClientLocalizations') ||
        error.message?.includes('Receiving end does not exist') ||
        error.message?.includes('message port closed')
      ) {
        error.preventDefault() // Prevenir que aparezca en la consola
        return
      }
    }

    window.addEventListener('error', errorHandler, true)
    window.addEventListener('unhandledrejection', unhandledRejectionHandler)

    return () => {
      window.removeEventListener('error', errorHandler, true)
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
    }
  }, [])

  return null
}

