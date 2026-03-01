'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
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

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [consentido, setConsentido] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)

  function translateError(msg: string): string {
    if (msg.includes('User already registered')) return 'Ya existe una cuenta con este email.'
    if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
    if (msg.includes('Unable to validate email')) return 'El formato del email no es válido.'
    return msg
  }

  async function handleRegister() {
    if (!email || !password || !confirmPassword) { setError('Completa todos los campos.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }
    if (!consentido) { setError('Debes aceptar la política de privacidad y los términos de uso.'); return }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(translateError(error.message))
    } else {
      setRegistered(true)
    }
    setLoading(false)
  }

  if (registered) {
    return (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '4rem', color: '#2d7a2d', letterSpacing: '0.08em', lineHeight: 1, textAlign: 'center', marginBottom: 32 }}>MEALS</div>
        <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', color: '#2d7a2d', letterSpacing: '0.06em', marginBottom: 16 }}>Revisa tu email</div>
          <p style={{ color: '#1a1a1a', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 12 }}>
            Te hemos enviado un correo de confirmación a:
          </p>
          <p style={{ color: '#2d7a2d', fontSize: '1rem', fontWeight: 600, marginBottom: 20, wordBreak: 'break-all' }}>{email}</p>
          <p style={{ color: '#888888', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 24 }}>
            Haz clic en el enlace del email para activar tu cuenta. Una vez confirmado podrás iniciar sesión.
          </p>
          <Link href="/login" style={{ color: '#2d7a2d', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '4rem', color: '#2d7a2d', letterSpacing: '0.08em', lineHeight: 1 }}>MEALS</div>
        <div style={{ color: '#888888', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 4 }}>crear cuenta</div>
      </div>

      {/* Card */}
      <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420 }}>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#888888', marginBottom: 8 }}>Email</div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" style={INPUT} onFocus={focusBorder} onBlur={blurBorder} />
        </div>

        {/* Contraseña */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#888888', marginBottom: 8 }}>Contraseña</div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              style={{ ...INPUT, paddingRight: 44 }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: showPassword ? '#2d7a2d' : '#888888', lineHeight: 0 }}>
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#888888', marginBottom: 8 }}>Confirmar contraseña</div>
          <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la contraseña" autoComplete="new-password" style={INPUT} onFocus={focusBorder} onBlur={blurBorder} onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
        </div>

        {/* Consentimiento */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
          <input
            type="checkbox"
            checked={consentido}
            onChange={(e) => setConsentido(e.target.checked)}
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

        {/* Error */}
        {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>}

        {/* Submit */}
        <button
          onClick={handleRegister}
          disabled={loading || !consentido}
          style={{ width: '100%', background: '#2d7a2d', border: 'none', borderRadius: 8, color: '#ffffff', fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.08em', padding: '12px', cursor: (loading || !consentido) ? 'default' : 'pointer', opacity: (loading || !consentido) ? 0.5 : 1, transition: 'opacity 0.2s' }}
        >
          {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
        </button>

        <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '24px 0' }} />

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888888', margin: 0 }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: '#2d7a2d', fontWeight: 600, textDecoration: 'none' }}>Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
