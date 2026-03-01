'use client'

import { useEffect, useState } from 'react'
import { supabase, type Categoria } from '@/lib/supabase'

type FilaEditable = Categoria & { esNueva?: boolean }

type Props = {
  onClose: () => void
  onCambioCategorias: (cats: Categoria[]) => void
}

export default function CategoriasModal({ onClose, onCambioCategorias }: Props) {
  const [filas, setFilas] = useState<FilaEditable[]>([])
  const [guardando, setGuardando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('categorias')
      .select('*')
      .order('nombre')
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else if (data) setFilas(data as Categoria[])
      })
  }, [])

  function updateFila(id: string, campo: keyof Categoria, valor: unknown) {
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f))
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
          prev.map((f) => (f.id === fila.id ? { ...data as Categoria } : f))
        )
      }
    } else {
      const { error: err } = await supabase
        .from('categorias')
        .update(payload)
        .eq('id', fila.id)

      if (err) setError(err.message)
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
              fontFamily: 'var(--font-bebas)',
              fontSize: '1.8rem',
              letterSpacing: '0.08em',
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
                <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>C/X sem</th>
                <th style={{ ...thStyle, width: 64 }}></th>
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
                        min={1}
                        max={52}
                        onChange={(e) => updateFila(fila.id, 'cada_x_sem', parseInt(e.target.value) || 1)}
                        disabled={enCurso}
                        style={inputNumStyle}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {pidendoConfirm ? (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => eliminarFila(fila.id)}
                            disabled={enCurso}
                            style={btnDeleteConfirmStyle}
                            title="Confirmar eliminación"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setConfirmEliminar(null)}
                            style={btnCancelStyle}
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
                            style={btnSaveStyle}
                            title="Guardar"
                          >
                            💾
                          </button>
                          <button
                            onClick={() => setConfirmEliminar(fila.id)}
                            disabled={enCurso}
                            style={btnDeleteStyle}
                            title="Eliminar"
                          >
                            🗑
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
  width: 24,
  height: 24,
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.85rem',
  lineHeight: 1,
}

const btnSaveStyle: React.CSSProperties = {
  ...btnBase,
  background: 'var(--accent)',
  color: '#fff',
}

const btnDeleteStyle: React.CSSProperties = {
  ...btnBase,
  background: '#dc2626',
  color: '#fff',
}

const btnDeleteConfirmStyle: React.CSSProperties = {
  ...btnBase,
  background: '#dc2626',
  color: '#fff',
}

const btnCancelStyle: React.CSSProperties = {
  ...btnBase,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--muted)',
}
