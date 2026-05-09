import { NextRequest, NextResponse } from 'next/server'
import { NextResponse as NR } from 'next/server'
import prisma from '@/lib/prisma'
import { validateAuth } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  const { context, error } = await validateAuth(req, 'dashboard.view_agent')
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const view = searchParams.get('view') || 'auto'
    
    // Adjust 'today' for IST (+5:30)
    const now = new Date()
    const today = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
    today.setUTCHours(0, 0, 0, 0)
    // Shift back to get the UTC equivalent of IST midnight
    const istMidnightInUtc = new Date(today.getTime() - (5.5 * 60 * 60 * 1000))
    
    const userId = context!.userId
    const role = context!.role
    const perms = context!.permissions

    // Determine effective view based on role/permissions
    const effectiveView = view === 'auto'
      ? perms.includes('dashboard.view_admin') ? 'admin'
        : perms.includes('dashboard.view_manager') ? 'manager'
        : 'agent'
      : view

    // ── Agent view: personal KPIs ─────────────────────────────────────
    if (effectiveView === 'agent') {
      const [myLeads, myLeadsToday, myFollowupsPending, myCallsToday, myQuotations] = await Promise.all([
        prisma.lead.count({ where: { assignedTo: userId } }),
        prisma.lead.count({ where: { assignedTo: userId, createdAt: { gte: istMidnightInUtc } } }),
        prisma.followUp.count({ where: { assignedTo: userId, status: 'pending' } }),
        prisma.call.count({ where: { userId, createdAt: { gte: istMidnightInUtc } } }),
        prisma.quotation.count({ where: { createdBy: userId } })
      ])
      return NextResponse.json({
        view: 'agent',
        my_leads: myLeads,
        new_leads_today: myLeadsToday,
        pending_followups: myFollowupsPending,
        calls_today: myCallsToday,
        my_quotations: myQuotations
      })
    }

    // ── Manager view: team pipeline ───────────────────────────────────
    if (effectiveView === 'manager') {
      const [
        totalLeads, activeLeads, wonLeads, lostLeads,
        pendingFollowups, overdueFollowups,
        totalQuotations, sentQuotations
      ] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: { in: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation'] } } }),
        prisma.lead.count({ where: { status: 'Won' } }),
        prisma.lead.count({ where: { status: 'Lost' } }),
        prisma.followUp.count({ where: { status: 'pending' } }),
        prisma.followUp.count({ where: { isOverdue: true } }),
        prisma.quotation.count(),
        prisma.quotation.count({ where: { status: 'Sent' } })
      ])

      // Lead pipeline by status
      const pipeline = await prisma.lead.groupBy({
        by: ['status'],
        _count: { _all: true }
      })

      return NextResponse.json({
        view: 'manager',
        total_leads: totalLeads,
        active_leads: activeLeads,
        won_leads: wonLeads,
        lost_leads: lostLeads,
        pending_followups: pendingFollowups,
        overdue_followups: overdueFollowups,
        total_quotations: totalQuotations,
        sent_quotations: sentQuotations,
        pipeline: pipeline.map(p => ({ status: p.status, count: p._count._all }))
      })
    }

    // ── Admin view: full global stats ─────────────────────────────────
    const [
      totalLeads, newLeadsToday, totalPolicies, activePolicies,
      totalQuotations, totalCalls, pendingFollowups, overdueFollowups,
      activeClaims, pendingRto, pendingFitness, activeLoans,
      totalCustomers, todayVisits, totalUsers
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { createdAt: { gte: istMidnightInUtc } } }),
      prisma.policy.count(),
      prisma.policy.count({ where: { status: 'Active' } }),
      prisma.quotation.count(),
      prisma.call.count(),
      prisma.followUp.count({ where: { status: 'pending' } }),
      prisma.followUp.count({ where: { isOverdue: true } }),
      prisma.claim.count({ where: { status: { in: ['filed', 'under_review', 'approved'] } } }),
      prisma.rTOWork.count({ where: { status: 'pending' } }),
      prisma.fitnessWork.count({ where: { status: 'pending' } }),
      prisma.loan.count({ where: { status: { in: ['applied', 'under_review', 'approved', 'disbursed'] } } }),
      prisma.customer.count(),
      prisma.visit.count({ where: { scheduledAt: { gte: istMidnightInUtc } } }),
      prisma.user.count({ where: { isActive: true } })
    ])

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const revenueData = await prisma.transaction.groupBy({
      by: ['date'],
      where: { type: 'income', date: { gte: sixMonthsAgo } },
      _sum: { amount: true }
    })

    // Top agents by lead count
    const topAgents = await prisma.lead.groupBy({
      by: ['assignedTo'],
      _count: { _all: true },
      orderBy: { _count: { assignedTo: 'desc' } },
      take: 5,
      where: { assignedTo: { not: null } }
    })

    return NextResponse.json({
      view: 'admin',
      total_leads: totalLeads,
      new_leads_today: newLeadsToday,
      pending_followups: pendingFollowups,
      overdue_followups: overdueFollowups,
      total_policies: totalPolicies,
      active_policies: activePolicies,
      total_quotations: totalQuotations,
      total_calls: totalCalls,
      active_claims: activeClaims,
      pending_rto: pendingRto,
      pending_fitness: pendingFitness,
      active_loans: activeLoans,
      total_customers: totalCustomers,
      today_visits: todayVisits,
      total_employees: totalUsers,
      revenue_trend: revenueData,
      top_agents: topAgents
    })
  } catch (error) {
    console.error('Dashboard Stats Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
