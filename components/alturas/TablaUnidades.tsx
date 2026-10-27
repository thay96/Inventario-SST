"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Boton from "@/components/ui/Boton";
import MensajeError from "@/components/ui/MensajeError";
import ModalConfirmacion from "@/components/ui/ModalConfirmacion";
import FormularioAsignacion from "@/components/alturas/FormularioAsignacion";
import ModalHistorialUnidad from "@/components/alturas/ModalHistorialUnidad";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { UnidadConAsignacion } from "@/lib/alturas";
import type { TablaAsignacion } from "@/types/supabase";

const ETIQUETAS_ESTADO: Record<string, string> = {
  disponible: "DISPONIBLE",
  asignado: "ASIGNADO",
  mantenimiento: "EN REVISIÓN",
  baja: "DADO DE BAJA",
};

function varianteEstado(
  estado: string | null,
): "bueno" | "critico" | "pendiente" | "advertencia" {
  if (estado === "disponible") return "bueno";
  if (estado === "asignado") return "advertencia";
  if (estado === "mantenimiento") return "pendiente";
  if (estado === "baja") return "critico";
  return "pendiente";
}

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}

function calcularProximaInspeccion(fechaUltima: string | null): {
  fecha: string | null;
  diasRestantes: number | null;
} {
  if (!fechaUltima) return { fecha: null, diasRestantes: null };
  const partes = fechaUltima.split("-");
  if (partes.length !== 3) return { fecha: null, diasRestantes: null };
  const anio = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  const dia = parseInt(partes[2], 10);
  if (isNaN(anio) || isNaN(mes) || isNaN(dia))
    return { fecha: null, diasRestantes: null };

  const proxima = new Date(anio + 1, mes - 1, dia);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diffMs = proxima.getTime() - hoy.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const yyyy = proxima.getFullYear();
  const mm = String(proxima.getMonth() + 1).padStart(2, "0");
  const dd = String(proxima.getDate()).padStart(2, "0");
  return { fecha: `${dd}/${mm}/${yyyy}`, diasRestantes };
}

interface TablaUnidadesProps {
  unidades: UnidadConAsignacion[];
  productoId: string;
}

export default function TablaUnidades({
  unidades,
  productoId,
}: TablaUnidadesProps) {
  const router = useRouter();
  const [unidadActiva, setUnidadActiva] = useState<UnidadConAsignacion | null>(
    null,
  );
  const [historialUnidad, setHistorialUnidad] =
    useState<UnidadConAsignacion | null>(null);
  const [editandoInspeccion, setEditandoInspeccion] =
    useState<UnidadConAsignacion | null>(null);

  const [nuevaFecha, setNuevaFecha] = useState("");
  const [guardandoFecha, setGuardandoFecha] = useState(false);
  const [errorFecha, setErrorFecha] = useState<string | null>(null);

  const [unidadPorBorrar, setUnidadPorBorrar] =
    useState<UnidadConAsignacion | null>(null);
  const [borrandoUnidad, setBorrandoUnidad] = useState(false);
  const [infoBloqueoUnidad, setInfoBloqueoUnidad] = useState<string | null>(
    null,
  );

  function abrirEdicionInspeccion(u: UnidadConAsignacion) {
    setEditandoInspeccion(u);
    setNuevaFecha(u.fecha_ultima_inspeccion ?? "");
    setErrorFecha(null);
  }

  async function guardarInspeccion() {
    if (!editandoInspeccion) return;
    if (!nuevaFecha) {
      setErrorFecha("La fecha es obligatoria.");
      return;
    }
    setGuardandoFecha(true);
    setErrorFecha(null);
    const supabase = crearClienteNavegador();
    const { error } = await supabase
      .from("unidades")
      .update({ fecha_ultima_inspeccion: nuevaFecha })
      .eq("id", editandoInspeccion.id);

    setGuardandoFecha(false);
    if (error) {
      setErrorFecha(error.message);
      return;
    }
    setEditandoInspeccion(null);
    router.refresh();
  }

  async function intentarEliminarUnidad(u: UnidadConAsignacion) {
    if (u.estado === "asignado" || u.asignacion_id) {
      setInfoBloqueoUnidad(
        `La unidad #${u.codigo_interno} está asignada actualmente. Regístrala como devuelta antes de eliminarla.`,
      );
      return;
    }
    if (u.estado === "mantenimiento") {
      setInfoBloqueoUnidad(
        `La unidad #${u.codigo_interno} está en mantenimiento. Cámbiala a disponible antes de eliminarla.`,
      );
      return;
    }

    const supabase = crearClienteNavegador();
    const { count } = await supabase
      .from("asignaciones")
      .select("*", { count: "exact", head: true })
      .eq("unidad_id", u.id);

    if (count && count > 0) {
      setInfoBloqueoUnidad(
        `La unidad #${u.codigo_interno} tiene ${count} registro${count === 1 ? "" : "s"} en su historial de asignaciones. Abre el historial 🕒 y elimina esos registros antes de borrar la unidad.`,
      );
      return;
    }

    setUnidadPorBorrar(u);
  }

  async function confirmarBorradoUnidad() {
    if (!unidadPorBorrar) return;
    setBorrandoUnidad(true);
    const supabase = crearClienteNavegador();
    const { error } = await supabase
      .from("unidades")
      .delete()
      .eq("id", unidadPorBorrar.id);
    setBorrandoUnidad(false);
    setUnidadPorBorrar(null);
    if (error) return;
    router.refresh();
  }

  if (unidades.length === 0) {
    return (
      <div className="border border-borde rounded p-8 text-center">
        <p className="text-texto-secundario text-sm mb-4">
          Este equipo aún no tiene unidades registradas.
        </p>
        <Link
          href={`/alturas/${productoId}/nueva`}
          className="text-primario hover:underline font-medium text-sm"
        >
          + Agregar primera unidad
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="border border-borde rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-fondo-secundario border-b border-borde">
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                Unidad
              </th>
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                Estado
              </th>
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                Ubicación física
              </th>
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                Asignado a
              </th>
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                Fecha de entrega
              </th>
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                Próxima inspección
              </th>
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {unidades.map((u, index) => {
              const { fecha: fechaProx, diasRestantes } =
                calcularProximaInspeccion(u.fecha_ultima_inspeccion);

              let varianteInsp:
                | "bueno"
                | "advertencia"
                | "critico"
                | "pendiente" = "pendiente";
              let textoInsp = "—";
              if (fechaProx && diasRestantes !== null) {
                textoInsp = fechaProx;
                if (diasRestantes < 0) varianteInsp = "critico";
                else if (diasRestantes <= 30) varianteInsp = "advertencia";
                else varianteInsp = "bueno";
              }

              return (
                <tr
                  key={u.id}
                  className={[
                    "border-b border-borde last:border-0",
                    index % 2 === 0 ? "bg-white" : "bg-fondo-secundario",
                  ].join(" ")}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                      #{u.codigo_interno}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge
                      variante={varianteEstado(u.estado)}
                      texto={
                        ETIQUETAS_ESTADO[u.estado] ?? u.estado.toUpperCase()
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-texto-secundario">
                    {u.ubicacion ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-texto">
                    {u.asignado_a ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-texto-secundario whitespace-nowrap">
                    {formatearFecha(u.fecha_entrega)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => abrirEdicionInspeccion(u)}
                      className="hover:opacity-80"
                      title="Editar fecha de inspección"
                    >
                      <Badge variante={varianteInsp} texto={textoInsp} />
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {u.estado === "asignado" ? (
                        <button
                          type="button"
                          onClick={() => setUnidadActiva(u)}
                          className="px-2.5 py-1 text-xs border border-borde rounded text-texto hover:bg-fondo-secundario font-medium"
                        >
                          ↩ Devolver
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUnidadActiva(u)}
                          className="px-2.5 py-1 text-xs border border-primario rounded text-primario hover:bg-blue-50 font-medium"
                        >
                          + Asignar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setHistorialUnidad(u)}
                        className="p-1 text-texto-secundario hover:text-primario"
                        title="Ver historial de esta unidad"
                        aria-label="Ver historial de esta unidad"
                      >
                        🕒
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void intentarEliminarUnidad(u);
                        }}
                        className="p-1 text-texto-secundario hover:text-alerta"
                        title="Eliminar unidad"
                        aria-label="Eliminar unidad"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        abierto={unidadActiva !== null}
        onCerrar={() => setUnidadActiva(null)}
        titulo={
          unidadActiva
            ? unidadActiva.estado === "asignado"
              ? `Devolver unidad #${unidadActiva.codigo_interno}`
              : `Asignar unidad #${unidadActiva.codigo_interno}`
            : ""
        }
        ancho="grande"
      >
        {unidadActiva && (
          <FormularioAsignacion
            unidadId={unidadActiva.id}
            asignacionActiva={
              unidadActiva.asignacion_id && unidadActiva.estado === "asignado"
                ? ({
                    id: unidadActiva.asignacion_id,
                    unidad_id: unidadActiva.id,
                    entregado_a: unidadActiva.asignado_a,
                    fecha_entrega: unidadActiva.fecha_entrega ?? "",
                    fecha_devolucion: unidadActiva.fecha_devolucion,
                    observaciones: unidadActiva.asignacion_observaciones,
                    observaciones_devolucion:
                      unidadActiva.asignacion_observaciones_devolucion,
                    activa: true,
                    created_at: null,
                  } as TablaAsignacion)
                : null
            }
            onExito={() => setUnidadActiva(null)}
          />
        )}
      </Modal>

      {historialUnidad && (
        <ModalHistorialUnidad
          abierto={historialUnidad !== null}
          onCerrar={() => setHistorialUnidad(null)}
          unidadId={historialUnidad.id}
          codigoInterno={historialUnidad.codigo_interno}
        />
      )}

      <Modal
        abierto={editandoInspeccion !== null}
        onCerrar={() => !guardandoFecha && setEditandoInspeccion(null)}
        titulo={
          editandoInspeccion
            ? `Inspección anual — Unidad #${editandoInspeccion.codigo_interno}`
            : ""
        }
      >
        {editandoInspeccion && (
          <div className="flex flex-col gap-4">
            <Input
              id="fecha_inspeccion_individual"
              label="Fecha de inspección anual"
              type="date"
              value={nuevaFecha}
              onChange={(e) => {
                setNuevaFecha(e.target.value);
                if (errorFecha) setErrorFecha(null);
              }}
              error={errorFecha ?? undefined}
              required
            />
            <p className="text-xs text-texto-secundario">
              La próxima inspección se calcula automáticamente 1 año después.
            </p>
            <div className="flex gap-3 pt-2 border-t border-borde">
              <Boton
                type="button"
                variante="primario"
                onClick={guardarInspeccion}
                cargando={guardandoFecha}
              >
                Guardar
              </Boton>
              <Boton
                type="button"
                variante="secundario"
                onClick={() => setEditandoInspeccion(null)}
                disabled={guardandoFecha}
              >
                Cancelar
              </Boton>
            </div>
            {errorFecha && <MensajeError mensaje={errorFecha} />}
          </div>
        )}
      </Modal>

      <ModalConfirmacion
        abierto={unidadPorBorrar !== null}
        onCerrar={() => !borrandoUnidad && setUnidadPorBorrar(null)}
        onConfirmar={confirmarBorradoUnidad}
        titulo="¿Deseas eliminar esta unidad?"
        mensaje={`Se eliminará la unidad #${unidadPorBorrar?.codigo_interno ?? ""} de forma permanente.`}
        textoConfirmar="Sí, eliminar"
        variante="peligro"
        cargando={borrandoUnidad}
      />

      <ModalConfirmacion
        abierto={infoBloqueoUnidad !== null}
        onCerrar={() => setInfoBloqueoUnidad(null)}
        onConfirmar={() => setInfoBloqueoUnidad(null)}
        titulo="No se puede eliminar"
        mensaje={infoBloqueoUnidad ?? ""}
        textoConfirmar="Entendido"
        variante="info"
      />
    </>
  );
}
