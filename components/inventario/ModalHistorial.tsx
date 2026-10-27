"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import ModalConfirmacion from "@/components/ui/ModalConfirmacion";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { TablaMovimiento } from "@/types/supabase";
import type { ProductoConDetalle } from "@/types/inventario";

interface ModalHistorialProps {
  abierto: boolean;
  onCerrar: () => void;
  producto: ProductoConDetalle;
}

function formatearFecha(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export default function ModalHistorial({
  abierto,
  onCerrar,
  producto,
}: ModalHistorialProps) {
  const router = useRouter();
  const [movimientos, setMovimientos] = useState<TablaMovimiento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [porBorrar, setPorBorrar] = useState<TablaMovimiento | null>(null);
  const [borrando, setBorrando] = useState(false);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroMes, setFiltroMes] = useState("");

  function cargar() {
    setCargando(true);
    const supabase = crearClienteNavegador();
    supabase
      .from("movimientos")
      .select("*")
      .eq("producto_id", producto.id)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setMovimientos((data ?? []) as TablaMovimiento[]);
        setCargando(false);
      });
  }

  useEffect(() => {
    if (abierto) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, producto.id]);

  const mesesDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const m of movimientos) {
      const clave = mesDeMovimiento(m.created_at);
      if (clave) set.add(clave);
    }
    return Array.from(set).sort().reverse();
  }, [movimientos]);

  const filtrados = useMemo(() => {
    const texto = filtroTexto.trim().toLowerCase();
    return movimientos.filter((m) => {
      if (filtroMes && mesDeMovimiento(m.created_at) !== filtroMes)
        return false;
      if (texto) {
        const nombre = (m.entregado_a ?? "").toLowerCase();
        const cedula = (m.cedula ?? "").toLowerCase();
        if (!nombre.includes(texto) && !cedula.includes(texto)) return false;
      }
      return true;
    });
  }, [movimientos, filtroMes, filtroTexto]);

  const totales = useMemo(() => {
    let entradas = 0;
    let salidas = 0;
    for (const m of filtrados) {
      if (m.tipo === "entrada") entradas += m.cantidad;
      else salidas += m.cantidad;
    }
    return { entradas, salidas };
  }, [filtrados]);

  // Regla de consumo alto: 3+ salidas del mismo producto por el mismo trabajador en el mes filtrado
  const salidasPorPersonaYMes = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const m of filtrados) {
      if (m.tipo !== "salida") continue;
      const persona = (
        m.cedula?.trim() ||
        m.entregado_a?.trim() ||
        ""
      ).toLowerCase();
      if (!persona) continue;
      const mes = mesDeMovimiento(m.created_at);
      if (!mes) continue;
      const clave = `${persona}::${mes}`;
      mapa[clave] = (mapa[clave] ?? 0) + 1;
    }
    return mapa;
  }, [filtrados]);

  function esExcesivo(m: TablaMovimiento): boolean {
    if (m.tipo !== "salida") return false;
    const persona = (
      m.cedula?.trim() ||
      m.entregado_a?.trim() ||
      ""
    ).toLowerCase();
    if (!persona) return false;
    const mes = mesDeMovimiento(m.created_at);
    if (!mes) return false;
    return (salidasPorPersonaYMes[`${persona}::${mes}`] ?? 0) >= 3;
  }

  async function confirmarBorrado() {
    if (!porBorrar) return;
    setBorrando(true);
    const supabase = crearClienteNavegador();

    const delta =
      porBorrar.tipo === "entrada" ? -porBorrar.cantidad : porBorrar.cantidad;
    const nuevoStock = (producto.stock_actual ?? 0) + delta;
    const stockFinal = Math.max(0, nuevoStock);

    const { error: errProd } = await supabase
      .from("productos")
      .update({ stock_actual: stockFinal })
      .eq("id", producto.id);

    if (errProd) {
      setBorrando(false);
      setPorBorrar(null);
      return;
    }

    const { error: errMov } = await supabase
      .from("movimientos")
      .delete()
      .eq("id", porBorrar.id);

    setBorrando(false);
    setPorBorrar(null);
    if (errMov) return;

    cargar();
    router.refresh();
  }

  const hayFiltro = filtroMes !== "" || filtroTexto.trim() !== "";

  return (
    <>
      <Modal
        abierto={abierto}
        onCerrar={onCerrar}
        titulo={`Historial — ${producto.nombre}`}
        ancho="extra-grande"
      >
        <div className="flex flex-col gap-3 mb-3">
          <div className="grid grid-cols-[1fr_220px] gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre o cédula…"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="border border-borde rounded px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario"
            />
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
          </div>

          {hayFiltro && (
            <div className="flex flex-wrap items-center gap-4 text-xs border border-borde rounded px-3 py-2 bg-fondo-secundario">
              <span className="text-exito font-semibold">
                Entradas: +{totales.entradas}
              </span>
              <span className="text-alerta font-semibold">
                Salidas: −{totales.salidas}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFiltroTexto("");
                  setFiltroMes("");
                }}
                className="text-primario hover:underline ml-auto"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {cargando && (
          <p className="text-sm text-texto-secundario text-center py-6">
            Cargando…
          </p>
        )}

        {!cargando && movimientos.length === 0 && (
          <p className="text-sm text-texto-secundario text-center py-6">
            Este producto no tiene movimientos registrados.
          </p>
        )}

        {!cargando && movimientos.length > 0 && filtrados.length === 0 && (
          <p className="text-sm text-texto-secundario text-center py-6">
            No hay movimientos que coincidan con el filtro.
          </p>
        )}

        {!cargando && filtrados.length > 0 && (
          <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-borde">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-fondo-secundario">
                <tr className="border-b border-borde">
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                    Fecha
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                    Tipo
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-texto whitespace-nowrap">
                    Cantidad
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                    Entregado a
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                    Cédula
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                    Observaciones
                  </th>
                  <th className="text-center px-2 py-3 font-semibold text-texto whitespace-nowrap">
                    ·
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((m) => {
                  const excesivo = esExcesivo(m);
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-borde last:border-0 hover:bg-fondo-secundario/50"
                    >
                      <td className="px-4 py-3 text-texto-secundario whitespace-nowrap">
                        {formatearFecha(m.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold",
                            m.tipo === "entrada"
                              ? "bg-green-50 text-exito"
                              : "bg-red-50 text-alerta",
                          ].join(" ")}
                        >
                          {m.tipo === "entrada" ? "Entrada" : "Salida"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-texto font-semibold">
                        {m.cantidad}
                      </td>
                      <td className="px-4 py-3">
                        {excesivo ? (
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            {m.entregado_a ?? "—"}
                            <span
                              className="text-xs"
                              title="3 o más salidas del mismo producto en este mes"
                            >
                              ⚠
                            </span>
                          </span>
                        ) : (
                          <span className="text-texto">
                            {m.entregado_a ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-texto-secundario whitespace-nowrap">
                        {m.cedula ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-texto-secundario">
                        {m.observaciones ?? "—"}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setPorBorrar(m)}
                          className="p-1 text-texto-secundario hover:text-alerta"
                          title="Eliminar movimiento"
                          aria-label="Eliminar movimiento"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-5">
          <button
            type="button"
            onClick={onCerrar}
            className="w-full px-4 py-2 border border-borde rounded text-sm hover:bg-fondo-secundario"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      <ModalConfirmacion
        abierto={porBorrar !== null}
        onCerrar={() => !borrando && setPorBorrar(null)}
        onConfirmar={confirmarBorrado}
        titulo="¿Deseas borrar este registro?"
        mensaje="Se corregirá el stock actual del producto de forma automática."
        textoConfirmar="Sí, borrar"
        variante="peligro"
        cargando={borrando}
      />
    </>
  );
}
