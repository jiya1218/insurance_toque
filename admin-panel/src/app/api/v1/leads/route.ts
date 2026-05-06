import { validateAuth } from '@/lib/auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { error, context } = await validateAuth(req, 'leads.view')
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    // RBAC: If not Admin/Super Admin, only see assigned leads
    if (context && !['Super Admin', 'Admin'].includes(context.role)) {
      where.assignedTo = context.userId
    }

    if (status && status !== 'all') {
      where.status = status
    }
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search, mode: 'insensitive' } },
        { vehicleNo: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: {
            select: { fullName: true }
          }
        }
      }),
      prisma.lead.count({ where })
    ])

    return NextResponse.json({
      leads,
      pagination: {
        total,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Leads GET Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error } = await validateAuth(req, 'leads.create')
  if (error) return error

  try {
    const body = await req.json()
    const lead = await prisma.lead.create({
      data: {
        clientName: body.clientName || body.client_name,
        clientEmail: body.clientEmail || body.client_email,
        clientPhone: String(body.clientPhone || body.client_phone),
        vehicleNo: body.vehicleNo || body.vehicle_no,
        status: body.status || 'New',
        assignedTo: body.assignedTo || body.assigned_to
      }
    })
    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Lead POST Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
