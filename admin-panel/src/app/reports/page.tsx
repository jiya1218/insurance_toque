"use client"
import { useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { DownloadCloud, FileText, Users2, BarChart2, RefreshCw } from 'lucide-react'

const REPORT_TYPES = [
  {
    id: 'revenue',
    title: 'Revenue Report',
    description: 'Income, expense, and net revenue for the selected period.',
    icon: BarChart2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  {
    id: 'leads',
    title: 'Lead Report',
    description: 'All leads with status breakdown and assigned agents.',
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  {
    id: 'hr',
    title: 'Employee Report',
    description: 'List of all employees, their roles, qualifications, and joining dates.',
    icon: Users2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  }
]

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [previewType, setPreviewType] = useState('')

  const download = async (type: string) => {
    const params = new URLSearchParams({ type, from, to })
    const res = await fetch(`/api/v1/reports?${params}`)
    const data = await res.json()

    // Convert to CSV
    const records = data.records || []
    if (!records.length) { alert('No data for this period.'); return }

    const headers = Object.keys(records[0])
    const rows = records.map((r: any) => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${type}_report_${from}_${to}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const viewPreview = async (type: string) => {
    setLoading(type)
    setPreview(null)
    try {
      const params = new URLSearchParams({ type, from, to })
      const res = await fetch(`/api/v1/reports?${params}`)
      const data = await res.json()
      setPreview(data)
      setPreviewType(type)
    } catch {}
    setLoading(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Generate and download business reports.</p>
          </div>
        </div>

        {/* Date Range */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Select Period</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-1">FROM</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-1">TO</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REPORT_TYPES.map(r => (
            <div key={r.id} className={`bg-white rounded-2xl border ${r.border} p-6 shadow-sm`}>
              <div className={`p-3 rounded-xl ${r.bg} w-fit mb-4`}>
                <r.icon size={22} className={r.color} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{r.title}</h3>
              <p className="text-sm text-gray-500 mb-6">{r.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => viewPreview(r.id)}
                  disabled={loading === r.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                >
                  {loading === r.id ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
                  Preview
                </button>
                <button
                  onClick={() => download(r.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 ${r.bg} ${r.color} border ${r.border} rounded-xl text-sm font-semibold hover:opacity-80 transition-all`}
                >
                  <DownloadCloud size={14} />
                  CSV
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Table */}
        {preview && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 capitalize">{previewType} Report Preview</h3>
              <div className="flex gap-4 text-sm text-gray-500">
                {preview.total !== undefined && <span><strong>{preview.total}</strong> records</span>}
                {preview.total_income !== undefined && (
                  <span>Revenue: <strong className="text-green-600">₹{(preview.total_income / 100000).toFixed(2)}L</strong></span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {preview.records?.[0] && Object.keys(preview.records[0]).slice(0, 6).map((h: string) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider capitalize">
                        {h.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(preview.records || []).slice(0, 15).map((row: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      {Object.values(row).slice(0, 6).map((val: any, j: number) => (
                        <td key={j} className="px-4 py-3 text-gray-700 text-xs">
                          {typeof val === 'object' ? (val?.name || JSON.stringify(val)) : String(val ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {(preview.records || []).length > 15 && (
                <p className="text-center py-4 text-xs text-gray-400">
                  Showing 15 of {preview.records.length} rows. Download CSV for full data.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
