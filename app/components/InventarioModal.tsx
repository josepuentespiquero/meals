'use client'

import { useEffect, useState } from 'react'
import { supabase, type Comida, type Categoria } from '@/lib/supabase'

type Props = {
  userId: string
  categorias: Categoria[]
  stock: Map<string, number>
  onStockChange: (catId: string, nuevoAbsoluto: number) => void
  onClose: () => void
}

export default function InventarioModal({ userId, categorias, stock, onStockChange, onClose }: Props) {
  const [comidas, setComidas] = useState<Comida[]>([])
  const [comidaSeleccionada, setComidaSeleccionada] = useState<string>('')
  const [cantidad, setCantidad] = useState(1)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('comidas')
      .select('*')
      .eq('user_id', userId)
      .order('nombre')
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else if (data) {
          setComidas(data as Comida[])
          if (data.length > 0) setComidaSeleccionada(data[0].id)
        }
      })
  }, [userId])

  async function handleAnadir() {
    const comida = comidas.find((c) => c.id === comidaSeleccionada)
    if (!comida?.categoria_id || cantidad === 0) return

    setGuardando(true)
    setError(null)

    const catId = comida.categoria_id
    const newValue = (stock.get(catId) ?? 0) + cantidad

    const { error: err } = await supabase
      .from('stock_categorias')
      .upsert(
        { user_id: userId, categoria_id: catId, cantidad: newValue, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,categoria_id' }
      )

    if (err) {
      setError(err.message)
    } else {
      onStockChange(catId, newValue)
      setCantidad(1)
    }

    setGuardando(false)
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
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera */}
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
            INVENTARIO
          </h2>
          <button
            onClick={onClose}
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

        {/* Tabla de stock */}
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
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <th style={thStyle}>Categoría</th>
                <th style={{ ...thStyle, textAlign: 'right', width: 80 }}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => {
                const qty = stock.get(cat.id) ?? 0
                return (
                  <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>{cat.nombre}</td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: 'right',
                        fontWeight: 700,
                        color: qty < 0 ? '#dc2626' : 'var(--text)',
                      }}
                    >
                      {qty}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer: añadir stock */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <select
            value={comidaSeleccionada}
            onChange={(e) => setComidaSeleccionada(e.target.value)}
            disabled={guardando}
            style={selectStyle}
          >
            {comidas.map((c) => {
              const cat = categorias.find((k) => k.id === c.categoria_id)
              return (
                <option key={c.id} value={c.id}>
                  {c.nombre}{cat ? ` (${cat.nombre})` : ''}
                </option>
              )
            })}
          </select>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
              disabled={guardando}
              style={{ ...selectStyle, flex: 1 }}
              min={1}
            />
            <button
              onClick={handleAnadir}
              disabled={guardando || !comidaSeleccionada || cantidad === 0}
              style={{
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 6,
                padding: '0.4rem 1rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#fff',
                opacity: guardando ? 0.6 : 1,
              }}
            >
              Añadir
            </button>
          </div>
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
  padding: '0.5rem 0.75rem',
}

const selectStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '0.4rem 0.6rem',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.85rem',
  color: 'var(--text)',
  background: 'var(--bg)',
  width: '100%',
  outline: 'none',
  cursor: 'pointer',
}
