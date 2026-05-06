"use client"
import React, { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { fetchApi } from '@/lib/api'
import { Landmark, FileCheck, ArrowRight, User as UserIcon, Clock } from 'lucide-react'

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    setIsLoading(true)
    try {
      const data = await fetchApi('/api/v1/finance/loans')
      setLoans(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, updates: any) => {
    try {
      const res = await fetch('/api/v1/finance/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      if (res.ok) fetchLoans()
    } catch (error) {
      alert('Failed to update loan')
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans & Finance</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vehicle and personal loan applications.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
          New Loan Application
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Loan Queue */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-gray-900 px-1">Active Applications</h3>
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">Loading...</div>
          ) : loans.length === 0 ? (
            <div className="p-10 text-center text-gray-400 italic">No loan applications found.</div>
          ) : loans.map((loan) => (
            <div key={loan.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                  <UserIcon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{loan.customerName}</h4>
                  <p className="text-xs text-gray-500 font-medium">{loan.loanType} · ₹{parseFloat(loan.amount).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <select 
                      value={loan.conversionStatus}
                      onChange={(e) => handleUpdateStatus(loan.id, { conversionStatus: e.target.value })}
                      className="text-[10px] font-bold uppercase tracking-wider bg-gray-50 border-none rounded-lg p-1 outline-none cursor-pointer"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Processing">Processing</option>
                      <option value="Approved">Approved</option>
                      <option value="Disbursed">Disbursed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      loan.conversionStatus === 'Disbursed' ? 'bg-green-50 text-green-700' :
                      loan.conversionStatus === 'Rejected' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {loan.conversionStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium flex items-center gap-1 justify-end">
                    <Clock size={10} />
                    {new Date(loan.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats & Banks */}
        <div className="space-y-6">
          <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-200">
            <h4 className="font-bold text-lg">Loan Lifecycle</h4>
            <p className="text-blue-100 text-sm mt-1">Track conversions from application to disbursement.</p>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-xs">
                <span>Disbursed</span>
                <span className="font-bold">{loans.filter(l => l.conversionStatus === 'Disbursed').length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>In Process</span>
                <span className="font-bold">{loans.filter(l => ['Applied', 'Processing', 'Approved'].includes(l.conversionStatus)).length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4">Partner Banks</h4>
            <div className="space-y-4">
              {['HDFC Bank', 'ICICI Bank', 'SBI Finance', 'Axis Bank'].map((bank) => (
                <div key={bank} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                      <Landmark size={16} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{bank}</span>
                  </div>
                  <FileCheck size={16} className="text-green-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
