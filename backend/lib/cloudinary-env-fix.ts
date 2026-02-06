/**
 * Debe ejecutarse antes de cargar el SDK de Cloudinary.
 * Si CLOUDINARY_URL o CLOUDINARY_ACCOUNT_URL están vacías, el SDK hace new URL('') y lanza Invalid URL.
 * Eliminamos las variables vacías para que el SDK use solo cloud_name/api_key/api_secret.
 */
const hadEmptyUrl = process.env.CLOUDINARY_URL === ''
const hadEmptyAccountUrl = process.env.CLOUDINARY_ACCOUNT_URL === ''
if (hadEmptyUrl) {
  delete process.env.CLOUDINARY_URL
  console.log('[cloudinary-env-fix] CLOUDINARY_URL estaba vacía, eliminada para evitar Invalid URL')
}
if (hadEmptyAccountUrl) {
  delete process.env.CLOUDINARY_ACCOUNT_URL
  console.log('[cloudinary-env-fix] CLOUDINARY_ACCOUNT_URL estaba vacía, eliminada')
}
// Log para debug: si existen, solo indicar longitud (no mostrar valores)
if (process.env.CLOUDINARY_URL != null) {
  console.log('[cloudinary-env-fix] CLOUDINARY_URL presente, longitud:', process.env.CLOUDINARY_URL.length)
}
