import Link from 'next/link'

export default function TerminosPage() {
  const H1: React.CSSProperties = {
    fontFamily: 'var(--font-bebas)',
    fontSize: '2.6rem',
    color: '#2d7a2d',
    letterSpacing: '0.06em',
    marginBottom: 4,
  }
  const H2: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginTop: 28,
    marginBottom: 8,
  }
  const P: React.CSSProperties = {
    color: '#444444',
    fontSize: '0.9rem',
    lineHeight: 1.75,
    marginBottom: 0,
  }

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '48px 16px 80px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 680 }}>

        <div style={H1}>Términos de Uso</div>
        <p style={{ color: '#888888', fontSize: '0.8rem', letterSpacing: 1, marginBottom: 32 }}>Última actualización: marzo de 2026</p>

        <h2 style={H2}>1. Aceptación de los términos</h2>
        <p style={P}>Al registrarte y usar Meals, aceptas íntegramente estos Términos de Uso.</p>

        <h2 style={H2}>2. Descripción del servicio</h2>
        <p style={P}>Meals es una aplicación web de uso personal para planificar semanalmente las comidas del almuerzo. El servicio se presta de forma gratuita para uso personal y no comercial.</p>

        <h2 style={H2}>3. Responsabilidad del usuario</h2>
        <p style={P}>El usuario es responsable de los datos que introduce en la aplicación. Meals no valida ni verifica el contenido de las planificaciones registradas.</p>

        <h2 style={H2}>4. Disponibilidad del servicio</h2>
        <p style={P}>No garantizamos una disponibilidad continua del servicio. Podemos interrumpirlo temporalmente por mantenimiento, actualizaciones o causas ajenas a nuestra voluntad, sin que ello genere derecho a compensación alguna.</p>

        <h2 style={H2}>5. Proveedores de infraestructura</h2>
        <p style={P}>El servicio se apoya en los siguientes proveedores técnicos: Supabase (base de datos y autenticación), Vercel (alojamiento) y Anthropic (tecnología de inteligencia artificial para el desarrollo de la aplicación).</p>

        <h2 style={H2}>6. Modificaciones del servicio</h2>
        <p style={P}>Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento.</p>

        <h2 style={H2}>7. Limitación de responsabilidad</h2>
        <p style={P}>Meals se proporciona &apos;tal cual&apos;, sin garantías de ningún tipo. No seremos responsables de daños derivados del uso o la imposibilidad de uso de la aplicación.</p>

        <h2 style={H2}>8. Ley aplicable</h2>
        <p style={P}>Estos términos se rigen por la legislación española.</p>

        <div style={{ marginTop: 48 }}>
          <Link href="/login" style={{ color: '#2d7a2d', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
            ← Volver
          </Link>
        </div>
      </div>
    </div>
  )
}
