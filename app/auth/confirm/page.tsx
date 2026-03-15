'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    const type = params.get('type')

    if (tokenHash && type === 'signup') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'signup' })
        .then(({ error }) => {
          if (error) router.replace('/login?error=confirmation_failed')
          else router.replace('/')
        })
      return
    }

    router.replace('/login?error=confirmation_failed')
  }, [router])

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      <p style={{ color: '#888888', fontSize: '0.9rem', letterSpacing: 1 }}>Confirmando cuenta...</p>
    </div>
  )
}
