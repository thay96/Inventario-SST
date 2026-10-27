"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Boton from "@/components/ui/Boton";
import MensajeError from "@/components/ui/MensajeError";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { TablaAsignacion } from "@/types/supabase";

interface FormularioAsignacionProps {
  unidadId: string;
  asignacionActiva: TablaAsignacion | null;
  onExito?: () => void;
}

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO");
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FormularioAsignacion({
  unidadId,
  asignacionActiva,
  onExito,
}: FormularioAsignacionProps) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [errorEntregado, setErrorEntregado] = useState<string | null>(null);
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  const [errorCedula, setErrorCedula] = useState<string | null>(null);

  const [entregadoA, setEntregadoA] = useState("");
  const [cedula, setCedula] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState(hoyISO());
  const [observaciones, setObservaciones] = useState("");

  const [fechaDevolucionReal, setFechaDevolucionReal] = useState(hoyISO());
  const [obsDevolucion, setObsDevolucion] = useState("");

  async function handleAsignar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorGeneral(null);
    setErrorEntregado(null);
    setErrorFecha(null);
    setErrorCedula(null);

    const nombreLimpio = entregadoA.trim();
    if (!nombreLimpio) {
      setErrorEntregado("El nombre a quien se entrega es obligatorio.");
      return;
    }
    if (!cedula.trim()) {
      setErrorCedula("La cédula es obligatoria.");
      return;
    }
    if (!fechaEntrega) {
      setErrorFecha("La fecha de entrega es obligatoria.");
      return;
    }

    setCargando(true);
    const supabase = crearClienteNavegador();

    const { error: errAsignacion } = await supabase
      .from("asignaciones")
      .insert({
        unidad_id: unidadId,
        entregado_a: nombreLimpio,
        cedula: cedula.trim(),
        fecha_entrega: fechaEntrega,
        fecha_devolucion: null,
        observaciones: observaciones.trim() || null,
        observaciones_devolucion: null,
        activa: true,
      });

    if (errAsignacion) {
      setErrorGeneral(`Error al asignar: ${errAsignacion.message}`);
      setCargando(false);
      return;
    }

    const { error: errUnidad } = await supabase
      .from("unidades")
      .update({ estado: "asignado" })
      .eq("id", unidadId);

    if (errUnidad) {
      setErrorGeneral(`Error al actualizar unidad: ${errUnidad.message}`);
      setCargando(false);
      return;
    }

    setCargando(false);
    router.refresh();
    onExito?.();
  }

  async function handleDevolver() {
    if (!asignacionActiva) return;
    setErrorGeneral(null);
    setCargando(true);
    const supabase = crearClienteNavegador();

    const { error: errAsignacion } = await supabase
      .from("asignaciones")
      .update({
        activa: false,
        fecha_devolucion: fechaDevolucionReal,
        observaciones_devolucion: obsDevolucion.trim() || null,
      })
      .eq("id", asignacionActiva.id);

    if (errAsignacion) {
      setErrorGeneral(`Error al devolver: ${errAsignacion.message}`);
      setCargando(false);
      return;
    }

    const { error: errUnidad } = await supabase
      .from("unidades")
      .update({ estado: "disponible" })
      .eq("id", unidadId);

    if (errUnidad) {
      setErrorGeneral(`Error al actualizar unidad: ${errUnidad.message}`);
      setCargando(false);
      return;
    }

    setCargando(false);
    router.refresh();
    onExito?.();
  }

  if (asignacionActiva) {
    return (
      <div className="flex flex-col gap-5">
        <MensajeError mensaje={errorGeneral} />

        <dl className="grid grid-cols-[180px_1fr] gap-y-2 text-sm">
          <dt className="text-texto-secundario">Asignado a:</dt>
          <dd className="text-texto font-medium">
            {asignacionActiva.entregado_a ?? "—"}
          </dd>
          <dt className="text-texto-secundario">Cédula:</dt>
          <dd className="text-texto">{asignacionActiva.cedula ?? "—"}</dd>
          <dt className="text-texto-secundario">Fecha de entrega:</dt>
          <dd className="text-texto">
            {formatearFecha(asignacionActiva.fecha_entrega)}
          </dd>
          <dt className="text-texto-secundario">Observación de asignación:</dt>
          <dd className="text-texto">
            {asignacionActiva.observaciones ?? "—"}
          </dd>
        </dl>

        <Input
          id="fecha_devolucion_real"
          label="Fecha real de devolución"
          type="date"
          value={fechaDevolucionReal}
          onChange={(e) => setFechaDevolucionReal(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1">
          <label
            htmlFor="obs_devolucion"
            className="text-sm font-medium text-texto"
          >
            Observaciones de devolución
          </label>
          <textarea
            id="obs_devolucion"
            rows={3}
            value={obsDevolucion}
            onChange={(e) => setObsDevolucion(e.target.value)}
            placeholder="Ej: Buen estado, desgaste leve, requiere revisión…"
            className="border border-borde rounded px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario focus:ring-offset-1"
          />
        </div>

        <div className="flex gap-3 pt-2 border-t border-borde">
          <Boton
            type="button"
            variante="primario"
            onClick={handleDevolver}
            cargando={cargando}
          >
            Registrar devolución
          </Boton>
          <Boton
            type="button"
            variante="secundario"
            onClick={() => onExito?.()}
            disabled={cargando}
          >
            Cancelar
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleAsignar} noValidate className="flex flex-col gap-5">
      <MensajeError mensaje={errorGeneral} />

      <Input
        id="entregado_a"
        label="Nombre a quien se le entrega"
        placeholder="Ej: James Hoyos"
        value={entregadoA}
        onChange={(e) => {
          setEntregadoA(e.target.value);
          if (errorEntregado) setErrorEntregado(null);
        }}
        error={errorEntregado ?? undefined}
        required
      />
      <Input
        id="cedula"
        label="Cédula"
        placeholder="Ej: 1023456789"
        value={cedula}
        onChange={(e) => {
          setCedula(e.target.value);
          if (errorCedula) setErrorCedula(null);
        }}
        error={errorCedula ?? undefined}
        required
      />

      <div className="flex flex-col gap-1">
        <label
          htmlFor="observaciones"
          className="text-sm font-medium text-texto"
        >
          Observaciones (opcional)
        </label>
        <textarea
          id="observaciones"
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="border border-borde rounded px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario focus:ring-offset-1"
        />
      </div>

      <div className="flex gap-3 pt-2 border-t border-borde">
        <Boton type="submit" variante="primario" cargando={cargando}>
          Asignar unidad
        </Boton>
        <Boton
          type="button"
          variante="secundario"
          onClick={() => onExito?.()}
          disabled={cargando}
        >
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
