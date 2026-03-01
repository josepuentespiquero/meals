import Link from 'next/link'

export default function PrivacidadPage() {
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

        <div style={H1}>Política de Privacidad</div>
        <p style={{ color: '#888888', fontSize: '0.8rem', letterSpacing: 1, marginBottom: 32 }}>Última actualización: marzo de 2026</p>

        <h2 style={H2}>1. ¿Quién es el responsable del tratamiento?</h2>
        <p style={P}>El responsable del tratamiento es el equipo desarrollador de Meals. Para cualquier consulta, puedes contactarnos en: <a href="mailto:appgymlog@gmail.com" style={{ color: '#2d7a2d' }}>appgymlog@gmail.com</a></p>

        <h2 style={H2}>2. ¿Qué datos recogemos?</h2>
        <p style={P}>Al usar Meals recopilamos los siguientes datos:</p>
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li style={{ ...P, marginBottom: 4 }}><strong>Datos de registro:</strong> dirección de correo electrónico y contraseña (almacenada cifrada).</li>
          <li style={{ ...P, marginBottom: 4 }}><strong>Datos de planificación:</strong> planificaciones semanales de comidas (almuerzo) y categorías de comidas que configures.</li>
        </ul>

        <h2 style={H2}>3. ¿Para qué usamos tus datos?</h2>
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li style={{ ...P, marginBottom: 4 }}>Prestarte el servicio de planificación semanal de comidas.</li>
          <li style={{ ...P, marginBottom: 4 }}>Mantener tu historial de comidas para generar sugerencias personalizadas.</li>
        </ul>

        <h2 style={H2}>4. ¿Compartimos tus datos con terceros?</h2>
        <p style={P}>No vendemos ni compartimos tus datos personales con terceros. Utilizamos los siguientes proveedores de infraestructura técnica:</p>
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li style={{ ...P, marginBottom: 4 }}><strong>Supabase</strong> — base de datos y autenticación.</li>
          <li style={{ ...P, marginBottom: 4 }}><strong>Vercel</strong> — alojamiento web.</li>
        </ul>

        <h2 style={H2}>5. ¿Durante cuánto tiempo conservamos tus datos?</h2>
        <p style={P}>Conservamos tus datos mientras mantengas tu cuenta activa. Si eliminas tu cuenta, borraremos tus datos en un plazo máximo de 30 días.</p>

        <h2 style={H2}>6. ¿Cuáles son tus derechos?</h2>
        <p style={P}>Tienes derecho a acceder, rectificar, suprimir y portar tus datos, así como a oponerte a su tratamiento. Para ejercer cualquiera de estos derechos o solicitar la eliminación de tu cuenta y datos, contacta en: <a href="mailto:appgymlog@gmail.com" style={{ color: '#2d7a2d' }}>appgymlog@gmail.com</a></p>

        <h2 style={H2}>7. Seguridad</h2>
        <p style={P}>Aplicamos medidas técnicas adecuadas para proteger tus datos, incluyendo cifrado de contraseñas y transmisión segura mediante HTTPS.</p>

        <div style={{ marginTop: 48 }}>
          <Link href="/login" style={{ color: '#2d7a2d', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
            ← Volver
          </Link>
        </div>
      </div>
    </div>
  )
}
