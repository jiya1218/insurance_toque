"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const MENU_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/' },
      { name: 'Reports', href: '/reports' },
    ]
  },
  {
    label: 'SALES',
    items: [
      { name: 'Leads', href: '/leads' },
      { name: 'CRM', href: '/crm' },
      { name: 'Quotations', href: '/quotations' },
      { name: 'Policies', href: '/policies' },
      { name: 'Follow-ups', href: '/follow-ups' },
    ]
  },
  {
    label: 'OPERATIONS',
    items: [
      { name: 'Claims', href: '/claims' },
      { name: 'Loans', href: '/loans' },
      { name: 'RTO Work', href: '/rto' },
      { name: 'Fitness', href: '/fitness' },
    ]
  },
  {
    label: 'ADMIN',
    items: [
      { name: 'Users', href: '/users' },
      { name: 'Roles & Permissions', href: '/roles' },
      { name: 'Data Approvals', href: '/data' },
      { name: 'Finance', href: '/finance' },
      { name: 'HR', href: '/hr' },
      { name: 'Lead Responses', href: '/settings/responses' },
      { name: 'Settings', href: '/settings' },
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md border border-gray-200 md:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Overlay (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-50
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Torque Auto Advisor" className="h-12 w-auto object-contain" />
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-5">
          {MENU_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5 ${
                      isActive 
                        ? 'bg-brand-primary text-white shadow-lg shadow-red-200' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-brand-primary'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all">
            Logout
          </button>
        </div>
      </div>
    </>
  )
}
