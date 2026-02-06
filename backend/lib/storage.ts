/**
 * Servicio de almacenamiento de archivos
 * Soporta: Backblaze B2 (producción) y filesystem local (desarrollo)
 * 
 * B2 es compatible con S3, por lo que usamos el AWS SDK
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { writeFile, unlink, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

// Configuración desde variables de entorno
const B2_ENDPOINT_RAW = process.env.B2_ENDPOINT || ''
// El SDK de AWS/Smithy exige URL completa; si solo viene el host (ej: s3.us-east-005.backblazeb2.com), añadimos https://
const B2_ENDPOINT_NORMALIZED =
  B2_ENDPOINT_RAW.startsWith('http://') || B2_ENDPOINT_RAW.startsWith('https://')
    ? B2_ENDPOINT_RAW
    : B2_ENDPOINT_RAW ? `https://${B2_ENDPOINT_RAW}` : ''

const B2_ENABLED = !!(
  process.env.B2_KEY_ID &&
  process.env.B2_APPLICATION_KEY &&
  process.env.B2_BUCKET_NAME &&
  B2_ENDPOINT_NORMALIZED
)

const B2_CONFIG = {
  keyId: process.env.B2_KEY_ID || '',
  applicationKey: process.env.B2_APPLICATION_KEY || '',
  bucketName: process.env.B2_BUCKET_NAME || '',
  endpoint: B2_ENDPOINT_NORMALIZED,
  region: process.env.B2_REGION || 'us-west-004',
}

// Cliente S3 para B2 (solo se crea si está habilitado)
let s3Client: S3Client | null = null

if (B2_ENABLED) {
  s3Client = new S3Client({
    endpoint: B2_CONFIG.endpoint,
    region: B2_CONFIG.region,
    credentials: {
      accessKeyId: B2_CONFIG.keyId,
      secretAccessKey: B2_CONFIG.applicationKey,
    },
  })
  console.log('✅ Backblaze B2 storage enabled')
} else {
  console.log('ℹ️  Using local filesystem storage (B2 not configured)')
}

// Directorios locales para desarrollo
const LOCAL_UPLOAD_DIR = join(process.cwd(), 'uploads')

interface UploadResult {
  key: string           // Identificador único del archivo
  url: string           // URL para acceder al archivo
  size: number          // Tamaño en bytes
  provider: 'b2' | 'local'
}

interface StorageOptions {
  folder?: string       // Subcarpeta (ej: 'professionals', 'patients')
  contentType?: string  // MIME type
}

/**
 * URL pública de descarga en B2 (Friendly URL).
 * B2 muestra en consola: https://f005.backblazeb2.com/file/bucket/key para us-east-005.
 * El número (005) se obtiene del endpoint s3.us-east-005.backblazeb2.com.
 */
function buildB2PublicUrl(key: string): string {
  const match = B2_CONFIG.endpoint.match(/us-east-(\d+)/)
  const regionNum = match ? match[1] : '004'
  return `https://f${regionNum}.backblazeb2.com/file/${B2_CONFIG.bucketName}/${key}`
}

/**
 * Genera un nombre único para el archivo
 */
export function generateStorageKey(originalName: string, folder?: string): string {
  const extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const fileName = `${timestamp}-${random}${extension}`
  
  return folder ? `${folder}/${fileName}` : fileName
}

/**
 * Sube un archivo al storage (B2 o local)
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  options: StorageOptions = {}
): Promise<UploadResult> {
  const key = generateStorageKey(originalName, options.folder)
  
  if (B2_ENABLED && s3Client) {
    // Subir a Backblaze B2
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: B2_CONFIG.bucketName,
        Key: key,
        Body: buffer,
        ContentType: options.contentType || 'application/octet-stream',
      },
    })

    await upload.done()

    const url = buildB2PublicUrl(key)

    console.log('[storage] B2 upload', { key, urlLength: url?.length ?? 0 })

    return {
      key,
      url,
      size: buffer.length,
      provider: 'b2',
    }
  } else {
    // Guardar localmente
    const localPath = join(LOCAL_UPLOAD_DIR, key)
    const localDir = join(LOCAL_UPLOAD_DIR, options.folder || '')
    
    // Asegurar que el directorio existe
    if (!existsSync(localDir)) {
      await mkdir(localDir, { recursive: true })
    }

    await writeFile(localPath, buffer)

    // URL local (relativa al servidor)
    const url = `/uploads/${key}`

    console.log('[storage] local upload', { key, url })

    return {
      key,
      url,
      size: buffer.length,
      provider: 'local',
    }
  }
}

/**
 * Elimina un archivo del storage
 */
export async function deleteFile(key: string): Promise<void> {
  if (B2_ENABLED && s3Client) {
    // Eliminar de B2
    await s3Client.send(new DeleteObjectCommand({
      Bucket: B2_CONFIG.bucketName,
      Key: key,
    }))
  } else {
    // Eliminar localmente
    const localPath = join(LOCAL_UPLOAD_DIR, key)
    if (existsSync(localPath)) {
      await unlink(localPath)
    }
  }
}

/**
 * Obtiene un archivo del storage (útil para archivos privados)
 */
export async function getFile(key: string): Promise<Buffer | null> {
  if (B2_ENABLED && s3Client) {
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: B2_CONFIG.bucketName,
        Key: key,
      }))
      
      if (response.Body) {
        const chunks: Uint8Array[] = []
        // @ts-ignore - El tipo es correcto pero TS no lo reconoce bien
        for await (const chunk of response.Body) {
          chunks.push(chunk)
        }
        return Buffer.concat(chunks)
      }
    } catch (error) {
      console.error('Error getting file from B2:', error)
      return null
    }
  } else {
    const localPath = join(LOCAL_UPLOAD_DIR, key)
    if (existsSync(localPath)) {
      return await readFile(localPath)
    }
  }
  
  return null
}

/**
 * Verifica si el storage en la nube está habilitado
 */
export function isCloudStorageEnabled(): boolean {
  return B2_ENABLED
}

/**
 * Obtiene la URL base del storage
 */
export function getStorageBaseUrl(): string {
  if (B2_ENABLED) {
    const match = B2_CONFIG.endpoint.match(/us-east-(\d+)/)
    const regionNum = match ? match[1] : '004'
    return `https://f${regionNum}.backblazeb2.com/file/${B2_CONFIG.bucketName}`
  }
  return '/uploads'
}

/**
 * URL pública de un archivo (B2 o path local). key ej: "professionals/1770345319806-xxx.jpg"
 * B2: Friendly URL (ej. https://f005.backblazeb2.com/file/vozycuerpo/...).
 */
export function getPublicUrl(key: string): string {
  if (B2_ENABLED) return buildB2PublicUrl(key)
  return `/uploads/${key}`
}
