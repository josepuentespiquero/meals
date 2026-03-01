'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, type Categoria, type Comida, type SemanaDia, type StockComida } from '@/lib/supabase'
import CategoriasModal from './components/CategoriasModal'
import ComidasModal from './components/ComidasModal'
import InventarioModal from './components/InventarioModal'
import { useRouter } from 'next/navigation'
import {
  getLunes,
  toISODate,
  getDiasSemana,
  generarSugerencias,
  recalcularSugerencias,
} from '@/lib/suggest'

const DIAS_NOMBRE = ['', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']

function IconSettings({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function IconUtensils({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  )
}

function IconRefresh({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

function IconInventario({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  )
}

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
  comida_id: string | null
  validado: boolean
}

export default function Home() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [comidas, setComidas] = useState<Comida[]>([])
  const [semanaLunes, setSemanaLunes] = useState<Date | null>(null)
  const [hoyISO, setHoyISO] = useState<string | null>(null)
  const [dias, setDias] = useState<DiaState[]>([])
  const [loading, setLoading] = useState<'cargando' | 'generando' | false>('cargando')
  const [guardando, setGuardando] = useState<number | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [comidasOpen, setComidasOpen] = useState(false)
  const [inventarioOpen, setInventarioOpen] = useState(false)
  const [stock, setStock] = useState<Map<string, number>>(new Map())
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [haySemanaPrev, setHaySemanaPrev] = useState(false)

  const router = useRouter()

  // Obtener usuario autenticado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
      setUserEmail(user?.email ?? null)
    })
  }, [])

  // Inicializar fechas solo en cliente para evitar hydration mismatch
  useEffect(() => {
    setSemanaLunes(getLunes(new Date()))
    setHoyISO(toISODate(new Date()))
  }, [])

  // Cargar categorías cuando hay userId
  useEffect(() => {
    if (!userId) return
    supabase
      .from('categorias')
      .select('*')
      .eq('user_id', userId)
      .order('nombre')
      .then(({ data }) => {
        if (data) setCategorias(data as Categoria[])
      })
  }, [userId])

  // Cargar comidas cuando hay userId
  useEffect(() => {
    if (!userId) return
    supabase
      .from('comidas')
      .select('*')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setComidas(data as Comida[])
      })
  }, [userId])

  // Cargar stock cuando hay userId
  useEffect(() => {
    if (!userId) return
    supabase
      .from('stock_comidas')
      .select('comida_id, cantidad')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setStock(new Map(
          (data as StockComida[]).map((r) => [r.comida_id, r.cantidad])
        ))
      })
  }, [userId])

  // Cargar / generar semana cuando cambia semanaLunes, categorías o userId
  const cargarSemana = useCallback(async () => {
    if (categorias.length === 0 || !semanaLunes || !userId) return

    const semanaISO = toISODate(semanaLunes)

    // Verificar si existe la semana anterior (para mostrar/ocultar botón ‹)
    const semanaPrevDate = new Date(semanaLunes)
    semanaPrevDate.setDate(semanaPrevDate.getDate() - 7)
    const { count: countPrev } = await supabase
      .from('semana_dias')
      .select('*', { count: 'exact', head: true })
      .eq('semana_inicio', toISODate(semanaPrevDate))
      .eq('user_id', userId)
    setHaySemanaPrev((countPrev ?? 0) > 0)

    // Buscar si ya existe la semana en BD
    setLoading('cargando')
    const { data: diasExistentes } = await supabase
      .from('semana_dias')
      .select('*')
      .eq('semana_inicio', semanaISO)
      .eq('user_id', userId)
      .order('dia_semana')

    if (diasExistentes && diasExistentes.length === 7) {
      setDias(
        diasExistentes.map((d: SemanaDia) => ({
          id: d.id,
          dia_semana: d.dia_semana,
          dia_fecha: d.dia_fecha,
          categoria_id: d.categoria_id,
          comida_id: d.comida_id ?? null,
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
      .eq('user_id', userId)

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
      comida_id: null,
      validado: false,
      user_id: userId,
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
          comida_id: d.comida_id ?? null,
          validado: d.validado,
        }))
      )
    }

    setLoading(false)
  }, [categorias, semanaLunes, userId])

  useEffect(() => {
    cargarSemana()
  }, [cargarSemana])

  // Ajustar stock de una comida en delta (±1) y persistir
  async function actualizarStock(comidaId: string, delta: number) {
    if (!userId || !comidaId) return
    setStock((prev) => {
      const newMap = new Map(prev)
      const newValue = (prev.get(comidaId) ?? 0) + delta
      newMap.set(comidaId, newValue)
      supabase
        .from('stock_comidas')
        .upsert(
          { user_id: userId, comida_id: comidaId, cantidad: newValue, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,comida_id' }
        )
      return newMap
    })
  }

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

    if (dia.comida_id) {
      await actualizarStock(dia.comida_id, nuevoValidado ? -1 : +1)
    }

    setDias((prev) =>
      prev.map((d) =>
        d.dia_semana === diaSemana ? { ...d, validado: nuevoValidado } : d
      )
    )
    setGuardando(null)
  }

  // Cambiar categoría manualmente
  async function cambiarCategoria(diaSemana: number, nuevaCatId: string) {
    if (!semanaLunes || !userId) return
    const dia = dias.find((d) => d.dia_semana === diaSemana)
    if (!dia?.id) return

    const anteriorCatId = dia.categoria_id
    const anteriorComidaId = dia.comida_id
    const anteriorValidado = dia.validado

    setGuardando(diaSemana)

    const nuevaComidaId = nuevaCatId !== anteriorCatId ? null : dia.comida_id

    await supabase
      .from('semana_dias')
      .update({ categoria_id: nuevaCatId, comida_id: nuevaComidaId, validado: true })
      .eq('id', dia.id)

    if (nuevaCatId !== anteriorCatId) {
      if (anteriorValidado && anteriorComidaId) await actualizarStock(anteriorComidaId, +1)
      // No consumir: aún no hay comida en la nueva categoría
    } else {
      if (!anteriorValidado && dia.comida_id) await actualizarStock(dia.comida_id, -1)
    }

    const diasActualizados = dias.map((d) =>
      d.dia_semana === diaSemana
        ? { ...d, categoria_id: nuevaCatId, comida_id: nuevaComidaId, validado: true }
        : d
    )

    const semanaISO = toISODate(semanaLunes)

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
      .eq('user_id', userId)

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
      diaSemana + 1
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actualizaciones: Promise<any>[] = []
    const diasFinales = diasActualizados.map((d) => {
      if (d.dia_semana > diaSemana && !d.validado && nuevasSugerencias.has(d.dia_semana)) {
        const newCat = nuevasSugerencias.get(d.dia_semana)!
        if (d.id) {
          actualizaciones.push(
            Promise.resolve(
              supabase.from('semana_dias').update({ categoria_id: newCat }).eq('id', d.id)
            )
          )
        }
        return { ...d, categoria_id: newCat }
      }
      return d
    })

    await Promise.all(actualizaciones)

    // Si el usuario cambió la categoría (no solo validó la propuesta),
    // regenerar la semana siguiente si existe, ya que el historial ha cambiado
    const categoriaAnterior = dia?.categoria_id
    if (nuevaCatId === categoriaAnterior) {
      setDias(diasFinales)
      setGuardando(null)
      return
    }

    const semanaSigDate = new Date(semanaLunes)
    semanaSigDate.setDate(semanaSigDate.getDate() + 7)
    const semanaSigISO = toISODate(semanaSigDate)

    const { data: diasSig } = await supabase
      .from('semana_dias')
      .select('*')
      .eq('semana_inicio', semanaSigISO)
      .eq('user_id', userId)
      .order('dia_semana')

    if (diasSig && diasSig.length > 0) {
      const semanasPrevSig: string[] = []
      for (let i = 1; i <= 8; i++) {
        const prev = new Date(semanaSigDate)
        prev.setDate(prev.getDate() - 7 * i)
        semanasPrevSig.push(toISODate(prev))
      }

      const { data: historialSigRaw } = await supabase
        .from('semana_dias')
        .select('semana_inicio, dia_semana, categoria_id, validado')
        .in('semana_inicio', semanasPrevSig)
        .eq('user_id', userId)

      const historialSig = semanasPrevSig.map((si) => ({
        semana_inicio: si,
        dias: (historialSigRaw ?? [])
          .filter((d) => d.semana_inicio === si)
          .map((d) => ({
            dia_semana: d.dia_semana,
            categoria_id: d.categoria_id,
            validado: d.validado,
          })),
      }))

      const nuevasSig = generarSugerencias(
        categorias,
        diasSig.map((d) => ({ dia_semana: d.dia_semana, categoria_id: d.categoria_id, validado: d.validado })),
        historialSig,
        semanaSigISO
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actsSig: Promise<any>[] = []
      for (const d of diasSig) {
        if (!d.validado && nuevasSig.has(d.dia_semana)) {
          actsSig.push(
            Promise.resolve(
              supabase.from('semana_dias').update({ categoria_id: nuevasSig.get(d.dia_semana) }).eq('id', d.id)
            )
          )
        }
      }
      await Promise.all(actsSig)
    }

    setDias(diasFinales)
    setGuardando(null)
  }

  async function cambiarComida(diaSemana: number, comidaId: string) {
    const dia = dias.find((d) => d.dia_semana === diaSemana)
    if (!dia?.id) return
    const anteriorComidaId = dia.comida_id
    setGuardando(diaSemana)
    await supabase
      .from('semana_dias')
      .update({ comida_id: comidaId || null })
      .eq('id', dia.id)
    if (dia.validado) {
      if (anteriorComidaId) await actualizarStock(anteriorComidaId, +1)
      if (comidaId) await actualizarStock(comidaId, -1)
    }
    setDias((prev) =>
      prev.map((d) => d.dia_semana === diaSemana ? { ...d, comida_id: comidaId || null } : d)
    )
    setGuardando(null)
  }

  async function regenerar() {
    if (!semanaLunes || dias.length === 0 || !userId) return
    setRefreshing(true)

    const semanaISO = toISODate(semanaLunes)

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
      .eq('user_id', userId)

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
      dias.map((d) => ({
        dia_semana: d.dia_semana,
        categoria_id: d.categoria_id,
        validado: d.validado,
      })),
      historial,
      semanaISO,
      1
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actualizaciones: Promise<any>[] = []
    const diasActualizados = dias.map((d) => {
      if (!d.validado && nuevasSugerencias.has(d.dia_semana)) {
        const newCat = nuevasSugerencias.get(d.dia_semana)!
        if (d.id) {
          actualizaciones.push(
            Promise.resolve(
              supabase.from('semana_dias').update({ categoria_id: newCat }).eq('id', d.id)
            )
          )
        }
        return { ...d, categoria_id: newCat }
      }
      return d
    })

    await Promise.all(actualizaciones)
    setDias(diasActualizados)
    setRefreshing(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
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

    for (const dia of dias) {
      if (!dia.validado || !dia.categoria_id) continue
      const cat = categorias.find((c) => c.id === dia.categoria_id)
      if (cat?.solo_fin_semana && dia.dia_semana < 6) set.add(dia.dia_semana)
    }

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

  const semanaActualISO = hoyISO ? toISODate(getLunes(new Date(hoyISO))) : null
  const esSemanaActual = semanaLunes && semanaActualISO
    ? toISODate(semanaLunes) === semanaActualISO
    : false
  const esSemanaFuturaOActual = semanaLunes && semanaActualISO
    ? toISODate(semanaLunes) >= semanaActualISO
    : false

  const proximaSemanaISO = semanaActualISO
    ? (() => { const d = new Date(semanaActualISO); d.setDate(d.getDate() + 7); return toISODate(d) })()
    : null
  const haySemanaSig = semanaLunes && proximaSemanaISO
    ? toISODate(semanaLunes) < proximaSemanaISO
    : false

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '2rem 1rem' }}>
      {settingsOpen && (
        <CategoriasModal
          userId={userId ?? ''}
          onClose={() => setSettingsOpen(false)}
          onCambioCategorias={(cats) => setCategorias(cats)}
        />
      )}
      {comidasOpen && (
        <ComidasModal
          userId={userId ?? ''}
          categorias={categorias}
          onClose={() => setComidasOpen(false)}
        />
      )}
      {inventarioOpen && (
        <InventarioModal
          userId={userId ?? ''}
          categorias={categorias}
          comidas={comidas}
          stock={stock}
          onStockChange={(comidaId, newValue) =>
            setStock((prev) => { const m = new Map(prev); m.set(comidaId, newValue); return m })
          }
          onClose={() => setInventarioOpen(false)}
        />
      )}
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Cabecera */}
        <header style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative' }}>

          {/* Usuario + logout — esquina superior izquierda */}
          <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            {userEmail && (
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '3px 8px', cursor: 'pointer' }}
            >
              Salir
            </button>
          </div>

          {/* Refresh + Settings — esquina superior derecha */}
          <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 6 }}>
            {esSemanaFuturaOActual && (
              <button
                onClick={regenerar}
                disabled={refreshing || !!loading}
                style={{ ...navBtnStyle, opacity: refreshing ? 0.5 : 1 }}
                aria-label="Regenerar sugerencias"
                title="Regenerar sugerencias"
              >
                <IconRefresh />
              </button>
            )}
            <button
              onClick={() => setInventarioOpen(true)}
              style={navBtnStyle}
              aria-label="Inventario"
              title="Inventario"
            >
              <IconInventario />
            </button>
            <button
              onClick={() => setComidasOpen(true)}
              style={navBtnStyle}
              aria-label="Maestro de comidas"
              title="Comidas"
            >
              <IconUtensils />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              style={navBtnStyle}
              aria-label="Configuración de categorías"
              title="Categorías"
            >
              <IconSettings />
            </button>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: 0,
              color: 'var(--accent)',
              lineHeight: 1,
              marginBottom: '1rem',
            }}
          >
            MEALS
          </h1>

          {/* Navegación de semana */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            {haySemanaPrev
              ? <button onClick={irSemanaAnterior} style={navBtnStyle} aria-label="Semana anterior">‹</button>
              : <div style={{ width: 32 }} />
            }
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
            {haySemanaSig
              ? <button onClick={irSemanaSiguiente} style={navBtnStyle} aria-label="Semana siguiente">›</button>
              : <div style={{ width: 32 }} />
            }
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
                    position: 'relative',
                    background: esHoy ? 'var(--accent-bg)' : 'var(--surface)',
                    border: `1px solid ${esHoy ? 'var(--accent)' : 'var(--border)'}`,
                    borderLeft: esHoy ? '4px solid var(--accent)' : `1px solid var(--border)`,
                    borderRadius: 8,
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    opacity: esCargando ? 0.6 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <div style={{ minWidth: 110, paddingTop: '0.35rem' }}>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.15rem', letterSpacing: '0.06em', color: esHoy ? 'var(--accent)' : 'var(--text)' }}>
                      {DIAS_NOMBRE[dia.dia_semana]}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {formatFechaCorta(dia.dia_fecha)}
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <select
                      value={dia.categoria_id ?? ''}
                      onChange={(e) => cambiarCategoria(dia.dia_semana, e.target.value)}
                      disabled={esCargando}
                      style={{
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
                        width: '100%',
                      }}
                    >
                      {dia.categoria_id === null && <option value="">Sin asignar</option>}
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>

                    {dia.categoria_id && (
                      <select
                        value={dia.comida_id ?? ''}
                        onChange={(e) => cambiarComida(dia.dia_semana, e.target.value)}
                        disabled={esCargando}
                        style={{
                          padding: '0.4rem 0.6rem',
                          border: `1px solid var(--border)`,
                          borderRadius: 6,
                          background: 'var(--bg)',
                          fontFamily: 'var(--font-dm-sans)',
                          fontSize: '0.85rem',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          outline: 'none',
                          width: '100%',
                        }}
                      >
                        <option value="">Especificar comida</option>
                        {comidas
                          .filter((c) => c.categoria_id === dia.categoria_id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                          ))}
                      </select>
                    )}
                  </div>

                  {dia.categoria_id && (() => {
                    const total = comidas
                      .filter((c) => c.categoria_id === dia.categoria_id)
                      .reduce((sum, c) => sum + (stock.get(c.id) ?? 0), 0)
                    if (total === 0) return null
                    return (
                      <span style={{
                        position: 'absolute',
                        right: '-2rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-dm-sans)',
                        fontWeight: 600,
                        color: total < 0 ? '#dc2626' : 'var(--muted)',
                      }}>
                        {total}
                      </span>
                    )
                  })()}

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
                      marginTop: '0.15rem',
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
