import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth-guard'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { context, error } = await validateAuth(req, 'accounts.view_reports')
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'summary'
    
    const parseDate = (dateStr: string | null, isEnd: boolean) => {
      if (!dateStr) return null
      // Try parsing standard YYYY-MM-DD
      let d = new Date(dateStr)
      
      // If invalid or year is very small (could be DD-MM-YYYY), try manual split
      if (isNaN(d.getTime()) || d.getFullYear() < 2000) {
        const parts = dateStr.split(/[-/]/)
        if (parts.length === 3) {
          // Try DD-MM-YYYY
          const dmy = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
          if (!isNaN(dmy.getTime())) d = dmy
        }
      }
      
      if (isNaN(d.getTime())) return null
      
      if (isEnd) d.setHours(23, 59, 59, 999)
      else d.setHours(0, 0, 0, 0)
      return d
    }

    let from = parseDate(searchParams.get('from'), false) || new Date(new Date().setMonth(new Date().getMonth() - 3))
    let to = parseDate(searchParams.get('to'), true) || new Date()

    if (type === 'revenue') {
      const transactions = await prisma.transaction.findMany({
        where: { date: { gte: from, lte: to } },
        orderBy: { date: 'asc' },
        select: {
          id: true, type: true, category: true,
          amount: true, date: true, description: true, paymentMethod: true
        }
      })
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      return NextResponse.json({ type: 'revenue', total_income: totalIncome, total_expense: totalExpense, net: totalIncome - totalExpense, records: transactions })
    }

    if (type === 'leads') {
      const leads = await prisma.lead.findMany({
        where: { createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: 'desc' },
        include: { assignee: { select: { fullName: true } } }
      })
      const byStatus = await prisma.lead.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from, lte: to } },
        _count: { _all: true }
      })
      return NextResponse.json({
        type: 'leads', total: leads.length,
        by_status: byStatus.map(s => ({ status: s.status, count: s._count._all })),
        records: leads
      })
    }

    if (type === 'hr') {
      const employees = await prisma.user.findMany({
        select: {
          id: true, fullName: true, email: true,
          joiningDate: true, highestQualification: true,
          isActive: true, role: { select: { name: true } }
        },
        orderBy: { fullName: 'asc' }
      })
      return NextResponse.json({ type: 'hr', total: employees.length, records: employees })
    }

    // Default summary
    const [leads, policies, claims, loans, users] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.policy.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.claim.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.loan.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.user.count({ where: { isActive: true } })
    ])
    return NextResponse.json({ 
      type: 'summary', 
      from: from.toISOString(), 
      to: to.toISOString(), 
      leads, policies, claims, loans, active_users: users 
    })
  } catch (err: any) {
    console.error('Reports API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
