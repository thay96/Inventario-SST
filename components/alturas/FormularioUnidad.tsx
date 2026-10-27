'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Boton from '@/components/ui/Boton'
import MensajeError from '@/components/ui/MensajeError'
import { crearClienteNavegador } from '@/lib/supabase/cliente'

interface FormularioUnidadProps {
  productoId: string
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function FormularioUnidad({ productoId }: FormularioUnidadProps) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null)
  const [errorInspeccion, setErrorInspeccion] = useState<string | null>(null)

  const [codigoInterno, setCodigoInterno] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [inspeccionAnual, setInspeccionAnual] = useState(hoyISO())
  const [observaciones, setObservaciones] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorGeneral(null)
    setErrorCodigo(null)
    setErrorInspeccion(null)

    const codigoLimpio = codigoInterno.trim()
    if (!codigoLimpio) {
      setErrorCodigo('El número interno es obligatorio.')
      return
    }
    if (!inspeccionAnual) {
      setErrorInspeccion('La fecha de inspección anual es obligatoria.')
      return
    }

    setCargando(true)
    const supabase = crearClienteNavegador()

    const { error } = await supabase.from('unidades').insert({
      producto_id: productoId,
      codigo_interno: codigoLimpio,
      estado: 'disponible',
      ubicacion: ubicacion.trim() || null,
      fecha_ultima_inspeccion: inspeccionAnual,
      observaciones: observaciones.trim() || null,
    })

    if (error) {
      setErrorGeneral(`Error al guardar: ${error.message}`)
      setCargando(false)
      return
    }

    router.push(`/alturas/${productoId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 max-w-xl">
      <MensajeError mensaje={errorGeneral} />

      <Input
        id="codigo_interno"
        label="Número interno"
        placeholder="Ej: 1, 2, 3"
        value={codigoInterno}
        onChange={(e) => {
          setCodigoInterno(e.target.value)
          if (errorCodigo) setErrorCodigo(null)
        }}
        error={errorCodigo ?? undefined}
        required
      />

      <Input
        id="ubicacion"
        label="Ubicación física"
        placeholder="Ej: MALACATES, OFICINA SST, ANDAMIOS Y ALLANADORES"
        value={ubicacion}
        onChange={(e) => setUbicacion(e.target.value)}
      />

      <Input
        id="inspeccion_anual"
        label="Fecha de inspección anual"
        type="date"
        value={inspeccionAnual}
        onChange={(e) => {
          setInspeccionAnual(e.target.value)
          if (errorInspeccion) setErrorInspeccion(null)
        }}
        error={errorInspeccion ?? undefined}
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="observaciones" className="text-sm font-medium text-texto">
          Observaciones
        </label>
        <textarea
          id="observaciones"
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ej: SE ENCUENTRAN EN CAJÓN MALACATE / LAVAR"
          className="border border-borde rounded px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario focus:ring-offset-1"
        />
      </div>

      <div className="flex gap-3 pt-2 border-t border-borde">
        <Boton type="submit" variante="primario" cargando={cargando}>
          Agregar unidad
        </Boton>
        <Boton
          type="button"
          variante="secundario"
          onClick={() => router.push(`/alturas/${productoId}`)}
          disabled={cargando}
        >
          Cancelar
        </Boton>
      </div>
    </form>
  )
}