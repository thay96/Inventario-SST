// Reportes — consultas agregadas para exportación
import { crearClienteServidor } from '@/lib/supabase/servidor'
import type {
  TablaUnidad,
  TablaAsignacion,
  TablaMovimiento,
  TablaProducto,
} from '@/types/supabase'
import type { ProductoConDetalle } from '@/types/inventario'

export interface MovimientoConProducto extends TablaMovimiento {
  producto_nombre: string
  producto_codigo: string
  categoria_id: string | null
  categoria_nombre: string | null
}

export interface AsignacionConDetalle extends TablaAsignacion {
  producto_nombre: string
  codigo_interno: string
}

export interface UnidadConProducto extends TablaUnidad {
  producto_nombre: string
  producto_codigo: string
}

export async function getMovimientosReporte(): Promise<MovimientoConProducto[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('movimientos')
    .select('*, producto:productos ( nombre, codigo, categoria_id, categoria:categorias ( nombre ) )')
    .order('created_at', { ascending: false })

  if (error) return []

  type Row = TablaMovimiento & {
    producto:
      | {
          nombre: string | null
          codigo: string | null
          categoria_id: string | null
          categoria: { nombre: string | null } | null
        }
      | null
  }

  return ((data ?? []) as unknown as Row[]).map((m) => ({
    ...m,
    producto_nombre: m.producto?.nombre ?? '—',
    producto_codigo: m.producto?.codigo ?? '—',
    categoria_id: m.producto?.categoria_id ?? null,
    categoria_nombre: m.producto?.categoria?.nombre ?? null,
  }))
}

export async function getAsignacionesReporte(): Promise<AsignacionConDetalle[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('asignaciones')
    .select(
      `
      *,
      unidad:unidades (
        codigo_interno,
        producto:productos ( nombre )
      )
    `
    )
    .order('fecha_entrega', { ascending: false })

  if (error) return []

  type Row = TablaAsignacion & {
    unidad:
      | {
          codigo_interno: string | null
          producto: { nombre: string | null } | null
        }
      | null
  }

  return ((data ?? []) as unknown as Row[]).map((a) => ({
    ...a,
    producto_nombre: a.unidad?.producto?.nombre ?? '—',
    codigo_interno: a.unidad?.codigo_interno ?? '—',
  }))
}

export async function getUnidadesReporte(): Promise<UnidadConProducto[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('unidades')
    .select('*, producto:productos ( nombre, codigo )')
    .order('producto_id', { ascending: true })

  if (error) return []

  type Row = TablaUnidad & {
    producto: { nombre: string | null; codigo: string | null } | null
  }

  return ((data ?? []) as unknown as Row[]).map((u) => ({
    ...u,
    producto_nombre: u.producto?.nombre ?? '—',
    producto_codigo: u.producto?.codigo ?? '—',
  }))
}

export async function getProductosAlturaReporte(): Promise<TablaProducto[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('tipo_control', 'serializado')
    .order('codigo', { ascending: true })

  if (error) return []
  return (data ?? []) as TablaProducto[]
}

export type { ProductoConDetalle }