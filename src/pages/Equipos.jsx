import { useCallback, useEffect, useMemo, useState } from 'react'
import Page from '../components/Page'
import { useAuth } from '../auth/AuthProvider'
import { insforge } from '../lib/insforge'
import { ageFrom } from '../lib/format'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  cardCls,
  errorCls,
  inputCls,
  modalBackdrop,
  modalCard,
  noticeCls,
  roleLabel,
} from '../lib/ui'

export default function Equipos() {
  const { user, role } = useAuth()
  const isAdmin = role === 'admin'
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [people, setPeople] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(null) // { id?, name, age_min, age_max, coach_id }
  const [openTeam, setOpenTeam] = useState(null)
  const [addStudent, setAddStudent] = useState({ student_id: '', birth_date: '' })

  const load = useCallback(async () => {
    const [t, m, p] = await Promise.all([
      insforge.database.from('teams').select('id, name, age_min, age_max, coach_id, created_at').order('created_at'),
      insforge.database
        .from('team_members')
        .select('team_id, student_id, student:student_id(full_name, birth_date)'),
      insforge.database.from('profiles').select('id, full_name, role, birth_date').order('full_name'),
    ])
    if (t.error) setError(t.error.message)
    else setTeams(t.data ?? [])
    setMembers(m.data ?? [])
    setPeople(p.data ?? [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const coachName = useCallback(
    (id) => people.find((p) => p.id === id)?.full_name ?? '—',
    [people],
  )

  const membersByTeam = useMemo(() => {
    const map = {}
    for (const m of members) {
      ;(map[m.team_id] ??= []).push(m)
    }
    return map
  }, [members])

  const teamCountByCoach = useMemo(() => {
    const map = {}
    for (const t of teams) {
      if (t.coach_id) map[t.coach_id] = (map[t.coach_id] ?? 0) + 1
    }
    return map
  }, [teams])

  function canManage(team) {
    return isAdmin || team.coach_id === user?.id
  }

  function openNew() {
    setError('')
    setForm({
      name: '',
      age_min: 8,
      age_max: 10,
      coach_id: isAdmin ? '' : (teams.find((t) => t.coach_id === user?.id)?.coach_id ?? user?.id),
    })
  }

  function openEdit(team) {
    setError('')
    setForm({ id: team.id, name: team.name, age_min: team.age_min, age_max: team.age_max, coach_id: team.coach_id ?? '' })
  }

  async function saveTeam(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const coachId = isAdmin ? form.coach_id || null : user.id
    const payload = { name: form.name.trim(), age_min: Number(form.age_min), age_max: Number(form.age_max), coach_id: coachId }
    if (!payload.name) return setError('Ponle un nombre al equipo')
    if (payload.age_max < payload.age_min) return setError('La edad máxima debe ser mayor o igual a la mínima')
    if (isAdmin && !payload.coach_id) return setError('Asigna un entrenador')
    const { error: err } = form.id
      ? await insforge.database.from('teams').update(payload).eq('id', form.id)
      : await insforge.database.from('teams').insert([payload])
    if (err) {
      setError(err.message)
      return
    }
    setForm(null)
    setNotice(form.id ? 'Equipo actualizado' : 'Equipo creado')
    await load()
  }

  async function removeTeam(team) {
    if (!window.confirm(`¿Eliminar el equipo "${team.name}" y sus inscripciones?`)) return
    setError('')
    const { error: err } = await insforge.database.from('teams').delete().eq('id', team.id)
    if (err) setError(err.message)
    else {
      setNotice('Equipo eliminado')
      if (openTeam === team.id) setOpenTeam(null)
      await load()
    }
  }

  async function addMember(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!addStudent.student_id) return setError('Selecciona un alumno')
    const person = people.find((p) => p.id === addStudent.student_id)
    if (!person) return setError('Alumno no encontrado')
    if (!person.birth_date) {
      if (!addStudent.birth_date) return setError('Este alumno no tiene fecha de nacimiento: indícala aquí')
      const { error: e1 } = await insforge.database
        .from('profiles')
        .update({ birth_date: addStudent.birth_date })
        .eq('id', person.id)
      if (e1) return setError(e1.message)
    }
    const { error: e2 } = await insforge.database
      .from('team_members')
      .insert([{ team_id: openTeam, student_id: addStudent.student_id }])
    if (e2) return setError(e2.message)
    setNotice('Alumno inscrito')
    setAddStudent({ student_id: '', birth_date: '' })
    await load()
  }

  async function removeMember(member) {
    setError('')
    const { error: err } = await insforge.database
      .from('team_members')
      .delete()
      .eq('team_id', member.team_id)
      .eq('student_id', member.student_id)
    if (err) setError(err.message)
    else await load()
  }

  const coaches = people.filter((p) => p.role === 'coach' || p.role === 'admin')
  const openTeamObj = teams.find((t) => t.id === openTeam)
  const roster = openTeam ? (membersByTeam[openTeam] ?? []) : []
  const rosterIds = new Set(roster.map((m) => m.student_id))
  const students = people.filter((p) => p.role === 'student')
  const availableStudents = students.filter((p) => !rosterIds.has(p.id))
  const selectedPerson = people.find((p) => p.id === addStudent.student_id)
  const needsBirth = selectedPerson && !selectedPerson.birth_date

  const newTeamBlocked = (coachId) => (teamCountByCoach[coachId] ?? 0) >= 3

  return (
    <Page
      title="Equipos"
      subtitle="Categorías por edad · máximo 3 equipos por entrenador"
      actions={
        <button
          type="button"
          onClick={openNew}
          disabled={!isAdmin && newTeamBlocked(user?.id)}
          className={btnPrimary}
        >
          + Nuevo equipo
        </button>
      }
    >
      {error && <p className={errorCls}>{error}</p>}
      {notice && <p className={`${noticeCls} mt-3`}>{notice}</p>}
      {!isAdmin && newTeamBlocked(user?.id) && (
        <p className="mt-3 text-[13px] text-black/50">Este entrenador ya tiene 3 equipos (máximo permitido).</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 min-[1666px]:grid-cols-2">
        {teams.map((team) => {
          const count = (membersByTeam[team.id] ?? []).length
          const manage = canManage(team)
          return (
            <div key={team.id} className={cardCls}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[19px] font-bold text-black">{team.name}</h2>
                  <p className="mt-1 text-[13px] text-black/55">
                    {team.age_min}–{team.age_max} años · {count} alumno{count === 1 ? '' : 's'}
                  </p>
                  <p className="mt-0.5 text-[13px] text-black/55">
                    Entrenador: <span className="font-medium text-black/75">{coachName(team.coach_id)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => setOpenTeam(openTeam === team.id ? null : team.id)}
                  >
                    {openTeam === team.id ? 'Cerrar roster' : 'Ver roster'}
                  </button>
                  {manage && (
                    <div className="flex gap-2">
                      <button type="button" className={btnGhost} onClick={() => openEdit(team)}>
                        Editar
                      </button>
                      {isAdmin && (
                        <button type="button" className={btnDanger} onClick={() => removeTeam(team)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {openTeam === team.id && (
                <div className="mt-4 border-t border-black/8 pt-4">
                  <ul className="flex flex-col gap-2">
                    {roster.length === 0 && <li className="text-[13px] text-black/45">Sin alumnos inscritos.</li>}
                    {roster.map((m) => {
                      const age = ageFrom(m.student?.birth_date)
                      return (
                        <li
                          key={m.student_id}
                          className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5"
                        >
                          <span className="text-[14px] font-medium text-black">{m.student?.full_name ?? '—'}</span>
                          <span className="flex items-center gap-3 text-[13px] text-black/55">
                            {age != null ? `${age} años` : 'sin fecha'}
                            {manage && (
                              <button
                                type="button"
                                className="text-red-500 hover:underline"
                                onClick={() => removeMember(m)}
                              >
                                Quitar
                              </button>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>

                  {manage && (
                    <form onSubmit={addMember} className="mt-4 flex flex-wrap items-end gap-3">
                      <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-[12px] font-medium text-black/60">
                        Añadir alumno
                        <select
                          className={inputCls}
                          value={addStudent.student_id}
                          onChange={(e) => setAddStudent((s) => ({ ...s, student_id: e.target.value }))}
                        >
                          <option value="">Selecciona…</option>
                          {availableStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name || s.email || s.id.slice(0, 8)}
                            </option>
                          ))}
                        </select>
                      </label>
                      {needsBirth && (
                        <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                          Nacimiento
                          <input
                            type="date"
                            className={inputCls}
                            value={addStudent.birth_date}
                            onChange={(e) => setAddStudent((s) => ({ ...s, birth_date: e.target.value }))}
                          />
                        </label>
                      )}
                      <button type="submit" className={btnPrimary}>
                        Inscribir
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {teams.length === 0 && (
          <p className="text-[15px] text-black/50">Aún no hay equipos. Crea el primero con “+ Nuevo equipo”.</p>
        )}
      </div>

      {form && (
        <div className={modalBackdrop} onClick={() => setForm(null)}>
          <form className={modalCard} onClick={(e) => e.stopPropagation()} onSubmit={saveTeam}>
            <h2 className="text-[22px] font-black italic text-black">{form.id ? 'Editar equipo' : 'Nuevo equipo'}</h2>
            <div className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                Nombre
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Sub-10"
                  autoFocus
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-[12px] font-medium text-black/60">
                  Edad mínima
                  <input
                    type="number"
                    min="3"
                    max="25"
                    className={inputCls}
                    value={form.age_min}
                    onChange={(e) => setForm((f) => ({ ...f, age_min: e.target.value }))}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-[12px] font-medium text-black/60">
                  Edad máxima
                  <input
                    type="number"
                    min="3"
                    max="25"
                    className={inputCls}
                    value={form.age_max}
                    onChange={(e) => setForm((f) => ({ ...f, age_max: e.target.value }))}
                  />
                </label>
              </div>
              {isAdmin ? (
                <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                  Entrenador
                  <select
                    className={inputCls}
                    value={form.coach_id}
                    onChange={(e) => setForm((f) => ({ ...f, coach_id: e.target.value }))}
                  >
                    <option value="">Selecciona…</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name || c.id.slice(0, 8)} ({roleLabel[c.role]})
                        {(teamCountByCoach[c.id] ?? 0) >= 3 ? ' — límite 3' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="text-[13px] text-black/55">Entrenador: tú</p>
              )}
            </div>
            {error && <p className={`${errorCls} mt-4`}>{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className={btnGhost} onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className={btnPrimary}>
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {openTeamObj && (
        <p className="mt-6 text-[12px] text-black/40">
          Roster abierto: {openTeamObj.name} · {roster.length} inscritos
        </p>
      )}
    </Page>
  )
}
