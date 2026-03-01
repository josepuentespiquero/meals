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
        <p style={P}>Al registrarte y usar Meals, aceptas íntegramente estos Términos de Uso. Si no estás de acuerdo con alguno de ellos, no podrás utilizar la aplicación.</p>

        <h2 style={H2}>2. Descripción del servicio</h2>
        <p style={P}>Meals es una aplicación web gratuita que permite a los usuarios planificar semanalmente sus comidas del almuerzo. El servicio se presta de forma gratuita a cambio del uso de los datos generados por el usuario, tal y como se describe en la Política de Privacidad.</p>

        <h2 style={H2}>3. Licencia de uso</h2>
        <p style={P}>Te otorgamos una licencia limitada, no exclusiva, no transferible y revocable para usar Meals exclusivamente para tus fines personales y no comerciales.</p>

        <h2 style={H2}>4. Licencia sobre el contenido que introduces</h2>
        <p style={P}>Al introducir datos en Meals, nos concedes una licencia mundial, gratuita y no exclusiva para usar, analizar, procesar y mejorar nuestros servicios con dicho contenido. Esta licencia no te priva de la propiedad de tus datos ni te impide eliminarlos.</p>

        <h2 style={H2}>5. Conducta del usuario</h2>
        <p style={P}>Al usar Meals te comprometes a:</p>
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li style={{ ...P, marginBottom: 4 }}>No introducir información falsa, fraudulenta o engañosa.</li>
          <li style={{ ...P, marginBottom: 4 }}>No intentar acceder a cuentas o datos de otros usuarios.</li>
          <li style={{ ...P, marginBottom: 4 }}>No realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la app.</li>
          <li style={{ ...P, marginBottom: 4 }}>No usar la app para fines ilegales o que violen derechos de terceros.</li>
        </ul>

        <h2 style={H2}>6. Disponibilidad del servicio</h2>
        <p style={P}>Nos esforzamos por mantener Meals disponible de forma continua, pero no garantizamos una disponibilidad del 100%. Podemos interrumpir el servicio temporalmente por mantenimiento, actualizaciones o causas ajenas a nuestra voluntad.</p>

        <h2 style={H2}>7. Modificaciones del servicio</h2>
        <p style={P}>Nos reservamos el derecho de modificar, suspender o discontinuar el servicio (total o parcialmente) en cualquier momento, con un aviso previo razonable cuando sea posible.</p>

        <h2 style={H2}>8. Limitación de responsabilidad</h2>
        <p style={P}>Meals se proporciona &apos;tal cual&apos;, sin garantías de ningún tipo. No seremos responsables de daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la app.</p>

        <h2 style={H2}>9. Modificaciones de los términos</h2>
        <p style={P}>Podemos actualizar estos Términos de Uso. Te notificaremos los cambios con al menos 15 días de antelación. El uso continuado de la app tras la entrada en vigor de los nuevos términos implica su aceptación.</p>

        <h2 style={H2}>10. Ley aplicable</h2>
        <p style={P}>Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Granada.</p>

        <div style={{ marginTop: 48 }}>
          <Link href="/login" style={{ color: '#2d7a2d', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
            ← Volver
          </Link>
        </div>
      </div>
    </div>
  )
}
