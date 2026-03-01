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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      <Suspense fallback={null}>
        <SearchParamsReader onError={(msg) => setError(msg)} />
      </Suspense>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '4rem', color: '#2d7a2d', letterSpacing: '0.08em', lineHeight: 1 }}>
          MEALS
        </div>
        <div style={{ color: '#888888', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 4 }}>
          planifica tus comidas
        </div>
      </div>

      {/* Card */}
      <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420 }}>

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
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {/* Contraseña */}
        <div style={{ marginBottom: 24 }}>
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

        {/* Error */}
        {error && (
          <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', background: '#2d7a2d', border: 'none', borderRadius: 8, color: '#ffffff', fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.08em', padding: '12px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}
        >
          {loading ? 'ENTRANDO...' : 'ENTRAR'}
        </button>

        <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '24px 0' }} />

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888888', margin: 0 }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: '#2d7a2d', fontWeight: 600, textDecoration: 'none' }}>
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}
