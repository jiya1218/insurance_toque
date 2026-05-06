import { supabase } from './supabase'

export async function fetchApi(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${session?.access_token}`,
    ...((options.headers as Record<string, string>) || {}),
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(path, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'An unknown error occurred' }))
    throw new Error(error.error || `HTTP error! status: ${res.status}`)
  }

  return res.json()
}
