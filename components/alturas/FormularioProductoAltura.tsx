'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import Boton from '@/components/ui/Boton'

interface FormularioProductoAlturaProps {
  codigoSugerido: string
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function FormularioProductoAltura({ codigoSugerido }: FormularioProductoAlturaProps) {
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [cantidad, setCantidad] = useState('0')
  const [fechaInspeccion, setFechaInspeccion] = useState(hoyISO())

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const nUnidades = parseInt(cantidad, 10)

    if (!nombre.trim()) {
      setError('El nombre del equipo es obligatorio.')
      return
    }
    if (!ubicacion.trim()) {
      setError('La ubicación física es obligatoria.')
      return
    }
    if (!fechaInspeccion) {
      setError('La fecha de inspección anual es obligatoria.')
      return
    }
    if (isNaN(nUnidades) || nUnidades < 0 || nUnidades > 200) {
      setError('La cantidad de unidades debe estar entre 0 y 200.')
      return
    }

    setCargando(true)
    const supabase = crearClienteNavegador()

    const { data: producto, error: errProd } = await supabase
      .from('productos')
      .insert({
        codigo: codigoSugerido,
        nombre: nombre.trim(),
        marca: null,
        descripcion: null,
        ubicacion: ubicacion.trim(),
        tipo_control: 'serializado',
        categoria_id: null,
        unidad_medida: 'UNIDAD',
        stock_actual: 0,
        stock_minimo: 0,
        activo: true,
      })
      .select('id')
      .single()

    if (errProd || !producto) {
      setError(errProd?.message ?? 'No se pudo crear el equipo.')
      setCargando(false)
      return
    }

    if (nUnidades > 0) {
      const filas = Array.from({ length: nUnidades }, (_, i) => ({
        producto_id: producto.id,
        codigo_interno: String(i + 1),
        estado: 'disponible' as const,
        ubicacion: ubicacion.trim(),
        fecha_ultima_inspeccion: fechaInspeccion,
      }))
      const { error: errUni } = await supabase.from('unidades').insert(filas)
      if (errUni) {
        setError(errUni.message)
        setCargando(false)
        return
      }
    }

    router.push(`/alturas/${producto.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={manejarEnvio} className="max-w-lg space-y-4" noValidate>
      <div>
        <label className="block text-sm font-medium text-texto mb-1">Código</label>
        <input
          type="text"
          value={codigoSugerido}
          readOnly
          className="w-full border border-borde rounded px-3 py-2 text-sm font-mono bg-fondo-secundario text-texto-secundario cursor-not-allowed"
        />
        <p className="text-xs text-texto-secundario mt-1">Se asigna automáticamente.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-texto mb-1">
          Nombre del equipo <span className="text-alerta">*</span>
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border border-borde rounded px-3 py-2 text-sm"
          placeholder="Ej: Arnés de seguridad, Eslinga de posición"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-texto mb-1">
          Ubicación física <span className="text-alerta">*</span>
        </label>
        <input
          type="text"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          className="w-full border border-borde rounded px-3 py-2 text-sm"
          placeholder="Ej: BODEGA PRINCIPAL, OFICINA SST"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-texto mb-1">
          Fecha de inspección anual <span className="text-alerta">*</span>
        </label>
        <input
          type="date"
          value={fechaInspeccion}
          onChange={(e) => setFechaInspeccion(e.target.value)}
          className="w-full border border-borde rounded px-3 py-2 text-sm"
          required
        />
        <p className="text-xs text-texto-secundario mt-1">
          Aplica a todas las unidades que se creen.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-texto mb-1">
          Cantidad de unidades <span className="text-alerta">*</span>
        </label>
        <input
          type="number"
          min={0}
          max={200}
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-full border border-borde rounded px-3 py-2 text-sm"
          required
        />
        <p className="text-xs text-texto-secundario mt-1">
          Puedes registrarlo con 0 y agregar unidades después.
        </p>
      </div>

      {error && (
        <p className="text-sm text-alerta bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Boton type="submit" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Crear equipo'}
        </Boton>
        <Boton
          type="button"
          variante="secundario"
          onClick={() => router.push('/alturas')}
          disabled={cargando}
        >
          Cancelar
        </Boton>
      </div>
    </form>
  )
}