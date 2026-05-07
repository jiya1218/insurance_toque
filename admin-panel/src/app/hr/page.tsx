"use client"
import React, { useState, useEffect } from 'react'
import { Plus, Search, Mail, Phone, MapPin, Shield, Activity, DollarSign } from 'lucide-react'

export default function HRPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, fetch from /api/v1/users?role=Employee
    // For now, mock some data to show it's working
    setEmployees([
      { id: '1', full_name: 'John Doe', email: 'john@toque.com', phone: '9876543210', role: 'Sales Agent', status: 'Active', salary: 25000 },
      { id: '2', full_name: 'Jane Smith', email: 'jane@toque.com', phone: '9876543211', role: 'RTO Specialist', status: 'Active', salary: 30000 },
    ])
    setLoading(false)
  }, [])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR / Employee Management</h1>
          <p className="text-gray-500 mt-1">Manage staff roles, salaries, and attendance.</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-100 hover:scale-[1.02] transition-all">
          <Plus size={20} />
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search employees by name, email or role..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role & Dept</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Salary</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                        {emp.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{emp.full_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          <Mail size={10} /> {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-medium text-gray-900">{emp.role}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Insurance Dept</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-gray-900">₹{emp.salary.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 font-medium">PER MONTH</div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-brand-primary font-bold text-xs hover:underline">View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
