"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fetchApi } from '@/lib/api'
import AdminLayout from '@/components/layout/AdminLayout'
import Protect from '@/components/auth/Protect'
import { 
  Users2, ShieldCheck, TrendingUp, Clock, Plus, AlertCircle,
  BarChart2, FileText, Phone, Target, Briefcase, Activity,
  UserCheck, MapPin, DownloadCloud, RefreshCw
} from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl ${bg}`}>
          <Icon size={22} className={color} />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</h3>
    </div>
  )
}

function PipelineBar({ pipeline }: { pipeline: { status: string; count: number }[] }) {
  const total = pipeline.reduce((s, p) => s + p.count, 0) || 1
  const colors: Record<string, string> = {
    New: 'bg-blue-500', Contacted: 'bg-orange-400', Qualified: 'bg-yellow-400',
    Proposal: 'bg-purple-500', Negotiation: 'bg-amber-500', Won: 'bg-green-500', Lost: 'bg-red-400'
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-gray-700 mb-4">Lead Pipeline</h3>
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
        {pipeline.map(p => (
          <div
            key={p.status}
            title={`${p.status}: ${p.count}`}
            className={`${colors[p.status] || 'bg-gray-300'} transition-all`}
            style={{ width: `${(p.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        {pipeline.map(p => (
          <div key={p.status} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`w-2 h-2 rounded-full ${colors[p.status] || 'bg-gray-300'}`} />
            {p.status} ({p.count})
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchApi('/api/v1/dashboard/stats')
      setStats(data)
    } catch (err) {
      console.error('Stats load error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const downloadReport = () => window.open('/api/v1/reports?type=summary', '_blank')

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {stats?.view === 'agent' ? 'Your personal performance overview.' :
             stats?.view === 'manager' ? 'Team pipeline and activity.' :
             "Welcome back, Admin. Here's what's happening today."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={load}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
          >
            <DownloadCloud size={16} />
            Reports
          </button>
          <Protect permission="leads.create">
            <button 
              onClick={() => router.push('/leads')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
            >
              <Plus size={18} />
              New Lead
            </button>
          </Protect>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-100 rounded-xl mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-7 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !stats ? (
        <div className="bg-white rounded-2xl border border-red-100 p-10 text-center text-red-500">
          <AlertCircle size={32} className="mx-auto mb-3" />
          <p className="font-semibold">Could not load dashboard stats.</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Agent View */}
          {stats.view === 'agent' && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard label="My Total Leads" value={stats.my_leads} icon={Target} color="text-blue-600" bg="bg-blue-50" />
              <StatCard label="New Today" value={stats.new_leads_today} icon={Plus} color="text-green-600" bg="bg-green-50" />
              <StatCard label="Pending Followups" value={stats.pending_followups} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
              <StatCard label="Calls Today" value={stats.calls_today} icon={Phone} color="text-purple-600" bg="bg-purple-50" />
              <StatCard label="My Quotations" value={stats.my_quotations} icon={FileText} color="text-indigo-600" bg="bg-indigo-50" />
            </div>
          )}

          {/* Manager View */}
          {stats.view === 'manager' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Leads" value={stats.total_leads} icon={Users2} color="text-blue-600" bg="bg-blue-50" />
                <StatCard label="Won Leads" value={stats.won_leads} icon={UserCheck} color="text-green-600" bg="bg-green-50" />
                <StatCard label="Pending Followups" value={stats.pending_followups} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
                <StatCard label="Overdue" value={stats.overdue_followups} icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
              </div>
              {stats.pipeline?.length > 0 && <PipelineBar pipeline={stats.pipeline} />}
            </>
          )}

          {/* Admin View */}
          {stats.view === 'admin' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Leads" value={stats.total_leads} icon={Target} color="text-blue-600" bg="bg-blue-50" />
                <StatCard label="New Today" value={stats.new_leads_today} icon={Plus} color="text-green-600" bg="bg-green-50" />
                <StatCard label="Active Policies" value={stats.active_policies} icon={ShieldCheck} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard label="Active Employees" value={stats.total_employees} icon={Users2} color="text-violet-600" bg="bg-violet-50" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Active Claims" value={stats.active_claims} icon={Briefcase} color="text-red-600" bg="bg-red-50" />
                <StatCard label="Active Loans" value={stats.active_loans} icon={BarChart2} color="text-cyan-600" bg="bg-cyan-50" />
                <StatCard label="RTO Pending" value={stats.pending_rto} icon={Activity} color="text-orange-600" bg="bg-orange-50" />
                <StatCard label="Visits Today" value={stats.today_visits} icon={MapPin} color="text-teal-600" bg="bg-teal-50" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <StatCard label="Pending Followups" value={stats.pending_followups} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
                <StatCard label="Overdue Followups" value={stats.overdue_followups} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" />
              </div>
            </>
          )}

        </div>
      )}
    </AdminLayout>
  )
}
