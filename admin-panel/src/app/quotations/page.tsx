"use client"
import React, { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { fetchApi } from '@/lib/api'
import { FileText, Plus, Share2, Download, Search, MessageCircle } from 'lucide-react'

export default function QuotationsPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      const data = await fetchApi('/api/v1/quotations')
      setQuotes(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async (id: string) => {
    try {
      const { shareUrl } = await fetchApi(`/api/v1/quotations/${id}/share`, { method: 'POST' })
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      alert('Share link copied to clipboard!')
      
      // Optional: Open WhatsApp
      const waUrl = `https://wa.me/?text=${encodeURIComponent('Here is your insurance quotation: ' + shareUrl)}`
      window.open(waUrl, '_blank')
    } catch (error: any) {
      alert(error.message || 'Failed to share quotation')
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and manage insurance quotes for your leads.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
          <Plus size={18} />
          New Quotation
        </button>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Quotations</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by lead name..." 
              className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">ID / Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Lead Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-400">Loading...</td></tr>
            ) : quotes.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">No quotations found.</td></tr>
            ) : quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">#{quote.id.slice(0, 8)}</div>
                  <div className="text-[10px] text-gray-400">{new Date(quote.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{quote.lead?.clientName || 'N/A'}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{parseFloat(quote.amount).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    quote.status === 'Sent' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {quote.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleShare(quote.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all flex items-center gap-1 text-xs font-bold"
                    >
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Download size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
