"use client"
import React, { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Car, CheckCircle, Clock, Search, IndianRupee } from 'lucide-react'
import { fetchApi } from '@/lib/api'

export default function RTOPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const data = await fetchApi('/api/v1/workflow/rto')
      setTasks(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, updates: any) => {
    try {
      const res = await fetch('/api/v1/workflow/rto', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      if (res.ok) fetchTasks()
    } catch (error) {
      alert('Failed to update task')
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RTO Work Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track vehicle transfers, NOCs, and registration updates.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
          New RTO Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending Tasks</p>
            <Clock className="text-orange-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">
            {tasks.filter(t => t.status === 'pending').length}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Payment Due</p>
            <IndianRupee className="text-blue-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">
            {tasks.filter(t => t.paymentStatus === 'Pending').length}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Completed</p>
            <CheckCircle className="text-green-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">
            {tasks.filter(t => t.status === 'completed').length}
          </h3>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Active RTO Tasks</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Vehicle No..." 
              className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Vehicle No</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Service Type</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-400">Loading...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-400">No tasks found.</td></tr>
            ) : tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-gray-900 uppercase">{task.vehicleNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{task.workType}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${task.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                      {task.paymentStatus}
                    </span>
                    <span className="text-[10px] text-gray-400">₹{task.fees || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    task.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {task.paymentStatus !== 'Paid' && (
                      <button 
                        onClick={() => handleUpdateStatus(task.id, { paymentStatus: 'Paid', paymentDate: new Date() })}
                        className="text-green-600 hover:text-green-700 text-xs font-bold"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button className="text-blue-600 hover:text-blue-700 text-xs font-bold">Update</button>
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
