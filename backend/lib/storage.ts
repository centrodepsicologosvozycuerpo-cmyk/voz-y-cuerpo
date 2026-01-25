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
const B2_ENABLED = !!(
  process.env.B2_KEY_ID &&
  process.env.B2_APPLICATION_KEY &&
  process.env.B2_BUCKET_NAME &&
  process.env.B2_ENDPOINT
)

const B2_CONFIG = {
  keyId: process.env.B2_KEY_ID || '',
  applicationKey: process.env.B2_APPLICATION_KEY || '',
  bucketName: process.env.B2_BUCKET_NAME || '',
  endpoint: process.env.B2_ENDPOINT || '', // Ej: https://s3.us-west-004.backblazeb2.com
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

    // URL pública del archivo en B2
    // Formato: https://f004.backblazeb2.com/file/bucket-name/key
    const bucketUrl = B2_CONFIG.endpoint.replace('s3.', 'f004.').replace('.backblazeb2.com', '.backblazeb2.com/file')
    const url = `${bucketUrl}/${B2_CONFIG.bucketName}/${key}`

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
    const bucketUrl = B2_CONFIG.endpoint.replace('s3.', 'f004.').replace('.backblazeb2.com', '.backblazeb2.com/file')
    return `${bucketUrl}/${B2_CONFIG.bucketName}`
  }
  return '/uploads'
}
