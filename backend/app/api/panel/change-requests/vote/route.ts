import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/get-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const voteSchema = z.object({
  requestId: z.string(),
  decision: z.enum(['APPROVE', 'REJECT']),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { requestId, decision } = voteSchema.parse(body)

    // Obtener la solicitud
    const changeRequest = await prisma.changeRequest.findUnique({
      where: { id: requestId },
      include: {
        createdBy: true,
        votes: true,
      },
    })

    if (!changeRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    // No puede votar su propia solicitud
    if (changeRequest.createdByUserId === user.id) {
      return NextResponse.json({ error: 'No podés votar tu propia solicitud' }, { status: 400 })
    }

    // Verificar si ya votó
    const existingVote = changeRequest.votes.find((v) => v.voterUserId === user.id)
    if (existingVote) {
      return NextResponse.json({ error: 'Ya votaste esta solicitud' }, { status: 400 })
    }

    // Crear el voto
    await prisma.changeRequestVote.create({
      data: {
        changeRequestId: requestId,
        voterUserId: user.id,
        decision,
      },
    })

    // Recalcular estado
    const updatedRequest = await prisma.changeRequest.findUnique({
      where: { id: requestId },
      include: {
        votes: true,
        createdBy: {
          include: {
            professional: true,
          },
        },
      },
    })

    if (!updatedRequest) {
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    // Contar profesionales activos (excluyendo al creador)
    const activeProfessionalsCount = await prisma.professional.count({
      where: { isActive: true },
    })

    const requiredApprovals = activeProfessionalsCount - 1 // Excluyendo al creador
    const approvals = updatedRequest.votes.filter((v) => v.decision === 'APPROVE').length
    const rejections = updatedRequest.votes.filter((v) => v.decision === 'REJECT').length

    let newStatus = updatedRequest.status

    // Si hay un rechazo, se rechaza inmediatamente
    if (rejections > 0) {
      newStatus = 'REJECTED'
    } else if (approvals >= requiredApprovals) {
      // Si todos aprobaron, se aprueba
      newStatus = 'APPROVED'
    }

    // Si cambió el estado, actualizar y ejecutar si es necesario
    if (newStatus !== updatedRequest.status) {
      await prisma.changeRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          decidedAt: new Date(),
        },
      })

      // Si fue aprobado, ejecutar la acción
      if (newStatus === 'APPROVED') {
        await executeChangeRequest(updatedRequest)
      }
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Error al votar' }, { status: 500 })
  }
}

async function executeChangeRequest(request: any) {
  if (request.type === 'ADD_PROFESSIONAL') {
    const payload = JSON.parse(request.payloadJson || '{}')
    
    // Generar slug
    const slug = payload.fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Determinar el email: usar contactEmail si está presente, sino usar payload.email
    const email = payload.contactEmail || payload.email
    if (!email) {
      throw new Error('Email requerido para crear el profesional')
    }

    // Crear profesional
    const professional = await prisma.professional.create({
      data: {
        slug,
        fullName: payload.fullName,
        title: payload.title,
        modalities: JSON.stringify(payload.modalities || []),
        languages: JSON.stringify(payload.languages || []),
        specialties: JSON.stringify(payload.specialties || []),
        approach: payload.approach || '',
        isActive: true,
        contactEmail: email, // Sincronizar con el email de login
        whatsappPhone: payload.whatsappPhone || null,
        photo: payload.photo || null,
        description: payload.description || null,
      },
    })

    // Crear usuario con el mismo email (sincronizado)
    const passwordHash = await bcrypt.hash(payload.password || 'Demo1234!', 10)
    await prisma.user.create({
      data: {
        email: email, // Usar el mismo email que contactEmail
        passwordHash,
        professionalId: professional.id,
      },
    })

    // Crear reglas de disponibilidad por defecto (Lunes a Viernes, 9-18)
    for (let day = 1; day <= 5; day++) {
      await prisma.availabilityRule.create({
        data: {
          professionalId: professional.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          slotMinutes: 50,
          bufferMinutes: 10,
        },
      })
    }

    // Marcar como ejecutado
    await prisma.changeRequest.update({
      where: { id: request.id },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
      },
    })
  } else if (request.type === 'REMOVE_PROFESSIONAL' && request.targetProfessionalId) {
    // Soft delete: solo desactivar
    await prisma.professional.update({
      where: { id: request.targetProfessionalId },
      data: { isActive: false },
    })

    await prisma.changeRequest.update({
      where: { id: request.id },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
      },
    })
  }
}


