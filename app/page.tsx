'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, type Categoria, type SemanaDia } from '@/lib/supabase'
import CategoriasModal from './components/CategoriasModal'
import {
  getLunes,
  toISODate,
  getDiasSemana,
  generarSugerencias,
  recalcularSugerencias,
} from '@/lib/suggest'

const DIAS_NOMBRE = ['', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']

function formatFechaCorta(iso: string): string {
  const [, m, d] = iso.split('-')
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`
}

function formatRangoSemana(lunes: Date): string {
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)
  return `${formatFechaCorta(toISODate(lunes))} – ${formatFechaCorta(toISODate(domingo))}`
}

type DiaState = {
  id: string | null
  dia_semana: number
  dia_fecha: string
  categoria_id: string | null
  validado: boolean
}

export default function Home() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [semanaLunes, setSemanaLunes] = useState<Date | null>(null)
  const [hoyISO, setHoyISO] = useState<string | null>(null)
  const [dias, setDias] = useState<DiaState[]>([])
  const [loading, setLoading] = useState<'cargando' | 'generando' | false>('cargando')
  const [guardando, setGuardando] = useState<number | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Inicializar fechas solo en cliente para evitar hydration mismatch
  useEffect(() => {
    setSemanaLunes(getLunes(new Date()))
    setHoyISO(toISODate(new Date()))
  }, [])

  // Cargar categorías una sola vez
  useEffect(() => {
    supabase
      .from('categorias')
      .select('*')
      .order('nombre')
      .then(({ data }) => {
        if (data) setCategorias(data as Categoria[])
      })
  }, [])

  // Cargar / generar semana cuando cambia semanaLunes o categorías
  const cargarSemana = useCallback(async () => {
    if (categorias.length === 0 || !semanaLunes) return
    const semanaISO = toISODate(semanaLunes)

    // Buscar si ya existe la semana en BD
    setLoading('cargando')
    const { data: diasExistentes } = await supabase
      .from('semana_dias')
      .select('*')
      .eq('semana_inicio', semanaISO)
      .order('dia_semana')

    if (diasExistentes && diasExistentes.length === 7) {
      setDias(
        diasExistentes.map((d: SemanaDia) => ({
          id: d.id,
          dia_semana: d.dia_semana,
          dia_fecha: d.dia_fecha,
          categoria_id: d.categoria_id,
          validado: d.validado,
        }))
      )
      setLoading(false)
      return
    }

    // No existe la semana → hay que generarla
    setLoading('generando')

    // Obtener historial de semanas anteriores (últimas 8 semanas)
    const semanasPrev: string[] = []
    for (let i = 1; i <= 8; i++) {
      const prev = new Date(semanaLunes)
      prev.setDate(prev.getDate() - 7 * i)
      semanasPrev.push(toISODate(prev))
    }

    const { data: historialRaw } = await supabase
      .from('semana_dias')
      .select('semana_inicio, dia_semana, categoria_id, validado')
      .in('semana_inicio', semanasPrev)

    const historial = semanasPrev.map((si) => ({
      semana_inicio: si,
      dias: (historialRaw ?? [])
        .filter((d) => d.semana_inicio === si)
        .map((d) => ({
          dia_semana: d.dia_semana,
          categoria_id: d.categoria_id,
          validado: d.validado,
        })),
    }))

    // Generar sugerencias
    const sugerencias = generarSugerencias(categorias, [], historial, semanaISO)

    // Construir filas para los 7 días
    const diasSemana = getDiasSemana(semanaLunes)
    const filas = diasSemana.map(({ fecha, diaSemana }) => ({
      dia_semana: diaSemana,
      dia_fecha: toISODate(fecha),
      semana_inicio: semanaISO,
      categoria_id: sugerencias.get(diaSemana) ?? null,
      validado: false,
    }))

    // Guardar en BD
    const { data: insertadas } = await supabase
      .from('semana_dias')
      .insert(filas)
      .select()

    if (insertadas) {
      setDias(
        insertadas.map((d: SemanaDia) => ({
          id: d.id,
          dia_semana: d.dia_semana,
          dia_fecha: d.dia_fecha,
          categoria_id: d.categoria_id,
          validado: d.validado,
        }))
      )
    }

    setLoading(false)
  }, [categorias, semanaLunes])

  useEffect(() => {
    cargarSemana()
  }, [cargarSemana])

  // Marcar/desmarcar validado
  async function toggleValidado(diaSemana: number) {
    const dia = dias.find((d) => d.dia_semana === diaSemana)
    if (!dia?.id) return

    const nuevoValidado = !dia.validado
    setGuardando(diaSemana)

    await supabase
      .from('semana_dias')
      .update({ validado: nuevoValidado })
      .eq('id', dia.id)

    setDias((prev) =>
      prev.map((d) =>
        d.dia_semana === diaSemana ? { ...d, validado: nuevoValidado } : d
      )
    )
    setGuardando(null)
  }

  // Cambiar categoría manualmente
  async function cambiarCategoria(diaSemana: number, nuevaCatId: string) {
    if (!semanaLunes) return
    const dia = dias.find((d) => d.dia_semana === diaSemana)
    if (!dia?.id) return

    setGuardando(diaSemana)

    // Actualizar este día como validado con la nueva categoría
    await supabase
      .from('semana_dias')
      .update({ categoria_id: nuevaCatId, validado: true })
      .eq('id', dia.id)

    // Estado intermedio con este día actualizado
    const diasActualizados = dias.map((d) =>
      d.dia_semana === diaSemana
        ? { ...d, categoria_id: nuevaCatId, validado: true }
        : d
    )

    // Recalcular días futuros no validados
    const semanaISO = toISODate(semanaLunes)

    // Historial para recálculo
    const semanasPrev: string[] = []
    for (let i = 1; i <= 8; i++) {
      const prev = new Date(semanaLunes)
      prev.setDate(prev.getDate() - 7 * i)
      semanasPrev.push(toISODate(prev))
    }

    const { data: historialRaw } = await supabase
      .from('semana_dias')
      .select('semana_inicio, dia_semana, categoria_id, validado')
      .in('semana_inicio', semanasPrev)

    const historial = semanasPrev.map((si) => ({
      semana_inicio: si,
      dias: (historialRaw ?? [])
        .filter((d) => d.semana_inicio === si)
        .map((d) => ({
          dia_semana: d.dia_semana,
          categoria_id: d.categoria_id,
          validado: d.validado,
        })),
    }))

    const nuevasSugerencias = recalcularSugerencias(
      categorias,
      diasActualizados.map((d) => ({
        dia_semana: d.dia_semana,
        categoria_id: d.categoria_id,
        validado: d.validado,
      })),
      historial,
      semanaISO,
      diaSemana + 1 // recalcular desde el día siguiente
    )

    // Actualizar días futuros no validados en BD y estado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actualizaciones: Promise<any>[] = []
    const diasFinales = diasActualizados.map((d) => {
      if (d.dia_semana > diaSemana && !d.validado && nuevasSugerencias.has(d.dia_semana)) {
        const newCat = nuevasSugerencias.get(d.dia_semana)!
        if (d.id) {
          const q = supabase
            .from('semana_dias')
            .update({ categoria_id: newCat })
            .eq('id', d.id)
          actualizaciones.push(Promise.resolve(q))
        }
        return { ...d, categoria_id: newCat }
      }
      return d
    })

    await Promise.all(actualizaciones)
    setDias(diasFinales)
    setGuardando(null)
  }

  function irSemanaAnterior() {
    setSemanaLunes((prev) => {
      if (!prev) return prev
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }

  function irSemanaSiguiente() {
    setSemanaLunes((prev) => {
      if (!prev) return prev
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  // Días validados que incumplen alguna restricción → se pintan en naranja
  const violaciones = useMemo(() => {
    const set = new Set<number>()

    // solo_fin_semana en día de entre semana
    for (const dia of dias) {
      if (!dia.validado || !dia.categoria_id) continue
      const cat = categorias.find((c) => c.id === dia.categoria_id)
      if (cat?.solo_fin_semana && dia.dia_semana < 6) set.add(dia.dia_semana)
    }

    // frec_sem_max excedido: las apariciones que sobran (ordenadas por día) son violación
    const porCategoria = new Map<string, number[]>()
    for (const dia of dias) {
      if (!dia.validado || !dia.categoria_id) continue
      const lista = porCategoria.get(dia.categoria_id) ?? []
      lista.push(dia.dia_semana)
      porCategoria.set(dia.categoria_id, lista)
    }
    for (const [catId, diasCat] of porCategoria) {
      const cat = categorias.find((c) => c.id === catId)
      if (!cat) continue
      const ordenados = [...diasCat].sort((a, b) => a - b)
      for (let i = cat.frec_sem_max; i < ordenados.length; i++) {
        set.add(ordenados[i])
      }
    }

    return set
  }, [dias, categorias])

  // Estas comparaciones solo se evalúan cuando semanaLunes ya está inicializado (cliente)
  const semanaActualISO = hoyISO ? toISODate(getLunes(new Date(hoyISO))) : null
  const esSemanaActual = semanaLunes && semanaActualISO
    ? toISODate(semanaLunes) === semanaActualISO
    : false

  return (
    <div
      style={{ background: 'var(--bg)', minHeight: '100vh', padding: '2rem 1rem' }}
    >
      {settingsOpen && (
        <CategoriasModal
          onClose={() => setSettingsOpen(false)}
          onCambioCategorias={(cats) => setCategorias(cats)}
        />
      )}
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Cabecera */}
        <header style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative' }}>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{ ...navBtnStyle, position: 'absolute', top: 0, right: 0 }}
            aria-label="Configuración de categorías"
            title="Categorías"
          >
            ⚙
          </button>
          <h1
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '3.5rem',
              letterSpacing: '0.08em',
              color: 'var(--accent)',
              lineHeight: 1,
              marginBottom: '1rem',
            }}
          >
            MEALS
          </h1>

          {/* Navegación de semana */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
            }}
          >
            <button
              onClick={irSemanaAnterior}
              style={navBtnStyle}
              aria-label="Semana anterior"
            >
              ‹
            </button>
            <span
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '0.95rem',
                color: esSemanaActual ? 'var(--accent)' : 'var(--text)',
                fontWeight: esSemanaActual ? 600 : 400,
                minWidth: 160,
                textAlign: 'center',
              }}
            >
              {semanaLunes ? formatRangoSemana(semanaLunes) : ''}
            </span>
            <button
              onClick={irSemanaSiguiente}
              style={navBtnStyle}
              aria-label="Semana siguiente"
            >
              ›
            </button>
          </div>
        </header>

        {/* Lista de días */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem 0' }}>
            {loading === 'generando' ? 'Generando…' : 'Cargando…'}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {dias.map((dia) => {
              const esHoy = dia.dia_fecha === hoyISO
              const esCargando = guardando === dia.dia_semana
              const esViolacion = violaciones.has(dia.dia_semana)
              const colorValidado = esViolacion ? '#d97706' : 'var(--accent)'

              return (
                <li
                  key={dia.dia_semana}
                  style={{
                    background: esHoy ? 'var(--accent-bg)' : 'var(--surface)',
                    border: `1px solid ${esHoy ? 'var(--accent)' : 'var(--border)'}`,
                    borderLeft: esHoy ? '4px solid var(--accent)' : `1px solid var(--border)`,
                    borderRadius: 8,
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    opacity: esCargando ? 0.6 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {/* Nombre del día */}
                  <div style={{ minWidth: 110 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-dm-sans)',
                        fontSize: '1.15rem',
                        letterSpacing: '0.06em',
                        color: esHoy ? 'var(--accent)' : 'var(--text)',
                      }}
                    >
                      {DIAS_NOMBRE[dia.dia_semana]}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {formatFechaCorta(dia.dia_fecha)}
                    </div>
                  </div>

                  {/* Select de categoría */}
                  <select
                    value={dia.categoria_id ?? ''}
                    onChange={(e) => cambiarCategoria(dia.dia_semana, e.target.value)}
                    disabled={esCargando}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.6rem',
                      border: `1px solid var(--border)`,
                      borderRadius: 6,
                      background: 'var(--bg)',
                      fontFamily: 'var(--font-dm-sans)',
                      fontSize: '0.9rem',
                      color: dia.validado ? colorValidado : 'var(--muted)',
                      fontWeight: dia.validado ? 600 : 400,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {dia.categoria_id === null && (
                      <option value="">Sin asignar</option>
                    )}
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>

                  {/* Check de validación */}
                  <button
                    onClick={() => toggleValidado(dia.dia_semana)}
                    disabled={esCargando || !dia.categoria_id}
                    aria-label={dia.validado ? 'Desvalidar' : 'Validar'}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: `2px solid ${dia.validado ? colorValidado : 'var(--border)'}`,
                      background: dia.validado ? colorValidado : 'var(--bg)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: dia.categoria_id ? 'pointer' : 'default',
                      flexShrink: 0,
                      fontSize: '1rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    {dia.validado ? '✓' : ''}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 6,
  width: 32,
  height: 32,
  cursor: 'pointer',
  fontSize: '1.4rem',
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
}
