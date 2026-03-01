'use client'

import { useEffect, useState } from 'react'
import { supabase, type Comida, type Categoria } from '@/lib/supabase'

type FilaStock = {
  id: string
  comida_id: string
  cantidad: number
  cantidadEdit: number
  esNueva?: boolean
  modificado?: boolean
}

type Props = {
  userId: string
  categorias: Categoria[]
  comidas: Comida[]
  stock: Map<string, number>
  onStockChange: (comidaId: string, nuevoAbsoluto: number) => void
  onClose: () => void
}

function IconSave({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  )
}

function IconDelete({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  )
}

export default function InventarioModal({ userId, categorias, comidas, stock, onStockChange, onClose }: Props) {
  const [filas, setFilas] = useState<FilaStock[]>([])
  const [comidaSeleccionada, setComidaSeleccionada] = useState<string>(comidas[0]?.id ?? '')
  const [cantidad, setCantidad] = useState(1)
  const [guardando, setGuardando] = useState<string | null>(null)
  const [guardandoAnadir, setGuardandoAnadir] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('stock_comidas')
      .select('id, comida_id, cantidad')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setFilas(sortFilas(data.map((r) => ({ ...r, cantidadEdit: r.cantidad }))))
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function sortFilas(list: FilaStock[]): FilaStock[] {
    return [...list].sort((a, b) => {
      const comidaA = comidas.find((c) => c.id === a.comida_id)
      const comidaB = comidas.find((c) => c.id === b.comida_id)
      const catA = categorias.find((k) => k.id === comidaA?.categoria_id)?.nombre ?? ''
      const catB = categorias.find((k) => k.id === comidaB?.categoria_id)?.nombre ?? ''
      return catA.localeCompare(catB) || (comidaA?.nombre ?? '').localeCompare(comidaB?.nombre ?? '')
    })
  }

  async function handleAnadir() {
    if (!comidaSeleccionada || cantidad === 0) return
    setGuardandoAnadir(true)
    setError(null)

    const existing = filas.find((f) => f.comida_id === comidaSeleccionada)
    const newValue = (existing?.cantidad ?? 0) + cantidad

    const { data, error: err } = await supabase
      .from('stock_comidas')
      .upsert(
        { user_id: userId, comida_id: comidaSeleccionada, cantidad: newValue, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,comida_id' }
      )
      .select('id, comida_id, cantidad')
      .single()

    if (err) {
      setError(err.message)
    } else if (data) {
      onStockChange(comidaSeleccionada, newValue)
      setCantidad(1)
      setFilas((prev) => {
        const idx = prev.findIndex((f) => f.comida_id === comidaSeleccionada)
        if (idx >= 0) {
          return sortFilas(prev.map((f) =>
            f.comida_id === comidaSeleccionada
              ? { ...f, cantidad: newValue, cantidadEdit: newValue, esNueva: true, modificado: false }
              : f
          ))
        }
        return sortFilas([...prev, { id: data.id, comida_id: comidaSeleccionada, cantidad: newValue, cantidadEdit: newValue, esNueva: true }])
      })
    }

    setGuardandoAnadir(false)
  }

  async function guardarFila(fila: FilaStock) {
    setGuardando(fila.id)
    setError(null)
    const { error: err } = await supabase
      .from('stock_comidas')
      .update({ cantidad: fila.cantidadEdit, updated_at: new Date().toISOString() })
      .eq('id', fila.id)
    if (err) {
      setError(err.message)
    } else {
      onStockChange(fila.comida_id, fila.cantidadEdit)
      setFilas((prev) =>
        prev.map((f) => f.id === fila.id ? { ...f, cantidad: fila.cantidadEdit, modificado: false } : f)
      )
    }
    setGuardando(null)
  }

  async function eliminarFila(id: string) {
    setGuardando(id)
    setError(null)
    const fila = filas.find((f) => f.id === id)
    const { error: err } = await supabase.from('stock_comidas').delete().eq('id', id)
    if (err) {
      setError(err.message)
      setGuardando(null)
    } else {
      if (fila) onStockChange(fila.comida_id, 0)
      setFilas((prev) => prev.filter((f) => f.id !== id))
      setConfirmEliminar(null)
      setGuardando(null)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            INVENTARIO
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '0.5rem 1.25rem', background: '#fef2f2', color: '#dc2626', fontSize: '0.85rem', fontFamily: 'var(--font-dm-sans)', borderBottom: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {/* Formulario añadir — arriba */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={comidaSeleccionada}
              onChange={(e) => setComidaSeleccionada(e.target.value)}
              disabled={guardandoAnadir}
              style={{ ...selectStyle, flex: 1 }}
            >
              {[...comidas].sort((a, b) => {
                const catA = categorias.find((k) => k.id === a.categoria_id)?.nombre ?? ''
                const catB = categorias.find((k) => k.id === b.categoria_id)?.nombre ?? ''
                return catA.localeCompare(catB) || a.nombre.localeCompare(b.nombre)
              }).map((c) => {
                const cat = categorias.find((k) => k.id === c.categoria_id)
                return (
                  <option key={c.id} value={c.id}>
                    {cat ? `${cat.nombre} - ` : ''}{c.nombre}
                  </option>
                )
              })}
            </select>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
              disabled={guardandoAnadir}
              style={{ ...selectStyle, width: 70, flex: 'none' }}
              min={1}
            />
          </div>
          <button
            onClick={handleAnadir}
            disabled={guardandoAnadir || !comidaSeleccionada || cantidad === 0}
            style={{
              width: '100%',
              background: 'none',
              border: '1px dashed var(--border)',
              borderRadius: 6,
              padding: '0.45rem',
              cursor: guardandoAnadir || !comidaSeleccionada || cantidad === 0 ? 'default' : 'pointer',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--accent)',
              opacity: guardandoAnadir ? 0.6 : 1,
              textAlign: 'center',
            }}
          >
            + Añadir
          </button>
        </div>

        {/* Tabla */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <th style={thStyle}>Comida</th>
                <th style={thStyle}>Categoría</th>
                <th style={{ ...thStyle, width: 80 }}>Stock</th>
                <th style={{ ...thStyle, width: 72 }}></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => {
                const comida = comidas.find((c) => c.id === fila.comida_id)
                const cat = categorias.find((k) => k.id === comida?.categoria_id)
                const enCurso = guardando === fila.id
                const pidendoConfirm = confirmEliminar === fila.id

                return (
                  <tr
                    key={fila.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: fila.esNueva ? '#f0fdf4' : 'transparent',
                      opacity: enCurso ? 0.5 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <td style={tdStyle}>{comida?.nombre ?? '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--muted)' }}>{cat?.nombre ?? '—'}</td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        value={fila.cantidadEdit}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          setFilas((prev) =>
                            prev.map((f) => f.id === fila.id ? { ...f, cantidadEdit: val, modificado: val !== f.cantidad } : f)
                          )
                        }}
                        disabled={enCurso}
                        style={{ ...inputNumStyle, color: fila.cantidadEdit < 0 ? '#dc2626' : 'var(--text)', fontWeight: 700 }}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {pidendoConfirm ? (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button onClick={() => eliminarFila(fila.id)} disabled={enCurso} style={{ ...btnBase, color: '#dc2626', border: '1px solid #dc2626' }} title="Confirmar">✓</button>
                          <button onClick={() => setConfirmEliminar(null)} style={{ ...btnBase, color: 'var(--muted)', border: '1px solid var(--border)' }} title="Cancelar">✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => guardarFila(fila)}
                            disabled={enCurso || !fila.modificado}
                            style={{ ...btnBase, color: fila.modificado ? 'var(--accent)' : 'var(--muted)', border: '1px solid var(--border)' }}
                            title="Guardar"
                          >
                            <IconSave />
                          </button>
                          <button
                            onClick={() => setConfirmEliminar(fila.id)}
                            disabled={enCurso}
                            style={{ ...btnBase, color: '#dc2626', border: '1px solid var(--border)' }}
                            title="Eliminar"
                          >
                            <IconDelete />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  textAlign: 'left',
  fontWeight: 600,
  color: 'var(--muted)',
  fontSize: '0.78rem',
  letterSpacing: '0.04em',
}

const tdStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
}

const selectStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '0.4rem 0.6rem',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.85rem',
  color: 'var(--text)',
  background: 'var(--bg)',
  outline: 'none',
  cursor: 'pointer',
}

const inputNumStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '0.25rem 0.4rem',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.85rem',
  background: 'var(--bg)',
  width: '100%',
  outline: 'none',
}

const btnBase: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 4,
  background: 'var(--bg)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.78rem',
  lineHeight: 1,
  flexShrink: 0,
}
