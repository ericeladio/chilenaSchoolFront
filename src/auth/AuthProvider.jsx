import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { insforge } from '../lib/insforge'

const AuthContext = createContext(null)

const PROFILE_FIELDS = 'id, full_name, email, role, birth_date'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (u) => {
    if (!u) {
      setProfile(null)
      return
    }
    const { data } = await insforge.database
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', u.id)
      .maybeSingle()
    if (data) {
      setProfile(data)
      return
    }
    const fullName =
      u.name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Usuario')
    const { data: created } = await insforge.database
      .from('profiles')
      .insert([{ id: u.id, full_name: fullName, email: u.email }])
      .select(PROFILE_FIELDS)
      .maybeSingle()
    if (created) {
      setProfile(created)
      return
    }
    const { data: again } = await insforge.database
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', u.id)
      .maybeSingle()
    setProfile(again ?? null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data } = await insforge.auth.getCurrentUser()
    const u = data?.user ?? null
    setUser(u)
    await loadProfile(u)
    return u
  }, [loadProfile])

  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      const { data } = await insforge.auth.getCurrentUser()
      if (cancelled) return
      const u = data?.user ?? null
      setUser(u)
      await loadProfile(u)
      if (!cancelled) setLoading(false)
    }
    void hydrate()
    return () => {
      cancelled = true
    }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    await insforge.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, role: profile?.role ?? null, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
