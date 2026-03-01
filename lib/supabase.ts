import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Categoria = {
  id: string
  nombre: string
  solo_fin_semana: boolean
  frec_sem_min: number
  frec_sem_max: number
  cada_x_sem: number
}

export type SemanaDia = {
  id: string
  semana_inicio: string
  dia_fecha: string
  dia_semana: number
  categoria_id: string | null
  validado: boolean
  created_at: string
}
