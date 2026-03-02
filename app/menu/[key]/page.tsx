import { getLunes, toISODate } from '@/lib/suggest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Categoria, Comida, SemanaDia } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default async function MenuPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params

  const { data: guestRow } = await supabaseAdmin
    .from('usuarios')
    .select('id')
    .eq('guest_key', key)
    .maybeSingle()

  if (!guestRow) {
    return (
      <main style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem', fontFamily: 'DM Sans, Arial, sans-serif' }}>
        <p style={{ color: '#888888' }}>Enlace no válido.</p>
      </main>
    )
  }

  const userId = guestRow.id

  // Calcular semana actual y fecha de hoy
  const hoy = new Date()
  const lunes = getLunes(hoy)
  const semanaInicio = toISODate(lunes)
  const hoyISO = toISODate(hoy)

  // Fetch de datos (admin bypasses RLS)
  const [{ data: dias }, { data: categorias }, { data: comidas }] = await Promise.all([
    supabaseAdmin
      .from('semana_dias')
      .select('*')
      .eq('user_id', userId)
      .eq('semana_inicio', semanaInicio)
      .order('dia_semana'),
    supabaseAdmin.from('categorias').select('*').eq('user_id', userId),
    supabaseAdmin.from('comidas').select('*').eq('user_id', userId),
  ])

  return (
    <main style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem', fontFamily: 'DM Sans, Arial, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1a1a1a' }}>
        Menú semana {semanaInicio}
      </h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[1, 2, 3, 4, 5, 6, 7].map((ds) => {
          const dia = (dias ?? []).find((d: SemanaDia) => d.dia_semana === ds)
          const cat = (categorias ?? []).find((c: Categoria) => c.id === dia?.categoria_id)
          const comida = (comidas ?? []).find((c: Comida) => c.id === dia?.comida_id)
          const esHoy = dia?.dia_fecha === hoyISO
          const esPasado = dia?.dia_fecha != null && dia.dia_fecha < hoyISO
          return (
            <li
              key={ds}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                border: `1px solid ${esHoy ? '#2d7a2d' : '#e0e0e0'}`,
                borderLeft: esHoy ? '4px solid #2d7a2d' : '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '0.75rem 1rem',
                background: esHoy ? '#f0f7f0' : '#ffffff',
              }}
            >
              <span style={{
                width: 90,
                fontWeight: esHoy ? 700 : 600,
                color: esHoy ? '#2d7a2d' : '#888888',
                fontSize: '1.05rem',
                flexShrink: 0,
              }}>
                {DIAS[ds - 1]}
              </span>
              <div style={{ flex: 1 }}>
                {cat && (
                  <div style={{ fontSize: '0.95rem', color: '#888888' }}>{cat.nombre}</div>
                )}
                {comida ? (
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: esPasado ? '#888888' : '#1a1a1a' }}>
                    {comida.nombre}
                  </div>
                ) : cat ? (
                  <div style={{ color: '#888888', fontSize: '0.95rem' }}>Sin especificar</div>
                ) : (
                  <div style={{ color: '#cccccc', fontSize: '0.95rem' }}>—</div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
