import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Page from '../components/Page'
import { useAuth } from '../auth/AuthProvider'
import { insforge } from '../lib/insforge'
import { errorCls, inputCls, noticeCls, roleLabel } from '../lib/ui'

export default function Usuarios() {
  const { user, role, loading } = useAuth()
  const [people, setPeople] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const { data, error: err } = await insforge.database
      .from('profiles')
      .select('id, full_name, email, role, birth_date, created_at')
      .order('full_name')
    if (err) setError(err.message)
    else setPeople(data ?? [])
  }, [])

  useEffect(() => {
    if (role === 'admin') void load()
  }, [load, role])

  if (!loading && role !== 'admin') return <Navigate to="/" replace />

  async function changeRole(id, role) {
    setError('')
    setNotice('')
    const { error: err } = await insforge.database.from('profiles').update({ role }).eq('id', id)
    if (err) setError(err.message)
    else {
      setNotice('Rol actualizado')
      await load()
    }
  }

  async function changeBirth(id, birth_date) {
    setError('')
    const { error: err } = await insforge.database.from('profiles').update({ birth_date }).eq('id', id)
    if (err) setError(err.message)
    else await load()
  }

  return (
    <Page
      title="Usuarios"
      subtitle="Roles del club: administrador, entrenador y alumno"
    >
      {error && <p className={errorCls}>{error}</p>}
      {notice && <p className={`${noticeCls} mt-3`}>{notice}</p>}

      <div className="mt-5 overflow-x-auto rounded-[24px] border border-black/8">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="bg-[#EDF7FF] text-[13px] font-semibold text-black/60">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Nacimiento</th>
              <th className="px-4 py-3">Rol</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-t border-black/8">
                <td className="px-4 py-3 text-[14px] font-medium text-black">
                  {p.full_name || '—'}
                  {p.id === user?.id && <span className="ml-2 text-[11px] text-[#0263E8]">(tú)</span>}
                </td>
                <td className="px-4 py-3 text-[13.5px] text-black/60">{p.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    className={`${inputCls} w-[150px]`}
                    value={p.birth_date ?? ''}
                    onChange={(e) => changeBirth(p.id, e.target.value || null)}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    className={`${inputCls} w-[165px]`}
                    value={p.role}
                    disabled={p.id === user?.id}
                    onChange={(e) => changeRole(p.id, e.target.value)}
                  >
                    {Object.entries(roleLabel).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {people.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-[14px] text-black/45">
                  Cargando usuarios…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[12.5px] text-black/45">
        Los alumnos nuevos se registran con el rol “Alumno”. Promuévelos a “Entrenador” para que puedan tener
        equipos (máximo 3). No puedes cambiar tu propio rol para evitar bloqueos.
      </p>
    </Page>
  )
}
