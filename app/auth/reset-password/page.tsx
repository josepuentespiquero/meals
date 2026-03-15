'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    const type = params.get('type')

    if (tokenHash && type === 'recovery') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        .then(({ error }) => {
          if (error) router.replace('/login?error=confirmation_failed')
          else setChecking(false)
        })
      return
    }

    // Sesión ya activa (recarga de página)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setChecking(false)
      else router.replace('/login?error=confirmation_failed')
    })
  }, [router])

  async function handleSubmit() {
    if (!password) { setError('Introduce una contraseña.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/'), 2500)
    }
  }

  if (checking) {
    return (
      <PageShell>
        <p style={{ color: '#888888', fontSize: '0.9rem', textAlign: 'center' }}>Verificando sesión...</p>
      </PageShell>
    )
  }

  if (done) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.4rem', fontWeight: 700, color: '#2d7a2d', marginBottom: 12 }}>
            Contraseña actualizada
          </div>
          <p style={{ color: '#888888', fontSize: '0.9rem', lineHeight: 1.7 }}>Redirigiendo al inicio...</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.2rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>
        Nueva contraseña
      </div>
      <p style={{ color: '#888888', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 24px' }}>
        Elige una contraseña nueva para tu cuenta.
      </p>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#888888', marginBottom: 8 }}>
          Contraseña nueva
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            style={{ ...INPUT, paddingRight: 44 }}
            onFocus={focusBorder}
            onBlur={blurBorder}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            tabIndex={-1}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: showPass ? '#2d7a2d' : '#888888', lineHeight: 0 }}
          >
            {showPass ? (
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

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#888888', marginBottom: 8 }}>
          Confirmar contraseña
        </div>
        <input
          type={showPass ? 'text' : 'password'}
          value={password2}
          onChange={e => setPassword2(e.target.value)}
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          style={INPUT}
          onFocus={focusBorder}
          onBlur={blurBorder}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ width: '100%', background: '#2d7a2d', border: 'none', borderRadius: 8, color: '#ffffff', fontFamily: 'var(--font-dm-sans)', fontWeight: 700, fontSize: '1rem', padding: '12px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}
      >
        {loading ? '...' : 'GUARDAR CONTRASEÑA'}
      </button>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '2.8rem', fontWeight: 800, color: '#2d7a2d', textAlign: 'center', marginBottom: 32 }}>MEALS</div>
      <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420 }}>
        {children}
      </div>
    </div>
  )
}
