import type { Metadata } from "next"

/** Dominio canónico: www + https + slash final en rutas */
export const CANONICAL_BASE = "https://www.centrodepsicologos.com.ar"

/**
 * Normaliza una ruta para canonical:
 * - Siempre empieza con /
 * - Siempre termina con / (excepto home que es "/")
 * - Sin querystring ni hash
 */
export function pathToCanonicalPath(path: string): string {
  const withoutQuery = path.replace(/\?.*$/, "").replace(/#.*$/, "").trim()
  const normalized = "/" + (withoutQuery || "").replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/")
  if (normalized === "/" || normalized === "") return "/"
  return normalized + "/"
}

/** URL canónica completa para una ruta */
export function getCanonicalUrl(path: string): string {
  const p = pathToCanonicalPath(path)
  return p === "/" ? CANONICAL_BASE + "/" : CANONICAL_BASE + p
}

/**
 * Fragmento de metadata de Next.js con canonical.
 * Uso: ...getSeoCanonical('/contacto') en metadata de cada página.
 */
export function getSeoCanonical(path: string): Metadata {
  return {
    alternates: {
      canonical: getCanonicalUrl(path),
    },
    robots: { index: true, follow: true },
  }
}
