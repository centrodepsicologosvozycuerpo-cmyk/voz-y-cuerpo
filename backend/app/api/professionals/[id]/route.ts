import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getPublicUrl } from '@/lib/storage'
import { getOptimizedImageUrl } from '@/lib/cloudinary-urls'

export const dynamic = 'force-dynamic'

// Handler para preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Professional-Id',
    },
  })
}

const updateProfessionalSchema = z.object({
  fullName: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  specialties: z.array(z.string()).optional(),
  modalities: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  approach: z.string().optional(),
  contactEmail: z.string().email().optional().nullable(),
  whatsappPhone: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (!professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      )
    }

    const photo = professional.photo
    let photoUrls: { original: string; thumbnail: string; avatar: string; profile: string } | undefined
    if (photo?.trim()) {
      const sourceUrl = photo.startsWith('http')
        ? photo
        : getPublicUrl(photo.startsWith('professionals/') ? photo : `professionals/${photo}`)
      photoUrls = {
        original: sourceUrl,
        thumbnail: getOptimizedImageUrl(sourceUrl, 'thumbnail'),
        avatar: getOptimizedImageUrl(sourceUrl, 'avatar'),
        profile: getOptimizedImageUrl(sourceUrl, 'profile'),
      }
    }

    return NextResponse.json({
      professional: { ...professional, photoUrls },
    })
  } catch (error) {
    console.error('Error fetching professional:', error)
    return NextResponse.json(
      { error: 'Error al obtener profesional' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const validated = updateProfessionalSchema.parse(body)

    // Verificar que el profesional existe
    const professional = await prisma.professional.findUnique({
      where: { id: params.id },
    })

    if (!professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      )
    }

    // Solo ADMIN o el mismo profesional pueden editar
    if (user.role !== 'ADMIN' && user.professionalId !== professional.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {}
    if (validated.fullName !== undefined) updateData.fullName = validated.fullName
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.specialties !== undefined) updateData.specialties = JSON.stringify(validated.specialties)
    if (validated.modalities !== undefined) updateData.modalities = JSON.stringify(validated.modalities)
    if (validated.languages !== undefined) updateData.languages = JSON.stringify(validated.languages)
    if (validated.approach !== undefined) updateData.approach = validated.approach
    if (validated.contactEmail !== undefined) updateData.contactEmail = validated.contactEmail
    if (validated.whatsappPhone !== undefined) updateData.whatsappPhone = validated.whatsappPhone
    if (validated.photo !== undefined) updateData.photo = validated.photo
    if (validated.description !== undefined) updateData.description = validated.description

    // Si cambió el nombre, actualizar el slug
    if (validated.fullName && validated.fullName !== professional.fullName) {
      updateData.slug = validated.fullName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }

    // Si cambió el contactEmail, también actualizar el email del usuario (email de login)
    if (validated.contactEmail !== undefined && validated.contactEmail !== null) {
      // Obtener el usuario asociado
      const user = await prisma.user.findUnique({
        where: { professionalId: professional.id },
      })

      if (user) {
        // Verificar que el nuevo email no esté en uso por otro usuario
        const existingUser = await prisma.user.findUnique({
          where: { email: validated.contactEmail },
        })

        if (existingUser && existingUser.id !== user.id) {
          return NextResponse.json(
            { error: 'Este email ya está en uso por otro usuario' },
            { status: 400 }
          )
        }

        // Actualizar el email del usuario si es diferente
        if (user.email !== validated.contactEmail) {
          await prisma.user.update({
            where: { id: user.id },
            data: { email: validated.contactEmail },
          })
        }
      }
    }

    const updated = await prisma.professional.update({
      where: { id: professional.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ professional: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating professional:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar profesional' },
      { status: 500 }
    )
  }
}


