'use client'

import { useState, Suspense, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const INPUT: React.CSSProperties = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  color: '#1a1a1a',
  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
  fontSize: '1rem',
  padding: '12px 14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

function focusBorder(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#2d7a2d'
}
function blurBorder(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#e0e0e0'
}

function SearchParamsReader({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('error') === 'confirmation_failed') {
      onError('El enlace de confirmación no es válido o ha expirado.')
    }
  }, [searchParams, onError])
  return null
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [consentido, setConsentido] = useState(false)
  const router = useRouter()

  // Si Supabase redirige aquí con token de recuperación, redirigir a reset-password
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    if (tokenHash && params.get('type') === 'recovery') {
      router.push(`/auth/reset-password?token_hash=${tokenHash}&type=recovery`)
      return
    }
    // Implicit flow: #access_token=...&type=recovery en el hash
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const hashParams = new URLSearchParams(hash)
    if (hashParams.get('type') !== 'recovery') return
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    if (!accessToken || !refreshToken) return
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(() => router.push('/auth/reset-password'))
  }, [router])

  function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
    if (msg.includes('Email not confirmed')) return 'Debes confirmar tu email antes de iniciar sesión.'
    if (msg.includes('User already registered')) return 'Ya existe una cuenta con este email.'
    if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
    if (msg.includes('Unable to validate email')) return 'El formato del email no es válido.'
    return msg
  }

  async function handleLogin() {
    if (!email || !password) { setError('Completa todos los campos.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(translateError(error.message))
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRegister() {
    if (!email || !password) { setError('Completa todos los campos.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      setError('No se pudo crear la cuenta. Inténtalo de nuevo.')
    } else {
      setRegistered(true)
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) { setError('Introduce tu email.'); return }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/send-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      setError('No se pudo enviar el email. Inténtalo de nuevo.')
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  // ── Pantalla de reset enviado ────────────────────────────────────────────────
  if (resetSent) {
    return (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        <Header />
        <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.4rem', fontWeight: 700, color: '#2d7a2d', marginBottom: 16 }}>
            Revisa tu email
          </div>
          <p style={{ color: '#1a1a1a', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 12 }}>
            Te hemos enviado un enlace para restablecer tu contraseña a (revisa tu carpeta Spam si no te llega):
          </p>
          <p style={{ color: '#2d7a2d', fontSize: '1rem', fontWeight: 600, marginBottom: 20, wordBreak: 'break-all' }}>
            {email}
          </p>
          <p style={{ color: '#888888', fontSize: '0.85rem', lineHeight: 1.7 }}>
            Haz clic en el enlace del email para elegir una nueva contraseña.
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '24px 0' }} />
          <button
            onClick={() => { setResetSent(false); setMode('login'); setEmail(''); setError(null) }}
            style={{ background: 'none', border: 'none', color: '#888888', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2d7a2d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  // ── Pantalla de confirmación pendiente ──────────────────────────────────────
  if (registered) {
    return (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        <Header />
        <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.4rem', fontWeight: 700, color: '#2d7a2d', marginBottom: 16 }}>
            Revisa tu email
          </div>
          <p style={{ color: '#1a1a1a', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 12 }}>
            Te hemos enviado un correo de confirmación a (revisa tu carpeta Spam si no te llega):
          </p>
          <p style={{ color: '#2d7a2d', fontSize: '1rem', fontWeight: 600, marginBottom: 20, wordBreak: 'break-all' }}>
            {email}
          </p>
          <p style={{ color: '#888888', fontSize: '0.85rem', lineHeight: 1.7 }}>
            Haz clic en el enlace del email para activar tu cuenta. Una vez confirmado podrás iniciar sesión.
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '24px 0' }} />
          <button
            onClick={() => { setRegistered(false); setMode('login') }}
            style={{ background: 'none', border: 'none', color: '#888888', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2d7a2d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  // ── Formulario principal ────────────────────────────────────────────────────
  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      <Suspense fallback={null}>
        <SearchParamsReader onError={msg => setError(msg)} />
      </Suspense>
      <Header subtitle={mode === 'forgot' ? 'restablecer contraseña' : 'planifica tus comidas'} />

      {/* Card */}
      <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420 }}>

        {/* Tabs */}
        {mode !== 'forgot' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
            <TabBtn active={mode === 'login'} onClick={() => { setMode('login'); setError(null); setConsentido(false) }}>Entrar</TabBtn>
            <TabBtn active={mode === 'register'} onClick={() => { setMode('register'); setError(null); setConsentido(false) }}>Crear cuenta</TabBtn>
          </div>
        )}

        {/* Título modo forgot */}
        {mode === 'forgot' && (
          <p style={{ color: '#888888', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 20px' }}>
            Introduce tu email y te enviaremos un enlace para elegir una nueva contraseña.
          </p>
        )}

        {/* Email */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#888888', marginBottom: 8 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            style={INPUT}
            onFocus={focusBorder}
            onBlur={blurBorder}
            onKeyDown={e => {
              if (e.key !== 'Enter') return
              if (mode === 'login') handleLogin()
              else if (mode === 'register') handleRegister()
              else handleForgotPassword()
            }}
          />
        </div>

        {/* Contraseña (login y register) */}
        {mode !== 'forgot' && (
          <div style={{ marginBottom: mode === 'register' ? 12 : 8 }}>
            <div style={{ fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#888888', marginBottom: 8 }}>Contraseña</div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{ ...INPUT, paddingRight: 44 }}
                onFocus={focusBorder}
                onBlur={blurBorder}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: showPassword ? '#2d7a2d' : '#888888', lineHeight: 0 }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ¿Olvidaste tu contraseña? (solo en login) */}
        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <button
              onClick={() => { setMode('forgot'); setError(null) }}
              style={{ background: 'none', border: 'none', color: '#888888', fontSize: '0.8rem', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#2d7a2d')}
              onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {/* Nota registro */}
        {mode === 'register' && (
          <p style={{ color: '#888888', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 12 }}>
            Recibirás un email para confirmar tu cuenta antes de poder acceder.
          </p>
        )}

        {/* Consentimiento */}
        {mode === 'register' && (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={consentido}
              onChange={e => setConsentido(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: '#2d7a2d', flexShrink: 0, cursor: 'pointer' }}
            />
            <span style={{ color: '#888888', fontSize: '0.82rem', lineHeight: 1.6 }}>
              He leído y acepto la{' '}
              <Link href="/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: '#2d7a2d', textDecoration: 'underline' }}>
                Política de Privacidad
              </Link>
              {' '}y los{' '}
              <Link href="/terminos" target="_blank" rel="noopener noreferrer" style={{ color: '#2d7a2d', textDecoration: 'underline' }}>
                Términos de Uso
              </Link>
              {' '}de Meals.
            </span>
          </label>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>
        )}

        {/* Submit */}
        <SubmitBtn
          label={mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear cuenta' : 'Enviar enlace'}
          loading={loading}
          disabled={mode === 'register' && !consentido}
          onClick={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword}
        />

        {/* Volver desde forgot */}
        {mode === 'forgot' && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => { setMode('login'); setError(null) }}
              style={{ background: 'none', border: 'none', color: '#888888', fontSize: '0.8rem', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#2d7a2d')}
              onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Header({ subtitle = 'planifica tus comidas' }: { subtitle?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '2.8rem', fontWeight: 800, color: '#2d7a2d', letterSpacing: 0, lineHeight: 1 }}>
        MEALS
      </div>
      <div style={{ color: '#888888', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 4 }}>
        {subtitle}
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 0',
        background: active ? '#2d7a2d' : 'none',
        border: `1px solid ${active ? '#2d7a2d' : '#e0e0e0'}`,
        borderRadius: 8,
        color: active ? '#ffffff' : '#888888',
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}

function SubmitBtn({ label, loading, disabled, onClick }: { label: string; loading: boolean; disabled?: boolean; onClick: () => void }) {
  const isDisabled = loading || disabled
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        width: '100%', background: '#2d7a2d', border: 'none', borderRadius: 8,
        color: '#ffffff', fontFamily: 'var(--font-dm-sans)', fontWeight: 700,
        fontSize: '1rem', padding: '12px',
        cursor: isDisabled ? 'default' : 'pointer',
        opacity: isDisabled ? 0.5 : 1, transition: 'opacity 0.2s',
      }}
    >
      {loading ? '...' : label.toUpperCase()}
    </button>
  )
}
