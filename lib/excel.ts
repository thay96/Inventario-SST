// ============================================================
// Exportación de inventario a Excel usando SheetJS (xlsx)
// ============================================================

import * as XLSX from "xlsx";
import type { ProductoConDetalle } from "@/types/inventario";
import type { TablaProducto } from "@/types/supabase";
import type {
  MovimientoConProducto,
  AsignacionConDetalle,
  UnidadConProducto,
} from "@/lib/reportes";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function exportarInventarioExcel(productos: ProductoConDetalle[]): void {
  const filas = productos.map((p) => ({
    Código: p.codigo ?? "",
    Nombre: p.nombre,
    Categoría: p.categoria?.nombre ?? "Sin categoría",
    "Tipo control":
      p.tipo_control === "serializado" ? "Serializado" : "Por cantidad",
    "Stock actual": p.stock_actual ?? 0,
    "Stock mínimo": p.stock_minimo ?? 0,
    "Unidad de medida": p.unidad_medida ?? "",
    Ubicación: p.ubicacion ?? "Sin especificar",
    "Estado stock": p.stock_critico ? "CRÍTICO" : "Normal",
    Descripción: p.descripcion ?? "",
  }));

  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
    { wch: 12 },
    { wch: 40 },
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Inventario");

  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}-${MESES[hoy.getMonth()]}`;
  const nombreArchivo = nombreArchivoConFecha('Inventario-SST-CONEQUIPOS')
  XLSX.writeFile(libro, nombreArchivo);
}

// ============================================================
// Reportes ampliados
// ============================================================

function nombreArchivoConFecha(base: string): string {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  return `${base}-${yyyy}-${mm}-${dd}.xlsx`;
}

function formatearFecha(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function exportarMovimientosExcel(
  movimientos: MovimientoConProducto[],
): void {
  const filas = movimientos.map((m) => ({
    Fecha: formatearFecha(m.created_at),
    Código: m.producto_codigo,
    Producto: m.producto_nombre,
    Tipo: m.tipo === "entrada" ? "Entrada" : "Salida",
    Cantidad: m.cantidad,
    "Entregado a": m.entregado_a ?? "",
    Observaciones: m.observaciones ?? "",
  }));
  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 24 },
    { wch: 40 },
  ];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
  XLSX.writeFile(libro, nombreArchivoConFecha("Movimientos-SST-CONEQUIPOS"));
}

export function exportarUnidadesExcel(unidades: UnidadConProducto[]): void {
  const filas = unidades.map((u) => ({
    "Código producto": u.producto_codigo,
    Equipo: u.producto_nombre,
    "N° interno": u.codigo_interno,
    Estado: (u.estado ?? "").toUpperCase(),
    Ubicación: u.ubicacion ?? "",
    "Última inspección": formatearFecha(u.fecha_ultima_inspeccion),
    Observaciones: u.observaciones ?? "",
  }));
  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 10 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 40 },
  ];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Unidades Altura");
  XLSX.writeFile(
    libro,
    nombreArchivoConFecha("Unidades-Altura-SST-CONEQUIPOS"),
  );
}

export function exportarEquiposAlturaExcel(
  equipos: TablaProducto[],
  totalUnidadesPorProducto: Record<string, number>,
  asignadasPorProducto: Record<string, number>,
): void {
  const filas = equipos.map((e) => {
    const total = totalUnidadesPorProducto[e.id] ?? 0;
    const asignadas = asignadasPorProducto[e.id] ?? 0;
    return {
      Código: e.codigo ?? "",
      Equipo: e.nombre,
      "Ubicación física": e.ubicacion ?? "",
      "Total unidades": total,
      Asignadas: asignadas,
      Disponibles: total - asignadas,
    };
  });
  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
  ];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Equipos Altura");
  XLSX.writeFile(libro, nombreArchivoConFecha("Equipos-Altura-SST-CONEQUIPOS"));
}

export function exportarAsignacionesExcel(
  asignaciones: AsignacionConDetalle[],
): void {
  const filas = asignaciones.map((a) => ({
    Equipo: a.producto_nombre,
    "N° interno": a.codigo_interno,
    "Asignado a": a.entregado_a,
    "Fecha entrega": formatearFecha(a.fecha_entrega),
    "Fecha devolución": formatearFecha(a.fecha_devolucion),
    Estado: a.activa ? "ACTIVO" : "DEVUELTO",
    "Obs. asignación": a.observaciones ?? "",
    "Obs. devolución": a.observaciones_devolucion ?? "",
  }));
  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = [
    { wch: 28 },
    { wch: 10 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 32 },
    { wch: 32 },
  ];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Asignaciones");
  XLSX.writeFile(libro, nombreArchivoConFecha("Asignaciones-SST-CONEQUIPOS"));
}
