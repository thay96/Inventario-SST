// ============================================================
// TIPOS DE INVENTARIO — Sistema SST CONEQUIPOS
// ============================================================
// Alineados al schema real de Supabase (Esquema A).
// El `producto` se relaciona con `categorias` por `categoria_id`.
// ============================================================

import type {
  TipoControl,
  EstadoUnidad as EstadoUnidadDB,
} from '@/types/supabase'

// Reexportamos el tipo de la BD con nombre amigable
export type { TipoControl }
export type EstadoUnidad = EstadoUnidadDB

// Etiquetas legibles para el usuario final
export const ETIQUETAS_ESTADO_UNIDAD: Record<EstadoUnidad, string> = {
  disponible:    'DISPONIBLE',
  asignado:      'ASIGNADO',
  mantenimiento: 'EN MANTENIMIENTO',
  baja:          'DADO DE BAJA',
}

// ------------------------------------------------------------
// Categorías
// ------------------------------------------------------------
export interface Categoria {
  id: string
  nombre: string
  descripcion: string | null
  orden: number | null
}

// ------------------------------------------------------------
// Productos
// ------------------------------------------------------------
export interface Producto {
  id: string
  nombre: string
  categoria_id: string | null
  tipo_control: TipoControl
  unidad_medida: string | null
  stock_actual: number | null
  stock_minimo: number | null
  activo: boolean | null
  created_at: string | null
  codigo: string | null
  descripcion: string | null
  marca: string | null
  ubicacion: string | null
}

// Producto + datos de su categoría (JOIN) + flag de stock crítico
// Se usa para listar en la tabla de inventario
export interface ProductoConDetalle extends Producto {
  categoria: Categoria | null
  stock_critico: boolean
}

// ------------------------------------------------------------
// Unidades (serializados)
// ------------------------------------------------------------
export interface Unidad {
  id: string
  producto_id: string | null
  codigo_interno: string
  estado: EstadoUnidad | null
  ubicacion: string | null
  fecha_compra: string | null
  fecha_vencimiento: string | null
  observaciones: string | null
  created_at: string | null
  fecha_ultimo_mantenimiento: string | null
  fecha_proximo_mantenimiento: string | null
}

// ------------------------------------------------------------
// Filtros de la tabla de inventario (leídos desde searchParams)
// ------------------------------------------------------------
export interface FiltrosInventario {
  categoriaId: string   // UUID o '' si no hay filtro
  busqueda: string      // texto libre por nombre o código
  tipoControl: TipoControl | ''
}