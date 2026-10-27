"use client";

import { useState, useMemo } from "react";
import {
  exportarInventarioExcel,
  exportarMovimientosExcel,
  exportarUnidadesExcel,
  exportarEquiposAlturaExcel,
  exportarAsignacionesExcel,
} from "@/lib/excel";
import Boton from "@/components/ui/Boton";
import MensajeError from "@/components/ui/MensajeError";
import type { ProductoConDetalle, Categoria } from "@/types/inventario";
import type { TablaProducto } from "@/types/supabase";
import type {
  MovimientoConProducto,
  AsignacionConDetalle,
  UnidadConProducto,
} from "@/lib/reportes";

interface ReporteCardProps {
  titulo: string;
  descripcion: string;
  total: number;
  etiquetaTotal: string;
  onExportar: () => void;
  exportando: boolean;
  extra?: React.ReactNode;
}

function ReporteCard({
  titulo,
  descripcion,
  total,
  etiquetaTotal,
  onExportar,
  exportando,
  extra,
}: ReporteCardProps) {
  const vacio = total === 0;
  return (
    <div className="border border-borde rounded p-5">
      <h2 className="text-base font-semibold text-texto">{titulo}</h2>
      <p className="text-sm text-texto-secundario mt-1">{descripcion}</p>
      {extra && <div className="mt-3">{extra}</div>}
      <div className="mt-4 flex items-center gap-3">
        <Boton
          variante="primario"
          onClick={onExportar}
          cargando={exportando}
          disabled={vacio}
        >
          {vacio ? "Sin datos para exportar" : "Exportar a Excel"}
        </Boton>
        <span className="text-xs text-texto-secundario">
          {etiquetaTotal}: <strong className="text-texto">{total}</strong>
        </span>
      </div>
    </div>
  );
}

function mesDeMovimiento(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function etiquetaMes(clave: string): string {
  if (!clave) return "";
  const [anio, mes] = clave.split("-");
  const nombres = [
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
  return `${nombres[parseInt(mes, 10) - 1]} ${anio}`;
}

interface ExportarExcelProps {
  productos: ProductoConDetalle[];
  categorias: Categoria[];
  movimientos: MovimientoConProducto[];
  asignaciones: AsignacionConDetalle[];
  unidades: UnidadConProducto[];
  equipos: TablaProducto[];
  conteoUnidades: Record<string, number>;
  conteoAsignadas: Record<string, number>;
}

export default function ExportarExcel({
  productos,
  categorias,
  movimientos,
  asignaciones,
  unidades,
  equipos,
  conteoUnidades,
  conteoAsignadas,
}: ExportarExcelProps) {
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState<string | null>(null);

  const [filtroMes, setFiltroMes] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroMesAsig, setFiltroMesAsig] = useState("");

  const mesesDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const m of movimientos) {
      const clave = mesDeMovimiento(m.created_at);
      if (clave) set.add(clave);
    }
    return Array.from(set).sort().reverse();
  }, [movimientos]);

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      if (filtroMes && mesDeMovimiento(m.created_at) !== filtroMes)
        return false;
      if (filtroCategoria && m.categoria_id !== filtroCategoria) return false;
      return true;
    });
  }, [movimientos, filtroMes, filtroCategoria]);
  const mesesDisponiblesAsig = useMemo(() => {
    const set = new Set<string>();
    for (const a of asignaciones) {
      const clave = mesDeMovimiento(a.fecha_entrega);
      if (clave) set.add(clave);
    }
    return Array.from(set).sort().reverse();
  }, [asignaciones]);

  const asignacionesFiltradas = useMemo(() => {
    if (!filtroMesAsig) return asignaciones;
    return asignaciones.filter(
      (a) => mesDeMovimiento(a.fecha_entrega) === filtroMesAsig,
    );
  }, [asignaciones, filtroMesAsig]);

  function ejecutar(id: string, fn: () => void) {
    setError(null);
    setExportando(id);
    try {
      fn();
    } catch {
      setError("Error al generar el archivo Excel. Intenta de nuevo.");
    } finally {
      setExportando(null);
    }
  }

  const hayFiltroMov = filtroMes !== "" || filtroCategoria !== "";

  return (
    <div className="flex flex-col gap-4">
      <ReporteCard
        titulo="Inventario de consumibles"
        descripcion="Productos con stock, mínimo, ubicación y estado. Un renglón por producto."
        etiquetaTotal="Total de productos"
        total={productos.length}
        onExportar={() =>
          ejecutar("inv", () => exportarInventarioExcel(productos))
        }
        exportando={exportando === "inv"}
      />

      <ReporteCard
        titulo="Movimientos de inventario"
        descripcion="Historial de entradas y salidas: fecha, cantidad, quién y observaciones."
        etiquetaTotal={
          hayFiltroMov ? "Movimientos filtrados" : "Total de movimientos"
        }
        total={movimientosFiltrados.length}
        onExportar={() =>
          ejecutar("mov", () => exportarMovimientosExcel(movimientosFiltrados))
        }
        exportando={exportando === "mov"}
        extra={
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="border border-borde rounded px-3 py-2 text-sm text-texto bg-white focus:outline-none focus:ring-2 focus:ring-primario"
            >
              <option value="">Todos los meses</option>
              {mesesDisponibles.map((clave) => (
                <option key={clave} value={clave}>
                  {etiquetaMes(clave)}
                </option>
              ))}
            </select>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="border border-borde rounded px-3 py-2 text-sm text-texto bg-white focus:outline-none focus:ring-2 focus:ring-primario"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {hayFiltroMov && (
              <button
                type="button"
                onClick={() => {
                  setFiltroMes("");
                  setFiltroCategoria("");
                }}
                className="text-xs text-primario hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        }
      />

      <ReporteCard
        titulo="Equipos de altura — listado general"
        descripcion="Equipos serializados con total de unidades, asignadas y disponibles."
        etiquetaTotal="Total de equipos"
        total={equipos.length}
        onExportar={() =>
          ejecutar("eq", () =>
            exportarEquiposAlturaExcel(
              equipos,
              conteoUnidades,
              conteoAsignadas,
            ),
          )
        }
        exportando={exportando === "eq"}
      />

      <ReporteCard
        titulo="Unidades de altura — inventario completo"
        descripcion="Todas las unidades numeradas con estado, ubicación y fecha de última inspección."
        etiquetaTotal="Total de unidades"
        total={unidades.length}
        onExportar={() =>
          ejecutar("uni", () => exportarUnidadesExcel(unidades))
        }
        exportando={exportando === "uni"}
      />

      <ReporteCard
        titulo="Historial de asignaciones (auditoría SST)"
        descripcion="Quién tuvo cada equipo, cuándo, en qué estado lo devolvió. Evidencia para auditorías."
        etiquetaTotal={
          filtroMesAsig ? "Asignaciones filtradas" : "Total de asignaciones"
        }
        total={asignacionesFiltradas.length}
        onExportar={() =>
          ejecutar("asig", () =>
            exportarAsignacionesExcel(asignacionesFiltradas),
          )
        }
        exportando={exportando === "asig"}
        extra={
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={filtroMesAsig}
              onChange={(e) => setFiltroMesAsig(e.target.value)}
              className="border border-borde rounded px-3 py-2 text-sm text-texto bg-white focus:outline-none focus:ring-2 focus:ring-primario"
            >
              <option value="">Todos los meses</option>
              {mesesDisponiblesAsig.map((clave) => (
                <option key={clave} value={clave}>
                  {etiquetaMes(clave)}
                </option>
              ))}
            </select>
            {filtroMesAsig && (
              <button
                type="button"
                onClick={() => setFiltroMesAsig("")}
                className="text-xs text-primario hover:underline"
              >
                Limpiar filtro
              </button>
            )}
          </div>
        }
      />

      <MensajeError mensaje={error} />
    </div>
  );
}
