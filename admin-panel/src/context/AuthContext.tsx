"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  fullName: string
  role?: {
    name: string
    permissions: Array<{ name: string }>
  }
  permissions: string[]
}

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  permissions: string[]
  token: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  permissions: [],
  token: null
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  const fetchProfile = async (session: any) => {
    if (!session) {
      setUser(null)
      setToken(null)
      setIsLoading(false)
      return
    }

    const accessToken = session.access_token
    setToken(accessToken)

    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser({
          ...data,
          permissions: data.role?.permissions?.map((p: any) => p.name) || []
        })
      } else {
        // FALLBACK FOR MOBILE: If API fails, use basic session info
        // This prevents the login loop on mobile devices
        setUser({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || 'Admin User',
          permissions: [] // Basic access
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile, using fallback:', error)
      setUser({
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.user_metadata?.full_name || 'Admin User',
        permissions: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      permissions: user?.permissions || [],
      token
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
