"use client"
import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { fetchApi } from '@/lib/api'
import { Search, Filter, Plus, MoreVertical, ExternalLink, Download, Upload, CheckCircle, AlertCircle, Users } from 'lucide-react'

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [leadsData, statsData] = await Promise.all([
        fetchApi('/api/v1/leads?limit=100'),
        fetchApi('/api/v1/leads/stats')
      ])
      
      setLeads(leadsData.leads || [])
      setStats(statsData.summary || null)
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await fetchApi('/api/v1/leads/import', {
        method: 'POST',
        body: formData,
        headers: {} // fetchApi will handle auth
      })
      
      setImportResult(result.stats)
      alert(`Imported ${result.stats.assignedCount} leads successfully!`)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track monthly renewals and employee performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            id="csv-import" 
            className="hidden" 
            accept=".csv,.xlsx" 
            onChange={handleImport} 
          />
          <label 
            htmlFor="csv-import" 
            className="cursor-pointer px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Upload size={16} />
            {importing ? 'Importing...' : 'Import Leads'}
          </label>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md">
            <Plus size={18} />
            New Lead
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard title="Total Leads" value={stats?.total || 0} icon={<Users className="text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Assigned" value={stats?.assigned || 0} icon={<CheckCircle className="text-green-600" />} color="bg-green-50" />
        <StatCard title="Converted" value={stats?.converted || 0} icon={<CheckCircle className="text-purple-600" />} color="bg-purple-50" />
        <StatCard title="Followups" value={stats?.followups || 0} icon={<AlertCircle className="text-amber-600" />} color="bg-amber-50" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mt-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, phone or vehicle number..." 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">
          <Filter size={18} />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Vehicle & Owner</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Created</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No leads found.</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{lead.clientName}</div>
                    <div className="text-xs text-gray-500">{lead.vehicleNo} · {lead.clientPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                        {lead.assignee?.fullName?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm text-gray-600">{lead.assignee?.fullName || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-blue-600">
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className={`p-6 rounded-2xl border border-gray-100 shadow-sm ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-3 bg-white rounded-xl shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  )
}
