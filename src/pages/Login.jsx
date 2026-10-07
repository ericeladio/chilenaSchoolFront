import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { insforge } from '../lib/insforge'
import { useAuth } from '../auth/AuthProvider'

function Brand() {
  return (
    <div className="flex items-center justify-center gap-[7px]">
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="size-[52px] shrink-0">
        <path
          d="M48.1202 12.7996C45.8062 10.4672 43.0525 8.61707 40.0186 7.35629C36.9846 6.0955 33.7307 5.44912 30.4452 5.45456C27.159 5.44942 23.9044 6.09592 20.8697 7.35667C17.835 8.61742 15.0804 10.4674 12.7652 12.7996C3.01771 22.5446 3.01771 38.4071 12.7652 48.1546C15.0804 50.4874 17.8354 52.3377 20.8706 53.5985C23.9059 54.8593 27.161 55.5055 30.4477 55.4996C33.733 55.5053 36.9868 54.8593 40.0208 53.599C43.0547 52.3386 45.8085 50.489 48.1227 48.1571C57.8702 38.4121 57.8702 22.5496 48.1202 12.7996ZM46.0502 42.9771H40.4427L37.2977 49.2671C35.1038 50.0776 32.7841 50.4948 30.4452 50.4996C28.102 50.4953 25.778 50.0772 23.5802 49.2646L20.4427 43.0021H14.8552C12.7938 40.4393 11.3997 37.4055 10.7977 34.1721L15.4427 27.9771L12.4027 21.8946C13.3727 19.831 14.6912 17.9502 16.3002 16.3346C18.5522 14.0747 21.3124 12.3868 24.3502 11.4121L30.4427 15.4771L36.5377 11.4146C39.5746 12.39 42.3345 14.0768 44.5877 16.3346C46.195 17.9482 47.5125 19.8265 48.4827 21.8871L45.4427 27.9771L50.0877 34.1721C49.4884 37.3951 48.1014 40.4198 46.0502 42.9771Z"
          fill="black"
          fillOpacity="0.75"
        />
        <path d="M21.25 27.5L25 37.5H35L38.75 27.5L30 21.25L21.25 27.5Z" fill="black" fillOpacity="0.75" />
      </svg>
      <span className="h-5 w-[2px] shrink-0 bg-black/40" />
      <span className="font-['Sansita_One'] text-[30px] italic tracking-[-0.5px] text-black/75">Chilena Club</span>
    </div>
  )
}

const inputCls =
  'w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-[15px] text-black outline-none transition-colors focus:border-[#0263E8]'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { user, loading, refreshProfile } = useAuth()

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [user, loading, navigate])

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: err } = await insforge.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (err) {
      if (err.statusCode === 403) {
        setError('Tu correo aún no está verificado. Revisa tu bandeja de entrada.')
      } else {
        setError(err.message || 'No se pudo iniciar sesión')
      }
      return
    }
    await refreshProfile()
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    const { data, error: err } = await insforge.auth.signUp({ email, password, name })
    setBusy(false)
    if (err) {
      setError(err.message || 'No se pudo crear la cuenta')
      return
    }
    if (data?.requireEmailVerification) {
      setInfo('Enviamos un código de 6 dígitos a tu correo. Introdúcelo para terminar.')
      setMode('verify')
      return
    }
    await refreshProfile()
  }

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: err } = await insforge.auth.verifyEmail({ email, otp })
    setBusy(false)
    if (err) {
      setError(err.message || 'Código inválido o expirado')
      return
    }
    await refreshProfile()
  }

  async function handleResend() {
    setError('')
    const { error: err } = await insforge.auth.resendVerificationEmail({ email })
    if (err) setError(err.message || 'No se pudo reenviar el código')
    else setInfo('Código reenviado. Revisa tu correo.')
  }

  async function handleGoogle() {
    setError('')
    setBusy(true)
    const { error: err } = await insforge.auth.signInWithOAuth('google', {
      redirectTo: `${window.location.origin}/`,
    })
    setBusy(false)
    if (err) setError(err.message || 'No se pudo iniciar con Google')
  }

  return (
    <div className="flex min-h-screen items-center justify-center rounded-[64px] bg-[#EDF7FF] p-6">
      <div className="w-full max-w-[440px] rounded-[40px] bg-[#CAE4FF] p-8 shadow-[0_20px_60px_rgba(2,99,232,0.15)]">
        <Brand />

        <div className="mt-7 flex gap-2">
          {[
            ['signin', 'Iniciar sesión'],
            ['signup', 'Crear cuenta'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key)
                setError('')
                setInfo('')
              }}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                mode === key || (mode === 'verify' && key === 'signup')
                  ? 'bg-[#EDF7FF] text-black'
                  : 'text-black/55 hover:text-black/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'verify' ? (
          <form onSubmit={handleVerify} className="mt-6 flex flex-col gap-3">
            <p className="text-[13px] leading-[18px] text-black/70">{info}</p>
            <input
              className={inputCls}
              placeholder="Código de 6 dígitos"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoFocus
            />
            <button
              type="submit"
              disabled={busy || otp.length !== 6}
              className="rounded-2xl bg-[#0263E8] px-4 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Verificar
            </button>
            <div className="flex justify-between text-[13px]">
              <button type="button" onClick={handleResend} className="font-medium text-[#0263E8] hover:underline">
                Reenviar código
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setInfo('')
                  setError('')
                }}
                className="text-black/60 hover:text-black"
              >
                Volver
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="mt-6 flex flex-col gap-3">
            {mode === 'signup' && (
              <input
                className={inputCls}
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            )}
            <input
              className={inputCls}
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className={inputCls}
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
            <button
              type="submit"
              disabled={busy || !email || password.length < 6 || (mode === 'signup' && !name)}
              className="rounded-2xl bg-[#0263E8] px-4 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        )}

        {mode !== 'verify' && (
          <>
            <div className="my-4 flex items-center gap-3 text-[12px] text-black/45">
              <span className="h-px flex-1 bg-black/15" />
              o
              <span className="h-px flex-1 bg-black/15" />
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/15 bg-white px-4 py-3 text-[15px] font-medium text-black transition-colors hover:bg-black/5 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
              </svg>
              Continuar con Google
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-2.5 text-[13px] leading-[18px] text-red-600">{error}</p>
        )}
        {mode !== 'verify' && info && (
          <p className="mt-4 rounded-2xl bg-white/70 px-4 py-2.5 text-[13px] leading-[18px] text-black/70">{info}</p>
        )}
      </div>
    </div>
  )
}
