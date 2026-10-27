// ============================================================
// Queries de inventario — productos y categorías
// ============================================================
import { crearClienteServidor } from '@/lib/supabase/servidor'
import type {
  Producto,
  ProductoConDetalle,
  FiltrosInventario,
  Categoria,
} from '@/types/inventario'

// ------------------------------------------------------------
// Productos
// ------------------------------------------------------------

// Obtiene productos con su categoría (JOIN) y flag de stock crítico.
export async function getProductos(
  filtros?: FiltrosInventario
): Promise<ProductoConDetalle[]> {
  const supabase = await crearClienteServidor()

  let query = supabase
    .from('productos')
    .select('*, categoria:categorias(*)')
    .eq('tipo_control', 'cantidad')
    .order('nombre', { ascending: true })

  if (filtros?.categoriaId) query = query.eq('categoria_id', filtros.categoriaId)
  if (filtros?.busqueda) {
    query = query.or(
      `nombre.ilike.%${filtros.busqueda}%,codigo.ilike.%${filtros.busqueda}%`
    )
  }

  const { data, error } = await query
  if (error) return []

  return (data ?? []).map((p) => {
    const row = p as Producto & { categoria: Categoria | null }
    const stockActual = row.stock_actual ?? 0
    const stockMinimo = row.stock_minimo ?? 0
    return {
      ...row,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
      stock_critico: stockActual <= stockMinimo,
    }
  })
}

// Devuelve el siguiente código con el prefijo dado (ej: EPP-001)
export async function getSiguienteCodigoPorPrefijo(prefijo: string): Promise<string> {
  const supabase = await crearClienteServidor()
  const prefijoLimpio = prefijo.toUpperCase().replace(/[^A-Z0-9]/g, '')

  const { data, error } = await supabase
    .from('productos')
    .select('codigo')
    .eq('tipo_control', 'cantidad')
    .like('codigo', `${prefijoLimpio}-%`)
    .order('codigo', { ascending: false })
    .limit(1)

  if (error) return `${prefijoLimpio}-001`

  const ultimo = data?.[0]?.codigo as string | undefined
  if (!ultimo) return `${prefijoLimpio}-001`

  const match = ultimo.match(new RegExp(`^${prefijoLimpio}-(\\d+)$`))
  if (!match) return `${prefijoLimpio}-001`

  const siguiente = parseInt(match[1], 10) + 1
  return `${prefijoLimpio}-${String(siguiente).padStart(3, '0')}`
}

// Helper: prefijo corto por defecto según nombre de categoría
export function prefijoCategoria(nombre: string): string {
  const n = nombre.toUpperCase()
  if (n.includes('EPP')) return 'EPP'
  if (n.includes('DOTACION') || n.includes('DOTACIÓN')) return 'DOT'
  if (n.includes('EMERGENCIA')) return 'EMERG'
  // fallback: primeras 3 letras sin espacios ni tildes
  return n.replace(/[^A-Z]/g, '').slice(0, 3) || 'PROD'
}

// Conteo de productos con stock crítico (para el dashboard)
export async function getConteoStockCritico(): Promise<number> {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase
    .from('productos')
    .select('stock_actual, stock_minimo')

  if (error) throw new Error(`Error al calcular stock crítico: ${error.message}`)

  return (data ?? []).filter(
    (p) => (p.stock_actual ?? 0) <= (p.stock_minimo ?? 0)
  ).length
}

// Total de productos registrados (para el dashboard)
export async function getTotalProductos(): Promise<number> {
  const supabase = await crearClienteServidor()
  const { count, error } = await supabase
    .from('productos')
    .select('*', { count: 'exact', head: true })

  if (error) throw new Error(`Error al contar productos: ${error.message}`)
  return count ?? 0
}

// ------------------------------------------------------------
// Categorías
// ------------------------------------------------------------

export async function getCategorias(): Promise<Categoria[]> {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('orden', { ascending: true })

  if (error) return []
  return (data ?? []) as Categoria[]
}