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
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()

  function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
    if (msg.includes('Email not confirmed')) return 'Debes confirmar tu email antes de iniciar sesión.'
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

  async function handleForgotPassword() {
    if (!email) { setError('Introduce tu email.'); return }
    setLoading(true)
    setError(null)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
    })
    if (error) {
      setError(translateError(error.message))
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  if (resetSent) {
    return (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '2.8rem', fontWeight: 800, color: '#2d7a2d', textAlign: 'center', marginBottom: 32 }}>MEALS</div>
        <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.4rem', fontWeight: 700, color: '#2d7a2d', marginBottom: 16 }}>Revisa tu email</div>
          <p style={{ color: '#1a1a1a', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 12 }}>
            Te hemos enviado un enlace para restablecer tu contraseña a:
          </p>
          <p style={{ color: '#2d7a2d', fontSize: '1rem', fontWeight: 600, marginBottom: 20, wordBreak: 'break-all' }}>{email}</p>
          <p style={{ color: '#888888', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 24 }}>
            Haz clic en el enlace del email para elegir una nueva contraseña.
          </p>
          <button
            onClick={() => { setResetSent(false); setMode('login'); setEmail(''); setError(null) }}
            style={{ background: 'none', border: 'none', color: '#2d7a2d', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      <Suspense fallback={null}>
        <SearchParamsReader onError={(msg) => setError(msg)} />
      </Suspense>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '2.8rem', fontWeight: 800, color: '#2d7a2d', letterSpacing: 0, lineHeight: 1 }}>
          MEALS
        </div>
        <div style={{ color: '#888888', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 4 }}>
          {mode === 'forgot' ? 'restablecer contraseña' : 'planifica tus comidas'}
        </div>
      </div>

      {/* Card */}
      <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420 }}>

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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            style={INPUT}
            onFocus={focusBorder}
            onBlur={blurBorder}
            onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleForgotPassword())}
          />
        </div>

        {/* Contraseña (solo en login) */}
        {mode === 'login' && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#888888', marginBottom: 8 }}>Contraseña</div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                style={{ ...INPUT, paddingRight: 44 }}
                onFocus={focusBorder}
                onBlur={blurBorder}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
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

        {/* Error */}
        {error && (
          <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={mode === 'login' ? handleLogin : handleForgotPassword}
          disabled={loading}
          style={{ width: '100%', background: '#2d7a2d', border: 'none', borderRadius: 8, color: '#ffffff', fontFamily: 'var(--font-dm-sans)', fontWeight: 700, fontSize: '1rem', letterSpacing: 0, padding: '12px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}
        >
          {loading ? '...' : mode === 'login' ? 'ENTRAR' : 'ENVIAR ENLACE'}
        </button>

        <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '24px 0' }} />

        {mode === 'login' ? (
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888888', margin: 0 }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: '#2d7a2d', fontWeight: 600, textDecoration: 'none' }}>
              Crear cuenta
            </Link>
          </p>
        ) : (
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888888', margin: 0 }}>
            <button
              onClick={() => { setMode('login'); setError(null) }}
              style={{ background: 'none', border: 'none', color: '#2d7a2d', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Volver al inicio de sesión
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
