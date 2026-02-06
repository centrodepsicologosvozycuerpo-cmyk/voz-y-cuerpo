/**
 * Se ejecuta al arranque del proceso (antes de cargar cualquier chunk).
 * Limpia CLOUDINARY_URL/CLOUDINARY_ACCOUNT_URL vacías para que el SDK de Cloudinary
 * no haga new URL('') y lance Invalid URL.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  if (process.env.CLOUDINARY_URL === '') {
    delete process.env.CLOUDINARY_URL
    console.log('[instrumentation] CLOUDINARY_URL vacía eliminada (evitar Invalid URL en SDK)')
  }
  if (process.env.CLOUDINARY_ACCOUNT_URL === '') {
    delete process.env.CLOUDINARY_ACCOUNT_URL
    console.log('[instrumentation] CLOUDINARY_ACCOUNT_URL vacía eliminada')
  }
}
