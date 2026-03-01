import type { Categoria, SemanaDia } from './supabase'

/**
 * Devuelve el lunes de la semana que contiene `date`.
 */
export function getLunes(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=dom,1=lun,...,6=sáb
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Formatea una fecha como "YYYY-MM-DD" (ISO local, sin offset TZ).
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Genera los 7 días de la semana a partir del lunes dado.
 */
export function getDiasSemana(lunes: Date): Array<{ fecha: Date; diaSemana: number }> {
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(lunes)
    fecha.setDate(lunes.getDate() + i)
    return { fecha, diaSemana: i + 1 } // 1=lun ... 7=dom
  })
}

type DiaConCategoria = {
  dia_semana: number
  categoria_id: string | null
  validado: boolean
}

/**
 * Algoritmo de sugerencia semanal.
 *
 * @param categorias     Todas las categorías disponibles.
 * @param diasActuales   Días ya existentes en la semana (pueden estar validados o no).
 * @param historialSemanas  Lista de semanas anteriores con sus días (para calcular cada_x_sem).
 *                          Ordenadas de más reciente a más antigua.
 * @param semanaInicio   Fecha ISO del lunes de la semana a calcular.
 * @returns Map<dia_semana, categoria_id> con las sugerencias para días NO validados.
 */
export function generarSugerencias(
  categorias: Categoria[],
  diasActuales: DiaConCategoria[],
  historialSemanas: Array<{ semana_inicio: string; dias: DiaConCategoria[] }>,
  semanaInicio: string
): Map<number, string> {
  const resultado = new Map<number, string>()

  // Días ya validados en la semana actual
  const validados = new Map<number, string>()
  for (const d of diasActuales) {
    if (d.validado && d.categoria_id) {
      validados.set(d.dia_semana, d.categoria_id)
    }
  }

  // Días que necesitan sugerencia (no validados)
  const diasPendientes = [1, 2, 3, 4, 5, 6, 7].filter(
    (ds) => !validados.has(ds)
  )

  if (diasPendientes.length === 0) return resultado

  // Conteo de usos de cada categoría ya validados esta semana
  const usosValidados = new Map<string, number>()
  for (const [, catId] of validados) {
    usosValidados.set(catId, (usosValidados.get(catId) ?? 0) + 1)
  }

  // Determinar qué categorías están bloqueadas por cada_x_sem
  // Una categoría con cada_x_sem=N no puede aparecer si apareció en alguna
  // de las (N-1) semanas anteriores.
  const semanaActualDate = new Date(semanaInicio)
  const bloqueadas = new Set<string>()
  for (const cat of categorias) {
    if (cat.cada_x_sem <= 1) continue
    const semaansBloqueadas = cat.cada_x_sem - 1
    for (let i = 0; i < semaansBloqueadas; i++) {
      const semanaAnteriorDate = new Date(semanaActualDate)
      semanaAnteriorDate.setDate(semanaAnteriorDate.getDate() - 7 * (i + 1))
      const semanaAnteriorISO = toISODate(semanaAnteriorDate)
      const semAnterior = historialSemanas.find(
        (s) => s.semana_inicio === semanaAnteriorISO
      )
      if (semAnterior) {
        const aparecio = semAnterior.dias.some((d) => d.categoria_id === cat.id)
        if (aparecio) {
          bloqueadas.add(cat.id)
          break
        }
      }
    }
  }

  // Función para obtener categorías disponibles para un día concreto
  // dado el estado actual de asignaciones (validadas + sugeridas hasta ahora)
  function getCategoriasCandidatas(
    diaSemana: number,
    usosActuales: Map<string, number>
  ): Categoria[] {
    const esFinDeSemana = diaSemana >= 6
    return categorias.filter((cat) => {
      // Restricción fin de semana
      if (cat.solo_fin_semana && !esFinDeSemana) return false

      // Bloqueada por cada_x_sem
      if (bloqueadas.has(cat.id)) return false

      // Verificar que no supere frec_sem_max
      const usos = usosActuales.get(cat.id) ?? 0
      if (usos >= cat.frec_sem_max) return false

      // Grupo exclusivo: si otra categoría del mismo grupo ya fue asignada esta semana, excluir esta
      if (cat.grupo_exclusivo) {
        const grupoYaUsado = categorias.some(
          (otra) =>
            otra.id !== cat.id &&
            otra.grupo_exclusivo === cat.grupo_exclusivo &&
            (usosActuales.get(otra.id) ?? 0) > 0
        )
        if (grupoYaUsado) return false
      }

      return true
    })
  }

  // Asignamos sugerencias día a día (de lunes a domingo)
  // Mantenemos un mapa de usos que incluye validados + sugeridos
  const usosAcumulados = new Map<string, number>(usosValidados)

  // Mapa completo de asignaciones (validadas + sugeridas) para consultar el día anterior
  const asignaciones = new Map<number, string>(validados)

  // Ordenamos diasPendientes de lunes a domingo para asignar en orden
  const pendientesOrdenados = [...diasPendientes].sort((a, b) => a - b)

  for (const dia of pendientesOrdenados) {
    const candidatas = getCategoriasCandidatas(dia, usosAcumulados)

    if (candidatas.length === 0) continue

    const catAnterior = asignaciones.get(dia - 1) ?? null

    // Días pendientes restantes incluyendo el actual (para calcular margen disponible)
    const diasRestantes = pendientesOrdenados.filter((d) => d >= dia)

    // Una categoría está "forzada" en el día actual si, sin asignarla hoy,
    // no quedan suficientes días válidos restantes para cumplir frec_sem_min.
    function esForzada(cat: Categoria): boolean {
      const usos = usosAcumulados.get(cat.id) ?? 0
      const faltan = cat.frec_sem_min - usos
      if (faltan <= 0) return false
      // Días restantes (sin contar el actual) donde esta categoría podría aparecer
      const diasRestantesSinHoy = diasRestantes.filter((d) => d > dia)
      const diasValidos = diasRestantesSinHoy.filter(
        (d) => !(cat.solo_fin_semana && d < 6)
      ).length
      // Si los días restantes tras hoy son insuficientes para cubrir lo que falta,
      // hay que asignarla hoy aunque sea consecutivo
      return diasValidos < faltan
    }

    // Excluir la categoría del día anterior, SALVO si está forzada
    const poolBase = catAnterior
      ? candidatas.filter((cat) => cat.id !== catAnterior || esForzada(cat))
      : candidatas

    // Fallback: si el filtro dejó el pool vacío (caso extremo), usar todos los candidatos
    const poolFinal = poolBase.length > 0 ? poolBase : candidatas

    // Priorizar categorías que aún no han alcanzado frec_sem_min
    const necesarias = poolFinal.filter((cat) => {
      const usos = usosAcumulados.get(cat.id) ?? 0
      return usos < cat.frec_sem_min
    })

    const pool = necesarias.length > 0 ? necesarias : poolFinal

    // Elegir aleatoriamente dentro del pool válido
    const elegida = pool.map((cat) => ({ cat, r: Math.random() })).sort((a, b) => a.r - b.r)[0].cat

    resultado.set(dia, elegida.id)
    asignaciones.set(dia, elegida.id)
    usosAcumulados.set(elegida.id, (usosAcumulados.get(elegida.id) ?? 0) + 1)
  }

  return resultado
}

/**
 * Recalcula sugerencias para los días futuros NO validados de la semana actual,
 * respetando los ya validados y el día recién cambiado por el usuario.
 */
export function recalcularSugerencias(
  categorias: Categoria[],
  diasActuales: DiaConCategoria[],
  historialSemanas: Array<{ semana_inicio: string; dias: DiaConCategoria[] }>,
  semanaInicio: string,
  diaActual: number // día a partir del cual recalcular (inclusive)
): Map<number, string> {
  // Solo recalculamos días >= diaActual que no estén validados
  const diasFiltrados = diasActuales.map((d) => {
    if (d.dia_semana >= diaActual && !d.validado) {
      return { ...d, categoria_id: null }
    }
    return d
  })

  return generarSugerencias(
    categorias,
    diasFiltrados,
    historialSemanas,
    semanaInicio
  )
}
