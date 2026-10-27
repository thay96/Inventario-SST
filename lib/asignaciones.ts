import { crearClienteServidor } from './supabase/servidor'
import type { TablaAsignacion } from '@/types/supabase'

export async function getAsignacionActiva(unidadId: string): Promise<TablaAsignacion | null> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('asignaciones')
    .select('*')
    .eq('unidad_id', unidadId)
    .eq('activa', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as TablaAsignacion) ?? null
}

export async function getHistorialAsignaciones(unidadId: string): Promise<TablaAsignacion[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('asignaciones')
    .select('*')
    .eq('unidad_id', unidadId)
    .order('fecha_entrega', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as TablaAsignacion[]
}