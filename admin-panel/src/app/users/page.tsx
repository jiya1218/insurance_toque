"use client"
import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import {
  UserPlus, Shield, Mail, Edit3, Trash2,
  CheckCircle2, Circle, XCircle, X, Search, RefreshCw,
  User, BookOpen, AlertCircle
} from 'lucide-react'

export default function UsersPage() {
  const { token, isLoading: authLoading } = useAuth()
  const apiFetch = useApi()
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [allPermissions, setAllPermissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    fullName: '', email: '', password: '', roleId: '',
    highestQualification: '', dateOfBirth: '', joiningDate: '',
    personalMobile: '', homeMobile: ''
  })
  const [createError, setCreateError] = useState('')

  // Edit modal
  const [editUser, setEditUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({ roleId: '', isActive: true, extraPermissionIds: [] as string[] })
  const [saving, setSaving] = useState(false)

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        apiFetch('/api/v1/users'),
        apiFetch('/api/v1/roles'),
        apiFetch('/api/v1/permissions')
      ])
      const usersData = await usersRes.json()
      const rolesData = await rolesRes.json()
      const permsData = await permsRes.json()
      setUsers(Array.isArray(usersData) ? usersData : [])
      setRoles(Array.isArray(rolesData) ? rolesData : [])
      setAllPermissions(Array.isArray(permsData) ? permsData : [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [apiFetch])

  // Wait for auth before fetching
  useEffect(() => {
    if (!authLoading) {
      if (token) fetchData()
      else setIsLoading(false)
    }
  }, [authLoading, token]) // eslint-disable-line

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const res = await apiFetch('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify(createForm)
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create user')
      } else {
        setShowCreateModal(false)
        setCreateForm({ fullName: '', email: '', password: '', roleId: '', highestQualification: '', dateOfBirth: '', joiningDate: '', personalMobile: '', homeMobile: '' })
        fetchData()
      }
    } catch {
      setCreateError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (user: any) => {
    setEditUser(user)
    setEditForm({
      roleId: user.role?.id || '',
      isActive: user.isActive,
      extraPermissionIds: user.permissions?.map((p: any) => p.id) || []
    })
  }

  const handleEditSave = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const res = await apiFetch(`/api/v1/users/${editUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          roleId: editForm.roleId || null,
          isActive: editForm.isActive,
          extraPermissionIds: editForm.extraPermissionIds
        })
      })
      if (res.ok) {
        setEditUser(null)
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await apiFetch(`/api/v1/users/${id}`, { method: 'DELETE' })
      fetchData()
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">{users.length} total employees</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all font-semibold text-sm"
            >
              <UserPlus size={18} /> Add User
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <User size={40} className="mb-3 text-gray-300" />
              <p className="font-semibold">No users found</p>
              <p className="text-sm mt-1">Add your first employee to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Employee</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Role</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Status</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Joined</th>
                  <th className="text-right text-xs font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user.fullName}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail size={10} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {user.role ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                          <Shield size={11} /> {user.role.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No role</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold">
                          <CheckCircle2 size={11} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
                          <XCircle size={11} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400">
                      {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit user"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete user"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Create User Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 my-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
                <p className="text-sm text-gray-500 mt-1">Complete the onboarding details below.</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); setCreateError('') }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Details */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2"><User size={12} /> Account Access</h5>
                  {[
                    { label: 'Full Name *', key: 'fullName', type: 'text', placeholder: 'e.g. Karan Mehra', required: true },
                    { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'karan@company.in', required: true },
                    { label: 'Password *', key: 'password', type: 'password', placeholder: 'Min 8 characters', required: true },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">{f.label}</label>
                      <input
                        type={f.type} required={f.required} placeholder={f.placeholder}
                        value={(createForm as any)[f.key]}
                        onChange={e => setCreateForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Assign Role</label>
                    <select
                      value={createForm.roleId}
                      onChange={e => setCreateForm(f => ({ ...f, roleId: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a role (optional)</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2"><BookOpen size={12} /> Onboarding Details</h5>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Highest Qualification</label>
                    <input type="text" placeholder="e.g. MBA, B.Tech"
                      value={createForm.highestQualification}
                      onChange={e => setCreateForm(f => ({ ...f, highestQualification: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Date of Birth', key: 'dateOfBirth' },
                      { label: 'Joining Date', key: 'joiningDate' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">{f.label}</label>
                        <input type="date" value={(createForm as any)[f.key]}
                          onChange={e => setCreateForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                  {[
                    { label: 'Personal Mobile', key: 'personalMobile', placeholder: '+91 00000 00000' },
                    { label: 'Home / Emergency Mobile', key: 'homeMobile', placeholder: '+91 00000 00000' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">{f.label}</label>
                      <input type="tel" placeholder={f.placeholder}
                        value={(createForm as any)[f.key]}
                        onChange={e => setCreateForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle size={16} /> {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreateModal(false); setCreateError('') }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200">
                  {creating ? 'Creating...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                <p className="text-sm text-gray-500 mt-0.5">{editUser.fullName} · {editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Role & Status row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Assign Role</label>
                  <select
                    value={editForm.roleId}
                    onChange={e => setEditForm(f => ({ ...f, roleId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Account Status</label>
                  <div className="flex gap-2">
                    {[true, false].map(val => (
                      <button
                        key={String(val)}
                        onClick={() => setEditForm(f => ({ ...f, isActive: val }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          editForm.isActive === val
                            ? val ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        {val ? '✓ Active' : '✗ Inactive'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extra Permissions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700">
                    Extra Permissions
                    <span className="ml-2 text-gray-400 font-normal">(in addition to role permissions)</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditForm(f => ({ ...f, extraPermissionIds: allPermissions.map(p => p.id) }))}
                      className="text-[10px] font-bold text-blue-600 px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg"
                    >Select All</button>
                    <button
                      onClick={() => setEditForm(f => ({ ...f, extraPermissionIds: [] }))}
                      className="text-[10px] font-bold text-gray-500 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >Clear</button>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 max-h-64 overflow-y-auto space-y-1">
                  {allPermissions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Loading permissions…</p>
                  ) : allPermissions.map(p => {
                    const on = editForm.extraPermissionIds.includes(p.id)
                    return (
                      <div
                        key={p.id}
                        onClick={() => setEditForm(f => ({
                          ...f,
                          extraPermissionIds: on
                            ? f.extraPermissionIds.filter(id => id !== p.id)
                            : [...f.extraPermissionIds, p.id]
                        }))}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer select-none transition-all ${
                          on ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-transparent hover:bg-gray-100'
                        }`}
                      >
                        {on
                          ? <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                          : <Circle size={14} className="text-gray-300 shrink-0" />
                        }
                        <span className={`text-sm font-medium truncate ${on ? 'text-blue-800' : 'text-gray-700'}`}>
                          {p.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  {editForm.extraPermissionIds.length} extra permissions selected
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditUser(null)}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={saving}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
