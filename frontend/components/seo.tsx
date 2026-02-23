/**
 * SEO reutilizable: canonical y robots.
 * En Next.js App Router se usa vía metadata, no un componente visual.
 *
 * Uso en cada page.tsx o layout.tsx:
 *   import { getSeoCanonical } from '@/components/seo'
 *   export const metadata = {
 *     title: '...',
 *     ...getSeoCanonical('/ruta'),
 *   }
 */
export {
  CANONICAL_BASE,
  pathToCanonicalPath,
  getCanonicalUrl,
  getSeoCanonical,
} from '@/lib/seo'
