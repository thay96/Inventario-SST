// Queries de movimientos (entradas/salidas de consumibles)
import { crearClienteServidor } from '@/lib/supabase/servidor'
import type { TablaMovimiento } from '@/types/supabase'

export async function getMovimientosPorProducto(
  productoId: string
): Promise<TablaMovimiento[]> {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase
    .from('movimientos')
    .select('*')
    .eq('producto_id', productoId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []
  return (data ?? []) as TablaMovimiento[]
}