// ============================================================
// TIPOS DE LA BASE DE DATOS — SST CONEQUIPOS
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TipoControl = 'cantidad' | 'serializado';
export type EstadoUnidad = 'disponible' | 'asignado' | 'mantenimiento' | 'baja';
export type TipoMovimiento = 'entrada' | 'salida';

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          orden: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
          orden?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
          orden?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      productos: {
        Row: {
          id: string;
          categoria_id: string | null;
          codigo: string | null;
          nombre: string;
          descripcion: string | null;
          marca: string | null;
          ubicacion: string | null;
          unidad_medida: string | null;
          tipo_control: TipoControl;
          stock_actual: number | null;
          stock_minimo: number | null;
          activo: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          categoria_id?: string | null;
          codigo?: string | null;
          nombre: string;
          descripcion?: string | null;
          marca?: string | null;
          ubicacion?: string | null;
          unidad_medida?: string | null;
          tipo_control: TipoControl;
          stock_actual?: number | null;
          stock_minimo?: number | null;
          activo?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          categoria_id?: string | null;
          codigo?: string | null;
          nombre?: string;
          descripcion?: string | null;
          marca?: string | null;
          ubicacion?: string | null;
          unidad_medida?: string | null;
          tipo_control?: TipoControl;
          stock_actual?: number | null;
          stock_minimo?: number | null;
          activo?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      unidades: {
        Row: {
          id: string;
          producto_id: string;
          codigo_interno: string;
          estado: EstadoUnidad;
          ubicacion: string | null;
          fecha_compra: string | null;
          fecha_vencimiento: string | null;
          fecha_ultimo_mantenimiento: string | null;
          fecha_proximo_mantenimiento: string | null;
          fecha_ultima_inspeccion: string | null;
          observaciones: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          producto_id: string;
          codigo_interno: string;
          estado?: EstadoUnidad;
          ubicacion?: string | null;
          fecha_compra?: string | null;
          fecha_vencimiento?: string | null;
          fecha_ultimo_mantenimiento?: string | null;
          fecha_proximo_mantenimiento?: string | null;
          fecha_ultima_inspeccion?: string | null;
          observaciones?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          producto_id?: string;
          codigo_interno?: string;
          estado?: EstadoUnidad;
          ubicacion?: string | null;
          fecha_compra?: string | null;
          fecha_vencimiento?: string | null;
          fecha_ultimo_mantenimiento?: string | null;
          fecha_proximo_mantenimiento?: string | null;
          fecha_ultima_inspeccion?: string | null;
          observaciones?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      asignaciones: {
        Row: {
          id: string;
          unidad_id: string;
          entregado_a: string;
          fecha_entrega: string;
          fecha_devolucion: string | null;
          observaciones: string | null;
          observaciones_devolucion: string | null;
          activa: boolean | null;
          created_at: string | null;
          cedula: string | null;
        };
        Insert: {
          id?: string;
          unidad_id: string;
          entregado_a: string;
          fecha_entrega?: string;
          fecha_devolucion?: string | null;
          observaciones?: string | null;
          observaciones_devolucion?: string | null;
          activa?: boolean | null;
          created_at?: string | null;
          cedula?: string | null;
        };
        Update: {
          id?: string;
          unidad_id?: string;
          entregado_a?: string;
          fecha_entrega?: string;
          fecha_devolucion?: string | null;
          observaciones?: string | null;
          observaciones_devolucion?: string | null;
          activa?: boolean | null;
          created_at?: string | null;
          cedula?: string | null;
        };
        Relationships: [];
      };

      movimientos: {
        Row: {
          id: string;
          producto_id: string;
          tipo: TipoMovimiento;
          cantidad: number;
          entregado_a: string | null;
          observaciones: string | null;
          created_at: string | null;
          cedula: string | null;
        };
        Insert: {
          id?: string;
          producto_id: string;
          tipo: TipoMovimiento;
          cantidad: number;
          entregado_a?: string | null;
          observaciones?: string | null;
          created_at?: string | null;
          cedula: string | null;
        };
        Update: {
          id?: string;
          producto_id?: string;
          tipo?: TipoMovimiento;
          cantidad?: number;
          entregado_a?: string | null;
          observaciones?: string | null;
          created_at?: string | null;
          cedula: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

// Helpers de acceso rápido por tabla
export type TablaCategoria  = Database['public']['Tables']['categorias']['Row'];
export type TablaProducto   = Database['public']['Tables']['productos']['Row'];
export type TablaUnidad     = Database['public']['Tables']['unidades']['Row'];
export type TablaAsignacion = Database['public']['Tables']['asignaciones']['Row'];
export type TablaMovimiento = Database['public']['Tables']['movimientos']['Row'];