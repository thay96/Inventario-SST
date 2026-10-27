// ============================================================
// Queries de Equipos de Altura (unidades serializadas)
// ============================================================
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { TablaProducto, TablaUnidad } from "@/types/supabase";

export type UnidadConAsignacion = TablaUnidad & {
  asignado_a: string | null;
  fecha_entrega: string | null;
  fecha_devolucion: string | null;
  asignacion_id: string | null;
  asignacion_observaciones: string | null;
  asignacion_observaciones_devolucion: string | null;
};

// Productos que son Equipos de Altura (tipo_control = 'serializado')
export async function getProductosAltura(): Promise<TablaProducto[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("tipo_control", "serializado")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as TablaProducto[];
}

export async function getProductoAlturaPorId(
  id: string,
): Promise<TablaProducto | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("id", id)
    .eq("tipo_control", "serializado")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as TablaProducto) ?? null;
}
// Devuelve el siguiente código ALT-XXX disponible
export async function getUltimoCodigoAltura(): Promise<string> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("productos")
    .select("codigo")
    .eq("tipo_control", "serializado")
    .like("codigo", "ALT-%")
    .order("codigo", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);

  const ultimo = data?.[0]?.codigo as string | undefined;
  if (!ultimo) return "ALT-001";

  const match = ultimo.match(/^ALT-(\d+)$/);
  if (!match) return "ALT-001";

  const siguiente = parseInt(match[1], 10) + 1;
  return `ALT-${String(siguiente).padStart(3, "0")}`;
}

export async function getUnidadesPorProducto(
  productoId: string,
): Promise<UnidadConAsignacion[]> {
  const supabase = await crearClienteServidor();

  const { data: unidades, error } = await supabase
    .from("unidades")
    .select("*")
    .eq("producto_id", productoId)
    .order("codigo_interno", { ascending: true });

  if (error) throw new Error(error.message);
  if (!unidades || unidades.length === 0) return [];

  const ids = unidades.map((u) => u.id);

  const { data: asignaciones, error: errAsig } = await supabase
    .from("asignaciones")
    .select(
      "id, unidad_id, entregado_a, fecha_entrega, fecha_devolucion, observaciones, observaciones_devolucion",
    )
    .in("unidad_id", ids)
    .eq("activa", true);

  if (errAsig) throw new Error(errAsig.message);

  type AsigData = {
    id: string;
    unidad_id: string;
    entregado_a: string | null;
    fecha_entrega: string | null;
    fecha_devolucion: string | null;
    observaciones: string | null;
    observaciones_devolucion: string | null;
  };

  const mapa: Record<string, AsigData> = {};
  for (const a of (asignaciones ?? []) as AsigData[]) {
    if (a.unidad_id) mapa[a.unidad_id] = a;
  }

  return unidades.map((u) => {
    const asig = mapa[u.id];
    return {
      ...(u as TablaUnidad),
      asignado_a: asig?.entregado_a ?? null,
      fecha_entrega: asig?.fecha_entrega ?? null,
      fecha_devolucion: asig?.fecha_devolucion ?? null,
      asignacion_id: asig?.id ?? null,
      asignacion_observaciones: asig?.observaciones ?? null,
      asignacion_observaciones_devolucion:
        asig?.observaciones_devolucion ?? null,
    };
  });
}

export async function getUnidadPorId(id: string): Promise<TablaUnidad | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("unidades")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as TablaUnidad) ?? null;
}

// Conteo de unidades por producto (para lista principal de Altura)
export async function getConteoUnidades(): Promise<Record<string, number>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("unidades").select("producto_id");

  if (error) throw new Error(error.message);

  const conteo: Record<string, number> = {};
  for (const fila of data ?? []) {
    const pid = (fila as { producto_id: string | null }).producto_id;
    if (pid) conteo[pid] = (conteo[pid] ?? 0) + 1;
  }
  return conteo;
}

// Conteo de unidades asignadas por producto (para la lista de equipos)
export async function getConteoAsignadas(): Promise<Record<string, number>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("unidades")
    .select("producto_id, estado")
    .eq("estado", "asignado");

  if (error) return {};

  const conteo: Record<string, number> = {};
  for (const u of data ?? []) {
    if (!u.producto_id) continue;
    conteo[u.producto_id] = (conteo[u.producto_id] ?? 0) + 1;
  }
  return conteo;
}
// ------------------------------------------------------------
// Dashboard — KPIs y actividad
// ------------------------------------------------------------

export async function getConteoInspeccionesPorVencer(): Promise<number> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("unidades")
    .select("fecha_ultima_inspeccion");

  if (error) return 0;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let contador = 0;
  for (const u of data ?? []) {
    const fecha = u.fecha_ultima_inspeccion;
    if (!fecha) continue;
    const partes = fecha.split("-");
    if (partes.length !== 3) continue;
    const anio = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const dia = parseInt(partes[2], 10);
    if (isNaN(anio) || isNaN(mes) || isNaN(dia)) continue;

    const proxima = new Date(anio + 1, mes - 1, dia);
    const diffMs = proxima.getTime() - hoy.getTime();
    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (dias <= 30) contador++;
  }
  return contador;
}

export interface AsignacionActivaDashboard {
  id: string;
  trabajador: string;
  equipo: string;
  producto_id: string;
  unidad: string;
  fecha_entrega: string;
}

export async function getEquiposAsignadosActualmente(): Promise<
  AsignacionActivaDashboard[]
> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("asignaciones")
    .select(
      `
      id,
      entregado_a,
      fecha_entrega,
      unidad:unidades!inner (
        codigo_interno,
        producto:productos!inner ( nombre )
      )
    `,
    )
    .eq("activa", true)
    .order("fecha_entrega", { ascending: false })
    .limit(20);

  if (error) return [];
  type Row = {
    id: string;
    entregado_a: string | null;
    fecha_entrega: string | null;
    unidad: {
      codigo_interno: string | null;
      producto: { id: string; nombre: string | null } | null;
    } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    trabajador: r.entregado_a ?? "—",
    equipo: r.unidad?.producto?.nombre ?? "—",
    producto_id: r.unidad?.producto?.id ?? "",
    unidad: r.unidad?.codigo_interno ?? "—",
    fecha_entrega: r.fecha_entrega ?? "",
  }));
}

export interface UnidadPorVencer {
  unidad_id: string;
  producto_id: string;
  producto_nombre: string;
  codigo_interno: string;
  fecha_proxima_inspeccion: string; // YYYY-MM-DD
  dias_restantes: number;
}

export async function getUnidadesPorVencer(
  limite = 5,
): Promise<UnidadPorVencer[]> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("unidades")
    .select(
      `
      id,
      codigo_interno,
      fecha_ultima_inspeccion,
      producto:productos!inner ( id, nombre, tipo_control )
    `,
    )
    .eq("producto.tipo_control", "serializado")
    .not("fecha_ultima_inspeccion", "is", null);

  if (error) return [];

  type Row = {
    id: string;
    codigo_interno: string;
    fecha_ultima_inspeccion: string | null;
    producto: { id: string; nombre: string; tipo_control: string } | null;
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const resultados: UnidadPorVencer[] = [];

  for (const u of (data ?? []) as unknown as Row[]) {
    const fecha = u.fecha_ultima_inspeccion;
    if (!fecha) continue;
    const partes = fecha.split("-");
    if (partes.length !== 3) continue;
    const anio = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const dia = parseInt(partes[2], 10);
    if (isNaN(anio) || isNaN(mes) || isNaN(dia)) continue;

    const proxima = new Date(anio + 1, mes - 1, dia);
    const diffMs = proxima.getTime() - hoy.getTime();
    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (dias <= 30) {
      const yyyy = proxima.getFullYear();
      const mm = String(proxima.getMonth() + 1).padStart(2, "0");
      const dd = String(proxima.getDate()).padStart(2, "0");
      resultados.push({
        unidad_id: u.id,
        producto_id: u.producto?.id ?? "",
        producto_nombre: u.producto?.nombre ?? "—",
        codigo_interno: u.codigo_interno,
        fecha_proxima_inspeccion: `${yyyy}-${mm}-${dd}`,
        dias_restantes: dias,
      });
    }
  }

  resultados.sort((a, b) => a.dias_restantes - b.dias_restantes);
  return resultados.slice(0, limite);
}
