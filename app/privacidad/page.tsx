import Link from 'next/link'

export default function PrivacidadPage() {
  const H1: React.CSSProperties = {
    fontFamily: 'var(--font-dm-sans)',
    fontSize: '2rem',
    fontWeight: 800,
    color: '#2d7a2d',
    letterSpacing: 0,
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
        <p style={P}>El responsable del tratamiento de tus datos personales es el equipo desarrollador de Meals (en adelante, &apos;Meals&apos;, &apos;nosotros&apos; o &apos;nuestro&apos;). Para cualquier consulta relacionada con tu privacidad, puedes contactarnos en: <a href="mailto:appgymlog@gmail.com" style={{ color: '#2d7a2d' }}>appgymlog@gmail.com</a></p>

        <h2 style={H2}>2. ¿Qué datos recogemos?</h2>
        <p style={P}>Al usar Meals, recopilamos los siguientes tipos de datos:</p>
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li style={{ ...P, marginBottom: 4 }}><strong>Datos de registro:</strong> dirección de correo electrónico y contraseña (almacenada de forma cifrada).</li>
          <li style={{ ...P, marginBottom: 4 }}><strong>Datos de planificación:</strong> planificaciones semanales de almuerzo, categorías de comidas que configures y cualquier otro contenido que introduzcas en la app.</li>
          <li style={{ ...P, marginBottom: 4 }}><strong>Datos de uso:</strong> cómo navegas por la app, funcionalidades que utilizas, frecuencia de uso y datos de rendimiento técnico.</li>
          <li style={{ ...P, marginBottom: 4 }}><strong>Datos del dispositivo:</strong> tipo de dispositivo, sistema operativo y versión de la app.</li>
        </ul>

        <h2 style={H2}>3. ¿Para qué usamos tus datos?</h2>
        <p style={{ ...P, fontStyle: 'italic', color: '#2d7a2d', borderLeft: '3px solid #2d7a2d', paddingLeft: 12, marginBottom: 12 }}>Ser transparentes sobre el uso de tus datos es fundamental para nosotros. Meals es gratuita porque los datos que generas nos permiten mejorar el producto y desarrollar nuevos servicios.</p>
        <p style={P}>Usamos tus datos para:</p>
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li style={{ ...P, marginBottom: 4 }}>Prestarte el servicio de planificación semanal de comidas.</li>
          <li style={{ ...P, marginBottom: 4 }}>Analizar patrones de uso para mejorar la experiencia de la app.</li>
          <li style={{ ...P, marginBottom: 4 }}>Realizar análisis estadísticos e investigación sobre hábitos alimenticios (siempre de forma anonimizada o agregada cuando se comparte externamente).</li>
          <li style={{ ...P, marginBottom: 4 }}>Entrenar y mejorar modelos de planificación de comidas.</li>
          <li style={{ ...P, marginBottom: 4 }}>Enviarte comunicaciones relacionadas con el servicio (novedades, cambios importantes).</li>
        </ul>

        <h2 style={H2}>4. ¿Cuál es la base legal del tratamiento? (RGPD)</h2>
        <p style={P}>Dado que nuestra app opera en Europa, el tratamiento de tus datos se basa en:</p>
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li style={{ ...P, marginBottom: 4 }}>Tu consentimiento explícito, prestado al aceptar esta política durante el registro. Puedes retirar tu consentimiento en cualquier momento (ver sección 7).</li>
          <li style={{ ...P, marginBottom: 4 }}>Interés legítimo para el análisis interno y mejora del servicio.</li>
        </ul>

        <h2 style={H2}>5. ¿Compartimos tus datos con terceros?</h2>
        <p style={P}>No vendemos tus datos personales a terceros. Sin embargo, podemos compartir datos en los siguientes casos:</p>
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li style={{ ...P, marginBottom: 4 }}>Proveedores de servicios técnicos (hosting, bases de datos, analítica) que tratan los datos anonimizados y bajo nuestras instrucciones.</li>
          <li style={{ ...P, marginBottom: 4 }}>Datos estadísticos o de investigación siempre de forma anonimizada y agregada, nunca datos individuales identificables.</li>
          <li style={{ ...P, marginBottom: 4 }}>Cuando sea requerido por ley o autoridad competente.</li>
        </ul>

        <h2 style={H2}>6. ¿Durante cuánto tiempo conservamos tus datos?</h2>
        <p style={P}>Conservamos tus datos mientras mantengas tu cuenta activa. Si decides eliminar tu cuenta, procederemos a borrar tus datos personales en un plazo máximo de 30 días, salvo que exista obligación legal de conservarlos.</p>

        <h2 style={H2}>7. ¿Cuáles son tus derechos?</h2>
        <p style={P}>En virtud del RGPD, tienes los siguientes derechos:</p>
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li style={{ ...P, marginBottom: 4 }}><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
          <li style={{ ...P, marginBottom: 4 }}><strong>Supresión (&apos;derecho al olvido&apos;):</strong> solicitar la eliminación de tus datos.</li>
          <li style={{ ...P, marginBottom: 4 }}><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
          <li style={{ ...P, marginBottom: 4 }}><strong>Oposición:</strong> oponerte al tratamiento de tus datos para determinados fines.</li>
          <li style={{ ...P, marginBottom: 4 }}><strong>Retirada del consentimiento:</strong> en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.</li>
        </ul>
        <p style={{ ...P, marginTop: 8 }}>Para ejercer cualquiera de estos derechos, contacta con nosotros en: <a href="mailto:appgymlog@gmail.com" style={{ color: '#2d7a2d' }}>appgymlog@gmail.com</a> — Responderemos en un plazo máximo de 30 días.</p>

        <h2 style={H2}>8. Seguridad de los datos</h2>
        <p style={P}>Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos frente a accesos no autorizados, pérdida o destrucción, incluyendo cifrado de contraseñas y transmisión segura mediante HTTPS.</p>

        <h2 style={H2}>9. Cambios en esta política</h2>
        <p style={P}>Podemos actualizar esta Política de Privacidad. Te notificaremos cualquier cambio relevante mediante un aviso en la app o por correo electrónico con al menos 15 días de antelación.</p>

        <div style={{ marginTop: 48 }}>
          <Link href="/login" style={{ color: '#2d7a2d', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
            ← Volver
          </Link>
        </div>
      </div>
    </div>
  )
}
