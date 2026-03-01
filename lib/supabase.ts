import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Categoria = {
  id: string
  nombre: string
  solo_fin_semana: boolean
  frec_sem_min: number
  frec_sem_max: number
  cada_x_sem: number
  grupo_exclusivo: number | null
  user_id: string
}

export type Comida = {
  id: string
  nombre: string
  categoria_id: string | null
  user_id: string
}

export type SemanaDia = {
  id: string
  semana_inicio: string
  dia_fecha: string
  dia_semana: number
  categoria_id: string | null
  comida_id: string | null
  validado: boolean
  created_at: string
  user_id: string
}

export type StockComida = {
  id: string
  user_id: string
  comida_id: string
  cantidad: number
  updated_at: string
}
