'use client'

import { useEffect, useState } from 'react'
import { supabase, type Categoria } from '@/lib/supabase'

type FilaEditable = Categoria & { esNueva?: boolean; modificado?: boolean }

type Props = {
  userId: string
  onClose: () => void
  onCambioCategorias: (cats: Categoria[]) => void
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

export default function CategoriasModal({ userId, onClose, onCambioCategorias }: Props) {
  const [filas, setFilas] = useState<FilaEditable[]>([])
  const [guardando, setGuardando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('categorias')
      .select('*')
      .eq('user_id', userId)
      .order('nombre')
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else if (data) setFilas(data as Categoria[])
      })
  }, [])

  function updateFila(id: string, campo: keyof Categoria, valor: unknown) {
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [campo]: valor, modificado: true } : f))
    )
  }

  async function guardarFila(fila: FilaEditable) {
    setGuardando(fila.id)
    setError(null)

    const payload = {
      nombre: fila.nombre.trim(),
      solo_fin_semana: fila.solo_fin_semana,
      frec_sem_min: fila.frec_sem_min,
      frec_sem_max: fila.frec_sem_max,
      cada_x_sem: fila.cada_x_sem,
      grupo_exclusivo: fila.grupo_exclusivo ?? null,
      user_id: userId,
    }

    if (fila.esNueva) {
      const { data, error: err } = await supabase
        .from('categorias')
        .insert(payload)
        .select()
        .single()

      if (err) {
        setError(err.message)
      } else if (data) {
        setFilas((prev) =>
          prev.map((f) => (f.id === fila.id ? { ...data as Categoria, modificado: false } : f))
        )
      }
    } else {
      const { error: err } = await supabase
        .from('categorias')
        .update(payload)
        .eq('id', fila.id)

      if (err) {
        setError(err.message)
      } else {
        setFilas((prev) =>
          prev.map((f) => (f.id === fila.id ? { ...f, modificado: false } : f))
        )
      }
    }

    setGuardando(null)
  }

  async function eliminarFila(id: string) {
    setGuardando(id)
    setError(null)

    const { error: err } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)

    if (err) {
      setError(err.message)
      setGuardando(null)
    } else {
      setFilas((prev) => prev.filter((f) => f.id !== id))
      setConfirmEliminar(null)
      setGuardando(null)
    }
  }

  function añadirFila() {
    const tempId = `nueva-${Date.now()}`
    setFilas((prev) => [
      ...prev,
      {
        id: tempId,
        nombre: '',
        solo_fin_semana: false,
        frec_sem_min: 1,
        frec_sem_max: 1,
        cada_x_sem: 1,
        grupo_exclusivo: null,
        user_id: userId,
        esNueva: true,
      },
    ])
  }

  function handleCerrar() {
    const cats = filas
      .filter((f) => !f.esNueva)
      .map(({ esNueva: _, ...rest }) => rest as Categoria)
    onCambioCategorias(cats)
    onClose()
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
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCerrar()
      }}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera del modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '1.4rem',
              fontWeight: 700,
              letterSpacing: 0,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            CATEGORÍAS
          </h2>
          <button
            onClick={handleCerrar}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 6,
              width: 32,
              height: 32,
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '0.5rem 1.25rem',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-dm-sans)',
              borderBottom: '1px solid #fecaca',
            }}
          >
            {error}
          </div>
        )}

        {/* Tabla */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--surface)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <th style={thStyle}>Nombre</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>Fin sem</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 48 }}>Mín</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 48 }}>Máx</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>Cada X sem</th>
                <th style={{ ...thStyle, width: 72 }}>Grupo Exclusión</th>
                <th style={{ ...thStyle, width: 68 }}></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => {
                const enCurso = guardando === fila.id
                const pidendoConfirm = confirmEliminar === fila.id

                return (
                  <tr
                    key={fila.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      opacity: enCurso ? 0.5 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <td style={tdStyle}>
                      <input
                        type="text"
                        value={fila.nombre}
                        onChange={(e) => updateFila(fila.id, 'nombre', e.target.value)}
                        disabled={enCurso}
                        style={inputTextStyle}
                        placeholder="Nombre"
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={fila.solo_fin_semana}
                        onChange={(e) => updateFila(fila.id, 'solo_fin_semana', e.target.checked)}
                        disabled={enCurso}
                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input
                        type="number"
                        value={fila.frec_sem_min}
                        min={0}
                        max={7}
                        onChange={(e) => updateFila(fila.id, 'frec_sem_min', parseInt(e.target.value) || 0)}
                        disabled={enCurso}
                        style={inputNumStyle}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input
                        type="number"
                        value={fila.frec_sem_max}
                        min={0}
                        max={7}
                        onChange={(e) => updateFila(fila.id, 'frec_sem_max', parseInt(e.target.value) || 0)}
                        disabled={enCurso}
                        style={inputNumStyle}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input
                        type="number"
                        value={fila.cada_x_sem}
                        min={0}
                        max={52}
                        onChange={(e) => updateFila(fila.id, 'cada_x_sem', parseInt(e.target.value) || 0)}
                        disabled={enCurso}
                        style={inputNumStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        value={fila.grupo_exclusivo ?? ''}
                        onChange={(e) => updateFila(fila.id, 'grupo_exclusivo', e.target.value ? parseInt(e.target.value) : null)}
                        disabled={enCurso}
                        style={{ ...inputNumStyle, width: 56 }}
                        placeholder="—"
                        min={1}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {pidendoConfirm ? (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => eliminarFila(fila.id)}
                            disabled={enCurso}
                            style={{ ...btnBase, color: '#dc2626', border: '1px solid #dc2626' }}
                            title="Confirmar eliminación"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setConfirmEliminar(null)}
                            style={{ ...btnBase, color: 'var(--muted)', border: '1px solid var(--border)' }}
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => guardarFila(fila)}
                            disabled={enCurso || !fila.nombre.trim()}
                            style={{ ...btnBase, color: (fila.modificado || fila.esNueva) ? 'var(--accent)' : 'var(--muted)', border: '1px solid var(--border)' }}
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

        {/* Pie */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            onClick={añadirFila}
            style={{
              background: 'none',
              border: '1px dashed var(--border)',
              borderRadius: 6,
              padding: '0.4rem 0.75rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.85rem',
              color: 'var(--muted)',
              width: '100%',
              textAlign: 'center',
            }}
          >
            + Añadir categoría
          </button>
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

const inputTextStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '0.25rem 0.4rem',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.85rem',
  color: 'var(--text)',
  background: 'var(--bg)',
  width: '100%',
  minWidth: 100,
  outline: 'none',
}

const inputNumStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '0.25rem 0.4rem',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.85rem',
  color: 'var(--text)',
  background: 'var(--bg)',
  width: 52,
  textAlign: 'center',
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
